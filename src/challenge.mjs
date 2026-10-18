import {water,ports} from './water.mjs';
const copy=x=>structuredClone(x),eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),integer=x=>Number.isSafeInteger(x)&&x>=0,text=(x,max)=>typeof x==='string'&&x.length<=max;
const tile=t=>t===null||!!t&&['straight','bend'].includes(t.kind)&&integer(t.rotation)&&t.rotation<4;
const grid=g=>Array.isArray(g)&&g.length===24&&g.every(tile),family=(a,b)=>grid(a)&&grid(b)&&a.every((t,i)=>t?.kind===b[i]?.kind);
const cleanGrid=g=>g.map(t=>t?{kind:t.kind,rotation:t.rotation}:null);
const sameGrid=(a,b)=>grid(a)&&grid(b)&&eq(cleanGrid(a),cleanGrid(b));
const conditions=p=>['water','people'].includes(p.power)&&typeof p.bridge==='boolean';
export const evaluate=(p,g=p.grid)=>water({grid:g,power:p.power,bridge:p.bridge,support:true,cleared:true,shifts:true});
const changed=d=>d.grid.flatMap((t,i)=>eq(t,d.originalGrid[i])?[]:[i]);
const baseValid=p=>!!p&&conditions(p)&&grid(p.originalGrid)&&family(p.grid,p.originalGrid)&&integer(p.sourceNumber)&&p.sourceNumber>0&&text(p.title,40)&&text(p.note,240)&&evaluate(p,p.originalGrid).ok;
const playable=p=>baseValid(p)&&changed(p).length===1&&!evaluate(p).ok;
const identity=p=>'water-1-'+encodeURIComponent(JSON.stringify([p.number,p.sourceNumber,p.power,p.bridge,cleanGrid(p.originalGrid),cleanGrid(p.grid),p.title,p.note]));
export const validPuzzle=p=>!!p&&p.schema===1&&integer(p.number)&&p.number>0&&playable(p)&&p.id===identity(p);
export const emptyChallenge=()=>({draft:null,count:0,pages:[]});
export function startChallenge(s,number){const t=s.trials.find(t=>t.number===number);if(!t?.result.ok||!conditions(t)||!grid(t.grid)||!evaluate(t).ok)return s;return {...s,challenge:{...s.challenge,draft:{sourceNumber:number,originalGrid:copy(t.grid),grid:copy(t.grid),power:t.power,bridge:t.bridge,title:'把这条水路交给你',note:'',checkedGrid:null,result:null,sealedId:null}}};}
export function turnDraft(s,index){const d=s.challenge.draft;if(!d||d.sealedId||!d.grid[index])return s;const g=copy(d.originalGrid);g[index].rotation=(d.grid[index].rotation+1)%4;return {...s,challenge:{...s.challenge,draft:{...d,grid:g,checkedGrid:null,result:null}}};}
export function editDraft(s,patch){const d=s.challenge.draft;if(!d||d.sealedId)return s;return {...s,challenge:{...s.challenge,draft:{...d,...('title' in patch?{title:String(patch.title).slice(0,40)}:{}),...('note' in patch?{note:String(patch.note).slice(0,240)}:{})}}};}
export function checkDraft(s){const d=s.challenge.draft;if(!d||d.sealedId)return s;return {...s,challenge:{...s.challenge,draft:{...d,checkedGrid:copy(d.grid),result:evaluate(d)}}};}
export const canSeal=d=>!!d&&!d.sealedId&&playable(d)&&sameGrid(d.checkedGrid,d.grid)&&eq(d.result,evaluate(d));
export function sealChallenge(s){const c=s.challenge,d=c.draft;if(!canSeal(d))return s;const number=c.count+1;const puzzle={schema:1,number,sourceNumber:d.sourceNumber,originalGrid:copy(d.originalGrid),grid:copy(d.grid),power:d.power,bridge:d.bridge,title:d.title.trim()||'把这条水路交给你',note:d.note};puzzle.id=identity(puzzle);return {...s,challenge:{count:number,draft:{...d,sealedId:puzzle.id},pages:[...c.pages,{puzzle,replies:[],replyCount:0}].slice(-4)}};}
export const playerStart=p=>({grid:copy(p.grid),attempts:[],note:''});
export function playerTurn(r,index){if(!r.grid[index])return r;const g=copy(r.grid);g[index].rotation=(g[index].rotation+1)%4;return {...r,grid:g};}
export function playerTest(p,r){const result=evaluate(p,r.grid);return {...r,attempts:[...r.attempts,{grid:copy(r.grid),result}].slice(-6)};}
export function currentResult(r){const t=r.attempts.at(-1);return t&&sameGrid(t.grid,r.grid)?t.result:null;}
export const replyStatus=r=>currentResult(r)?.reason||(r.attempts.length?'图改过，还没试水。':'这张图还没试水。');
export function makeReply(p,r){return {kind:'maliang-water-reply',version:1,puzzleId:p.id,grid:cleanGrid(r.grid),attempts:r.attempts.map(t=>({grid:cleanGrid(t.grid),result:copy(t.result)})),note:r.note};}
export function parseReply(p,raw){if(typeof raw!=='string'||raw.length>131072)throw Error('这份回信太大了。请选从这道题里保存的回信。');let r;try{r=JSON.parse(raw)}catch{throw Error('没能读开这份回信。请重新选择保存好的回信文件。')}
 if(!r||r.kind!=='maliang-water-reply'||r.version!==1||r.puzzleId!==p.id)throw Error('这份回信属于另一道题。请找到对应的题目再打开。');
 if(!family(r.grid,p.grid)||!text(r.note,240)||!Array.isArray(r.attempts)||r.attempts.length>6||r.attempts.some(t=>!t||!family(t.grid,p.grid)||!eq(t.result,evaluate(p,t.grid))))throw Error('回信里的图或试水记录没有对上。请回到挑战里重新保存。');
 return makeReply(p,r);
}
export function receiveReply(s,id,reply){const page=s.challenge.pages.find(x=>x.puzzle.id===id);if(!page)return s;const r=parseReply(page.puzzle,JSON.stringify(reply));if(page.replies.some(x=>eq(x.reply,r)))return s;return {...s,challenge:{...s.challenge,pages:s.challenge.pages.map(x=>x!==page?x:{...x,replyCount:x.replyCount+1,replies:[...x.replies,{number:x.replyCount+1,reply:r}].slice(-6)})}};}
export function validChallenge(c){try{if(!c||!integer(c.count)||!Array.isArray(c.pages)||c.pages.length>4)return false;let last=0;for(const x of c.pages){if(!x||!validPuzzle(x.puzzle)||x.puzzle.number<=last||x.puzzle.number>c.count||!integer(x.replyCount)||!Array.isArray(x.replies)||x.replies.length>6)return false;last=x.puzzle.number;let prev=0;for(const r of x.replies){if(!r||!integer(r.number)||r.number<=prev||r.number>x.replyCount)return false;prev=r.number;parseReply(x.puzzle,JSON.stringify(r.reply));}}
 const d=c.draft;if(d===null)return true;if(!baseValid(d)||changed(d).length>1)return false;if(d.checkedGrid===null){if(d.result!==null)return false;}else if(!family(d.checkedGrid,d.originalGrid)||!eq(d.result,evaluate(d,d.checkedGrid)))return false;
 return d.sealedId===null||typeof d.sealedId==='string'&&c.pages.some(x=>x.puzzle.id===d.sealedId&&sameGrid(x.puzzle.grid,d.grid)&&sameGrid(x.puzzle.originalGrid,d.originalGrid));
 }catch{return false}}
export function challengeSources(s){return s.challenge.pages.flatMap(({puzzle:p,replies})=>[{id:'challenge-'+p.number,kind:'challenge',title:'第'+p.number+'道水路题',asset:null,grid:copy(p.grid),record:'我用第'+p.sourceNumber+'次试通的图出题，只转动一块，再试水：'+evaluate(p).reason+(p.note?' 我留的话：'+p.note:'')},...replies.map(({number,reply:r})=>({id:'challenge-'+p.number+'-reply-'+number,kind:'challenge',title:'第'+p.number+'道题的第'+number+'封回信',asset:null,grid:copy(r.grid),record:'这份回信里：'+replyStatus(r)+(r.note?' 留下的话：'+r.note:'')}))]);}

export {wetCells} from './water.mjs';
