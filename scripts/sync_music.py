"""Synkar filmens klipp mot musikens takt och skriver src/timeline.json.

Alla scener definieras här i TAKTSLAG (beats). Tiderna i sekunder räknas fram
från låtens tempo, så varje klipp hamnar på ett slag i musiken.

Användning:
  # Med er låt (mp3/wav/m4a). Tempo och första slag mäts automatiskt:
  python3 scripts/sync_music.py assets/source/music.mp3

  # Om den automatiska mätningen blir fel, ange själv:
  python3 scripts/sync_music.py assets/source/music.mp3 --bpm 83 --start 4.35
      --start = sekund i låten där filmen ska börja (helst ett "ettslag" i takten)

  # Utan låt (bara tempo, filmen använder den genererade musiken):
  python3 scripts/sync_music.py --bpm 83

Kör sedan:  npm run audio  &&  npm run render
"""
import argparse
import json
import os
import subprocess

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAX_SECONDS = 60.0

# ------------------------------------------------------------------ Scenplan i taktslag
# (ändra här om ni vill flytta tyngdpunkter – håll gärna stora "hits" på jämna 4-tal = taktens etta)
BEATS = {
    "problem": {"start": 0, "end": 8, "phaseB": 4, "text1": 0.5, "text2": 4},
    "facts": {"start": 8, "end": 23, "items": [8, 13, 18]},
    "solution": {"start": 23, "end": 33, "question": 23.25, "present": 26, "product": 28, "productClose": 31},
    "how": {"start": 33, "end": 45, "kol": 33, "zeolit": 35.5, "pase": 38, "montering": 41},
    "sustain": {"start": 45, "end": 60, "each": 3},
    "why": {"start": 60, "end": 68, "each": 2},
    "finale": {"start": 68, "end": 83, "logo": 70, "t1": 70.5, "t2": 73.5, "t3": 76, "t4": 78},
}
TOTAL_BEATS = 83
GROOVE_BEAT = 28  # där den "positiva" delen börjar (produkten presenteras)


def decode(path, sr=22050):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(raw, np.float32), sr


def onset_envelope(x, sr, hop=256, n=1024):
    win = np.hanning(n)
    frames = np.lib.stride_tricks.sliding_window_view(x, n)[::hop] * win
    mag = np.log1p(np.abs(np.fft.rfft(frames, axis=1)) * 10)
    flux = np.maximum(0, np.diff(mag, axis=0)).sum(axis=1)
    flux = flux - np.convolve(flux, np.ones(16) / 16, mode="same")
    return np.maximum(flux, 0), sr / hop


def detect(path):
    x, sr = decode(path)
    env, fps = onset_envelope(x, sr)
    env_n = env - env.mean()
    ac = np.correlate(env_n, env_n, mode="full")[len(env_n) - 1 :]
    best, best_bpm = -1e9, 90
    for bpm in np.arange(70, 135, 0.1):
        lag = 60 / bpm * fps
        # summera autokorrelationen vid 1, 2, 4 slag (stabilare)
        s = sum(np.interp(lag * k, np.arange(len(ac)), ac) / k for k in (1, 2, 4))
        if s > best:
            best, best_bpm = s, bpm
    period = 60 / best_bpm * fps
    # fas: vilken förskjutning ger mest energi på slagen (och mest på 'ettan')
    phases = np.arange(0, period * 4, 0.5)
    t_idx = np.arange(0, len(env) - 1)
    scores = []
    for ph in phases:
        beats = np.arange(ph, len(env) - 1, period)
        sc = np.interp(beats, t_idx, env[t_idx]).sum()
        bars = np.arange(ph, len(env) - 1, period * 4)
        sc += 0.5 * np.interp(bars, t_idx, env[t_idx]).sum()
        scores.append(sc)
    first = phases[int(np.argmax(scores))] / fps
    return round(float(best_bpm), 2), float(first), len(x) / sr


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("music", nargs="?", help="ljudfil (mp3/wav/m4a)")
    ap.add_argument("--bpm", type=float)
    ap.add_argument("--start", type=float, help="sekund i låten där filmen börjar")
    ap.add_argument("--skip-bars", type=int, default=0, help="hoppa över N takter av låtens intro")
    a = ap.parse_args()

    music = None
    bpm = a.bpm or 83.0
    if a.music:
        det_bpm, first, length = detect(a.music)
        print(f"Uppmätt: {det_bpm} BPM, första slag {first:.3f} s, låtlängd {length:.1f} s")
        bpm = a.bpm or det_bpm
        start = a.start if a.start is not None else first + a.skip_bars * 4 * 60 / bpm
        rel = os.path.relpath(os.path.abspath(a.music), ROOT)
        music = {"file": rel, "start": round(start, 3)}

    beat = 60.0 / bpm
    sec = lambda b: round(b * beat, 3)
    scenes = {}
    for name, d in BEATS.items():
        out = {}
        for k, v in d.items():
            if k == "cuts":
                out[k] = v
            elif isinstance(v, list):
                out[k] = [sec(b) for b in v]
            else:
                out[k] = sec(v)
        scenes[name] = out
    total = min(MAX_SECONDS, sec(TOTAL_BEATS))
    scenes["finale"]["end"] = total
    tl = {
        "_kommentar": "GENERERAD av scripts/sync_music.py – ändra scenplanen (i taktslag) där, inte här.",
        "fps": 30,
        "bpm": bpm,
        "beatStart": sec(GROOVE_BEAT),
        "total": total,
        "music": music,
        "scenes": scenes,
    }
    with open(os.path.join(ROOT, "src", "timeline.json"), "w") as fh:
        json.dump(tl, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    print(f"Skrev src/timeline.json – {bpm} BPM, filmlängd {total:.2f} s")


if __name__ == "__main__":
    main()
