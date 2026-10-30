"""Contrôle du mixage sur les rendus réels de Remotion.

Usage : .venv/bin/python scripts/audio/analyze-mix.py voice.wav music.wav sfx.wav final.mp4
(couches rendues avec la propriété audioMix, voir README). Mesures : loudness
intégrée (ITU-R BS.1770), true peak, écart voix / musique pendant la narration,
écrêtage du mix final. Les fenêtres de narration viennent de .cache/timeline.json.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

import dsp

ROOT = dsp.ROOT


def windows(active: bool, tl: dict, n: int) -> np.ndarray:
    """Masque des échantillons où la voix parle (ou se tait)."""
    mask = np.zeros(n, dtype=bool)
    for v in tl['voice']:
        a, b = int(v['from'] / tl['fps'] * dsp.SR), int(v['speechEnd'] / tl['fps'] * dsp.SR)
        mask[a:b] = True
    return mask if active else ~mask


def main() -> None:
    voice_p, music_p, sfx_p, final_p = (Path(a) for a in sys.argv[1:5])
    tl = json.loads((ROOT / '.cache' / 'timeline.json').read_text())
    voice, music, sfx, final = (dsp.decode(p) for p in (voice_p, music_p, sfx_p, final_p))
    n = min(len(voice), len(music), len(final))
    speaking = windows(True, tl, n)
    report = {
        'voice_lufs': dsp.loudness_lufs(voice[:n][speaking]),
        'music_lufs_under_voice': dsp.loudness_lufs(music[:n][speaking]),
        'music_lufs_between_voice': dsp.loudness_lufs(music[:n][~speaking]),
        'sfx_peak_dbfs': float(20 * np.log10(np.max(np.abs(sfx)) + 1e-12)),
        'final_lufs': dsp.loudness_lufs(final),
        'final_true_peak_dbtp': dsp.true_peak_db(final),
        'final_clipped_samples': int(np.sum(np.abs(final) >= 0.999)),
        'final_duration_s': len(final) / dsp.SR,
    }
    report['voice_over_music_db'] = report['voice_lufs'] - report['music_lufs_under_voice']
    report['ffmpeg_loudnorm_check'] = dsp.ffmpeg_loudnorm_measure(final_p)
    for k, v in report.items():
        print(f'{k:28s} {v if isinstance(v, dict) else round(v, 2)}')


if __name__ == '__main__':
    main()
