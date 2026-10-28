import {useEffect,useRef,type RefObject} from 'react';

/** Shared with the preview drawer so it can pause page scrolling. The page scrolls natively here (no smooth-scroll
 * library), so scrolling stays on the browser's compositor and never waits on the 3D views; nothing to pause. */
export const motionBus:{lenis:{stop():void;start():void}|null}={lenis:null};
const glyphs='WITHN*#/%^$@+';

/** Keep scroll and pointer updates outside React's render cycle. */
export function useLandingMotion(root:RefObject<HTMLDivElement|null>,{introDone,reality}:{introDone:boolean;reality:number}){
 const replay=useRef<()=>void>(()=>{});
 useEffect(()=>{
  const el=root.current;if(!el)return;
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  let teardown=()=>{};
  const setup=()=>{
   teardown();
   if(media.matches){el.classList.remove('motion-ready');replay.current=()=>{};return}
   el.classList.add('motion-ready');
   const timers=new Map<HTMLElement,number>();
   /** Reveal left to right while the unrevealed tail cycles through glyphs. */
   const scramble=(target:HTMLElement)=>{
    const text=target.dataset.scramble;if(!text)return;
    const previous=timers.get(target);if(previous)clearInterval(previous);
    let step=0;const total=Math.max(10,Math.min(26,text.length));
    const timer=window.setInterval(()=>{step++;const shown=Math.floor(text.length*(1-Math.pow(1-step/total,2)));target.textContent=[...text].map((c,i)=>c===' '||i<shown?c:glyphs[(step*3+i*7)%glyphs.length]).join('');if(step>=total){clearInterval(timer);timers.delete(target);target.textContent=text}},32);
    timers.set(target,timer);
   };
   replay.current=()=>el.querySelectorAll<HTMLElement>('.lab-hero [data-scramble],.lab-header [data-scramble]').forEach(scramble);
   const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
    const target=entry.target as HTMLElement;
    if(entry.isIntersecting){target.classList.add('is-visible');target.querySelectorAll<HTMLElement>('[data-scramble]').forEach(scramble);observer.unobserve(target)}
   }),{threshold:.12,rootMargin:'0px 0px -6% 0px'});
   el.querySelectorAll<HTMLElement>('[data-reveal]').forEach(target=>observer.observe(target));
   // The small CSS loops (bobbing drawings, the ticker, the log, the pixel thumb) pause while their section is off
   // screen; left running they keep the browser restyling the page every frame even when nothing visible moves.
   const away=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('is-away',!entry.isIntersecting)),{rootMargin:'10% 0px'});
   el.querySelectorAll<HTMLElement>('section,footer').forEach(target=>away.observe(target));
   const parallax=[...el.querySelectorAll<HTMLElement>('[data-parallax]')],spinners=[...el.querySelectorAll<HTMLElement>('[data-spin]')];
   let frame=0,scrolled=false;
   const scroll=()=>{
    if(frame)return;
    frame=requestAnimationFrame(()=>{frame=0;const height=innerHeight,y=scrollY;
     for(const target of parallax){const rect=target.getBoundingClientRect();if(rect.bottom<-200||rect.top>height+200)continue;const p=(height/2-(rect.top+rect.height/2))/height;target.style.translate=`0 ${(p*Number(target.dataset.parallax)).toFixed(1)}px`}
     for(const target of spinners)target.style.rotate=`${(y*Number(target.dataset.spin)).toFixed(2)}deg`;
     const progress=el.querySelector<HTMLElement>('.reading-progress');if(progress)progress.style.transform=`scaleX(${y/Math.max(1,document.documentElement.scrollHeight-height)})`;
     if(scrolled!==y>60){scrolled=y>60;el.classList.toggle('is-scrolled',scrolled)}
    });
   };
   // The cursor moves by transform on its own node so pointer motion never restyles the page.
   const cursor=el.querySelector<HTMLElement>('.lab-cursor'),label=cursor?.querySelector<HTMLElement>('.cursor-label');
   const pointer=(event:PointerEvent)=>{
    if(event.pointerType!=='mouse'||!cursor)return;
    cursor.style.transform=`translate3d(${event.clientX}px,${event.clientY}px,0)`;
    if(!el.classList.contains('has-pointer'))el.classList.add('has-pointer');
   };
   const leave=()=>el.classList.remove('has-pointer');
   const over=(event:Event)=>{
    const target=event.target as Element;
    if(!cursor)return;const hint=target.closest<HTMLElement>('[data-cursor]')?.dataset.cursor??'';
    cursor.classList.toggle('is-active',!!target.closest('a,button,summary,[tabindex="0"],canvas'));cursor.classList.toggle('has-label',!!hint);if(label&&label.textContent!==hint)label.textContent=hint;
   };
   // Inspection tiles: squares that light up over the scanner as the pointer crosses it.
   const model=el.querySelector<HTMLElement>('.lab-model'),tiles=el.querySelector<HTMLElement>('.model-tiles');let lastTile=0;
   const tile=(event:PointerEvent)=>{
    if(event.pointerType!=='mouse'||!model||!tiles)return;const now=performance.now();if(now-lastTile<110)return;lastTile=now;
    const rect=model.getBoundingClientRect(),size=Math.round(rect.width*(.07+Math.random()*.05)),snap=size*.5;
    const x=Math.round((event.clientX-rect.left-size/2)/snap)*snap,y=Math.round((event.clientY-rect.top-size/2)/snap)*snap;
    const square=document.createElement('i');square.className='model-tile';square.style.cssText=`left:${x}px;top:${y}px;width:${size}px;height:${size}px`;
    square.addEventListener('animationend',()=>square.remove());tiles.append(square);while(tiles.children.length>7)tiles.firstElementChild?.remove();
   };
   el.addEventListener('pointermove',pointer);el.addEventListener('pointerleave',leave);el.addEventListener('pointerover',over);el.addEventListener('focusin',over);model?.addEventListener('pointermove',tile);window.addEventListener('scroll',scroll,{passive:true});scroll();
   teardown=()=>{observer.disconnect();away.disconnect();el.querySelectorAll('.is-away').forEach(target=>target.classList.remove('is-away'));cancelAnimationFrame(frame);timers.forEach((id,target)=>{clearInterval(id);target.textContent=target.dataset.scramble??''});el.removeEventListener('pointermove',pointer);el.removeEventListener('pointerleave',leave);el.removeEventListener('pointerover',over);el.removeEventListener('focusin',over);model?.removeEventListener('pointermove',tile);window.removeEventListener('scroll',scroll);el.classList.remove('motion-ready','has-pointer');replay.current=()=>{}};
  };
  setup();media.addEventListener('change',setup);return()=>{teardown();media.removeEventListener('change',setup)};
 },[root]);
 // Hero labels re-scramble once the intro clears and after every change of reality.
 useEffect(()=>{if(introDone)replay.current()},[introDone,reality]);
}
