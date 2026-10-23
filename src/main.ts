import './style.css';

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s as never) as T | null;
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s as never)] as T[];
const root = document.documentElement;

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
  // Only play while the hero is on screen, so the grid below never competes with the decoder.
  new IntersectionObserver(([e]) => { if (e?.isIntersecting) play(); else video.pause() }).observe(hero);
  // A visible pause control, for anyone who would rather the footage stood still.
  const toggle = $<HTMLButtonElement>('.hero-toggle');
  toggle?.addEventListener('click', () => { held = !held; if (held) video.pause(); else play(); toggle.textContent = held ? 'Play' : 'Pause'; toggle.setAttribute('aria-pressed', String(held)) });
}

/* ---------- masthead: light over the footage, dark over the paper; the statement leaves with the hero ---------- */
const head = $('.masthead');
if (head && hero) {
  let frame = 0;
  const update = () => { frame = 0; const b = hero.getBoundingClientRect().bottom; head.classList.toggle('light', b > 30); head.classList.toggle('past-hero', b < innerHeight * .55) };
  addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(update) }, { passive: true });
  update();
} else head?.classList.remove('light');

/* ---------- mobile menu ---------- */
const toggle = $<HTMLButtonElement>('.menu-toggle');
toggle?.addEventListener('click', () => {
  const open = !document.body.classList.contains('menu-open');
  document.body.classList.toggle('menu-open', open); toggle.setAttribute('aria-expanded', String(open)); toggle.textContent = open ? 'Close' : 'Menu';
});
$$('.overlay-menu a').forEach(a => a.addEventListener('click', () => { document.body.classList.remove('menu-open'); if (toggle) { toggle.setAttribute('aria-expanded', 'false'); toggle.textContent = 'Menu' } }));

/* ---------- index: hovering a chapter numbers its images and quiets the rest ---------- */
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

/* ---------- lightbox: every image in order, with its chapter and index ---------- */
const box = $('.lightbox');
if (box && grid) {
  const tiles = $$('.tile', grid), img = $<HTMLImageElement>('figure img', box)!, caption = $('.lb-caption', box)!, count = $('.lb-count', box)!;
  const titles = new Map($$('.caption-cell', grid).map(c => [c.dataset.ch!, $('h2', c)?.textContent ?? '']));
  let at = -1, opener: HTMLElement | null = null;
  const show = (i: number) => {
    at = (i + tiles.length) % tiles.length; const t = tiles[at], source = $<HTMLImageElement>('img', t)!;
    img.src = source.dataset.full ?? source.src; img.alt = source.alt;
    caption.textContent = `${$('.tile-idx', t)?.textContent ?? ''}  ${titles.get(t.dataset.ch!) ?? ''} — ${source.alt}`;
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

/* ---------- intro, once per visit: a strip of frames crosses the paper, then the footage frame grows to fill it ---------- */
const pre = $('.preloader');
if (pre && root.classList.contains('intro')) {
  const thumbs = ['site-wide', 'wall-open', 'scanner-front', 'evidence-wall', 'site-crew', 'scanner-exploded', 'cost-site', 'site-core', 'wall-panel', 'scanner-under', 'evidence-layers', 'site-edge', 'wall-copper'];
  const strip = document.createElement('div'); strip.className = 'strip';
  for (const name of [...thumbs, ...thumbs]) { const i = new Image(); i.src = `/images/${name}-160.jpg`; i.alt = ''; strip.append(i) }
  const focusImg = new Image(); focusImg.className = 'focus'; focusImg.src = '/media/site-poster.jpg'; focusImg.alt = '';
  pre.append(strip, focusImg);
  const finish = () => { root.classList.remove('intro'); try { sessionStorage.setItem('facade-intro', '1') } catch { /* private mode */ } };
  setTimeout(() => pre.classList.add('settle'), 1100);
  setTimeout(() => { const r = focusImg.getBoundingClientRect(); focusImg.style.transform = `scale(${Math.max(innerWidth / r.width, innerHeight / r.height) * 1.02})`; pre.classList.add('grow') }, 1500);
  setTimeout(() => { finish(); pre.classList.add('done') }, 2550);
  setTimeout(() => pre.remove(), 3100);
} else pre?.remove();
