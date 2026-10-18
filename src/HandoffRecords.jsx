import React from 'react';
import{Download}from'@phosphor-icons/react';
import{Button,downloadText}from'./ui.jsx';
import{HANDOFF_CARDS,cardResult,handoffRecord,handoffHtml}from'./handoff-card.mjs';
import'./HandoffStudio.css';
export function HandoffPaper({run:r,small=false}){
 return <section className={'handoff-paper'+(small?' compact':'')} aria-label={'第'+r.card.number+'回的交接图'}><p>{r.card.backup}照着这张图试</p><ol>{r.card.steps.map((id,i)=><li key={id} className={r.at===i?'marked':''}><b>{HANDOFF_CARDS[id]}</b>{r.at===i&&<span>{r.status==='done'?'读到这里，试完了':r.status==='blocked'?'停在这里':'最后读到这里'}</span>}</li>)}</ol>{!r.card.steps.length&&<p>图上还没有做法。</p>}<p><strong>{cardResult(r)}</strong></p></section>;
}
export function HandoffRecords({s}){
 const trials=s.handoff.cardTrials||[];if(!trials.length)return null;
 return <section className="handoff-records"><h3>看一看，刚才怎样交接</h3><p>这里留着最近六回。没试好的图，也能拿出来讲。</p>{trials.map(r=><details key={r.card.number}><summary>第{r.card.number}回交接图 · {cardResult(r)}</summary><div className="handoff-record-body"><HandoffPaper run={r}/><div><p className="handoff-record-text">{handoffRecord(r)}</p><Button onClick={()=>downloadText('第'+r.card.number+'回交接图.html',handoffHtml(r),'text/html;charset=utf-8')}><Download/>保存这张交接图</Button></div></div></details>)}</section>;
}
