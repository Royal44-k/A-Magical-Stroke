export const BRIDGE_LANDINGS={square:'公共广场',store:'库房旁',water:'水面'};
export const emptyBridgeStudio=()=>({width:1,transfer:'cart',supports:[],cleared:false,revision:0,count:0,run:null,trials:[]});
const clone=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export const bridgeSnapshot=b=>({landing:b.landing,width:b.studio.width,transfer:b.studio.transfer,supports:[...b.studio.supports].sort(),cleared:b.studio.cleared});
export const bridgeEnd=x=>x.landing==='store'?3:2;
export function reviseBridgePlan(b,patch){const legacy=!b.studio,n=clone(b);if(legacy)n.studio=emptyBridgeStudio();const st=n.studio;let changed=legacy;
 for(const [key,value] of Object.entries(patch)){if(key==='landing'){if(!['','square','store','water'].includes(value))continue;if(n.landing!==value){n.landing=value;changed=true;}}else if(['width','transfer','supports','cleared'].includes(key)&&!same(st[key],value)){st[key]=clone(value);changed=true;}}
 if(!changed)return b;st.revision++;st.run=null;n.tested=false;n.support=st.supports.length===2;n.order=[];return n;
}
function initial(snapshot,number,revision){return {snapshot:clone(snapshot),number,revision,checks:{near:false,far:false},positions:{walk:0,cart:0},cargo:0,returning:false,events:[],finished:false,ok:false,feedback:'纸人和两篮东西都在这边。先请鲁伯在图上看看两端。'};}
export function startBridgeRun(b){const n=clone(b);if(!n.studio)n.studio=emptyBridgeStudio();n.support=n.studio.supports.length===2;n.order=[];n.tested=false;n.studio.count++;n.studio.run=initial(bridgeSnapshot(n),n.studio.count,n.studio.revision);return n;}
function advance(r,action){if(r.finished||!['near','far','walk','cart'].includes(action))return r;
 if((['near','far'].includes(action)&&r.checks[action])||(action==='walk'&&r.positions.walk===bridgeEnd(r.snapshot))||(action==='cart'&&r.cargo===2))return r;
 const n=clone(r),p=n.snapshot,end=bridgeEnd(p);n.events.push(action);
 const stop=text=>{n.finished=true;n.feedback=text;return n;};
 if(action==='near'||action==='far'){
  if(!p.supports.includes(action))return stop((action==='near'?'桥头':'桥尾')+'下面还缺一个支点。先在图上放好，再试一回。');
  if(action==='far'){
   if(!p.landing)return stop('桥尾还没有选落脚处。先看看图，再选一处。');
   if(p.landing==='water')return stop('那一头还是水面，纸人没有落脚处。换个落点再试。');
   if(p.landing==='store'&&!p.cleared)return stop('库房旁的木料挡住了出口。可以请鲁伯挪开，也可以换一处落点。');
  }
  n.checks[action]=true;n.feedback=(action==='near'?'桥头这一端接上支点了。':'桥尾接上了，出口也留出来了。')+(n.checks.near&&n.checks.far?'现在选一个纸人，往前移一处。':'再看看另一端。');return n;
 }
 if(!n.checks.near||!n.checks.far)return stop('先请鲁伯在图上看看桥头和桥尾，纸人先留在岸边。');
 if(action==='cart'&&p.transfer==='cart'&&p.width===1&&n.positions.cart===0)return stop('小车占两格，桥面只有一格宽。可以加宽桥面，也可以问陈叔愿不愿意分两回提。');
 const back=action==='cart'&&n.returning;n.positions[action]+=back?-1:1;const at=n.positions[action];
 if(action==='walk')n.feedback=at===end?'小禾的纸人到了广场。再看看陈叔和两篮东西。':at===2?'小禾到了库房旁，还要沿岸走到广场。':'小禾的纸人走到了桥面。下一处在哪儿？';
 else if(back){if(at===0){n.returning=false;n.feedback='陈叔回到这边，提起第二篮。第一篮已经留在广场。';}else n.feedback=at===2?'陈叔空手走回库房旁，再往回走一处。':'陈叔空手走到桥面，还要回去取第二篮。';}
 else if(at===end){n.cargo+=p.transfer==='cart'?2:1;n.returning=n.cargo===1;n.feedback=n.cargo===2?'两篮都到广场了。再看看小禾到了没有。':'第一篮到广场了，另一篮还在这边。请陈叔空手走回来。';}
 else n.feedback=at===2?'陈叔到了库房旁，还要沿岸走到广场。':p.transfer==='cart'?'小车走到了桥面，两篮还没有到广场。':'陈叔提着第'+(n.cargo+1)+'篮，走到了桥面。';
 if(n.positions.walk===end&&n.cargo===2){n.finished=true;n.ok=true;n.feedback='小禾和陈叔都到了广场，两篮也送到了！这张图上的办法试通了。原来的用水约定，还要接着谈。';}
 return n;
}
export function actBridge(b,action){if(!b.studio?.run)return b;const result=advance(b.studio.run,action);if(result===b.studio.run)return b;const n=clone(b);n.studio.run=result;n.tested=result.finished&&result.ok;if(result.finished)n.studio.trials=[...n.studio.trials,clone(result)].slice(-6);return n;}
export function bridgePassed(b){return !!(b.studio?.run?.finished&&b.studio.run.ok&&same(b.studio.run.snapshot,bridgeSnapshot(b)));}
const integer=n=>Number.isInteger(n)&&n>=0&&n<=1000000;
function validSnapshot(p){return !!p&&['','square','store','water'].includes(p.landing)&&[1,2].includes(p.width)&&['cart','carry'].includes(p.transfer)&&typeof p.cleared==='boolean'&&Array.isArray(p.supports)&&p.supports.length<=2&&new Set(p.supports).size===p.supports.length&&p.supports.every(x=>['near','far'].includes(x));}
function validRun(r){if(!r||!validSnapshot(r.snapshot)||!integer(r.number)||r.number===0||!integer(r.revision)||!Array.isArray(r.events)||r.events.length>20)return false;let replay=initial(r.snapshot,r.number,r.revision);for(const a of r.events){const n=advance(replay,a);if(n===replay)return false;replay=n;}return same(replay,r);}
export function validBridgeStudio(b){if(b.studio===undefined)return true;const v=b.studio;if(!v||!validSnapshot({landing:b.landing,...v})||!integer(v.count)||!integer(v.revision)||!Array.isArray(v.trials)||v.trials.length>6||b.support!==(v.supports.length===2))return false;
 let number=0;for(const t of v.trials){if(!validRun(t)||!t.finished||t.number<=number||t.number>v.count||t.revision>v.revision)return false;number=t.number;}
 if(v.run!==null&&(!validRun(v.run)||v.run.number!==v.count||v.run.revision!==v.revision||!same(v.run.snapshot,bridgeSnapshot(b))))return false;
 if(v.run?.finished&&!same(v.trials.at(-1),v.run))return false;
 return b.tested===bridgePassed(b);
}
export function validBridgeArt(a){return a===undefined||validRun(a);}
export function bridgeRecord(r){const p=r.snapshot;return '第'+r.number+'次纸桥试走：落点是'+(BRIDGE_LANDINGS[p.landing]||'还未选择')+'，'+p.width+'格宽，'+(p.transfer==='cart'?'推小车':'陈叔同意分两回提篮')+(p.landing==='store'?(p.cleared?'，库房旁的木料已移开':'，库房旁仍堆着木料'):'')+'。'+r.feedback+' 到广场的篮子：'+r.cargo+'篮。';}
export function bridgeSources(s){return (s.bridgePlan.studio?.trials||[]).map(r=>({id:'bridge-trial-'+r.number,kind:'trial',title:'第'+r.number+'次纸桥试走',asset:null,grid:null,record:bridgeRecord(r),bridgeArt:clone(r)}));}
export function bridgeSvg(r){const p=r.snapshot,end=bridgeEnd(p),labels=['这边','桥面',p.landing==='store'?'库房旁':p.landing==='water'?'水面':p.landing?'广场':'落点未选',...(end===3?['广场']:[])],w=600/labels.length;return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 290" role="img" aria-label="本次纸桥摆法与试走结果"><rect width="620" height="290" fill="#faf6ec"/>'+labels.map((x,i)=>'<g transform="translate('+(10+i*w)+',20)"><rect width="'+(w-12)+'" height="165" fill="'+(i===1?'#dcebed':'#ede3cc')+'" stroke="#9caa9c"/><text x="'+((w-12)/2)+'" y="28" text-anchor="middle" fill="#173046" font-size="18">'+x+'</text>'+(i===1?'<text x="'+((w-12)/2)+'" y="63" text-anchor="middle" font-size="17">'+p.width+'格宽</text>':'')+(r.positions.walk===i?'<text x="12" y="96" font-size="17">小禾</text>':'')+(r.positions.cart===i?'<text x="12" y="135" font-size="17">'+(p.transfer==='cart'?'陈叔·小车':'陈叔·提篮')+'</text>':'')+'</g>').join('')+'<text x="20" y="222" font-size="17" fill="#173046">桥头支点：'+(p.supports.includes('near')?'已放':'未放')+'　桥尾支点：'+(p.supports.includes('far')?'已放':'未放')+'</text><text x="20" y="260" font-size="19" fill="#275f63">'+(r.cargo===2?'两篮已到广场':r.cargo===1?'第一篮已到广场':'还没有篮子到广场')+' · '+(r.ok?'这一回试通了':r.finished?'这一回还要改一改':'还在试走')+'</text></svg>';}
