import math, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
W, H, FPS, D = 960, 720, 30, 4.0
D_ = 'outro/'
SANS = '/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf'; SANS_M = '/usr/share/fonts/opentype/inter/Inter-Medium.otf'
GREEN = (122, 133, 108); BEIGE = (232, 222, 205); CHAR = (34, 36, 34)
def ease(t): t = max(0, min(1, t)); return t * t * (3 - 2 * t)
def ramp(t, a, b): return ease((t - a) / (b - a))
logo = Image.open(D_ + 'logo.png'); prod = Image.open(D_ + 'prod_front.png'); pack = Image.open(D_ + 'pack.png')
# warm-tint the B&W steel photo slightly so it sits in warm light
pa = np.array(prod).astype(float); pa[..., :3] = np.clip(pa[..., :3] * [1.04, 1.0, .94] * 1.05, 0, 255); prod = Image.fromarray(pa.astype('uint8'))
yy, xx = np.mgrid[0:H, 0:W].astype(float)
def background(t):
    g = np.sqrt(((xx - W * .5) / W) ** 2 + ((yy - H * .52) / H) ** 2)
    base = np.array(CHAR, float) + (np.array([70, 78, 62]) - np.array(CHAR)) * np.clip(1 - g * 1.9, 0, 1)[..., None]
    return Image.fromarray(np.clip(base, 0, 255).astype('uint8')).convert('RGBA')
def fit(im, h): return im.resize((int(im.width * h / im.height), int(h)), Image.LANCZOS)
def with_alpha(im, a):
    if a >= 1: return im
    x = np.array(im); x[..., 3] = (x[..., 3] * max(0, a)).astype('uint8'); return Image.fromarray(x)
def text(c, s, font, size, y, a, col=(255, 255, 255), track=0, shadow=True):
    if a <= 0: return
    f = ImageFont.truetype(font, size); d = ImageDraw.Draw(c)
    w = d.textlength(s, font=f) + track * (len(s) - 1)
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0)); dl = ImageDraw.Draw(lay)
    x = (W - w) / 2
    for ch in s:
        dl.text((x, y), ch, font=f, fill=col + (255,)); x += dl.textlength(ch, font=f) + track
    if shadow:
        sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); sh.putalpha(lay.getchannel('A').filter(ImageFilter.GaussianBlur(5)).point(lambda v: v * .7))
        c.alpha_composite(with_alpha(sh, a), (0, 3))
    c.alpha_composite(with_alpha(lay, a))
def frame(t):
    c = background(t)
    # light sweep reveal 0-1 s
    rise = ramp(t, 0, .9); push = 1 + .05 * t / D
    # packaging behind, product in front
    ph = 250 * push; pk = fit(pack, ph)
    pk = with_alpha(pk, rise)
    c.alpha_composite(pk, (int(W / 2 - pk.width / 2 - 70), int(318 - ph / 2 + 20 * (1 - rise))))
    # floor reflection / shadow
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(sh).ellipse([W / 2 - 300, 455, W / 2 + 300, 495], fill=(0, 0, 0, int(150 * rise)))
    c.alpha_composite(sh.filter(ImageFilter.GaussianBlur(14)))
    pr = fit(prod, 150 * push); pr = with_alpha(pr, rise)
    px, py = int(W / 2 - pr.width / 2 + 150), int(470 - pr.height + 25 * (1 - rise))
    c.alpha_composite(pr, (px, py))
    # specular highlight sweeping across the steel
    sw = ramp(t, .35, 1.3)
    if 0 < sw < 1:
        hl = Image.new('L', pr.size, 0); hx = int(-pr.width * .3 + sw * pr.width * 1.6)
        ImageDraw.Draw(hl).polygon([(hx, 0), (hx + 40, 0), (hx - 20, pr.height), (hx - 60, pr.height)], fill=150)
        hl = Image.fromarray(np.minimum(np.array(hl.filter(ImageFilter.GaussianBlur(10))), np.array(pr.getchannel('A'))))
        wht = Image.new('RGBA', pr.size, (255, 250, 235, 0)); wht.putalpha(hl); c.alpha_composite(wht, (px, py))
    # warm vignette over everything
    v = np.clip(1 - .55 * np.clip(np.sqrt(((xx - W / 2) / (W * .62)) ** 2 + ((yy - H / 2) / (H * .62)) ** 2) - .45, 0, 1), 0, 1)
    arr = np.array(c).astype(float); arr[..., :3] *= v[..., None]; c = Image.fromarray(arr.astype('uint8'))
    # logo top 1.0+
    la = ramp(t, .8, 1.3); lg = fit(logo, 140); c.alpha_composite(with_alpha(lg, la), (int(W / 2 - lg.width / 2), int(14 - 10 * (1 - la))))
    # headline 1.0–3.0, CTA 3.0–4.0 (bottom band)
    band = ramp(t, 1.0, 1.3)
    bar = Image.new('RGBA', (W, 200), CHAR + (int(225 * band),)); c.alpha_composite(bar, (0, H - 200))
    ImageDraw.Draw(c).rectangle([0, H - 200, W, H - 197], fill=GREEN + (int(255 * band),))
    hA = ramp(t, 1.05, 1.4) * (1 - ramp(t, 2.85, 3.0))
    text(c, 'KÖP EN FRESHFIXER', SANS, 54, H - 178, hA, BEIGE, 2)
    text(c, 'FÖR ETT FRÄSCHARE KYLSKÅP', SANS, 40, H - 112, ramp(t, 1.3, 1.65) * (1 - ramp(t, 2.85, 3.0)), (255, 255, 255), 1)
    cA = ramp(t, 3.0, 3.2)
    text(c, 'KÖP PÅ FRESHFIX.SE – 349 KR', SANS, 50, H - 182, cA, (255, 255, 255), 1)
    desc = ['FreshFixer är en stilren doftneutraliserare med aktivt kol och zeolit som hjälper till',
            'att neutralisera oönskade lukter och adsorbera mognadsgaser i kylskåpet.']
    for i, ln in enumerate(desc): text(c, ln, SANS_M, 19, H - 104 + i * 27, cA * .92, BEIGE, 0, False)
    # fade in from black
    k = ramp(t, 0, .45)
    if k < 1:
        blk = Image.new('RGBA', (W, H), (0, 0, 0, int(255 * (1 - k)))); c.alpha_composite(blk)
    return c.convert('RGB')
if len(sys.argv) > 2:
    sheet = Image.new('RGB', (W // 2 * 3, H // 2 * 2))
    for i, t in enumerate([.3, .9, 1.6, 2.5, 3.3, 3.95]):
        sheet.paste(frame(t).resize((W // 2, H // 2)), ((i % 3) * W // 2, (i // 3) * H // 2))
    sheet.save(sys.argv[1]); sys.exit()
ff = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                       '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', sys.argv[1]], stdin=subprocess.PIPE)
for n in range(int(D * FPS)): ff.stdin.write(frame(n / FPS).tobytes())
ff.stdin.close(); ff.wait()
