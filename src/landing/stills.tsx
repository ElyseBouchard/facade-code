import {useEffect,useRef,type RefObject} from 'react';

/* When a browser can't keep a WebGL context (it is lost straight away, or again soon after it comes back), the 3D views
   give up instead of looping, and show still images rendered from the same views (public/stills, made by
   scripts/capture-stills.mjs). Safari with broken WebGL loses and restores a context thousands of times a second if the
   page keeps asking for it back, which is what three.js does on every loss: that stalls the whole page. */

/** Calls `onFail` once if the context is lost before `ready()` is called, or twice within five seconds after. */
export function guardContext(canvas:HTMLCanvasElement,onFail:()=>void){
 let ready=false,lastLoss=-Infinity,failed=false;
 const lost=()=>{const now=performance.now();if(!ready||now-lastLoss<5000)fail();lastLoss=now};
 const fail=()=>{if(failed)return;failed=true;canvas.removeEventListener('webglcontextlost',lost);onFail()};
 canvas.addEventListener('webglcontextlost',lost);
 return {ready(){ready=true},stop(){canvas.removeEventListener('webglcontextlost',lost)}};
}

const smooth=(x:number)=>{const t=Math.min(1,Math.max(0,x));return t*t*(3-2*t)};
const src=(name:string,narrow:boolean)=>`/stills/${name}${narrow?'-m':''}.webp`;

/** One still, desktop or phone framing. */
export function StillPicture({name,className,style}:{name:string;className?:string;style?:React.CSSProperties}){
 return <picture className={className} style={style}><source media="(max-width: 767px)" srcSet={src(name,true)}/><img src={src(name,false)} alt="" decoding="async"/></picture>;
}

/** The assembled and taken-apart stills of a pinned view, swapped by the same scroll progress that explodes the model.
 * The swap is a short crossfade around the middle, so the two drawings are seen over each other only briefly. */
export function ExplodedStill({name,scroll,range,onExploded}:{name:string;scroll:RefObject<number>;range:[number,number];onExploded?:(open:boolean)=>void}){
 const closed=useRef<HTMLElement>(null),open=useRef<HTMLElement>(null),report=useRef(onExploded);report.current=onExploded;
 useEffect(()=>{let frame=0,last=-1;
  const update=()=>{frame=0;const t=smooth(((scroll.current??0)-range[0])/range[1]),k=smooth((t-.4)/.2);
   if(open.current)open.current.style.opacity=k.toFixed(3);if(closed.current)closed.current.style.opacity=(1-k).toFixed(3);
   const exploded=t>.5;if(exploded!==(last>.5)||last<0)report.current?.(exploded);last=t};
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update)};update();addEventListener('scroll',schedule,{passive:true});
  return()=>{cancelAnimationFrame(frame);removeEventListener('scroll',schedule)}},[scroll,range]);
 return <div className="viewer-still" aria-hidden="true"><span ref={closed}><StillPicture name={`${name}-closed`}/></span><span ref={open} style={{opacity:0}}><StillPicture name={`${name}-open`}/></span></div>;
}
