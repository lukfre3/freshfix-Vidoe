import numpy as np
from PIL import Image, ImageFilter

def body_params(al):
    h, w = al.shape
    op = al > 100
    widths = op.sum(1)
    top = np.argmax(widths > 0)
    upper = slice(top, top + int((h - top) * .55))
    hw_rows = widths[upper]
    yh = top + int(np.argmax(hw_rows))                       # widest head row
    xs = np.where(op[yh])[0]; head_w = xs.max() - xs.min(); cx = (xs.max() + xs.min()) / 2
    # neck: narrowest row between head and bottom
    lo = yh + int(head_w * .45)
    seg = widths[lo:h - 2]
    yn = lo + int(np.argmin(seg)) if len(seg) else h - 1
    return cx, yn, head_w

def extend_body(spr, shoulder=1.22, drop=.42, bottom=.30, params=None, color=None):
    """Synthesize shoulders/arms/torso beyond cropped edges. Returns (img, pad_x)."""
    a = np.array(spr).astype(float); h, w = a.shape[:2]; al = a[..., 3]
    cx, yn, head_w = params or body_params(al)
    Hmax = shoulder * head_w; D = drop * head_w
    P = int(max(0, Hmax - cx, Hmax - (w - cx)) + 4); B = int(D + h * bottom)
    W2, H2 = w + 2 * P, h + B
    cxp = cx + P
    # clothing colour from opaque dark pixels below the neck
    reg = a[min(h - 1, int(yn + D * .3)):h]
    m = (reg[..., 3] > 200) & (reg[..., :3].mean(-1) < 110)
    C = np.median(reg[m][:, :3], 0) if m.sum() > 20 else np.median(reg[reg[..., 3] > 200][:, :3], 0)
    if color is not None: C = np.array(color, float)
    yy, xx = np.mgrid[0:H2, 0:W2].astype(float)
    t = np.clip((yy - yn) / D, 0, 1)
    hw = Hmax * (t * t * (3 - 2 * t)) ** .55                        # sloping shoulder line
    hw = np.where(yy < yn, 0, np.maximum(hw, head_w * .32))      # neck width at the top
    dx = np.abs(xx - cxp)
    inside = dx < hw
    # cylinder-ish shading + texture
    r = np.clip(dx / np.maximum(hw, 1), 0, 1)
    shade = (1 - .42 * r ** 3) * (1 - .18 * np.clip((yy - h) / max(B, 1), 0, 1))
    rng = np.random.default_rng(7)
    noise = Image.fromarray(rng.normal(128, 30, (H2 // 2 + 1, W2 // 2 + 1)).clip(0, 255).astype('uint8')).resize((W2 + 2, H2 + 2)).filter(ImageFilter.GaussianBlur(1.2))
    noise = (np.array(noise)[:H2, :W2] - 128) / 128 * 7
    folds = 5 * np.sin(xx / (head_w * .11) + yy / (head_w * .5))
    base = np.ones((H2, W2, 3)) * C
    ext = np.clip(base * shade[..., None] + (noise + folds)[..., None] * .6, 0, 255)
    edge = np.clip((hw - dx) / 2.5, 0, 1)                         # soft silhouette
    ext_a = np.where(inside, edge, 0) * 255
    out = np.zeros((H2, W2, 4)); out[..., :3] = ext; out[..., 3] = ext_a
    # below the original crop: continue the sprite's last clothing rows straight down
    E = 3; hb = h - 1 - E
    rowm = al[hb] > 90
    if rowm.sum() > 4:
        row = a[hb - 2].copy()
        for y in range(hb + 1, H2):
            k = 1 - .18 * max(0, y - h) / max(B, 1)
            seg = out[y, P:P + w]
            sel = rowm & (seg[:, 3] > 0)
            mix = np.clip((y - hb) / 110.0, 0, 1) ** 1.5                  # fade into the generated fill
            seg[sel, :3] = (row[sel, :3] * k) * (1 - mix) + seg[sel, :3] * mix
            seg[rowm, 3] = 255
            out[y, P:P + w] = seg
    canvas = Image.fromarray(out.clip(0, 255).astype('uint8'))
    canvas.alpha_composite(spr, (P, 0))
    return canvas, P

BODY = {  # sprite: (centre x, neck-base y, head width)
    'k2_portrait': (165, 392, 215), 'm_34': (122, 272, 140), 'm_talk': (150, 172, 100), 'm_gesture': (140, 160, 95),
    'm_aside': (110, 185, 100), 'm_cross': (122, 170, 95), 'm_down': (135, 172, 100), 'm_away': (178, 215, 120),
    'fr_close': (110, 200, 135), 'fr_angry': (64, 128, 80), 'fr_surpr': (65, 128, 80), 'fr_neutral': (65, 128, 80),
    'fr_backhead': (105, 192, 130),
}

COLOR = {'fr_angry': (32, 31, 33), 'fr_surpr': (32, 31, 33), 'fr_neutral': (32, 31, 33), 'fr_close': (32, 31, 33), 'fr_backhead': (32, 31, 33)}
