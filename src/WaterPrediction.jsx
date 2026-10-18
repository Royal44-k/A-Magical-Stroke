import React,{useRef,useState} from 'react';
import {Drop} from '@phosphor-icons/react';
import {Button,Tile} from './ui.jsx';
import {spotName,guessRecord} from './water-prediction.mjs';
import './water-prediction.css';

export function PredictionBoard({grid,spot,onSpot}){
 const board=useRef(null),[cursor,setCursor]=useState(18);
 const focus=i=>board.current?.querySelector('[data-guess-cell="'+i+'"]')?.focus();
 const key=(event,i)=>{const step={ArrowUp:-6,ArrowDown:6,ArrowLeft:-1,ArrowRight:1}[event.key];if(step===undefined)return;event.preventDefault();const row=Math.floor(i/6),col=i%6;if(event.key==='ArrowLeft'&&col===0||event.key==='ArrowRight'&&col===5||event.key==='ArrowUp'&&row===0||event.key==='ArrowDown'&&row===3)return;focus(i+step)};
 return <section className="prediction-paper" aria-label="留一张猜想纸签"><div className="prediction-paper-head"><div><p className="eyebrow">试水前 · 留一枚水滴</p><h4>你猜，水能走到哪一格？</h4></div><span aria-hidden="true">✦</span></div><p>想留纸签，就点图上的一格；也可以直接试水。先不看答案。</p><div className="prediction-scroll"><div ref={board} className="prediction-board" role="group" aria-label="四行六列猜想图，方向键找格子，回车贴纸签">{grid.map((tile,i)=><button key={i} type="button" data-guess-cell={i} tabIndex={cursor===i?0:-1} className={'prediction-cell '+(i===spot?'is-guessed ':'')+(i===15?'is-door':'')} aria-pressed={i===spot} aria-label={'第'+(Math.floor(i/6)+1)+'行、第'+(i%6+1)+'格'+(i===15?'，门前':'')+(i===spot?'，猜想纸签':'')} onFocus={()=>setCursor(i)} onKeyDown={e=>key(e,i)} onClick={()=>onSpot(i===spot?null:i)}><Tile tile={tile}/><small>{Math.floor(i/6)+1}·{i%6+1}</small>{i===spot&&<Drop weight="fill" className="prediction-drop" aria-hidden="true"/>}{i===15&&<span className="prediction-door">门前</span>}</button>)}</div></div><div className="prediction-map-ends"><span>水从左下角进来</span><span>田在右上角 ↑</span></div><div className="prediction-paper-actions"><Button aria-pressed={spot==='before-board'} onClick={()=>onSpot(spot==='before-board'?null:'before-board')}>我猜水还进不了图</Button>{spot!==null&&<Button onClick={()=>onSpot(null)}>取下纸签</Button>}</div><p className="prediction-selected" role="status" aria-live="polite">{spot===null?'还没贴纸签。想好了，再试水。':spot==='before-board'?'纸签写着：我猜水还进不了图。':'纸签贴在'+spotName(spot)+'。'}</p></section>
}
export function PredictionObservation({trial}){const record=guessRecord(trial);return record?<aside className="prediction-observation" aria-label="猜想和这次看见的"><strong>翻开刚才的纸签</strong><p>{record}</p><p>指一指水迹：你从哪里看出来？下次想改哪一处？</p></aside>:null}
