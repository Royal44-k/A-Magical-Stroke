export const GUESTS={zhou:{name:'周婶',note:'给家里添水，能按次序等。',signed:false},chen:{name:'陈叔',note:'给菜地浇水，能等一小会儿。',signed:true},xiaohe:{name:'小禾',note:'新栽的菜苗晒着了，想请大人先给一点水。',signed:false}};
export const ACCESS={all:'大家以后都能按次序取水',signed:'只有签契书的人才能取',today:'今天先帮没签的人取一次'};
export const POLICIES={arrival:'先来先取',urgent:'问过大家，再让急需的人先取'};
const IDS=Object.keys(GUESTS),clone=x=>structuredClone(x);
export function emptyCouncil(){return {begun:false,heard:[],access:'',policy:'arrival',consent:false,queue:[...IDS],revision:0,count:0,run:null,trials:[],ratified:null};}
export function reviseCouncil(c,patch){
 if(c.ratified)return c;
 const next={...c,...Object.fromEntries(Object.entries(patch).filter(([k])=>['access','policy','queue','consent'].includes(k))),revision:c.revision+1,run:null};
 if(patch.policy!==undefined&&patch.policy!==c.policy&&patch.consent===undefined)next.consent=false;
 return next;
}
const hasQuestions=c=>['zhou','lu'].every(id=>c.heard.includes(id));
export function startCouncilRun(c){
 if(c.ratified||!c.begun||!hasQuestions(c)||!ACCESS[c.access]||!POLICIES[c.policy]||c.policy==='urgent'&&!c.consent)return c;
 const n=clone(c);n.count++;
 n.run={number:n.count,revision:n.revision,access:n.access,policy:n.policy,consent:n.consent,queue:[...n.queue],index:0,today:[],tomorrow:false,tomorrowAllowed:[],feedback:'把纸牌当作来取水的人，照着这份草案试一回。'};
 return n;
}
export function advanceCouncil(c){
 if(c.ratified||!c.run||c.run.revision!==c.revision||c.run.index>=3||c.run.tomorrow)return c;
 const n=clone(c),r=n.run,id=r.queue[r.index],allowed=r.access!=='signed'||GUESTS[id].signed;
 r.today.push({id,allowed});r.index++;
 r.feedback=GUESTS[id].name+(allowed?(id==='xiaohe'?'这一轮能请大人帮忙取水。':'这一轮能取水。'):'没有签那张纸，被这句话挡住了。')+(r.index===3?'今天试完了。翻到明天，再看看。':'再请下一位试一试。');return n;
}
export function tomorrowCouncil(c){
 if(c.ratified||!c.run||c.run.revision!==c.revision||c.run.index!==3||c.run.tomorrow)return c;
 const n=clone(c),r=n.run;r.tomorrow=true;r.tomorrowAllowed=IDS.filter(id=>r.access==='all'||GUESTS[id].signed);
 r.feedback=r.access==='all'?'翻到明天，三个人仍能按约定取水。':r.access==='today'?'到了明天，“今天先帮一次”用不上了。周婶和小禾又被原来的话挡住了。':'到了明天，周婶和小禾仍没有签那张纸，还是不能取水。';
 n.trials=[...n.trials,clone(r)].slice(-6);return n;
}
export function councilIssue(c){
 if(!c.begun)return '先请鲁伯和大家一起谈。';
 if(!hasQuestions(c))return '先听听周婶和鲁伯各在问什么。';
 if(!ACCESS[c.access])return '先写一句：谁能来取水？';
 if(c.policy==='urgent'&&!c.consent)return '想让急需的人先取，先问问排在前面的两位。';
 if(!c.run||c.run.revision!==c.revision)return '照着刚写的草案，在纸上试一回。';
 if(c.run.index!==3)return '今天还有人没试到，再请下一位。';
 if(!c.run.tomorrow)return '今天试过了，再翻到明天看看。';
 if(c.access!=='all')return c.access==='today'?'今天帮到了，明天呢？改一改“谁能来”这一句。':'这句话还拦着没签的人。改一改“谁能来”这一句。';
 const expected=c.policy==='urgent'?['xiaohe','zhou','chen']:IDS;
 if(c.queue.join(',')!==expected.join(','))return '纸牌的次序和写下的办法不同。把名字重新排一排。';
 return '';
}
export const councilReady=c=>!councilIssue(c);
export function ratifyCouncil(c){return councilReady(c)?{...c,ratified:{access:c.access,policy:c.policy,queue:[...c.queue],trialNumber:c.run.number}}:c;}
export function councilRecord(r){return '纸上试用：'+ACCESS[r.access]+'；'+POLICIES[r.policy]+'。我排的次序：'+r.queue.map(id=>GUESTS[id].name).join('、')+'。今天：'+r.today.map(x=>GUESTS[x.id].name+(x.allowed?'能取水':'被条款挡住')).join('，')+'。明天：'+r.tomorrowAllowed.map(id=>GUESTS[id].name).join('、')+'能取水。这是草案试用，还没有替大家确认新约定。';}
export function validCouncil(c){
 const int=x=>Number.isSafeInteger(x)&&x>=0&&x<10000000,bool=x=>typeof x==='boolean',arr=(a,p,max)=>Array.isArray(a)&&a.length<=max&&a.every(p);
 const queue=a=>arr(a,x=>IDS.includes(x),3)&&a.length===3&&new Set(a).size===3;
 const access=a=>Object.hasOwn(ACCESS,a),policy=p=>Object.hasOwn(POLICIES,p);
 const validRun=r=>r&&int(r.number)&&r.number>0&&int(r.revision)&&access(r.access)&&policy(r.policy)&&bool(r.consent)&&queue(r.queue)&&int(r.index)&&r.index<=3&&arr(r.today,(x)=>x&&IDS.includes(x.id)&&bool(x.allowed),3)&&r.today.length===r.index&&r.today.every((x,i)=>x.id===r.queue[i]&&x.allowed===(r.access!=='signed'||GUESTS[x.id].signed))&&bool(r.tomorrow)&&(!r.tomorrow||r.index===3)&&arr(r.tomorrowAllowed,id=>IDS.includes(id),3)&&JSON.stringify(r.tomorrowAllowed)===JSON.stringify(r.tomorrow?IDS.filter(id=>r.access==='all'||GUESTS[id].signed):[])&&typeof r.feedback==='string'&&r.feedback.length<=400;
 if(!c||!bool(c.begun)||!arr(c.heard,id=>['zhou','lu'].includes(id),2)||new Set(c.heard).size!==c.heard.length||!(c.access===''||access(c.access))||!policy(c.policy)||!bool(c.consent)||!queue(c.queue)||!int(c.revision)||!int(c.count)||!arr(c.trials,r=>validRun(r)&&r.tomorrow&&r.number<=c.count,6))return false;
 if(new Set(c.trials.map(r=>r.number)).size!==c.trials.length)return false;
 if(c.run!==null&&(!validRun(c.run)||c.run.number!==c.count||c.run.revision!==c.revision||c.run.access!==c.access||c.run.policy!==c.policy||c.run.consent!==c.consent||c.run.queue.join()!==c.queue.join()))return false;
 const r=c.ratified;
 if(r!==null&&(!r||r.access!=='all'||!policy(r.policy)||!queue(r.queue)||!int(r.trialNumber)||!councilReady(c)||r.trialNumber!==c.run.number||r.policy!==c.policy||r.queue.join()!==c.queue.join()))return false;
 return true;
}
