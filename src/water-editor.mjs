import{ports}from'./water.mjs';
export const cellName=i=>'第'+(Math.floor(i/6)+1)+'行第'+(i%6+1)+'格';
export const pieceName=t=>t?.kind==='bend'?'弯水槽':'直水槽';
export const openings=t=>t?'两个口'+ports(t).map(d=>'朝'+['上','右','下','左'][d]).join('、'):'这里还是空的';
export const editorStart=()=>({tool:'straight',rotation:1,cell:null,moving:null,undo:[],redo:[],message:''});
const valid=i=>Number.isInteger(i)&&i>=0&&i<24;
export function neighbour(i,key){const row=Math.floor(i/6),col=i%6;return({ArrowRight:col<5?i+1:i,ArrowLeft:col>0?i-1:i,ArrowUp:row>0?i-6:i,ArrowDown:row<3?i+6:i})[key]??i;}
export function editWater(grid,previous,action){
 let e={...previous},g=grid;const reply=message=>({grid:g,editor:{...e,message},changed:false});
 const commit=(next,message,cell=e.cell)=>{if(JSON.stringify(next)===JSON.stringify(grid))return reply('这块水槽没有变。可以转一转，也可以再看看。');return{grid:next,editor:{...e,cell,moving:null,undo:[...e.undo,{grid:structuredClone(grid),cell:e.cell}].slice(-30),redo:[],message},changed:true};};
 const i=action.i,t=valid(e.cell)?grid[e.cell]:null;
 switch(action.type){
 case'inspect':if(!valid(i))return reply('请选图里的格子。');e.cell=i;e.moving=null;return reply('回到'+cellName(i)+'了。'+(grid[i]?openings(grid[i])+'。':'这里是空格，可以先想想放哪一块。')); 
 case'tool':if(!['straight','bend','erase'].includes(action.kind))return reply(e.message);return{grid,editor:{...e,tool:action.kind,moving:null,message:action.kind==='erase'?'点图上的一块水槽，把它拿走。':'手里换成了'+pieceName({kind:action.kind})+'。点空格放下；点已有的水槽只是看看。'},changed:false};
 case'turn-hand':return{grid,editor:{...e,rotation:(e.rotation+1)%4,message:'手里的水槽转过来了。'},changed:false};
 case'copy':if(!t)return reply('先选图上的一块水槽。');return{grid,editor:{...e,tool:t.kind,rotation:t.rotation,moving:null,message:'照着这一块，又拿好了一块。找个空格放下吧。'},changed:false};
 case'start-move':if(!t)return reply('先选图上的一块水槽。');return{grid,editor:{...e,moving:e.cell,message:'要挪'+cellName(e.cell)+'的水槽。点一个空格，把它放下。'},changed:false};
 case'cancel-move':return{grid,editor:{...e,moving:null,message:'先不挪了。水槽还在原处。'},changed:false};
 case'undo':case'redo':{const key=action.type,other=key==='undo'?'redo':'undo',entry=e[key].at(-1);if(!entry)return reply('这一步还不能'+(key==='undo'?'撤回':'重做')+'。');return{grid:structuredClone(entry.grid),editor:{...e,cell:entry.cell,moving:null,[key]:e[key].slice(0,-1),[other]:[...e[other],{grid:structuredClone(grid),cell:e.cell}].slice(-30),message:(key==='undo'?'刚才的一步撤回了。':'刚才的一步重做了。')+'再试水，看看现在的图。'},changed:true};}
 case'tap':
  if(!valid(i))return reply('请选图里的格子。');
  if(e.moving!==null)return editWater(grid,e,{type:'move',from:e.moving,i});
  e.cell=i;
  if(e.tool==='erase'){if(!grid[i])return reply('这里是空格，没有水槽要拿走。');g=structuredClone(grid);g[i]=null;return commit(g,cellName(i)+'的水槽拿走了。');}
  if(grid[i])return reply('选中了'+cellName(i)+'的'+pieceName(grid[i])+'。'+openings(grid[i])+'。');
  g=structuredClone(grid);g[i]={kind:e.tool,rotation:e.rotation};return commit(g,'水槽放好了。'+openings(g[i])+'。',i);
 case'move':{const from=action.from;if(!valid(from)||!valid(i)||!grid[from])return reply('请把水槽放进图里的空格。');if(from===i)return reply('水槽还在原处。可以另选一个空格。');if(grid[i])return reply('这里已经有一块水槽。换个空格放吧。');g=structuredClone(grid);g[i]=g[from];g[from]=null;return commit(g,'从'+cellName(from)+'挪到了'+cellName(i)+'。两个口的朝向没有变。',i);}
 case'drop-piece':if(!valid(i)||!['straight','bend'].includes(action.kind))return reply('请把水槽放进图里的格子。');g=structuredClone(grid);g[i]={kind:action.kind,rotation:Number.isInteger(action.rotation)?((action.rotation%4)+4)%4:e.rotation};return commit(g,cellName(i)+'放好了。'+openings(g[i])+'。',i);
 case'turn':case'replace':case'remove':if(!t)return reply('先选图上的一块水槽。');g=structuredClone(grid);if(action.type==='turn')g[e.cell].rotation=(t.rotation+1)%4;else if(action.type==='remove')g[e.cell]=null;else{if(e.tool==='erase')return reply('先从盒里挑一块水槽。');g[e.cell]={kind:e.tool,rotation:e.rotation};}return commit(g,action.type==='turn'?'这一块转过来了。'+openings(g[e.cell])+'。':action.type==='remove'?'这一块拿走了。':'这一格换好了。再试水，看看有什么不同。');
 default:return reply(e.message);
 }
}
