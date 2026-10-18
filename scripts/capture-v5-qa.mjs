import { chromium } from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fresh5, KEY5 } from '../src/v5/model.mjs';
const out='artifacts/v5.0';
const {server}=await import('../server.mjs');
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1376,height:749}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto(base);await page.locator('.q5-paper-stage canvas').waitFor();await page.waitForTimeout(900);
 await page.screenshot({path:out+'/qa-home-final.jpg'});
 await page.goto(base+'/?story=cow');await page.locator('.q5-paper-stage canvas').waitFor();await page.waitForTimeout(700);
 await page.screenshot({path:out+'/qa-intro-final.jpg'});
 const work=fresh5();for(const c of Object.values(work.chapters))c.phase='play';
 work.chapters.mill.designs[0].drive=8;work.chapters.mill.designs[0].driven=24;
 await page.evaluate(({key,work})=>localStorage.setItem(key,JSON.stringify(work)),{key:KEY5,work});
 await page.setViewportSize({width:1440,height:960});await page.goto(base+'/?story=mill');await page.locator('.q5-workbench').scrollIntoViewIfNeeded();
 await page.screenshot({path:out+'/qa-gears-final.jpg'});
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await mobile.addInitScript(({key,work})=>localStorage.setItem(key,JSON.stringify(work)),{key:KEY5,work});
 const widths=[];
 for(const width of [320,390,768]){
  await mobile.setViewportSize({width,height:844});
  for(const id of ['','water','cow','mill','sea','report']){
   await mobile.goto(base+(id?'/?story='+id:''));await mobile.waitForTimeout(250);
   assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),width+' '+id+' overflow');
  }
  widths.push(width);
 }
 await mobile.setViewportSize({width:390,height:844});await mobile.goto(base+'/?story=sea');
 await mobile.screenshot({path:out+'/qa-sea-mobile-final.jpg',fullPage:true});
 await mobile.goto(base+'/?story=mill');await mobile.screenshot({path:out+'/qa-mill-mobile-final.jpg',fullPage:true});
 await mobile.close();assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/layout-validation.json',JSON.stringify({status:'passed',widths,views:['home','water','cow','mill','sea','report'],errors},null,2));
 console.log('Final screenshots captured; 18 responsive viewport/view combinations passed.');
} finally {await browser.close();await new Promise(r=>server.close(r));}
