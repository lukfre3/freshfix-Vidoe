import numpy as np
from PIL import Image, ImageDraw, ImageFilter
SKIN = (214, 166, 134, 255)
RIGS = {
 # sprite: list of arms: (poly, shoulder, elbow)
 'kav_front_R': ('kav_front', [(160, 98), (180, 96), (191, 170), (191, 282), (154, 282), (153, 230), (154, 150)], (170, 108), (174, 185)),
 'kav_front_L': ('kav_front', [(40, 98), (20, 96), (8, 170), (8, 282), (46, 282), (47, 230), (46, 150)], (30, 108), (26, 185)),
 'kav_34_R': ('kav_34', [(108, 92), (128, 88), (150, 170), (157, 240), (155, 280), (126, 280), (123, 240), (116, 170), (110, 130)], (118, 100), (136, 182)),
 'k2_front_R': ('k2_front', [(150, 95), (178, 98), (192, 170), (197, 262), (196, 306), (165, 306), (162, 262), (160, 200), (155, 140)], (170, 110), (180, 192)),
 'k2_front_L': ('k2_front', [(50, 95), (22, 98), (8, 170), (3, 262), (4, 306), (35, 306), (38, 262), (40, 200), (45, 140)], (30, 110), (20, 192)),
 'k2_side_R': ('k2_side', [(40, 95), (80, 95), (92, 170), (95, 262), (92, 306), (48, 306), (44, 262), (42, 170)], (60, 105), (70, 190)),
 'kav_side_R': ('kav_side', [(30, 85), (60, 85), (70, 170), (70, 250), (68, 276), (38, 276), (36, 240), (33, 170)], (45, 95), (52, 168)),
}
PAD = 220
FILL = {'kav_side_R': (24, 26, 38), 'k2_side_R': (18, 20, 32)}
def _pad(im):
    c = Image.new('RGBA', (im.width + 2 * PAD, im.height + 2 * PAD), (0, 0, 0, 0)); c.alpha_composite(im, (PAD, PAD)); return c
def pose(spr, arms):
    """arms: list of (poly, shoulder, elbow, a_up, a_low, finger) -> padded RGBA (offset PAD)"""
    body = np.array(spr).copy()
    parts = []
    for poly, sh, el, a_up, a_low, finger, fillc in arms:
        if abs(a_up) < .3 and abs(a_low) < .3 and not finger: continue
        hard = Image.new('L', spr.size, 0); ImageDraw.Draw(hard).polygon(poly, fill=255)
        hm = np.array(hard)
        soft = np.minimum(np.array(hard.filter(ImageFilter.GaussianBlur(.7))), np.array(spr.getchannel('A')))
        if fillc:
            inside = (np.array(hard) > 0) & (body[..., 3] > 0)
            body[inside, 0], body[inside, 1], body[inside, 2] = fillc
        else:
            sd = np.array(Image.fromarray(soft.astype('uint8')).filter(ImageFilter.MaxFilter(3))).astype(float)
            body[..., 3] = (body[..., 3].astype(float) * (1 - sd / 255.)).astype('uint8')
        yy = np.arange(spr.height)[:, None]
        up = spr.copy(); up.putalpha(Image.fromarray((soft * (yy < el[1] + 4)).astype('uint8')))
        lo = spr.copy(); lo.putalpha(Image.fromarray((soft * (yy >= el[1] - 4)).astype('uint8')))
        if finger:
            ys = [p[1] for p in poly]; xs = [p[0] for p in poly]
            hx = (min(xs[-3:]) + max(xs[2:5])) / 2 if False else sum(xs) / len(xs)
            hy = max(ys)
            ImageDraw.Draw(lo).rounded_rectangle([hx - 4, hy - 12, hx + 5, hy + 14], 4, fill=SKIN, outline=(150, 100, 80, 255))
        P = lambda p: (p[0] + PAD, p[1] + PAD)
        lo_p = _pad(lo).rotate(a_low, Image.BICUBIC, center=P(el))
        armc = _pad(up); armc.alpha_composite(lo_p)
        parts.append(armc.rotate(a_up, Image.BICUBIC, center=P(sh)))
    out = _pad(Image.fromarray(body))
    for p in parts: out.alpha_composite(p)
    return out
def rig(spr, name_angles):
    """spr: base sprite (already lip-synced); name_angles: rigname->(a_up,a_low,finger)"""
    arms = []
    for rn, (au, al, fg) in name_angles.items():
        sn, poly, sh, el = RIGS[rn]; arms.append((poly, sh, el, au, al, fg, FILL.get(rn)))
    return pose(spr, arms)
