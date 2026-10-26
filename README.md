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
- Stills: when a browser can't keep a WebGL context, the 3D views show `public/stills/*.webp` instead: the wall and
  the scanner as 12 frames each from assembled to taken apart, played by scroll, and the numbers view as one image
  (desktop, and `-m` for phone framing). Re-render them after changing a model or its view:
  `npm run build && npx vite preview --port 5201 &`, then `node scripts/capture-stills.mjs` (PNG into `assets/stills`),
  then convert to WebP (quality 82, alpha kept) into `public/stills`.
- Diagnostics: open any page with `?debug` for an overlay of errors, footage events and each 3D view's WebGL state
  (also on `window.__diag`).

The demo (/demo), hardware lab (/hardware), savings calculator (/savings) and waitlist (/waitlist, /api/waitlist) are
the first site's app (`retrofit-ledger`, at retrofit-ledger-two.vercel.app). `vercel.json` passes every address this build
has no file for through to it, so they live on facade.build next to this front page.
The scanner is a concept model and the demo runs on synthetic data; the copy says so.
