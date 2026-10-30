"""Génère la voix off française, segment par segment, puis le manifeste de timing.

Fournisseurs (aucune clé n'est écrite dans le code) :
- elevenlabs : voix premium. Variables ELEVENLABS_API_KEY et ELEVENLABS_VOICE_ID
  (voix masculine française native choisie dans la bibliothèque ElevenLabs).
- azure : Azure AI Speech, voix neuronale fr-FR-RemyMultilingualNeural, sous licence
  commerciale. Variables AZURE_SPEECH_KEY et AZURE_SPEECH_REGION.
- edge : la même voix Microsoft via le service de lecture à voix haute d'Edge
  (bibliothèque edge-tts, sans clé) : version de travail, horodatage mot à mot fourni.
- piper : synthèse locale open source (voix fr_FR-mls-medium, CC BY 4.0).

Sélection : NARRATION_PROVIDER=elevenlabs|azure|edge|piper, sinon le premier
fournisseur disponible dans cet ordre.

Chaque segment est vérifié par reconnaissance vocale (Whisper) : on garde la prise
la plus fidèle au texte, recadrée au premier et au dernier mot, pauses resserrées
(rythme publicitaire). Puis : loudness -15 LUFS (plafond -1,5 dBTP) → MP3 dans
public/audio/narration/ → src/narration/narration.generated.json (durées + horodatage).

Usage : .venv/bin/python scripts/narration/generate.py [--speaker 10065] [--out DIR] [--no-manifest]
"""
from __future__ import annotations

import argparse
import difflib
import json
import os
import re
import sys
import unicodedata
import urllib.request
import warnings
from pathlib import Path
from xml.sax.saxutils import escape
from typing import Callable

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'audio'))
import dsp  # noqa: E402

ROOT = dsp.ROOT
SCRIPT = ROOT / 'src' / 'narration' / 'narration.json'
CONFIG = Path(__file__).with_name('voice.config.json')
MANIFEST = ROOT / 'src' / 'narration' / 'narration.generated.json'
CACHE = ROOT / '.cache'

Marks = list[tuple[str, float, float]]
# Un moteur renvoie l'audio, sa fréquence et, s'il le fournit, l'horodatage de chaque mot.
Synth = Callable[[dict, float], tuple[np.ndarray, int, Marks | None]]


def speech_text(text: str) -> str:
    """Texte envoyé au moteur : sans marqueurs de sous-titres, apostrophes droites.

    La ponctuation haute (« ? », « ! », « : ») est collée au mot : chaque mot porte ainsi
    sa ponctuation, ce qui sert au resserrement des pauses (même découpage côté sous-titres).
    """
    text = re.sub(r'\s+', ' ', text.replace('|', ' ').replace('*', '').replace('’', "'")).strip()
    return re.sub(r'\s+([?!:;])', r'\1', text)


def norm_word(w: str) -> str:
    w = unicodedata.normalize('NFD', w.lower().replace('’', "'"))
    return re.sub(r'[^a-z0-9]', '', ''.join(c for c in w if unicodedata.category(c) != 'Mn'))


# --- Reconnaissance vocale (vérification + horodatage) ------------------------

class Listener:
    def __init__(self) -> None:
        warnings.filterwarnings('ignore')
        from transformers import pipeline
        from transformers.utils import logging as hf_logging

        hf_logging.set_verbosity_error()
        self.asr = pipeline('automatic-speech-recognition', model='openai/whisper-small', device='cpu')

    @staticmethod
    def _input(x: np.ndarray, ref: list[str]) -> tuple[dict, dict]:
        x16 = {'raw': dsp.resample(x, dsp.SR, 16000).astype(np.float32), 'sampling_rate': 16000}
        return x16, {'language': 'french', 'task': 'transcribe', 'max_new_tokens': 4 * len(ref) + 12}

    def transcribe(self, x: np.ndarray, ref: list[str]) -> str:
        x16, kwargs = self._input(x, ref)
        return self.asr(dict(x16), generate_kwargs=kwargs)['text'].strip()

    def hear(self, x: np.ndarray, ref: list[str]) -> tuple[str, Marks]:
        """Transcription simple d'abord ; horodatage mot à mot seulement si la prise est fidèle.

        Sur une prise ratée, Whisper hallucine et son horodatage mot à mot fait exploser
        la mémoire : on ne le calcule donc que pour les prises déjà validées.
        """
        transcript = self.transcribe(x, ref)
        if word_error(ref, transcript) > 0.25:
            return transcript, []
        x16, kwargs = self._input(x, ref)
        out = self.asr(dict(x16), return_timestamps='word', generate_kwargs=kwargs)
        words = []
        for c in out['chunks']:
            start, end = c['timestamp']
            if c['text'].strip():
                words.append((c['text'].strip(), float(start), float(end if end is not None else start + 0.3)))
        return out['text'].strip(), words


def word_error(ref: list[str], transcript: str) -> float:
    a, b = [norm_word(w) for w in ref], [norm_word(w) for w in transcript.split()]
    return round(1 - difflib.SequenceMatcher(None, a, b, autojunk=False).ratio(), 3)


def align(ref: list[str], heard: Marks, duration: float) -> tuple[list[tuple[float, float]], int]:
    """Associe chaque mot du texte à un horodatage ; renvoie aussi le nombre de mots reconnus."""
    times: list[tuple[float, float] | None] = [None] * len(ref)
    sm = difflib.SequenceMatcher(None, [norm_word(w) for w in ref], [norm_word(h[0]) for h in heard], autojunk=False)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == 'equal' or (tag == 'replace' and i2 - i1 == j2 - j1):
            for k in range(i2 - i1):
                times[i1 + k] = (heard[j1 + k][1], heard[j1 + k][2])
    matched = sum(t is not None for t in times)
    # Mots non reconnus : interpolation au prorata du nombre de lettres.
    anchors = [-1] + [i for i, t in enumerate(times) if t] + [len(ref)]
    for a, b in zip(anchors, anchors[1:]):
        if b - a <= 1:
            continue
        t0 = times[a][1] if a >= 0 else 0.0
        t1 = times[b][0] if b < len(ref) else duration
        lens = [max(1, len(norm_word(ref[i]))) for i in range(a + 1, b)]
        acc = t0
        for i, length in zip(range(a + 1, b), lens):
            d = (t1 - t0) * length / sum(lens)
            times[i] = (acc, acc + d)
            acc += d
    return [t for t in times if t is not None], matched


def tighten_pauses(y: np.ndarray, times: list[tuple[float, float]], ref: list[str], caps: dict) -> tuple[np.ndarray, list[tuple[float, float]]]:
    """Raccourcit les silences trop longs entre deux mots (rythme publicitaire).

    La coupe se fait au milieu du silence, avec un fondu de 8 ms : le débit des syllabes
    n'est pas modifié, seules les respirations superflues disparaissent.
    """
    cuts = []
    for i in range(len(times) - 1):
        cap = caps['sentence'] if ref[i][-1] in '.?!:;' else caps['comma'] if ref[i][-1] == ',' else None
        gap = times[i + 1][0] - times[i][1]
        if cap is not None and gap > cap:
            mid, remove = times[i][1] + gap / 2, gap - cap
            cuts.append((mid - remove / 2, mid + remove / 2))
    if not cuts:
        return y, times
    xf = int(0.008 * dsp.SR)
    ramp = np.sin(np.linspace(0, np.pi / 2, xf)) ** 2
    pieces, cursor = [], 0
    for a, b in cuts:
        pieces.append(y[cursor:int(a * dsp.SR) + xf])
        cursor = int(b * dsp.SR)
    pieces.append(y[cursor:])
    out = pieces[0]
    for piece in pieces[1:]:
        # Fondu enchaîné : la fin du morceau précédent glisse sous le début du suivant.
        head = piece[:xf]
        out = np.concatenate([out[:-xf], out[-xf:] * ramp[::-1] + head * ramp[:len(head)], piece[xf:]])

    def shift(t: float) -> float:
        return t - sum(min(b, max(a, t)) - a for a, b in cuts)

    return out, [(shift(s), shift(e)) for s, e in times]


# --- Fournisseurs ---------------------------------------------------------------

def piper_synth(cfg: dict, speaker: str | None) -> Synth:
    from piper import PiperVoice, SynthesisConfig

    model = CACHE / 'voices' / f"{cfg['model']}.onnx"
    if not model.exists():
        base = 'https://huggingface.co/rhasspy/piper-voices/resolve/main/' + cfg['modelPath']
        model.parent.mkdir(parents=True, exist_ok=True)
        for ext in ('onnx', 'onnx.json'):
            print(f'téléchargement {base}.{ext}')
            urllib.request.urlretrieve(f'{base}.{ext}', f'{model.with_suffix("")}.{ext}')
    voice = PiperVoice.load(str(model))
    speaker_id = voice.config.speaker_id_map.get(speaker or cfg['speaker'])

    def synth(seg: dict, length_scale: float) -> tuple[np.ndarray, int, Marks | None]:
        syn = SynthesisConfig(speaker_id=speaker_id, length_scale=length_scale,
                              noise_scale=cfg['noiseScale'], noise_w_scale=cfg['noiseWScale'])
        audio = np.concatenate([c.audio_int16_array for c in voice.synthesize(speech_text(seg['text']), syn)])
        return audio.astype(np.float64) / 32768, voice.config.sample_rate, None

    return synth


def elevenlabs_synth(cfg: dict) -> Synth:
    key = os.environ['ELEVENLABS_API_KEY']
    voice_id = os.environ.get('ELEVENLABS_VOICE_ID')
    if not voice_id:
        raise SystemExit('ELEVENLABS_VOICE_ID manquant : choisir une voix masculine française native.')
    tmp = CACHE / 'narration' / 'elevenlabs'
    tmp.mkdir(parents=True, exist_ok=True)

    def synth(seg: dict, _length_scale: float) -> tuple[np.ndarray, int, Marks | None]:
        body = {'text': speech_text(seg['text']), 'model_id': cfg['modelId'], 'voice_settings': cfg['voiceSettings']}
        req = urllib.request.Request(
            f'https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_192',
            data=json.dumps(body).encode(),
            headers={'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'},
        )
        mp3 = tmp / f"{seg['id']}.mp3"
        with urllib.request.urlopen(req, timeout=120) as res:
            mp3.write_bytes(res.read())
        return dsp.decode(mp3).mean(axis=1), dsp.SR, None

    return synth


def azure_synth(cfg: dict) -> Synth:
    key, region = os.environ['AZURE_SPEECH_KEY'], os.environ.get('AZURE_SPEECH_REGION')
    if not region:
        raise SystemExit('AZURE_SPEECH_REGION manquant (ex. westeurope).')
    tmp = CACHE / 'narration' / 'azure'
    tmp.mkdir(parents=True, exist_ok=True)

    def synth(seg: dict, _length_scale: float) -> tuple[np.ndarray, int, Marks | None]:
        ssml = (f"<speak version='1.0' xml:lang='fr-FR'><voice name='{cfg['voice']}'>"
                f"<prosody rate='{cfg['rate']}'>{escape(speech_text(seg['text']))}</prosody></voice></speak>")
        req = urllib.request.Request(
            f'https://{region}.tts.speech.microsoft.com/cognitiveservices/v1',
            data=ssml.encode(),
            headers={'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml',
                     'X-Microsoft-OutputFormat': 'riff-48khz-16bit-mono-pcm', 'User-Agent': 'androna-motion'},
        )
        wav = tmp / f"{seg['id']}.wav"
        with urllib.request.urlopen(req, timeout=120) as res:
            wav.write_bytes(res.read())
        x, sr = dsp.read_wav(wav)
        return x, sr, None

    return synth


def edge_synth(cfg: dict) -> Synth:
    import asyncio

    import edge_tts

    tmp = CACHE / 'narration' / 'edge'
    tmp.mkdir(parents=True, exist_ok=True)

    async def stream(text: str) -> tuple[bytes, Marks]:
        com = edge_tts.Communicate(text, cfg['voice'], rate=cfg['rate'], pitch=cfg['pitch'], boundary='WordBoundary')
        audio, marks = bytearray(), []
        async for chunk in com.stream():
            if chunk['type'] == 'audio':
                audio.extend(chunk['data'])
            elif chunk['type'] == 'WordBoundary':
                # Décalages en unités de 100 ns.
                marks.append((chunk['text'], chunk['offset'] / 1e7, (chunk['offset'] + chunk['duration']) / 1e7))
        return bytes(audio), marks

    def synth(seg: dict, _length_scale: float) -> tuple[np.ndarray, int, Marks | None]:
        data, marks = asyncio.run(stream(speech_text(seg['text'])))
        mp3 = tmp / f"{seg['id']}.mp3"
        mp3.write_bytes(data)
        return dsp.decode(mp3).mean(axis=1), dsp.SR, marks

    return synth


# --- Génération vérifiée --------------------------------------------------------

def best_take(seg: dict, synth: Synth, listener: Listener, attempts: int, target_wpm: float, length_scale: float,
              pauses: dict) -> dict:
    """Plusieurs prises si nécessaire : fidélité au texte, durée plausible, débit proche de la cible."""
    ref = speech_text(seg['text']).split(' ')
    best = None
    scale = length_scale
    for attempt in range(attempts):
        x, sr, marks = synth(seg, scale)
        y = dsp.highpass(dsp.resample(x, sr), 75)
        if marks:
            # Horodatage fourni par le moteur : Whisper ne sert qu'à vérifier la prise.
            times, matched = align(ref, marks, len(y) / dsp.SR)
        else:
            y = dsp.trim_silence(y)
            expected = len(ref) / (target_wpm / 60) + 0.4
            # Prise « babillée » (durée aberrante) : rejetée sans transcription.
            if len(y) / dsp.SR > 2.6 * expected:
                print(f"   {seg['id']} prise {attempt + 1} rejetée ({len(y) / dsp.SR:.1f} s pour {len(ref)} mots)", flush=True)
                continue
            _, heard = listener.hear(y, ref)
            if not heard:
                print(f"   {seg['id']} prise {attempt + 1} rejetée", flush=True)
                continue
            times, matched = align(ref, heard, len(y) / dsp.SR)
        # Recadrage au mot près : supprime tout résidu avant le premier / après le dernier mot.
        if matched >= len(ref) - 1:
            start = max(0.0, times[0][0] - 0.08)
            end = min(len(y) / dsp.SR, times[-1][1] + 0.22)
            y = y[int(start * dsp.SR):int(end * dsp.SR)]
            times = [(s - start, e - start) for s, e in times]
        y, times = tighten_pauses(y, times, ref, pauses)
        transcript = listener.transcribe(y, ref)
        wer = word_error(ref, transcript)
        speech = max(0.3, times[-1][1] - times[0][0])
        wpm = len(ref) / speech * 60
        # Les segments très courts (noms de domaines) ont un débit peu significatif.
        weight = 0.8 if len(ref) >= 6 else 0.3
        score = wer + weight * abs(wpm - target_wpm) / target_wpm
        take = {'audio': y, 'times': times, 'transcript': transcript, 'wer': wer, 'score': score,
                'attempt': attempt + 1, 'wpm': wpm, 'lengthScale': scale}
        if best is None or score < best['score']:
            best = take
        if wer <= 0.06 and abs(wpm - target_wpm) <= 10:
            break
        # Segments courts : le débit est peu significatif, on vérifie la fidélité et la durée.
        if len(ref) < 6 and wer <= 0.06 and len(y) / dsp.SR <= 1.8 * expected:
            break
        # Prise suivante : vitesse corrigée d'après le débit mesuré (bornée pour rester naturelle).
        if len(ref) >= 6:
            scale = float(np.clip(scale * wpm / target_wpm, 0.8, 1.35))
    if best is None:
        raise SystemExit(f"Aucune prise exploitable pour « {seg['id']} » : relancer la génération.")
    return best


def default_provider() -> str:
    if os.environ.get('ELEVENLABS_API_KEY'):
        return 'elevenlabs'
    if os.environ.get('AZURE_SPEECH_KEY'):
        return 'azure'
    try:
        import edge_tts  # noqa: F401
        return 'edge'
    except ImportError:
        return 'piper'


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--speaker')
    ap.add_argument('--out', type=Path, default=ROOT / 'public' / 'audio' / 'narration')
    ap.add_argument('--no-manifest', action='store_true')
    ap.add_argument('--only', help='identifiants à régénérer, séparés par des virgules (le reste du manifeste est conservé)')
    args = ap.parse_args()

    script = json.loads(SCRIPT.read_text())
    cfg = json.loads(CONFIG.read_text())
    provider = os.environ.get('NARRATION_PROVIDER') or default_provider()
    print(f'fournisseur de voix : {provider}')
    synth = {
        'elevenlabs': lambda: elevenlabs_synth(cfg['elevenlabs']),
        'azure': lambda: azure_synth(cfg['azure']),
        'edge': lambda: edge_synth(cfg['edge']),
        'piper': lambda: piper_synth(cfg['piper'], args.speaker),
    }[provider]()
    attempts = {'elevenlabs': 1, 'azure': 1, 'edge': cfg['edge']['attempts']}.get(provider, cfg['piper']['attempts'])
    listener = Listener()

    wav_dir = CACHE / 'narration' / 'wav'
    report = []
    groups: list[list[dict]] = []
    for seg in script['segments']:
        if groups and seg.get('take') and groups[-1][0].get('take') == seg.get('take'):
            groups[-1].append(seg)
        else:
            groups.append([seg])

    only = set(args.only.split(',')) if args.only else None
    if only:
        groups = [g for g in groups if any(seg['id'] in only for seg in g)]

    for group in groups:
        prefix = speech_text(group[0].get('ttsPrefix', ''))
        joint = {'id': group[0].get('take') or group[0]['id'],
                 'text': ' '.join(([prefix] if prefix else []) + [speech_text(g['text']) for g in group])}
        take = best_take(joint, synth, listener, attempts, cfg['targetWordsPerMinute'], cfg['piper']['lengthScale'], cfg['pauses'])
        audio, times = take['audio'], take['times']
        # Mots de la phrase porteuse : prononcés pour l'intonation, puis coupés du clip.
        index = len(prefix.split(' ')) if prefix else 0
        for k, seg in enumerate(group):
            ref = speech_text(seg['text']).split(' ')
            seg_times = times[index:index + len(ref)]
            nxt = times[index + len(ref)] if index + len(ref) < len(times) else None
            prev_end = times[index - 1][1] if index > 0 else None
            index += len(ref)
            # Découpe au milieu des pauses entre deux segments d'une même prise.
            start = (prev_end + seg_times[0][0]) / 2 if prev_end is not None else max(0.0, seg_times[0][0] - 0.08)
            end = (seg_times[-1][1] + nxt[0]) / 2 if nxt else min(len(audio) / dsp.SR, seg_times[-1][1] + 0.22)
            clip = audio[int(start * dsp.SR):int(end * dsp.SR)]
            y = dsp.fade(dsp.master_voice(clip, cfg['mastering']['loudnessLufs'], cfg['mastering']['ceilingDbtp']), 0.01, 0.03)
            wav = wav_dir / f"{seg['id']}.wav"
            dsp.write_wav(wav, y)
            dsp.encode_mp3(wav, args.out / f"{seg['id']}.mp3")
            duration = len(y) / dsp.SR
            speech = seg_times[-1][1] - seg_times[0][0]
            report.append({
                'id': seg['id'],
                'file': f"audio/narration/{seg['id']}.mp3",
                'duration': round(duration, 3),
                'words': [{'text': w, 'start': round(max(0.0, s0 - start), 3), 'end': round(min(e0 - start, duration), 3)}
                          for w, (s0, e0) in zip(ref, seg_times)],
                'wordErrorRate': take['wer'],
                'transcript': take['transcript'] if len(group) == 1 else f"(prise commune « {joint['id']} ») {take['transcript']}",
                'wordsPerMinute': round(len(ref) / speech * 60) if speech > 0 else None,
            })
            print(f"{seg['id']:11s} {duration:5.2f}s  {report[-1]['wordsPerMinute']} mots/min  WER {take['wer']:.2f}"
                  f"  prise {take['attempt']} (vitesse {take['lengthScale']:.2f})  « {take['transcript'] if k == 0 else '…'} »", flush=True)

    words = sum(len(r['words']) for r in report)
    speech = max(0.1, sum(r['words'][-1]['end'] - r['words'][0]['start'] for r in report))
    print(f'débit moyen : {round(words / speech * 60)} mots/min — durée parlée totale {speech:.1f} s')

    if args.no_manifest:
        return
    voice = {
        'elevenlabs': f"ElevenLabs {cfg['elevenlabs']['modelId']}",
        'azure': f"Azure AI Speech {cfg['azure']['voice']} ({cfg['azure']['rate']})",
        'edge': f"Microsoft {cfg['edge']['voice']} via edge-tts ({cfg['edge']['rate']})",
    }.get(provider, f"Piper {cfg['piper']['model']} (locuteur {args.speaker or cfg['piper']['speaker']})")
    if only and MANIFEST.exists():
        previous = {seg['id']: seg for seg in json.loads(MANIFEST.read_text())['segments']}
        fresh = {r['id']: r for r in report}
        report = [fresh.get(seg['id']) or previous[seg['id']] for seg in script['segments']]
    manifest = {
        'provider': provider,
        'voice': voice,
        'license': cfg[provider]['license'],
        'segments': [{k: r[k] for k in ('id', 'file', 'duration', 'words', 'wordErrorRate', 'transcript')} for r in report],
    }
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent='\t') + '\n')
    print(f'manifeste écrit : {MANIFEST.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
