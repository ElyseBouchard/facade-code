import './style.css';

/* About page: the home page (index.html + src/home.tsx) carries the footage and the first site's sections. */
const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s as never) as T | null;
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s as never)] as T[];

/* ---------- mobile menu ---------- */
const menu = $<HTMLButtonElement>('.menu-toggle');
const setMenu = (open: boolean) => { document.body.classList.toggle('menu-open', open); menu?.setAttribute('aria-expanded', String(open)); if (menu) menu.textContent = open ? 'Close' : 'Menu' };
menu?.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
$$('.overlay-menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));

requestAnimationFrame(() => document.documentElement.classList.add('ready'));
