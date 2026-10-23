import './style.css';

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s as never) as T | null;
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s as never)] as T[];
const root = document.documentElement;
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- hero footage: autoplays from the HTML (muted, inline, 720p on small screens); the script keeps it going ---------- */
const hero = $('.hero');
const video = $<HTMLVideoElement>('.hero video');
if (hero && video) {
  video.muted = video.defaultMuted = true;
  let held = false;
  const play = () => { if (!held) void video.play().catch(() => {}) };
  play();
  // Some browsers hold autoplay (iPhone Low Power Mode, "never auto-play" settings) until the first touch, scroll or key.
  const nudge = () => { if (video.paused) play() };
  for (const type of ['pointerdown', 'touchstart', 'keydown', 'scroll']) addEventListener(type, nudge, { once: true, passive: true });
  // Only play while the hero is on screen, so the index below never competes with the decoder.
  new IntersectionObserver(([e]) => { if (e?.isIntersecting) play(); else video.pause() }).observe(hero);
  const toggle = $<HTMLButtonElement>('.hero-toggle');
  toggle?.addEventListener('click', () => { held = !held; if (held) video.pause(); else play(); toggle.textContent = held ? 'Play' : 'Pause'; toggle.setAttribute('aria-pressed', String(held)) });
}

/* ---------- headline: each letter flickers in once the intro hands over, in a scattered order ---------- */
const lines = $$('.hero-title .line');
const letters = lines.reduce((n, l) => n + (l.textContent?.length ?? 0), 0);
let k = 0;
for (const line of lines) {
  const text = line.textContent ?? ''; line.textContent = '';
  for (const c of text) { const s = document.createElement('span'); s.className = 'l'; s.textContent = c; s.style.setProperty('--d', String((k++ * 7919) % letters)); line.append(s) }
}
// Each line stays whole; on narrow screens the headline scales down until its widest line fits the column (as on the first site).
const title = $('.hero-title');
if (title) {
  const fit = () => {
    title.style.setProperty('--fit', '1');
    const widest = Math.max(0, ...lines.map(l => l.getBoundingClientRect().width)), room = title.clientWidth;
    title.style.setProperty('--fit', widest > room ? (room / widest * .98).toFixed(3) : '1');
  };
  fit(); new ResizeObserver(fit).observe(title.parentElement!); void document.fonts?.ready.then(fit);
}

/* ---------- masthead light over the footage; a red reading line along the bottom ---------- */
const head = $('.masthead'), progress = $('.reading-progress');
{
  let frame = 0;
  const update = () => {
    frame = 0;
    if (head && hero) head.classList.toggle('light', hero.getBoundingClientRect().bottom > 40);
    if (progress) progress.style.transform = `scaleX(${scrollY / Math.max(1, root.scrollHeight - innerHeight)})`;
  };
  addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(update) }, { passive: true });
  addEventListener('resize', update);
  update();
}

/* ---------- symbols flicker through numbers and links on hover, then settle (the first site's scramble) ---------- */
const GLYPHS = '#$%&*+/<>=?@^~!';
const scramble = (el: HTMLElement) => {
  if (el.dataset.scrambling || still) return;
  const text = el.textContent ?? '', chars = [...text], total = 14; let step = 0; el.dataset.scrambling = '1';
  const id = setInterval(() => {
    step++; const shown = Math.floor(chars.length * Math.max(0, step - 4) / (total - 4));
    el.textContent = chars.map((c, i) => c === ' ' || c === '↗' || i < shown ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join('');
    if (step >= total) { clearInterval(id); el.textContent = text; delete el.dataset.scrambling }
  }, 38);
};
for (const el of $$('[data-scramble], .menu-links a, .hero-links a, .foot-links a')) {
  if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', (el.textContent ?? '').replace('↗', '').trim());
  el.addEventListener('pointerenter', () => scramble(el));
}

/* ---------- mobile menu ---------- */
const menu = $<HTMLButtonElement>('.menu-toggle');
const setMenu = (open: boolean) => { document.body.classList.toggle('menu-open', open); menu?.setAttribute('aria-expanded', String(open)); if (menu) menu.textContent = open ? 'Close' : 'Menu' };
menu?.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
$$('.overlay-menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));

/* ---------- index: hovering a chapter numbers its images in red and quiets the rest ---------- */
const grid = $('.project-grid');
if (grid) {
  let current = '';
  const focus = (ch: string) => {
    if (ch === current) return; current = ch;
    grid.classList.toggle('focusing', !!ch);
    for (const t of $$('.tile', grid)) t.classList.toggle('on', !!ch && t.dataset.ch === ch);
  };
  grid.addEventListener('pointerover', e => { const cell = (e.target as Element).closest<HTMLElement>('[data-ch]'); if (cell) focus(cell.dataset.ch!) });
  grid.addEventListener('pointerleave', () => focus(''));
  grid.addEventListener('focusin', e => { const cell = (e.target as Element).closest<HTMLElement>('[data-ch]'); if (cell) focus(cell.dataset.ch!) });
  grid.addEventListener('focusout', e => { if (!grid.contains(e.relatedTarget as Node)) focus('') });
}

/* ---------- viewer: every image in order, with its chapter and index ---------- */
const box = $('.lightbox');
if (box) {
  const tiles = $$('main .tile'), img = $<HTMLImageElement>('figure img', box)!, caption = $('.lb-caption', box)!, count = $('.lb-count', box)!;
  const titles = new Map($$('.caption-cell[data-ch]').map(c => [c.dataset.ch!, $('h2, h3', c)?.textContent ?? '']));
  let at = -1, opener: HTMLElement | null = null;
  const show = (i: number) => {
    at = (i + tiles.length) % tiles.length; const t = tiles[at], source = $<HTMLImageElement>('img', t)!;
    img.src = source.dataset.full ?? source.src; img.alt = source.alt;
    caption.replaceChildren(Object.assign(document.createElement('span'), { className: 'num', textContent: $('.tile-idx', t)?.textContent ?? '' }), `${titles.get(t.dataset.ch!) ?? ''} ${source.alt}`);
    count.textContent = `${at + 1} / ${tiles.length}`;
  };
  const open = (i: number, from: HTMLElement) => { opener = from; show(i); box.classList.add('open'); root.style.overflow = 'hidden'; $<HTMLButtonElement>('.lb-close', box)?.focus() };
  const close = () => { box.classList.remove('open'); root.style.overflow = ''; opener?.focus() };
  tiles.forEach((t, i) => $('button', t)?.addEventListener('click', e => open(i, e.currentTarget as HTMLElement)));
  $('.lb-close', box)?.addEventListener('click', close);
  $('.lb-prev', box)?.addEventListener('click', () => show(at - 1));
  $('.lb-next', box)?.addEventListener('click', () => show(at + 1));
  box.addEventListener('click', e => { if (e.target === box || (e.target as Element).tagName === 'FIGURE') close() });
  addEventListener('keydown', e => {
    if (!box.classList.contains('open')) return;
    if (e.key === 'Escape') close(); else if (e.key === 'ArrowRight') show(at + 1); else if (e.key === 'ArrowLeft') show(at - 1);
    else if (e.key === 'Tab') { const f = $$<HTMLButtonElement>('button', box), first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() } }
  });
}

/* ---------- intro, once per visit: the FACADE mark flickers in, a strip of frames crosses, the footage frame grows ---------- */
const pre = $('.preloader');
const ready = () => root.classList.add('ready');
if (pre && root.classList.contains('intro')) {
  const mark = $('.site-foot .mixed-wordmark')?.cloneNode(true) as HTMLElement | undefined;
  const thumbs = ['site-wide', 'wall-open', 'scanner-front', 'evidence-wall', 'site-crew', 'scanner-exploded', 'cost-site', 'site-core', 'wall-panel', 'scanner-under', 'evidence-layers', 'site-edge', 'wall-copper'];
  const strip = document.createElement('div'); strip.className = 'strip';
  for (const name of [...thumbs, ...thumbs]) { const i = new Image(); i.src = `/images/${name}-160.jpg`; i.alt = ''; strip.append(i) }
  const focusImg = new Image(); focusImg.className = 'focus'; focusImg.src = '/media/site-poster.jpg'; focusImg.alt = '';
  pre.append(...(mark ? [mark] : []), strip, focusImg);
  const finish = () => { root.classList.remove('intro'); ready(); try { sessionStorage.setItem('facade-intro', '1') } catch { /* private mode */ } };
  setTimeout(() => pre.classList.add('settle'), 1200);
  setTimeout(() => { const r = focusImg.getBoundingClientRect(); focusImg.style.transform = `scale(${Math.max(innerWidth / r.width, innerHeight / r.height) * 1.02})`; pre.classList.add('grow') }, 1600);
  setTimeout(() => { finish(); pre.classList.add('done') }, 2650);
  setTimeout(() => pre.remove(), 3200);
} else { pre?.remove(); requestAnimationFrame(ready) }
