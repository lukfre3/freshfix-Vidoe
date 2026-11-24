"""FreshFix reklamfilm v3 - shot-for-shot timing, camera moves and gestures modelled on the reference."""
import math, random, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

exec(open('rig.py').read())

W, H, FPS = 960, 720, 30
PREVIEW = len(sys.argv) > 2
OUT = sys.argv[1] if len(sys.argv) > 1 else 'video_noaudio.mp4'
SUBFONT = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-SemiBold.otf', 40)

# ---------------- sprites (+ sunlit grade so they sit in the desert) ----------------
def sun_grade(im, k=1.0):
    a = im.getchannel('A'); rgb = im.convert('RGB')
    rgb = ImageEnhance.Brightness(rgb).enhance(1 + .16 * k)
    rgb = ImageEnhance.Contrast(rgb).enhance(1 + .10 * k)
    rgb = ImageEnhance.Color(rgb).enhance(1 + .12 * k)
    arr = np.array(rgb).astype(float) * np.array([1.06, 1.0, .90]) ** k
    out = Image.fromarray(np.clip(arr, 0, 255).astype('uint8')).convert('RGBA'); out.putalpha(a)
    return out

NAMES = ['k2_front', 'k2_side', 'k2_back', 'k2_34', 'k2_walk', 'k2_portrait',
         'm_front', 'm_side', 'm_34', 'm_aside', 'm_gesture', 'm_cross', 'm_down', 'm_talk', 'm_away',
         'kav_front', 'kav_34', 'kav_back', 'kav_portrait', 'kav_side', 'kav_walk',
         'fr_front', 'fr_close', 'fr_angry', 'fr_surpr', 'fr_side', 'fr_neutral', 'fr_backhead',
         'st_front', 'gr_front', 'box_open', 'box_closed', 'box_34']
S = {n: sun_grade(Image.open(f'sp/h_{n}.png').convert('RGBA'), .6 if n.startswith('box') else 1) for n in NAMES}

# ---------------- lip sync / turning ----------------
MOUTHS = {'k2_portrait': (178, 297, 64), 'm_front': (130, 224, 56), 'm_34': (140, 203, 58),
          'm_talk': (142, 148, 40), 'm_aside': (124, 131, 32), 'm_cross': (135, 128, 32),
          'k2_front': (103, 65, 20), 'k2_side': (88, 66, 12), 'kav_portrait': (175, 226, 64), 'fr_neutral': (67, 101, 25), 'fr_angry': (67, 102, 25),
          'fr_surpr': (67, 101, 25), 'fr_close': (108, 151, 31), 'kav_34': (89, 71, 11),
          'kav_front': (100, 72, 12), 'fr_front': (85, 68, 11), 'kav_side': (78, 72, 8)}
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
    rw, rh = reg.size; cx = rw / 2
    m = Image.new('L', reg.size, 0)
    ImageDraw.Draw(m).polygon([(cx - .42 * w, 0), (cx + .42 * w, 0), (cx + .72 * w, rh * .55),
                               (cx + .6 * w, rh), (cx - .6 * w, rh), (cx - .72 * w, rh * .55)], fill=255)
    m = m.filter(ImageFilter.GaussianBlur(max(1, w * .06)))
    m = Image.fromarray(np.minimum(np.array(m), np.array(reg.getchannel('A'))))
    out.paste(reg, (x0, int(round(y0 + gap))), m)
    return out

def turn(spr, yaw, tilt=0.0):
    if abs(yaw) < 1e-3 and abs(tilt) < 1e-3: return spr
    w, h = spr.size
    dy = abs(yaw) * h * .05; dx = abs(yaw) * w * .06
    quad = (dx, 0, dx, h, w, h + dy, w, -dy) if yaw > 0 else (0, -dy, 0, h + dy, w - dx, h, w - dx, 0)
    out = spr.transform((w, h), Image.QUAD, quad, Image.BICUBIC)
    if abs(tilt) > 1e-3: out = out.rotate(tilt, Image.BICUBIC, center=(w / 2, h * .9))
    return out

PREFIX = {'kav': ('k2_', 'm_', 'kav_'), 'fr': ('fr_',)}
def speaking(name): return bool(SPK) and name.startswith(PREFIX[SPK])

def MS(name, turn_amt=1.0, tilt_amt=1.0):
    spr = S[name]
    if speaking(name):
        if name in MOUTHS:
            mx, my, w = MOUTHS[name]; spr = jaw(spr, mx, my, w, OPEN)
        spr = turn(spr, YAW * turn_amt, TILT * tilt_amt)
    return spr

def mouth_open(t):
    v = .55 * math.sin(2 * math.pi * 4.3 * t) + .35 * math.sin(2 * math.pi * 6.9 * t + 1.3) + .2 * math.sin(2 * math.pi * 1.7 * t)
    return max(0.0, min(1.0, v + .15))

def posed(name, arms, turn_amt=.5):
    """lip-synced sprite with rigged arms; returns padded image (PAD on every side)"""
    base = S[name]
    if speaking(name) and name in MOUTHS:
        mx, my, w = MOUTHS[name]; base = jaw(base, mx, my, w, OPEN)
    out = rig(base, arms) if arms else _pad(base)
    if speaking(name): out = turn(out, YAW * turn_amt * .5, 0)
    return out

# ---------------- background ----------------
def make_bg(w, h, horizon):
    rnd = np.random.default_rng(3)
    y = np.arange(h)[:, None].astype(float)
    t = np.clip(y / horizon, 0, 1)
    sky = np.array([8, 30, 135]) + (np.array([105, 160, 225]) - np.array([8, 30, 135])) * (t ** 1.6)[..., None]
    g = np.clip((y - horizon) / (h - horizon), 0, 1)
    ground = np.array([226, 188, 120]) + (np.array([196, 150, 88]) - np.array([226, 188, 120])) * g[..., None]
    img = np.where((y < horizon)[..., None], sky, ground) * np.ones((1, w, 1))
    noise = rnd.normal(0, 10, (h // 3 + 1, w // 3 + 1, 1)).repeat(3, 0).repeat(3, 1)[:h, :w]
    # dune ripples
    xx = np.arange(w)[None, :]
    rip = 7 * np.sin(xx / 37.0 + y / 11.0) * (y >= horizon)
    img = img + noise * (y >= horizon)[..., None] + rip[..., None]
    im = Image.fromarray(np.clip(img, 0, 255).astype('uint8'))
    d = ImageDraw.Draw(im)
    for x0, ww, hh, col in [(-60, 420, 46, (140, 120, 135)), (330, 280, 30, (150, 128, 130)),
                            (640, 470, 56, (135, 115, 130)), (1120, 520, 38, (148, 126, 132))]:
        sx = x0 * w / 1200; sw = ww * w / 1200; sh = hh * h / 720
        d.polygon([(sx, horizon), (sx + sw * .12, horizon - sh), (sx + sw * .82, horizon - sh * .9), (sx + sw, horizon)], fill=col)
    for i in range(0, w, int(w / 26)):
        d.line([(i, horizon + 5 * h / 720), (i, horizon - 13 * h / 720)], fill=(95, 74, 52), width=max(1, w // 700))
    for k in (10, 4):
        d.line([(0, horizon - k * h / 720), (w, horizon - k * h / 720)], fill=(110, 92, 75), width=1)
    r2 = random.Random(5)
    for _ in range(70):
        bx = r2.uniform(0, w); by = r2.uniform(horizon + 8, h)
        s = (by - horizon) / (h - horizon) * 24 * w / 1200 + 3
        for j in range(3):
            ox = r2.uniform(-s, s) * .6
            d.ellipse([bx + ox - s * .7, by - s * .7, bx + ox + s * .7, by + s * .15], fill=(120 + j * 8, 112 + j * 6, 62))
    return im

BG = make_bg(2400, 1800, 760)
SKY = make_bg(2400, 1800, 1700)          # mostly sky, for low-angle shots

def bg_view(cx, cy, zoom, blur=0, src=None):
    src = src or BG
    vw, vh = 1200 / zoom * 1.6, 900 / zoom * 1.6
    b = src.crop((int(cx - vw / 2), int(cy - vh / 2), int(cx + vw / 2), int(cy + vh / 2))).resize((W, H), Image.BILINEAR)
    if blur: b = b.filter(ImageFilter.GaussianBlur(blur))
    return b.convert('RGBA')

# ---------------- drawing helpers ----------------
def ease(t): t = max(0, min(1, t)); return t * t * (3 - 2 * t)
def ramp(t, a, b): return ease((t - a) / (b - a)) if b > a else float(t >= a)
def bob(t, amp=4, f=1.3): return math.sin(t * f * 2 * math.pi) * amp
def drift(t, seed, amp=4):
    return (amp * (math.sin(t * 1.3 + seed) + .5 * math.sin(t * 2.9 + seed * 2)),
            amp * .6 * (math.sin(t * 1.1 + seed * 3) + .5 * math.sin(t * 3.3 + seed)))

def sharpen_up(s, up, blur):
    if blur: return s.filter(ImageFilter.GaussianBlur(blur))
    if up > 1.2: return s.filter(ImageFilter.UnsharpMask(2.5, 75, 2))
    return s

def shadow(canvas, cx, y, w):
    sh = Image.new('RGBA', (max(4, int(w)), max(3, int(w * .12))), (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse([0, 0, sh.width - 1, sh.height - 1], fill=(70, 40, 10, 120))
    sh = sh.filter(ImageFilter.GaussianBlur(2))
    canvas.alpha_composite(sh, (int(cx - sh.width / 2), int(y - sh.height / 2)))

def place(canvas, spr, cx, foot_y, height, blur=0, flip=False, shadow_on=True):
    s = spr.transpose(Image.FLIP_LEFT_RIGHT) if flip else spr
    h = max(1, int(height)); w = max(1, int(s.width * h / s.height))
    up = h / s.height
    s = sharpen_up(s.resize((w, h), Image.LANCZOS), up, blur)
    if shadow_on: shadow(canvas, cx, foot_y, w * .85)
    canvas.alpha_composite(s, (int(cx - w / 2), int(foot_y - h)))

def place_padded(canvas, padded, base, cx, foot_y, height, blur=0, flip=False, shadow_on=True):
    """place a rigged (padded) sprite so that the base sprite's feet land on (cx, foot_y)"""
    sc = height / base.height
    s = padded.transpose(Image.FLIP_LEFT_RIGHT) if flip else padded
    w, h = int(s.width * sc), int(s.height * sc)
    s = sharpen_up(s.resize((w, h), Image.LANCZOS), sc, blur)
    if shadow_on: shadow(canvas, cx, foot_y, base.width * sc * .85)
    canvas.alpha_composite(s, (int(cx - w / 2), int(foot_y - (PAD + base.height) * sc)))

def place_top(canvas, spr, cx, top_y, height, blur=0, flip=False):
    s = spr.transpose(Image.FLIP_LEFT_RIGHT) if flip else spr
    h = int(height); w = int(s.width * h / s.height)
    up = h / s.height
    s = sharpen_up(s.resize((w, h), Image.LANCZOS), up, blur)
    canvas.alpha_composite(s, (int(cx - w / 2), int(top_y)))

def place_rot(canvas, spr, cx, cy, height, ang):
    h = int(height); w = int(spr.width * h / spr.height)
    s = spr.resize((w, h), Image.LANCZOS).rotate(ang, Image.BICUBIC, expand=True)
    canvas.alpha_composite(s, (int(cx - s.width / 2), int(cy - s.height / 2)))

def glare(canvas, x, y, r, strength):
    if strength <= 0: return
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.sqrt((xx - x) ** 2 + (yy - y) ** 2) / r
    g = np.clip(1 - d, 0, 1) ** 2.2 * strength
    ring = np.exp(-((d - .55) ** 2) / .003) * .08 * strength
    arr = np.array(canvas).astype(float)
    arr[..., :3] += (g + ring)[..., None] * np.array([255, 245, 215])
    return Image.fromarray(np.clip(arr, 0, 255).astype('uint8'))

def subtitle(canvas, text):
    if not text: return canvas
    d = ImageDraw.Draw(canvas)
    words, lines, cur = text.split(), [], ''
    for wd in words:
        tst = (cur + ' ' + wd).strip()
        if d.textlength(tst, font=SUBFONT) > W * .88 and cur: lines.append(cur); cur = wd
        else: cur = tst
    lines.append(cur)
    lh = 44; y0 = int(H * .80) - lh * len(lines)
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ds = ImageDraw.Draw(sh)
    for i, ln in enumerate(lines):
        tw = d.textlength(ln, font=SUBFONT)
        ds.text(((W - tw) / 2 + 2, y0 + i * lh + 3), ln, font=SUBFONT, fill=(0, 0, 0, 220))
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(2.5)))
    for i, ln in enumerate(lines):
        tw = d.textlength(ln, font=SUBFONT)
        d.text(((W - tw) / 2, y0 + i * lh), ln, font=SUBFONT, fill='white', stroke_width=1, stroke_fill=(30, 30, 30))
    return canvas

# ---------------- poses ----------------
HOLD = {'k2_front_R': (-15, -55, False), 'k2_front_L': (15, 55, False)}
REST = {}

# ---------------- shots ----------------
def s1_wide_toss(t, d):
    # talker centre holding the open FreshFix box, crew behind, tosses it off to the left
    dx, dy = drift(t, 1, 2)
    c = bg_view(1200 + dx, 800 + dy, 1.0)
    place(c, S['st_front'], 230, 560, 150, blur=.6)
    place(c, S['gr_front'], 820, 585, 260, blur=.4)
    toss = ramp(t, 1.45, 1.75)
    if t < 1.45:
        arms = HOLD
    else:
        arms = {'k2_front_R': (-15 + 25 * toss, -55 + 55 * toss, False),
                'k2_front_L': (15 - 55 * toss + 15 * ramp(t, 1.9, 2.4), 55 - 15 * toss, False)}
    k = posed('k2_front', arms)
    kh = 520 + bob(t, 2, .5)
    place_padded(c, k, S['k2_front'], 480, 690, kh)
    sc = kh / S['k2_front'].height
    hand_x, hand_y = 480, 690 - (S['k2_front'].height - 285) * sc
    if t < 1.5:
        place(c, S['box_open'], hand_x, hand_y + 45, 140, shadow_on=False)
    else:
        u = min(1, (t - 1.5) / .7)
        bx = hand_x - 330 * u; by = hand_y + 40 - 120 * math.sin(math.pi * u) + 140 * u * u
        if u < 1:
            place_rot(c, S['box_closed'], bx, by - 40, 80, 220 * u)
        else:
            shadow(c, bx, 690, 120); place(c, S['box_closed'], bx, 700, 80, shadow_on=False)
    return c

def s2_fr_catch(t, d):
    # listener medium close-up, camera pushes in, box rises into his hands
    p = ease(t / d); z = 1 + .14 * p
    c = bg_view(1300, 700, 2.0 * z, blur=3)
    look_down = ramp(t, .5, 1.0) * (1 - ramp(t, 1.4, 1.8))
    place_top(c, MS('fr_close', .7, .8), W / 2, (60 + 30 * look_down) * z - 50 * (z - 1), 760 * z)
    rise = ease(min(1, (t - .45) / .45)) if t > .45 else 0
    if rise > 0:
        place(c, S['box_open'], W / 2 + 10, H + 330 - 95 * rise + 15 * look_down, 300 * z, shadow_on=False)
    return c

def low_angle(t, d, glare_fade=(0, .9), zoom=(1.0, 1.06), xoff=0):
    # hero shot from below: deep blue sky, sun glare, face looming
    p = t / d; z = zoom[0] + (zoom[1] - zoom[0]) * p
    c = bg_view(1200, 950, 1.0, blur=1, src=SKY)
    spr = MS('k2_portrait', .8, 1.0)
    w0, h0 = spr.size
    hgt = int(800 * z); wd = int(w0 * hgt / h0)
    s = spr.resize((wd, hgt), Image.LANCZOS)
    sq = .10
    s = s.transform(s.size, Image.QUAD, (wd * sq, 0, 0, hgt, wd, hgt, wd * (1 - sq), 0), Image.BICUBIC)   # chin nearer camera
    s = s.filter(ImageFilter.UnsharpMask(3, 80, 2))
    c.alpha_composite(s, (int(W / 2 - wd / 2 + 40 + xoff + bob(t, 4, .35)), int(-25 - 40 * (z - 1))))
    g = 1 - ramp(t, glare_fade[0], glare_fade[1])
    c = glare(c, W * .3, H * .18, 420, .25 + .75 * g)
    return c.convert('RGBA')

def kav_close(z0, z1, yoff=0):
    def f(t, d):
        p = t / d; z = z0 + (z1 - z0) * p
        c = bg_view(900, 650, 2.4, blur=3)
        place_top(c, MS('m_34'), W / 2 + 20, (20 + yoff) * z - 60 * (z - 1) + bob(t, 3, .9), 800 * z)
        return glare(c, W * .2, H * .1, 380, .25).convert('RGBA')
    return f

def fr_close(spr, push=.08, shake=0):
    def f(t, d):
        p = t / d; z = 1 + push * p
        c = bg_view(1300, 700, 2.2, blur=3)
        place_top(c, MS(spr), W / 2 + (random.uniform(-shake, shake) if shake else 0),
                  70 - 30 * p + bob(t, 3, .7), 700 * z)
        return c
    return f

def med_pose(c, seq, t, cx, top, hgt, xf=.12):
    """seq: list of (start, sprite, flip); cross-fades between photo poses"""
    cur = max(i for i, (st, *_r) in enumerate(seq) if st <= t)
    def draw(idx, alpha):
        st, nm, fl = seq[idx]
        spr = MS(nm, .6, .8)
        lay = Image.new('RGBA', c.size, (0, 0, 0, 0))
        place_top(lay, spr, cx, top, hgt, flip=fl)
        if alpha < 1:
            a = np.array(lay); a[..., 3] = (a[..., 3] * alpha).astype('uint8'); lay = Image.fromarray(a)
        c.alpha_composite(lay)
    k = ease((t - seq[cur][0]) / xf) if cur > 0 else 1
    if k < 1: draw(cur - 1, 1)
    draw(cur, k)

def s6_ots(t, d):
    dx, dy = drift(t, 4, 3)
    c = bg_view(1000 + dx, 770 + dy, 1.6, blur=2.2)
    place(c, S['st_front'], 300 + dx, 650, 250, blur=1.4)
    pop = ramp(t, 4.0, 4.5)
    if pop > 0: place(c, S['gr_front'], 120 + 150 * pop + dx, 640, 330, blur=1.4)
    lean = ramp(t, 4.9, 5.4) * (1 - ramp(t, 5.9, 6.4))
    seq = [(0, 'm_talk', True), (3.2, 'm_gesture', True), (4.0, 'm_aside', False), (4.9, 'm_down', True),
           (6.0, 'm_talk', True), (8.6, 'm_gesture', True)]
    med_pose(c, seq, t, 650 + dx * 1.3 - 40 * lean, 60 + bob(t, 3, .8) + 50 * lean + dy, 720 * (1 + .1 * lean))
    place_top(c, S['fr_backhead'], -10 + dx * 2, 150 + dy, 1150, blur=6)
    return c

def s7_profile(t, d):
    # wide profile two-shot: listener left holding the box, talker right gesturing
    dx, dy = drift(t, 7, 1.5)
    c = bg_view(1200 + dx, 800 + dy, 1.0)
    place(c, S['fr_side'], 260, 650, 470 + bob(t, 2, .5), flip=True)
    place(c, S['box_34'], 320, 470, 105, shadow_on=False)
    g = ramp(t, .3, .7)
    a1 = 25 * g + 5 * math.sin(t * 3); a2 = 85 * g + 15 * math.sin(t * 4.2)
    k = posed('k2_side', {'k2_side_R': (a1, a2, False)})
    place_padded(c, k, S['k2_side'], 720, 650, 480 + bob(t, 2, .8), flip=True)
    return c

def s9_product(t, d):
    p = ease(min(1, t / d)); z = 1.0 + .12 * p
    c = bg_view(1200, 640, 2.6 * z, blur=2.5)
    place(c, S['box_open'], W / 2, 600 + 40 * (z - 1), 430 * z)
    return glare(c, W * .85, H * .05, 300, .3).convert('RGBA')

def s11_ots(t, d):
    # turns back from looking away to face the listener, arms crossed on "vem jag är"
    dx, dy = drift(t, 11, 3)
    c = bg_view(1050 + dx, 770 + dy, 1.6, blur=2.2)
    place(c, S['st_front'], 260, 650, 250, blur=1.4)
    seq = [(0, 'm_away', False), (.35, 'm_talk', True), (1.9, 'm_cross', True)]
    med_pose(c, seq, t, 650 + dx * 1.3, 60 + bob(t, 3, .8) + dy, 720)
    place_top(c, S['fr_backhead'], -10 + dx * 2, 150 + dy, 1150, blur=6)
    return c

def s12_eyes(t, d):
    p = t / d
    spr = S['k2_portrait']; f = 5.2 * (1 + .12 * p)
    big = spr.resize((int(spr.width * f), int(spr.height * f)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(3, 70, 2))
    c = bg_view(900, 650, 2.4, blur=3)
    c.alpha_composite(big, (int(W / 2 - 176 * f), int(H * .46 - 200 * f)))
    return c

def s13_fr_ots(t, d):
    dx, dy = drift(t, 13, 2)
    c = bg_view(1300 + dx, 700, 2.0, blur=2.5)
    place_top(c, MS('fr_close', .7, .8), 360 + dx, 110 + bob(t, 2, .6), 640)
    place(c, S['box_open'], 370 + dx, H + 175, 290, shadow_on=False)
    place_top(c, S['k2_back'], 830 + dx * 2, 90, 1650, blur=4)
    return c

def s15_finale(t, d):
    # steps toward camera, then points down at the link
    dx, dy = drift(t, 15, 1.5)
    c = bg_view(1200 + dx, 800 + dy, 1.0)
    place(c, S['fr_front'], 140, 645, 450 + bob(t, 2, .5))
    place(c, S['box_34'], 185, 470, 90, shadow_on=False)
    place(c, S['gr_front'], 850, 610, 360, blur=.4)
    step = ramp(t, 0, .7)
    kh = 470 + 80 * step
    if t < .55:
        place(c, S['k2_walk'] if int(t * 6) % 2 == 0 else S['k2_front'], 470, 650 + 20 * step, kh * (1.0 if int(t * 6) % 2 else .98))
    else:
        pa = ramp(t, .6, 1.0)
        jab = 4 * math.sin((t - 1.0) * 8) if t > 1.0 else 0
        k = posed('k2_front', {'k2_front_L': (-26 * pa + jab, 10 * pa, pa > .3)})
        place_padded(c, k, S['k2_front'], 470, 650 + 20 * step, kh + bob(t, 2, .8))
    place(c, S['st_front'], 660, 700, 270)
    if t > d - 1.6:
        a = ramp(t, d - 1.6, d - 1.2)
        bar = Image.new('RGBA', (W, 80), (12, 12, 12, int(200 * a)))
        c.alpha_composite(bar, (0, 0))
        f1 = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf', 52)
        dd = ImageDraw.Draw(c); txt = 'FreshFix  ·  349 kr'
        dd.text(((W - dd.textlength(txt, font=f1)) / 2, 10), txt, font=f1, fill=(255, 255, 255, int(255 * a)))
    return c

# (duration, fn, speaker, [(start, end, text)])  - cut points follow the reference
SHOTS = [
    (2.70, s1_wide_toss, 'kav', [(0, 2.7, 'Här har vi 100 tusen doftneutraliserare som är redo att skickas')]),
    (2.60, s2_fr_catch, 'fr', [(1.5, 2.6, 'Vem fan är du?')]),
    (2.65, lambda t, d: low_angle(t, d, (0, 1.0)), 'kav', [(1.0, 2.65, 'Du vet precis vem jag är.')]),
    (2.00, kav_close(1.12, 1.25, 10), 'kav', [(0, 2.0, 'Jag är mannen som dödade matsvinnet')]),
    (1.35, fr_close('fr_angry', .15, 2), 'fr', [(0, 1.35, 'Varför ljuger du?')]),
    (10.0, s6_ots, 'kav', [(0, 3.2, 'En barnfamilj på 4 personer slänger i snitt 5000 kr.'),
                          (3.2, 4.0, 'Jag,'), (4.0, 4.9, 'nej vi,'),
                          (4.9, 8.6, 'löste det här problemet för en bråkdel av priset.'),
                          (8.6, 10.0, 'Den där boxen i din hand,')]),
    (2.70, s7_profile, 'kav', [(.3, 2.7, 'en behållare och ett filter.')]),
    (2.30, lambda t, d: low_angle(t, d, (0, .6)), 'kav', [(.6, 2.3, 'De kostar endast 349 kr att beställa.')]),
    (3.30, s9_product, None, [(.6, 3.3, 'Nästan 15 gånger billigare än matsvinnet!')]),
    (1.70, fr_close('fr_surpr', .12), None, []),
    (3.05, s11_ots, 'kav', [(.35, 3.05, 'Som jag sa förut, du vet exakt vem jag är.')]),
    (2.65, s12_eyes, None, [(0, 2.65, 'Säg mitt namn!')]),
    (2.00, s13_fr_ots, 'fr', [(.95, 2.0, 'Du är FreshFix')]),
    (1.65, lambda t, d: low_angle(t, d, (0, .5), (1.04, 1.08), -20), 'kav', [(.4, 1.65, 'Stämmer bra.')]),
    (4.80, s15_finale, 'kav', [(.3, 4.8, 'Klicka på länken här nere och beställ din doftneutraliserare idag.')]),
]

VIG = None
def finish(c):
    global VIG
    if VIG is None:
        y, x = np.mgrid[0:H, 0:W]
        r = np.sqrt(((x - W / 2) / (W / 2)) ** 2 + ((y - H / 2) / (H / 2)) ** 2)
        VIG = np.clip(1 - .28 * np.clip(r - .6, 0, 1) ** 1.4, 0, 1)[..., None]
    arr = np.array(c.convert('RGB')).astype(float)
    arr = (arr - 128) * 1.06 + 128 + 4          # a touch of punch like the reference
    return Image.fromarray(np.clip(arr * VIG, 0, 255).astype('uint8')).convert('RGBA')

def frame(i, t):
    global SPK, OPEN, YAW, TILT
    d, fn, spk, subs = SHOTS[i]
    txt = [s for a, b, s in subs if a <= t < b]
    SPK = spk if txt else None
    OPEN = mouth_open(t + i * 3.1)
    YAW = .9 * math.sin(2 * math.pi * .45 * t + i) + .3 * math.sin(2 * math.pi * 1.1 * t)
    TILT = 2.2 * math.sin(2 * math.pi * .3 * t + i * .7)
    random.seed(i * 1000 + int(t * FPS))
    c = finish(fn(t, d))
    return subtitle(c, txt[-1] if txt else '').convert('RGB')

total = sum(s[0] for s in SHOTS)
print('total', round(total, 2))
if PREVIEW:
    times = [float(x) for x in sys.argv[2].split(',')] if sys.argv[2] != '1' else None
    frames = []
    if times:
        acc = 0; bounds = []
        for d, *_ in SHOTS: bounds.append((acc, acc + d)); acc += d
        for T in times:
            for i, (a, b) in enumerate(bounds):
                if a <= T < b: frames.append(frame(i, T - a)); break
    else:
        frames = [frame(i, SHOTS[i][0] * .65) for i in range(len(SHOTS))]
    cols = 4; rows = (len(frames) + cols - 1) // cols
    sheet = Image.new('RGB', (W // 3 * cols, H // 3 * rows))
    for k, f in enumerate(frames): sheet.paste(f.resize((W // 3, H // 3)), ((k % cols) * W // 3, (k // cols) * H // 3))
    sheet.save(OUT); sys.exit()

ff = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                       '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'medium', OUT], stdin=subprocess.PIPE)
for i, (d, *_rest) in enumerate(SHOTS):
    for k in range(int(round(d * FPS))):
        ff.stdin.write(frame(i, k / FPS).tobytes())
ff.stdin.close(); ff.wait()
