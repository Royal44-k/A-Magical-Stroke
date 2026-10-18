async function confirmCouncil(p){await click(p,'明天也能来吗？');await click(p,'人多时怎样排？');await click(p,'大家以后都能按次序取水');await click(p,'照着草案，试一回');for(let i=0;i<3;i++)await click(p,'请下一位试取水');await click(p,'翻到明天');await click(p,'请大家确认新约定');}
import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';
import {routeToGrid,BYPASS,KEY} from '../src/model.mjs';
const browser=await chromium.launch({channel:'msedge',headless:true}),checks=[],errors=[],base='http://127.0.0.1:4185';
fs.mkdirSync('artifacts',{recursive:true});
function ok(text){checks.push(text);console.log('PASS '+text)}
async function read(page){return page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY)}
async function click(page,text){await page.getByRole('button',{name:text,exact:true}).click();}
async function newPage(state,options={}){const ctx=await browser.newContext({viewport:{width:1487,height:1058},...options}),page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});if(state)await page.addInitScript(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key:KEY,value:state});await page.goto(base);return page;}
try{
 const p=await newPage();await click(p,'展开画卷');
 assert.equal(await p.locator('h1').innerText(),'雨夜，笔尖亮了');
 await click(p,'漏斗出口');await click(p,'桌边');await click(p,'让雨滴走一走');assert.equal((await read(p)).rain.tested,false);ok('连错显示漏水，不能直接进入下一幕');
 await click(p,'漏斗出口');await click(p,'导管入口');await click(p,'导管出口');await click(p,'小碗');await click(p,'让雨滴走一走');assert.equal((await read(p)).rain.tested,true);await click(p,'天亮了，去看看');ok('两段连线正确后进入选择');
 await p.getByRole('button',{name:/补好屋顶/}).click();await p.getByRole('textbox').fill('先有个不漏雨的地方，才能安心画画。');await click(p,'带着画笔，去河边');assert.equal((await read(p)).gift,'roof');ok('先照顾自己被保留，不扣分');
 for(const [place,question]of [['渠口','河里有水，轮子为什么不动？'],['田边','水到岸边，就能进田吗？'],['家门口','这条水槽会挡住谁？']]){await p.locator('.tabs').getByRole('button',{name:place,exact:true}).click();await click(p,question);}
 assert.equal(Object.keys((await read(p)).seen).length,3);await click(p,'把办法画出来');ok('三处线索产生不同人物回答与实际记录');
 const desired=routeToGrid(BYPASS);
 for(let i=0;i<24;i++){if(!desired[i])continue;await click(p,desired[i].kind==='straight'?'直水槽':'弯水槽');await p.locator('[data-cell="'+i+'"]').click();while((await read(p)).grid[i].rotation!==desired[i].rotation)await click(p,'转动这一格');}
 await p.getByLabel('请鲁伯装好支架',{exact:true}).check();await p.getByLabel('请大人清理渠口',{exact:true}).check();await click(p,'能到田边');await click(p,'让水走一走');assert.equal((await read(p)).trials.at(-1).result.ok,true);ok('完全通过真实点选和旋转拼通水路');
 await click(p,'直水槽');await p.locator('[data-cell="6"]').click();assert.notEqual((await read(p)).revision,(await read(p)).trials.at(-1).revision);await click(p,'撤回一步');await click(p,'让水走一走');assert.equal((await read(p)).trials.at(-1).result.ok,true);ok('改图使旧验证失效，撤回后需重新试水');
 const canvas=p.locator('canvas'),rect=await canvas.boundingBox();fs.writeFileSync('artifacts/v1.14/canvas-before.json',JSON.stringify({rect,viewport:p.viewportSize(),hit:await p.evaluate(({x,y})=>document.elementFromPoint(x,y)?.outerHTML?.slice(0,350),{x:rect.x+60,y:rect.y+70})},null,2));await p.screenshot({path:'artifacts/v1.14/canvas-before.png'});await p.mouse.move(rect.x+60,rect.y+70);await p.mouse.down();await p.mouse.move(rect.x+140,rect.y+120,{steps:6});await p.mouse.up();await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).drawing.length===1,'maliang-qihuan-v1',{timeout:3000}).catch(e=>console.log('drawing wait: '+e.message));fs.writeFileSync('artifacts/v1.14/canvas-after.json',JSON.stringify({length:(await read(p)).drawing.length},null,2));assert.equal((await read(p)).drawing.length,1);await click(p,'撤回一笔');assert.equal((await read(p)).drawing.length,0);ok('自由笔迹可画可撤回，不参与水路外形评分');
 await p.screenshot({path:'artifacts/workshop-desktop.png',fullPage:true});await click(p,'水到了，再想想明天');
 await p.getByLabel('平时请谁带头？').selectOption('鲁伯');await p.getByLabel('他有事时，请谁接着来？').selectOption('鲁伯');
 for(const step of ['先看支架和水槽','再按轮次提水','最后停下来，收好工具'])await click(p,step);
 await click(p,'试一回：带头的人请假了');assert.equal((await read(p)).handoff.tested,false);await p.getByLabel('他有事时，请谁接着来？').selectOption('周婶');await click(p,'试一回：带头的人请假了');assert.equal((await read(p)).handoff.tested,false);for(const action of ['看看支架和水槽','试着提水','先停下来','收好工具'])await click(p,action);assert.equal((await read(p)).handoff.tested,true);ok('同一个人不能替补自己，实际请假试验验证交接');
 await click(p,'交接好了，往前走');const baseState=await read(p);
 await click(p,'展开下面那一折');assert.equal((await read(p)).exclusive,false);await p.getByRole('button',{name:/往后，只有签了契书的人/}).click();assert.equal((await read(p)).exclusive,false);ok('展开和圈选契书不等于签署');
 await p.getByRole('button',{name:/留下画笔，另想救急办法/}).click();await click(p,'我想好了，就这样答复');await click(p,'把话当众说清楚');
 await p.getByRole('button',{name:'金山闪闪发亮，真好看。',exact:true}).click();await p.getByRole('button',{name:/亲耳听到的事/}).click();assert.equal((await read(p)).evidence.length,0);ok('漂亮画面不能代替说明问题的事实');
 for(const [card,slot]of [['大官说：签了契书，才准用水。','亲耳听到的事'],['田要浇水，周婶也要从门前走。','大家有什么需要'],['按次序取水，两位大人轮换照看。','我们想出的办法']]){await click(p,card);await p.getByRole('button',{name:new RegExp(slot)}).click();}
 await click(p,'请鲁伯和大家一起谈');await confirmCouncil(p);await click(p,'到灯下，再看一眼');await click(p,'看看这一回的故事');assert.equal((await read(p)).currentEnding,'E1');ok('全流程：修屋顶、实测水路、完整交接、公开对证得到E1');
 await p.screenshot({path:'artifacts/ending-E1.png',fullPage:true});await click(p,'打开我的画册');assert.match(await p.locator('dialog').innerText(),/先有个不漏雨/);const downloadPromise=p.waitForEvent('download');await click(p,'导出画册');const download=await downloadPromise;await download.saveAs('artifacts/student-book.txt');await p.keyboard.press('Escape');assert.equal(await p.locator('dialog').count(),0);ok('画册反映真实选择，可以导出，Escape关闭后可继续');
 await p.reload();await click(p,'接着画下去');assert.equal((await read(p)).currentEnding,'E1');ok('刷新恢复本次作品和结局');
 const q=await newPage(baseState);await click(q,'接着画下去');await click(q,'展开下面那一折');await q.getByRole('button',{name:/先领粮，再想办法/}).click();await click(q,'我想好了，就这样答复');await click(q,'先带大家到广场');
 await q.getByLabel('河水里',{exact:true}).check();await click(q,(await read(q)).bridgePlan.studio.run?'重新摆好，试走一回':'摆好纸人，试走一回');await click(q,'看看桥尾');assert.equal((await read(q)).bridgePlan.tested,false);ok('未通过的纸桥方案留在图上，不能当作试走成功');
 await q.getByLabel('平坦的公共广场',{exact:true}).check();await click(q,'桥头放支点');await click(q,'桥尾放支点');await click(q,'并排添一块桥板');await click(q,'摆好纸人，试走一回');await click(q,'看看桥头');await click(q,'看看桥尾');for(const step of ['小禾往前一处','小禾往前一处','陈叔往前一处','陈叔往前一处'])await click(q,step);assert.equal((await read(q)).bridgePlan.tested,true);
 await click(q,'到灯下，再看一眼');await click(q,'看看这一回的故事');assert.equal((await read(q)).currentEnding,'E3');ok('纸桥试通后，原来的限制条件仍在，得到E3');
 await q.getByRole('button',{name:/把用水的约定谈清楚/}).click();await click(q,'把话当众说清楚');for(const [card,slot]of [['大官说：签了契书，才准用水。','亲耳听到的事'],['田要浇水，周婶也要从门前走。','大家有什么需要'],['按次序取水，两位大人轮换照看。','我们想出的办法']]){await click(q,card);await q.getByRole('button',{name:new RegExp(slot)}).click();}await click(q,'请鲁伯和大家一起谈');await confirmCouncil(q);await click(q,'到灯下，再看一眼');await click(q,'看看这一回的故事');assert.equal((await read(q)).currentEnding,'E2');assert.equal((await read(q)).firstEnding,'E3');ok('E3后回去协商可改为E2，首次E3仍保留');
 const incomplete=structuredClone(baseState);incomplete.stage='review';incomplete.handoff.tested=false;incomplete.handoff.backup='';const r=await newPage(incomplete);await click(r,'接着画下去');await click(r,'看看这一回的故事');assert.equal((await read(r)).currentEnding,'E4');ok('有水路但缺交接，结尾指出具体待办');
 const mobile=await newPage(baseState,{viewport:{width:390,height:844},hasTouch:true,isMobile:true});await mobile.screenshot({path:'artifacts/home-mobile.png',fullPage:true});await click(mobile,'接着画下去');assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await mobile.screenshot({path:'artifacts/contract-mobile.png',fullPage:true});await click(mobile,'展开下面那一折');ok('手机可展开契书，正文不横向溢出');
 const keyboard=await newPage();await keyboard.getByRole('button',{name:'展开画卷',exact:true}).focus();await keyboard.keyboard.press('Enter');await keyboard.getByRole('button',{name:'漏斗出口',exact:true}).focus();await keyboard.keyboard.press('Enter');await keyboard.getByRole('button',{name:'导管入口',exact:true}).focus();await keyboard.keyboard.press('Enter');assert.deepEqual((await read(keyboard)).rain.links,[['funnel','tube']]);ok('关键连线支持键盘，不依赖拖曳');
 assert.deepEqual(errors,[]);ok('浏览器无脚本异常或资源错误');
 fs.writeFileSync('artifacts/classroom-browser-results.json',JSON.stringify({checks,errors,date:'2026-10-13',scope:'主线E1全操作；同一前段作品分支E3至E2；预设缺项E4；手机与键盘关键操作'},null,2));
}finally{await browser.close();}
