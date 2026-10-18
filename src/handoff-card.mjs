export const HANDOFF_CARDS={check:'看看支架和水槽',open:'按轮次提水',close:'停下来，收好工具'};
export const HANDOFF_ACTIONS={inspect:'检查支架和水槽',pump:'按轮次提水',stop:'停下提水',pack:'收好工具'};
const people=['鲁伯','周婶','陈叔'],actions={check:['inspect'],open:['pump'],close:['stop','pack']};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const int=x=>Number.isSafeInteger(x)&&x>=0;
const text=x=>typeof x==='string'&&x.length<=160;
export function handoffPeopleIssue(h){
 if(!people.includes(h.lead)||!people.includes(h.backup))return '两个人的名字还没有选齐。';
 return h.lead===h.backup?'这两个名字是同一个人。他请假时，谁来接手？':'';
}
export const cardQueue=steps=>steps.flatMap((id,index)=>(actions[id]||[]).map(action=>({action,index})));
function initial(card){
 return {checked:false,flowing:false,stopped:false,packed:false,moves:[],feedback:card.lead+'今天有事。纸上的'+card.backup+'来照着这张图试一回。',status:'ready',at:null,card:{...structuredClone(card),ticks:0}};
}
function tick(run){
 if(run.status!=='ready')return run;
 const r=structuredClone(run),queue=cardQueue(r.card.steps),entry=queue[r.moves.length];r.card.ticks++;
 if(!entry){r.status='incomplete';r.feedback='图上还没有做法。'+r.card.backup+'不知道从哪里开始。先放一张纸牌吧。';return r;}
 const {action,index}=entry;r.at=index;r.moves.push(action);
 if(action==='inspect'){r.checked=true;r.feedback='纸上的'+r.card.backup+'按图检查了支架和水槽。下一句写了什么？';}
 if(action==='pump'){
  if(!r.checked){r.status='blocked';r.feedback='读到提水这一句，可图上还没让'+r.card.backup+'检查支架和水槽。先停在这里。';}
  else{r.flowing=true;r.stopped=false;r.feedback='纸上的'+r.card.backup+'开始按轮次提水了。用完以后，图上还写了什么？';}
 }
 if(action==='stop'){
  if(!r.flowing){r.status='blocked';r.feedback='读到停下这一句，可这一回还没有提水。'+r.card.backup+'停下来，等你把前后的话排清楚。';}
  else{r.flowing=false;r.stopped=true;r.feedback='纸上的提水停下来了。这张纸牌还说了“收好工具”，再做一步。';}
 }
 if(action==='pack'){
  if(!r.checked||!r.stopped){r.status='blocked';r.feedback='这一回还没有试完，工具先不收。看看前面少了哪一步。';}
  else{r.packed=true;r.status='done';r.feedback=r.card.backup+'照着图做完了：检查、提水、停下，也收好了工具。下一双手接住了你的办法！';}
 }
 if(r.status==='ready'&&r.moves.length===queue.length){r.status='incomplete';r.feedback=r.flowing?'图上的话读完了，却没写怎样停下来、收好工具。纸上演练停在这里，等你补上一句。':'图上的话读完了，这一回还没有提水。纸上演练停在这里，等你接着画。';}
 return r;
}
export function replayCard(seed,ticks=seed.ticks){let r=initial(seed);for(let i=0;i<ticks&&r.status==='ready';i++)r=tick(r);return r;}
export function startCardHandoff(s){
 if(handoffPeopleIssue(s.handoff))return s;
 const h=s.handoff,count=(h.cardCount||0)+1,seed={version:1,number:count,lead:h.lead,backup:h.backup,steps:structuredClone(h.steps),note:h.note||'',ticks:0};
 return {...s,handoff:{...h,cardCount:count,cardTrials:h.cardTrials||[],tested:false,run:initial(seed)}};
}
export function stepCardHandoff(s){
 const r=s.handoff.run;if(!r?.card||r.status!=='ready')return s;
 const next=tick(r),done=next.status==='done',trials=next.status==='ready'?(s.handoff.cardTrials||[]):[...(s.handoff.cardTrials||[]),structuredClone(next)].slice(-6);
 return {...s,handoff:{...s.handoff,run:next,tested:done,cardTrials:trials},repairedLater:s.repairedLater||(done&&s.carried.handoff)};
}
export function editCardPlan(s,steps){
 if(!Array.isArray(steps)||steps.length>3||new Set(steps).size!==steps.length||steps.some(x=>!HANDOFF_CARDS[x])||same(steps,s.handoff.steps))return s;
 return {...s,handoff:{...s.handoff,steps:[...steps],tested:false,run:null}};
}
export function moveCard(s,from,to){
 const steps=[...s.handoff.steps];if(!int(from)||!int(to)||from>=steps.length||to>=steps.length||from===to)return s;
 const [item]=steps.splice(from,1);steps.splice(to,0,item);return editCardPlan(s,steps);
}
function validSeed(c){
 return !!c&&c.version===1&&int(c.number)&&c.number>0&&c.number<=1000000&&!handoffPeopleIssue(c)&&Array.isArray(c.steps)&&c.steps.length<=3&&new Set(c.steps).size===c.steps.length&&c.steps.every(x=>Object.hasOwn(HANDOFF_CARDS,x))&&text(c.note)&&int(c.ticks)&&c.ticks<=4;
}
export function validCardRun(r){
 if(!r?.card||!validSeed(r.card))return false;
 const expected=replayCard(r.card);return Object.keys(expected).every(k=>same(r[k],expected[k]));
}
export function validCardHandoff(h){
 if(h.note!==undefined&&!text(h.note))return false;
 if(h.cardCount!==undefined&&(!int(h.cardCount)||h.cardCount>1000000))return false;
 const trials=h.cardTrials||[];if(!Array.isArray(trials)||trials.length>6)return false;
 if(trials.some((r,i)=>!validCardRun(r)||r.status==='ready'||r.card.number>(h.cardCount||0)||(i>0&&r.card.number<=trials[i-1].card.number)))return false;
 if(h.run?.card){
  const r=h.run,c=r.card;
  if(!validCardRun(r)||c.number!==h.cardCount||c.lead!==h.lead||c.backup!==h.backup||!same(c.steps,h.steps)||c.note!==(h.note||'')||h.tested!==(r.status==='done'))return false;
  if(r.status!=='ready'&&!same(trials.at(-1),r))return false;
 }
 return true;
}
export const validHandoffArt=r=>r===undefined||validCardRun(r)&&r.status!=='ready';
export function cardResult(r){return r.status==='done'?'照图试好了':r.status==='blocked'?'停在第'+(r.at+1)+'张纸牌':'这张图还没写完';}
export function handoffRecord(r){
 return '第'+r.card.number+'回交接：'+r.card.lead+'带头，'+r.card.backup+'接手。\n当时的图：'+(r.card.steps.map((id,i)=>(i+1)+'．'+HANDOFF_CARDS[id]).join('；')||'图上还没有做法。')+'\n照图读到：'+(r.moves.map(x=>HANDOFF_ACTIONS[x]).join(' → ')||'还没能开始。')+'\n看到的结果：'+r.feedback+(r.card.note?'\n我这样排，是因为：'+r.card.note:'');
}
export const handoffSources=s=>(s.handoff.cardTrials||[]).map(r=>({id:'handoff-card-'+r.card.number,kind:'handoff',title:'第'+r.card.number+'回交接图',asset:'/assets/shared-board-v1.png',record:handoffRecord(r),grid:null,handoffArt:structuredClone(r)}));
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function handoffFigure(r){return '<section class="handoff-paper"><p>'+esc(r.card.backup)+'照着这张图试</p><ol>'+r.card.steps.map((id,i)=>'<li'+(r.at===i?' class="marked"':'')+'><b>'+esc(HANDOFF_CARDS[id])+'</b>'+(r.at===i?'<span>'+esc(r.status==='done'?'读到这里，试完了':r.status==='blocked'?'停在这里':'最后读到这里')+'</span>':'')+'</li>').join('')+'</ol>'+(!r.card.steps.length?'<p>图上还没有做法。</p>':'')+'<p><strong>'+esc(cardResult(r))+'</strong></p></section>';}
export const handoffExportCss='.handoff-paper{background:#f4eddc;border:1px solid #c4b598;border-left:5px solid #267580;padding:20px;color:#173046}.handoff-paper ol{padding-left:24px}.handoff-paper li{padding:12px 9px;border-bottom:1px solid #c4b598;line-height:1.8;overflow-wrap:anywhere}.handoff-paper li span{display:block;font-size:14px;color:#185964}.handoff-paper .marked{background:#e1eae4}.handoff-paper p{margin:10px 0}';
export function handoffHtml(r){return '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>第'+r.card.number+'回交接图</title><style>body{margin:0;padding:24px;background:#faf6ec;color:#173046;font-family:"Microsoft YaHei",sans-serif}main{max-width:760px;margin:auto}h1{font-family:KaiTi,serif;font-size:30px}p{line-height:1.9;white-space:pre-wrap;overflow-wrap:anywhere}@media(max-width:400px){body{padding:16px}h1{font-size:25px}}'+handoffExportCss+'</style><main><p>神笔马良：奇幻一笔 · 留给后来人的图</p><h1>第'+r.card.number+'回交接图</h1>'+handoffFigure(r)+'<p>'+esc(handoffRecord(r))+'</p><p>请同桌只看图，按顺序指一指。哪句话要问你，回来补清楚。</p><p>这回试的是纸上交接顺序。田边有没有水，还要回水路图上试。</p></main></html>';}
