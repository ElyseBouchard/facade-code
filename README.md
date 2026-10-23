# Facade — site (second iteration)

A quiet photographic index for Facade, in the manner of a film-maker's portfolio: one small monospace size
(Courier Prime), warm paper, a six-column grid of images grouped into numbered chapters, and the construction footage
full-bleed at the top. Static Vite build, about 2 KB of script.

- `npm run dev` / `npm run build`
- Hero footage: `public/media/site-1080.mp4` and `site-720.mp4` (looping, no audio) and `site-poster.jpg`, encoded from the
  4K source with a one-second crossfade at the loop point.
- Grid images: `python scripts/make-images.py --footage PATH/clip.mp4` crops footage stills, the Blender renders and the
  demo captures into `public/images` (-1600 viewer, -640 grid, -160 intro strip).
- Renders: `python scripts/render-stills.py --scanner PATH/facade-scanner.glb --wall PATH/sample-wall.blend` (needs a Python
  with Blender's `bpy`), from the models in the first site's repository.

The demo, hardware lab and waitlist stay on the first site (facade.build) and are linked from here. The scanner is a
concept model and the demo runs on synthetic data; the copy says so.
