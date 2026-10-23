# Facade — site (second iteration)

The construction footage full-bleed at the top, then the first site's landing sections under it, in plain English:
the wall that comes apart on scroll, the scanner, what surprises cost, how it works, the software, savings, questions
and the waitlist. Vite build: the hero is static HTML (the footage autoplays before any script runs), and the sections
below are React + three.js (`src/home.tsx`, components in `src/landing`). The About page is plain TypeScript
(`src/main.ts`, `src/style.css`).

- `npm run dev` / `npm run build`
- Hero footage: `public/media/site-1080.mp4` and `site-720.mp4` (looping, no audio) and `site-poster.jpg`, encoded from the
  4K source with a one-second crossfade at the loop point.
- 3D models, textures and the Draco decoder in `public/models`, `public/hardware`, `public/texture` and `public/draco`
  come from the first site's repository.
- Logo: `public/logo-mark.svg` and `src/landing/logo-path.ts` (the same path is inlined in both HTML headers).

The demo, hardware lab, savings calculator and waitlist stay on the first site (facade.build) and are linked from here.
The scanner is a concept model and the demo runs on synthetic data; the copy says so.
