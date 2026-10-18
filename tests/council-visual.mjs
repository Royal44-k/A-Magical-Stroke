import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';import {fresh,KEY,visit,sign} from '../src/model.mjs';import {emptyCouncil,reviseCouncil,startCouncilRun,advanceCouncil,tomorrowCouncil} from '../src/council.mjs';
const browser=await chromium.launch({channel:'msedge',headless:true}),p=await browser.newPage({viewport:{width:1487,height:1058},deviceScaleFactor:1}),checks=[],errors=[];fs.mkdirSync('artifacts/v1.3',{recursive:true});p.on('pageerror',e=>errors.push(e.message));
async function seed(s){await p.goto('http://127.0.0.1:4185/');await p.evaluate(({KEY,s})=>localStorage.setItem(KEY,JSON.stringify(s)),{KEY,s});await p.reload();await p.getByRole('button',{name:'接着画下去',exact:true}).click();}
try{
 await p.goto('http://127.0.0.1:4185/?release=1.3');await p.evaluate(()=>document.fonts.ready);await p.locator('.hero-art').evaluate(i=>i.decode());await p.screenshot({path:'artifacts/v1.3/home-final.png'});
 const s=sign(visit(fresh(),'court'),'accept');s.strategy='speak';s.evidence=['fact','needs','plan'];s.council=emptyCouncil();s.council.begun=true;s.council.heard=['zhou','lu'];s.council=reviseCouncil(s.council,{access:'today'});s.council=startCouncilRun(s.council);for(let i=0;i<3;i++)s.council=advanceCouncil(s.council);s.council=tomorrowCouncil(s.council);await seed(s);await p.getByRole('button',{name:'小禾，帮我看看',exact:true}).click();
 for(const width of [320,390,601,768,1024,1487]){await p.setViewportSize({width,height:width<=600?844:1058});await p.locator('.queue-workshop').evaluate(e=>e.scrollIntoView({block:'start'}));assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const a=await p.locator('.play').boundingBox(),b=await p.locator('.guide-bubble').boundingBox();assert.ok(width<=600?a.y+a.height<=b.y+1:a.x+a.width<=b.x+1,JSON.stringify({width,a,b}));
 const small=await p.locator('.council button').evaluateAll(els=>els.map(e=>({label:e.textContent,rect:e.getBoundingClientRect()})).filter(({rect:r})=>r.width&&r.height&&(r.width<44||r.height<44)).map(x=>x.label));assert.deepEqual(small,[],String(width));
 await p.screenshot({path:'artifacts/v1.3/queue-'+width+'.png'});await p.locator('.council-days').evaluate(e=>e.scrollIntoView({block:'start'}));await p.screenshot({path:'artifacts/v1.3/tomorrow-'+width+'.png'});checks.push(width+'px：页面不横溢，同伴不遮操作，所有新按钮至少44px');
 }
 await p.getByRole('button',{name:'小禾，帮我看看',exact:true}).click();await p.locator('.council').screenshot({path:'artifacts/v1.3/council-full-final.png'});
 await p.emulateMedia({reducedMotion:'reduce'});assert.equal(await p.locator('.day-content').evaluate(e=>getComputedStyle(e).animationName),'none');checks.push('减少动态效果时，翻到明天的关键信息完整');
 assert.deepEqual(errors,[]);fs.writeFileSync('artifacts/v1.3/council-visual-results.json',JSON.stringify({checks,errors},null,2));console.log(checks);
}finally{await browser.close()}
