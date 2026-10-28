import {forwardRef,lazy,Suspense,useEffect,useMemo,useRef,useState} from 'react';
import {Words} from './LandingDetails';
import {languages,useCopy} from './i18n';
import {COSTS,SAVED,TOTAL,type Story} from './costData';
import {useStartWhenNear} from './WallHero';
const SiteViewer=lazy(()=>import('./SiteViewer'));

/** The study behind the change-order figures (2018, 161 school renovations, Las Vegas Valley). */
const STUDY='https://oasis.library.unlv.edu/fac_articles/542/';
const clamp=(x:number)=>Math.min(1,Math.max(0,x));
const ease=(x:number)=>{const t=clamp(x);return t*t*(3-2*t)};

/** A dollar amount: read once by screen readers, and flickering through symbols on hover. */
const Amount=forwardRef<HTMLSpanElement,{value:string}>(({value},ref)=><strong dir="ltr" className="amount">
 <span className="sr-only">{value}</span><span aria-hidden="true" ref={ref}>{value}</span></strong>);

/** Third screen: what surprises add to a $1M renovation, drawn on a renovation site, and an illustrative saving. */
export function CostSection(){
 const {lang,t}=useCopy(),c=t.costs;
 const tag=languages.find(l=>l.code===lang)!.tag;
 const money=useMemo(()=>{const f=new Intl.NumberFormat(tag,{style:'currency',currency:'USD',currencyDisplay:'narrowSymbol',maximumFractionDigits:0});return (n:number)=>f.format(Math.round(n/100)*100)},[lang,tag]);
 const section=useRef<HTMLElement>(null),story=useRef<Story>({rise:[0,0,0],save:0}),start=useStartWhenNear(section,4500);
 const amounts=useRef<(HTMLElement|null)[]>([]),total=useRef<HTMLElement>(null);
 const [mode,setMode]=useState<'typical'|'savings'>('typical');
 const clock=useRef({start:-1,auto:true,mode:'typical' as 'typical'|'savings'});clock.current.mode=mode;
 const moneyRef=useRef(money);moneyRef.current=money;

 useEffect(()=>{const el=section.current;if(!el)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const seen=new IntersectionObserver(e=>{if(e[0]?.isIntersecting&&clock.current.start<0)clock.current.start=performance.now()},{threshold:.3});seen.observe(el);
  // The count only runs while the section is on screen, so the page can rest everywhere else.
  let frame=0,last=performance.now(),onScreen=false;
  const watch=new IntersectionObserver(e=>{onScreen=!!e[0]?.isIntersecting;if(onScreen&&!frame){last=performance.now();frame=requestAnimationFrame(tick)}});
  const write=(node:HTMLElement|null,value:number)=>{if(!node||node.dataset.scrambling)return;const s=moneyRef.current(value);if(node.textContent!==s)node.textContent=s};
  const tick=(now:number)=>{frame=onScreen?requestAnimationFrame(tick):0;const dt=Math.min(.1,(now-last)/1000);last=now;const k=clock.current,s=story.current;
   if(reduced){s.rise=[1,1,1];s.save=k.mode==='savings'?1:0}
   else if(k.start>=0){const time=(now-k.start)/1000;
    // Each surprise's lines draw up in turn; then, once, the savings view.
    s.rise=[0,1,2].map(i=>clamp((time-.3-i*.75)/1.8)) as Story['rise'];
    if(k.auto&&time>5.8){k.auto=false;setMode('savings')}
    const goal=k.mode==='savings'&&s.rise[2]>=1?1:0;s.save+=Math.sign(goal-s.save)*Math.min(Math.abs(goal-s.save),dt/1.2)}
   COSTS.forEach((v,i)=>write(amounts.current[i],v*1000*ease(s.rise[i])));
   write(total.current,COSTS.reduce((a,v,i)=>a+v*1000*ease(s.rise[i]),0))};
  watch.observe(el);
  return()=>{cancelAnimationFrame(frame);seen.disconnect();watch.disconnect()}},[]);

 const choose=(next:'typical'|'savings')=>{const k=clock.current;k.auto=false;
  // Jumping to savings before the lines are drawn skips ahead to the drawn view.
  if(next==='savings'&&(k.start<0||(performance.now()-k.start)/1000<3.9))k.start=performance.now()-3900;
  setMode(next)};
 const replay=()=>{const k=clock.current;k.start=performance.now();k.auto=true;story.current.save=0;setMode('typical')};

 const viewerText={aria:c.aria,loading:c.loading,failed:c.failed,unavailable:c.unavailable,cursor:c.cursor,names:c.short as [string,string,string],savedName:c.savedShort,legend:c.legend};
 return <section ref={section} className="cost-section" id="costs" aria-labelledby="cost-title" data-reveal>
  <div className={`cost-body mode-${mode}`}>
   <div className="cost-stage">
    <div className="cost-head">
     <p className="bracket lab-micro" data-scramble={c.eyebrow} key={lang}>{c.eyebrow}</p>
     <h2 id="cost-title"><Words text={c.title[0]}/><br/><Words text={c.title[1]} from={c.title[0].split(' ').length}/></h2>
     <p className="cost-lede">{c.lede}</p>
    </div>
    <div className="cost-frame">{start?<Suspense fallback={<p className="wall-status">{c.loading}</p>}><SiteViewer story={story} text={viewerText} money={money}/></Suspense>:<p className="wall-status">{c.loading}</p>}</div>
   </div>
   <div className="cost-panel">
    <ol className="cost-rows">
     {c.rows.map((name,i)=><li key={name} className={`cost-row cat-${i}`}><i aria-hidden="true"/><b>{name}</b><Amount value={money(COSTS[i]*1000)} ref={el=>{amounts.current[i]=el}}/></li>)}
     <li className="cost-row total"><b>{c.total}</b><Amount value={money(TOTAL)} ref={total}/></li>
    </ol>
    <div className="cost-scenarios" role="group" aria-label={c.modesLabel}>
     {(['typical','savings'] as const).map((m,i)=><button key={m} className={`cost-scenario scenario-${m}`} aria-pressed={mode===m} onClick={()=>choose(m)}>
      <span>{c.scenarios[i]}</span><Amount value={money(i===0?TOTAL:TOTAL-SAVED)}/></button>)}
    </div>
    <div className="cost-savings">
     <span className="cost-tag">[ {c.savingsTag} ]</span>
     <p className="cost-big"><Amount value={money(SAVED)}/></p>
     <p className="cost-line">{c.savingsLine}</p>
     <p className="cost-net">{c.net}</p>
    </div>
    <p className="cost-source">{c.source} <a href={STUDY} target="_blank" rel="noreferrer">{c.sourceLink}</a></p>
    <div className="cost-links"><a className="cost-calc" href="/savings">{c.calc}</a><button className="cost-replay" onClick={replay}>{c.replay}</button></div>
   </div>
  </div>
 </section>
}
