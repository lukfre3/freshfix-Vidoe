"""Genererar filmens originalmusik + ljudeffekter -> public/audio/soundtrack.wav

Allt ljud syntetiseras här (inga licensfrågor). Musiken följer src/timeline.json:
  * mörk, känslosam inledning (A-moll) under matsvinnsdelen
  * riser + "hit" när FreshFixer presenteras
  * modern, positiv puls (C-dur, 100 BPM) där klippen ligger på takten
  * kraftfull uppbyggnad mot avslutet

Vill ni byta till licensierad musik: ersätt public/audio/soundtrack.wav
(eller lägg musiken i en egen <Audio> i src/FreshFixFilm.tsx).

Kör: python3 scripts/make_audio.py   (kräver numpy + scipy)
Om src/timeline.json har "music" (sätts av scripts/sync_music.py) används den låten i stället.
"""
import json
import os

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(ROOT, "src", "timeline.json")))
SC = TL["scenes"]
SR = 48000
TOTAL = TL["total"] + 0.5
N = int(TOTAL * SR)
BEAT = 60.0 / TL["bpm"]
B0 = TL["beatStart"]
rng = np.random.default_rng(7)

music = np.zeros((N, 2))
drums = np.zeros((N, 2))
sfx = np.zeros((N, 2))


def note_hz(n):
    """MIDI-nummer -> Hz"""
    return 440.0 * 2 ** ((n - 69) / 12)


def lp(x, fc, order=2):
    sos = butter(order, fc / (SR / 2), btype="low", output="sos")
    return sosfilt(sos, x, axis=0)


def hp(x, fc, order=2):
    sos = butter(order, fc / (SR / 2), btype="high", output="sos")
    return sosfilt(sos, x, axis=0)


def bp(x, lo, hi, order=2):
    sos = butter(order, [lo / (SR / 2), hi / (SR / 2)], btype="band", output="sos")
    return sosfilt(sos, x, axis=0)


def add(buf, t0, sig, gain=1.0, pan=0.0):
    i0 = int(t0 * SR)
    if i0 >= N:
        return
    if sig.ndim == 1:
        l = np.sqrt(0.5 * (1 - pan))
        r = np.sqrt(0.5 * (1 + pan))
        sig = np.stack([sig * l, sig * r], axis=1) * np.sqrt(2)
    n = min(len(sig), N - i0)
    if i0 < 0:
        sig = sig[-i0:]
        i0 = 0
        n = min(len(sig), N)
    buf[i0 : i0 + n] += sig[:n] * gain


def env(n, a, d, s, r, sus_len=None):
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    sl = n - a - d - r if sus_len is None else int(sus_len * SR)
    sl = max(sl, 0)
    e = np.concatenate([
        np.linspace(0, 1, max(a, 1)),
        np.linspace(1, s, max(d, 1)),
        np.full(sl, s),
        np.linspace(s, 0, max(r, 1)),
    ])
    return e


def saw(freq, dur, detune=0.0):
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    f = freq * (1 + detune)
    k = 1
    while k * f < 9000 and k <= 30:
        out += np.sin(2 * np.pi * k * f * t + rng.random() * 6.28) / k
        k += 1
    return out * 0.6


def pad(notes, dur, cutoff=1200, gain=0.12, attack=1.2, release=1.5):
    total = dur + release
    sig = np.zeros(int(total * SR))
    for n in notes:
        for dt in (-0.004, 0.0, 0.0045):
            sig += saw(note_hz(n), total, dt)
    sig = lp(sig, cutoff)
    sig *= env(len(sig), attack, 0.5, 0.85, release)[: len(sig)]
    sig /= max(1, len(notes))
    # bred stereo via liten fördröjning
    d = int(0.012 * SR)
    st = np.stack([sig, np.concatenate([np.zeros(d), sig[:-d]])], axis=1)
    return st * gain


def piano(n, dur=3.0, gain=0.25):
    t = np.arange(int(dur * SR)) / SR
    f = note_hz(n)
    sig = (
        np.sin(2 * np.pi * f * t)
        + 0.45 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 3)
        + 0.2 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 5)
        + 0.08 * np.sin(2 * np.pi * 4.02 * f * t) * np.exp(-t * 7)
    )
    e = np.exp(-t * 1.6) * np.minimum(1, t / 0.004)
    return sig * e * gain


def pluck(n, dur=0.5, gain=0.12, bright=3500):
    t = np.arange(int(dur * SR)) / SR
    f = note_hz(n)
    sig = saw(f, dur, 0.002) + 0.5 * np.sin(2 * np.pi * f * t)
    sig = lp(sig, bright)
    e = np.exp(-t * 7) * np.minimum(1, t / 0.003)
    return sig * e * gain


def kick(gain=0.9):
    dur = 0.45
    t = np.arange(int(dur * SR)) / SR
    f = 45 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    sig = np.sin(ph) * np.exp(-t * 7)
    click = hp(rng.normal(0, 1, len(t)), 3000) * np.exp(-t * 300) * 0.25
    return (sig + click) * gain


def clap(gain=0.35):
    dur = 0.3
    t = np.arange(int(dur * SR)) / SR
    nz = bp(rng.normal(0, 1, len(t)), 900, 5000)
    e = np.exp(-t * 18)
    for off in (0.0, 0.011, 0.022):
        e += (t >= off) * np.exp(-(t - off).clip(0) * 120) * 0.6
    return nz * e * gain * 0.4


def hat(gain=0.12, open_=False):
    dur = 0.25 if open_ else 0.06
    t = np.arange(int(dur * SR)) / SR
    nz = hp(rng.normal(0, 1, len(t)), 7000)
    return nz * np.exp(-t * (14 if open_ else 70)) * gain


def sub_boom(gain=0.8, dur=2.2):
    t = np.arange(int(dur * SR)) / SR
    f = 32 + 40 * np.exp(-t * 6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 1.6) * gain


def whoosh(dur=0.9, gain=0.22, rise=True):
    n = int(dur * SR)
    t = np.arange(n) / SR
    nz = rng.normal(0, 1, n)
    # glidande bandpass via block-filter
    out = np.zeros(n)
    blocks = 24
    for b in range(blocks):
        a0, a1 = b * n // blocks, (b + 1) * n // blocks
        p = b / blocks
        fc = 300 + (4000 if rise else 2500) * (p if rise else 1 - p)
        out[a0:a1] = bp(nz[a0:a1], fc * 0.6, min(fc * 1.6, 12000))
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    return out * e * gain


def ping(f0=1200, gain=0.12, dur=2.5):
    """metalliskt 'ting' – rostfritt stål (inharmoniska partialtoner)"""
    t = np.arange(int(dur * SR)) / SR
    sig = np.zeros_like(t)
    for ratio, amp, dec in ((1, 1, 2.2), (2.76, 0.5, 3.5), (5.40, 0.25, 5), (8.93, 0.12, 7)):
        sig += amp * np.sin(2 * np.pi * f0 * ratio * t) * np.exp(-t * dec)
    return sig * np.minimum(1, t / 0.002) * gain


def tick(gain=0.06, f=3200):
    t = np.arange(int(0.03 * SR)) / SR
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 250) * gain


def riser(dur, gain=0.25):
    n = int(dur * SR)
    t = np.arange(n) / SR
    p = t / dur
    nz = lp(hp(rng.normal(0, 1, n), 1200), 7000) * p ** 3 * 0.32
    f = 200 * 2 ** (p * 3)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * p ** 2 * 0.25
    return (nz + tone) * gain


def reverb(x, seconds=2.8, mix=0.3):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    out = np.zeros_like(x)
    for ch in range(2):
        ir = rng.normal(0, 1, n) * np.exp(-t * (6.9 / seconds))
        ir = lp(ir, 6000)
        ir[: int(0.02 * SR)] = 0
        ir /= np.sqrt(np.sum(ir ** 2))
        out[:, ch] = fftconvolve(x[:, ch], ir)[: len(x)]
    return x * (1 - mix) + out * mix * 1.6


# ======================================================================
# 1) Mörk inledning (A-moll) 0 – beatStart
# ======================================================================
A, C3 = 57, 48
intro_chords = [
    (0.0, SC["facts"]["start"], [45, 52, 57, 60, 64]),  # Am
    (SC["facts"]["items"][0], SC["facts"]["items"][1], [41, 48, 53, 57, 60]),  # F
    (SC["facts"]["items"][1], SC["facts"]["items"][2], [38, 50, 53, 57, 62]),  # Dm
    (SC["facts"]["items"][2], SC["solution"]["start"], [40, 52, 56, 59, 64]),  # E
    (SC["solution"]["start"], SC["solution"]["product"], [36, 48, 55, 60, 64]),  # C – ljuset tänds
]
for i, (t0, t1, ch) in enumerate(intro_chords):
    cutoff = 700 if i < 4 else 1600
    add(music, t0, pad(ch, t1 - t0 + 0.4, cutoff=cutoff, gain=0.16, attack=1.6 if i == 0 else 0.8, release=1.6))

# låg drone under problemet
dr = sum(np.sin(2 * np.pi * note_hz(33) * k * np.arange(int((B0 - 4) * SR)) / SR) / k for k in (1, 2, 3))
dr *= env(len(dr), 3.0, 1, 0.9, 3.0)
add(music, 0.0, lp(dr, 300), 0.10)

# pianotoner vid texterna
pnotes = [
    (SC["problem"]["text1"], [69, 72, 76]),
    (SC["problem"]["text2"], [65, 69, 72]),
    (SC["facts"]["items"][0] + 0.2, [72, 69]),
    (SC["facts"]["items"][1] + 0.2, [74, 69]),
    (SC["facts"]["items"][2] + 0.2, [71, 68]),
    (SC["solution"]["question"] + 0.2, [72, 76, 79]),
]
for t0, ns in pnotes:
    for k, n in enumerate(ns):
        add(music, t0 + k * 0.32, piano(n, 3.5, 0.17), pan=-0.3 + 0.3 * k)

# tunga "slag" vid varje faktasiffra
for t0 in SC["facts"]["items"]:
    add(music, t0, sub_boom(0.55))
# räkneverk som tickar när siffrorna räknas upp
for t0 in SC["facts"]["items"]:
    for k in range(12):
        add(sfx, t0 + 0.15 + k * 0.08 * (1 + k * 0.05), tick(0.03, 2600 + k * 60), pan=0.2)

# riser + hit när FreshFixer presenteras
pres, prod = SC["solution"]["present"], SC["solution"]["product"]
add(sfx, pres, riser(prod - pres, 0.22))
# "pop" när bokstäverna i FreshFixer studsar fram
for k in range(11):
    tp = pres + (4 + k * 1.6) / 30
    nn = int(0.05 * SR)
    tt = np.arange(nn) / SR
    pop = np.sin(2 * np.pi * (900 + k * 60) * tt * (1 - tt * 6)) * np.exp(-tt * 70)
    add(sfx, tp, pop, 0.05, pan=-0.5 + k * 0.1)
add(sfx, pres + 0.05, sub_boom(0.35, 1.0))
add(music, prod, sub_boom(0.9, 3.0))
add(music, prod, pad([48, 55, 60, 64, 67, 72], 2.6, cutoff=3000, gain=0.2, attack=0.01, release=2.5))
add(sfx, prod + 0.25, ping(1180, 0.10), pan=0.25)
add(sfx, SC["solution"]["productClose"], ping(1560, 0.07), pan=-0.3)

# ======================================================================
# 2) Positiv puls i C-dur, 100 BPM, från beatStart
# ======================================================================
prog = [  # (bas, ackord) – C, G, Am, F
    (36, [48, 55, 60, 64]),
    (43, [47, 55, 59, 62]),
    (45, [48, 57, 60, 64]),
    (41, [48, 53, 57, 60]),
]
arp_pat = [0, 2, 1, 3, 2, 1, 3, 2]
end_groove = SC["finale"]["t4"]


def section(t):
    """intensitet 0..3 för en tidpunkt"""
    if t < SC["how"]["start"]:
        return 0
    if t < SC["how"]["montering"]:
        return 1
    if t < SC["sustain"]["start"]:
        return 2
    if t < SC["why"]["start"]:
        return 3
    if t < SC["finale"]["start"]:
        return 3
    if t < SC["finale"]["logo"]:
        return 0
    return 2


bar = 4 * BEAT
nbars = int(np.ceil((end_groove - B0) / bar))
for b in range(nbars):
    t_bar = B0 + b * bar
    bass, chord = prog[b % 4]
    add(music, t_bar, pad(chord, bar, cutoff=1800, gain=0.10, attack=0.25, release=0.8))
    for e in range(8):  # åttondelar
        t = t_bar + e * BEAT / 2
        if t >= end_groove:
            break
        lvl = section(t)
        # arpeggio
        n = chord[arp_pat[e]] + 12
        add(music, t, pluck(n, 0.5, 0.075 if lvl == 0 else 0.09), pan=0.35 if e % 2 else -0.35)
        # bas
        if lvl >= 1 and e % 2 == 0:
            bl = np.sin(2 * np.pi * note_hz(bass) * np.arange(int(0.28 * SR)) / SR) + 0.3 * saw(note_hz(bass), 0.28)
            bl = lp(bl, 500) * env(int(0.28 * SR), 0.005, 0.05, 0.7, 0.1)[: int(0.28 * SR)]
            add(music, t, bl, 0.22 if lvl < 3 else 0.28)
        # trummor
        if e % 2 == 0:
            beat = e // 2
            if lvl == 1 and beat in (0, 2):
                add(drums, t, kick(0.55))
            if lvl >= 2:
                add(drums, t, kick(0.7 if lvl == 2 else 0.85))
            if lvl >= 2 and beat in (1, 3):
                add(drums, t, clap(0.35 if lvl == 2 else 0.45))
        if lvl >= 1:
            add(drums, t + (BEAT / 4 if lvl >= 3 else 0), hat(0.05 if lvl == 1 else 0.07), pan=0.4)
        if lvl >= 3:
            add(drums, t, hat(0.05), pan=-0.3)

# "hits" på varje mening i 'Varför FreshFix UF'
for k in range(4):
    t = SC["why"]["start"] + k * SC["why"]["each"]
    add(music, t, sub_boom(0.5, 1.4))
    add(sfx, t, whoosh(0.35, 0.10))

# breakdown + riser in mot logotypen
logo_t = SC["finale"]["logo"]
add(music, SC["finale"]["start"], pad([48, 55, 60, 64, 67], logo_t - SC["finale"]["start"], cutoff=900, gain=0.13, attack=0.6, release=1.0))
add(sfx, logo_t - 2.4, riser(2.4, 0.26))
add(music, logo_t, sub_boom(0.95, 3.0))
add(sfx, logo_t + 0.05, ping(1180, 0.09), pan=0.0)

# slutackord vid uppmaningen – ringer ut till slutet
t4 = SC["finale"]["t4"]
add(sfx, t4 - 1.2, riser(1.2, 0.18))
add(music, t4, sub_boom(1.0, 4.0))
add(music, t4, pad([36, 48, 55, 60, 64, 67, 72, 76], TOTAL - t4 - 2.5, cutoff=2600, gain=0.24, attack=0.02, release=3.0))
for k, n in enumerate([72, 76, 79, 84]):
    add(music, t4 + 0.15 + k * 0.18, piano(n, 5.0, 0.13), pan=-0.4 + k * 0.25)
add(drums, t4, kick(0.9))
add(drums, t4, hat(0.10, open_=True))

# ======================================================================
# 3) Ljudeffekter
# ======================================================================
for t in [SC["facts"]["start"], SC["solution"]["start"], SC["how"]["kol"], SC["how"]["zeolit"], SC["how"]["pase"],
          SC["how"]["montering"], SC["sustain"]["start"], SC["finale"]["start"]]:
    add(sfx, t - 0.45, whoosh(0.9, 0.16))
for k in range(1, 5):
    add(sfx, SC["sustain"]["start"] + k * SC["sustain"]["each"] - 0.3, whoosh(0.6, 0.11))
# produktsidan: kort "swish" + klick på varje klipp
for k in range(1, 5):
    tk = SC["solution"]["product"] + k * BEAT
    if tk < SC["solution"]["end"]:
        add(sfx, tk - 0.1, whoosh(0.22, 0.09), pan=(-0.4 if k % 2 else 0.4))
        add(sfx, tk, tick(0.06, 2400))
# kartnålen landar över Uppsala
t_pin = SC["sustain"]["start"] + 2 * SC["sustain"]["each"] + 8 / 30 + 0.3
add(sfx, t_pin, ping(1500, 0.06, 1.2))
add(sfx, t_pin, sub_boom(0.25, 0.6))

# granuler som faller – små, torra klick (aktivt kol: mörkare, zeolit: ljusare)
for name, f_lo, f_hi, t0, t1 in (("kol", 1200, 4000, SC["how"]["kol"], SC["how"]["zeolit"]),
                                  ("zeolit", 2500, 7000, SC["how"]["zeolit"], SC["how"]["pase"])):
    for _ in range(int((t1 - t0) * 22)):
        t = t0 + rng.random() * (t1 - t0)
        nn = int(0.012 * SR)
        g = bp(rng.normal(0, 1, nn), f_lo, f_hi) * np.exp(-np.arange(nn) / SR * 400)
        add(sfx, t, g, 0.02 + rng.random() * 0.03, pan=rng.random() * 1.6 - 0.8)

# metalliskt glid + klick när FreshFixer stängs i monteringsklippet
mt = SC["how"]["montering"]
n = int(1.1 * SR)
slide = bp(rng.normal(0, 1, n), 2500, 9000) * np.sin(np.pi * np.arange(n) / n) ** 2
add(sfx, mt + 1.2, slide, 0.05)
add(sfx, mt + 2.35, ping(2100, 0.05, 1.0))
add(sfx, mt + 2.35, tick(0.08, 1800))

# ======================================================================
# Mix + master
# ======================================================================
sfx = reverb(sfx, 1.8, 0.25)
song = TL.get("music")
if song:
    # Er egen låt (t.ex. instrumental) – ersätter den genererade musiken. Ljudeffekterna ligger kvar.
    import subprocess
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-ss", str(song["start"]), "-i", os.path.join(ROOT, song["file"]),
         "-t", str(TOTAL), "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
        check=True, capture_output=True,
    ).stdout
    track = np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)
    music = np.zeros((N, 2))
    music[: len(track)] = track[:N]
    music *= 0.8 / max(1e-6, np.max(np.abs(music)))
    mix = music + sfx * 0.6
else:
    music = reverb(music, 3.2, 0.35)
    drums = reverb(drums, 1.2, 0.12)
    mix = music * 1.0 + drums * 0.8 + sfx * 0.9

# sidechain-liknande "pump" i musiken på kickarna ger modern känsla (milt)
mix = hp(mix, 28)
# Speakerröst (valfri): lägg en inspelning i public/audio/voiceover.wav (se docs/speakermanus.md).
# Musiken sänks automatiskt (ducking) där rösten hörs.
vo_path = os.path.join(ROOT, "public", "audio", "voiceover.wav")
if os.path.exists(vo_path):
    import subprocess
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", vo_path, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                         check=True, capture_output=True).stdout
    vo = np.zeros((N, 2))
    v = np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)[:N]
    vo[: len(v)] = v
    vo *= 0.9 / max(1e-6, np.max(np.abs(vo)))
    lvl = np.abs(vo).mean(axis=1)
    win = int(0.3 * SR)
    lvl = np.convolve(lvl, np.ones(win) / win, mode="same")
    duck = 1 - 0.55 * np.clip(lvl / (lvl.max() * 0.15 + 1e-9), 0, 1)
    mix = mix * duck[:, None] + vo * 1.1
    print("Speakerröst inmixad:", vo_path)

# fade in/ut
fi = int(0.8 * SR)
mix[:fi] *= np.linspace(0, 1, fi)[:, None]
fo = int(2.5 * SR)
mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5

# mjuk limiter
peak = np.max(np.abs(mix))
mix = mix / peak * 1.9
mix = np.tanh(mix) / np.tanh(1.9)
mix *= 10 ** (-1.0 / 20)

out = os.path.join(ROOT, "public", "audio", "soundtrack.wav")
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print("Skrev", out, f"{len(mix) / SR:.1f} s")
