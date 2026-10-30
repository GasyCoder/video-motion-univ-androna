"""Outils audio partagés : loudness ITU-R BS.1770, true peak, filtrage, E/S.

Le ffmpeg embarqué par Remotion ne contient pas de filtres de traitement
(ni passe-haut, ni limiteur) : tout le traitement est fait ici, en numpy/scipy.
ffmpeg ne sert qu'à l'encodage final et à une mesure de contrôle (loudnorm).
"""
from __future__ import annotations

import json
import math
import re
import subprocess
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter, resample_poly, sosfilt

ROOT = Path(__file__).resolve().parents[2]
SR = 48000
FFMPEG = ROOT / 'node_modules' / '@remotion' / 'compositor-linux-x64-gnu' / 'ffmpeg'


def as_2d(x: np.ndarray) -> np.ndarray:
    return x[:, None] if x.ndim == 1 else x


def resample(x: np.ndarray, sr_in: int, sr_out: int = SR) -> np.ndarray:
    if sr_in == sr_out:
        return x
    g = math.gcd(sr_in, sr_out)
    return resample_poly(x, sr_out // g, sr_in // g, axis=0)


def highpass(x: np.ndarray, hz: float, sr: int = SR, order: int = 4) -> np.ndarray:
    sos = butter(order, hz, 'highpass', fs=sr, output='sos')
    return sosfilt(sos, x, axis=0)


def lowpass(x: np.ndarray, hz: float, sr: int = SR, order: int = 2) -> np.ndarray:
    sos = butter(order, min(hz, sr * 0.45), 'lowpass', fs=sr, output='sos')
    return sosfilt(sos, x, axis=0)


def bandpass(x: np.ndarray, lo: float, hi: float, sr: int = SR, order: int = 2) -> np.ndarray:
    sos = butter(order, [lo, min(hi, sr * 0.45)], 'bandpass', fs=sr, output='sos')
    return sosfilt(sos, x, axis=0)


# --- Loudness ITU-R BS.1770-4 (coefficients de pondération K à 48 kHz) -------
_SHELF_B = [1.53512485958697, -2.69169618940638, 1.19839281085285]
_SHELF_A = [1.0, -1.69065929318241, 0.73248077421585]
_RLB_B = [1.0, -2.0, 1.0]
_RLB_A = [1.0, -1.99004745483398, 0.99007225036621]


def loudness_lufs(x: np.ndarray, sr: int = SR) -> float:
    """Loudness intégrée (LUFS) avec double porte, canaux pondérés à 1."""
    x = as_2d(resample(x, sr, SR))
    y = lfilter(_RLB_B, _RLB_A, lfilter(_SHELF_B, _SHELF_A, x, axis=0), axis=0)
    block, step = int(0.4 * SR), int(0.1 * SR)
    if len(y) < block:
        return -70.0
    z = np.array([np.sum(np.mean(y[i:i + block] ** 2, axis=0)) for i in range(0, len(y) - block + 1, step)])
    blocks = -0.691 + 10 * np.log10(z + 1e-12)
    z = z[blocks > -70]
    if len(z) == 0:
        return -70.0
    rel = -0.691 + 10 * np.log10(np.mean(z)) - 10
    z = z[-0.691 + 10 * np.log10(z + 1e-12) > rel]
    return float(-0.691 + 10 * np.log10(np.mean(z)))


def true_peak_db(x: np.ndarray) -> float:
    over = resample_poly(as_2d(x), 4, 1, axis=0)
    return float(20 * np.log10(np.max(np.abs(over)) + 1e-12))


def gain_to(x: np.ndarray, target_lufs: float, ceiling_dbtp: float) -> np.ndarray:
    """Amène x à la loudness cible, sans dépasser le plafond de true peak."""
    gain_db = target_lufs - loudness_lufs(x)
    gain_db = min(gain_db, ceiling_dbtp - true_peak_db(x))
    return x * 10 ** (gain_db / 20)


def fade(x: np.ndarray, fade_in: float = 0.01, fade_out: float = 0.02, sr: int = SR) -> np.ndarray:
    x = x.copy()
    n_in, n_out = int(fade_in * sr), int(fade_out * sr)
    if n_in:
        x[:n_in] *= np.linspace(0, 1, n_in)[:, None] if x.ndim == 2 else np.linspace(0, 1, n_in)
    if n_out:
        x[-n_out:] *= np.linspace(1, 0, n_out)[:, None] if x.ndim == 2 else np.linspace(1, 0, n_out)
    return x


def trim_silence(x: np.ndarray, threshold_db: float = -45, head: float = 0.06, tail: float = 0.14, sr: int = SR) -> np.ndarray:
    """Retire les silences de début/fin en gardant une petite marge naturelle."""
    mono = np.abs(as_2d(x)).max(axis=1)
    win = int(0.01 * sr)
    env = np.convolve(mono, np.ones(win) / win, mode='same')
    loud = np.where(env > 10 ** (threshold_db / 20) * mono.max())[0]
    if len(loud) == 0:
        return x
    start = max(0, loud[0] - int(head * sr))
    end = min(len(x), loud[-1] + int(tail * sr))
    return x[start:end]


def read_wav(path: Path) -> tuple[np.ndarray, int]:
    sr, data = wavfile.read(str(path))
    if data.dtype == np.int16:
        data = data.astype(np.float32) / 32768
    elif data.dtype == np.int32:
        data = data.astype(np.float32) / 2147483648
    return data.astype(np.float64), sr


def write_wav(path: Path, x: np.ndarray, sr: int = SR) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    wavfile.write(str(path), sr, (np.clip(x, -1, 1) * 32767).astype(np.int16))


def ffmpeg(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run([str(FFMPEG), '-hide_banner', '-nostdin', '-y', *args], capture_output=True, text=True, check=True)


def encode_mp3(wav: Path, mp3: Path, bitrate: str = '192k') -> None:
    mp3.parent.mkdir(parents=True, exist_ok=True)
    ffmpeg('-i', str(wav), '-codec:a', 'libmp3lame', '-b:a', bitrate, str(mp3))


def decode(path: Path, sr: int = SR) -> np.ndarray:
    """Décode n'importe quel fichier audio (mp3, mp4…) en float stéréo via ffmpeg.

    Le ffmpeg embarqué ne propose que le conteneur WAV : passage par un fichier temporaire.
    """
    import tempfile

    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / 'decoded.wav'
        ffmpeg('-i', str(path), '-vn', '-acodec', 'pcm_s16le', '-ac', '2', '-ar', str(sr), str(wav))
        data, _ = read_wav(wav)
    return as_2d(data)


def ffmpeg_loudnorm_measure(path: Path) -> dict[str, float]:
    """Mesure de contrôle avec le filtre loudnorm de ffmpeg (indépendante de notre implémentation)."""
    res = subprocess.run(
        [str(FFMPEG), '-hide_banner', '-nostdin', '-i', str(path), '-vn', '-af', 'loudnorm=print_format=json', '-f', 'null', '-'],
        capture_output=True, text=True,
    )
    match = re.search(r'\{[^{}]*"input_i"[^{}]*\}', res.stderr)
    if not match:
        raise RuntimeError(res.stderr[-800:])
    data = json.loads(match.group(0))
    return {'integrated_lufs': float(data['input_i']), 'true_peak_dbtp': float(data['input_tp']), 'lra': float(data['input_lra'])}


def limit(x: np.ndarray, ceiling_dbtp: float = -1.5, lookahead: float = 0.003, release: float = 0.06, sr: int = SR) -> np.ndarray:
    """Limiteur de crête transparent (hors temps réel : anticipation sans latence).

    Gain requis estimé sur un signal suréchantillonné ×4 (true peak), étendu par un
    minimum glissant puis lissé : le gain ne dépasse jamais le gain requis.
    """
    from scipy.ndimage import minimum_filter1d, uniform_filter1d

    x2 = as_2d(x)
    over = np.abs(resample_poly(x2, 4, 1, axis=0)).max(axis=1)
    peak = over[: len(over) // 4 * 4].reshape(-1, 4).max(axis=1)
    peak = np.pad(peak, (0, max(0, len(x2) - len(peak))), mode='edge')[: len(x2)]
    ceiling = 10 ** (ceiling_dbtp / 20)
    required = np.minimum(1.0, ceiling / np.maximum(peak, 1e-9))
    hold = int(lookahead * sr)
    gain = minimum_filter1d(required, size=2 * hold + 1)
    gain = uniform_filter1d(gain, size=hold + 1)
    smooth = int(release * sr)
    gain = np.minimum(gain, uniform_filter1d(minimum_filter1d(gain, size=smooth), size=smooth))
    gain = np.minimum(gain, minimum_filter1d(required, size=2 * hold + 1))
    out = x2 * gain[:, None]
    return out[:, 0] if x.ndim == 1 else out


def compress(x: np.ndarray, threshold_db: float, ratio: float, window: float = 0.025, smooth: float = 0.05, sr: int = SR) -> np.ndarray:
    """Compresseur RMS doux : réduit l'écart entre syllabes fortes et faibles."""
    from scipy.ndimage import uniform_filter1d

    x2 = as_2d(x)
    rms = np.sqrt(uniform_filter1d(np.mean(x2 ** 2, axis=1), size=int(window * sr)) + 1e-12)
    level = 20 * np.log10(rms)
    reduction = np.maximum(0.0, level - threshold_db) * (1 - 1 / ratio)
    gain = 10 ** (-uniform_filter1d(reduction, size=int(smooth * sr)) / 20)
    out = x2 * gain[:, None]
    return out[:, 0] if x.ndim == 1 else out


def master_voice(x: np.ndarray, target_lufs: float, ceiling_dbtp: float) -> np.ndarray:
    """Voix off : compression douce, loudness cible, crêtes contenues par le limiteur."""
    y = x * 10 ** ((-20 - loudness_lufs(x)) / 20)
    y = compress(y, threshold_db=-24, ratio=2.5)
    for _ in range(2):
        y = y * 10 ** ((target_lufs - loudness_lufs(y)) / 20)
        y = limit(y, ceiling_dbtp - 0.3)
    excess = true_peak_db(y) - ceiling_dbtp
    return y * 10 ** (-max(0.0, excess) / 20)
