import {STAGES,TITLES,GIFTS,visit,finish,functional,maintenance} from './model.mjs';
export function locationTitle(s){return s.library.active?'画外一课 · 图书角':s.stage==='home'?'画卷还没展开':'第'+STAGES.indexOf(s.stage)+'幕 · '+TITLES[s.stage];}
export function returnLabel(s){
 const b=s.navigation.back;if(!b)return '';
 if(b.screen==='classroom')return '回到图书角';
 if(b.mode==='repair')return '回到刚才的画';
 if(b.stage==='ending')return '按现在的办法看结尾';
 return '回到第'+STAGES.indexOf(b.stage)+'幕';
}
function position(s,stage,screen='play'){
 return {...s,stage,visited:s.visited.includes(stage)?s.visited:[...s.visited,stage],library:{...s.library,active:screen==='classroom'}};
}
function destination(s,stage,screen='play'){
 const n=position(s,stage,screen);
 // Evaluating an ending is an explicit UI action, never a side effect of opening the map.
 return stage==='ending'&&screen==='play'?finish(n):n;
}
export function revisit(s,stage){
 if(!STAGES.slice(1).includes(stage)||(!s.visited.includes(stage)&&s.stage!==stage))return s;
 if(s.stage===stage&&!s.library.active)return s;
 const existing=s.navigation.back;
 if(existing&&existing.stage===stage&&existing.screen==='play')return returnFromJourney(s);
 const back=existing||(s.stage==='home'?null:{stage:s.stage,screen:s.library.active?'classroom':'play',mode:'revisit'});
 return {...destination(s,stage),navigation:{back}};
}
export function repairJourney(s,stage){
 if(!['workshop','handoff','court'].includes(stage))return s;
 return {...position(s,stage),navigation:{back:{stage:'review',screen:'play',mode:'repair'}}};
}
export function returnFromJourney(s){
 const b=s.navigation.back;if(!b)return s;
 return {...destination(s,b.stage,b.screen),navigation:{back:null}};
}
export function advanceJourney(s,stage){
 if(s.navigation.back?.mode==='repair')return returnFromJourney(s);
 const n=visit(s,stage),b=s.navigation.back;
 return b?.screen==='play'&&b.stage===stage?{...n,navigation:{back:null}}:n;
}
export function chapterNote(s,stage){
 switch(stage){
 case 'rain':return s.rain.studio.trials.length?'留下了'+s.rain.studio.trials.length+'回接雨记录。':'连起接雨的路线，放一滴雨试试。';
 case 'gift':return s.gift?'第一笔选了“'+GIFTS[s.gift]+'”。':'第一笔还没选，可以再想一想。';
 case 'observe':{const heard=Object.values(s.seen).flat().length,pages=s.river.pages.length;return !heard&&!pages?'到河边，听听大家怎么说。':pages?'留下了'+pages+'张观察页，还能接着看。':'听过'+heard+'句回答，还没留下观察页。';}
 case 'workshop':return !s.trials.length?'还没试水，摆好的水槽留着呢。':functional(s)?'试过'+s.trials.length+'次，这次水到了田边。':s.trials.at(-1).revision!==s.revision?'水路改过了，还没有重新试水。':'试过'+s.trials.length+'次，水路还可以补一补。';
 case 'handoff':return maintenance(s)?'有人接手，也照着做法试过了。':'接手的人和做法，还可以接着商量。';
 case 'contract':return s.contract?({accept:'当时收下粮袋，也答应了签字条件。',refuse:'当时没有答应粮袋后的条件。',show:'当时决定把契书带给大家看。'})[s.contract]:'粮袋后的条件，还没作出选择。';
 case 'court':return s.negotiated?'大家已经共同确认了新的用水约定。':s.strategy==='bridge'?'你选了先带大家到广场的办法。':s.strategy==='speak'?'你选了把用水的事说清楚。':'先听听两边的话，再选一个办法。';
 case 'review':return s.reflection?'留下了一段想说的话。':'看看水路、接手安排和用水约定。';
 case 'ending':return s.currentEnding?'看过结尾，还能回去补上一笔。':'还没有留下结尾。';
 default:return '';
 }
}
