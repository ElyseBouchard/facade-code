import {lazy,Suspense,useRef,useState} from 'react';
import {usePinnedProgress,useStartWhenNear,ViewerBoundary,ViewerLoading} from './WallHero';
import {useCopy} from './i18n';
const ExplodedViewer=lazy(()=>import('./WallViewer'));

/** Second screen: the proposed field kit, pinned while scrolling separates it into an exploded axonometric. */
export function KitSection(){
 const section=useRef<HTMLElement>(null),progress=usePinnedProgress(section),start=useStartWhenNear(section,2500);const [exploded,setExploded]=useState(false);const {t}=useCopy(),k=t.kit;
 return <section ref={section} className="kit-section" id="field-kit" aria-labelledby="kit-title" data-reveal><div className="kit-stage">
  <div className="kit-copy section-head">
   <p className="eyebrow">{k.eyebrow}</p>
   <h2 id="kit-title">{k.title[0]}<br/>{k.title[1]}</h2>
   <p className="lede">{k.lede}</p>
   <a className="text-link out" href="/hardware">{k.link}</a>
  </div>
  <div className="kit-frame"><ViewerBoundary fallback={<p className="wall-status" role="status">{k.viewer.failed}</p>}>{start?<Suspense fallback={<ViewerLoading label={k.viewer.loading}/>}><ExplodedViewer model="kit" reality={0} focus={null} scroll={progress} onExploded={setExploded} text={k.viewer}/></Suspense>:<ViewerLoading label={k.viewer.loading}/>}</ViewerBoundary></div>
  <div className="wall-notes"><p>{exploded?k.hintOpen:k.hintClosed}</p><p className="wall-caption">{k.caption}</p></div>
 </div></section>
}
