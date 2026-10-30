"""Musique et effets sonores originaux, synthétisés pour la vidéo (aucun droit tiers).

La musique est composée sur la timeline réelle (.cache/timeline.json, produit par
scripts/audio/export-timeline.mjs), dans un style publicitaire entraînant :
accroche aérienne (arpège + charleston) → entrée de la rythmique sur « l'Université
d'Androna » → groove complet sur les domaines → montée vers la révélation → accord
final sur la carte de fin. Pad et basse « respirent » sur chaque grosse caisse (sidechain).

Ré majeur, 120 BPM, progression I–V–vi–IV. Sortie : public/audio/music/ et public/audio/sfx/.
Usage : .venv/bin/python scripts/audio/compose.py
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from scipy.signal import fftconvolve

import dsp

SR = dsp.SR
ROOT = dsp.ROOT
RNG = np.random.default_rng(20261030)  # graine fixe : rendu reproductible
BPM = 120
BEAT = 60 / BPM
BAR = 4 * BEAT

# Accords (MIDI) : voicing du pad, notes d'arpège, basse.
CHORDS = {
    'D': {'pad': [50, 57, 62, 64, 66, 69], 'arp': [62, 66, 69, 74, 69, 66, 64, 66], 'bass': 38},
    'A': {'pad': [45, 57, 61, 64, 69, 71], 'arp': [61, 64, 69, 73, 69, 64, 66, 64], 'bass': 33},
    'Bm': {'pad': [47, 59, 62, 66, 69, 71], 'arp': [62, 66, 71, 74, 71, 66, 69, 66], 'bass': 35},
    'G': {'pad': [43, 55, 59, 62, 66, 69], 'arp': [59, 62, 67, 71, 67, 62, 64, 62], 'bass': 31},
}
PROGRESSION = ['D', 'A', 'Bm', 'G']


def hz(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


def t_axis(seconds: float) -> np.ndarray:
    return np.arange(int(seconds * SR)) / SR


def adsr(n: int, attack: float, release: float) -> np.ndarray:
    env = np.ones(n)
    a, r = min(n, int(attack * SR)), min(n, int(release * SR))
    if a:
        env[:a] = np.sin(np.linspace(0, np.pi / 2, a)) ** 2
    if r:
        env[-r:] *= np.cos(np.linspace(0, np.pi / 2, r)) ** 2
    return env


def place(track: np.ndarray, sound: np.ndarray, at: float, gain: float = 1.0) -> None:
    i = int(at * SR)
    if i >= len(track):
        return
    j = min(len(track), i + len(sound))
    track[i:j] += sound[: j - i] * gain


def stereo(x: np.ndarray, pan: float = 0.0) -> np.ndarray:
    left, right = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    return np.stack([x * left, x * right], axis=1) * np.sqrt(2)


def reverb_ir(seconds: float = 2.4, damping: float = 3.2) -> np.ndarray:
    t = t_axis(seconds)
    ir = RNG.standard_normal((len(t), 2)) * np.exp(-damping * t)[:, None]
    ir = dsp.lowpass(ir, 5000)
    return ir / np.sqrt(np.sum(ir ** 2))


IR = reverb_ir()


def with_reverb(x: np.ndarray, wet: float) -> np.ndarray:
    tail = np.stack([fftconvolve(x[:, c], IR[:, c])[: len(x)] for c in range(2)], axis=1)
    return x * (1 - wet) + tail * wet


# --- Instruments -------------------------------------------------------------

def pad_chord(notes: list[int], seconds: float, brightness: float = 1.0) -> np.ndarray:
    t = t_axis(seconds)
    out = np.zeros((len(t), 2))
    for k, note in enumerate(notes):
        for d, pan in ((-0.07, -0.6), (0.0, 0.0), (0.07, 0.6)):
            f = hz(note + d)
            voice = sum(np.sin(2 * np.pi * f * h * t + RNG.uniform(0, 6.28)) / h ** 1.6 for h in range(1, 7))
            out += stereo(voice, pan) * (0.55 if k == 0 else 0.35)
    out = dsp.lowpass(out, 900 + 1400 * brightness)
    return out * adsr(len(t), 0.8, 1.0)[:, None]


def pluck(midi: int, seconds: float = 0.9, tone: float = 1.0) -> np.ndarray:
    t = t_axis(seconds)
    f = hz(midi)
    env = np.exp(-t / (0.32 * tone)) * adsr(len(t), 0.004, 0.08)
    x = (np.sin(2 * np.pi * f * t) + 0.32 * np.sin(4 * np.pi * f * t) + 0.08 * np.sin(6 * np.pi * f * t)) * env
    return dsp.lowpass(x, 4200)


def bell(midi: int, seconds: float = 2.6) -> np.ndarray:
    t = t_axis(seconds)
    f = hz(midi)
    partials = [(1.0, 1.0, 1.6), (2.0, 0.45, 1.0), (2.76, 0.3, 0.7), (4.07, 0.16, 0.45), (5.4, 0.08, 0.3)]
    x = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / dec) for r, a, dec in partials)
    return x * adsr(len(t), 0.003, 0.4)


def bass_note(midi: int, seconds: float) -> np.ndarray:
    t = t_axis(seconds)
    f = hz(midi)
    x = np.sin(2 * np.pi * f * t) + 0.18 * np.sin(4 * np.pi * f * t)
    x = np.tanh(1.4 * x) * np.exp(-t / 0.9) * adsr(len(t), 0.01, 0.12)
    return dsp.lowpass(x, 320)


def kick() -> np.ndarray:
    t = t_axis(0.42)
    f = 48 + 70 * np.exp(-t / 0.045)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
    click = dsp.highpass(RNG.standard_normal(len(t)) * np.exp(-t / 0.004), 2000) * 0.15
    return (x + click) * adsr(len(t), 0.001, 0.05)


def shaker() -> np.ndarray:
    t = t_axis(0.12)
    return dsp.bandpass(RNG.standard_normal(len(t)), 5500, 12000) * np.exp(-t / 0.028)


def clap() -> np.ndarray:
    """Trois micro-impulsions de bruit rapprochées puis une queue courte."""
    t = t_axis(0.35)
    env = np.zeros(len(t))
    for k, at in enumerate((0.0, 0.011, 0.022)):
        i = int(at * SR)
        env[i:] += np.exp(-(t[: len(t) - i]) / (0.006 if k < 2 else 0.09))
    return dsp.bandpass(RNG.standard_normal(len(t)), 900, 5200) * env * 0.6


def hat(open_: bool = False) -> np.ndarray:
    t = t_axis(0.4 if open_ else 0.08)
    return dsp.highpass(RNG.standard_normal(len(t)), 7000) * np.exp(-t / (0.11 if open_ else 0.018))


def crash() -> np.ndarray:
    t = t_axis(2.2)
    noise = dsp.highpass(RNG.standard_normal((len(t), 2)), 3500)
    return noise * np.exp(-t / 0.6)[:, None] * adsr(len(t), 0.002, 0.4)[:, None] * 0.5


# --- Musique -------------------------------------------------------------------

def compose_music(tl: dict) -> np.ndarray:
    fps = tl['fps']
    sec = {k: v / fps for k, v in tl['sections'].items()}
    total = tl['total'] / fps
    n = int(total * SR)
    stems = {name: np.zeros((n, 2)) for name in ('pad', 'arp', 'bass', 'kick', 'perc', 'bells', 'fx')}
    order = ['hook', 'gateway', 'domains', 'futures', 'together', 'final', 'outro']

    def section(at: float) -> str:
        idx = sum(at >= sec[k] - BEAT / 2 for k in order[1:])
        return order[idx]

    # Orchestration par section (0 → 1). La rythmique entre sur « l'Université d'Androna ».
    table = {
        #          hook  gate  dom   fut   tog   final outro
        'pad':    [0.7,  0.85, 0.75, 0.85, 0.85, 1.0,  0.0],
        'arp':    [0.8,  0.8,  0.9,  0.8,  0.7,  1.0,  0.0],
        'bass':   [0.0,  0.9,  1.0,  0.9,  0.85, 1.0,  0.0],
        'kick':   [0.0,  1.0,  1.0,  0.85, 0.7,  1.0,  0.0],
        'clap':   [0.0,  0.7,  0.9,  0.8,  0.8,  1.0,  0.0],
        'hat':    [0.5,  0.8,  1.0,  0.9,  0.8,  1.0,  0.0],
    }

    def level(name: str, at: float) -> float:
        return table[name][order.index(section(at))]

    kicks: list[float] = []
    bars = int(np.ceil(sec['outro'] / BAR)) + 1
    for b in range(bars):
        start = b * BAR
        if start >= sec['outro'] - 0.05:
            break
        chord = CHORDS[PROGRESSION[b % 4]]
        bright = 0.35 if start < sec['gateway'] else 0.8 if start < sec['final'] else 1.0
        place(stems['pad'], pad_chord(chord['pad'], min(BAR + 0.8, sec['outro'] - start + 0.4), bright), start, level('pad', start))
        for k in range(8):
            at = start + k * BEAT / 2
            if at >= sec['outro'] - 0.05:
                break
            # Arpège en croches, octave supérieure pour la révélation.
            g = level('arp', at)
            octave = 12 if section(at) in ('futures', 'final') else 0
            place(stems['arp'], stereo(pluck(chord['arp'][k] + octave, 0.5), -0.35 if k % 2 else 0.35), at, g * (1.0 if k % 2 == 0 else 0.7))
            # Basse pulsée sur chaque croche, accent sur les contretemps.
            gb = level('bass', at)
            if gb > 0:
                place(stems['bass'], stereo(bass_note(chord['bass'], BEAT / 2 * 0.9)), at, gb * (1.0 if k % 2 else 0.65))
            # Grosse caisse à chaque temps, clap sur 2 et 4, charleston en contretemps.
            gk = level('kick', at)
            if gk > 0 and k % 2 == 0:
                place(stems['kick'], stereo(kick()), at, gk)
                kicks.append(at)
            gc = level('clap', at)
            if gc > 0 and k in (2, 6):
                place(stems['perc'], stereo(clap(), 0.1), at, gc * 0.9)
            gh = level('hat', at)
            if gh > 0:
                if k % 2:
                    place(stems['perc'], stereo(hat(open_=k == 7 and section(at) != 'hook'), 0.35), at, gh * 0.55)
                place(stems['perc'], stereo(shaker(), -0.3), at + BEAT / 4, gh * 0.22)

    # Avant la révélation : roulement de claps qui accélère.
    roll_from = max(sec['final'], sec['outro'] - 2 * BAR)
    k = 0
    at = roll_from
    while at < sec['outro'] - 0.05:
        progress = (at - roll_from) / max(0.1, sec['outro'] - roll_from)
        place(stems['perc'], stereo(clap(), 0.15 * (-1) ** k), at, 0.25 + 0.5 * progress)
        at += BEAT / (2 if progress < 0.5 else 4)
        k += 1

    # « Respiration » sidechain : pad, basse et arpège s'effacent brièvement à chaque grosse caisse.
    sidechain = np.ones(n)
    duck = 1 - 0.6 * np.exp(-t_axis(0.3) / 0.09)
    for at in kicks:
        i = int(at * SR)
        j = min(n, i + len(duck))
        sidechain[i:j] = np.minimum(sidechain[i:j], duck[: j - i])
    for name, depth in (('pad', 1.0), ('bass', 0.8), ('arp', 0.45)):
        stems[name] *= (1 - depth * (1 - sidechain))[:, None]

    # Clochettes dans l'accroche (questions qui s'éveillent).
    for k, note in enumerate([74, 78, 81, 78]):
        at = 0.3 + k * BEAT
        if at < sec['gateway'] - 0.3:
            place(stems['bells'], stereo(bell(note, 1.8), 0.4 if k % 2 else -0.4), at, 0.3)

    # Montée vers la rythmique (fin de l'accroche) puis vers la carte de fin.
    for rise_from, rise_to, amount in ((max(0.0, sec['gateway'] - 1.6), sec['gateway'], 0.35), (sec['final'], sec['outro'], 0.45)):
        rise = rise_to - rise_from
        t = t_axis(rise)
        air = dsp.bandpass(RNG.standard_normal(len(t)), 800, 7000) * (t / rise) ** 2.2 * 0.5
        glide = np.sin(2 * np.pi * np.cumsum(hz(62) * 2 ** (t / rise)) / SR) * (t / rise) ** 2 * 0.3
        place(stems['fx'], stereo(air + glide), rise_from, amount / 0.45)
    place(stems['fx'], crash(), sec['gateway'], 0.55)

    # Résolution : accord de ré majeur tenu, cymbale et clochettes, s'éteint avec la vidéo.
    tail = total - sec['outro']
    resolve = pad_chord([38, 50, 57, 62, 66, 69, 74], tail, 1.0)
    resolve *= np.linspace(1, 0, len(resolve))[:, None] ** 1.5
    place(stems['pad'], resolve, sec['outro'], 1.1)
    place(stems['kick'], stereo(kick()), sec['outro'], 1.0)
    place(stems['fx'], crash(), sec['outro'], 0.7)
    for k, note in enumerate([74, 78, 81, 86]):
        place(stems['bells'], stereo(bell(note, 3.5), (k - 1.5) / 2), sec['outro'] + k * 0.1, 0.5)

    mix = (stems['pad'] * 0.42 + stems['arp'] * 0.4 + stems['bass'] * 0.6 + stems['kick'] * 0.62 +
           stems['perc'] * 0.42 + stems['bells'] * 0.28 + stems['fx'] * 0.4)
    mix = with_reverb(mix, 0.16)
    mix = dsp.highpass(mix, 32)
    mix *= adsr(len(mix), 0.3, 1.2)[:, None]
    return mix


# --- Effets sonores ------------------------------------------------------------

def sweep_filter(x: np.ndarray, cutoffs: np.ndarray, q: float = 1.2) -> np.ndarray:
    """Filtre passe-bande à fréquence variable (state-variable filter)."""
    y = np.zeros_like(x)
    low = band = 0.0
    for i, (s, fc) in enumerate(zip(x, cutoffs)):
        f = 2 * np.sin(np.pi * fc / SR)
        high = s - low - band / q
        band += f * high
        low += f * band
        y[i] = band
    return y


def sfx_whoosh() -> np.ndarray:
    t = t_axis(0.95)
    shape = np.where(t < 0.38, (t / 0.38) ** 2, np.exp(-(t - 0.38) / 0.18))
    cut = 350 + 2600 * np.sin(np.pi * np.clip(t / 0.75, 0, 1)) ** 2
    noise = sweep_filter(RNG.standard_normal(len(t)), cut) * shape
    pan = np.clip((t - 0.1) / 0.6, 0, 1) * 1.4 - 0.7
    out = np.stack([noise * np.cos((pan + 1) * np.pi / 4), noise * np.sin((pan + 1) * np.pi / 4)], axis=1)
    return with_reverb(out, 0.18)


def sfx_impact() -> np.ndarray:
    t = t_axis(1.4)
    f = 42 + 36 * np.exp(-t / 0.06)
    thump = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.32)
    body = dsp.lowpass(RNG.standard_normal(len(t)), 1400) * np.exp(-t / 0.05) * 0.4
    return with_reverb(stereo((thump + body) * adsr(len(t), 0.002, 0.3)), 0.3)


def sfx_pop() -> np.ndarray:
    t = t_axis(0.3)
    f = 620 + 520 * (1 - np.exp(-t / 0.03))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.055)
    return with_reverb(stereo(tone * adsr(len(t), 0.003, 0.1) * 0.8), 0.15)


def sfx_tick() -> np.ndarray:
    t = t_axis(0.16)
    click = dsp.bandpass(RNG.standard_normal(len(t)), 1800, 6000) * np.exp(-t / 0.006)
    tone = np.sin(2 * np.pi * 1760 * t) * np.exp(-t / 0.025) * 0.5
    return stereo((click * 0.6 + tone) * adsr(len(t), 0.001, 0.05), 0.2)


def sfx_reveal() -> np.ndarray:
    t = t_axis(3.2)
    swell = pad_chord([62, 66, 69, 74, 78, 81], 3.2, 1.0) * (np.minimum(1, t / 1.1) * np.exp(-np.maximum(0, t - 1.1) / 0.8))[:, None]
    air = stereo(dsp.bandpass(RNG.standard_normal(len(t)), 3000, 11000) * np.minimum(1, t / 1.1) * np.exp(-np.maximum(0, t - 1.1) / 0.4) * 0.25)
    glints = np.zeros((len(t), 2))
    for k, note in enumerate([86, 90, 93]):
        place(glints, stereo(bell(note, 1.6), (k - 1) * 0.6), 1.0 + k * 0.09, 0.4)
    return with_reverb(swell + air + glints, 0.3)


def sfx_resolve() -> np.ndarray:
    t = t_axis(3.6)
    out = np.zeros((len(t), 2))
    for k, note in enumerate([74, 78, 81, 86]):
        place(out, stereo(bell(note, 3.4), (k - 1.5) / 2), k * 0.05, 0.6)
    low = pad_chord([50, 57, 62], 3.6, 0.6) * np.exp(-t / 1.4)[:, None] * 0.6
    return with_reverb(out + low, 0.35)


def main() -> None:
    tl = json.loads((ROOT / '.cache' / 'timeline.json').read_text())
    music = compose_music(tl)
    # Loudness cible, crêtes de batterie contenues par le limiteur.
    music = dsp.limit(music * 10 ** ((-16.0 - dsp.loudness_lufs(music)) / 20), -1.5)
    wav = ROOT / '.cache' / 'audio' / 'orientation-theme.wav'
    dsp.write_wav(wav, music)
    dsp.encode_mp3(wav, ROOT / 'public' / 'audio' / 'music' / 'orientation-theme.mp3', '192k')
    print(f"musique : {len(music) / SR:.2f} s, {dsp.loudness_lufs(music):.1f} LUFS, true peak {dsp.true_peak_db(music):.1f} dBTP")

    effects = {
        'whoosh': sfx_whoosh, 'impact': sfx_impact, 'pop': sfx_pop,
        'tick': sfx_tick, 'reveal': sfx_reveal, 'resolve': sfx_resolve,
    }
    for name, make in effects.items():
        x = make()
        x = x / (np.max(np.abs(x)) + 1e-9) * 10 ** (-3 / 20)  # crête à -3 dBFS
        x = dsp.fade(x, 0.002, 0.05)
        w = ROOT / '.cache' / 'audio' / f'{name}.wav'
        dsp.write_wav(w, x)
        dsp.encode_mp3(w, ROOT / 'public' / 'audio' / 'sfx' / f'{name}.mp3', '160k')
        print(f'effet {name:8s}: {len(x) / SR:.2f} s')


if __name__ == '__main__':
    main()
