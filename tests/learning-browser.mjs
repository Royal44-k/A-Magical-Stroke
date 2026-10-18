import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {KEY,fresh,routeToGrid,BYPASS,trial,visit,testHandoff,finish} from '../src/model.mjs';
const browser=await chromium.launch({channel:'msedge',headless:true}),checks=[],errors=[],base='http://127.0.0.1:4185';
fs.mkdirSync('artifacts/v1.1',{recursive:true});
const ok=text=>{checks.push(text);console.log('PASS '+text)};
const read=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
const click=(p,name)=>p.getByRole('button',{name,exact:true}).click();
async function pageFor(s,viewport={width:1487,height:1058}){
 const ctx=await browser.newContext({viewport,acceptDownloads:true}),p=await ctx.newPage();
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 await p.goto(base);if(s){await p.evaluate(({k,s})=>localStorage.setItem(k,JSON.stringify(s)),{k:KEY,s});await p.reload();}return p;
}
try{
 let waterState=visit(fresh(),'workshop');waterState.gift='roof';waterState.grid=routeToGrid(BYPASS);
 const p=await pageFor(waterState);await click(p,'接着画下去');await click(p,'能到田边');await click(p,'让水走一走');
 assert.equal(await p.getByRole('button',{name:'再走一格',exact:true}).isDisabled(),true);assert.equal(await p.locator('.water-bead').count(),0);assert.match(await p.locator('.water-stepper').innerText(),/支架/);ok('缺少提水条件时没有虚假的流动水滴');
 await p.getByLabel('请鲁伯装好支架',{exact:true}).check();await p.getByLabel('请大人清理渠口',{exact:true}).check();await click(p,'让水走一走');await click(p,'再走一格');
 assert.equal(await p.locator('[data-cell="18"] .water-bead').count(),1);await click(p,'再走一格');assert.equal(await p.locator('[data-cell="12"] .water-bead').count(),1);ok('逐格观察沿实际拼好的水路前进，并指出位置');
 await click(p,'慢慢走一遍');await p.waitForTimeout(950);await click(p,'停在这里');const paused=await p.locator('.water-stepper header>span').innerText();await p.waitForTimeout(850);assert.equal(await p.locator('.water-stepper header>span').innerText(),paused);
 await click(p,'从出水口重看');assert.equal(await p.locator('.water-bead').count(),0);ok('水滴可以慢走、暂停和从头重看');
 await click(p,'阅读设置');await p.getByLabel('让画面安静一些，减少动作').check();await p.keyboard.press('Escape');assert.equal(await p.getByRole('button',{name:'慢慢走一遍',exact:true}).isDisabled(),true);await click(p,'再走一格');assert.equal(await p.locator('.water-bead').count(),1);ok('减少动作时仍可手动观察，不减少教学信息');
 await click(p,'直水槽');await p.locator('[data-cell="0"]').click();assert.equal(await p.locator('.water-bead').count(),0);assert.equal(await p.getByRole('button',{name:'再走一格',exact:true}).isDisabled(),true);ok('修改图纸立即撤回旧水流结果');
 await click(p,'撤回一步');await click(p,'让水走一走');for(let i=0;i<BYPASS.length;i++)await click(p,'再走一格');assert.match(await p.locator('.water-stepper').innerText(),/水到了田边/);
 await p.locator('.workbench').screenshot({path:'artifacts/v1.1/water-desktop.png'});await click(p,'水到了，再想想明天');
 await p.getByLabel('平时请谁带头？').selectOption('鲁伯');await p.getByLabel('他有事时，请谁接着来？').selectOption('周婶');for(const step of ['看看支架和水槽','按轮次提水','停下来，收好工具'])await click(p,step);

 await click(p,'按轮次提水往前放');await click(p,'试一回：带头的人请假了');await click(p,'照着图，再做一步');assert.equal((await read(p)).handoff.run.flowing,false);assert.match(await p.locator('.handoff-runner .feedback').innerText(),/还没让/);assert.equal((await read(p)).handoff.cardTrials.length,1);await click(p,'看看支架和水槽往前放');await click(p,'试一回：带头的人请假了');await click(p,'照着图，再做一步');await click(p,'照着图，再做一步');assert.equal((await read(p)).handoff.tested,false);ok('错序按图执行并停在缺少检查处，改后检查和提水可推进');
 await p.reload();await click(p,'接着画下去');assert.equal((await read(p)).handoff.run.flowing,true);await click(p,'照着图，再做一步');assert.equal((await read(p)).handoff.tested,false);assert.equal((await read(p)).handoff.run.stopped,true);await click(p,'照着图，再做一步');assert.equal((await read(p)).handoff.tested,true);assert.equal(await p.getByRole('button',{name:'照着图，再做一步',exact:true}).count(),0);ok('交接中途刷新能续做，停下后还要收好工具才完成');
 await p.locator('.handoff-runner').screenshot({path:'artifacts/v1.1/handoff-desktop.png'});await p.getByLabel('他有事时，请谁接着来？').selectOption('陈叔');assert.equal((await read(p)).handoff.tested,false);assert.equal((await read(p)).handoff.run,null);assert.equal((await read(p)).handoff.cardTrials.length,2);ok('更换接手人后需要重新演练，前两回保留');

 const saved=await read(p);saved.handoff={lead:'鲁伯',backup:'周婶',steps:['check','open','close'],tested:false};let storyState=finish(testHandoff(saved));storyState.seen={inlet:[0],field:[0],door:[0]};
 const q=await pageFor(storyState);await click(q,'接着画下去');await click(q,'把故事画成三格');assert.equal(await q.locator('.story-leaf.empty').count(),3);
 assert.equal(await q.getByRole('button',{name:'连起来看',exact:true}).isDisabled(),true);await q.locator('dialog').screenshot({path:'artifacts/v1.1/story-empty.png'});ok('三格画页有明确空状态，不替学生编造经历');
 await click(q,'放入补好屋顶');await q.getByLabel('第1格的话',{exact:true}).fill('我先修屋顶。<script>alert(1)</script>');await click(q,'试过的办法');await click(q,'放入第1次试水');await click(q,'放入第2次试水');const firstSnapshots=(await read(q)).storybook.frames.map(f=>f.grid);
 await click(q,'我的选择');assert.equal(await q.getByRole('button',{name:'放入补好屋顶',exact:true}).isDisabled(),true);ok('只能选择已经发生的经历，同一幅不会重复放入');
 await click(q,'第1格往后放');assert.match((await read(q)).storybook.frames[1].caption,/先修屋顶/);
 await q.locator('.frame-drag').nth(1).dragTo(q.locator('.frame-drag').nth(2));assert.match((await read(q)).storybook.frames[2].caption,/先修屋顶/);assert.deepEqual((await read(q)).storybook.frames[0].grid,firstSnapshots[1]);ok('按钮与拖曳均能重排画格，文字和试水快照跟着画面走');
 await q.getByLabel('给故事起个名字').fill('水找到路的那一天');await q.getByLabel('第1格的话',{exact:true}).fill('我发现支架还没装好。');await q.getByLabel('留给下一位伙伴的话').fill('你会先看看哪一个地方？');
 await q.reload();await click(q,'接着画下去');await click(q,'把故事画成三格');assert.equal((await read(q)).storybook.title,'水找到路的那一天');assert.equal((await read(q)).storybook.frames.length,3);assert.match((await read(q)).storybook.frames[2].caption,/script/);ok('标题、画格顺序和自己的话均可刷新恢复');
 await q.locator('.story-ribbon').screenshot({path:'artifacts/v1.1/story-ribbon-desktop.png'});await click(q,'连起来看');assert.equal(await q.locator('.story-view-frame').count(),1);await click(q,'后一格');await click(q,'前一格');await click(q,'帮我翻页');await click(q,'停一停');await q.locator('dialog').screenshot({path:'artifacts/v1.1/story-viewer.png'});await click(q,'回去改一改');ok('讲故事可自己翻页或请求慢速翻页，随时停下修改');
 const downloadEvent=q.waitForEvent('download');await click(q,'保存我的三格故事');const download=await downloadEvent;await download.saveAs('artifacts/v1.1/student-story.html');const html=fs.readFileSync('artifacts/v1.1/student-story.html','utf8');assert.match(html,/data:image\/png;base64,/);assert.match(html,/&lt;script&gt;/);assert.ok(!html.includes('<script>'));
 const offline=await browser.newContext({offline:true}),offlinePage=await offline.newPage();await offlinePage.goto('file:///'+process.cwd().replaceAll('\\','/')+'/artifacts/v1.1/student-story.html');assert.equal(await offlinePage.locator('article').count(),3);assert.equal(await offlinePage.locator('img').evaluateAll(a=>a.every(i=>i.complete&&i.naturalWidth>0)),true);assert.equal(await offlinePage.locator('h1').innerText(),'水找到路的那一天');await offline.close();ok('导出的故事包含图片，断网可读，特殊文字不会执行代码');
 await q.getByRole('button',{name:'关闭',exact:true}).focus();await q.keyboard.press('Shift+Tab');const trapped=await q.evaluate(()=>document.activeElement.closest('dialog')!==null);assert.equal(trapped,true);await q.keyboard.press('Escape');assert.equal(await q.getByRole('dialog',{name:'我的奇幻画册'}).count(),1);ok('三格故事的键盘焦点留在弹窗，Escape回到画册');
 const empty=await pageFor();await click(empty,'我的画册');await click(empty,'做一份三格故事');assert.equal(await empty.locator('.source-card').count(),0);assert.match(await empty.locator('.source-empty').innerText(),/画卷还没有展开/);ok('没有开始故事时，没有预填的成果或虚构素材');
 const finalState=await read(q);
 for(const width of [320,390,768]){
  const mobile=await pageFor(finalState,{width,height:844});await click(mobile,'接着画下去');await click(mobile,'把故事画成三格');
  const dims=await mobile.locator('dialog').evaluate(el=>({scroll:el.scrollWidth,client:el.clientWidth,left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,w:innerWidth}));assert.ok(dims.scroll<=dims.client+1,JSON.stringify(dims));assert.ok(dims.left>=0&&dims.right<=dims.w+1);await mobile.locator('.story-leaf').first().scrollIntoViewIfNeeded();await mobile.screenshot({path:'artifacts/v1.1/story-'+width+'.png'});await mobile.getByLabel('第1格的话',{exact:true}).fill('我再看一看。');await click(mobile,'第1格往后放');assert.equal((await read(mobile)).storybook.frames[1].caption,'我再看一看。');
  ok(width+'像素下画页不横溢，点选换序与文字输入可用');await mobile.context().close();
 }
 assert.deepEqual(errors,[]);ok('新版交互没有浏览器脚本异常或资源错误');
 fs.writeFileSync('artifacts/v1.1/learning-browser-results.json',JSON.stringify({date:'2026-10-13',checks,errors},null,2));
}finally{await browser.close()}
