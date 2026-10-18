import React from 'react';
import {STAGES,TITLES} from './model.mjs';
import {chapterNote,locationTitle,returnLabel} from './journey.mjs';
import {Button,ArrowRight} from './ui.jsx';
import './JourneyMap.css';
const posters={rain:'night-brush-v2',gift:'worktable-day-v1',observe:'river-survey-v1',workshop:'ink-workshop-v1',handoff:'worktable-day-v1',contract:'grain-contract-v1',court:'court-sea-v1',review:'evening-review-v1',ending:'evening-review-v1'};
export function ReturnBookmark({s,onReturn}){
 const b=s.navigation.back;if(!b)return null;
 return <section className="return-strip journey-return" aria-label="回看后的返回位置"><div><strong>{b.mode==='repair'?'回来补一笔':'回头看看，也能接着走'}</strong><p>{b.screen==='classroom'?'看完以后，还能回图书角接着做。':b.stage==='ending'?'如果你改过办法，结尾也会跟着变。':b.mode==='repair'?'看过或改过后，回到刚才的画，再看看接下来怎样。':'看完以后，回到第'+STAGES.indexOf(b.stage)+'幕，接着刚才的故事。'}</p></div><Button onClick={onReturn}>{returnLabel(s)}<ArrowRight/></Button></section>;
}
export function JourneyMap({s,onGo,onClose,onReturn,closeLabel}){
 return <div className="journey-map">
  <div className="journey-location"><span>{s.stage==='home'?'准备出发':'你在这里'}</span><strong>{locationTitle(s)}</strong></div>
  <p className="journey-intro">点开来过的一幕，回去看看。来过这里，不等于办法已经试好。</p>
  {s.navigation.back&&<ReturnBookmark s={s} onReturn={onReturn}/>}
  <ol className="journey-chapters" aria-label="九幕故事路标">{STAGES.slice(1).map((stage,i)=>{
   const current=s.stage===stage&&!s.library.active,known=s.visited.includes(stage)||current;
   return <li key={stage} className={current?'journey-chapter current':known?'journey-chapter visited':'journey-chapter unopened'} aria-current={current?'step':undefined}>
    <div className="journey-scene"><img src={'/assets/'+posters[stage]+'.png'} alt="" loading="lazy"/><span>第{i+1}幕</span></div>
    <div className="journey-chapter-copy"><small>{current?'你在这里':known?'来过这里':'还没走到'}</small><h3>{TITLES[stage]}</h3><p>{known?chapterNote(s,stage):'往前走，就会来到这里。'}</p>
    {known&&(current?<Button onClick={()=>onGo(stage)}>接着做这一幕<ArrowRight/></Button>:stage==='ending'?<><p className="journey-ending-note">如果你改过办法，结尾也会跟着变。</p><Button onClick={()=>onGo(stage)}>按现在的办法看结尾<ArrowRight/></Button></>:<Button aria-label={'回看第'+(i+1)+'幕：'+TITLES[stage]} onClick={()=>onGo(stage)}>回看这一幕<ArrowRight/></Button>)}</div>
   </li>;
  })}</ol>
  <div className="journey-bottom"><p>回看时，原来的画稿和尝试都留着。</p><Button onClick={onClose}>{closeLabel}</Button></div>
 </div>;
}
