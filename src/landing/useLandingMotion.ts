import {useEffect,type RefObject} from 'react';

/** The page's only scripted motion, kept outside React's render cycle: each section fades up once as it arrives, any
 * running loop rests while its section is off screen, and a thin bar shows how far down the page you are. Nothing
 * moves on its own for decoration, and nothing follows the pointer. */
export function useLandingMotion(root:RefObject<HTMLDivElement|null>){
 useEffect(()=>{
  const el=root.current;if(!el)return;
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  let teardown=()=>{};
  const setup=()=>{
   teardown();
   const reduced=media.matches;el.classList.toggle('motion-ready',!reduced);
   const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');reveal.unobserve(entry.target)}}),{threshold:.12,rootMargin:'0px 0px -6% 0px'});
   if(!reduced)el.querySelectorAll<HTMLElement>('[data-reveal]').forEach(target=>reveal.observe(target));
   // A loop left running off screen keeps the browser restyling the page every frame even when nothing visible moves.
   const away=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('is-away',!entry.isIntersecting)),{rootMargin:'10% 0px'});
   el.querySelectorAll<HTMLElement>('section,footer').forEach(target=>away.observe(target));
   const progress=el.querySelector<HTMLElement>('.reading-progress');let frame=0;
   const scroll=()=>{if(frame)return;frame=requestAnimationFrame(()=>{frame=0;if(progress)progress.style.transform=`scaleX(${scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)})`})};
   addEventListener('scroll',scroll,{passive:true});scroll();
   teardown=()=>{reveal.disconnect();away.disconnect();cancelAnimationFrame(frame);removeEventListener('scroll',scroll);el.querySelectorAll('.is-away').forEach(target=>target.classList.remove('is-away'));el.classList.remove('motion-ready')};
  };
  setup();media.addEventListener('change',setup);return()=>{teardown();media.removeEventListener('change',setup)};
 },[root]);
}
