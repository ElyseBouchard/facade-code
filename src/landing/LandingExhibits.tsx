import {useEffect,useRef} from 'react';
import {ArrowUpRight,X} from 'lucide-react';
import {useCopy,type Copy} from './i18n';

type ExhibitKey=keyof Copy['exhibits']['items'];
/** The features, in order; their words come from the copy. */
const exhibits:{key:ExhibitKey}[]=[{key:'evidence'},{key:'documents'},{key:'review'},{key:'requirements'},{key:'options'},{key:'calculations'},{key:'report'},{key:'kit'}];
const number=(i:number)=>String(i+1).padStart(2,'0');

/** A line drawing for each feature, in ink with a grey fill. */
export function ExhibitObject({kind}:{kind:string}){
 const o=useCopy().t.exhibits.obj;
 const body=(()=>{switch(kind){
  case 'evidence':return <g><g transform="rotate(-8 100 80)"><rect x="52" y="22" width="96" height="120" rx="4" className="fill"/><rect x="82" y="16" width="36" height="12" rx="2" className="paper"/><path d="M64 44h72v80H64ZM64 84h30V44M94 84v40M114 44v40h22" strokeWidth="2"/><path d="M70 110l24-30 22 18" strokeDasharray="3 3"/><g className="obj-sweep"><path d="M100 96 70 60l52-6Z" className="tint"/><circle cx="100" cy="96" r="5" className="ink"/></g></g></g>;
  case 'documents':return <g>{[0,1,2].map(i=><g key={i} className={`page p${i}`} transform={`rotate(${-12+i*8} 100 90)`}><rect x={44+i*18} y={26+i*7} width="76" height="100" rx="2" className={i===2?'fill':'paper'}/><path d={`M${56+i*18} ${54+i*7}h50M${56+i*18} ${64+i*7}h40M${56+i*18} ${74+i*7}h46`}/><rect x={44+i*18} y={14+i*7} width="26" height="12" className="ink"/><text x={48+i*18} y={23+i*7} className="obj-text inv">{['TXT','CSV','PDF'][i]}</text></g>)}</g>;
  case 'review':return <g><rect x="40" y="28" width="104" height="104" rx="3" className="fill"/>{[0,1,2,3].map(i=><g key={i}><path d={`M52 ${50+i*20}h52`}/><rect x="112" y={44+i*20} width="22" height="10" rx="5" className={i===1?'ink':'paper'}/></g>)}<path d="M52 70h52" className="strike"/><path d="M56 64l44 2" className="strike"/><g className="obj-stamp"><circle cx="138" cy="112" r="26" className="paper"/><circle cx="138" cy="112" r="20" strokeDasharray="2 2"/><text x="122" y="115" className="obj-text">{o.review}</text></g></g>;
  case 'requirements':return <g><path d="M30 118a70 70 0 0 1 140 0Z" className="fill"/>{Array.from({length:13},(_,i)=>{const a=Math.PI*(1-i/12),r1=60,r2=i%3===0?48:54;return <path key={i} d={`M${100+Math.cos(a)*r1} ${118-Math.sin(a)*r1}L${100+Math.cos(a)*r2} ${118-Math.sin(a)*r2}`}/>})}<g className="obj-needle"><path d="M100 118 138 74" strokeWidth="2.5"/></g><circle cx="100" cy="118" r="6" className="ink"/><rect x="54" y="128" width="92" height="16" className="paper"/><text x="60" y="139" className="obj-text">{o.setBy}</text></g>;
  case 'options':return <g>{[0,1,2].map(i=>{const x=44+i*42,h=34+i*22,y=128-h;return <g key={i} className={`block b${i}`}><path d={`M${x} ${y}l18-9 18 9v${h}l-18 9-18-9Z`} className={i===2?'ink':i===1?'fill':'paper'}/><path d={`M${x} ${y}l18 9 18-9M${x+18} ${y+9}v${h}`}/><text x={x+13} y={y+h+24} className="obj-text">{['A','B','C'][i]}</text></g>})}</g>;
  case 'calculations':return <g><rect x="30" y="26" width="140" height="104" rx="3" className="paper"/><path d="M44 40v76h116"/><path className="obj-trace" pathLength={1} d="M44 56l28 18 30 24 28 8 30 10" strokeWidth="2"/><path className="obj-trace t2" pathLength={1} d="M44 92l28 4 30 10 28 4 30 6" strokeDasharray="4 3"/><path className="obj-trace t3" pathLength={1} d="M44 74l28 16 30 12 28 6 30 8"/><rect x="120" y="34" width="44" height="18" className="fill"/><text x="126" y="47" className="obj-text">Σ / YR</text></g>;
  case 'report':return <g><path d="M56 18h70l22 22v104H56Z" className="paper"/><path d="M126 18v22h22" className="fill"/><text x="66" y="38" className="obj-text">{o.draft}</text>{[54,64,74,92,102,112].map(y=><path key={y} d={`M66 ${y}h${y>90?62:70}`} opacity=".7"/>)}<g className="obj-stamp"><rect x="92" y="118" width="62" height="20" className="fill" transform="rotate(-6 123 128)"/><text x="98" y="131" className="obj-text" transform="rotate(-6 123 128)">{o.human}</text></g></g>;
  default:return <g><path d="M26 130h150"/><rect x="76" y="34" width="60" height="10" rx="4" className="ink"/><rect x="76" y="40" width="10" height="32" className="ink"/><rect x="126" y="40" width="10" height="32" className="ink"/><rect x="80" y="29" width="11" height="5" rx="1" className="fill"/><rect x="42" y="70" width="122" height="20" rx="8" className="fill"/><rect x="40" y="88" width="126" height="22" rx="6" className="ink"/><rect x="28" y="72" width="26" height="32" rx="3" className="ink"/><circle cx="28" cy="88" r="5" className="paper"/><path d="M58 113h56" strokeDasharray="3 2"/><g className="obj-wheels"><circle cx="148" cy="120" r="10" className="ink"/><path d="M148 112v16M140 120h16" className="inv-stroke"/></g></g>;
 }})();
 return <svg className={`exhibit-object obj-${kind}`} viewBox="0 0 200 160" aria-hidden="true"><g className="obj-body" fill="none" stroke="currentColor" strokeLinejoin="round">{body}</g></svg>
}

/** The software, as eight cards in a grid. Each opens a drawer with the detail and a way into the demo. */
export function ProjectExhibits({selected,select,openDemo}:{selected:number|null;select:(i:number|null)=>void;openDemo:()=>void}){
 const {t}=useCopy(),x=t.exhibits,words=(key:ExhibitKey)=>x.items[key];
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLElement|null>(null),closing=useRef(0);
 useEffect(()=>{const el=dialog.current;if(!el)return;
  if(selected!==null){if(!trigger.current)trigger.current=document.activeElement as HTMLElement;el.classList.remove('is-closing');if(!el.open)el.showModal();document.documentElement.classList.add('drawer-open')}
  else if(el.open){el.classList.add('is-closing');const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;closing.current=window.setTimeout(()=>{el.classList.remove('is-closing');el.close();document.documentElement.classList.remove('drawer-open');trigger.current?.focus({preventScroll:true});trigger.current=null},reduced?0:300)}
  return()=>clearTimeout(closing.current)},[selected]);
 useEffect(()=>()=>document.documentElement.classList.remove('drawer-open'),[]);
 const open=(i:number,from:HTMLElement)=>{trigger.current=from;select(i)};
 const item=selected===null?null:exhibits[selected],text=item&&words(item.key);const next=selected===null?0:(selected+1)%exhibits.length;
 return <section className="v2-section software" id="approaches" aria-labelledby="software-title" data-reveal>
  <div className="section-head">
   <p className="eyebrow">{x.eyebrow}</p>
   <h2 id="software-title">{x.heading}</h2>
   <p className="lede">{x.lede}</p>
  </div>
  <ul className="cards">{exhibits.map((ex,i)=>{const w=words(ex.key);return <li key={ex.key}><button className="card" onClick={e=>open(i,e.currentTarget)} aria-haspopup="dialog" aria-label={x.open.replace('{title}',w.title)}>
   <span className="card-top label"><span>{number(i)}</span><span>{w.label}</span></span>
   <ExhibitObject kind={ex.key}/>
   <h3>{w.title}</h3>
   <p className="card-desc">{w.desc}</p>
  </button></li>})}</ul>
  <dialog ref={dialog} className="exhibit-drawer" onCancel={e=>{e.preventDefault();select(null)}} onClick={e=>{if(e.target===e.currentTarget)select(null)}} aria-labelledby="exhibit-title">
   {item&&text&&selected!==null&&<div className="drawer-grid">
    <div className="drawer-text">
     <div className="drawer-top label"><span>{number(selected)}</span><span className="drawer-label">{text.label}</span><button onClick={()=>select(null)} className="drawer-close" aria-label={x.close}><X size={16}/></button></div>
     <h2 id="exhibit-title">{text.title}</h2>
     <p className="drawer-desc">{text.desc}</p><p className="drawer-desc">{text.detail}</p>
     <ul className="drawer-points label">{text.points.map(p=><li key={p}>{p}</li>)}</ul>
     <div className="drawer-actions"><button className="button button-primary" onClick={()=>{select(null);openDemo()}}>{x.demo} <ArrowUpRight size={14}/></button></div>
     <button className="text-link drawer-next" onClick={()=>select(next)}>{x.next} {number(next)} {words(exhibits[next].key).title}</button>
    </div>
    <div className="drawer-visual"><span className="label">{x.illustrative} {text.label}</span><ExhibitObject kind={item.key}/></div>
   </div>}
  </dialog>
 </section>
}
