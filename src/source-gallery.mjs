import {FIELDS,fieldWords} from './comparison.mjs';
import {guessRecord} from './water-prediction.mjs';
export const SOURCE_CATEGORIES=[['all','全部画面'],['water','每次试水'],['noticed','河边观察页'],['speech','开场话'],['handoff','交接图'],['care','照看小剧场'],['challenge','伙伴的水路'],['rain','雨滴找路'],['question','问题纸条'],['comparison','两张图比一比'],['heard','听到的话'],['trial','试过的办法'],['choice','我的选择'],['result','后来的事']];
export const emptyBrowse=()=>({category:'all',query:'',outcome:'all',page:1});
export function trialSource(t){
 const fields=FIELDS.map(([key,label])=>({label,value:fieldWords(t,key)}));
 return {id:'trial-'+t.number,kind:'trial',title:'第'+t.number+'次试水',asset:null,grid:t.grid,trialNumber:t.number,trialReady:t.result.ok,
 record:(t.prediction.trim()?'我猜：'+t.prediction+(/[。！？.!?…]\s*$/.test(t.prediction)?'':'。'):'那次没有写下猜想。')+' '+guessRecord(t)+'试过看到：'+t.result.reason+'\n那时的准备：\n'+fields.map(x=>x.label+'：'+x.value).join('\n'),
 trialDetail:{prediction:t.prediction,guess:guessRecord(t),reason:t.result.reason,fields}};
}
const categoryMatches=(s,c)=>c==='all'||(c==='water'?Number.isInteger(s.trialNumber):c==='result'?['handoff','agreement','ending','transfer'].includes(s.kind):s.kind===c);
export const sourceCounts=sources=>Object.fromEntries(SOURCE_CATEGORIES.map(([id])=>[id,sources.filter(s=>categoryMatches(s,id)).length]));
const normalize=text=>String(text??'').normalize('NFKC').toLocaleLowerCase('zh-CN').replace(/第\s*(\d+)\s*次/g,'第$1次');
export function browseSources(sources,options={}){
 const {category='all',outcome='all',query='',page=1}=options,words=normalize(query).trim().split(/\s+/u).filter(Boolean);
 const matches=sources.filter(s=>categoryMatches(s,category)&&(category!=='water'||outcome==='all'||s.trialReady===(outcome==='ready'))&&words.every(w=>normalize(s.title+' '+s.record).includes(w)));
 const total=matches.length,pages=Math.max(1,Math.ceil(total/12)),current=Math.max(1,Math.min(pages,Number.isInteger(page)?page:1)),start=(current-1)*12;
 return {items:matches.slice(start,start+12),total,pages,page:current,start:total?start+1:0,end:Math.min(start+12,total)};
}
