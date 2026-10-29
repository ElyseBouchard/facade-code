import {diag,debugMode} from './landing/diag';
import './landing/style.css';
import './landing/reference-theme.css';
import './landing/lab-theme.css';
import './landing/landing-interactions.css';
import './v2.css';
import {useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {createPortal} from 'react-dom';
import {Plus} from 'lucide-react';
import {copy,LangProvider,wordOffsets} from './landing/i18n';
import {useLandingMotion} from './landing/useLandingMotion';
import {GridOverlay,MixedWordmark,Words,Spark,Node,Connectors,WireCube,InlineIcon,FieldDrawing,FieldCollage,RealityGlobe,IndexThumb} from './landing/LandingDetails';
import {WallSection} from './landing/WallSection';
import {KitSection} from './landing/KitSection';
import {CostSection} from './landing/CostSection';
import {ProjectExhibits} from './landing/LandingExhibits';
import {LogoMark} from './landing/Logo';

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
 const lines=[...title.querySelectorAll<HTMLElement>('.split-line')];
 const fit=()=>{title.style.setProperty('--fit','1');const widest=Math.max(0,...lines.map(l=>l.getBoundingClientRect().width)),room=title.clientWidth;title.style.setProperty('--fit',widest>room?(room/widest*.98).toFixed(3):'1')};
 fit();new ResizeObserver(fit).observe(title.parentElement!);void document.fonts?.ready.then(fit);
}
const head=document.querySelector('.lab-header'),hero=document.querySelector('.v2-hero');
if(head&&hero){let frame=0;const update=()=>{frame=0;head.classList.toggle('on-video',hero.getBoundingClientRect().bottom>40)};addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(update)},{passive:true});update()}

function Footer(){
 return <>
  <div className="footer-scan" aria-hidden="true"><IndexThumb/></div>
  <div className="footer-brand"><span className="footer-logo"><LogoMark/><MixedWordmark/></span><p>{t.footer.tagline}<br/><span>{t.footer.judgment} © {new Date().getFullYear()} Facade</span></p></div>
  <a className="footer-top" href="#top"><span className="top-box" aria-hidden="true"><i/></span>{t.footer.top}</a>
  <div className="footer-reach"><p>{t.footer.cont[0]}<br/>{t.footer.cont[1]}</p><nav className="lab-pills" aria-label={t.footer.navLabel}><a href="/savings">{t.footer.pills[0]}</a><a href="/waitlist">{t.footer.pills[1]}</a><a href="/hardware">{t.footer.pills[2]}</a></nav></div>
  <small className="footer-note">{t.footer.note}</small>
 </>
}

/** Everything under the footage, as on the first site: the wall, the scanner, the numbers, how it works, the software,
 * savings, questions and the waitlist. */
function Sections(){
 const root=useRef(document.getElementById('site') as HTMLDivElement);
 const [selected,setSelected]=useState<number|null>(null);
 useLandingMotion(root,{introDone:true,reality:0});
 const [o1,o2]=[wordOffsets(t.manifesto.s1.parts),wordOffsets(t.manifesto.s2.parts,t.manifesto.s1.parts.join(' ').split(' ').length+1)];
 const footer=document.getElementById('site-footer');
 return <LangProvider value={language}>
  <GridOverlay/>
  <div className="reading-progress" aria-hidden="true"/>
  <WallSection/>
  <KitSection/>
  <CostSection/>
  <section className="lab-manifesto" id="workflow" data-reveal>
   <div className="manifesto-art" data-parallax="50" aria-hidden="true">
    <div className="dial" data-spin=".03">{Array.from({length:12},(_,i)=><span key={i} style={{rotate:`${i*30}deg`}}/>)}<i className="dial-ring r1"/><i className="dial-ring r2"/><i className="dial-ring r3"/><i className="dial-cross">+</i></div>
    <div className="win win-mini" data-origin="tl"><span className="win-x">×</span><FieldDrawing kind={1}/></div>
    <WireCube/>
   </div>
   <Connectors className="manifesto-links" paths={['M24 23 H31.5']}/><Node x={31.5} y={23}/>
   <div className="lab-statement">
    <h2 className="statement"><span className="sr-only">{t.manifesto.s1.sr}</span><span aria-hidden="true"><Words text={t.manifesto.s1.parts[0]}/> <Spark className="statement-spark"/> <Words text={t.manifesto.s1.parts[1]} from={o1[1]}/> <span className="outline-phrase"><Words text={t.manifesto.s1.parts[2]} from={o1[2]}/><span className="word-tooltip">{t.manifesto.s1.tip}</span></span><InlineIcon kind="link"/></span></h2>
    <p className="statement statement-2"><span className="sr-only">{t.manifesto.s2.sr}</span><span aria-hidden="true"><Words text={t.manifesto.s2.parts[0]} from={o2[0]}/> <InlineIcon kind="docs"/> <Words text={t.manifesto.s2.parts[1]} from={o2[1]}/> <InlineIcon kind="duct"/> <Words text={t.manifesto.s2.parts[2]} from={o2[2]}/> <InlineIcon kind="target"/> <Words text={t.manifesto.s2.parts[3]} from={o2[3]}/></span></p>
    <div className="statement-foot"><p className="lab-body">{t.manifesto.body}</p><span className="tool-pill" aria-hidden="true"><RealityGlobe/><i className="checker-mark"/></span></div>
   </div>
  </section>
  <FieldCollage/>
  <ProjectExhibits selected={selected} select={setSelected} openDemo={()=>{location.href="/demo"}}/>
  <section className="lab-savings" data-reveal><div className="lab-savings-art" data-parallax="40" aria-hidden="true"><div className="savings-dial" data-spin="-.025">{Array.from({length:24},(_,i)=><i key={i} style={{rotate:`${i*15}deg`}}/>)}</div><span className="lab-hour">h</span></div>
   <div className="savings-copy"><h2><Words text={t.savings.title[0]}/><br/><Words text={t.savings.title[1]} from={wordOffsets(t.savings.title)[1]}/></h2><p>{t.savings.body}</p><a className="lab-action" href="/savings">{t.savings.action}</a></div></section>
  <section className="lab-questions" id="questions" data-reveal><h2 className="questions-title"><Words text={t.questions.title[0]}/> <Spark/> <Words text={t.questions.title[1]} from={wordOffsets(t.questions.title)[1]}/></h2>
   <div className="questions-cols"><p className="questions-intro">{t.questions.intro}</p><div className="questions-list">{t.questions.items.map(([q,a])=><details key={q}><summary><span>{q}</span><Plus size={15}/></summary><p>{a}</p></details>)}</div></div></section>
  <section className="lab-join" data-reveal><h2><Words text={t.join.title[0]}/><br/><Words text={t.join.title[1]} from={wordOffsets(t.join.title)[1]}/></h2><a className="lab-action" href="/waitlist">{t.join.action}</a></section>
  {footer&&createPortal(<Footer/>,footer)}
 </LangProvider>
}

createRoot(document.getElementById('sections')!).render(<Sections/>);
