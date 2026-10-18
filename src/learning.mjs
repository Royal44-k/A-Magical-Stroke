import{speechSources,speechFigure,speechExportCss}from'./speech.mjs';
import {handoffSources,handoffFigure,handoffExportCss} from './handoff-card.mjs';
import {trialSource} from './source-gallery.mjs';
import {contractSources} from './contract-reading.mjs';
import {rainSources,rainSvg} from './rain.mjs';
import {comparisonSources,comparisonFigures} from './comparison.mjs';
import {dialogueHtml,dialogueExportCss,dialoguePrintScript,visibleLines} from './dialogue.mjs';
import {challengeSources} from './challenge.mjs';
import {careSources,careSvg} from './care.mjs';
import {riverSources,riverCropHtml} from './river.mjs';
import {bridgeSources,bridgeSvg} from './paper-bridge.mjs';
import {librarySources,librarySvg} from './library.mjs';
import {councilRecord,POLICIES} from './council.mjs';
import {giftSources,giftSvg} from './gifts.mjs';
import {GIFTS,OBSERVATIONS,ENDINGS,PEOPLE,maintenance,testHandoff,ports} from './model.mjs';

export function handoffIssue(s){
 const h=s.handoff;
 if(!PEOPLE.includes(h.lead)||!PEOPLE.includes(h.backup))return '两个人的名字还没有选齐。';
 if(h.lead===h.backup)return '这两个名字是同一个人。他请假时，谁来接手？';
 if(h.steps.join(',')!=='check,open,close')return '先检查，再提水，最后收好。把做法重新排一排。';
 return '';
}
export function startHandoff(s){
 const n=structuredClone(s);n.handoff.tested=false;
 if(handoffIssue(n)){delete n.handoff.run;return n;}
 n.handoff.run={checked:false,flowing:false,stopped:false,packed:false,moves:[],feedback:n.handoff.lead+'今天有事。现在请'+n.handoff.backup+'照着三步图试一回。'};
 return n;
}
export function actHandoff(s,action){
 if(!s.handoff.run||handoffIssue(s)||!['inspect','pump','stop','pack'].includes(action))return s;
 const n=structuredClone(s),r=n.handoff.run;
 if(r.packed){r.feedback='这一回已经收好了。想再看看，可以重新试一回。';return n;}
 r.moves=[...r.moves,action].slice(-40);
 if(action==='inspect'){
  if(r.flowing)r.feedback='先停下来，再看支架和水槽。';
  else {r.checked=true;r.feedback='纸上的检查做过了。可以照着图试着提水。';}
 }
 if(action==='pump'){
  if(!r.checked)r.feedback='先看看支架和水槽。没看清楚，先别提水。';
  else {r.flowing=true;r.stopped=false;r.feedback='纸上模型里的水流起来了。用完以后，先做什么？';}
 }
 if(action==='stop'){
  if(!r.flowing)r.feedback=r.stopped?'水已经停了。接下来，把工具收好吧。':'这一回还没有提水。先检查，再试着提水。';
  else {r.flowing=false;r.stopped=true;r.feedback='水停下来了。现在，把工具收好吧。';}
 }
 if(action==='pack'){
  if(r.flowing)r.feedback='水还在流，先停下来，再收工具。';
  else if(!r.checked||!r.stopped)r.feedback='这一回还没试完。先检查、提水，再停下来收好。';
  else {r.packed=true;r.feedback=n.handoff.backup+'照着图做完了，也收好了工具。下一双手接住了你的办法！';return testHandoff(n);}
 }
 return n;
}
export function storySources(s){
 const out=[];
 const add=(id,kind,title,asset,record,grid=null)=>out.push({id,kind,title,asset,record,grid});
 if(s.gift)add('gift','choice',GIFTS[s.gift],'/assets/worktable-day-v1.png','我的第一笔：'+GIFTS[s.gift]+'。'+(s.giftReason?'我当时写下：'+s.giftReason:''));
 out.push(...speechSources(s),...handoffSources(s),...contractSources(s),...rainSources(s),...giftSources(s),...librarySources(s),...bridgeSources(s),...riverSources(s),...careSources(s),...challengeSources(s),...comparisonSources(s));
 for(const o of OBSERVATIONS)for(const i of s.seen[o.id]||[])add('heard-'+o.id+'-'+i,'heard',o.name+'：'+o.questions[i][0],'/assets/river-survey-v1.png',o.questions[i][1]);
 for(const t of s.trials)out.push(trialSource(t));
 if(maintenance(s)&&!s.handoff.run?.card)add('handoff','handoff','下一双手接住了','/assets/shared-board-v1.png',s.handoff.lead+'带头，'+s.handoff.backup+'接手。'+(s.handoff.run?.packed?'接手的人照图检查、提水、停下，也收好了工具。':'三步交接已经试过。'));
 if(s.contract)add('contract','choice','粮袋与一句约定','/assets/grain-contract-v1.png',({accept:'我先领粮，答应了以后签了契书才准用水的条件。',refuse:'我留下画笔，请大人另想救急办法。',show:'我先当众演示，把话问清楚，暂不答应条件。'})[s.contract]);
 for(const t of s.council.trials)add('council-trial-'+t.number,'agreement','第'+t.number+'次纸上约定','/assets/court-sea-v1.png',councilRecord(t));
 if(s.negotiated)add('agreement','agreement','把用水的话谈清楚','/assets/court-sea-v1.png',s.council.ratified?'鲁伯和大家共同确认：大家以后都能取水。'+POLICIES[s.council.ratified.policy]+'。这次当众撤回了签了才准用水的条件。':'那一次，鲁伯和大家把事实、需要和新办法说清楚，谈成大家按次序取水。');
 if(s.firstEnding&&s.firstEnding!==s.currentEnding)add('first-ending','ending','第一次的结尾',s.firstEnding==='E3'?'/assets/ending-conditions-v1.png':'/assets/evening-review-v1.png','我第一次留下的结尾是：“'+ENDINGS[s.firstEnding].title+'”。');
 if(s.currentEnding)add('ending-'+s.currentEnding,'ending','最近一次的结尾',s.currentEnding==='E1'?'/assets/shared-board-v1.png':s.currentEnding==='E3'?'/assets/ending-conditions-v1.png':'/assets/evening-review-v1.png','我最近一次走到的结尾是：“'+ENDINGS[s.currentEnding].title+'”。');
 return out;
}
export const makeFrame=source=>({sourceId:source.id,title:source.title,asset:source.asset,record:source.record,grid:structuredClone(source.grid),...(source.speechArt?{speechArt:structuredClone(source.speechArt)}:{}),...(source.handoffArt?{handoffArt:structuredClone(source.handoffArt)}:{}),...(source.contractArt?{contractArt:structuredClone(source.contractArt)}:{}),...(source.rainArt?{rainArt:structuredClone(source.rainArt)}:{}),...(source.comparisonArt?{comparisonArt:structuredClone(source.comparisonArt)}:{}),...(source.careArt?{careArt:structuredClone(source.careArt)}:{}),...(source.riverArt?{riverArt:structuredClone(source.riverArt)}:{}),...(source.giftArt?{giftArt:structuredClone(source.giftArt)}:{}),...(source.libraryArt?{libraryArt:structuredClone(source.libraryArt)}:{}),...(source.bridgeArt?{bridgeArt:structuredClone(source.bridgeArt)}:{}),caption:''});
export function addFrame(s,frame){
 if(s.storybook.frames.length>=3||s.storybook.frames.some(x=>x.sourceId===frame.sourceId))return s;
 return {...s,storybook:{...s.storybook,frames:[...s.storybook.frames,structuredClone(frame)]}};
}
export function moveFrame(s,from,to){
 if(from<0||to<0||from>=s.storybook.frames.length||to>=s.storybook.frames.length)return s;
 const frames=[...s.storybook.frames],item=frames.splice(from,1)[0];frames.splice(to,0,item);
 return {...s,storybook:{...s.storybook,frames}};
}
export const escapeHtml=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function gridSvg(grid){
 const cell=60;
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 240" role="img" aria-label="这次试水留下的水槽图">'+grid.map((tile,i)=>{
  const x=(i%6)*cell,y=Math.floor(i/6)*cell;
  const base='<rect x="'+x+'" y="'+y+'" width="60" height="60" fill="'+(i===15?'#eadcc0':'#f7f6e9')+'" stroke="#9caeab"/>';
  if(!tile)return base;
  const pts=ports(tile).map(d=>[[30,0],[60,30],[30,60],[0,30]][d]),a=pts[0],b=pts[1],d=tile.kind==='straight'?'M'+a+' L'+b:'M'+a+' Q30 30 '+b;
  return base+'<g transform="translate('+x+' '+y+')"><path d="'+d+'" stroke="#9b7443" stroke-width="18" fill="none"/><path d="'+d+'" stroke="#d8c4a3" stroke-width="10" fill="none"/></g>';
 }).join('')+'</svg>';
}
export function storyHtml(s,images){
 const frames=s.storybook.frames.map((f,i)=>'<article><span class="count">第'+(i+1)+'格</span><h2>'+escapeHtml(f.title)+'</h2>'+(f.speechArt?speechFigure(f.speechArt):f.handoffArt?handoffFigure(f.handoffArt):f.rainArt?'<img class="rain-tool-still" alt="接雨用的漏斗、导管和小碗" src="'+escapeHtml(images.get(f.asset)||'')+'">'+rainSvg(f.rainArt):f.comparisonArt?comparisonFigures(f.comparisonArt):f.careArt?careSvg(f.careArt):f.riverArt?riverCropHtml(f.riverArt,images.get(f.asset)||''):f.bridgeArt?bridgeSvg(f.bridgeArt):f.libraryArt?librarySvg(f.libraryArt):f.giftArt?giftSvg(f.giftArt):f.grid?gridSvg(f.grid):'<img alt="'+escapeHtml(f.title)+'" src="'+escapeHtml(images.get(f.asset)||'')+'">')+(f.riverArt?.review?gridSvg(f.riverArt.review.trial.grid):'')+'<p class="record"><b>那时发生：</b>'+escapeHtml(f.record)+'</p><p class="voice"><b>我想说：</b>'+escapeHtml(f.caption||'这一格，我准备说给你听。')+'</p>'+dialogueHtml(f,i)+'</article>').join('');
 return '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escapeHtml(s.storybook.title)+'</title><style>body{margin:0;background:#faf6ec;color:#173046;font-family:"Microsoft YaHei",sans-serif;padding:32px}main{max-width:1200px;margin:auto}h1{font-family:KaiTi,serif;font-size:36px}.pages{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}article{border-top:5px solid #267580;padding:20px;background:#fffdf7}img,svg{width:100%;aspect-ratio:3/2;object-fit:contain;background:#e6ece1}.rain-tool-still{aspect-ratio:3/1;height:auto}.rain-route-art{aspect-ratio:9/8;height:auto}.comparison-figures{display:grid;gap:20px}.comparison-figures figure{margin:0;min-width:0}.comparison-figures h3{font-size:17px;line-height:1.6;margin:8px 0}.comparison-figures svg{display:block;aspect-ratio:3/2;background:#fffdf7;height:auto}.count{color:#536975}h2{font-size:22px;line-height:1.6}p{font-size:17px;line-height:1.8;white-space:pre-wrap}.voice{border-left:3px solid #ad531d;padding-left:14px}.foot{margin-top:28px}@media(max-width:720px){body{padding:18px}.pages{grid-template-columns:1fr}}@media print{body{padding:0}article{break-inside:avoid}}'+speechExportCss+handoffExportCss+dialogueExportCss+'</style><main><p>神笔马良：奇幻一笔 · 我的三格故事</p><h1>'+escapeHtml(s.storybook.title)+'</h1><section class="pages">'+frames+'</section><p class="foot">留给下一位伙伴：'+escapeHtml(s.storybook.note||'看完我的三格故事，你还想问什么？')+'</p></main>'+(s.storybook.frames.some(f=>visibleLines(f.dialogue).length)?dialoguePrintScript:'')+'</html>';
}
