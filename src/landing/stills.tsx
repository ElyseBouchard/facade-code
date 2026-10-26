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

/** Frames per pinned view, from assembled (00) to taken apart (11); rendered by scripts/capture-stills.mjs. */
export const FRAMES=12;

/** A pinned view's stills as a flipbook: scroll eases through the frames the way the live model separates (same scroll
 * range, same easing), fading each frame in over the one before, so the model still comes apart slowly. */
export function ExplodedFlipbook({name,scroll,range,onExploded}:{name:string;scroll:RefObject<number>;range:[number,number];onExploded?:(open:boolean)=>void}){
 const frames=useRef<(HTMLElement|null)[]>([]),report=useRef(onExploded);report.current=onExploded;
 useEffect(()=>{let frame=0,shown=-1,last=performance.now(),reported:boolean|null=null;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const paint=(e:number)=>{const f=e*(FRAMES-1),i=Math.min(FRAMES-2,Math.floor(f)),k=f-i;
   // The earlier frame stays solid and the next fades in over it: a plain crossfade of two cut-out drawings looks faded.
   frames.current.forEach((el,j)=>{if(el)el.style.opacity=j===i?'1':j===i+1?k.toFixed(3):'0'});
   const open=e>.5;if(open!==reported){reported=open;report.current?.(open)}};
  const step=(now:number)=>{frame=0;const target=smooth(((scroll.current??0)-range[0])/range[1]),dt=Math.min(.1,(now-last)/1000);last=now;
   shown=shown<0||reduced?target:shown+(target-shown)*(1-Math.exp(-dt*3.2));if(Math.abs(target-shown)<.0005)shown=target;
   paint(shown);if(shown!==target)frame=requestAnimationFrame(step)};
  const schedule=()=>{if(!frame){last=performance.now();frame=requestAnimationFrame(step)}};
  schedule();addEventListener('scroll',schedule,{passive:true});
  return()=>{cancelAnimationFrame(frame);removeEventListener('scroll',schedule)}},[scroll,range]);
 return <div className="viewer-still" aria-hidden="true">{Array.from({length:FRAMES},(_,j)=><span key={j} ref={el=>{frames.current[j]=el}} style={{opacity:j===0?1:0}}><StillPicture name={`${name}-${String(j).padStart(2,'0')}`}/></span>)}</div>;
}
