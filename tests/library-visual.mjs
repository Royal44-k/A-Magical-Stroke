import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';import {fresh,KEY,finish,sign} from '../src/model.mjs';import {reviseLibrary,startSearch,stepSearch} from '../src/library.mjs';
const b=await chromium.launch({channel:'msedge',headless:true}),p=await b.newPage({viewport:{width:1487,height:1058},deviceScaleFactor:1}),checks=[],errors=[];fs.mkdirSync('artifacts/v1.4',{recursive:true});p.on('pageerror',e=>errors.push(e.message));const click=n=>p.getByRole('button',{name:n,exact:true}).click();
async function seed(s){await p.goto('http://127.0.0.1:4185/');await p.evaluate(({KEY,s})=>localStorage.setItem(KEY,JSON.stringify(s)),{KEY,s});await p.reload();await click('接着画下去');}
try{
 await p.goto('http://127.0.0.1:4185/?release=1.4');await p.evaluate(()=>document.fonts.ready);await p.locator('.hero-art').evaluate(i=>i.decode());await p.screenshot({path:'artifacts/v1.4/home-final.png'});
 const s=finish(sign(fresh(),'accept'));s.library.active=true;s.library=reviseLibrary(s.library,{method:'mark',marks:{insects:'circle',stars:'circle',seeds:'square'}});s.library=startSearch(s.library);s.library=stepSearch(s.library);await seed(s);await click('小禾，帮我看看');
 for(const width of [320,390,601,768,1024,1487]){await p.setViewportSize({width,height:width<=600?844:1058});await p.locator('.library-layout').evaluate(e=>e.scrollIntoView({block:'start'}));assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const main=await p.locator('.play').boundingBox(),bubble=await p.locator('.guide-bubble').boundingBox();assert.ok(width<=600?main.y+main.height<=bubble.y+1:main.x+main.width<=bubble.x+1,JSON.stringify({width,main,bubble}));
 const small=await p.locator('.library-lab button').evaluateAll(es=>es.map(e=>({label:e.textContent,r:e.getBoundingClientRect()})).filter(x=>x.r.width&&x.r.height&&(x.r.width<44||x.r.height<44)).map(x=>x.label));assert.deepEqual(small,[],String(width));
 const boxes=await p.locator('[data-basket]').evaluateAll(es=>es.map(e=>({x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y})));assert.ok(boxes.every(x=>Math.abs(x.y-boxes[0].y)<1)&&boxes[0].x<boxes[1].x&&boxes[1].x<boxes[2].x,'左右关系须在窄屏保留');
 await p.screenshot({path:'artifacts/v1.4/shelf-'+width+'.png'});await p.locator('.search-stage').evaluate(e=>e.scrollIntoView({block:'start'}));await p.screenshot({path:'artifacts/v1.4/search-'+width+'.png'});checks.push(width+'px：无横溢，气泡避让，左右关系保留，按钮至少44px');
 }
 await click('收起小禾的话');await p.locator('.library-layout').screenshot({path:'artifacts/v1.4/library-layout-final.png'});await p.locator('.library-scene').screenshot({path:'artifacts/v1.4/library-scene-desktop.png'});
 await p.setViewportSize({width:390,height:844});await p.locator('.library-scene').evaluate(e=>e.scrollIntoView({block:'start'}));await p.screenshot({path:'artifacts/v1.4/library-entry-mobile.png'});
 await p.emulateMedia({reducedMotion:'reduce'});assert.equal(await p.locator('.guide-figure').evaluate(e=>getComputedStyle(e).animationName),'none');checks.push('减少动态时仍可逐步操作与观察');
 assert.deepEqual(errors,[]);fs.writeFileSync('artifacts/v1.4/library-visual-results.json',JSON.stringify({checks,errors},null,2));console.log(checks);
}finally{await b.close()}
