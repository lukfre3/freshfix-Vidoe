"""Svensk speakerröst med Piper (lokal, gratis) -> public/audio/voiceover.wav

Varje replik läggs på sin scen enligt src/timeline.json och snabbas upp något
om den annars inte ryms. Kör därefter: npm run audio && npm run render

Röstmodell (hämtas en gång, ca 60 MB, ligger utanför git):
  mkdir -p assets/voice && cd assets/voice
  curl -L -o v.tgz https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-sv-se-nst-medium.tar.gz
  tar xzf v.tgz
  pip install piper-tts

Uttal: texterna nedan är skrivna för att låta rätt (t.ex. "Fräsch Fix" för FreshFix).
Texten i bild ändras i src/config.ts.
"""
import json
import os
import subprocess
import sys
import tempfile

import numpy as np
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL = os.environ.get("PIPER_MODEL", os.path.join(ROOT, "assets", "voice", "sv-se-nst-medium.onnx"))
TL = json.load(open(os.path.join(ROOT, "src", "timeline.json")))
SC = TL["scenes"]
SR = 48000

why = SC["why"]
LINES = [
    # (text, start, senast slut)
    ("Varje år slängs enorma mängder mat. Det påverkar både miljön, och plånboken.", 0.25, SC["problem"]["end"]),
    ("En barnfamilj slänger cirka hundratrettio kilo mat per år.", SC["facts"]["items"][0] + 0.2, SC["facts"]["items"][1]),
    ("Trettiofyra kilo matsvinn, per person och år.", SC["facts"]["items"][1] + 0.3, SC["facts"]["items"][2]),
    ("Det kostar fem- till sextusen kronor, per år.", SC["facts"]["items"][2] + 0.25, SC["facts"]["end"]),
    ("Men tänk om det fanns ett enklare sätt?", SC["solution"]["question"] + 0.05, SC["solution"]["present"] + 0.2),
    ("Vi presenterar, Fräsch Fixer.", SC["solution"]["present"] + 0.15, SC["solution"]["product"] + 0.9),
    ("Aktivt kol och zeolit adsorberar oönskade lukter.", SC["how"]["kol"] + 0.2, SC["how"]["pase"]),
    ("Två material. Ett smart filter. Enkelt att använda, och enkelt att byta.", SC["how"]["pase"] + 0.2, SC["how"]["end"]),
    ("Byggd för att användas igen. Bara filterpåsen byts.", SC["sustain"]["start"] + 0.2, SC["sustain"]["start"] + 2 * SC["sustain"]["each"]),
    ("Lokalt producerad i Uppsala, med smartare materialval.", SC["sustain"]["start"] + 2 * SC["sustain"]["each"] + 0.15, SC["sustain"]["start"] + 4 * SC["sustain"]["each"]),
    ("Vårt mål: mindre matsvinn.", SC["sustain"]["start"] + 4 * SC["sustain"]["each"] + 0.15, SC["sustain"]["end"]),
    ("Vi ser ett problem.", why["start"] + 0.05, why["start"] + why["each"]),
    ("Vi har en lösning.", why["start"] + why["each"] + 0.05, why["start"] + 2 * why["each"]),
    ("Vi vill göra skillnad.", why["start"] + 2 * why["each"] + 0.05, why["start"] + 3 * why["each"]),
    ("Vi är Fräsch Fix u-eff.", why["start"] + 3 * why["each"] + 0.05, why["end"] + 0.9),
    ("Vi har en lösning på ett problem som inte kan ignoreras. Och vi är redo att ta nästa steg.", SC["finale"]["t1"] - 0.3, SC["finale"]["t4"] - 0.2),
    ("Välj Fräsch Fix u-eff, till Alumninästet.", SC["finale"]["t4"] - 0.1, TL["total"] - 0.4),
]


def tts(text, length_scale=0.88):
    with tempfile.TemporaryDirectory() as d:
        out = os.path.join(d, "a.wav")
        subprocess.run([sys.executable, "-m", "piper", "-m", MODEL, "-f", out, "--length-scale", str(length_scale),
                        "--sentence-silence", "0.15"], input=text.encode(), check=True, capture_output=True)
        # trimma tystnad, gör om till 48 kHz mono
        out2 = os.path.join(d, "b.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", out, "-af",
                        "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse",
                        "-ar", str(SR), "-ac", "1", out2], check=True)
        sr, x = wavfile.read(out2)
        return x.astype(np.float64) / 32768


def fit(x, slot):
    dur = len(x) / SR
    if dur <= slot:
        return x, 1.0
    speed = min(dur / slot, 1.25)
    with tempfile.TemporaryDirectory() as d:
        a, b = os.path.join(d, "a.wav"), os.path.join(d, "b.wav")
        wavfile.write(a, SR, (x * 32767).astype(np.int16))
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a, "-af", f"atempo={speed:.3f}", b], check=True)
        return wavfile.read(b)[1].astype(np.float64) / 32768, speed


def main():
    total = TL["total"]
    out = np.zeros(int((total + 0.5) * SR))
    for text, t0, t1 in LINES:
        x = tts(text)
        x, speed = fit(x, t1 - t0 - 0.05)
        i0 = int(t0 * SR)
        n = min(len(x), len(out) - i0)
        out[i0 : i0 + n] += x[:n]
        flag = "  <-- för lång!" if speed >= 1.25 and len(x) / SR > t1 - t0 else ""
        print(f"{t0:6.2f}-{t0 + len(x) / SR:6.2f} s (plats till {t1:6.2f}) x{speed:.2f}  {text}{flag}")
    # lätt "radio"-polering: värme + kompression + presence
    tmp = os.path.join(ROOT, "public", "audio", "_vo_raw.wav")
    wavfile.write(tmp, SR, (out / max(1e-6, np.abs(out).max()) * 0.9 * 32767).astype(np.int16))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af",
                    "highpass=f=80,equalizer=f=200:t=q:w=1:g=2,equalizer=f=3500:t=q:w=1.2:g=2.5,"
                    "acompressor=threshold=-20dB:ratio=3:attack=5:release=120,aecho=0.8:0.6:40:0.08",
                    "-ac", "2", os.path.join(ROOT, "public", "audio", "voiceover.wav")], check=True)
    os.remove(tmp)
    print("Skrev public/audio/voiceover.wav")


if __name__ == "__main__":
    main()
