import{SpeechPaper}from'./SpeechPaper.jsx';
import {HandoffPaper} from './HandoffRecords.jsx';
import {rainSvg} from './rain.mjs';
import {comparisonSvg} from './comparison.mjs';
import {careSvg} from './care.mjs';
import {RiverFrame} from './RiverObserver.jsx';
import {bridgeSvg} from './paper-bridge.mjs';
import {librarySvg} from './library.mjs';
import {giftSvg} from './gifts.mjs';

import React,{lazy,Suspense} from 'react';import {Tile} from './ui.jsx';const DialogueView=lazy(()=>import('./DialogueView.jsx').then(m=>({default:m.DialogueView})));import {visibleLines} from './dialogue.mjs';
export function BareFrameArt({frame,small=false}){
 if(frame.speechArt)return <SpeechPaper page={frame.speechArt} small={small}/>;
 if(frame.handoffArt)return <HandoffPaper run={frame.handoffArt} small={small}/>;
 if(frame.rainArt&&!small)return <div className="rain-story-art"><img src={frame.asset} alt="接雨用的漏斗、导管和小碗"/><img src={"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(rainSvg(frame.rainArt))} alt={frame.title+"留下的路线"}/></div>;
 if(frame.rainArt)return <img className="story-picture rain-thumbnail" src={frame.asset} alt={frame.title}/>;
 if(frame.comparisonArt&&!small)return <div className="comparison-frame">{[frame.comparisonArt.a,frame.comparisonArt.b].map((t,n)=><figure key={t.number}><h4>第{t.number}次 · {n?'后试的图':'先试的图'}</h4><img src={"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(comparisonSvg(frame.comparisonArt,n))} alt={'第'+t.number+'次试水图纸'} draggable={false}/></figure>)}</div>;
 if(frame.comparisonArt)return <img className="story-picture comparison-thumbnail" src={"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(comparisonSvg(frame.comparisonArt))} alt={frame.title+"：前后两张真实图纸"}/>;
 if(frame.careArt)return <img className="story-picture" src={"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(careSvg(frame.careArt))} alt={frame.title+"：当时看见和试过的结果"}/>;
 if(frame.riverArt)return <RiverFrame page={frame.riverArt}/>;
 if(frame.bridgeArt)return <img className="story-picture" src={"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(bridgeSvg(frame.bridgeArt))} alt={frame.title+"：这次的摆法和位置"} draggable={false}/>;
 if(frame.libraryArt)return <img className="story-picture" src={"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(librarySvg(frame.libraryArt))} alt={frame.title+":实际书篮和标记"} draggable={false}/>;
 if(frame.giftArt)return <img className="story-picture gift-record-art" src={"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(giftSvg(frame.giftArt))} alt={frame.title+"：我留下的实际作品"} draggable={false}/>;
 if(frame.grid)return <div className="story-grid" role="img" aria-label={frame.title+'留下的水槽图'}>{frame.grid.map((t,i)=><span key={i} className={i===15?'door':''}><Tile tile={t}/>{i===15&&!small&&<small>门前</small>}</span>)}</div>;
 return <img className="story-picture" src={frame.asset} alt={frame.title} loading="lazy" draggable={false}/>;
}

export function FrameArt({frame,small=false}){const count=visibleLines(frame.dialogue).length;if(!count)return <BareFrameArt frame={frame} small={small}/>;if(small)return <div className="dialogue-compact"><BareFrameArt frame={frame} small/><p>{count}句话，等你读一读</p></div>;return <Suspense fallback={<><BareFrameArt frame={frame}/><p role="status">正在展开对话……</p></>}><DialogueView frame={frame} artwork={<BareFrameArt frame={frame}/>}/></Suspense>}
