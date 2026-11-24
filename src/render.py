import math, random, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 960, 720, 30
SP = 'sp/h_'
OUT = sys.argv[1] if len(sys.argv) > 1 else 'freshfix.mp4'
PREVIEW = len(sys.argv) > 2
FONT = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Bold.otf', 44)

def L(n): return Image.open(SP + n + '.png').convert('RGBA')
S = {n: L(n) for n in ['kav_front', 'kav_34', 'kav_back', 'kav_portrait', 'kav_angry', 'kav_walk',
                       'fr_front', 'fr_close', 'fr_angry', 'fr_surpr', 'fr_side', 'fr_neutral',
                       'st_front', 'st_34', 'gr_front', 'box_open', 'box_closed', 'box_34']}

# ---------- background: desert, low-poly PS2 feel ----------
def make_bg(w, h, horizon):
    rnd = np.random.default_rng(3)
    y = np.arange(h)[:, None]
    sky_t = np.clip(y / horizon, 0, 1)
    top, bot = np.array([18, 52, 150]), np.array([110, 160, 220])
    sky = top + (bot - top) * sky_t[..., None]
    g_t = np.clip((y - horizon) / (h - horizon), 0, 1)
    gtop, gbot = np.array([205, 170, 115]), np.array([170, 130, 80])
    ground = gtop + (gbot - gtop) * g_t[..., None]
    img = np.where((y < horizon)[..., None], sky, ground) * np.ones((1, w, 1))
    noise = rnd.normal(0, 9, (h // 4 + 1, w // 4 + 1, 1)).repeat(4, 0).repeat(4, 1)[:h, :w]
    img = img + noise * (y >= horizon)[..., None]
    im = Image.fromarray(np.clip(img, 0, 255).astype('uint8'))
    d = ImageDraw.Draw(im)
    # distant mesas
    for x0, ww, hh in [(-50, 380, 40), (300, 260, 26), (620, 420, 48), (1100, 500, 34)]:
        sx = x0 * w / 1200
        d.polygon([(sx, horizon), (sx + ww * .15 * w / 1200, horizon - hh * h / 720),
                   (sx + ww * .8 * w / 1200, horizon - hh * h / 720), (sx + ww * w / 1200, horizon)],
                  fill=(150, 120, 110))
    # fence
    for i in range(0, w, int(w / 22)):
        d.line([(i, horizon + 6 * h / 720), (i, horizon - 14 * h / 720)], fill=(90, 70, 50), width=max(1, w // 600))
    d.line([(0, horizon - 10 * h / 720), (w, horizon - 10 * h / 720)], fill=(100, 85, 70), width=1)
    d.line([(0, horizon - 3 * h / 720), (w, horizon - 3 * h / 720)], fill=(100, 85, 70), width=1)
    # bushes
    r2 = random.Random(5)
    for _ in range(40):
        bx = r2.uniform(0, w); by = r2.uniform(horizon + 10, h)
        s = (by - horizon) / (h - horizon) * 22 * w / 1200 + 3
        d.ellipse([bx - s, by - s * .6, bx + s, by + s * .2], fill=(110, 105, 60))
    return im

BG = make_bg(2400, 1800, 760)      # big world for camera moves (world coords)


# ---------- lip-sync (jaw drop) ----------
MOUTHS = {'kav_portrait': (175, 226, 64), 'fr_neutral': (67, 101, 25), 'fr_angry': (67, 102, 25),
          'fr_surpr': (67, 101, 25), 'kav_34': (89, 71, 11), 'kav_front': (100, 72, 12), 'fr_front': (85, 68, 11)}
SPK = None; OPEN = 0.0; YAW = 0.0; TILT = 0.0
def jaw(spr, mx, my, w, o):
    if o <= 0.03: return spr
    gap = o * 0.15 * w
    out = spr.copy()
    x0, x1 = int(mx - .8 * w), int(mx + .8 * w); y0, y1 = int(my), int(my + 1.25 * w)
    reg = spr.crop((x0, y0, x1, y1))
    lay = Image.new('RGBA', out.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.ellipse([mx - .38 * w, my - .03 * w, mx + .38 * w, my + gap + .03 * w], fill=(40, 14, 14, 255))
    if gap > 3:
        d.ellipse([mx - .2 * w, my - .02 * w, mx + .2 * w, my + gap * .25], fill=(190, 180, 168, 110))
    lay = lay.filter(ImageFilter.GaussianBlur(max(.5, w * .025)))
    out.alpha_composite(lay)
    # mask: narrow at the lip seam (mouth width), widening toward the chin
    rw, rh = reg.size; cx = rw / 2
    m = Image.new('L', reg.size, 0)
    ImageDraw.Draw(m).polygon([(cx - .42 * w, 0), (cx + .42 * w, 0), (cx + .72 * w, rh * .55),
                               (cx + .6 * w, rh), (cx - .6 * w, rh), (cx - .72 * w, rh * .55)], fill=255)
    m = m.filter(ImageFilter.GaussianBlur(max(1, w * .06)))
    m = Image.fromarray(np.minimum(np.array(m), np.array(reg.getchannel('A'))))
    out.paste(reg, (x0, int(round(y0 + gap))), m)
    return out

def turn(spr, yaw, tilt=0.0):
    """fake head/body turn: perspective squeeze on one side + small tilt"""
    if abs(yaw) < 1e-3 and abs(tilt) < 1e-3: return spr
    w, h = spr.size
    dy = abs(yaw) * h * .05; dx = abs(yaw) * w * .06
    if yaw > 0:   # turn toward viewer's right: left edge nearer (taller), right edge farther
        quad = (dx, 0, dx, h, w, h + dy, w, -dy)
    else:
        quad = (0, -dy, 0, h + dy, w - dx, h, w - dx, 0)
    out = spr.transform((w, h), Image.QUAD, quad, Image.BICUBIC)
    if abs(tilt) > 1e-3: out = out.rotate(tilt, Image.BICUBIC, center=(w / 2, h * .9))
    return out

def MS(name, turn_amt=1.0, tilt_amt=1.0):
    spr = S[name]
    if SPK and name.startswith(SPK):
        if name in MOUTHS:
            mx, my, w = MOUTHS[name]; spr = jaw(spr, mx, my, w, OPEN)
        spr = turn(spr, YAW * turn_amt, TILT * tilt_amt)
    return spr
def mouth_open(t):
    v = .55 * math.sin(2 * math.pi * 4.3 * t) + .35 * math.sin(2 * math.pi * 6.9 * t + 1.3) + .2 * math.sin(2 * math.pi * 1.7 * t)
    return max(0.0, min(1.0, v + .15))

# ---------- helpers ----------
def ease(t): return t * t * (3 - 2 * t)

def place(canvas, spr, cx, foot_y, height, blur=0, flip=False, dark=0):
    s = spr.transpose(Image.FLIP_LEFT_RIGHT) if flip else spr
    h = max(1, int(height)); w = max(1, int(s.width * h / s.height))
    up = h / s.height
    s = s.resize((w, h), Image.LANCZOS)
    if up > 1.2 and not blur: s = s.filter(ImageFilter.UnsharpMask(2, 70, 2))
    if blur: s = s.filter(ImageFilter.GaussianBlur(blur))
    if dark:
        a = s.getchannel('A'); s = Image.blend(s.convert('RGB'), Image.new('RGB', s.size, (0, 0, 0)), dark).convert('RGBA'); s.putalpha(a)
    # ground shadow
    sh = Image.new('RGBA', (int(w * .9), max(2, int(h * .05))), (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse([0, 0, sh.width - 1, sh.height - 1], fill=(40, 25, 10, 110))
    canvas.alpha_composite(sh, (int(cx - sh.width / 2), int(foot_y - sh.height / 2)))
    canvas.alpha_composite(s, (int(cx - w / 2), int(foot_y - h)))

def place_top(canvas, spr, cx, top_y, height, blur=0, flip=False):
    s = spr.transpose(Image.FLIP_LEFT_RIGHT) if flip else spr
    h = int(height); w = int(s.width * h / s.height)
    up = h / s.height
    s = s.resize((w, h), Image.LANCZOS)
    if up > 1.2 and not blur: s = s.filter(ImageFilter.UnsharpMask(3, 80, 2))
    if blur: s = s.filter(ImageFilter.GaussianBlur(blur))
    canvas.alpha_composite(s, (int(cx - w / 2), int(top_y)))

def bg_view(cx, cy, zoom, blur=0):
    """crop of world bg centered at (cx,cy) with zoom (1 = 1200x900 world window)"""
    vw, vh = 1200 / zoom * 1.6, 900 / zoom * 1.6
    b = BG.crop((int(cx - vw / 2), int(cy - vh / 2), int(cx + vw / 2), int(cy + vh / 2))).resize((W, H), Image.BILINEAR)
    if blur: b = b.filter(ImageFilter.GaussianBlur(blur))
    return b.convert('RGBA')

def bob(t, amp=4, f=1.3): return math.sin(t * f * 2 * math.pi) * amp

def subtitle(canvas, text):
    if not text: return
    d = ImageDraw.Draw(canvas)
    words, lines, cur = text.split(), [], ''
    for wd in words:
        tst = (cur + ' ' + wd).strip()
        if d.textlength(tst, font=FONT) > W * .9 and cur: lines.append(cur); cur = wd
        else: cur = tst
    lines.append(cur)
    lh = 50; y0 = H - 70 - lh * len(lines)
    for i, ln in enumerate(lines):
        tw = d.textlength(ln, font=FONT)
        d.text(((W - tw) / 2, y0 + i * lh), ln, font=FONT, fill='white', stroke_width=4, stroke_fill=(0, 0, 0))

# ---------- shots ----------
# each shot: (duration, draw_fn(canvas_t, local_t, dur), [(start,end,text), ...]) ; text times local to shot

def wide_open(t, d):
    p = ease(min(1, t / d))
    c = bg_view(1200, 760 + 30, 1.0 + .12 * p)
    z = 1 + .12 * p
    gx = lambda x: W / 2 + (x - W / 2) * z
    place(c, S['st_front'], gx(200), 560 + 25 * z, 150 * z)
    place(c, S['gr_front'], gx(790), 560 + 25 * z, 230 * z)
    place(c, MS('kav_front'), gx(480), 600 + 40 * z, (430 + bob(t, 2)) * z)
    place(c, S['box_closed'], gx(548), 455 + 60 * z, 60 * z)
    return c

def fr_close(spr, push=.08, shake=0):
    def f(t, d):
        p = t / d; z = 1 + push * p
        c = bg_view(1300, 700, 2.2, blur=3)
        hgt = 700 * z
        place_top(c, MS(spr), W / 2 + (random.uniform(-shake, shake) if shake else 0),
                  70 - 30 * p + bob(t, 3, .7), hgt)
        return c
    return f

def kav_close(z0=1.0, z1=1.1, yoff=0, ang=False):
    def f(t, d):
        p = t / d; z = z0 + (z1 - z0) * p
        c = bg_view(900, 650, 2.4, blur=3)
        spr = MS('kav_portrait')
        place_top(c, spr, W / 2 + 40, (40 + yoff) * z - 60 * (z - 1) + bob(t, 3, .9), 760 * z)
        return c
    return f

def ots_kav(t, d):
    # over-the-shoulder: kavaj 3/4 right, striped & green background, fridge blurred foreground left
    c = bg_view(1000, 760, 1.6, blur=2)
    pop = min(1, max(0, (t - 3.6) / .5))           # "nej vi" -> crew steps in
    place(c, S['st_front'], 230, 640, 230, blur=0)
    if pop > 0:
        place(c, S['gr_front'], 400 + (1 - pop) * -300, 600, 300, blur=0)
    place_top(c, MS('kav_34'), 680, 60 + bob(t, 3, .8), 1250)
    place_top(c, S['fr_side'], -40, 40, 1500, blur=3.5, flip=True)
    return c

def two_shot(t, d):
    c = bg_view(1200, 790, 1.0)
    place(c, MS('fr_front'), 300, 640, 470 + bob(t, 2, .6))
    place(c, S['box_34'], 345, 470, 95)
    place(c, MS('kav_34'), 680, 640, 470 + bob(t, 2, .9), flip=True)
    return c

def product(t, d):
    p = ease(min(1, t / d))
    z = 1.0 + .18 * p
    c = bg_view(1200, 640, 2.6 * z, blur=2.5)
    hgt = 430 * z
    place(c, S['box_open'], W / 2, 600 + 40 * (z - 1), hgt)
    return c

def kav_med(t, d):
    c = bg_view(1050, 760, 1.6, blur=1.5)
    place_top(c, S['fr_side'], -60, 60, 1400, blur=3.5, flip=True)
    place_top(c, MS('kav_34'), 640, 50 + bob(t, 3, .8), 1250)
    return c

def eyes(t, d):
    p = t / d
    spr = MS('kav_portrait'); s = spr.width / spr.height
    big = spr.resize((int(2600 * s), 2600), Image.LANCZOS).filter(ImageFilter.UnsharpMask(4, 90, 2))
    c = bg_view(900, 650, 2.4, blur=3)
    c.alpha_composite(big, (int(W / 2 - big.width / 2 - 20), int(-640 - 40 * p)))
    return c

def fr_ots(spr):
    def f(t, d):
        c = bg_view(1300, 700, 2.0, blur=2.5)
        place_top(c, MS(spr), 360, 90 + bob(t, 2, .6), 640)
        place_top(c, S['kav_back'], 820, 120, 1500, blur=4)
        return c
    return f

ARM_POLY = [(160, 98), (180, 96), (191, 170), (191, 282), (154, 282), (153, 230), (154, 150)]
ARM_PIVOT = (170, 108)
def point_arm(spr, ang):
    """rotate the right arm outward (ang degrees) and add an index finger"""
    if ang <= .5: return spr
    pad = 160
    hard = Image.new('L', spr.size, 0); ImageDraw.Draw(hard).polygon(ARM_POLY, fill=255)
    hard_d = hard.filter(ImageFilter.MaxFilter(5))
    sa = np.array(spr.getchannel('A'))
    am = np.minimum(np.array(hard.filter(ImageFilter.GaussianBlur(.8))), sa)
    big = lambda im: (lambda c: (c.alpha_composite(im, (0, 0)), c)[1])(Image.new('RGBA', (spr.width + pad, spr.height + 40), (0, 0, 0, 0)))
    arm = spr.copy(); arm.putalpha(Image.fromarray(am))
    d = ImageDraw.Draw(arm)
    d.rounded_rectangle([166, 268, 176, 294], 5, fill=(214, 166, 134, 255), outline=(150, 100, 80, 255))
    body = spr.copy(); a = np.array(body); a[..., 3] = np.where(np.array(hard_d) > 0, 0, a[..., 3]).astype('uint8')
    body = Image.fromarray(a)
    canv = big(body)
    canv.alpha_composite(big(arm).rotate(ang, Image.BICUBIC, center=ARM_PIVOT))
    return canv

def finale(t, d):
    # like the original's last shot: talker centre, gesturing, crew around him
    p = ease(min(1, t / 2.5))
    z = 1.12 - .12 * p
    c = bg_view(1200, 790, z)
    gx = lambda x: W / 2 + (x - W / 2) * z
    place(c, S['fr_front'], gx(150), 600 + 40 * z, 430 * z)
    place(c, S['box_34'], gx(195), 430 + 60 * z, 85 * z)
    place(c, S['gr_front'], gx(840), 600 + 40 * z, 380 * z)
    ang = 30 * ease(min(1, max(0, (t - .3) / .5))) + (3 * math.sin(t * 9) if t > .8 else 0)
    k = point_arm(MS('kav_front', .6, 0), ang)
    sc = (465 + bob(t, 3)) * z / S['kav_front'].height
    kw = int(k.width * sc); kh = int(k.height * sc)
    kk = k.resize((kw, kh), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 70, 2))
    fx, fy = gx(450), 600 + 40 * z
    sh = Image.new('RGBA', (int(S['kav_front'].width * sc * .9), 18), (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse([0, 0, sh.width - 1, 17], fill=(40, 25, 10, 110))
    c.alpha_composite(sh, (int(fx - sh.width / 2), int(fy - 9)))
    c.alpha_composite(kk, (int(fx - S['kav_front'].width * sc / 2), int(fy - kh)))
    place(c, S['st_front'], gx(640), 640 + 40 * z, 250 * z)
    if t > d - 2.6:   # end card bar
        a = min(1, (t - (d - 2.6)) / .4)
        bar = Image.new('RGBA', (W, 88), (15, 15, 15, int(215 * a)))
        c.alpha_composite(bar, (0, 0))
        f1 = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf', 58)
        dd = ImageDraw.Draw(c); txt = 'FreshFix  ·  349 kr'
        dd.text(((W - dd.textlength(txt, font=f1)) / 2, 12), txt, font=f1, fill=(255, 255, 255, int(255 * a)))
    return c

SHOTS = [
    (2.9, wide_open, [(0, 2.9, 'Här har vi 100 tusen doftneutraliserare som är redo att skickas')]),
    (2.5, fr_close('fr_neutral'), [(1.0, 2.5, 'Vem fan är du?')]),
    (2.4, kav_close(1.0, 1.08), [(0, 2.4, 'Du vet precis vem jag är.')]),
    (2.6, kav_close(1.15, 1.3, 10), [(0, 2.6, 'Jag är mannen som dödade matsvinnet')]),
    (1.6, fr_close('fr_angry', .15, 2), [(0, 1.6, 'Varför ljuger du?')]),
    (11.0, ots_kav, [(0, 3.4, 'En barnfamilj på 4 personer slänger i snitt 5000 kr.'),
                     (3.4, 4.1, 'Jag,'), (3.6, 4.5, 'Jag, nej vi,'),
                     (4.5, 7.6, 'löste det här problemet för en bråkdel av priset.'),
                     (7.6, 11.0, 'Den där boxen i din hand,')]),
    (2.6, two_shot, [(0, 2.6, 'en behållare och ett filter.')]),
    (2.6, kav_close(1.05, 1.15), [(0, 2.6, 'De kostar endast 349 kr att beställa.')]),
    (4.2, product, [(0, 4.2, 'Nästan 15 gånger billigare än matsvinnet!')]),
    (1.8, fr_close('fr_surpr', .12), []),
    (3.0, kav_med, [(0, 3.0, 'Som jag sa förut, du vet exakt vem jag är.')]),
    (2.2, eyes, [(0, 2.2, 'Säg mitt namn!')]),
    (1.4, fr_ots('fr_neutral'), []),
    (1.8, fr_ots('fr_neutral'), [(0, 1.8, 'Du är FreshFix')]),
    (1.5, kav_close(1.1, 1.14), [(0, 1.5, 'Stämmer bra.')]),
    (5.5, finale, [(0, 5.5, 'Klicka på länken här nere och beställ din doftneutraliserare idag.')]),
]

SPEAKERS = ['kav', 'fr', 'kav', 'kav', 'fr', 'kav', 'kav', 'kav', None, None, 'kav', None, None, 'fr', 'kav', 'kav']

def grade(c):
    # PS2-ish: slight downscale/upscale + contrast + vignette
    return c.convert('RGB')

VIG = None
def vignette(im):
    global VIG
    if VIG is None:
        y, x = np.mgrid[0:H, 0:W]
        r = np.sqrt(((x - W / 2) / (W / 2)) ** 2 + ((y - H / 2) / (H / 2)) ** 2)
        VIG = np.clip(1 - .35 * np.clip(r - .55, 0, 1) ** 1.4, 0, 1)[..., None]
    return Image.fromarray((np.array(im) * VIG).astype('uint8'))

total = sum(s[0] for s in SHOTS)
print('total', total)
if PREVIEW:
    sheet = Image.new('RGB', (W // 3 * 4, H // 3 * ((len(SHOTS) + 3) // 4)))
    for i, (d, fn, subs) in enumerate(SHOTS):
        random.seed(i); t = d * .6
        txt = [s for a, b, s in subs if a <= t < b]
        SPK = SPEAKERS[i] if txt else None; OPEN = 1.0; YAW = .8; TILT = 2
        c = fn(t, d)
        im = vignette(grade(c)).convert('RGBA'); subtitle(im, txt[-1] if txt else '')
        sheet.paste(im.convert('RGB').resize((W // 3, H // 3)), ((i % 4) * W // 3, (i // 4) * H // 3))
    sheet.save(OUT); sys.exit()

ff = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                       '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', 'video_noaudio.mp4'], stdin=subprocess.PIPE)
for i, (d, fn, subs) in enumerate(SHOTS):
    n = int(round(d * FPS))
    for k in range(n):
        t = k / FPS; random.seed(i * 1000 + k)
        txt = [s for a, b, s in subs if a <= t < b]
        SPK = SPEAKERS[i] if txt else None
        OPEN = mouth_open(t + i * 3.1)
        YAW = .9 * math.sin(2 * math.pi * .45 * t + i) + .3 * math.sin(2 * math.pi * 1.1 * t)
        TILT = 2.2 * math.sin(2 * math.pi * .3 * t + i * .7)
        c = fn(t, d)
        im = vignette(grade(c)).convert('RGBA')
        subtitle(im, txt[-1] if txt else '')
        ff.stdin.write(im.convert('RGB').tobytes())
ff.stdin.close(); ff.wait()
