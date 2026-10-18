export function ports(tile){if(!tile)return [];return (tile.kind==='straight'?[0,2]:[0,1]).map(x=>(x+tile.rotation)%4);}
export function water(s){
 const blocked=reason=>({ok:false,trace:[],arrived:false,reason});
 if(s.power==='rain')return blocked('今天没有雨。接雨桶先留着，再想个眼前能提水的办法。');
 if(!s.support)return blocked('提水架还没站稳。请鲁伯把支架装好。');
 if(s.power==='water'&&!s.cleared)return blocked('渠口的树枝挡住了水。请鲁伯和大人一起清理。');
 if(s.power==='people'&&!s.shifts)return blocked('一个人会累。请两位大人轮换提水。');
 const trace=[],g=s.grid;let index=18,entry=3;
 for(let count=0;count<25;count++){
  if(trace.includes(index))return {ok:false,trace,arrived:false,reason:'水绕了一圈，又回来了。试着给它接一条出路。'};
  trace.push(index);const sides=ports(g[index]);
  if(!sides.includes(entry))return {ok:false,trace,arrived:false,reason:'水走到第'+(Math.floor(index/6)+1)+'行、第'+(index%6+1)+'格，水槽口没有对上。'};
  const out=sides.find(x=>x!==entry);
  if(index===5&&out===0)break;
  const row=Math.floor(index/6),col=index%6;
  const nr=row+[-1,0,1,0][out],nc=col+[0,1,0,-1][out];
  if(nr<0||nr>3||nc<0||nc>5)return {ok:false,trace,arrived:false,reason:'水从图纸边上流走了。田在右上角，把水引到那里。'};
  index=nr*6+nc;entry=(out+2)%4;
 }
 if(index!==5)return {ok:false,trace,arrived:false,reason:'水还没有到田边，再看看连接处。'};
 if(g[15]&&!s.bridge)return {ok:false,trace,arrived:true,reason:'水能过去，门前的路却被挡住了。绕开这里，或加一块桥板。'};
 return {ok:true,trace,arrived:true,reason:'水到了田边，门前也能走了！'};
}

export function wetCells(g,result){return (result?.trace||[]).filter((i,n,a)=>{const previous=a[n-1],entry=n===0?3:previous===i-6?0:previous===i+1?1:previous===i+6?2:3;return ports(g[i]).includes(entry)})}
