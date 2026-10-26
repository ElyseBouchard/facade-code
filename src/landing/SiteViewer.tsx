import {useEffect,useRef,useState,type RefObject} from 'react';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {debugMode,diag,diagCanvas,diagFrame,diagView} from './diag';
import {guardContext,StillPicture} from './stills';
import {LineSegments2} from 'three/addons/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/addons/lines/LineSegmentsGeometry.js';
import {LineMaterial} from 'three/addons/lines/LineMaterial.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

import {COSTS,SAVED,type Story} from './costData';
import {scramble} from './scramble';
export type SiteText={aria:string;loading:string;failed:string;unavailable:string;cursor:string;names:[string,string,string];savedName:string;legend:string};

/** One red line per $1,000: 15, 14 and 8 lines, the leftmost of each drawn partway for the remainder ($14,500 is
 * 14 lines and a half). The illustrative saving takes the 5 rightmost lines of the first fan. */
const PER_LINE=1000,LINES=COSTS.map(c=>Math.ceil(c)),PART=COSTS.map(c=>c-Math.floor(c)),SAVED_LINES=SAVED/PER_LINE;
const RED='193,56,51',ALPHA=[.82,.6,.42];
/** Each category's label sits at a fixed place across the top of the view; its lines fan down to the building. */
const ANCHOR_X=[.2,.5,.8],ANCHOR_Y=.2;
const HOTSPOTS=['hotspot-unexpected','hotspot-design','hotspot-owner'];
/** Planted strips, in scene coordinates: [x0, x1, z0, z1]. */
const BEDS:[number,number,number,number][]=[[-20,20,-13,-10.6],[-20,-13,-10.6,10.6],[15,20,-10.6,-1]];
const smooth=(t:number)=>{const x=Math.min(1,Math.max(0,t));return x*x*(3-2*x)};
const rand=(seed:number)=>()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646};

/** Line-drawn trees and shrubs: trunks and limbs as cylinders, crowns as clusters of spheres; outlined like the model. */
function vegetation(trees:{p:T.Vector3;s:number}[],seed:number){
 const r=rand(seed),crowns:T.BufferGeometry[]=[],limbs:T.BufferGeometry[]=[];
 const ball=(x:number,y:number,z:number,rad:number,seg:number)=>crowns.push(new T.SphereGeometry(rad,seg,Math.round(seg*.7)).translate(x,y,z));
 const limb=(a:T.Vector3,b:T.Vector3,r0:number,r1:number)=>{const len=a.distanceTo(b),g=new T.CylinderGeometry(r1,r0,len,10,1).translate(0,len/2,0);
  g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize()));limbs.push(g.translate(a.x,a.y,a.z))};
 for(const {p,s} of trees){
  const top=new T.Vector3(p.x,2.4*s,p.z);limb(new T.Vector3(p.x,0,p.z),top,.2*s,.15*s);
  for(let k=0;k<3;k++){const a=k*2.1+r();limb(top,new T.Vector3(p.x+Math.cos(a)*1.2*s,top.y+1.5*s+r()*.7*s,p.z+Math.sin(a)*1.2*s),.12*s,.06*s)}
  const c=new T.Vector3(p.x,top.y+2.2*s,p.z),n=11+Math.floor(r()*4);
  for(let k=0;k<n;k++){const a=r()*Math.PI*2,d=Math.sqrt(r());ball(c.x+Math.cos(a)*d*1.9*s,c.y+(r()-.35)*1.5*s,c.z+Math.sin(a)*d*1.9*s,(.75+r()*.55)*s,18)}
 }
 for(const [x0,x1,z0,z1] of BEDS)for(let x=x0+1;x<x1-.5;x+=2.4)for(let z=z0+.8;z<z1-.4;z+=2.2){if(r()<.35)continue;
  const cx=x+(r()-.5)*1.2,cz=z+(r()-.5),m=2+Math.floor(r()*3);for(let k=0;k<m;k++)ball(cx+(r()-.5)*.9,.15+r()*.2,cz+(r()-.5)*.7,.35+r()*.3,12)}
 return {crowns:mergeGeometries(crowns),limbs:mergeGeometries(limbs)};
}

/** Outline by inverted hull: back faces pushed out a fixed number of pixels, so round shapes get a clean silhouette. */
function outline(width:number,color:string,opacity:number){
 return new T.ShaderMaterial({side:T.BackSide,transparent:opacity<1,
  uniforms:{resolution:{value:new T.Vector2(1,1)},width:{value:width},color:{value:new T.Color(color)},opacity:{value:opacity}},
  vertexShader:'uniform vec2 resolution;uniform float width;void main(){vec4 c=projectionMatrix*modelViewMatrix*vec4(position,1.);vec3 n=normalize(normalMatrix*normal);vec2 d=(projectionMatrix*vec4(n,0.)).xy;float l=length(d);if(l>0.)d/=l;c.xy+=d*width*2./resolution*c.w;gl_Position=c;}',
  fragmentShader:'uniform vec3 color;uniform float opacity;void main(){gl_FragColor=vec4(color,opacity);}'});
}

/** The renovation site drawn in line, with a fan of red lines rising from where each change order comes from. */
export default function SiteViewer({story,text,money}:{story:RefObject<Story>;text:SiteText;money:(n:number)=>string}){
 const host=useRef<HTMLDivElement>(null),labelsRef=useRef<HTMLDivElement>(null);const [status,setStatus]=useState<'idle'|'loading'|'ready'|'still'>('idle');
 const words=useRef(text);words.current=text;const fmt=useRef(money);fmt.current=money;const canvasRef=useRef<HTMLCanvasElement|null>(null);
 const textKey=JSON.stringify(text);
 // Labels are plain DOM, refreshed when the language changes; their amounts are written each frame.
 useEffect(()=>{const host=labelsRef.current;if(!host)return;const t=JSON.parse(textKey) as SiteText;
  canvasRef.current?.setAttribute('aria-label',t.aria);
  host.querySelectorAll<HTMLElement>('[data-key]').forEach(el=>{const [kind,i]=el.dataset.key!.split(':'),s=el.querySelector('span');
   if(s)s.textContent=kind==='saved'?t.savedName:t.names[Number(i)]})},[textKey]);
 useEffect(()=>{
  const el=host.current,labelHost=labelsRef.current;if(!el||!labelHost)return;let renderer:T.WebGLRenderer;
  try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'})}catch{setStatus('still');return}
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),narrow=matchMedia('(max-width: 767px)');
  // 1.5x keeps the hairlines crisp on Retina at well under half the pixels of 2x; shader errors are only checked in development.
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.debug.checkShaderErrors=import.meta.env.DEV||debugMode;renderer.setClearColor(0xffffff,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NoToneMapping;
  const gl=renderer.getContext();diagCanvas('3d numbers',renderer.domElement,gl);diag('3d numbers: renderer created');let drawn=0;
  // Lost WebGL (straight away, or again soon after) switches to a still of this view; see stills.tsx.
  const fallBack=()=>{if(disposed)return;diag('3d numbers: falling back to a still');diagView('3d numbers',{still:true});disposed=true;cancelAnimationFrame(frame);try{renderer.dispose()}catch{/* already gone */}renderer.domElement.remove();labelHost.replaceChildren();setStatus('still')};
  const guard=guardContext(renderer.domElement,()=>fallBack());
  const canvas=renderer.domElement;canvasRef.current=canvas;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',words.current.aria);canvas.tabIndex=0;el.appendChild(canvas);
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(34,1,.5,500);
  // A white architectural model: soft light so planes read apart, drawn over with black hidden-line edges.
  // Lambert divides by pi: this ambient keeps every face near white, and the sun only separates the planes a little.
  const sun=new T.DirectionalLight('#ffffff',1.05);sun.position.set(-12,20,19);scene.add(new T.AmbientLight('#ffffff',2.65),sun);
  const surface=(color:string)=>new T.MeshLambertMaterial({color,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1});
  const ink=(color:string,opacity:number,width:number)=>new LineMaterial({color,linewidth:width,transparent:opacity<1,opacity,worldUnits:false});
  const paper=surface('#ffffff'),glass=surface('#f1f3f4');
  const lineInk=ink('#1f1f1f',.82,1),glassInk=ink('#6a6f73',.45,.8),bedInk=ink('#8a8a8a',.4,.8),hull=outline(1,'#1f1f1f',.82);
  const inks=[lineInk,glassInk,bedInk];const owned:T.Material[]=[paper,glass,...inks,hull];

  // ---- overlay: a 2D canvas for the fans of red lines, and DOM labels at the top of the view ----
  const fan=document.createElement('canvas');fan.className='site-fan';labelHost.append(fan);const ctx=fan.getContext('2d')!;
  const makeLabel=(key:string,cls:string)=>{const d=document.createElement('div');d.className=`site-label ${cls}`;d.dataset.key=key;
   const b=document.createElement('b');b.dir='ltr';b.addEventListener('pointerenter',()=>scramble(b));d.append(b,document.createElement('span'));labelHost.append(d);return d};
  const labels=[0,1,2].map(i=>makeLabel(`cat:${i}`,`cat-${i}`)),savedLabel=makeLabel('saved:0','saved');
  labels.forEach((d,i)=>{d.querySelector('span')!.textContent=words.current.names[i]});savedLabel.querySelector('span')!.textContent=words.current.savedName;

  // ---- camera: orbit all the way round; the site sits low in the view so the fans have room above ----
  const target=new T.Vector3(1.5,5,1);let azimuth=.6,elevation=.42,velocity=0,dist=70,W=1,H=1,visible=true,near=false,disposed=false,warm=false,frame=0,last=performance.now();
  const bounds:T.Vector3[]=[];for(const x of [-20,20])for(const y of [0,10.5])for(const z of [-13,17])bounds.push(new T.Vector3(x,y,z));
  const place=(az:number,el2:number,d:number)=>{camera.position.set(target.x+Math.sin(az)*Math.cos(el2)*d,target.y+Math.sin(el2)*d,target.z+Math.cos(az)*Math.cos(el2)*d);camera.lookAt(target);camera.updateMatrixWorld()};
  const fitAt=(az:number)=>{let lo=10,hi=400;for(let k=0;k<22;k++){const mid=(lo+hi)/2;place(az,elevation,mid);const ok=bounds.every(p=>{const v=p.clone().project(camera);return Math.abs(v.x)<.96&&v.y>-.95&&v.y<.42});if(ok)hi=mid;else lo=mid}return hi};
  // Corners of the ground may tuck just out of frame at the widest angles; the building never does.
  const fit=()=>{let best=0;for(let k=0;k<12;k++)best=Math.max(best,fitAt(k/12*Math.PI*2));dist=best*.95};
  const resize=()=>{W=el.clientWidth;H=el.clientHeight;if(!W||!H)return;renderer.setSize(W,H);
   for(const m of inks)m.resolution.set(W,H);(hull.uniforms.resolution.value as T.Vector2).set(W,H);
   const dpr=Math.min(devicePixelRatio,2);fan.width=W*dpr;fan.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
   camera.aspect=W/H;camera.setViewOffset(W,H,0,-H*.14,W,H);camera.updateProjectionMatrix();fit()};
  const ro=new ResizeObserver(resize);ro.observe(el);resize();
  // Drag sideways to go round (touch only takes over once the gesture is clearly sideways), up and down to tilt.
  let dragging=false,armed=false,startX=0,startY=0,lastX=0,lastY=0,pointer=-1,touched=false;
  const down=(e:PointerEvent)=>{if(e.button!==0)return;dragging=true;armed=e.pointerType==='mouse';startX=lastX=e.clientX;startY=lastY=e.clientY;pointer=e.pointerId;touched=true;if(armed)canvas.setPointerCapture(e.pointerId)};
  const move=(e:PointerEvent)=>{if(!dragging||e.pointerId!==pointer)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;
   if(!armed){if(Math.abs(e.clientX-startX)<8)return;if(Math.abs(e.clientY-startY)>Math.abs(e.clientX-startX)){dragging=false;return}armed=true;canvas.setPointerCapture(e.pointerId)}
   azimuth-=dx*.006;velocity=-dx*.006;elevation=T.MathUtils.clamp(elevation+dy*.003,.15,.8)};
  const up=(e:PointerEvent)=>{if(e.pointerId!==pointer)return;dragging=false;armed=false;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId)};
  const key=(e:KeyboardEvent)=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();azimuth+=e.key==='ArrowLeft'?.2:-.2;touched=true}
   else if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();elevation=T.MathUtils.clamp(elevation+(e.key==='ArrowUp'?.06:-.06),.15,.8)}};
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('keydown',key);

  // ---- model: fetched once the section is close, so it never slows the top of the page ----
  const hot:T.Vector3[]=[new T.Vector3(-5.35,1.85,3.9),new T.Vector3(2.5,5.65,3.9),new T.Vector3(6.2,9.75,-1.5)];
  const draco=new DRACOLoader().setDecoderPath('/draco/');const loader=new GLTFLoader().setDRACOLoader(draco);let model:T.Object3D|undefined,site:T.Mesh|undefined;
  const load=()=>{if(disposed)return;setStatus('loading');loader.load('/models/renovation-site.glb',gltf=>{if(disposed)return;model=gltf.scene;
   const meshes:T.Mesh[]=[],trees:{p:T.Vector3;s:number}[]=[];
   model.traverse(o=>{if((o as T.Mesh).isMesh)meshes.push(o as T.Mesh);
    const i=HOTSPOTS.indexOf(o.name);if(i>=0)o.getWorldPosition(hot[i]);
    if(o.name.startsWith('tree-'))trees.push({p:o.getWorldPosition(new T.Vector3()),s:Number((o.userData as {scale?:number}).scale??1)})});
   // Collected first: the edge lines added below are meshes too, and must not be treated as surfaces.
   for(const m of meshes){(m.material as T.Material).dispose();
    const kind=m.name==='Glass'?'glass':m.name==='Grass'?'bed':'site';
    m.material=kind==='glass'?glass:paper;if(kind==='site')site=m;
    // Hidden-line edges: every crease and outline, occluded by the white surfaces in front of it.
    const edges=new T.EdgesGeometry(m.geometry,24),lines=new LineSegments2(new LineSegmentsGeometry().fromEdgesGeometry(edges),kind==='glass'?glassInk:kind==='bed'?bedInk:lineInk);edges.dispose();
    m.add(lines)}
   scene.add(model);
   const veg=vegetation(trees,11);
   for(const g of [veg.crowns,veg.limbs]){const body=new T.Mesh(g,paper);body.add(new T.Mesh(g,hull));scene.add(body)}
   // Shaders compile in parallel before the first frame, so scrolling into the section never waits on them.
   diag('3d numbers: model loaded, compiling');void renderer.compileAsync(scene,camera).catch(e=>diag(`3d numbers: compile failed ${String(e)}`)).then(()=>{if(disposed)return;diag('3d numbers: ready');renderer.render(scene,camera);warm=true;setStatus('ready');el.dataset.ready='true'})},undefined,()=>fallBack())};
  // Load a screen early; draw only while at least a sliver is actually on screen.
  const io=new IntersectionObserver(e=>{const entry=e[0];if(!entry)return;if(!near&&entry.isIntersecting){near=true;load()}},{rootMargin:'900px 0px'});io.observe(el);
  const seen=new IntersectionObserver(e=>{const entry=e[0];visible=!!entry&&entry.isIntersecting&&entry.intersectionRatio>0},{threshold:[0,.001]});seen.observe(el);

  // ---- per frame ----
  const v=new T.Vector3(),ray=new T.Raycaster(),hidden=[0,0,0];let probe=0;
  const screen=(p:T.Vector3)=>{v.copy(p).project(camera);return [(v.x*.5+.5)*W,(-v.y*.5+.5)*H] as const};
  const place2=(d:HTMLElement,x:number,y:number,o:number)=>{d.style.transform=`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;d.style.opacity=o.toFixed(3);d.style.visibility=o<.01?'hidden':'visible'};
  const setAmount=(d:HTMLElement,n:number)=>{const b=d.querySelector('b')!;if(b.dataset.scrambling)return;const s=fmt.current(n);if(b.textContent!==s)b.textContent=s};
  /** One line of a fan: a curve from the building up to the label, with a slow wave like a dragged print. */
  const strand=(ox:number,oy:number,ex:number,ey:number,p:number,u:number,phase:number)=>{
   const steps=26,n=Math.max(1,Math.round(steps*p)),dy=oy-ey;
   for(let k=0;k<=n;k++){const t=k/steps*Math.min(1,p*steps/n),q=1-t;
    const x=q*q*q*ox+3*q*q*t*ox+3*q*t*t*ex+t*t*t*ex,y=q*q*q*oy+3*q*q*t*(oy-dy*.55)+3*q*t*t*(ey+dy*.45)+t*t*t*ey;
    const wave=7*Math.sin(Math.PI*t)*Math.sin(t*7+phase+u*2.4);
    if(k===0)ctx.moveTo(x+wave,y);else ctx.lineTo(x+wave,y)}};
  const draw=(now:number)=>{if(disposed)return;frame=requestAnimationFrame(draw);const dt=Math.min(.1,(now-last)/1000);last=now;if(!visible||document.hidden||!model||!warm)return;
   const s=story.current??{rise:[1,1,1],save:1},reduced=motion.matches;
   if(!dragging){velocity*=Math.exp(-dt*3.5);azimuth+=velocity}
   // Until someone takes over, drift a little either side so the depth reads.
   place(azimuth+(reduced||touched?0:Math.sin(now/1000*.16)*.08),elevation,dist);
   renderer.render(scene,camera);diagFrame('3d numbers',gl,++drawn);
   // Every few frames, check whether the building stands between the camera and each origin.
   if(++probe%6===0)for(let i=0;i<3;i++){const dir=hot[i].clone().sub(camera.position),len=dir.length();ray.set(camera.position,dir.normalize());ray.far=len-.4;hidden[i]=site&&ray.intersectObject(site,false).length?1:0}
   const sv=smooth(s.save),phase=reduced?0:now/1000*.6,sp=Math.min(9,W*.17/LINES[0]);
   ctx.clearRect(0,0,W,H);ctx.lineWidth=narrow.matches?.9:1.25;ctx.lineCap='round';
   for(let i=0;i<3;i++){
    const n=LINES[i],p=smooth(s.rise[i]),fw=n*sp,ax=W*ANCHOR_X[i],ay=H*ANCHOR_Y,[hx,hy]=screen(hot[i]),dim=hidden[i]?.55:1;
    const spread=Math.min(fw*.12,14),saving=i===0?SAVED_LINES:0;
    // Lines that stay; then, for unexpected conditions, the ones the saving takes away (faded, dashed, lifted).
    for(const part of saving&&sv>0?['kept','saved']:['all']){
     ctx.beginPath();ctx.setLineDash(part==='saved'?[2,3]:[]);
     const from=part==='saved'?n-saving:0,to=part==='kept'?n-saving:n,lift=part==='saved'?28*sv:0;
     for(let k=from;k<to;k++){const u=(k+.5)/n-.5,part=k===0&&PART[i]?PART[i]:1;strand(hx+u*spread,hy,ax+u*fw,ay-lift,p*part,u,phase)}
     const a=ALPHA[i]*dim*(part==='saved'?1-.75*sv:1);ctx.strokeStyle=`rgba(${RED},${a.toFixed(3)})`;ctx.stroke()}
    ctx.setLineDash([]);
    // Where the lines start: a red dot with a slow pulse.
    const pulse=reduced?.5:(now/1400+i/3)%1;ctx.fillStyle=`rgba(${RED},${(.9*dim*Math.min(1,p*4)).toFixed(3)})`;ctx.beginPath();ctx.arc(hx,hy,3.4,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=`rgba(${RED},${((1-pulse)*.7*dim*Math.min(1,p*4)).toFixed(3)})`;ctx.beginPath();ctx.arc(hx,hy,4+pulse*9,0,Math.PI*2);ctx.stroke();
    // The label follows the lines that remain; its amount counts up with them, and down when the saving lifts off.
    const keptMid=saving?-(saving/n)/2*sv:0;
    // (u runs -0.5..0.5 across the fan; the kept lines sit left of the saved ones.)
    place2(labels[i],ax+keptMid*fw,ay-10,smooth(p*1.4));setAmount(labels[i],COSTS[i]*1000*p-(saving?SAVED*sv:0));
    if(saving){place2(savedLabel,ax+(.5-saving/n/2)*fw,ay-28*sv-14,sv);setAmount(savedLabel,SAVED)}
   }};
  frame=requestAnimationFrame(draw);
  return()=>{disposed=true;guard.stop();cancelAnimationFrame(frame);ro.disconnect();io.disconnect();seen.disconnect();
   canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('keydown',key);
   scene.traverse(o=>{const m=o as T.Mesh;if(m.geometry)m.geometry.dispose()});for(const m of owned)m.dispose();
   draco.dispose();renderer.dispose();canvas.remove();labelHost.replaceChildren()};
 },[story]);
 if(status==='still')return <div className="site-viewer is-still" role="img" aria-label={text.aria}><StillPicture name="site" className="viewer-still"/><p className="site-legend" aria-hidden="true"><i/>{text.legend}</p></div>;
 const message=status==='loading'?text.loading:'';
 return <div className="site-viewer" data-cursor={text.cursor}><div ref={host} className="site-canvas"/><div ref={labelsRef} className="site-labels" aria-hidden="true"/>
  <p className="site-legend" aria-hidden="true"><i/>{text.legend}</p>{message&&<p className="wall-status" role="status">{message}</p>}</div>
}
