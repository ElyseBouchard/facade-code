import './style.css';

/* About page: the home page (index.html + src/home.tsx) carries the footage and the first site's sections. */
const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s as never) as T | null;
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s as never)] as T[];
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- symbols flicker through links on hover, then settle (the first site's scramble) ---------- */
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
for (const el of $$('[data-scramble], .menu-links a')) {
  if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', (el.textContent ?? '').replace('↗', '').trim());
  el.addEventListener('pointerenter', () => scramble(el));
}

/* ---------- mobile menu ---------- */
const menu = $<HTMLButtonElement>('.menu-toggle');
const setMenu = (open: boolean) => { document.body.classList.toggle('menu-open', open); menu?.setAttribute('aria-expanded', String(open)); if (menu) menu.textContent = open ? 'Close' : 'Menu' };
menu?.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
$$('.overlay-menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));

requestAnimationFrame(() => document.documentElement.classList.add('ready'));
