import os, subprocess, sys
from PIL import Image
S = os.path.dirname(os.path.abspath(__file__)); LP = '/home/user/kwaivgi/liveportrait'
DRV = LP + '/assets/examples/driving/'
JOBS = [  # key, source sprite, driver, start, duration
    ('k_s3', 'k2_portrait', 'd13', 0, 2.65), ('k_s4', 'm_34', 'd20', 0, 2.0),
    ('k_s8', 'k2_portrait', 'd13', 3, 2.3), ('k_s14', 'k2_portrait', 'd20', 3, 1.65),
    ('f_s2', 'fr_close', 'd3', 0, 2.6), ('f_s5', 'fr_angry', 'd20', 2, 1.35),
    ('f_s10', 'fr_surpr', 'd18', 2.0, 1.7), ('f_s13', 'fr_close', 'd13', 6, 2.0),
    ('k_s6a', 'm_talk', 'd13', 4, 3.35), ('k_s6b', 'm_gesture', 'd20', 0, .95),
    ('k_s6c', 'm_aside', 'd12', 0, 1.05), ('k_s6d', 'm_down', 'd3', 4, 1.25),
    ('k_s6e', 'm_talk', 'd13', 7.2, 2.75), ('k_s6f', 'm_gesture', 'd20', 1, 1.55),
    ('k_s11b', 'm_talk', 'd20', 4, 1.7), ('k_s11c', 'm_cross', 'd13', 9.8, 1.3),
]
os.makedirs(f'{S}/lpj', exist_ok=True)
for key, src, drv, ss, dur in JOBS:
    out = f'{S}/lpj/{key}--{key}_drv.mp4'
    if os.path.exists(out): print('skip', key, flush=True); continue
    im = Image.open(f'{S}/sp/{src}_raw.png').convert('RGB')
    f = max(1, 900 / im.height)
    im.resize((int(im.width * f), int(im.height * f)), Image.LANCZOS).save(f'{S}/lpj/{key}.png')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(ss), '-t', str(dur), '-i', DRV + drv + '.mp4', '-an',
                    '-vf', 'fps=30', f'{S}/lpj/{key}_drv.mp4'], check=True)
    r = subprocess.run(['/tmp/claude-0/lpenv/bin/python', 'inference.py', '--source', f'{S}/lpj/{key}.png',
                        '--driving', f'{S}/lpj/{key}_drv.mp4', '--output-dir', f'{S}/lpj', '--flag-force-cpu',
                        '--no-flag-use-half-precision', '--flag-crop-driving-video'], cwd=LP, capture_output=True, text=True)
    print(key, 'ok' if os.path.exists(out) else 'FAIL\n' + r.stdout[-1500:] + r.stderr[-1500:], flush=True)
print('ALL DONE', flush=True)
