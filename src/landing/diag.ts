/* Diagnostics for a browser we can't reproduce in: open the page with ?debug to record errors, footage events and the
   3D views' WebGL state into window.__diag and a small overlay. Without ?debug every call here is a no-op. */
export const debugMode=typeof location!=='undefined'&&new URLSearchParams(location.search).has('debug');
type Entry={t:number;msg:string};
const store:{first:Entry[];events:Entry[];views:Record<string,Record<string,unknown>>}={first:[],events:[],views:{}};
// The first 120 entries are kept for good (they show how a failure starts), then the latest 200.
export function diag(msg:string){if(!debugMode)return;const e={t:Math.round(performance.now()),msg};if(store.first.length<120){store.first.push(e);return}store.events.push(e);if(store.events.length>200)store.events.shift()}
export function diagView(name:string,state:Record<string,unknown>){if(!debugMode)return;store.views[name]={...store.views[name],...state}}

/** Watch a WebGL canvas: context loss and restore, the GPU, and whether a frame actually drew anything. */
export function diagCanvas(name:string,canvas:HTMLCanvasElement,gl:WebGLRenderingContext|WebGL2RenderingContext){
 if(!debugMode)return;
 const info=gl.getExtension('WEBGL_debug_renderer_info');
 diagView(name,{gpu:info?gl.getParameter(info.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),webgl2:typeof WebGL2RenderingContext!=='undefined'&&gl instanceof WebGL2RenderingContext,parallelCompile:!!gl.getExtension('KHR_parallel_shader_compile'),maxTexture:gl.getParameter(gl.MAX_TEXTURE_SIZE)});
 let losses=0;canvas.addEventListener('webglcontextlost',()=>{diag(`${name}: WebGL context LOST`);diagView(name,{lost:true,losses:++losses})});
 canvas.addEventListener('webglcontextrestored',()=>{diag(`${name}: WebGL context restored`);diagView(name,{lost:false})});
}
/** After a render: GL error code and whether the centre pixels hold anything (readPixels on the drawn buffer). */
export function diagFrame(name:string,gl:WebGLRenderingContext|WebGL2RenderingContext,frames:number){
 if(!debugMode||(frames!==1&&frames%120!==0))return;
 const err=gl.getError(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,px=new Uint8Array(4*9);let lit=0;
 for(let i=0;i<9;i++){gl.readPixels(Math.floor(w*(.3+.2*(i%3))),Math.floor(h*(.3+.2*Math.floor(i/3))),1,1,gl.RGBA,gl.UNSIGNED_BYTE,px.subarray(i*4,i*4+4));if(px[i*4+3]>0)lit++}
 diagView(name,{frames,glError:err,buffer:`${w}x${h}`,litSamples:`${lit}/9`});if(frames===1)diag(`${name}: first frame drawn, GL error ${err}, ${lit}/9 sample pixels lit`);
}

if(debugMode){
 (window as unknown as {__diag:typeof store}).__diag=store;
 addEventListener('error',e=>diag(`error: ${e.message} @ ${(e.filename||'').split('/').pop()}:${e.lineno}`));
 addEventListener('unhandledrejection',e=>diag(`unhandled rejection: ${String((e.reason as Error)?.message??e.reason)}`));
 const wrap=console.error.bind(console),warn=console.warn.bind(console);
 console.error=(...a:unknown[])=>{diag('console.error: '+a.map(String).join(' ').slice(0,300));wrap(...a)};
 console.warn=(...a:unknown[])=>{diag('console.warn: '+a.map(String).join(' ').slice(0,300));warn(...a)};
 const box=document.createElement('pre');
 box.style.cssText='position:fixed;left:8px;bottom:8px;z-index:99999;max-width:min(560px,92vw);max-height:46vh;overflow:auto;margin:0;padding:8px 10px;background:rgba(0,0,0,.82);color:#9f9;font:10px/1.35 ui-monospace,monospace;white-space:pre-wrap;pointer-events:auto';
 const draw=()=>{const v=document.querySelector<HTMLVideoElement>('.v2-video');
  const video=v?`video paused=${v.paused} t=${v.currentTime.toFixed(1)} ready=${v.readyState} net=${v.networkState} err=${v.error?.code??'-'} src=${v.currentSrc.split('/').pop()}`:'no video';
  box.textContent=`${navigator.userAgent}\n${video}\n${Object.entries(store.views).map(([k,s])=>`${k}: ${JSON.stringify(s)}`).join('\n')}\n--\n${[...store.first,...store.events].slice(0,30).map(e=>`${(e.t/1000).toFixed(1)}s ${e.msg}`).join('\n')}`};
 addEventListener('DOMContentLoaded',()=>document.body.append(box));setInterval(draw,1000);
 const params=new URLSearchParams(location.search);
 // ?debug=title: a short summary in the tab title every second, for a browser driven by AppleScript (which can read
 // titles without running script in the page). ?scrollto=inside:0.5 scrolls to that pinned progress after 6 s.
 let presented=0;addEventListener('DOMContentLoaded',()=>{const v=document.querySelector<HTMLVideoElement>('.v2-video');if(v&&'requestVideoFrameCallback' in v){const cb=()=>{presented++;v.requestVideoFrameCallback(cb)};v.requestVideoFrameCallback(cb)}});
 if(params.get('debug')==='title')setInterval(()=>{const v=document.querySelector<HTMLVideoElement>('.v2-video'),views=Object.fromEntries(Object.entries(store.views).map(([k,s])=>[k.replace('3d ',''),{f:s.frames??0,lit:s.litSamples??'-',loss:s.losses??0,still:s.still??false}]));
  document.title=JSON.stringify({y:Math.round(scrollY),video:v?{paused:v.paused,t:+v.currentTime.toFixed(1),shown:presented}:null,views})},1000);
 const to=params.get('scrollto');if(to){const [id,p]=to.split(':');setTimeout(()=>{const e=document.getElementById(id);if(!e)return;const r=Math.max(innerHeight*.6,e.offsetHeight-innerHeight);window.scrollTo({top:e.getBoundingClientRect().top+scrollY+r*Number(p),behavior:'instant'})},6000)}
}
