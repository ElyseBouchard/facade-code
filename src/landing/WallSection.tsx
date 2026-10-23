import {lazy,Suspense,useRef,useState} from 'react';
import {Words} from './LandingDetails';
import {usePinnedProgress,ViewerBoundary} from './WallHero';
import {useCopy} from './i18n';
const WallViewer=lazy(()=>import('./WallViewer'));
const systems=['mechanical','electrical','plumbing'] as const;

/** Right under the footage: the sample wall, pinned while scrolling takes it apart one layer at a time. The key is a
 * plain list; nothing on it reacts to the pointer. */
export function WallSection(){
 const section=useRef<HTMLElement>(null),progress=usePinnedProgress(section,'--hero-p');const [exploded,setExploded]=useState(false);
 const {t}=useCopy(),w=t.inside,h=t.hero;
 return <section ref={section} className="wall-hero wall-section" id="inside" aria-labelledby="inside-title" data-reveal><div className="wall-stage">
  <div className="kit-copy">
   <p className="bracket lab-micro" data-scramble={w.eyebrow}>{w.eyebrow}</p>
   <h2 id="inside-title"><Words text={w.title[0]}/><br/><Words text={w.title[1]} from={w.title[0].split(' ').length}/></h2>
   <p className="kit-lede">{w.lede}</p>
  </div>
  <div className="wall-frame"><ViewerBoundary fallback={<p className="wall-status" role="status">{t.wall.failed}</p>}><Suspense fallback={<p className="wall-status">{t.wall.loading}</p>}><WallViewer reality={0} focus={null} scroll={progress} onExploded={setExploded} text={t.wall}/></Suspense></ViewerBoundary></div>
  <ul className="wall-legend wall-key" aria-label={h.legendLabel}>{systems.map((key,i)=><li key={key} className={`legend-item system-${key}`}><i aria-hidden="true"/><span>{h.systems[i][1]}</span></li>)}</ul>
  <div className="wall-notes"><p className="wall-hint">{exploded?h.hintOpen:h.hintClosed}</p><p className="wall-caption">{h.caption}</p></div>
 </div></section>
}
