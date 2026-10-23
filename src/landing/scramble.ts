const GLYPHS='#$%&*+/<>=?@^~!';

/** Flicker an element's text through random symbols, then settle back on it, left to right. Marks the element while
 * it runs (data-scrambling) so live counters can leave it alone until it is done. */
export function scramble(el:HTMLElement){
 if(el.dataset.scrambling||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const text=el.textContent??'',chars=[...text],total=14;let step=0;el.dataset.scrambling='1';
 const id=window.setInterval(()=>{step++;const shown=Math.floor(chars.length*Math.max(0,step-4)/(total-4));
  el.textContent=chars.map((c,i)=>c===' '||i<shown?c:GLYPHS[Math.floor(Math.random()*GLYPHS.length)]).join('');
  if(step>=total){window.clearInterval(id);el.textContent=text;delete el.dataset.scrambling}},38);
}
