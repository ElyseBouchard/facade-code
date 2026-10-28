import {LOGO_PATH,LOGO_VIEWBOX} from './logo-path';

/** The Facade mark: a wall section split by a crack that shows the framing behind it. Drawn in the current text colour. */
export function LogoMark({className='',title}:{className?:string;title?:string}){
 return <svg className={`logo-mark ${className}`} viewBox={LOGO_VIEWBOX} fill="currentColor" role={title?'img':undefined} aria-label={title} aria-hidden={title?undefined:true}><path d={LOGO_PATH}/></svg>
}
