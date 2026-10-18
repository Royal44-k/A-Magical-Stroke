import React,{useState} from 'react';
import {Button,Feedback,ArrowRight,ArrowLeft,Check} from './ui.jsx';
import {GUESTS,ACCESS,POLICIES,reviseCouncil,startCouncilRun,advanceCouncil,tomorrowCouncil,councilIssue,councilReady,councilRecord} from './council.mjs';
import {negotiate} from './model.mjs';
import './council.css';
import{speechWelcome}from'./speech.mjs';
export function Council({s,update}){
 const c=s.council,[notice,setNotice]=useState('');
 const act=fn=>{update(n=>({...n,council:fn(n.council)}));setNotice('');};
 const change=patch=>{act(v=>reviseCouncil(v,patch));setNotice('草案改了。照着新的一句，再试一回。');};
 const hear=id=>act(v=>({...v,heard:[...new Set([...v.heard,id])]}));
 const move=(id,to)=>{const from=c.queue.indexOf(id);if(from<0||to<0||to>=3||from===to)return;const q=[...c.queue];q.splice(from,1);q.splice(to,0,id);change({queue:q});setNotice(GUESTS[id].name+'移到了第'+(to+1)+'位。');};
 if(s.negotiated)return <section className="council-agreed" aria-label="已经谈成的约定"><span className="agreement-seal"><Check size={26}/></span><div><h3 id="agreement-title" tabIndex={-1}>这一句，大家一起记着</h3><p>{c.ratified?'鲁伯读出新约定，周婶、陈叔和大官共同确认，撤回了“签了才准用水”的条件。':'先前已经谈成的约定保留着：大家都能按次序取水。'}</p><strong>大家以后都能按次序取水。</strong>{c.ratified&&<p>{POLICIES[c.ratified.policy]}。{c.ratified.policy==='urgent'?'这一回，周婶和陈叔答应让小禾先请大人取一点水。以后遇到急用，也要先问清楚。':''}</p>}<p className="council-small">这次谈成了约定。水路和明天接手的人，还要各自安排好。</p></div></section>;
 if(!c.begun)return null;
 const heard=c.heard.includes('zhou')&&c.heard.includes('lu'),r=c.run,ready=councilReady(c);
 const canStart=heard&&!!c.access&&(c.policy!=='urgent'||c.consent);
 return <section className="council" aria-labelledby="council-title">
 <header className="council-heading"><span className="council-leaf">一页约定<br/>两天的事</span><div><p className="eyebrow">先在纸上看看，再请大家确认</p><h3 id="council-title" tabIndex={-1}>把约定放到明天看看</h3><p>今天帮到了，明天还能用吗？把名字排好，让这句话走过两天。</p></div></header>
 {speechWelcome(s)&&<p className="speech-welcome">{speechWelcome(s)}</p>}
 <div className="council-listen"><article><span className="speaker-tag">周婶问</span><p>“我没有签那张纸。今天能取水，明天还能来吗？”</p><Button aria-expanded={c.heard.includes('zhou')} onClick={()=>hear('zhou')}>明天也能来吗？</Button>{c.heard.includes('zhou')&&<p className="heard-answer">周婶：“我想把以后的日子也问清楚。只帮今天，明天还得再求人呀。”</p>}</article><article><span className="speaker-tag">鲁伯问</span><p>“谁能来，说清楚了。人一多，又该谁先取呢？”</p><Button aria-expanded={c.heard.includes('lu')} onClick={()=>hear('lu')}>人多时怎样排？</Button>{c.heard.includes('lu')&&<p className="heard-answer">鲁伯：“可以先来先取。谁有急事，也可以先问问前面的人，商量好了再让位。”</p>}</article></div>
 {heard&&<>
 <div className="council-draft"><fieldset><legend><b>一</b> 谁能来取水？</legend>{Object.entries(ACCESS).map(([id,text])=><Button key={id} aria-pressed={c.access===id} onClick={()=>change({access:id})}>{text}</Button>)}</fieldset><fieldset><legend><b>二</b> 大家怎样轮流？</legend>{Object.entries(POLICIES).map(([id,text])=><Button key={id} aria-pressed={c.policy===id} onClick={()=>change({policy:id})}>{text}</Button>)}</fieldset></div>
 <p className="council-small">这是正在商量的草案。纸上试过，还要请大家一起确认。</p>
 <section className="queue-workshop" aria-labelledby="queue-title"><div className="queue-heading"><h4 id="queue-title">把姓名纸牌排一排</h4><p>周婶先来，陈叔接着来，小禾最后来。拖动纸牌，或点“往前移”“往后移”。</p></div>
 <ol className="council-queue">{c.queue.map((id,i)=>{const g=GUESTS[id],outcome=r?.today.find(t=>t.id===id);return <li key={id} data-guest={id} draggable onDragStart={e=>e.dataTransfer.setData('application/x-maliang-guest',id)} onDragOver={e=>{if(e.dataTransfer.types.includes('application/x-maliang-guest'))e.preventDefault();}} onDrop={e=>{e.preventDefault();move(e.dataTransfer.getData('application/x-maliang-guest'),i);}} className={'guest-slip '+(outcome?(outcome.allowed?'served':'waiting'):'')}><span className="queue-number">第 {i+1} 位</span><strong>{g.name}</strong><span className="signed-note">{g.signed?'签过那张纸':'没有签那张纸'}</span><p>{g.note}</p><div className="queue-movers"><Button disabled={i===0} aria-label={g.name+'往前移'} onClick={()=>move(id,i-1)}><ArrowLeft size={17}/>往前移</Button><Button disabled={i===2} aria-label={g.name+'往后移'} onClick={()=>move(id,i+1)}>往后移<ArrowRight size={17}/></Button></div><span className="guest-outcome">{outcome?(outcome.allowed?'这一轮能取水':'这句话拦住了这一位'):r&&r.index===i?'接下来轮到这里':'纸牌还在等候'}</span></li>;})}</ol>
 {c.policy==='urgent'&&<div className="queue-consent"><Button onClick={()=>change({consent:true})} disabled={c.consent}>问问前面的两位</Button>{c.consent?<p>周婶：“我能等一会儿。”陈叔：“我也答应，让小禾先请大人给菜苗取一点水。”</p>:<p>想先帮急需的人，也要听听前面两位的回答。</p>}</div>}
 </section>
 <div className="council-play"><Button primary disabled={!canStart} onClick={()=>act(startCouncilRun)}>照着草案，试一回</Button>{!canStart&&<p>{!c.access?'先选一句“谁能来取水”。':'先问问前面的两位，再开始试用。'}</p>}</div>
 {r&&<section className={'council-days '+(r.tomorrow?'is-tomorrow':'')} aria-labelledby="day-title"><div className="day-stamp" aria-hidden="true"><span>{r.tomorrow?'明':'今'}</span>天</div><div className="day-content"><p className="eyebrow">第 {r.number} 次纸上试用</p><h4 id="day-title">{r.tomorrow?'这一句，到了明天呢？':'一个一个，照着约定来'}</h4><p>{ACCESS[r.access]}</p><p role="status" aria-live="polite" aria-atomic="true">{r.feedback}</p>{r.tomorrow?<ul className="tomorrow-list">{Object.entries(GUESTS).map(([id,g])=><li key={id} className={r.tomorrowAllowed.includes(id)?'can-come':'cannot-come'}><strong>{g.name}</strong><span>{r.tomorrowAllowed.includes(id)?'明天仍能来':'明天仍被拦住'}</span></li>)}</ul>:<div className="actions"><Button primary disabled={r.index===3} onClick={()=>act(advanceCouncil)}>请下一位试取水</Button><Button disabled={r.index!==3} onClick={()=>act(tomorrowCouncil)}>翻到明天</Button></div>}<span className="day-count">{r.index} / 3 位已经试过</span></div></section>}
 {notice&&<Feedback>{notice}</Feedback>}
 {r?.tomorrow&&<div className="council-result"><Feedback good={ready}>{ready?'这份草案把今天和明天都说清楚了，纸牌的次序也排好了。现在请鲁伯和大家一起确认。':councilIssue(c)}</Feedback></div>}
 <div className="council-confirm"><Button primary disabled={!ready} onClick={()=>{update(negotiate);requestAnimationFrame(()=>document.getElementById('agreement-title')?.focus());}}>请大家确认新约定</Button><p>{s.exclusive?'还没有共同确认，原来的用水条件仍在。':'你先前没有答应用水限制。试草案不会替你答应。'}</p></div>
 {c.trials.length>0&&<details className="council-history"><summary>翻一翻试过的约定（最近 {c.trials.length} 次）</summary>{c.trials.map(t=><article key={t.number}><h4>第 {t.number} 次</h4><p>{councilRecord(t)}</p></article>)}</details>}
 </>}
 </section>;
}

export function CouncilRecords({s}){const c=s.council;if(!c.trials.length&&!s.negotiated)return null;return <section className="council-book"><h3>在纸上试过的约定</h3>{c.trials.map(t=><details key={t.number}><summary>第 {t.number} 次 · {ACCESS[t.access]}</summary><p>{councilRecord(t)}</p></details>)}{s.negotiated&&<p>这一次已经共同确认：大家以后都能按次序取水。{c.ratified?POLICIES[c.ratified.policy]+'。':''}</p>}{s.exclusive&&<p>现在，“签了才准用水”的条件仍在。</p>}</section>;}
