const ADULTS=['鲁伯','周婶','陈叔'];
export const CARE_SCENES={wind:{title:'一阵风后',intro:'风吹过河岸。接手的人拿着操作图来了，今天的水路还是昨天的样子吗？',blocked:true,loose:false},worn:{title:'多用了一天',intro:'大家又用了一天水车。早晨，接手的人来看看，哪些地方要留意？',blocked:false,loose:true},storm:{title:'一夜风雨后',intro:'昨晚又刮风，又下雨。今天会不会有不止一处变化？',blocked:true,loose:true},calm:{title:'平常的早晨',intro:'天亮了，河边静悄悄。先看一看、试一试，再决定要不要动手。',blocked:false,loose:false}};
export const CARE_PLACES={inlet:'渠口',joint:'水槽接头'};
export const CARE_FACTS={branches:{place:'inlet',text:'渠口卡着落枝'},clear:{place:'inlet',text:'渠口没有落枝挡着'},gap:{place:'joint',text:'两段水槽中间有缝'},tight:{place:'joint',text:'两段水槽已经对齐'}};
export const CARE_REQUESTS={clear:'请大人清开落枝',align:'请大人对齐水槽',look:'请大人一起再看看'};
export const emptyCare=()=>({active:false,count:0,run:null,trials:[]});
export const careAvailable=s=>{const h=s.handoff;return ADULTS.includes(h.lead)&&ADULTS.includes(h.backup)&&h.lead!==h.backup&&h.steps.join(',')==='check,open,close'&&h.tested&&(!h.run||h.run.packed)};
const draft=()=>({place:'',evidence:'',request:'',note:''});
export function beginCare(s,scene){if(!CARE_SCENES[scene]||!careAvailable(s))return s;return {...s,care:{...s.care,active:true,count:s.care.count+1,run:{number:s.care.count+1,scene,adult:s.handoff.backup,events:[],draft:draft()}}};}
function observed(v,place){return place==='inlet'?(v.world.blocked?'branches':'clear'):(v.world.loose?'gap':'tight')}
export function careView(run){if(!run)return null;const scene=CARE_SCENES[run.scene],v={world:{blocked:scene.blocked,loose:scene.loose},seen:{},findings:[],repairs:[],renewed:{},running:false,result:null,ready:false,feedback:run.adult+'来了。先看看哪里，或者先在纸上试一回？',log:[]};
 for(const e of run.events){let line='';
  if(e.type==='stop'){v.running=false;line=v.result?'纸上模型停下来了。可以看看局部，也可以把这一回收好。':'模型还没开始试水。先看一看也可以。';}
  if(e.type==='test'){v.running=true;const arrived=!v.world.blocked&&!v.world.loose;v.result={arrived,blocked:v.world.blocked,loose:v.world.loose};line=arrived?'这回水进碗里了！结束试水后，再收好记录。':(v.world.blocked?'这回水还没从渠口过去，碗里也没有水。停下模型，再看一看。':'水已经过了渠口，碗里还是没有水。停下模型，再看看后面的水槽。');}
  if(e.type==='look'){if(v.running)line='模型还在试水。先停下模型，再请大人带着看。';else{v.seen[e.place]=observed(v,e.place);v.renewed[e.place]=false;line=CARE_FACTS[v.seen[e.place]].text+'。';}}
  if(e.type==='tell'){const r=e.report;
   if(v.running)line='先停下模型，再把发现告诉大人。';
   else if(!CARE_PLACES[r.place])line='想请大人看哪里？先指一处。';
   else if(r.request==='look'){v.seen[r.place]=observed(v,r.place);v.renewed[r.place]=false;line=run.adult+'和你一起看：'+CARE_FACTS[v.seen[r.place]].text+'。先把看清的事留下来。';}
   else if(!CARE_FACTS[r.evidence]||!Object.values(v.seen).includes(r.evidence))line='这句话还没有看见过。可以先看看，也可以请大人一起找。';
   else if(CARE_FACTS[r.evidence].place!==r.place)line='这句发现说的是'+CARE_PLACES[CARE_FACTS[r.evidence].place]+'。把地点说清楚，大人才好接着看。';
   else if(v.seen[r.place]!==r.evidence)line='这一处刚才变过了，再看一眼眼前的样子。';
   else if(r.request==='clear'&&r.place==='inlet'&&v.world.blocked){v.world.blocked=false;v.repairs.push('清开渠口的落枝');delete v.seen.inlet;v.renewed.inlet=true;v.result=null;line=run.adult+'清开了落枝。刚才的发现留在记录里；眼前变了，还要再试水。';}
   else if(r.request==='align'&&r.place==='joint'&&v.world.loose){v.world.loose=false;v.repairs.push('把水槽口对齐');delete v.seen.joint;v.renewed.joint=true;v.result=null;line=run.adult+'把水槽口重新对齐了。眼前变了，还要再试水。';}
   else if(r.evidence==='clear'||r.evidence==='tight')line=run.adult+'说：“这里已经好好的，不用拆改。先试试，看看水能不能到。”';
   else line=run.adult+'说：“这办法用在另一处。想一想，怎样处理你刚才看到的地方？”';
  }
  for(const f of Object.values(v.seen))if(!v.findings.includes(f))v.findings.push(f);v.ready=!!v.result?.arrived&&!v.running;v.feedback=line;v.log.push(e.type==='tell'?'我指了'+(CARE_PLACES[e.report.place]||'还没选的地方')+'，'+(CARE_FACTS[e.report.evidence]?'说“'+CARE_FACTS[e.report.evidence].text+'”，':'还没说发现，')+(CARE_REQUESTS[e.report.request]||'还没选办法')+'。'+line:line);
 }return v;
}
const kept=(s)=>s.care.run&&s.care.trials.some(t=>t.number===s.care.run.number);
export function editCare(s,patch){if(!s.care.run||kept(s))return s;const d={...s.care.run.draft};for(const [k,v]of Object.entries(patch)){if(k==='note'&&typeof v==='string')d.note=v.slice(0,240);if(k==='place'&&['',...Object.keys(CARE_PLACES)].includes(v))d.place=v;if(k==='evidence'&&['',...Object.keys(CARE_FACTS)].includes(v))d.evidence=v;if(k==='request'&&['',...Object.keys(CARE_REQUESTS)].includes(v))d.request=v;}return {...s,care:{...s.care,run:{...s.care.run,draft:d}}};}
export function careAct(s,type,payload={}){const r=s.care.run;if(!r||kept(s)||r.events.length>=256)return s;let e={type};if(type==='look'){if(!CARE_PLACES[payload.place])return s;e.place=payload.place;}else if(type==='tell')e.report={place:r.draft.place,evidence:r.draft.evidence,request:r.draft.request};else if(!['test','stop'].includes(type))return s;return {...s,care:{...s.care,run:{...r,events:[...r.events,e],draft:type==='tell'?{...r.draft,evidence:''}:r.draft}}};}
export function keepCare(s){if(!s.care.run||kept(s))return s;return {...s,care:{...s.care,trials:[...s.care.trials,structuredClone(s.care.run)].slice(-6)}};}
export function careRecord(t){const v=careView(t);return ['第'+t.number+'回照看 · '+CARE_SCENES[t.scene].title,'接手的大人：'+t.adult,...v.log.map((x,i)=>(i+1)+'．'+x),'留下的结果：'+(v.ready?'水进碗里，模型也停好了。':v.running?'这一回还停在试水途中。':v.result?'水还没有到，还可以接着找。':'还没有试水。'),...(t.draft.note?['我想留下：'+t.draft.note]:[])].join('\n');}
export function careSources(s){return s.care.trials.map(t=>({id:'care-'+t.number,kind:'care',title:'第'+t.number+'回照看：'+CARE_SCENES[t.scene].title,asset:null,grid:null,record:careStoryRecord(t),careArt:structuredClone(t)}))}
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function careSvg(t){const v=careView(t),a=v.seen.inlet?CARE_FACTS[v.seen.inlet].text:(v.renewed.inlet?'处理后，还没再看':'还没有细看渠口'),b=v.seen.joint?CARE_FACTS[v.seen.joint].text:(v.renewed.joint?'处理后，还没再看':'还没有细看接头'),status=v.ready?'水到了，模型停好了':v.result?.arrived?'水到了，还在试水':v.result?'水还没到碗里':'还没有试水';return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 330" role="img" aria-label="这回照看的实际记录"><rect width="700" height="330" rx="4" fill="#f1ecda"/><g fill="#173046" font-family="Microsoft YaHei,sans-serif" text-anchor="middle"><text x="350" y="38" font-size="23">'+esc(CARE_SCENES[t.scene].title)+' · 纸上照看台</text><path d="M185 136H293M405 136H512" stroke="#267580" stroke-width="4"/><path d="m283 129 10 7-10 7m219-14 10 7-10 7" fill="none" stroke="#267580" stroke-width="3"/><rect x="28" y="87" width="180" height="98" fill="#fffdf6" stroke="#718a87"/><rect x="258" y="87" width="184" height="98" fill="#fffdf6" stroke="#718a87"/><path d="M527 110v68q62 32 120 0v-68" fill="'+(v.result?.arrived?'#d0e8ed':'#fffdf6')+'" stroke="#718a87" stroke-width="3"/><text x="118" y="145" font-size="22">渠口</text><text x="350" y="145" font-size="22">水槽接头</text><text x="587" y="153" font-size="22">接水碗</text><text x="118" y="218" font-size="16">'+esc(a)+'</text><text x="365" y="247" font-size="16">'+esc(b)+'</text><text x="350" y="298" font-size="22">'+esc(status)+'</text></g></svg>';}
const str=(x,n)=>typeof x==='string'&&x.length<=n;
const reportValid=d=>d&&['',...Object.keys(CARE_PLACES)].includes(d.place)&&['',...Object.keys(CARE_FACTS)].includes(d.evidence)&&['',...Object.keys(CARE_REQUESTS)].includes(d.request);
function runValid(r){return r&&Number.isInteger(r.number)&&r.number>0&&Object.hasOwn(CARE_SCENES,r.scene)&&ADULTS.includes(r.adult)&&reportValid(r.draft)&&str(r.draft.note,240)&&Array.isArray(r.events)&&r.events.length<=256&&r.events.every(e=>e&&(['test','stop'].includes(e.type)||e.type==='look'&&Object.hasOwn(CARE_PLACES,e.place)||e.type==='tell'&&reportValid(e.report)));}
export const validCareArt=x=>x===undefined||runValid(x);
export function validCare(c){return c&&typeof c.active==='boolean'&&Number.isInteger(c.count)&&c.count>=0&&(c.run===null||runValid(c.run)&&c.run.number===c.count)&&Array.isArray(c.trials)&&c.trials.length<=6&&c.trials.every((t,i)=>runValid(t)&&t.number<=c.count&&(!i||t.number>c.trials[i-1].number));}

export function carePageHtml(t){return '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>我的照看记录</title><style>body{background:#faf6ec;color:#173046;font:17px/1.8 "Microsoft YaHei",sans-serif;margin:0;padding:28px}main{max-width:1000px;margin:auto}h1{font-family:KaiTi,serif}svg{width:100%;height:auto}.record{white-space:pre-wrap}.columns{display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:start}@media(max-width:700px){body{padding:18px}.columns{grid-template-columns:1fr}}</style><main><p>神笔马良：奇幻一笔 · 留给下一位</p><h1>我的照看记录</h1><div class="columns">'+careSvg(t)+'<p class="record">'+esc(careRecord(t))+'</p></div><p>这回的经历留住了。下一位伙伴，你还想看哪里？</p></main></html>';}

export function careStoryRecord(t){const v=careView(t);return ['这一回是“'+CARE_SCENES[t.scene].title+'”，我请'+t.adult+'来接手。',v.findings.length?'我们看见：'+v.findings.map(f=>CARE_FACTS[f].text).join('；')+'。':'我们还没有细看局部。',v.repairs.length?t.adult+'照着发现，'+v.repairs.join('，又')+'。':v.ready?'这一回没有拆改，试水也到了碗里。':'这一回还没有处理部件。',v.ready?'后来试水，水进碗里，模型也停好了。':v.result?.arrived?'水进碗里了，这回还停在试水途中。':v.result?'这回水还没到碗里，问题留着接着找。':(v.repairs.length?'处理后还没有复试，这回的结果先留空。':'还没有试水，这回的结果先留空。'),...(t.draft.note?['我想留下：'+t.draft.note]:[])].join('\n');}
