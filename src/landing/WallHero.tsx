import {Component,useEffect,useRef,useState,type CSSProperties,type ReactNode,type RefObject} from 'react';

/** If the 3D code cannot load at all, show a status line in its place instead of taking the page down with it. */
export class ViewerBoundary extends Component<{fallback:ReactNode;children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true}}
 render(){return this.state.failed?this.props.fallback:this.props.children}
}

/** What a 3D view shows until it is ready: its name and a thin bar, filled to `pct` when the download reports progress
 * and running when it doesn't. */
export function ViewerLoading({label,pct}:{label:string;pct?:number}){
 return <div className="viewer-loading" role="status"><span>{label}</span><i data-pct={pct===undefined?undefined:pct} style={pct===undefined?undefined:{'--p':pct/100} as CSSProperties}/></div>
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
