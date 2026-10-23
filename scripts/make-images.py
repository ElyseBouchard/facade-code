"""Crop and size the grid images: footage stills from the construction clip, Blender renders (scripts/render-stills.py)
and captures of the Facade demo, written to public/images as -1600 (viewer), -640 (grid) and -160 (intro strip).

  python scripts/make-images.py --footage PATH/clip.mp4
Boxes are (left, top, right, bottom) in source pixels; None keeps the whole frame.
"""
import argparse, os, subprocess, tempfile
from PIL import Image

ap = argparse.ArgumentParser(); ap.add_argument('--footage', required=True); args = ap.parse_args()
HERE = os.path.dirname(os.path.abspath(__file__)); RENDERS = os.path.join(HERE, '..', 'assets', 'renders'); OUT = os.path.join(HERE, '..', 'public', 'images')
os.makedirs(OUT, exist_ok=True)

IMAGES = {
    # Footage (3840 x 2160): the aerial orbit over the building under construction.
    'site-wide': ('footage', 1.0, (240, 0, 3480, 2160)),
    'site-crew': ('footage', 6.0, (1920, 720, 3360, 1680)),
    'site-core': ('footage', 11.0, (920, 80, 1880, 1280)),
    'site-edge': ('footage', 22.5, (1320, 920, 2280, 2120)),
    # Renders.
    'wall-closed': ('wall-closed', None, (160, 120, 1440, 1080)),
    'wall-open': ('wall-open', None, None),
    'wall-panel': ('wall-panel', None, None),
    'wall-copper': ('wall-copper', None, None),
    'scanner-front': ('scanner-front', None, None),
    'scanner-exploded': ('scanner-exploded', None, None),
    'scanner-top': ('scanner-top', None, None),
    'scanner-under': ('scanner-under', None, None),
    'scanner-nose': ('scanner-nose', None, None),
    'scanner-rear': ('scanner-rear', None, None),
    # Captures of the demo (2296 x 1190) and of the numbers drawing (2064 x 1152).
    'evidence-wall': ('evidence-wall', None, (18, 0, 2278, 1190)),
    'evidence-marks': ('evidence-wall', None, (700, 110, 1460, 1060)),
    'evidence-layers': ('evidence-layers', None, (18, 0, 2278, 1190)),
    'cost-site': ('cost-site', None, (271, 0, 1738, 1100)),
    'cost-fans': ('cost-site', None, (660, 120, 1300, 920)),
    'cost-building': ('cost-site', None, (516, 420, 1548, 1108)),
}

frames = {}
def footage(t):
    if t not in frames:
        path = os.path.join(tempfile.gettempdir(), f'facade-frame-{t}.png')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', args.footage, '-frames:v', '1', path], check=True)
        frames[t] = Image.open(path).convert('RGB')
    return frames[t]

for name, (src, t, box) in IMAGES.items():
    im = footage(t) if src == 'footage' else Image.open(os.path.join(RENDERS, src + '.png')).convert('RGB')
    if box: im = im.crop(box)
    w, h = im.size
    for size, q in ((1600, 84), (640, 80), (160, 70)):
        scale = size / max(w, h) if size == 1600 else size / w
        out = im.resize((round(w * min(1, scale)), round(h * min(1, scale))), Image.LANCZOS)
        out.save(os.path.join(OUT, f'{name}-{size}.jpg'), quality=q, optimize=True, progressive=True)
    print(name, im.size, '->', round(640 * h / w))
