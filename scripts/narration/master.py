"""Re-mastérise les clips de voix existants (loudness + limiteur) sans resynthèse.

Les durées ne changent pas : la timeline et le manifeste restent valables.
Usage : .venv/bin/python scripts/narration/master.py
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'audio'))
import dsp  # noqa: E402

cfg = json.loads(Path(__file__).with_name('voice.config.json').read_text())['mastering']
manifest = json.loads((dsp.ROOT / 'src' / 'narration' / 'narration.generated.json').read_text())
for seg in manifest['segments']:
    wav = dsp.ROOT / '.cache' / 'narration' / 'wav' / f"{seg['id']}.wav"
    x, sr = dsp.read_wav(wav)
    y = dsp.master_voice(x, cfg['loudnessLufs'], cfg['ceilingDbtp'])
    out = dsp.ROOT / '.cache' / 'narration' / 'mastered' / f"{seg['id']}.wav"
    dsp.write_wav(out, y, sr)
    dsp.encode_mp3(out, dsp.ROOT / 'public' / seg['file'])
    print(f"{seg['id']:11s} {len(y) / sr:5.2f}s  {dsp.loudness_lufs(y, sr):6.1f} LUFS  {dsp.true_peak_db(y):5.1f} dBTP")
