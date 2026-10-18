import {wetCells} from './water.mjs';
export function reviewFrame(trial,count){
 const result=trial?.result,path=result?.trace||[],step=Math.max(0,Math.min(path.length,Number.isFinite(count)?Math.floor(count):0)),seen=path.slice(0,step),spot=seen.at(-1)??null;
 const lit=trial?wetCells(trial.grid,result).filter(i=>seen.includes(i)):[];
 const message=!trial?'先选一个猜想，再让水走一走。':!path.length?result.reason:step===0?'水在出水口。让它往前走一格，看看到了哪里。':step===path.length?result.reason:'水走到了第'+(Math.floor(spot/6)+1)+'行、第'+(spot%6+1)+'格。下一格，水槽口对上了吗？';
 return {path,step,seen,spot,lit,message};
}
export function cellObservation(trial,count,index){
 const f=reviewFrame(trial,count);
 if(!f.path.length)return '这次水还没进图。先看看提水的准备。';
 if(!f.step)return '还没开始回看。点“再走一格”，跟着水滴看看。';
 if(f.seen.includes(index))return f.lit.includes(index)?'这一格的水槽接到水了。':'水走到了这里，水槽口却没有接上。';
 return f.step===f.path.length?'这一回，水没有走到这里。':'回看到这里，还没看到水走到这一格。';
}
export function preparationTarget(trial){
 if(!trial||trial.result.trace.length)return null;
 if(trial.power==='rain')return 'power';
 if(trial.setup?.support===false)return 'support';
 if(trial.power==='water'&&trial.setup?.cleared===false)return 'cleared';
 if(trial.power==='people'&&trial.setup?.shifts===false)return 'shifts';
 return null;
}
