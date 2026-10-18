import React,{useMemo,useRef,useState,useEffect,useLayoutEffect} from 'react';
import {ArrowLeft,ArrowRight,MagnifyingGlass,X} from '@phosphor-icons/react';
import {Button} from './ui.jsx';
import {FrameArt} from './FrameArt.jsx';
import {SOURCE_CATEGORIES,browseSources,sourceCounts} from './source-gallery.mjs';
import './SourceGallery.css';
export default function SourceGallery({sources,frames,browse,setBrowse,onChoose}){
 const result=useMemo(()=>browseSources(sources,browse),[sources,browse]),counts=useMemo(()=>sourceCounts(sources),[sources]);
 const [preview,setPreview]=useState(null),[notice,setNotice]=useState(null);
 const previewHeading=useRef(null),pageHeading=useRef(null),pageRequested=useRef(false),returnTo=useRef(null);
 useLayoutEffect(()=>{if(preview===null&&returnTo.current){const id=returnTo.current;returnTo.current=null;document.querySelector('[data-source-look="'+CSS.escape(id)+'"]')?.focus()}},[preview]);
 const source=sources.find(x=>x.id===preview),chosen=new Set(frames.map(f=>f.sourceId));
 useEffect(()=>{if(preview){previewHeading.current?.focus({preventScroll:true});previewHeading.current?.scrollIntoView({block:'start',behavior:'instant'})}},[preview]);
 useEffect(()=>{if(pageRequested.current){pageRequested.current=false;pageHeading.current?.focus({preventScroll:true});pageHeading.current?.scrollIntoView({block:'start',behavior:'instant'})}},[result.page]);
 const filter=patch=>{setBrowse({...browse,...patch,page:1});setPreview(null);setNotice(null)};
 const turn=page=>{pageRequested.current=true;setBrowse({...browse,page});setPreview(null);setNotice(null)};
 const look=id=>{setPreview(id);setNotice(null);if(id===preview){previewHeading.current?.focus({preventScroll:true});previewHeading.current?.scrollIntoView({block:'start',behavior:'instant'})}};
 const close=()=>{returnTo.current=preview;setPreview(null)};
 const add=source=>{if(chosen.has(source.id))return;if(frames.length>=3){setNotice({text:'三格都放满了。先拿下一幅，再换上新的。'});return;}onChoose(source);setNotice({text:'“'+source.title+'”放进第'+(frames.length+1)+'格了。',id:source.id});};
 const goToFrame=id=>{const el=document.querySelector('[data-story-frame="'+CSS.escape(id)+'"] h3');el?.focus({preventScroll:true});el?.scrollIntoView({block:'start',behavior:'instant'})};
 return <section className="story-sources source-gallery" aria-label="可以放进故事的画面">
 <div className="source-heading"><div><p className="eyebrow">找回那时的一步</p><h3>从这些画面里挑一挑</h3></div><span>已放好 {frames.length} / 3 格</span></div>
 <p className="source-intro">试好的、还没试好的，都可以讲。先看看那时的图和记录，再挑你想说的一幅。</p>
 <div className="source-tools"><label className="source-search"><span><MagnifyingGlass aria-hidden/>找一句话，或找第几次</span><input type="search" maxLength={80} value={browse.query} placeholder="如：支架、第7次" onChange={e=>filter({query:e.target.value})}/></label><label className="source-category-select">按经历找画面<select value={browse.category} onChange={e=>filter({category:e.target.value,outcome:'all'})}>{SOURCE_CATEGORIES.map(([id,label])=><option key={id} value={id}>{label}（{counts[id]}）</option>)}</select></label></div>
 <div className="tabs source-category-buttons" aria-label="按经历找画面">{SOURCE_CATEGORIES.map(([id,label])=><Button key={id} aria-pressed={browse.category===id} onClick={()=>filter({category:id,outcome:'all'})}>{label}<span aria-hidden="true" className="source-count">{counts[id]}</span></Button>)}</div>
 {browse.category==='water'&&<fieldset className="source-outcomes"><legend>想看哪次试水？</legend>{[['all','全部试水'],['ready','水路试好了'],['more','还没试好']].map(([id,label])=><Button key={id} aria-pressed={browse.outcome===id} onClick={()=>filter({outcome:id})}>{label}</Button>)}</fieldset>}
 <div className="source-results-head" role="status" aria-live="polite"><h4 ref={pageHeading} tabIndex={-1}>{result.total?'找到 '+result.total+' 幅画面':'还没找到这幅画'}</h4><span>{result.total?'这里是第 '+result.start+'—'+result.end+' 幅':''}</span></div>
 {notice&&<div className="source-notice" role="status"><p>{notice.text}</p>{notice.id&&<Button onClick={()=>goToFrame(notice.id)}>去看这一格，添句话</Button>}</div>}
 {source&&<section className="source-preview" aria-label="先看这一幅"><header><div><p className="eyebrow">先看看，再来选</p><h4 ref={previewHeading} tabIndex={-1}>{source.title}</h4></div><Button onClick={close}><X aria-hidden/>收起大图</Button></header><div className="source-preview-body"><div className="source-preview-art"><FrameArt frame={source}/><p>图和记录都留着那时的样子。</p></div><div className="source-preview-words">{source.trialDetail?<><dl><dt>当时我猜</dt><dd>{source.trialDetail.prediction||'那次没有写下猜想。'}</dd>{source.trialDetail.guess&&<><dt>图上纸签</dt><dd>{source.trialDetail.guess}</dd></>}<dt>试过以后</dt><dd>{source.trialDetail.reason}</dd></dl><table><caption>那时怎样准备</caption><tbody>{source.trialDetail.fields.map(f=><tr key={f.label}><th scope="row">{f.label}</th><td>{f.value}</td></tr>)}</tbody></table></>:<><h5>那时留下的记录</h5><p>{source.record}</p></>}<p className="source-think">哪一处让你想再看一眼？可以指着图说，也可以放进画格后写一句。</p></div></div><div className="actions">{chosen.has(source.id)?<><span>这幅已经在三格故事里了。</span><Button onClick={()=>goToFrame(source.id)}>去看这一格，添句话</Button></>:<Button primary onClick={()=>add(source)}>把这幅放进一格</Button>}<Button onClick={close}>回到画面栏</Button></div></section>}
 {result.items.length?<div className="source-cards">{result.items.map(item=><article className="source-item" key={item.id}><button className={'source-card '+(chosen.has(item.id)?'picked':'')} aria-label={'放入'+item.title} disabled={chosen.has(item.id)} onClick={()=>add(item)}><FrameArt frame={item} small/><strong>{item.title}</strong>{item.trialNumber&&<small>{item.trialReady?'水路试好了':'还要再看看'}</small>}<span>{chosen.has(item.id)?'已放进画页':'+ 放进一格'}</span></button><Button className="source-look" data-source-look={item.id} aria-label={'先看'+item.title} aria-expanded={preview===item.id} onClick={()=>look(item.id)}>先看看<ArrowRight aria-hidden/></Button></article>)}</div>:<div className="source-empty"><p>{!sources.length?'画卷还没有展开。先去经历一个故事，再回来挑画面吧。':browse.query?'换个短词找找，如“支架”或“第2次”。也可以先看看全部画面。':'这一类还没有画面。先看看别的经历，也可以回画里接着走。'}</p>{sources.length>0&&<Button onClick={()=>filter({category:'all',query:'',outcome:'all'})}>看看全部画面</Button>}</div>}
 {result.pages>1&&<nav className="source-pagination" aria-label="翻看经历画面"><Button disabled={result.page===1} onClick={()=>turn(result.page-1)}><ArrowLeft aria-hidden/>前一页画面</Button><label>翻到哪一页？<select value={result.page} onChange={e=>turn(Number(e.target.value))}>{Array.from({length:result.pages},(_,i)=><option key={i+1} value={i+1}>第 {i+1} 页 / 共 {result.pages} 页</option>)}</select></label><Button disabled={result.page===result.pages} onClick={()=>turn(result.page+1)}>后一页画面<ArrowRight aria-hidden/></Button></nav>}
 <p className="aside-note">每次试水都能找回来。选画面不会改动那次的记录，也不会改变故事的结尾。</p>
 </section>;
}
