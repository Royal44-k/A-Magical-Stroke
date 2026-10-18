import {wetCells} from './water.mjs';

export const validGuessSpot=spot=>spot===undefined||spot===null||spot==='before-board'||Number.isInteger(spot)&&spot>=0&&spot<24;
export const spotName=spot=>spot==='before-board'?'水还进不了图上的格子':Number.isInteger(spot)&&spot>=0&&spot<24?'第'+(Math.floor(spot/6)+1)+'行、第'+(spot%6+1)+'格':'';
export const guessLine=trial=>trial.guessSpot===undefined||trial.guessSpot===null?'':trial.guessSpot==='before-board'?'我在图上猜：水还进不了图上的格子。':'我在图上猜：水会走到'+spotName(trial.guessSpot)+'。';
export function observedLine(trial){
 if(trial.guessSpot===undefined||trial.guessSpot===null)return '';
 const trace=trial.result.trace;
 if(trial.guessSpot==='before-board')return trace.length?'试水时看到：水已经走进图上的格子。':'试水时看到：水还没有走进图上的格子。';
 if(!trace.includes(trial.guessSpot))return '试水时看到：水没有走到这一格。';
 return wetCells(trial.grid,trial.result).includes(trial.guessSpot)?'试水时看到：水走到了这一格，水槽口也接上了。':'试水时看到：水走到了这一格，水槽口却没接上。';
}
export const guessRecord=trial=>[guessLine(trial),observedLine(trial)].filter(Boolean).join(' ');
