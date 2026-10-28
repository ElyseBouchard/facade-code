import {diag,debugMode} from './landing/diag';
import './site.css';
import {useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowUpRight,Plus} from 'lucide-react';
import {copy,LangProvider} from './landing/i18n';
import {useLandingMotion} from './landing/useLandingMotion';
import {GridOverlay} from './landing/LandingDetails';
import {WallSection} from './landing/WallSection';
import {KitSection} from './landing/KitSection';
import {CostSection} from './landing/CostSection';
import {ProjectExhibits} from './landing/LandingExhibits';

/* Facade, v2: the construction footage first, then the first site's sections, in plain English. The demo, savings,
   waitlist and hardware lab are the first site's app, served at the same addresses (/demo, /savings, /waitlist,
   /hardware) through vercel.json. */
const t=copy.en,language={lang:'en' as const,t,setLang:()=>{}};

/* ---------- the footage plays as soon as the page opens, and keeps looping whenever it can be seen ---------- */
const video=document.querySelector<HTMLVideoElement>('.v2-video'),heroBox=document.querySelector('.v2-hero');
if(video&&heroBox){
 video.muted=video.defaultMuted=true;
 // Once the hero is a screen out of view the footage rests, so the 3D sections below don't share the machine with a
 // video decoder; it is playing again before the hero scrolls back in.
 let away=false;
 const play=()=>{if(video.paused&&!away)void video.play().catch((e:Error)=>diag(`video.play() refused: ${e.name} ${e.message}`))};
 if(debugMode)for(const type of ['loadedmetadata','loadeddata','canplay','playing','pause','waiting','stalled','suspend','error','emptied'])video.addEventListener(type,()=>diag(`video ${type}${type==='error'?' code '+video.error?.code:''}`));
 play();
 new IntersectionObserver(([e])=>{away=!e?.isIntersecting;if(away)video.pause();else play()},{rootMargin:'100% 0px'}).observe(heroBox);
 // Some browsers hold autoplay (Low Power Mode, Safari's "Never Auto-Play") until the visitor interacts: Safari only
 // counts a click, a key or the end of a touch as permission, so listen for those as well as the first scroll.
 for(const type of ['pointerdown','pointerup','mousedown','click','touchstart','touchend','keydown','scroll'])addEventListener(type,play,{passive:true});
 // If anything else pauses it (a power saver, a hidden tab), start it again as soon as the page is in view.
 video.addEventListener('pause',()=>{if(!document.hidden&&!away)setTimeout(play,200)});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)play()});
 for(const type of ['focus','pageshow'])addEventListener(type,play);
 // Some embedded browsers defer autoplay without any event to retry on; check once a second while the hero is in view.
 setInterval(()=>{if(!document.hidden)play()},1000);
}

/* ---------- the headline scales to fit its column; the header is white over the footage ---------- */
const title=document.querySelector<HTMLElement>('.v2-hero-title');
if(title){
 const lines=[...title.querySelectorAll<HTMLElement>('.line')];
 const fit=()=>{title.style.setProperty('--fit','1');const widest=Math.max(0,...lines.map(l=>l.getBoundingClientRect().width)),room=title.clientWidth;title.style.setProperty('--fit',widest>room?(room/widest*.98).toFixed(3):'1')};
 fit();new ResizeObserver(fit).observe(title.parentElement!);void document.fonts?.ready.then(fit);
}
const head=document.querySelector('.lab-header'),hero=document.querySelector('.v2-hero');
if(head&&hero){let frame=0;const update=()=>{frame=0;head.classList.toggle('on-video',hero.getBoundingClientRect().bottom>56)};addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(update)},{passive:true});update()}

/** How the work goes, and a sample of the log it produces. */
function HowItWorks(){
 const h=t.how;
 return <section className="v2-section how" id="workflow" aria-labelledby="how-title" data-reveal>
  <div className="split">
   <div className="section-head"><p className="eyebrow">{h.eyebrow}</p><h2 id="how-title">{h.title}</h2><p className="lede">{h.lede}</p></div>
   <ol className="steps">{h.steps.map(([name,text],i)=><li key={name}><span className="label">{String(i+1).padStart(2,'0')}</span><h3>{name}</h3><p className="body">{text}</p></li>)}</ol>
  </div>
  <figure className="findings">
   <figcaption><span className="eyebrow">{h.log.title}</span><span className="label">{h.log.sample}</span></figcaption>
   <table><thead><tr>{h.log.columns.map(c=><th key={c} scope="col">{c}</th>)}</tr></thead>
    <tbody>{h.log.rows.map(([id,name,source,status,kind])=><tr key={id}><td className="log-id">{id}</td><td className="log-name">{name}</td><td className="log-source">{source}</td><td className={`log-status is-${kind}`}><i aria-hidden="true"/>{status}</td></tr>)}</tbody></table>
   <p className="lede findings-note">{h.note}</p>
  </figure>
 </section>
}

function Questions(){
 const q=t.questions;
 return <section className="v2-section questions" id="questions" aria-labelledby="questions-title" data-reveal>
  <div className="split">
   <div className="section-head"><p className="eyebrow">{q.eyebrow}</p><h2 id="questions-title">{q.title}</h2><p className="lede">{q.lede}</p></div>
   <div className="questions-list">{q.items.map(([question,answer])=><details key={question}><summary><span>{question}</span><Plus size={16} aria-hidden="true"/></summary><p className="body">{answer}</p></details>)}</div>
  </div>
 </section>
}

function Join(){
 const j=t.join;
 return <section className="v2-section join" aria-labelledby="join-title" data-reveal>
  <div className="section-head"><p className="eyebrow">{j.eyebrow}</p><h2 id="join-title">{j.title[0]}<br/>{j.title[1]}</h2><p className="lede">{j.lede}</p>
   <a className="button button-dark" href="/waitlist">{j.action} <ArrowUpRight size={14}/></a></div>
 </section>
}

/** Everything under the footage: the wall, the scanner, the numbers, how it works, the software, questions and the
 * waitlist. */
function Sections(){
 const root=useRef(document.getElementById('site') as HTMLDivElement);
 const [selected,setSelected]=useState<number|null>(null);
 useLandingMotion(root);
 return <LangProvider value={language}>
  <GridOverlay/>
  <div className="reading-progress" aria-hidden="true"/>
  <WallSection/>
  <KitSection/>
  <CostSection/>
  <HowItWorks/>
  <ProjectExhibits selected={selected} select={setSelected} openDemo={()=>{location.href='/demo'}}/>
  <Questions/>
  <Join/>
 </LangProvider>
}

createRoot(document.getElementById('sections')!).render(<Sections/>);
