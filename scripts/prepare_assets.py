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
    for name, src in [("filterpase", "filterpase_ny.png"), ("forpackning", "forpackning_ny.png")]:
        im = Image.open(os.path.join(SRC, src)).convert("RGB")
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


def main():
    # Produktfotona används hela (ingen frilagning) – endast exponeringen lyfts något.
    new_product_photos()
    logo()
    copy_plain()
    video("stangning_med_pase")
    video("stangning_tom")
    map_recolor()
    granules("aktivt_kol", 40)
    granules("zeolit", 30)
    print("Klart.")


def map_recolor():
    """Kartan över Uppland/Stockholm färgas om till filmens palett och den röda nålen tas bort
    (en egen animerad nål läggs på i filmen)."""
    bgr = cv2.imread(os.path.join(SRC, "karta_uppland.jpg"))
    b, g, r = [bgr[..., i].astype(np.int32) for i in range(3)]
    # ta bort röd kartnål
    red = ((r > 150) & (g < 90) & (b < 90)).astype(np.uint8) * 255
    red = cv2.dilate(red, np.ones((9, 9), np.uint8))
    bgr = cv2.inpaint(bgr, red, 9, cv2.INPAINT_TELEA)
    img = bgr.astype(np.float32) / 255
    b, g, r = img[..., 0], img[..., 1], img[..., 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    water = (b > g + 0.04) & (b > r + 0.12)
    water = cv2.medianBlur(water.astype(np.uint8) * 255, 5) > 127
    green = np.array([106, 130, 120], np.float32) / 255  # #78826A (BGR)
    green_dark = np.array([56, 74, 62], np.float32) / 255  # #3E4A38
    black = np.array([26, 28, 27], np.float32) / 255  # #1B1C1A
    white = np.array([235, 245, 250], np.float32) / 255
    # land: ljust grönt -> varumärkesgrönt, mörka detaljer (text, vägar, gränser) -> vitt
    land_ref = np.percentile(lum[~water], 60)
    t = np.clip((land_ref - lum) / (land_ref - 0.12), 0, 1) ** 0.8
    shade = np.clip((lum - land_ref) * 3, -0.15, 0.15)[..., None]  # skogsnyanser
    land_col = green[None, None] * (1 + shade) * (1 - t[..., None]) + white[None, None] * t[..., None]
    # vatten: svart, vattentexter/linjer -> ljusgrå
    w_ref = np.percentile(lum[water], 50)
    tw = np.clip((w_ref - lum) / (w_ref - 0.2), 0, 1)
    water_col = black[None, None] * (1 - tw[..., None]) + green_dark[None, None] * tw[..., None]
    out = np.where(water[..., None], water_col, land_col)
    out = (np.clip(out, 0, 1) * 255).astype(np.uint8)
    out = cv2.GaussianBlur(out, (3, 3), 0)
    cv2.imwrite(os.path.join(IMG, "karta_uppland.jpg"), out, [cv2.IMWRITE_JPEG_QUALITY, 93])




def granules(name, thresh):
    """Frilägger varje kolbit/zeolitsten från fotot till egna PNG:er (public/img/granuler/)."""
    out_dir = os.path.join(IMG, "granuler")
    os.makedirs(out_dir, exist_ok=True)
    bgr = cv2.imread(os.path.join(SRC, name + ".png"))
    h, w = bgr.shape[:2]
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    border = np.concatenate([lab[:20].reshape(-1, 3), lab[-20:].reshape(-1, 3), lab[:, :20].reshape(-1, 3), lab[:, -20:].reshape(-1, 3)])
    bg = np.median(border, axis=0)
    diff = np.sqrt(((lab - bg) ** 2).sum(axis=2))
    # GrabCut med startmask: tydligt avvikande = objekt, nära bakgrund = bakgrund, skuggzon = osäker
    gc = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
    gc[diff < 10] = cv2.GC_BGD
    gc[diff > thresh] = cv2.GC_PR_FGD
    sure = cv2.erode((diff > thresh * 1.8).astype(np.uint8), np.ones((15, 15), np.uint8))
    gc[sure > 0] = cv2.GC_FGD
    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    cv2.grabCut(bgr, gc, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
    m = np.where((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    # ta bort skuggor: släta, färglösa pixlar som är något mörkare än bakgrunden
    L = lab[..., 0]
    chroma = np.sqrt((lab[..., 1] - bg[1]) ** 2 + (lab[..., 2] - bg[2]) ** 2)
    mean = cv2.blur(L, (9, 9))
    std = np.sqrt(np.maximum(cv2.blur(L * L, (9, 9)) - mean * mean, 0))
    if name == "aktivt_kol":
        shadow = L > 110
    else:
        # skuggor ligger i ytterkanten av varje sten: släta och nästan färglösa
        ring = (m > 0) & (cv2.erode(m, np.ones((31, 31), np.uint8)) == 0)
        shadow = ring & (std < 9) & (chroma < 6.5) & (L > bg[0] - 90)
    m[shadow] = 0
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    n, labels, stats, _ = cv2.connectedComponentsWithStats(m)
    k = 0
    for i in range(1, n):
        x, y, ww, hh, area = stats[i]
        if area < 3000:
            continue
        comp = (labels == i).astype(np.uint8) * 255
        cnts, _ = cv2.findContours(comp, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        comp = np.zeros_like(comp)
        cv2.drawContours(comp, cnts, -1, 255, -1)
        comp = cv2.erode(comp, np.ones((3, 3) if name == "aktivt_kol" else (9, 9), np.uint8))
        comp = cv2.GaussianBlur(comp, (5, 5), 0)
        pad = 6
        x0, y0, x1, y1 = max(0, x - pad), max(0, y - pad), min(w, x + ww + pad), min(h, y + hh + pad)
        rgba = cv2.cvtColor(bgr[y0:y1, x0:x1], cv2.COLOR_BGR2BGRA)
        rgba[..., 3] = comp[y0:y1, x0:x1]
        cv2.imwrite(os.path.join(out_dir, f"{name}_{k}.png"), rgba)
        k += 1
    return k


# Nya produktfoton (bättre ljus). De placeras så att produkten hamnar på samma ställe och
# i samma storlek som i de gamla fotona (2208×1472) – då fungerar alla kamerarörelser i filmen.
TARGET = {  # (x0, y0, x1, y1) för produkten i målbilden 2208×1472
    "freshfixer_angle": (690, 540, 1445, 1040),
    "freshfixer_front": (700, 585, 1500, 925),
    "freshfixer_upright": (630, 95, 1430, 1360),
}


def product_bbox(bgr):
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    h, w = bgr.shape[:2]
    border = np.concatenate([lab[:15].reshape(-1, 3), lab[-15:].reshape(-1, 3), lab[:, :15].reshape(-1, 3), lab[:, -15:].reshape(-1, 3)])
    diff = np.sqrt(((lab - np.median(border, axis=0)) ** 2).sum(axis=2))
    m = (diff > 55).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
    n, lab_, st, _ = cv2.connectedComponentsWithStats(m)
    k = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
    x, y, ww, hh = st[k, 0], st[k, 1], st[k, 2], st[k, 3]
    return x, y, x + ww, y + hh


def new_product_photos():
    for name, (tx0, ty0, tx1, ty1) in TARGET.items():
        bgr = cv2.imread(os.path.join(SRC, name + "_ny.jpg"))
        x0, y0, x1, y1 = product_bbox(bgr)
        s = min((tx1 - tx0) / (x1 - x0), (ty1 - ty0) / (y1 - y0))
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        tcx, tcy = (tx0 + tx1) / 2, (ty0 + ty1) / 2
        M = np.float32([[s, 0, tcx - s * cx], [0, s, tcy - s * cy]])
        out = cv2.warpAffine(bgr, M, (2208, 1472), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
        cv2.imwrite(os.path.join(IMG, name + ".jpg"), out, [cv2.IMWRITE_JPEG_QUALITY, 94])
        print(name, "produkt", (x0, y0, x1, y1), "skala", round(s, 3))


if __name__ == "__main__":
    if os.environ.get("ONLY_MAP"):
        map_recolor()
    elif os.environ.get("ONLY_PRODUCTS"):
        new_product_photos()
    elif os.environ.get("ONLY_GRANULES"):
        print("kol:", granules("aktivt_kol", 40), "zeolit:", granules("zeolit", 30))
    else:
        main()
