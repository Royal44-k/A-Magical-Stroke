import{validSpeech,validSpeechArt,hasSpeech}from'./speech.mjs';
import {validCardHandoff,validHandoffArt} from './handoff-card.mjs';
import {emptyNavigation,restoreNavigation} from './navigation-state.mjs';
import {emptyEndingLab,validEndingLab,conditionsEnding} from './ending-lab.mjs';
import {emptyReadingHelp,validReadingHelp} from './reading-help.mjs';
import {emptyContractRead,validContractRead,validContractArt} from './contract-reading.mjs';
import {emptyRainStudio,validRain,restoreRain,validRainArt} from './rain.mjs';
import {emptyComparison,validComparison,validComparisonArt,validTrialSetup} from './comparison.mjs';
import {validDialogue} from './dialogue.mjs';
import {emptyChallenge,validChallenge} from './challenge.mjs';
import {ports,water} from './water.mjs';
import {validGuessSpot} from './water-prediction.mjs';
export {ports,water} from './water.mjs';
import {emptyCare,validCare,validCareArt} from './care.mjs';
import {emptyRiver,validRiver,validRiverArt} from './river.mjs';
export {OBSERVATIONS} from './river-data.mjs';
import {emptyBridgeStudio,validBridgeStudio,validBridgeArt,bridgePassed} from './paper-bridge.mjs';
import {emptyLibrary,validLibrary,validLibraryArt} from './library.mjs';
import {emptyCouncil,validCouncil,councilReady,ratifyCouncil} from './council.mjs';
import {emptyStudio,validStudio,validGiftArt} from './gifts.mjs';
export const KEY='maliang-qihuan-v1';
export const STAGES=['home','rain','gift','observe','workshop','handoff','contract','court','review','ending'];
export const TITLES={home:'神笔马良：奇幻一笔',rain:'雨夜，笔尖亮了',gift:'第一笔，画给谁',observe:'先听听大家的话',workshop:'给水找一条路',handoff:'你不在时，谁接着来',contract:'粮袋后面，还有一句话',court:'画中海，门外的路',review:'再看一眼，补上一笔',ending:'画里的故事，还在继续'};
export const GIFTS={roof:'补好屋顶',bucket:'修好木桶',board:'共用画板'};
export const PEOPLE=['鲁伯','周婶','陈叔'];
export function fresh(){return {schema:1,navigation:emptyNavigation(),stage:'home',visited:['home'],rain:{links:[],tested:false,studio:emptyRainStudio()},gift:null,giftReason:'',giftStudio:emptyStudio(),river:emptyRiver(),care:emptyCare(),challenge:emptyChallenge(),comparison:emptyComparison(),seen:{},grid:Array(24).fill(null),power:'water',cleared:false,support:false,shifts:false,bridge:false,revision:0,trials:[],drawing:[],handoff:{lead:'',backup:'',steps:[],tested:false},contract:null,contractRead:emptyContractRead(),readingHelp:emptyReadingHelp(),endingLab:emptyEndingLab(),exclusive:false,strategy:null,evidence:[],bridgePlan:{landing:'',support:false,order:[],tested:false,studio:emptyBridgeStudio()},negotiated:false,council:emptyCouncil(),library:emptyLibrary(),carried:{water:false,handoff:false,exclusive:false},repairedLater:false,firstEnding:null,currentEnding:null,reflection:'',reduced:false,bookNote:'',storybook:{title:'我的奇幻一笔',frames:[],note:''}};}
export function readSaved(raw){try{
 const v=JSON.parse(raw);if(!v||v.schema!==1)return null;const s={...fresh(),...v};
 const one=(x,list)=>list.includes(x),arr=(x,check,max=10000)=>Array.isArray(x)&&x.length<=max&&x.every(check),str=x=>typeof x==='string',bool=x=>typeof x==='boolean',num=x=>Number.isInteger(x)&&x>=0;
 const tile=x=>x===null||(x&&one(x.kind,['straight','bend'])&&num(x.rotation)&&x.rotation<4),grid=x=>Array.isArray(x)&&x.length===24&&x.every(tile);
 if(!one(s.stage,STAGES)||!arr(s.visited,x=>one(x,STAGES),10)||!grid(s.grid)||!num(s.revision))return null;
 s.navigation=restoreNavigation(s.navigation,s.visited,s.stage);
 if(!validRain(s.rain))return null;s.rain=restoreRain(s.rain);
 if(!one(s.gift,[null,'roof','bucket','board'])||!one(s.power,['water','people','rain'])||!one(s.contract,[null,'accept','refuse','show'])||!one(s.strategy,[null,'speak','bridge']))return null;
 if(!one(s.firstEnding,[null,'E1','E2','E3','E4'])||!one(s.currentEnding,[null,'E1','E2','E3','E4']))return null;
 if(!['giftReason','reflection','bookNote'].every(k=>str(s[k]))||!['cleared','support','shifts','bridge','exclusive','negotiated','repairedLater','reduced'].every(k=>bool(s[k])))return null;
 if(!s.seen||Array.isArray(s.seen)||Object.entries(s.seen).some(([k,v])=>!one(k,['inlet','field','door'])||!arr(v,i=>one(i,[0,1]),2)))return null;
 if(!arr(s.evidence,x=>one(x,['fact','needs','plan']),3))return null;
 const h=s.handoff,b=s.bridgePlan;if(!h||!one(h.lead,['',...PEOPLE])||!one(h.backup,['',...PEOPLE])||!arr(h.steps,x=>one(x,['check','open','close']),3)||!bool(h.tested))return null;
 if(!b||!one(b.landing,['','square','store','water'])||!bool(b.support)||!bool(b.tested)||!arr(b.order,x=>one(x,['adult','children','rest']),3))return null;
 if(!validCardHandoff(h))return null;
 if(!validBridgeStudio(b))return null;
 if(!s.carried||!['water','handoff','exclusive'].every(k=>bool(s.carried[k])))return null;
 if(!arr(s.trials,t=>t&&num(t.revision)&&num(t.number)&&str(t.prediction)&&grid(t.grid)&&one(t.power,['water','people','rain'])&&bool(t.bridge)&&t.result&&bool(t.result.ok)&&str(t.result.reason)&&arr(t.result.trace,i=>num(i)&&i<24,25)&&validGuessSpot(t.guessSpot)&&validTrialSetup(t)))return null;
 if(!arr(s.drawing,stroke=>arr(stroke,p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite),702),100))return null;

 if(h.run!==undefined&&h.run!==null){const r=h.run;if(!['checked','flowing','stopped','packed'].every(k=>bool(r[k]))||!str(r.feedback)||!arr(r.moves,x=>one(x,['inspect','pump','stop','pack']),40))return null;}
 if(!validRiver(s.river,s.seen,s.trials)||!validCare(s.care))return null;
 if(!validChallenge(s.challenge)||!validComparison(s.comparison,s.trials))return null;
 if(!validLibrary(s.library))return null;
 if(!validCouncil(s.council)||!validSpeech(s.speech,s.trials))return null;
 if(!validStudio(s.giftStudio))return null;
 if(v.contractRead===undefined)s.contractRead={...emptyContractRead(),open:!!s.contract};if(!validContractRead(s.contractRead))return null;
 if(!validReadingHelp(s.readingHelp))return null;
 if(!validEndingLab(s.endingLab))return null;
 const book=s.storybook;
 if(!book||!str(book.title)||book.title.length>40||!str(book.note)||book.note.length>240||!arr(book.frames,f=>f&&str(f.sourceId)&&str(f.title)&&str(f.record)&&str(f.caption)&&f.caption.length<=160&&(f.asset===null||typeof f.asset==='string'&&/^\/assets\/[a-z0-9-]+\.png$/.test(f.asset))&&(f.grid===null||grid(f.grid))&&validSpeechArt(f.speechArt)&&validHandoffArt(f.handoffArt)&&validGiftArt(f.giftArt)&&validLibraryArt(f.libraryArt)&&validBridgeArt(f.bridgeArt)&&validRiverArt(f.riverArt)&&validCareArt(f.careArt)&&validDialogue(f.dialogue,f)&&validComparisonArt(f.comparisonArt)&&validRainArt(f.rainArt)&&validContractArt(f.contractArt),3))return null;
 return s;
 }catch{return null;}}
export function functional(s){const t=s.trials.at(-1);return !!t&&t.revision===s.revision&&t.result.ok&&water(s).ok;}
export function maintenance(s){const h=s.handoff;return PEOPLE.includes(h.lead)&&PEOPLE.includes(h.backup)&&h.lead!==h.backup&&h.steps.join(',')==='check,open,close'&&h.tested&&(!h.run||h.run.packed);}
export function endingFacts(s){return {water:functional(s),handoff:maintenance(s),access:!s.exclusive,repaired:s.repairedLater};}
export function ending(s){return conditionsEnding(endingFacts(s));}
export {ENDINGS} from './ending-lab.mjs';
export function visit(s,stage){const n=structuredClone(s);
 if(s.stage==='workshop'&&stage!=='workshop'&&!functional(s))n.carried.water=true;
 if(s.stage==='handoff'&&stage!=='handoff'&&!maintenance(s))n.carried.handoff=true;
 n.stage=stage;if(!n.visited.includes(stage))n.visited.push(stage);return n;
}
export function revise(s,patch){return {...s,...patch,revision:s.revision+1};}
export function trial(s,prediction,guessSpot){const result=water(s),n=structuredClone(s);
 n.trials.push({revision:s.revision,prediction,...(validGuessSpot(guessSpot)&&guessSpot!==null&&guessSpot!==undefined?{guessSpot}:{}),grid:structuredClone(s.grid),power:s.power,bridge:s.bridge,setup:{support:s.support,cleared:s.cleared,shifts:s.shifts},result,number:s.trials.length+1});
 if(result.ok&&s.carried.water)n.repairedLater=true;
 return n;
}
export function testHandoff(s){const n=structuredClone(s),h=n.handoff;
 h.tested=PEOPLE.includes(h.lead)&&PEOPLE.includes(h.backup)&&h.lead!==h.backup&&h.steps.join(',')==='check,open,close'&&(!h.run||h.run.packed);
 if(h.tested&&s.carried.handoff)n.repairedLater=true;return n;
}
export function sign(s,choice){const n={...s,contract:choice,contractRead:{...s.contractRead,open:true,draft:choice},exclusive:choice==='accept',negotiated:false,council:{...s.council,begun:false,ratified:null,run:null,revision:s.council.revision+1}};if(n.exclusive)n.carried={...s.carried,exclusive:true};return n;}
export function negotiate(s){if(!(hasSpeech(s)||['fact','needs','plan'].every(x=>s.evidence.includes(x)))||!councilReady(s.council))return s;
 return {...s,council:ratifyCouncil(s.council),exclusive:false,negotiated:true,repairedLater:s.repairedLater||s.carried.exclusive};}
export function finish(s){const id=ending(s);return {...visit(s,'ending'),currentEnding:id,firstEnding:s.firstEnding||id};}
export function bridgeReady(s){const b=s.bridgePlan;if(b.studio)return bridgePassed(b);return b.landing==='square'&&b.support&&b.order.join(',')==='adult,children,rest';}
export function needs(s){return [...(!functional(s)?[{stage:'workshop',text:!s.trials.length?'让水走到田边':s.trials.at(-1).revision!==s.revision?'水路改过了，再试一试':'看看刚才的试水，再补一补'}]:[]),...(!maintenance(s)?[{stage:'handoff',text:'补齐接手的人和做法'}]:[]),...(s.exclusive?[{stage:'court',text:'把用水的约定谈清楚'}]:[])];}
export function routeToGrid(route){const grid=Array(24).fill(null);
 for(let i=0;i<route.length;i++){const [r,c]=route[i];const [pr,pc]=route[i-1]||[r,c-1], [nr,nc]=route[i+1]||[r-1,c];const dir=(rr,cc)=>rr<r?0:cc>c?1:rr>r?2:3;const sides=[dir(pr,pc),dir(nr,nc)].sort().join(',');
 for(const kind of ['straight','bend'])for(let rotation=0;rotation<4;rotation++){const t={kind,rotation};if(ports(t).sort().join(',')===sides)grid[r*6+c]=t;}
 }return grid;}
export const BYPASS=[[3,0],[2,0],[1,0],[1,1],[1,2],[1,3],[1,4],[1,5],[0,5]];
export const CROSS=[[3,0],[3,1],[3,2],[2,2],[2,3],[2,4],[2,5],[1,5],[0,5]];
