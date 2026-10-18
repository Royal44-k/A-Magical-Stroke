const copy=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),int=n=>Number.isSafeInteger(n)&&n>=0;
export const RAIN_NAMES={funnel:'漏斗出口',tube:'导管入口','tube-out':'导管出口',bowl:'小碗',table:'桌边'};
export const emptyRainStudio=()=>({count:0,prediction:'',trials:[]});
const linksValid=a=>Array.isArray(a)&&a.length<=2&&new Set(a.map(x=>x?.[0])).size===a.length&&a.every(x=>Array.isArray(x)&&x.length===2&&['funnel','tube'].includes(x[0])&&['tube','bowl','table'].includes(x[1]));
const sameLinks=(a,b)=>same([...a].sort(),[...b].sort());
export function traceRain(links){
 const first=links.find(x=>x[0]==='funnel')?.[1],last=links.find(x=>x[0]==='tube')?.[1],steps=[{point:'funnel',text:'一滴雨落进了漏斗。'}],segments=[];
 const done=(kind,ok,point,reason)=>({kind,ok,segments,steps:[...steps,{point,text:reason}],reason});
 if(!first)return done('open-funnel',false,'funnel','漏斗口还没有接好，雨滴从这里落下了。给它接一条到碗里的路。');
 segments.push(['funnel',first]);
 if(first==='bowl')return done('direct',true,'bowl','小碗放到漏斗下，直接接到了雨滴！不用导管，也有办法。');
 if(first==='table')return done('table-funnel',false,'table','雨滴从漏斗到了桌边。桌面湿了，小碗还没有接到雨。');
 steps.push({point:'tube',text:'雨滴进了导管入口。'}, {point:'tube-out',text:'雨滴沿着导管，走到了另一头。'});
 if(!last)return done('open-tube',false,'tube-out','前一段接好了，导管出口还空着。雨滴从这一头落下了。');
 segments.push(['tube',last]);
 if(last==='bowl')return done('pipe',true,'bowl','雨滴顺着导管，落进小碗里了！你给它接好了路。');
 if(last==='table')return done('table-tube',false,'table','雨滴经过了导管，却落到了桌边。再看看导管出口该朝哪里。');
 return done('loop',false,'tube','这条线又回到导管入口，还没有通到小碗。给雨滴另找一个出口。');
}
export function connectRain(r,from,to){if(!['funnel','tube'].includes(from)||!['tube','bowl','table'].includes(to))return r;if(r.links.find(x=>x[0]===from)?.[1]===to)return r;return replaceRainLinks(r,[...r.links.filter(x=>x[0]!==from),[from,to]])}
export function replaceRainLinks(r,links){if(!linksValid(links))return r;return {...r,links:copy(links),tested:false,studio:r.studio||emptyRainStudio()}}
export function tryRain(r,prediction=''){const studio=r.studio||emptyRainStudio(),result=traceRain(r.links),number=studio.count+1,t={number,links:copy(r.links),prediction:(prediction||'先试一滴').slice(0,100),result,note:''};return {...r,tested:result.ok,studio:{...studio,prediction:prediction.slice(0,100),count:number,trials:[...studio.trials,t].slice(-6)}}}
export function writeRainNote(r,number,note){if(typeof note!=='string'||!r.studio?.trials.some(t=>t.number===number))return r;return {...r,studio:{...r.studio,trials:r.studio.trials.map(t=>t.number===number?{...t,note:note.slice(0,160)}:t)}}}
export const validRainArt=t=>t===undefined||!!t&&int(t.number)&&t.number>0&&linksValid(t.links)&&typeof t.prediction==='string'&&t.prediction.length<=100&&typeof t.note==='string'&&t.note.length<=160&&same(traceRain(t.links),t.result);
export function validRain(r){if(!r||!linksValid(r.links)||typeof r.tested!=='boolean'||r.tested&&!traceRain(r.links).ok)return false;if(r.studio===undefined)return true;const st=r.studio;if(!st||!int(st.count)||typeof st.prediction!=='string'||st.prediction.length>100||!Array.isArray(st.trials)||st.trials.length>6||st.trials.some(t=>!t||!validRainArt(t)))return false;if(st.count===0)return st.trials.length===0;return st.trials.length>0&&st.trials.at(-1).number===st.count&&st.trials.every((t,i)=>i===0||t.number>st.trials[i-1].number)&&(!r.tested||st.trials.at(-1).result.ok&&sameLinks(st.trials.at(-1).links,r.links))}
export function restoreRain(r){return {...r,studio:r.studio||emptyRainStudio()}}
export function rainRecord(t){return '试之前：'+t.prediction+'。'+t.result.reason+(t.note?' 我留下的话：'+t.note:'')}
export function rainSources(s){return (s.rain.studio?.trials||[]).map(t=>({id:'rain-trial-'+t.number,kind:'rain',title:'第'+t.number+'回，雨滴到哪里',asset:'/assets/rain-tools-v1.png',grid:null,record:rainRecord(t),rainArt:copy(t)}))}
export const RAIN_POINTS={funnel:[15,20],tube:[55,15],'tube-out':[55,52],bowl:[85,82],table:[15,82]};
export function rainPath(from,to){const a=RAIN_POINTS[from==='tube'?'tube-out':from],b=RAIN_POINTS[to];if(from==='tube'&&to==='tube')return 'M55 52 C81 52 81 15 55 15';if(from==='funnel'&&to==='bowl')return 'M15 20 C15 58 56 82 85 82';return 'M'+a.join(' ')+' C'+a[0]+' '+((a[1]+b[1])/2)+' '+b[0]+' '+((a[1]+b[1])/2)+' '+b.join(' ')}
export function rainSvg(t){const result=traceRain(t.links);return '<svg xmlns="http://www.w3.org/2000/svg" class="rain-route-art" viewBox="0 0 360 320" role="img" aria-label="第'+t.number+'回实际接雨路线"><rect width="360" height="320" fill="#f3f1e5"/><g transform="scale(3.6 3.2)"><path d="M55 15L55 52" fill="none" stroke="'+(result.segments.some(x=>x[1]==='tube')?'#267580':'#a4aaa5')+'" stroke-width=".6" stroke-dasharray="1 1"/>'+t.links.map(([f,to])=>'<path d="'+rainPath(f,to)+'" fill="none" stroke="'+(result.segments.some(x=>same(x,[f,to]))?'#267580':'#9da5a4')+'" stroke-width=".8"/>').join('')+'</g>'+Object.entries(RAIN_POINTS).map(([id,[x,y]])=>'<g transform="translate('+(x*3.6)+' '+(y*3.2)+')"><rect x="-50" y="-23" width="100" height="46" rx="8" fill="'+(id==='bowl'&&result.ok?'#deebe0':'#fffdf7')+'" stroke="#70918d"/><text text-anchor="middle" y="7" fill="#173046" font-family="sans-serif" font-size="18">'+RAIN_NAMES[id]+'</text></g>').join('')+'</svg>'}
