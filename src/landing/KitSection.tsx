import {lazy,Suspense,useRef} from 'react';
import {Words} from './LandingDetails';
import {usePinnedProgress,useStartWhenNear,ViewerBoundary} from './WallHero';
import {useCopy} from './i18n';
const ExplodedViewer=lazy(()=>import('./WallViewer'));

/** Second screen: the proposed field kit, pinned while scrolling separates it into an exploded axonometric. */
export function KitSection(){
 const section=useRef<HTMLElement>(null),progress=usePinnedProgress(section),start=useStartWhenNear(section,2500);const {t}=useCopy(),k=t.kit;
 return <section ref={section} className="kit-section" id="field-kit" aria-labelledby="kit-title" data-reveal><div className="kit-stage">
  <div className="kit-copy">
   <h2 id="kit-title"><Words text={k.title[0]}/><br/><Words text={k.title[1]} from={k.title[0].split(' ').length}/></h2>
   <p className="kit-lede">{k.lede}</p>
   <a className="kit-link" href="/hardware">{k.link}</a>
  </div>
  <div className="kit-frame"><ViewerBoundary fallback={<p className="wall-status" role="status">{k.viewer.failed}</p>}>{start?<Suspense fallback={<p className="wall-status">{k.viewer.loading}</p>}><ExplodedViewer model="kit" reality={0} focus={null} scroll={progress} text={k.viewer}/></Suspense>:<p className="wall-status">{k.viewer.loading}</p>}</ViewerBoundary></div>
 </div></section>
}
