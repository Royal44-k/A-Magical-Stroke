import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';
import {KEY,fresh,visit} from '../src/model.mjs';import {testRoof,bucketAction,addStroke} from '../src/gifts.mjs';
const b=await chromium.launch({channel:'msedge',headless:true}),errors=[],checks=[],p=await b.newPage({viewport:{width:1487,height:1058},deviceScaleFactor:1});
const click=name=>p.getByRole('button',{name,exact:true}).click();
async function seed(s){await p.goto('http://127.0.0.1:4185/');await p.evaluate(({KEY,s})=>localStorage.setItem(KEY,JSON.stringify(s)),{KEY,s});await p.reload();await click('接着画下去');}
try{p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:4185/?release=1.2');await p.evaluate(()=>document.fonts.ready);await p.locator('.hero-art').evaluate(i=>i.decode());await p.screenshot({path:'artifacts/v1.2/home-final.png'});
for(const gift of ['roof','bucket','board']){const s=visit(fresh(),'gift');s.gift=gift;
if(gift==='roof')s.giftStudio.roof=testRoof({...s.giftStudio.roof,square:7,strip:1,vertical:true});
if(gift==='bucket'){s.giftStudio.bucket=bucketAction(s.giftStudio.bucket,'repair');s.giftStudio.bucket=bucketAction(s.giftStudio.bucket,'pour',6);for(let i=0;i<3;i++)s.giftStudio.bucket=bucketAction(s.giftStudio.bucket,'walk');}
if(gift==='board'){s.giftStudio.board=addStroke(s.giftStudio.board,[[80,200],[120,236],[190,236],[236,200]]);s.giftStudio.board=addStroke(s.giftStudio.board,[[160,118],[160,53],[181,66],[160,84]]);s.giftStudio.board.title='一艘小帆船';s.giftStudio.board.note='你想让它开到哪里？';s.giftStudio.board.saved=true;}
await seed(s);await click('小禾，帮我看看');for(const width of [320,390,601,768,1024,1487]){await p.setViewportSize({width,height:width<=600?844:1058});await p.locator('.studio-heading').evaluate(el=>el.scrollIntoView({block:'start'}));assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
const main=await p.locator('.play').boundingBox(),bubble=await p.locator('.guide-bubble').boundingBox();assert.ok(width<=600?main.y+main.height<=bubble.y+1:main.x+main.width<=bubble.x+1,JSON.stringify({gift,width,main,bubble}));
const control=gift==='roof'?p.locator('[data-roof-cell="0"]'):p.locator('.gift-studio .button').first(),size=await control.boundingBox();assert.ok(size.width>=44&&size.height>=44,JSON.stringify({gift,width,size}));
if(gift==='board'){await click('点两处，接成线');const point=await p.getByRole('button',{name:'画纸第1行第1点',exact:true}).boundingBox();assert.ok(point.width>=44&&point.height>=44);}
if([320,390,1487].includes(width))await p.screenshot({path:'artifacts/v1.2/'+gift+'-final-'+width+'.png'});}
if(gift==='bucket'){const repair=await p.getByRole('button',{name:'裂缝已经补好',exact:true}).boundingBox(),pour=await p.getByRole('button',{name:'装一样多，重新比',exact:true}).boundingBox();assert.ok(pour.y>=repair.y+repair.height+8);assert.match(await p.locator('.gift-studio .feedback').innerText(),/三段走完了/);}
await p.locator('.gift-studio').screenshot({path:'artifacts/v1.2/'+gift+'-studio-final.png'});
checks.push(gift+'：六种宽度无横溢/气泡遮挡，操作目标至少44像素');
}
const s=visit(fresh(),'gift');s.gift='board';await seed(s);await click('点两处，接成线');await p.getByRole('button',{name:'画纸第1行第1点',exact:true}).focus();await p.keyboard.press('Enter');await p.keyboard.press('ArrowRight');await p.keyboard.press('ArrowDown');await p.keyboard.press('Enter');const saved=await p.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)),KEY);assert.deepEqual(saved.giftStudio.board.strokes[0],[[32,32],[96,96]]);checks.push('接笔全键盘：Enter选点，方向键定位，Enter完成');
await p.emulateMedia({reducedMotion:'reduce'});assert.equal(await p.locator('.relay-paper').evaluate(e=>getComputedStyle(e).animationName),'none');checks.push('新创作台无需自动动画，减少动作时仍可操作');
assert.deepEqual(errors,[]);fs.writeFileSync('artifacts/v1.2/gifts-visual-results.json',JSON.stringify({checks,errors},null,2));console.log(checks);
}finally{await b.close()}
