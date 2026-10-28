import {lazy,Suspense,useRef,useState} from 'react';
import {usePinnedProgress,useStartWhenNear,ViewerBoundary,ViewerLoading} from './WallHero';
import {useCopy} from './i18n';
const WallViewer=lazy(()=>import('./WallViewer'));
const systems=['mechanical','electrical','plumbing'] as const;

/** Right under the footage: the sample wall, pinned while scrolling takes it apart one layer at a time. The key is a
 * plain list; nothing on it reacts to the pointer. */
export function WallSection(){
 const section=useRef<HTMLElement>(null),progress=usePinnedProgress(section),start=useStartWhenNear(section,300,'0px 0px -15% 0px');const [exploded,setExploded]=useState(false);
 const {t}=useCopy(),w=t.inside,h=t.hero;
 return <section ref={section} className="wall-hero wall-section" id="inside" aria-labelledby="inside-title" data-reveal><div className="wall-stage">
  <div className="kit-copy section-head">
   <p className="eyebrow">{w.eyebrow}</p>
   <h2 id="inside-title">{w.title[0]}<br/>{w.title[1]}</h2>
   <p className="lede">{w.lede}</p>
  </div>
  <div className="wall-frame"><ViewerBoundary fallback={<p className="wall-status" role="status">{t.wall.failed}</p>}>{start?<Suspense fallback={<ViewerLoading label={t.wall.loading}/>}><WallViewer reality={0} focus={null} scroll={progress} onExploded={setExploded} text={t.wall}/></Suspense>:<ViewerLoading label={t.wall.loading}/>}</ViewerBoundary></div>
  <ul className="wall-legend" aria-label={h.legendLabel}>{systems.map((key,i)=><li key={key} className={`legend-item system-${key}`}><i aria-hidden="true"/><span>{h.systems[i][1]}</span></li>)}</ul>
  <div className="wall-notes"><p>{exploded?h.hintOpen:h.hintClosed}</p><p className="wall-caption">{h.caption}</p></div>
 </div></section>
}
