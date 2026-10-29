import {Component,Fragment,lazy,Suspense,useEffect,useLayoutEffect,useRef,useState,type ReactNode,type RefObject} from 'react';
import {SplitLetters} from './LandingDetails';
import type {WallSystem} from './WallViewer';
import {useCopy} from './i18n';
const WallViewer=lazy(()=>import('./WallViewer'));
const systems:WallSystem[]=['mechanical','electrical','plumbing'];

/** If the 3D code cannot load at all, show a status line in its place instead of taking the page down with it. */
export class ViewerBoundary extends Component<{fallback:ReactNode;children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true}}
 render(){return this.state.failed?this.props.fallback:this.props.children}
}

/** Progress (0–1) through a pinned section, kept in a ref and mirrored to a CSS variable for small parallax moves. */
export function usePinnedProgress(section:RefObject<HTMLElement|null>,variable?:string){
 // Unpinned (one-screen) sections still get a smooth 0–1 over the first ~60% of a viewport of scrolling.
 // The CSS variable is optional: setting it restyles the whole section on every scrolled frame, so only pass one
 // that a stylesheet actually reads.
 const progress=useRef(0);
 useEffect(()=>{const el=section.current;if(!el)return;let frame=0;
  const update=()=>{frame=0;const rect=el.getBoundingClientRect(),range=Math.max(innerHeight*.6,rect.height-innerHeight),p=Math.min(1,Math.max(0,-rect.top/range));progress.current=p;if(variable)el.style.setProperty(variable,p.toFixed(4))};
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update)};update();addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);
  return()=>{cancelAnimationFrame(frame);removeEventListener('scroll',schedule);removeEventListener('resize',schedule)}},[section,variable]);
 return progress;
}

/** Whether a 3D view should start yet: when its section comes within `margin` of view, or earlier once the page has
 * loaded and the browser is idle (after `after` ms), so the footage and fonts never compete with a model download,
 * a WebGL context and shader compiles, yet the model is usually ready before anyone scrolls to it. Stays true. */
export function useStartWhenNear(section:RefObject<HTMLElement|null>,after:number,margin='100% 0px'){
 const [start,setStart]=useState(false);
 useEffect(()=>{const el=section.current;if(!el||start)return;let timer=0,idle=0;
  const go=()=>setStart(true);
  const near=new IntersectionObserver(e=>{if(e[0]?.isIntersecting)go()},{rootMargin:margin});near.observe(el);
  // Safari before 18 has no idle callback; a plain timeout stands in.
  const idleOk=typeof requestIdleCallback==='function';
  const later=()=>{timer=window.setTimeout(()=>{if(idleOk)idle=requestIdleCallback(go,{timeout:2000});else go()},after)};
  if(document.readyState==='complete')later();else addEventListener('load',later,{once:true});
  return()=>{near.disconnect();clearTimeout(timer);if(idle)cancelIdleCallback(idle);removeEventListener('load',later)}},[section,after,margin,start]);
 return start;
}

/** First page: a pinned stage where the sample wall turns, and scrolling or dragging separates it into an exploded axonometric. */
export function WallHero({reality,cycle,ready,openDemo}:{reality:number;cycle:number;ready:boolean;openDemo:(step?:number)=>void}){
 const section=useRef<HTMLElement>(null),progress=usePinnedProgress(section,'--hero-p');
 const [hovered,setHovered]=useState<WallSystem|null>(null),[pinned,setPinned]=useState<WallSystem|null>(null),[exploded,setExploded]=useState(false);
 const {t}=useCopy(),h=t.hero;
 // Longer translations scale the headline down to fit its column, measured as rendered (scripts differ in width).
 const title=useRef<HTMLHeadingElement>(null);
 useLayoutEffect(()=>{const el=title.current,column=el?.parentElement;if(!el||!column)return;
  const fit=()=>{el.style.setProperty('--fit','1');const widest=Math.max(0,...[...el.querySelectorAll<HTMLElement>('.split-line')].map(line=>line.getBoundingClientRect().width)),room=el.clientWidth;el.style.setProperty('--fit',widest>room?(room/widest*.97).toFixed(3):'1')};
  fit();const watch=new ResizeObserver(fit);watch.observe(column);void document.fonts?.ready.then(fit);return()=>watch.disconnect()},[h.titleText]);
 return <section ref={section} className="wall-hero" aria-labelledby="lab-title"><div className="wall-stage">
  <div className="hero-copy">
   <h1 ref={title} id="lab-title" className="hero-title" key={`${cycle}-${h.titleText}`}><span className="sr-only">{h.titleText}</span>{h.title.map((line,i)=><Fragment key={i}>{i>0&&<br/>}<SplitLetters text={line}/></Fragment>)}</h1>
   <p className="hero-sub">{h.sub}</p>
   <div className="hero-actions"><button className="lab-demo" onClick={()=>openDemo()} disabled={!ready}>{h.demo}</button><nav className="hero-links" aria-label={h.linksLabel}><a href="/savings">{h.savings}</a><a href="/waitlist">{h.waitlist}</a></nav></div>
  </div>
  <div className="wall-frame"><ViewerBoundary fallback={<p className="wall-status" role="status">{t.wall.failed}</p>}><Suspense fallback={<p className="wall-status">{t.wall.loading}</p>}><WallViewer reality={reality} focus={hovered??pinned} scroll={progress} onExploded={setExploded} text={t.wall}/></Suspense></ViewerBoundary></div>
  <div className="wall-legend" role="group" aria-label={h.legendLabel}>{systems.map((key,i)=>{const [letter,name]=h.systems[i];return <button key={key} className={`legend-item system-${key}`} aria-pressed={pinned===key} onPointerEnter={()=>setHovered(key)} onPointerLeave={()=>setHovered(null)} onFocus={()=>setHovered(key)} onBlur={()=>setHovered(null)} onClick={()=>setPinned(p=>p===key?null:key)}><i aria-hidden="true"/><b>{letter}</b>{name}</button>})}</div>
  <div className="wall-notes"><p className="wall-hint">{exploded?h.hintOpen:h.hintClosed}</p><p className="wall-caption">{h.caption}</p></div>
  <span className="scroll-cue" aria-hidden="true"><i/>{h.scroll}</span>
 </div></section>
}
