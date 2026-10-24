import {useEffect,useRef,useState,type RefObject} from 'react';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {hardwareParts} from './hardware-parts';

export type WallSystem='mechanical'|'electrical'|'plumbing';
type Diagram={edge:string;edgeOpacity:number;ghost:number;guide:string;guideOpacity:number;emissive:number;colors:Record<string,string>};
/** Lab renders the authored PBR materials; Blueprint and Cyber redraw the wall as a diagram. */
const diagrams:Record<number,Diagram>={
 1:{edge:'#344dbb',edgeOpacity:.8,ghost:.08,guide:'#344dbb',guideOpacity:.42,emissive:0,colors:{framing:'#f3f5ff',structure:'#eef1fb',drywall:'#ffffff',insulation:'#e6eaff',mechanical:'#c6d0f5',plumbing:'#9aa8ea',electrical:'#5d72d3',Copper:'#7d8fe2',CastIron:'#344dbb',PVC:'#eef1ff',HandleRed:'#344dbb',HandleBlue:'#344dbb',Cat6:'#344dbb'}},
 2:{edge:'#59e7ca',edgeOpacity:.5,ghost:.05,guide:'#59e7ca',guideOpacity:.4,emissive:.4,colors:{framing:'#18201f',structure:'#111717',drywall:'#59e7ca',insulation:'#2b1f24',mechanical:'#1f4b45',plumbing:'#2a3533',electrical:'#3a3320',Copper:'#ff8a4c',CastIron:'#151a1a',PVC:'#2d3634',HandleRed:'#ff5a4d',HandleBlue:'#4f8dff',Cat6:'#4f8dff',EMT:'#f0b440',Armor:'#f0b440',PanelPaint:'#3a3320'}},
};
const noEdges=new Set(['Foil','Insulation','Armor','Cat6','Primer','DrywallPaper']);
/** Surface variation sampled in object space (triplanar), so no UVs are needed. [map, scale, albedo, roughness] */
const surfaces:Record<string,['noise'|'spangle',number,number,number]>={ConcreteWall:['noise',2.4,.45,.25],ConcreteFloor:['noise',1.6,.3,.35],Galvanized:['spangle',7,.24,.55],SteelStud:['spangle',10,.09,.4],EMT:['spangle',14,.12,.35],Foil:['noise',12,.12,.6],Insulation:['noise',7,.14,0],CastIron:['noise',9,.35,.35],Copper:['noise',5,.18,.4],Brass:['noise',8,.12,.3],PanelPaint:['noise',3,.05,.25],Armor:['noise',22,.15,.3]};
/** What each model needs: where it loads from, its part labels and staging, and how scrolling drives the explode. */
type Label=[layer:string,text:string,system:string,anchor?:string,dot?:string];
/** Models rest assembled; scroll or drag separates them. With `stay`, a drag leaves the model exploded until Enter assembles it. */
type ModelConfig={url:string;aria:string;labels:Label[];order?:Record<string,number>;autoGuides?:boolean;merge?:boolean;stay?:boolean;view:{azimuth:number;elevation:number;openElevation:number;shiftX:number;shiftY:number;spin:number;margin:number;openMargin:number};scroll:[number,number]};
const models:Record<'wall'|'kit',ModelConfig>={
 wall:{url:'/models/sample-wall.glb',aria:'Illustrative opened-up wall: steel studs, ductwork, drain and vent piping, copper water supply, an electrical panel with conduit, and insulation, behind a sheet of gypsum board drawn as a fading outline. Drag, or press Enter, to separate it into an exploded axonometric; arrow keys rotate.',stay:true,
  labels:[['Drywall','GYPSUM BOARD','drywall','Drywall sheet'],['Electrical','ELECTRICAL','electrical','Load center'],['Water supply','WATER SUPPLY','plumbing','Valve box'],['Drain and vent','DRAIN / WASTE / VENT','plumbing','PVC stack 3in'],['Mechanical','MECHANICAL','mechanical','Duct riser upper'],['Insulation','INSULATION','insulation','Insulation batt'],['Studs','STEEL STUDS','framing','Steel stud 3']],
  view:{azimuth:.55,elevation:17,openElevation:24,shiftX:.14,shiftY:.13,spin:.07,margin:.96,openMargin:1.07},scroll:[.04,.5]},
 kit:{url:'/hardware/assembly.glb?v=facade-1',aria:'Proposed Facade handheld scanner, a concept model: shell and palm grip, sensor nose, FLIR Lepton 3.5 thermal camera, Adafruit Feather RP2040 controller, rear USB panel, a reserved radar bay, a metal-sensing coil, a measuring roller and underside screws. Drag, or press Enter, to separate it into an exploded axonometric; arrow keys rotate.',
  labels:hardwareParts.map(part=>[part.id,`${part.number} ${part.name.toUpperCase()}`,'kit',part.anchor,part.color] as Label),
  autoGuides:true,merge:true,
  view:{azimuth:.75,elevation:22,openElevation:28,shiftX:.15,shiftY:.16,spin:.09,margin:1.14,openMargin:1.08},scroll:[.06,.42]},
};
const plain=(name:string)=>name.replace(/[^a-z0-9]/gi,'').toLowerCase();
/** `vector` is in the layer's parent space (metres for both models); `local` is the same move in viewer space. */
type Layer={node:T.Object3D;home:T.Vector3;vector:T.Vector3;local:T.Vector3;delay:number;extent:T.Box3};
type Guide={from:T.Vector3;layer:Layer};
type Part={mesh:T.Mesh;real:T.MeshStandardMaterial;diagram:T.MeshStandardMaterial;edges?:T.LineSegments};
type Entry={mat:T.MeshStandardMaterial;system:string;name:string};
const smooth=(t:number)=>t<=0?0:t>=1?1:t*t*(3-2*t);

/** Collapse each exploding part into one mesh per material, cutting hundreds of draw calls to a few dozen. Meshes named
 * in `keep` (label anchors) stay separate so labels can still find them. */
function mergeParts(root:T.Object3D,keep:Set<string>){
 root.updateMatrixWorld(true);const parts:T.Object3D[]=[];root.traverse(o=>{if(o.userData.explode)parts.push(o)});
 for(const part of parts){const inverse=part.matrixWorld.clone().invert(),groups=new Map<T.Material,T.BufferGeometry[]>(),meshes:T.Mesh[]=[];
  // A nested exploding layer keeps its own meshes, so it can still move apart from its group.
  part.traverse(o=>{if(!(o instanceof T.Mesh)||Array.isArray(o.material))return;if(keep.has(plain(o.name)))return;let owner:T.Object3D|null=o;while(owner&&!owner.userData.explode)owner=owner.parent;if(owner!==part)return;const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone());for(const name of Object.keys(g.attributes))if(name!=='position'&&name!=='normal')g.deleteAttribute(name);g.applyMatrix4(inverse.clone().multiply(o.matrixWorld));groups.set(o.material,[...groups.get(o.material)??[],g]);meshes.push(o)});
  for(const mesh of meshes){mesh.removeFromParent();mesh.geometry.dispose()}
  for(const child of [...part.children])if(!child.children.length&&!(child instanceof T.Mesh))child.removeFromParent();
  for(const [material,list] of groups){const merged=mergeGeometries(list);list.forEach(g=>g.dispose());if(merged)part.add(new T.Mesh(merged,material))}}
}
function mulberry(seed:number){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
/** Tileable value noise, or the crystalline "spangle" of galvanized steel, generated once. */
function makeTexture(kind:'noise'|'spangle'){
 const size=256,c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d')!,img=g.createImageData(size,size),rnd=mulberry(kind==='noise'?7:13);
 const put=(x:number,y:number,v:number)=>{const k=(y*size+x)*4;img.data[k]=img.data[k+1]=img.data[k+2]=v;img.data[k+3]=255};
 if(kind==='noise'){const octaves=[8,16,32,64].map(n=>({n,v:Array.from({length:n*n},()=>rnd())}));
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){let sum=0,amp=.5,total=0;for(const o of octaves){const fx=x/size*o.n,fy=y/size*o.n,x0=Math.floor(fx),y0=Math.floor(fy),tx=fx-x0,ty=fy-y0,at=(i:number,j:number)=>o.v[(j%o.n)*o.n+(i%o.n)],sx=tx*tx*(3-2*tx),sy=ty*ty*(3-2*ty);sum+=amp*((at(x0,y0)*(1-sx)+at(x0+1,y0)*sx)*(1-sy)+(at(x0,y0+1)*(1-sx)+at(x0+1,y0+1)*sx)*sy);total+=amp;amp*=.55}put(x,y,sum/total*255)}}
 else{const cells=Array.from({length:70},()=>({x:rnd()*size,y:rnd()*size,v:.25+rnd()*.75,s:rnd()}));
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){let best=1e9,cell=cells[0];for(const p of cells){let dx=Math.abs(x-p.x),dy=Math.abs(y-p.y);dx=Math.min(dx,size-dx);dy=Math.min(dy,size-dy);const d=dx*dx+dy*dy;if(d<best){best=d;cell=p}}put(x,y,Math.max(0,Math.min(1,cell.v+Math.sin((x*.9+y*.3)*cell.s*.35)*.08))*255)}}
 g.putImageData(img,0,0);const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.NoColorSpace;return t;
}
function addSurface(mat:T.MeshStandardMaterial,map:T.Texture,[,scale,albedo,rough]:['noise'|'spangle',number,number,number]){
 mat.onBeforeCompile=shader=>{shader.uniforms.surfaceMap={value:map};shader.uniforms.surfaceScale={value:scale};
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vSurfPos;varying vec3 vSurfNormal;').replace('#include <begin_vertex>','#include <begin_vertex>\nvSurfPos=position;vSurfNormal=normal;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D surfaceMap;uniform float surfaceScale;varying vec3 vSurfPos;varying vec3 vSurfNormal;\nfloat surfaceSample(){vec3 b=pow(abs(normalize(vSurfNormal)),vec3(4.));b/=b.x+b.y+b.z;vec3 p=vSurfPos*surfaceScale;return texture2D(surfaceMap,p.yz).r*b.x+texture2D(surfaceMap,p.xz).r*b.y+texture2D(surfaceMap,p.xy).r*b.z;}')
   .replace('#include <color_fragment>',`#include <color_fragment>\nfloat surf=surfaceSample();diffuseColor.rgb*=mix(1.0,0.72+0.56*surf,${albedo.toFixed(3)});`)
   .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor*mix(1.0,0.65+0.7*surf,${rough.toFixed(3)}),0.04,1.0);`)};
 mat.customProgramCacheKey=()=>`surface-${scale}-${albedo}-${rough}`;
}

/** Fade a material's opacity across the wall: nearly solid at the left edge, nearly clear past the middle. */
function addFade(mat:T.Material,x0:number,x1:number,min:number,max:number){
 const uniforms={fadeMin:{value:min},fadeMax:{value:max}};
 mat.onBeforeCompile=shader=>{Object.assign(shader.uniforms,uniforms);
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying float vFadeX;').replace('#include <begin_vertex>',`#include <begin_vertex>\nvFadeX=(position.x-(${x0.toFixed(4)}))/${(x1-x0).toFixed(4)};`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vFadeX;uniform float fadeMin;uniform float fadeMax;').replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=mix(fadeMin,fadeMax,1.0-smoothstep(0.015,0.3,vFadeX));')};
 mat.customProgramCacheKey=()=>`fade-${x0}-${x1}`;
 return uniforms;
}
/** Drafting lines on the board face: its outline, 4 ft joints, and screw rows on each stud. */
function sheetLines(b:T.Box3){
 const z=b.max.z+.0008,w=b.max.x-b.min.x,pts:number[]=[],seg=(x1:number,y1:number,x2:number,y2:number)=>{pts.push(x1,y1,z,x2,y2,z)};
 seg(b.min.x,b.min.y,b.max.x,b.min.y);seg(b.max.x,b.min.y,b.max.x,b.max.y);seg(b.max.x,b.max.y,b.min.x,b.max.y);seg(b.min.x,b.max.y,b.min.x,b.min.y);
 for(let x=b.min.x+1.2192;x<b.max.x-.05;x+=1.2192)seg(x,b.min.y,x,b.max.y);
 for(let i=0;i<=8;i++){const x=b.min.x+i*w/8;for(let y=b.min.y+.15;y<b.max.y-.1;y+=.3048)seg(x-.012,y,x+.012,y)}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pts,3));return g;
}

/** Words the viewer shows, in the page's language. Labels are keyed by layer name (wall) or part id (kit). */
export type ViewerText={aria:string;loading:string;unavailable:string;failed:string;cursor:string;labels:Record<string,string>};
type Status={kind:'loading'|'unavailable'|'failed'|'ready';pct?:number};

/** A model on a slow turntable; press and drag, or scroll, to separate it into an exploded axonometric. */
export default function ExplodedViewer({model:which='wall',reality,focus,scroll,onExploded,text}:{model?:'wall'|'kit';reality:number;focus:WallSystem|null;scroll:RefObject<number>;onExploded?:(exploded:boolean)=>void;text?:ViewerText}){
 const config=models[which];
 const host=useRef<HTMLDivElement>(null),labelsRef=useRef<HTMLDivElement>(null);const [status,setStatus]=useState<Status>({kind:'loading'});
 const words=useRef(text);words.current=text;const canvasRef=useRef<HTMLCanvasElement|null>(null),labelEls=useRef(new Map<string,HTMLSpanElement>());
 // A language change relabels the live view without reloading the model.
 const labelKey=JSON.stringify(text?.labels??{});
 useEffect(()=>{const labels=JSON.parse(labelKey) as Record<string,string>;for(const [key,span] of labelEls.current)span.textContent=labels[key]??span.dataset.base??'';canvasRef.current?.setAttribute('aria-label',text?.aria??config.aria)},[labelKey,text?.aria,config.aria]);
 const state=useRef({reality,focus,onExploded});state.current={reality,focus,onExploded};
 useEffect(()=>{
  const el=host.current,labelHost=labelsRef.current,spans=labelEls.current;if(!el||!labelHost)return;let renderer:T.WebGLRenderer;
  try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'})}catch{setStatus({kind:'unavailable'});return}
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  // Rendered straight to the canvas (no post-processing) at up to 1.5x: on this page the footage is decoding too, and
  // 1.5x is a third fewer pixels than 1.75x for a difference that is hard to see. The frame-time governor below steps
  // down further on slower machines. Shader errors are only checked in development: the check stalls the page.
  let maxRatio=Math.min(devicePixelRatio,1.5),ratio=maxRatio;const minRatio=Math.min(devicePixelRatio,1);
  renderer.setPixelRatio(ratio);renderer.debug.checkShaderErrors=import.meta.env.DEV;renderer.setClearColor(0xffffff,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;el.appendChild(renderer.domElement);
  // Software renderers (no GPU) get a light path: no shadows or AO, lower resolution, fewer frames.
  const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info'),gpu=debug?String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)):'';
  const quality:'full'|'low'=/swiftshader|llvmpipe|software|basic render/i.test(gpu)?'low':'full';el.dataset.quality=quality;
  if(quality==='low'){maxRatio=ratio=.75;renderer.setPixelRatio(ratio);renderer.shadowMap.enabled=false}
  const canvas=renderer.domElement;canvasRef.current=canvas;canvas.tabIndex=0;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',words.current?.aria??config.aria);
  // The canvas is transparent so the page stays pure white (or dark in Cyber) behind a tone-mapped render.
  const scene=new T.Scene();const camera=new T.PerspectiveCamera(20,1,.05,60);
  const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.03);scene.environment=environment.texture;scene.environmentIntensity=.7;room.dispose();pmrem.dispose();
  // A strong warm key, a cool rim from behind, and little fill: crisper form and darker contact shadows.
  const hemi=new T.HemisphereLight('#ffffff','#d6cfc2',.32),key=new T.DirectionalLight('#fff3e2',2.9),rim=new T.DirectionalLight('#e2eaff',.8);rim.position.set(5,3,-6);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.bias=-.0004;key.shadow.normalBias=.02;key.shadow.radius=2.5;scene.add(hemi,key,key.target,rim);
  const spin=new T.Group();scene.add(spin);
  const ground=new T.Mesh(new T.PlaneGeometry(40,40),new T.ShadowMaterial({opacity:.16,depthWrite:false}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  const sheetLineMat=new T.LineBasicMaterial({color:'#1d1f22',transparent:true,opacity:.55,depthWrite:false});let sheetFade:{fadeMin:{value:number};fadeMax:{value:number}}|undefined;
  const textures={noise:makeTexture('noise'),spangle:makeTexture('spangle')};
  const parts:Part[]=[],reals=new Map<string,Entry>(),diagramMats=new Map<string,Entry>(),edgeMats=new Map<string,T.LineBasicMaterial>();
  const layers:Layer[]=[],guides:Guide[]=[],labels:{layer:Layer;box:T.Box3;extent:T.Box3;el:HTMLSpanElement;line:SVGPathElement;dot:SVGCircleElement}[]=[];
  const svgNS='http://www.w3.org/2000/svg',leaders=document.createElementNS(svgNS,'svg');leaders.setAttribute('class','wall-leaders');labelHost.append(leaders);
  const guideGeometry=new T.BufferGeometry(),guideMaterial=new T.LineDashedMaterial({color:'#000',dashSize:.03,gapSize:.035,transparent:true,opacity:0,depthWrite:false});const guideLines=new T.LineSegments(guideGeometry,guideMaterial);guideLines.renderOrder=3;spin.add(guideLines);
  let model:T.Object3D|undefined,disposed=false,warm=false,frame=0,visible=true,radiusHome=2,radiusOpen=3,spread=1,shiftX=0,shiftY=0,aspect=1;
  let azimuth=config.view.azimuth,elevation=T.MathUtils.degToRad(config.view.elevation),velocity=0,explode=0,held=false,toggled=false,holdUntil=0,lastExploded=false,appliedReality=-1,last=performance.now();
  const dim=new Map<string,number>(),up=new T.Vector3(0,1,0),openCenter=new T.Vector3(),aim=new T.Vector3();let readyAt=0;

  const applyReality=(r:number)=>{const d=diagrams[r];renderer.toneMapping=r===0?T.ACESFilmicToneMapping:T.NoToneMapping;
   for(const part of parts){part.mesh.material=r===0?part.real:part.diagram;part.mesh.castShadow=r===0&&part.mesh.userData.system!=='drywall'}
   if(d){for(const {mat,system,name} of diagramMats.values()){const color=d.colors[name]??d.colors[system]??'#ffffff';mat.color.set(color);mat.emissive.set(r===2&&!['framing','structure','drywall'].includes(system)?color:'#000');mat.emissiveIntensity=d.emissive}
    for(const line of edgeMats.values())line.color.set(d.edge);guideMaterial.color.set(d.guide);sheetLineMat.color.set(d.edge)}else{for(const line of edgeMats.values())line.color.set('#1f2225');guideMaterial.color.set('#000');sheetLineMat.color.set('#1d1f22')}
   ground.visible=r===0&&quality!=='low';key.castShadow=r===0&&quality!=='low';hemi.intensity=r===0?.32:1.6;rim.intensity=r===0?.8:0;scene.environmentIntensity=r===0?.7:.6};
  const resize=()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;aspect=w/h;renderer.setSize(w,h);camera.aspect=aspect;
   // Wide screens push the wall right of the headline; tall screens push it below the copy.
   shiftX=aspect>1.15?config.view.shiftX:0;shiftY=aspect>1.15?.02:config.view.shiftY;camera.setViewOffset(w,h,-shiftX*w,-shiftY*h,w,h);camera.updateProjectionMatrix();spread=aspect<1.15?.68:1};
  const setRatio=()=>{renderer.setPixelRatio(ratio);resize()};
  const observer=new ResizeObserver(resize);observer.observe(el);// Visible means at least a sliver on screen: a frame that only touches the viewport edge (the wall sits right under the
  // full-screen footage) counts as intersecting, and would otherwise render the whole time the footage is watched.
  const seen=new IntersectionObserver(entries=>{const e=entries[0];visible=!!e&&e.isIntersecting&&e.intersectionRatio>0},{threshold:[0,.001]});seen.observe(el);resize();

  /** Compile every material variant this page shows (opaque and faded) before the first frame, in parallel where the
   * browser supports it, then render once so the shadow shaders exist too. Scrolling into the section then never waits
   * on a shader. This site only shows the real-materials view (reality 0), so the diagram variants are not compiled:
   * that halves the start-up shader work. */
  const warmUp=async()=>{
   const flip=(list:Entry[])=>{for(const {mat} of list){mat.transparent=!mat.transparent;mat.needsUpdate=true}};
   // The meshes still carry the file's own materials at this point: put the ones that are drawn on them first.
   for(const part of parts)part.mesh.material=part.real;const real=[...reals.values()];
   await renderer.compileAsync(scene,camera);flip(real);await renderer.compileAsync(scene,camera);flip(real);
   renderer.render(scene,camera)};
  const draco=new DRACOLoader().setDecoderPath('/draco/');const loader=new GLTFLoader().setDRACOLoader(draco);
  loader.load(config.url,gltf=>{
   if(disposed)return;model=gltf.scene;if(config.merge)mergeParts(model,new Set(config.labels.flatMap(l=>l[3]?[plain(l[3])]:[])));
   model.traverse(obj=>{if(!(obj instanceof T.Mesh))return;let sys='framing';for(let n:T.Object3D|null=obj;n;n=n.parent)if(n.userData.system||n.userData.partId){sys=n.userData.system??n.userData.partId;break}
    const source=obj.material as T.MeshStandardMaterial,name=source.name||'SteelStud',id=`${sys}|${name}`,sheet=sys==='drywall';obj.userData.system=sys;
    if(sheet){obj.geometry.computeBoundingBox();const b=obj.geometry.boundingBox!,lines=new T.LineSegments(sheetLines(b),sheetLineMat);lines.renderOrder=4;obj.add(lines);addFade(sheetLineMat,b.min.x,b.max.x,.6,1)}
    if(!reals.has(id)){const real=sheet?new T.MeshStandardMaterial({name,color:'#f7f6f2',roughness:.92,metalness:0,transparent:true,depthWrite:false}):source.clone();
     // Bright, mirror-smooth metals (the kit's aluminum) read better as brushed: rougher, with more environment light.
     if(!sheet&&real.metalness>.8&&real.color.getHSL({h:0,s:0,l:0}).l>.3)real.roughness=Math.max(real.roughness,.32);if(sheet){const b=obj.geometry.boundingBox!;sheetFade=addFade(real,b.min.x,b.max.x,.035,.94)}real.envMapIntensity=name==='Foil'?1.7:real.metalness>.5?(config.merge?1.55:1.25):.9;const surf=surfaces[name];if(surf)addSurface(real,textures[surf[0]],surf);reals.set(id,{mat:real,system:sys,name});
     const ghost=sys==='drywall';diagramMats.set(id,{mat:new T.MeshStandardMaterial({roughness:.8,metalness:0,transparent:ghost,depthWrite:!ghost,side:ghost?T.DoubleSide:T.FrontSide,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1}),system:sys,name})}
    if(!edgeMats.has(sys))edgeMats.set(sys,new T.LineBasicMaterial({transparent:true,opacity:.6,depthWrite:false}));
    source.dispose();const part:Part={mesh:obj,real:reals.get(id)!.mat,diagram:diagramMats.get(id)!.mat};
    if(!noEdges.has(name)){part.edges=new T.LineSegments(new T.EdgesGeometry(obj.geometry,32),edgeMats.get(sys)!);obj.add(part.edges)}
    obj.castShadow=obj.receiveShadow=!sheet;if(sys==='drywall')obj.renderOrder=2;parts.push(part)});
   const box=new T.Box3().setFromObject(model),center=box.getCenter(new T.Vector3());model.position.sub(center);spin.add(model);spin.updateMatrixWorld(true);ground.position.y=box.min.y-center.y-.002;
   const all:T.Object3D[]=[];model.traverse(o=>{if(o.userData.explode)all.push(o)});const orderOf=(n:T.Object3D)=>Number(n.userData.order??config.order?.[plain(n.name)]??0),maxOrder=Math.max(1,...all.map(orderOf).filter(o=>o<9));
   for(const node of all){const vector=new T.Vector3(...(node.userData.explode as number[])),layer={node,home:node.position.clone(),vector,local:vector.clone().applyMatrix3(new T.Matrix3().setFromMatrix4(node.parent!.matrixWorld)),delay:Math.min(orderOf(node),maxOrder)/maxOrder*.32,extent:new T.Box3().setFromObject(node)};layers.push(layer);if(config.autoGuides)node.userData.guides='center';
    // Guides start on the side of each part facing away from where it travels.
    if(layer.vector.lengthSq()>0)node.traverse(part=>{const kind=part.userData.guides;if(kind!=='corners'&&kind!=='center')return;const b=new T.Box3().setFromObject(part);spin.worldToLocal(b.min);spin.worldToLocal(b.max);
     const v=layer.vector,axis=Math.abs(v.x)>Math.abs(v.y)?(Math.abs(v.x)>Math.abs(v.z)?'x':'z'):(Math.abs(v.y)>Math.abs(v.z)?'y':'z'),trailing=v[axis]>0?b.min[axis]:b.max[axis],others=(['x','y','z'] as const).filter(a=>a!==axis),pts:T.Vector3[]=[];
     if(kind==='center'){const p=b.getCenter(new T.Vector3());p[axis]=trailing;pts.push(p)}else for(const s of [[0,0],[1,0],[0,1],[1,1]]){const p=new T.Vector3();p[axis]=trailing;p[others[0]]=s[0]?b.max[others[0]]:b.min[others[0]];p[others[1]]=s[1]?b.max[others[1]]:b.min[others[1]];pts.push(p)}
     for(const p of pts)guides.push({from:p,layer})});
    const pick=config.labels.find(([name])=>plain(name)===plain(node.name));if(pick){const span=document.createElement('span');span.className=`wall-label system-${pick[2]}`;span.dataset.base=pick[1];span.textContent=words.current?.labels[pick[0]]??pick[1];labelEls.current.set(pick[0],span);if(pick[4])span.style.setProperty('--dot',pick[4]);labelHost.append(span);const line=document.createElementNS(svgNS,'path'),dot=document.createElementNS(svgNS,'circle');dot.setAttribute('r','2.5');leaders.append(line,dot);
     let target:T.Object3D=node;if(pick[3])node.traverse(o=>{if(plain(o.name)===plain(pick[3]!))target=o});const local=(o:T.Object3D)=>{const b=new T.Box3().setFromObject(o);spin.worldToLocal(b.min);spin.worldToLocal(b.max);return b};labels.push({layer,box:local(target),extent:local(node),el:span,line,dot})}}
   guideGeometry.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(guides.length*6),3));
   const sphere=new T.Box3().setFromObject(model).getBoundingSphere(new T.Sphere());radiusHome=sphere.radius;setLayers(1,1);spin.updateMatrixWorld(true);const open=new T.Box3().setFromObject(model).getBoundingSphere(new T.Sphere());radiusOpen=Math.max(open.radius,radiusHome);openCenter.copy(open.center);setLayers(0);
   // AO reach, shadow offsets and dash lengths follow the model's size (the kit is a tenth of the wall).
   const R=radiusHome;key.shadow.normalBias=R*.0085;guideMaterial.dashSize=R*.013;guideMaterial.gapSize=R*.015;camera.near=R*.02;camera.far=R*60;camera.updateProjectionMatrix();
   const s=radiusOpen*1.25;Object.assign(key.shadow.camera,{left:-s,right:s,top:s,bottom:-s,near:.5,far:30});key.shadow.camera.updateProjectionMatrix();
   void warmUp().catch(()=>{}).then(()=>{if(disposed)return;warm=true;readyAt=performance.now();setStatus({kind:'ready'});el.dataset.ready='true'})},progress=>{if(progress.total)setStatus({kind:'loading',pct:Math.round(progress.loaded/progress.total*100)})},()=>{if(!disposed)setStatus({kind:'failed'})});

  const setLayers=(amount:number,scale=spread)=>{for(const layer of layers){const t=smooth((amount-layer.delay)/(1-.32));layer.node.position.copy(layer.home).addScaledVector(layer.vector,t*scale)}};
  const progressOf=(layer:Layer)=>smooth((explode-layer.delay)/(1-.32));
  const updateGuides=()=>{const pos=guideGeometry.getAttribute('position') as T.BufferAttribute|undefined;if(!pos)return;guides.forEach((g,i)=>{const k=progressOf(g.layer)*spread,v=g.layer.local;pos.setXYZ(i*2,g.from.x,g.from.y,g.from.z);pos.setXYZ(i*2+1,g.from.x+v.x*k,g.from.y+v.y*k,g.from.z+v.z*k)});pos.needsUpdate=true;guideLines.computeLineDistances();guideGeometry.computeBoundingSphere()};
  const project=new T.Vector3(),corner=new T.Vector3();
  /** Labels line up in a column right of the drawing; thin leaders run back to each layer. */
  const placeLabels=()=>{const w=el.clientWidth,h=el.clientHeight,items:{label:typeof labels[number];ax:number;ay:number;y:number}[]=[];let right=-Infinity;
   for(const layer of layers){const off=layer.local.clone().multiplyScalar(progressOf(layer)*spread),e=layer.extent;for(let k=0;k<8;k++){corner.set(k&1?e.max.x:e.min.x,k&2?e.max.y:e.min.y,k&4?e.max.z:e.min.z).add(off);project.copy(corner).applyMatrix4(spin.matrixWorld).project(camera);right=Math.max(right,(project.x+1)/2*w)}}
   for(const label of labels){const t=progressOf(label.layer),show=label.layer.vector.lengthSq()===0?smooth((explode-.55)/.3):smooth((t-.6)/.35);label.el.style.opacity=show.toFixed(3);label.line.style.opacity=(show*.55).toFixed(3);label.dot.style.opacity=show.toFixed(3);if(show<=.001)continue;
    const off=label.layer.local.clone().multiplyScalar(t*spread);
    label.box.getCenter(corner).add(off);project.copy(corner).applyMatrix4(spin.matrixWorld).project(camera);const ay=(1-project.y)/2*h;items.push({label,ax:(project.x+1)/2*w,ay,y:ay})}
   const narrow=w<560,column=Math.min(w-(narrow?96:170),right+(narrow?14:36));
   items.sort((a,b)=>a.y-b.y);for(let i=1;i<items.length;i++)if(items[i].y-items[i-1].y<18)items[i].y=items[i-1].y+18;
   for(const it of items){it.label.el.style.transform=`translate3d(${column.toFixed(1)}px,${it.y.toFixed(1)}px,0)`;it.label.line.setAttribute('d',`M${it.ax.toFixed(1)} ${it.ay.toFixed(1)}L${(column-18).toFixed(1)} ${it.y.toFixed(1)}H${(column-4).toFixed(1)}`);it.label.dot.setAttribute('cx',it.ax.toFixed(1));it.label.dot.setAttribute('cy',it.ay.toFixed(1))}};

  // ---- interaction ----
  let dragging=false,startX=0,startY=0,lastX=0,lastY=0,pointerId=-1,armed=false;
  // The exploded view stays after a drag (or lingers, then reassembles and the turntable resumes).
  const press=()=>{held=true};
  const release=()=>{held=false;if(config.stay)toggled=true;else holdUntil=performance.now()+2600};
  const down=(e:PointerEvent)=>{if(e.button!==0)return;dragging=true;armed=e.pointerType==='mouse';startX=lastX=e.clientX;startY=lastY=e.clientY;pointerId=e.pointerId;if(armed){press();canvas.setPointerCapture(e.pointerId)}};
  const move=(e:PointerEvent)=>{if(!dragging||e.pointerId!==pointerId)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;
   if(!armed){if(Math.abs(e.clientX-startX)<8)return;if(Math.abs(e.clientY-startY)>Math.abs(e.clientX-startX)){dragging=false;return}armed=true;press();canvas.setPointerCapture(e.pointerId)}
   azimuth-=dx*.0075;velocity=-dx*.0075;elevation=T.MathUtils.clamp(elevation+dy*.003,T.MathUtils.degToRad(5),T.MathUtils.degToRad(42))};
  const lift=(e:PointerEvent)=>{if(e.pointerId!==pointerId)return;if(armed)release();dragging=false;armed=false;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId)};
  const keyDown=(e:KeyboardEvent)=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();azimuth+=e.key==='ArrowLeft'?.18:-.18}else if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();elevation=T.MathUtils.clamp(elevation+(e.key==='ArrowUp'?.08:-.08),T.MathUtils.degToRad(5),T.MathUtils.degToRad(42))}else if(e.key==='Enter'||e.key===' '){e.preventDefault();holdUntil=0;toggled=!toggled}};
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',lift);canvas.addEventListener('pointercancel',lift);canvas.addEventListener('keydown',keyDown);

  const fade=(entry:Entry,isDiagram:boolean,f:WallSystem|null,dt:number,ghostOpacity:number)=>{const k=`${isDiagram?'d':'r'}|${entry.system}|${entry.name}`,goal=!f||entry.system===f?1:['framing','structure','drywall','insulation'].includes(entry.system)?.28:.08,cur=dim.get(k)??1,next=cur+(goal-cur)*(1-Math.exp(-dt*9));dim.set(k,next);
   const ghost=entry.system==='drywall',see=ghost||next<.995;entry.mat.opacity=(ghost&&isDiagram?ghostOpacity:1)*next;if(entry.mat.transparent!==see){entry.mat.transparent=see;entry.mat.depthWrite=!see;entry.mat.needsUpdate=true}};
    // Slow devices drop ambient occlusion and resolution rather than stutter.
  let ema=1/60,since=0;
  const draw=(now:number)=>{if(disposed)return;frame=requestAnimationFrame(draw);if(quality==='low'&&now-last<66)return;const dt=Math.min(.1,(now-last)/1000);last=now;if(!visible||document.hidden||!model||!warm)return;
   // Under sustained slow frames the render steps down in resolution, and back up once frames recover, but never
   // above a level that has already proved slow on this device.
   if(quality!=='low'&&readyAt&&now-readyAt>1500){ema=ema*.9+dt*.1;const slow=ema>1/42&&ratio>minRatio,fast=ema<1/56&&ratio<maxRatio;
    if(slow||fast){since=since||now;if(now-since>(slow?600:3000)){since=0;ema=1/60;if(slow)maxRatio=ratio-.25;ratio=slow?Math.max(minRatio,maxRatio):Math.min(maxRatio,ratio+.25);setRatio();el.dataset.ratio=String(ratio)}}else since=0}
   const {reality:r,focus:f}=state.current;if(r!==appliedReality){appliedReality=r;applyReality(r)}
   const reduced=motion.matches,target=Math.max(held||toggled||now<holdUntil?1:0,reduced?0:smooth(((scroll.current??0)-config.scroll[0])/config.scroll[1]));
   explode=reduced?target:explode+(target-explode)*(1-Math.exp(-dt*3.2));if(Math.abs(target-explode)<.0005)explode=target;
   if(!dragging&&!reduced){velocity*=Math.exp(-dt*3);const open=smooth(explode/.6);azimuth+=velocity+dt*config.view.spin*(1-Math.min(1,Math.abs(velocity)*20))*(1-open);
    // Once separated, settle onto the nearest 45° diagonal so the layers read as an exploded axonometric.
    if(open>0&&Math.abs(velocity)<.002){const diagonal=Math.round((azimuth-Math.PI/4)/(Math.PI/2))*(Math.PI/2)+Math.PI/4;azimuth+=(diagonal-azimuth)*(1-Math.exp(-dt*2.2*open));elevation+=(T.MathUtils.degToRad(config.view.openElevation)-elevation)*(1-Math.exp(-dt*1.6*open))}}
   setLayers(explode);updateGuides();
   // As the board flies forward its solid edge thins out, leaving a line drawing over the exploded systems.
   if(sheetFade){const open=smooth(explode/.7);sheetFade.fadeMax.value=T.MathUtils.lerp(.94,.16,open);sheetFade.fadeMin.value=T.MathUtils.lerp(.035,.02,open)}const diag=diagrams[r];guideMaterial.opacity=(diag?diag.guideOpacity:.3)*smooth(explode/.25);
   // Systems not in focus fade back; framing, structure, insulation and gypsum stay faintly present.
   if(r===0)for(const entry of reals.values())fade(entry,false,f,dt,1);else for(const entry of diagramMats.values())fade(entry,true,f,dt,diag?.ghost??.1);
   for(const line of edgeMats.values())line.opacity=(diag?.edgeOpacity??.14)*(f?.6:1);sheetLineMat.opacity=(diag?.6:.7)*(f?.5:1);
   const radius=T.MathUtils.lerp(radiusHome,radiusOpen,smooth(explode)*spread),half=T.MathUtils.degToRad(camera.fov/2),fitV=Math.atan(Math.tan(half)*(1-2*shiftY)),fitH=Math.atan(Math.tan(half)*aspect*(1-2*shiftX)),dist=radius/Math.sin(Math.min(fitV,fitH))*T.MathUtils.lerp(config.view.margin,config.view.openMargin,smooth(explode));
   // Aim drifts from the assembled center to the exploded one, so separated parts stay in frame.
   aim.set(0,0,0).lerp(openCenter,smooth(explode)*spread);camera.position.set(aim.x+Math.sin(azimuth)*Math.cos(elevation)*dist,aim.y+Math.sin(elevation)*dist,aim.z+Math.cos(azimuth)*Math.cos(elevation)*dist);camera.lookAt(aim);(ground.material as T.ShadowMaterial).opacity=.16*(1-.95*smooth(explode/.45));camera.updateMatrixWorld();
   // The key light turns partway with the camera so the open face stays lit as the wall rotates.
   key.position.set(-4.5,6.5,5.5).applyAxisAngle(up,azimuth*.6);
   spin.updateMatrixWorld(true);placeLabels();
   const exploded=explode>.5;if(exploded!==lastExploded){lastExploded=exploded;state.current.onExploded?.(exploded)}
   renderer.render(scene,camera)};
  frame=requestAnimationFrame(draw);
  return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();seen.disconnect();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',lift);canvas.removeEventListener('pointercancel',lift);canvas.removeEventListener('keydown',keyDown);
   scene.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.LineSegments)o.geometry.dispose()});for(const {mat} of reals.values())mat.dispose();for(const {mat} of diagramMats.values())mat.dispose();for(const m of edgeMats.values())m.dispose();(ground.material as T.Material).dispose();guideMaterial.dispose();sheetLineMat.dispose();textures.noise.dispose();textures.spangle.dispose();
   draco.dispose();environment.dispose();renderer.dispose();canvas.remove();labelHost.replaceChildren();spans.clear()};
 },[scroll]);
 const message=status.kind==='ready'?'':status.kind==='loading'?`${text?.loading??'LOADING'}${status.pct===undefined?'':` ${status.pct}%`}`:status.kind==='unavailable'?text?.unavailable??'3D VIEW UNAVAILABLE IN THIS BROWSER':text?.failed??'MODEL UNAVAILABLE';
 return <div className="wall-viewer" data-cursor={text?.cursor??'DRAG TO EXPLODE'}><div ref={host} className="wall-canvas"/><div ref={labelsRef} className="wall-labels" aria-hidden="true"/>{message&&<p className="wall-status" role="status">{message}</p>}</div>
}
