"""Förbereder bilder och videoklipp från assets/source/ till public/ (som Remotion använder).

Kör: python3 scripts/prepare_assets.py
Kräver: pillow, numpy, opencv-python-headless, ffmpeg.

Produktbilderna friläggs (bakgrunden tas bort) med GrabCut. Själva produkten
ändras aldrig – endast bakgrunden tas bort och exponeringen lyfts något.
"""
import os
import subprocess

import cv2
import numpy as np
from PIL import Image, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "source")
IMG = os.path.join(ROOT, "public", "img")
VID = os.path.join(ROOT, "public", "video")
os.makedirs(IMG, exist_ok=True)
os.makedirs(VID, exist_ok=True)

# Rektanglar (x0, y0, x1, y1) runt produkten i originalbilderna.
CUTOUTS = {
    "freshfixer_angle": (690, 540, 1445, 1040),
    "freshfixer_front": (700, 585, 1500, 925),
    "freshfixer_upright": (630, 95, 1430, 1360),
}


def lift(img: Image.Image, exposure=1.18, contrast=1.06) -> Image.Image:
    img = ImageEnhance.Brightness(img).enhance(exposure)
    return ImageEnhance.Contrast(img).enhance(contrast)


def cutout(name, rect):
    bgr = cv2.imread(os.path.join(SRC, name + ".jpg"))
    mask = np.zeros(bgr.shape[:2], np.uint8)
    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    x0, y0, x1, y1 = rect
    cv2.grabCut(bgr, mask, (x0, y0, x1 - x0, y1 - y0), bgd, fgd, 8, cv2.GC_INIT_WITH_RECT)
    m = np.where((mask == 1) | (mask == 3), 255, 0).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    k = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
    m = np.where(lab == k, 255, 0).astype(np.uint8)
    cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    full = np.zeros_like(m)
    cv2.drawContours(full, cnts, -1, 255, -1)
    full = cv2.erode(full, np.ones((3, 3), np.uint8))
    full = cv2.GaussianBlur(full, (5, 5), 0)
    rgb = Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
    rgb = lift(rgb)
    rgba = rgb.convert("RGBA")
    rgba.putalpha(Image.fromarray(full))
    bbox = rgba.getbbox()
    pad = 10
    bbox = (bbox[0] - pad, bbox[1] - pad, bbox[2] + pad, bbox[3] + pad)
    rgba.crop(bbox).save(os.path.join(IMG, name + "_cutout.png"))
    # Hel bild (med studiobakgrund) för närbilder
    rgb.save(os.path.join(IMG, name + ".jpg"), quality=93)


def logo():
    im = Image.open(os.path.join(SRC, "logo.jpg")).convert("RGB")
    im = im.resize((im.width * 3, im.height * 3), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32)
    lum = a.mean(axis=2)
    bg = np.median(lum[:40, :40])
    alpha = np.clip((lum - bg - 6) / (250 - bg - 6), 0, 1)
    out = np.zeros((im.height, im.width, 4), np.uint8)
    out[..., :3] = 255
    out[..., 3] = (alpha * 255).astype(np.uint8)
    full = Image.fromarray(out)
    full.crop(full.getbbox()).save(os.path.join(IMG, "logo_white.png"))
    # Ikon och ordmärke separat (ordmärket börjar ca 70 % ned)
    h = im.height
    split = int(h * 0.69)
    icon = full.crop((0, 0, im.width, split))
    icon.crop(icon.getbbox()).save(os.path.join(IMG, "logo_icon_white.png"))
    word = full.crop((0, split, im.width, h))
    word.crop(word.getbbox()).save(os.path.join(IMG, "logo_word_white.png"))


def copy_plain():
    for name in ["filterpase", "forpackning"]:
        im = Image.open(os.path.join(SRC, name + ".jpg")).convert("RGB")
        im.save(os.path.join(IMG, name + ".jpg"), quality=92)
    for name in ["sdg12", "sdg13"]:
        Image.open(os.path.join(SRC, name + ".png")).save(os.path.join(IMG, name + ".png"))


def video(name, slow=2.0):
    """HDR (HLG) iPhone-klipp -> SDR, 30 fps, slowmotion (60 fps-material spelas i halv fart)."""
    vf = (
        "zscale=t=linear:npl=180,format=gbrpf32le,zscale=p=bt709,"
        "tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,"
        f"setpts={slow}*PTS,eq=contrast=1.05:saturation=1.05"
    )
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", os.path.join(SRC, name + ".mov"), "-an", "-vf", vf,
         "-r", "30", "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
         os.path.join(VID, name + ".mp4")],
        check=True,
    )


if __name__ == "__main__":
    # Produktfotona används hela (ingen frilagning) – endast exponeringen lyfts något.
    for n in CUTOUTS:
        lift(Image.open(os.path.join(SRC, n + ".jpg")).convert("RGB")).save(os.path.join(IMG, n + ".jpg"), quality=93)
    logo()
    copy_plain()
    video("stangning_med_pase")
    video("stangning_tom")
    print("Klart.")
