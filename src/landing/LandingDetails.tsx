/** The page's fixed grid: hairlines at the column edges, with a cross where they meet. */
export function GridOverlay(){return <div className="lab-grid" aria-hidden="true">{[0,1,2,3,4,5].map(i=><i key={i} className={`grid-cross c${i}`}/>)}</div>}
