import React,{useEffect,useRef,useState} from 'react';
import {Drop,PushPin,ArrowBendUpLeft} from '@phosphor-icons/react';
import {Button,Tile} from './ui.jsx';
import {WaterStepper} from './LearningExtras.jsx';
import {PredictionObservation} from './WaterPrediction.jsx';
import {cellObservation,preparationTarget} from './water-review.mjs';
import {cellName,neighbour,openings} from './water-editor.mjs';
import './water-review.css';

export default function WaterReview({trial,walk,onInspect,onPrepare}){
 const [picked,setPicked]=useState(null),[cursor,setCursor]=useState(18),board=useRef(null);
 useEffect(()=>setPicked(null),[walk.step]);
 if(!trial)return <div className="water-review waiting"><WaterStepper walk={walk}/></div>;
 const selected=picked??walk.spot??(Number.isInteger(trial.guessSpot)?trial.guessSpot:18),prep=preparationTarget(trial),hasGuess=trial.guessSpot!==undefined&&trial.guessSpot!==null;
 const focus=i=>board.current?.querySelector('[data-review-cell="'+i+'"]')?.focus();
 return <section className="water-review" aria-label="这一回的水路"><header className="review-heading"><div><p className="eyebrow">第{trial.number}次试水 · 留下的图</p><h3>沿着水迹，再看一回</h3></div><span className="review-stamp">看一看<br/>再动笔</span></header><div className="review-layout"><div className="review-visual"><div className="review-map-block"><div className="review-map-caption"><span>左下进水</span><span>右上田边 ↑</span></div><div ref={board} className={'review-board '+(walk.playing?'is-running':'')} role="group" aria-label="这次试水的四行六列图">{trial.grid.map((tile,i)=><button key={i} type="button" data-review-cell={i} className={['review-cell',i===15?'at-door':'',selected===i?'selected':'',walk.spot===i?'water-here':''].join(' ')} tabIndex={cursor===i?0:-1} aria-pressed={selected===i} aria-label={cellName(i)+'，'+openings(tile)+(trial.guessSpot===i?'，我的猜想纸签':'')+'。'+cellObservation(trial,walk.step,i)} onFocus={()=>{setCursor(i);walk.pause()}} onClick={()=>{setPicked(i);walk.pause()}} onKeyDown={e=>{if(e.key.startsWith('Arrow')){e.preventDefault();focus(neighbour(i,e.key))}}}><Tile tile={tile} lit={walk.lit.includes(i)}/><small>{Math.floor(i/6)+1}·{i%6+1}</small>{i===15&&<span className="review-door">{trial.bridge?'桥板':'门前'}</span>}{trial.guessSpot===i&&<PushPin className="review-pin" weight="fill" aria-hidden/>}{walk.spot===i&&<Drop className="review-bead" weight="fill" aria-hidden/>}</button>)}</div><div className="review-legend"><span><Drop weight="fill"/>正在回看的位置</span>{hasGuess&&<span><PushPin weight="fill"/>{trial.guessSpot==='before-board'?'我猜水还进不了图':'原来的猜想纸签'}</span>}<span className="review-wet-key">蓝色水槽：已经接到水</span></div></div><WaterStepper walk={walk}/></div><aside className="review-notes"><PredictionObservation trial={trial}/>{trial.result.trace.length>0?<section className="review-inspect" aria-label="看看这一格"><p className="eyebrow">点一格，仔细看看</p><h4>{cellName(selected)}</h4><p role="status">{cellObservation(trial,walk.step,selected)}</p><Button onClick={()=>{walk.pause();onInspect(selected)}}><ArrowBendUpLeft aria-hidden/>回到这一格，看看水槽</Button><small>只帮你找到位置，水槽由你来改。</small></section>:<section className="review-inspect"><h4>水还在图外</h4><p>这次先看看提水前的准备。准备好了，再让水走一走。</p>{prep&&<Button onClick={()=>onPrepare(prep)}>去看看提水准备</Button>}</section>}</aside></div></section>
}
