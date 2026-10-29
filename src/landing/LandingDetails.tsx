import {useEffect,useMemo,useRef,useState,useId,type CSSProperties} from 'react';
import {useCopy} from './i18n';

export const realities=['lab','blueprint','cyber'] as const;
export const realityNames=['Lab','Blueprint','Cyber'];
const vars=(v:Record<string,string|number>)=>v as CSSProperties;

export function RealityGlobe(){return <svg className="reality-globe" viewBox="0 0 40 24" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="1"><ellipse cx="20" cy="12" rx="17" ry="10"/><ellipse className="meridian m1" cx="20" cy="12" rx="11" ry="10"/><ellipse className="meridian m2" cx="20" cy="12" rx="4" ry="10"/><path d="M3 12h34M6 6.5h28M6 17.5h28"/></g></svg>}

/** Letters are decorative copies; the parent carries the accessible text. Arabic and Devanagari join letters into shapes,
 so they flicker in word by word instead of being cut apart. */
const joinedScript=/[\u0600-\u06ff\u0750-\u077f\u0900-\u097f\ufb50-\ufdff\ufe70-\ufeff]/;
export function SplitLetters({text}:{text:string}){
 const units=useMemo(()=>joinedScript.test(text)?text.split(/(\s+)/).filter(Boolean):[...text],[text]);
 return <span className="split-line" aria-hidden="true">{units.map((c,i)=><span key={i} className="split-letter" style={vars({'--d':(i*7919)%units.length})}>{c}</span>)}</span>
}
export function Words({text,from=0}:{text:string;from?:number}){
 const words=text.split(' ');return <>{words.map((w,i)=><span key={i}><span className="w" style={vars({'--i':from+i})}>{w}</span>{i<words.length-1?' ':''}</span>)}</>
}
export function Spark({className=''}:{className?:string}){return <span className={`spark ${className}`} aria-hidden="true"><svg viewBox="0 0 40 44"><path className="spark-a" d="M13 27.7c8.3-.2 12-3.8 14.1-9.1l.8-1.9c.5-1.4 1-2.8 1.6-4.2-.2 1.4-.3 2.8-.4 4.2-.1 1.6-.2 3.2-.2 4.8.1 2.9 1.4 4.7 4.3 5.5 1.9.5 3.9.8 5.8 1.2l.4.1-.4.1-4.7.7c-4.5.7-8 3.4-9.7 7.6-.9 2.1-1.6 4.2-2.4 6.3-.2.4-.4.7-.7 1 .3-2.2.6-4.5.8-6.7v-2c-.2-2.8-2-5-4.7-5.8-1.1-.3-2.2-.5-3.3-.7-.7-.1-1.4-.3-2.1-.4L13 27.7Z"/><path className="spark-b" d="M2.4 15.2c8.3-.2 12.1-3.8 14.1-9.1l.8-1.9C17.8 2.8 18.4 1.4 19 0c-.2 1.4-.3 2.8-.5 4.2-.1 1.6-.2 3.2-.2 4.7.1 3 1.4 4.7 4.4 5.5 1.9.5 3.9.8 5.8 1.2l.4.1-.4.1-4.7.7c-4.5.7-8 3.4-9.7 7.6-.9 2.1-1.6 4.2-2.4 6.3-.2.4-.4.7-.7 1 .3-2.2.6-4.5.8-6.7v-2c-.2-2.8-2-5-4.7-5.8-1.1-.3-2.2-.5-3.3-.7-.7-.1-1.4-.3-2.1-.4l-1.7-.6Z"/></svg></span>}

const wordmarkFonts=['f-bitter','f-haas','f-cyber','f-montreal','f-bitter','f-haas','f-cyber','f-montreal','f-bitter'];
const wordmarkTones=['t0','t1','t0','t2','t0','t1','t0','t2','t0'];
/** The FACADE wordmark set in all four reality typefaces, like a specimen. */
export function MixedWordmark({className=''}:{className?:string}){
 return <span className={`mixed-wordmark ${className}`} aria-label="Facade" role="img">{[...'FACADE'].map((c,i)=>c===' '?<span key={i} className="mw-space"/>:<span key={i} aria-hidden="true" className={`mw ${wordmarkFonts[i%9]} ${wordmarkTones[i%9]}`} style={vars({'--i':i})}>{c}</span>)}</span>
}

export function GridOverlay(){return <div className="lab-grid" aria-hidden="true">{[0,1,2,3,4,5,6,7,8].map(i=><i key={i} className={`grid-cross c${i}`}/>)}</div>}

/** A short, timed intro like the reference loader; skipped for reduced motion and after the first visit in a session. */
export function IntroLoader({onDone}:{onDone:()=>void}){
 const {t}=useCopy();const [pct,setPct]=useState(0),[leaving,setLeaving]=useState(false);const done=useRef(onDone);done.current=onDone;
 useEffect(()=>{let frame=0,timer=0,finished=false;const steps=[[10,.34],[25,.27],[35,.27],[55,.27],[70,.27],[100,.4]];let from=0,stepIndex=0,stepStart=performance.now();
  const ease=(t:number)=>1-Math.pow(1-t,2.2);
  const finish=()=>{if(finished)return;finished=true;cancelAnimationFrame(frame);clearTimeout(fallback);setPct(100);setLeaving(true);timer=window.setTimeout(()=>done.current(),760)};
  const tick=(now:number)=>{const [to,duration]=steps[stepIndex];const t=Math.min(1,(now-stepStart)/(duration*1000));setPct(Math.round(from+(to-from)*ease(t)));
   if(t>=1){from=to;stepIndex++;stepStart=now;if(stepIndex>=steps.length){void (document.fonts?.ready??Promise.resolve()).then(finish);return}}frame=requestAnimationFrame(tick)};
  // Never hold the page longer than ~3s, even when frames are throttled in a background tab.
  const fallback=window.setTimeout(finish,3200);
  frame=requestAnimationFrame(tick);return()=>{finished=true;cancelAnimationFrame(frame);clearTimeout(timer);clearTimeout(fallback)}},[]);
 return <div className={`intro-loader ${leaving?'is-leaving':''}`} aria-hidden="true"><GridOverlay/><MixedWordmark className="intro-mark"/><span className="intro-count">{t.loading} {pct}%</span><i className="intro-bar" style={{transform:`scaleX(${pct/100})`}}/></div>
}

export function RealityVeil({phase,target}:{phase:'idle'|'out'|'in';target:number}){
 const [pct,setPct]=useState(0);
 useEffect(()=>{if(phase!=='out')return;let frame=0;const start=performance.now();const tick=(now:number)=>{const t=Math.min(1,(now-start)/620);setPct(Math.round(100*(1-Math.pow(1-t,3))));if(t<1)frame=requestAnimationFrame(tick)};setPct(0);frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[phase]);
 return <div className={`reality-veil veil-${phase}`} aria-hidden="true"><div className="veil-panel"><span>ENTERING {realityNames[target].toUpperCase()} REALITY</span><span>{pct}%</span><i style={{transform:`scaleX(${pct/100})`}}/></div></div>
}

/** Small animated thumbnail beside the hero index, redrawn per reality. */
export function IndexThumb(){return <div className="index-thumb" aria-hidden="true"><div className="thumb-lab">{Array.from({length:24},(_,i)=><i key={i} style={vars({'--i':(i*7)%24})}/>)}</div><div className="thumb-bp">{[38,62,30,80,46].map((h,i)=><i key={i} style={vars({'--h':`${h}%`,'--i':i})}><b>{h}</b></i>)}</div><svg className="thumb-cy" viewBox="0 0 40 60"><g fill="none" stroke="currentColor"><circle cx="20" cy="30" r="14"/><circle cx="20" cy="30" r="8" strokeDasharray="2 3"/><path d="M20 10v6M20 44v6M4 30h6M30 30h6"/><circle cx="20" cy="30" r="2" fill="currentColor"/></g></svg></div>}

export function Barcode({bars=28,className=''}:{bars?:number;className?:string}){const id=useId();let x=0;const rects=[];for(let i=0;i<bars;i++){const w=[1,2,1,3,1,1,2][(i*5+id.length)%7];rects.push(<rect key={i} x={x} y="0" width={w} height="10"/>);x+=w+[1,2,1][(i*3)%3]}return <svg className={`barcode ${className}`} viewBox={`0 0 ${x} 10`} preserveAspectRatio="none" aria-hidden="true"><g fill="currentColor">{rects}</g></svg>}

/** Square terminal used at the end of thin connector lines. */
export function Node({x,y,className=''}:{x:number;y:number;className?:string}){return <i className={`node ${className}`} style={{left:`${x}%`,top:`${y}%`}} aria-hidden="true"/>}
/** Percent paths (M/L pairs, H, V) redrawn in the box's own pixels, so strokes stay 1px and pathLength drives the line-draw. */
function usePixelPaths(paths:string[]){
 const ref=useRef<SVGSVGElement>(null);const [box,setBox]=useState({w:100,h:100});
 useEffect(()=>{const el=ref.current;if(!el)return;const measure=()=>{const r=el.getBoundingClientRect();if(r.width&&r.height)setBox(b=>Math.abs(b.w-r.width)<.5&&Math.abs(b.h-r.height)<.5?b:{w:r.width,h:r.height})};measure();const observer=new ResizeObserver(measure);observer.observe(el);return()=>observer.disconnect()},[]);
 const scaled=useMemo(()=>paths.map(d=>d.replace(/([MLHV])\s*([\d.-]+)(?:\s+([\d.-]+))?/g,(_,cmd:string,a:string,b?:string)=>cmd==='H'?`H${(+a*box.w/100).toFixed(1)}`:cmd==='V'?`V${(+a*box.h/100).toFixed(1)}`:`${cmd}${(+a*box.w/100).toFixed(1)} ${(+(b??0)*box.h/100).toFixed(1)}`)),[paths,box]);
 return {ref,box,scaled};
}
export function Connectors({paths,className=''}:{paths:string[];className?:string}){const {ref,box,scaled}=usePixelPaths(paths);return <svg ref={ref} className={`lab-connectors ${className}`} viewBox={`0 0 ${box.w} ${box.h}`} aria-hidden="true"><g fill="none" stroke="currentColor">{scaled.map((d,i)=><path key={i} d={d} pathLength={1} style={vars({'--i':i})}/>)}</g></svg>}

/** A leader that leaves a window's lower-left corner and ends on a square terminal. */
const tailPath=['M100 0 L86 100 H0'];
export function Tail({className=''}:{className?:string}){const {ref,box,scaled}=usePixelPaths(tailPath);return <span className={`tail ${className}`} aria-hidden="true"><svg ref={ref} viewBox={`0 0 ${box.w} ${box.h}`}><path d={scaled[0]} pathLength={1}/></svg><i className="node"/></span>}

export function WireCube(){return <div className="wire-cube" aria-hidden="true"><div className="cube">{['front','back','left','right','top','bottom'].map(f=><i key={f} className={`face ${f}`}/>)}<i className="floor f1"/><i className="floor f2"/></div></div>}

const iconBox={docs:'6 1 32 31',link:'2 7 44 18',target:'6 -2 36 36',duct:'2 2 40 34'};
export function InlineIcon({kind}:{kind:'docs'|'link'|'target'|'duct'}){
 return <span className={`inline-icon icon-${kind}`} aria-hidden="true"><svg viewBox={iconBox[kind]}>{kind==='docs'?<g><rect x="14" y="3" width="20" height="26" rx="1"/><rect x="9" y="6" width="20" height="24" rx="1" className="fill"/><path d="M13 13h12M13 17h12M13 21h8"/></g>:kind==='link'?<g><rect x="4" y="9" width="24" height="14" rx="7" className="link-a"/><rect x="20" y="9" width="24" height="14" rx="7" className="link-b"/></g>:kind==='target'?<g><circle cx="24" cy="16" r="12"/><circle cx="24" cy="16" r="5" className="fill"/><path d="M24 0v8M24 24v8M8 16h8M32 16h8"/></g>:<g><path d="M4 22h16a8 8 0 0 0 8-8V4h12v10a20 20 0 0 1-20 20H4Z" className="fill"/><path d="M10 22v12M28 10h12"/></g>}</svg></span>
}

export function FieldDrawing({kind=0}:{kind?:number}){const gridId=useId(),d=useCopy().t.drawings;return <svg className={`field-drawing drawing-${kind}`} viewBox="0 0 400 280" role="img" aria-label={d.aria[kind]}>
 <defs><pattern id={gridId} width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="currentColor" strokeOpacity=".1"/></pattern></defs><rect width="400" height="280" fill={`url(#${gridId})`}/>
 {kind===0?<g fill="none" stroke="currentColor"><path strokeWidth="3" d="M50 45H350V235H50ZM50 135H170V45M170 135V235M260 45V150H350"/><path strokeWidth="1" d="M90 135a40 40 0 0 0-40-40M170 190a40 40 0 0 1 40 40M260 110a40 40 0 0 0 40 40"/><path strokeDasharray="4 4" d="M80 80L205 80L205 180L310 180"/><g className="scan-sweep"><path d="M205 180L70 70L325 50Z" fill="currentColor" fillOpacity=".07"/><circle cx="205" cy="180" r="12"/><circle cx="205" cy="180" r="4" fill="currentColor"/></g><g fontSize="9" fill="currentColor" stroke="none"><text x="65" y="65">{d.zoneA}</text><text x="275" y="65">{d.zoneB}</text><text x="65" y="260">{d.coverage}</text></g></g>:kind===1?<g fill="none" stroke="currentColor"><path d="M50 40V230H365"/><path className="chart-line" strokeWidth="2" d="M50 70L125 115L210 155L290 175L365 205"/><path className="chart-line" strokeDasharray="4 4" d="M50 160L125 165L210 185L290 195L365 220"/><path className="chart-line" d="M50 110L125 150L210 175L290 190L365 210"/>{[70,110,160].map(y=><circle key={y} cx="50" cy={y} r="4" fill="currentColor"/>)}<g fill="currentColor" stroke="none" fontSize="10"><text x="50" y="28">{d.cost}</text><text x="50" y="252">{d.options[0]}</text><text x="165" y="252">{d.options[1]}</text><text x="280" y="252">{d.options[2]}</text></g></g>:<g stroke="currentColor"><rect x="100" y="25" width="200" height="235" fill="var(--paper)"/><path d="M120 65H280M120 100H245M120 115H265M120 130H240M120 170H280M120 195H280M120 220H230" opacity=".6"/><text x="120" y="50" fill="currentColor" stroke="none" fontSize="11">{d.draft}</text><rect className="report-stamp" x="210" y="195" width="110" height="35" fill="var(--paper)"/><text x="220" y="217" fill="currentColor" stroke="none" fontSize="9">{d.human}</text></g>}
 </svg>}


export function FieldCollage(){
 const {lang,t}=useCopy(),c=t.collage,log=c.log;
 return <section className="lab-collage" data-reveal>
  <div className="win win-log" data-parallax="-40" data-origin="tl">
   <div className="log-body"><div className="log-lines" aria-label={c.logLabel} role="list">{[...log,...log].map((row,i)=><p key={i} role={i<log.length?'listitem':undefined} aria-hidden={i>=log.length||undefined}><b>{row[0]}</b> {row[1]} <span>{row[2]}</span> <em>{row[3]}</em></p>)}</div><div className="log-plan" tabIndex={0} data-cursor={c.cursor}><FieldDrawing/></div></div>
   <span className="win-x" aria-hidden="true">×</span><small className="log-note">{c.logNote}</small>
  </div>
  <h3 className="collage-title">{c.title[0]} <span className="interactive-word" tabIndex={0}>{c.title[1]}<Spark className="word-spark"/></span></h3>
  <div className="win win-essential" data-parallax="30" data-origin="br"><p className="win-head"><span data-scramble={c.essentially} key={lang}>{c.essentially}</span> <span className="clover" aria-hidden="true">✤</span></p><p>{c.p1}</p><p>{c.p2}</p><span className="win-x" aria-hidden="true">×</span><Tail/></div>
  <div className="collage-notes"><p>{c.n1}</p><p>{c.n2} <span className="mini-box" aria-hidden="true">+</span></p><p className="status-line"><span className="status-dot" aria-hidden="true">◎</span> {c.showing}<br/><br/>{c.n3[0]} <span className="pill-word">{c.n3[1]}</span>{c.n3[2]}</p></div>
 </section>
}
