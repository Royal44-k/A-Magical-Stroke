export const BOOKS={insects:{title:'昆虫故事',other:'昆虫图册',color:'#30766e'},stars:{title:'星空故事',other:'星空图册',color:'#435e8c'},seeds:{title:'种子故事',other:'种子图册',color:'#a26429'}};
export const MARKS={circle:'圆形',triangle:'三角形',square:'方形'};
export const POSITIONS=['左边','中间','右边'];
export const FALLBACKS={wait:'等这本书还回来',another:'先读同篮的另一本'};
const IDS=Object.keys(BOOKS),OUTCOMES=['','found','wrong-book','no-mark','ambiguous','no-plan','waiting','alternative'];
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function emptyLibrary(){return {active:false,order:[...IDS],marks:{insects:'',stars:'',seeds:''},target:'insects',method:'position',position:0,mark:'circle',out:null,fallback:'',note:'',revision:0,count:0,run:null,trials:[]};}
export function librarySnapshot(v){return structuredClone(Object.fromEntries(['order','marks','target','method','position','mark','out','fallback'].map(k=>[k,v[k]])));}
export function reviseLibrary(v,patch){
 const allowed=Object.fromEntries(Object.entries(patch).filter(([k])=>['order','marks','target','method','position','mark','out','fallback'].includes(k)));
 if(Object.entries(allowed).every(([k,value])=>JSON.stringify(v[k])===JSON.stringify(value)))return v;
 return {...v,...structuredClone(allowed),revision:v.revision+1,run:null};
}
export function instruction(v){return (v.method==='position'?'到'+POSITIONS[v.position]+'的书篮里':('找到贴着'+MARKS[v.mark]+'标记的书篮'))+'，找《'+BOOKS[v.target].title+'》。'+(v.fallback?'如果借出去了，就'+FALLBACKS[v.fallback]+'。':'');}
function newRun(snapshot,number,revision){return {snapshot,number,revision,index:0,selected:null,finished:false,outcome:'',feedback:'伙伴先读你留下的找书办法。点一次，只做一步。'};}
export function startSearch(v){const count=v.count+1;return {...v,count,run:newRun(librarySnapshot(v),count,v.revision)};}
function advanceRun(r){
 if(r.finished)return r;const n=structuredClone(r),s=n.snapshot;n.index++;
 const done=(outcome,feedback)=>{n.finished=true;n.outcome=outcome;n.feedback=feedback;return n;};
 if(n.index===1){
 const matches=s.method==='position'?[s.order[s.position]]:s.order.filter(id=>s.marks[id]===s.mark);
 if(matches.length===0)return done('no-mark','一只也没找到：现在没有书篮贴着'+MARKS[s.mark]+'。可以贴好标记，也可以改一句找法。');
 if(matches.length>1)return done('ambiguous','有'+matches.length+'只书篮都贴着'+MARKS[s.mark]+'，伙伴还不知道选哪只。可以换标记，也可以把位置说清楚。');
 n.selected=matches[0];n.feedback='伙伴找到了'+POSITIONS[s.order.indexOf(n.selected)]+'的书篮。再看一眼，里面是不是要找的书？';return n;
 }
 if(n.index===2){
 if(n.selected!==s.target)return done('wrong-book','这里放的是《'+BOOKS[n.selected].title+'》，不是《'+BOOKS[s.target].title+'》。看看篮子的位置或标记，再改一改说明。');
 if(s.out===s.target){n.feedback='找对书篮了，可《'+BOOKS[s.target].title+'》借出去了。再看看你有没有留下接下来的办法。';return n;}
 return done('found','找到了《'+BOOKS[s.target].title+'》！这句话和现在的摆法对上了。换个位置以后，还能找到吗？');
 }
 if(s.fallback==='wait')return done('waiting','《'+BOOKS[s.target].title+'》还没归还。伙伴记住了：等这本书还回来。现在没有取到它。');
 if(s.fallback==='another')return done('alternative','《'+BOOKS[s.target].title+'》借出去了。伙伴照你的话，先读同篮的《'+BOOKS[s.target].other+'》。');
 return done('no-plan','书借出去了，可说明里还没写接下来怎么办。可以等它归还，也可以先读同篮的另一本。');
}
export function stepSearch(v){
 if(!v.run||v.run.revision!==v.revision||v.run.finished)return v;
 const r=advanceRun(v.run);return {...v,run:r,trials:r.finished?[...v.trials,structuredClone(r)].slice(-6):v.trials};
}
export const searchHandled=r=>!!r?.finished&&['found','waiting','alternative'].includes(r.outcome);
export function libraryRecord(r){const v=r.snapshot;return '纸上寻书：'+instruction(v)+'当时从左到右的书篮依次放着：'+v.order.map(id=>'《'+BOOKS[id].title+'》').join('、')+'。'+(v.out?'《'+BOOKS[v.out].title+'》已借出。':'三本目标书都在。')+'试过看到：'+r.feedback;}
export function librarySources(s){return s.library.trials.map(t=>({id:'library-trial-'+t.number,kind:'transfer',title:'第'+t.number+'次图书角寻书',asset:'/assets/classroom-library-v1.png',grid:null,record:libraryRecord(t),libraryArt:{...structuredClone(t.snapshot),selected:t.selected,outcome:t.outcome}}));}
const integer=x=>Number.isSafeInteger(x)&&x>=0&&x<10000000,one=(x,a)=>a.includes(x);
function validSnapshot(v){
 return v&&Array.isArray(v.order)&&v.order.length===3&&v.order.every(x=>IDS.includes(x))&&new Set(v.order).size===3&&v.marks&&Object.keys(v.marks).length===3&&IDS.every(id=>one(v.marks[id],['',...Object.keys(MARKS)]))&&one(v.target,IDS)&&one(v.method,['position','mark'])&&Number.isInteger(v.position)&&v.position>=0&&v.position<3&&one(v.mark,Object.keys(MARKS))&&one(v.out,[null,...IDS])&&one(v.fallback,['',...Object.keys(FALLBACKS)]);
}
function validRun(r){
 if(!r||!validSnapshot(r.snapshot)||!integer(r.number)||r.number<1||!integer(r.revision)||!integer(r.index)||r.index>3||!one(r.selected,[null,...IDS])||typeof r.finished!=='boolean'||!one(r.outcome,OUTCOMES)||typeof r.feedback!=='string'||r.feedback.length>400)return false;
 let expected=newRun(r.snapshot,r.number,r.revision);for(let i=0;i<r.index;i++)expected=advanceRun(expected);
 return ['index','selected','finished','outcome','feedback'].every(k=>expected[k]===r[k]);
}
export function validLibrary(v){
 if(!validSnapshot(v)||typeof v.active!=='boolean'||typeof v.note!=='string'||v.note.length>160||!integer(v.revision)||!integer(v.count)||!Array.isArray(v.trials)||v.trials.length>6||!v.trials.every(r=>validRun(r)&&r.finished&&r.number<=v.count&&r.revision<=v.revision)||new Set(v.trials.map(r=>r.number)).size!==v.trials.length)return false;
 return v.run===null||(validRun(v.run)&&v.run.number===v.count&&v.run.revision===v.revision&&JSON.stringify(v.run.snapshot)===JSON.stringify(librarySnapshot(v)));
}
export function validLibraryArt(a){return a===undefined||(validSnapshot(a)&&one(a.selected,[null,...IDS])&&one(a.outcome,OUTCOMES));}
function shape(mark,x,y){const base=' fill="none" stroke="#173046" stroke-width="2"';if(mark==='circle')return '<circle cx="'+x+'" cy="'+y+'" r="9"'+base+'/>';if(mark==='triangle')return '<path d="M'+x+' '+(y-10)+' l11 19 h-22 Z"'+base+'/>';if(mark==='square')return '<rect x="'+(x-9)+'" y="'+(y-9)+'" width="18" height="18"'+base+'/>';return '<text x="'+x+'" y="'+(y+5)+'" font-size="13" text-anchor="middle">无标记</text>';}
export function librarySvg(v){
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 236" role="img" aria-label="这次寻书时，三个书篮的摆法和标记"><rect width="450" height="236" fill="#faf6ec"/>'+v.order.map((id,i)=>{const x=10+i*147,b=BOOKS[id];return '<g font-family="Microsoft YaHei, sans-serif" fill="#173046"><text x="'+(x+66)+'" y="23" text-anchor="middle" font-size="16">'+POSITIONS[i]+'</text><rect x="'+x+'" y="36" width="135" height="164" rx="3" fill="#fffdf6" stroke="'+(v.selected===id?'#267580':'#b6ad98')+'" stroke-width="'+(v.selected===id?3:1)+'"/><rect x="'+(x+20)+'" y="55" width="94" height="61" rx="2" fill="'+b.color+'"/><text x="'+(x+67)+'" y="89" text-anchor="middle" fill="white" font-size="16">'+b.title+'</text><text x="'+(x+67)+'" y="138" text-anchor="middle" font-size="13">'+(v.out===id?'这一本已借出':'这一本在篮里')+'</text>'+shape(v.marks[id],x+67,170)+'<text x="'+(x+67)+'" y="225" text-anchor="middle" font-size="13">另有：'+b.other+'</text></g>';}).join('')+'</svg>';
}
export function libraryHtml(v){
 const tested=v.run?.finished&&v.run.revision===v.revision;const art={...librarySnapshot(v),selected:tested?v.run.selected:null,outcome:tested?v.run.outcome:''};
 return '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>我的借阅小贴士</title><style>body{background:#faf6ec;color:#173046;font:18px/1.9 "Microsoft YaHei",sans-serif;margin:0;padding:32px}main{max-width:820px;margin:auto}h1{font:700 38px/1.5 KaiTi,serif}svg{display:block;width:100%;height:auto}.rule{border-left:5px solid #267580;padding:15px 20px;background:#e8f0eb}.note{white-space:pre-wrap}small{font-size:15px}@media(max-width:600px){body{padding:16px}h1{font-size:30px}}@media print{body{padding:0}svg{max-height:320px}}</style><main><small>神笔马良：奇幻一笔 · 把办法带回教室</small><h1>我的借阅小贴士</h1><p class="rule">'+esc(instruction(v))+'</p>'+librarySvg(art)+'<p><b>这一次试过：</b>'+esc(tested?v.run.feedback:'这份办法还没有试完。先留下来，再请同学照着看看。')+'</p><p class="note"><b>我还想说：</b>'+esc(v.note||'这一处先留白，等同学来问一问。')+'</p><small>图里是这次纸上试用的摆法。带到班级时，先看看真实的书篮和约定，再请同学一起试一试。</small></main></html>';
}
