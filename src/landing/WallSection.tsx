import {lazy,Suspense,useRef} from 'react';
import {Words} from './LandingDetails';
import {usePinnedProgress,useStartWhenNear,ViewerBoundary} from './WallHero';
import {useCopy} from './i18n';
const WallViewer=lazy(()=>import('./WallViewer'));
const systems=['mechanical','electrical','plumbing'] as const;

/** Right under the footage: the sample wall, pinned while scrolling takes it apart one layer at a time. The key is a
 * plain list; nothing on it reacts to the pointer. */
export function WallSection(){
 const section=useRef<HTMLElement>(null),progress=usePinnedProgress(section),start=useStartWhenNear(section,300,'0px 0px -15% 0px');
 const {t}=useCopy(),w=t.inside,h=t.hero;
 return <section ref={section} className="wall-hero wall-section" id="inside" aria-labelledby="inside-title" data-reveal><div className="wall-stage">
  <div className="kit-copy">
   <h2 id="inside-title"><Words text={w.title[0]}/><br/><Words text={w.title[1]} from={w.title[0].split(' ').length}/></h2>
   <p className="kit-lede">{w.lede}</p>
  </div>
  <div className="wall-frame"><ViewerBoundary fallback={<p className="wall-status" role="status">{t.wall.failed}</p>}>{start?<Suspense fallback={<p className="wall-status">{t.wall.loading}</p>}><WallViewer reality={0} focus={null} scroll={progress} text={t.wall}/></Suspense>:<p className="wall-status">{t.wall.loading}</p>}</ViewerBoundary></div>
  <ul className="wall-legend wall-key" aria-label={h.legendLabel}>{systems.map((key,i)=><li key={key} className={`legend-item system-${key}`}><i aria-hidden="true"/><span>{h.systems[i][1]}</span></li>)}</ul>
 </div></section>
}
