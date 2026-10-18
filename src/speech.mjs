import{OBSERVATIONS}from'./river-data.mjs';import{CLAUSES}from'./contract-reading.mjs';import{snapshot,validTrialSetup}from'./comparison.mjs';
const copy=x=>structuredClone(x),eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),int=x=>Number.isSafeInteger(x)&&x>=0,str=(x,n)=>typeof x==='string'&&x.length<=n;
export const SPEECH_TOPICS={water:'让水走到田边',door:'给门前留条路',access:'让大家以后都能用水'};
export const SPEECH_PLANS={lift:{topic:'water',text:'请大人把水提上来，接好水槽再试。'},test:{topic:'water',text:'把水槽、支架和渠口一起看看，再试水。'},around:{topic:'door',text:'让水槽绕开门前，画好后试一试。'},bridge:{topic:'door',text:'请大人加一块桥板，给人留路。'},queue:{topic:'access',text:'请大家商量，以后按次序取水。'},ask:{topic:'access',text:'先问没签的人以后怎么办，再一起改这句话。'}};
const source=(id,title,origin,quote,topics,asset)=>({id,title,origin,quote,topics,asset});
export const SPEECH_SOURCES=[
source('field','田边的原话','现在回看 · 小禾的话',OBSERVATIONS[1].questions[0][1],['water'],'/assets/river-survey-v1.png'),
source('door','门前的原话','现在回看 · 周婶的话',OBSERVATIONS[2].questions[0][1],['door'],'/assets/river-survey-v1.png'),
source('clause','桌上的契书','纸上写着',CLAUSES.later,['access'],'/assets/grain-contract-v1.png'),
source('gold','画里的金山','眼前画面的样子','纸上的金山闪闪发亮，空船浮在画里的海上。',[],'/assets/court-sea-v1.png')];
const trialValid=t=>t&&int(t.number)&&t.number>0&&int(t.revision)&&str(t.prediction,10000)&&Array.isArray(t.grid)&&t.grid.length===24&&t.grid.every(x=>x===null||x&&['straight','bend'].includes(x.kind)&&int(x.rotation)&&x.rotation<4)&&['water','people','rain'].includes(t.power)&&typeof t.bridge==='boolean'&&t.result&&typeof t.result.ok==='boolean'&&str(t.result.reason,1000)&&Array.isArray(t.result.trace)&&t.result.trace.length<=25&&t.result.trace.every(x=>int(x)&&x<24)&&validTrialSetup(t);
export function speechTrial(t){return {...source('trial-'+t.number,'第'+t.number+'次试水','当时实际试过 · 第'+t.number+'次',t.result.reason,['water',...(t.result.ok||/门前|门口/.test(t.result.reason)?['door']:[])],null),trial:snapshot(t)};}
export const availableSpeechSources=s=>[...SPEECH_SOURCES.map(copy),...(s.trials.length?[speechTrial(s.trials.at(-1))]:[])];
export const emptySpeech=()=>({draft:{topic:'',source:null,plan:'',note:''},run:null,count:0,pages:[],sent:null});
export const getSpeech=s=>s.speech||emptySpeech();
const validSource=x=>x===null||!!x&&(x.trial?trialValid(x.trial)&&eq(x,speechTrial(x.trial)):SPEECH_SOURCES.some(y=>eq(x,y)));
const validDraft=d=>!!d&&(d.topic===''||Object.hasOwn(SPEECH_TOPICS,d.topic))&&validSource(d.source)&&(d.plan===''||Object.hasOwn(SPEECH_PLANS,d.plan))&&str(d.note,160);
export function speechResult(d){
 if(!d.topic||!d.source||!d.plan)return {ready:false,feedback:'还没接完整。先选想说的事，再找依据、接上想试的办法。'};
 if(!d.source.topics.includes(d.topic))return {ready:false,feedback:d.source.id==='gold'?'这张画说的是金山的样子，还没有说明用水和走路的事。再找一句能帮你说明这件事的话。':'这份依据讲的是“'+d.source.title+'”。它还没有说清“'+SPEECH_TOPICS[d.topic]+'”这件事。可以换一份依据，也可以换成它能说明的事。'};
 if(SPEECH_PLANS[d.plan].topic!==d.topic)return {ready:false,feedback:'你想说的是“'+SPEECH_TOPICS[d.topic]+'”，接上的办法却在说“'+SPEECH_TOPICS[SPEECH_PLANS[d.plan].topic]+'”。再想想，怎样让两句话接得上？'};
 return {ready:true,feedback:'你用“'+d.source.title+'”说明想说的事，也接上了一个待试的办法。把这条话带去商量，再看看谁能来、明天怎么办。'};
}
export function editSpeech(s,patch){const c=getSpeech(s),d={...c.draft,...Object.fromEntries(['topic','plan','note'].filter(k=>patch[k]!==undefined).map(k=>[k,k==='note'?String(patch[k]).slice(0,160):patch[k]]))};if(!validDraft(d)||eq(d,c.draft))return s;return {...s,speech:{...c,draft:d,run:null}};}
export function chooseSpeechSource(s,id){const x=availableSpeechSources(s).find(x=>x.id===id);if(!x)return s;const c=getSpeech(s);if(eq(c.draft.source,x))return s;return {...s,speech:{...c,draft:{...c.draft,source:copy(x)},run:null}};}
export function checkSpeech(s){const c=getSpeech(s);if(!c.draft.topic||!c.draft.source||!c.draft.plan)return s;const run={version:1,number:c.count+1,...copy(c.draft),...speechResult(c.draft)};return {...s,speech:{...c,count:run.number,run,pages:[...c.pages,copy(run)].slice(-6)}};}
export const speechReady=s=>!!getSpeech(s).run?.ready&&eq(getSpeech(s).draft,(({topic,source,plan,note})=>({topic,source,plan,note}))(getSpeech(s).run));
export function beginSpeechCouncil(s){if(s.council.begun||s.negotiated)return s;if(!speechReady(s)&&!['fact','needs','plan'].every(x=>s.evidence.includes(x)))return s;return {...s,council:{...s.council,begun:true},...(speechReady(s)?{speech:{...getSpeech(s),sent:copy(getSpeech(s).run)}}:{})};}
export const hasSpeech=s=>!!s.speech?.sent?.ready;
export const validSpeechArt=r=>r===undefined||!!r&&r.version===1&&int(r.number)&&r.number>0&&validDraft(r)&&!!r.topic&&!!r.source&&!!r.plan&&eq(speechResult(r),{ready:r.ready,feedback:r.feedback});
export function validSpeech(c,trials=[]){if(c===undefined)return true;if(!c||!validDraft(c.draft)||!int(c.count)||!Array.isArray(c.pages)||c.pages.length>6||c.pages.some((r,i)=>!validSpeechArt(r)||!r||r.number>c.count||i>0&&r.number<=c.pages[i-1].number))return false;if(c.run!==null&&(!validSpeechArt(c.run)||c.run.number!==c.count||!eq(c.pages.at(-1),c.run)||!eq(c.draft,(({topic,source,plan,note})=>({topic,source,plan,note}))(c.run))))return false;if(c.sent!==null&&(!validSpeechArt(c.sent)||!c.sent.ready||c.sent.number>c.count))return false;return [c.draft,c.run,c.sent,...c.pages].filter(Boolean).every(d=>!d.source?.trial||trials.some(t=>eq(speechTrial(t),d.source)));}
export function speechRecord(p){return '我想说：'+SPEECH_TOPICS[p.topic]+'。\n我从这里知道：'+p.source.origin+'——'+p.source.quote+'\n我想试：'+SPEECH_PLANS[p.plan].text+'\n小禾回应：'+p.feedback+(p.note?'\n我还想添一句：'+p.note:'');}
export const speechSources=s=>(s.speech?.pages||[]).map(p=>({id:'speech-'+p.number,kind:'speech',title:'第'+p.number+'回开场话',asset:p.source.asset,grid:null,record:speechRecord(p),speechArt:copy(p)}));
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const speechRows=p=>[['我想说',SPEECH_TOPICS[p.topic]||'还没选'],['我从这里知道',p.source?p.source.origin+'：'+p.source.quote:'还没拿来依据'],['我想试',SPEECH_PLANS[p.plan]?.text||'还没接上办法']];
export const speechFigure=p=>'<section class="speech-paper">'+speechRows(p).map(([label,t])=>'<div><b>'+label+'</b><p>'+esc(t)+'</p></div>').join('')+'</section>';
export const speechExportCss='.speech-paper{border-left:4px solid #267580;background:#f4efdf;padding:18px}.speech-paper>div{padding:10px 0;border-bottom:1px solid #c5bfad}.speech-paper b{font-size:14px;color:#536975}.speech-paper p{font-size:17px;line-height:1.9;overflow-wrap:anywhere;margin:7px 0}';
export function speechHtml(p){return '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>我的开场话</title><style>body{margin:0;padding:24px;background:#faf6ec;color:#173046;font-family:"Microsoft YaHei",sans-serif}main{max-width:780px;margin:auto}p{line-height:1.9;white-space:pre-wrap;overflow-wrap:anywhere}h1{font-family:KaiTi,serif;font-size:29px}@media(max-width:400px){body{padding:16px}}'+speechExportCss+'</style><main><p>神笔马良：奇幻一笔 · 第'+p.number+'回开场话</p><h1>这一句，我想这样说</h1>'+speechFigure(p)+'<p>'+esc(speechAfterword(p))+'</p><p>请同桌指一指：依据讲了什么？办法准备怎样做？这里留下的是开场想法；水路还要试，约定还要共同确认。</p></main></html>';}

export function speechWelcome(s){const topic=s.speech?.sent?.topic;return {water:'鲁伯：“田里的菜苗等着水。你提的办法，我们记下了。水路还要试，谁能来取水、怎样轮流，也请大家一起说清楚。”',door:'鲁伯：“周婶天天要从门口走。你提的办法，我们记下了。门前要留路，取水的次序也请大家一起商量。”',access:'鲁伯：“契书里的‘往后’，说的是以后的日子。今天能取水，明天呢？我们把这句话放到两天里看看。”'}[topic]||'';}

export const speechAfterword=p=>'小禾回应：'+p.feedback+(p.note?'\n我还想添一句：'+p.note:'');
