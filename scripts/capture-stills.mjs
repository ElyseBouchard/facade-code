// Renders the stills shown when a browser can't draw the 3D views (src/landing/stills.tsx): each pinned view as 12 frames
// from assembled to taken apart (the page's ?capture mode sets the explode amount and camera exactly), and the numbers
// view once its lines have risen, at desktop and phone framing, with a transparent background. Run against a production
// build:
//   npm run build && npx vite preview --port 5201 &
//   node scripts/capture-stills.mjs [out-dir]        (PNG; then convert to WebP into public/stills)
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
const base=process.env.URL||'http://127.0.0.1:5201/',out=process.argv[2]||'assets/stills';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({args:['--use-angle=metal','--ignore-gpu-blocklist','--enable-gpu']});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(const [suffix,viewport,dpr] of [['',{width:1440,height:900},1.5],['-m',{width:390,height:844},2]]){
 const page=await browser.newPage({viewport,deviceScaleFactor:dpr,isMobile:suffix==='-m',hasTouch:suffix==='-m',reducedMotion:'no-preference'});
 await page.goto(new URL('?capture',base).href,{waitUntil:'load'});
 await page.addStyleTag({content:'html,body{background:transparent!important}body *{visibility:hidden!important}.capture-target,.capture-target *{visibility:visible!important}.capture-target .site-legend,.capture-target .site-legend *,.capture-target .wall-status{visibility:hidden!important}'});
 // Pinned sections: progress 0 (assembled) at the section's top, 1 (taken apart) a pinned range further.
 const pin=(id,p)=>page.evaluate(([id,p])=>{const e=document.getElementById(id),top=e.getBoundingClientRect().top+scrollY,range=Math.max(innerHeight*.6,e.offsetHeight-innerHeight);window.scrollTo({top:top+range*p,behavior:'instant'})},[id,p]);
 const shoot=async(selector,name)=>{const el=page.locator(selector).first();await el.evaluate(e=>e.classList.add('capture-target'));await el.screenshot({path:`${out}/${name}${suffix}.png`,omitBackground:true});await el.evaluate(e=>e.classList.remove('capture-target'));console.log('wrote',`${name}${suffix}.png`)};
 for(const [id,name] of [['inside','wall'],['field-kit','kit']]){
  await pin(id,.5);await page.waitForSelector(`#${id} .wall-canvas[data-ready="true"]`,{state:"attached",timeout:30000});
  for(let k=0;k<12;k++){await page.evaluate(([name,e])=>{window.__explode={[name]:e}},[name,k/11]);await wait(k===0?1500:450);await shoot(`#${id} .wall-viewer`,`${name}-${String(k).padStart(2,'0')}`)}
  await page.evaluate(()=>{delete window.__explode})}
 await page.evaluate(()=>{const e=document.getElementById('costs');window.scrollTo({top:e.getBoundingClientRect().top+scrollY,behavior:'instant'})});
 await page.waitForSelector('#costs .site-canvas[data-ready="true"]',{state:"attached",timeout:30000});await wait(9000);await shoot('#costs .site-viewer','site');
 await page.close();
}
await browser.close();
