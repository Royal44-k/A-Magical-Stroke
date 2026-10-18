import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,trial,readSaved,routeToGrid,BYPASS} from '../src/model.mjs';
import {guessLine,observedLine,validGuessSpot} from '../src/water-prediction.mjs';
import {snapshot,saveComparison,comparisonRecord,comparisonHtml} from '../src/comparison.mjs';
import {trialSource} from '../src/source-gallery.mjs';
import {makeFrame} from '../src/learning.mjs';

test('纸签只记在那次试水，旧记录照常可读',()=>{
 const s=fresh();s.support=true;s.cleared=true;s.grid[18]={kind:'straight',rotation:0};
 const first=trial(s,'会在半路停下',18);assert.equal(first.trials[0].guessSpot,18);
 assert.match(guessLine(first.trials[0]),/第4行、第1格/);
 assert.match(observedLine(first.trials[0]),/走到了这一格，水槽口却没接上/);
 const next=trial(first,'我还想先看看');assert.equal(next.trials[1].guessSpot,undefined);
 assert.ok(readSaved(JSON.stringify(next)));
 assert.ok(readSaved(JSON.stringify(first)));
 first.grid[18]=null;assert.deepEqual(first.trials[0].grid[18],{kind:'straight',rotation:0});
});
test('水没进图、走不到纸签、走通后，观察用语各不相同',()=>{
 const blocked=trial(fresh(),'先看看','before-board').trials[0];assert.match(observedLine(blocked),/还没有走进/);
 const s=fresh();s.support=true;s.cleared=true;s.bridge=true;s.grid=routeToGrid(BYPASS);
 const reached=trial(s,'能到田边',5).trials[0];assert.match(observedLine(reached),/走到了这一格，水槽口也接上/);
 const missed=trial(s,'能到田边',23).trials[0];assert.match(observedLine(missed),/没有走到这一格/);
 const notBlocked=trial(s,'能到田边','before-board').trials[0];assert.match(observedLine(notBlocked),/已经走进/);
});
test('纸签位置限制为图上24格或图外，旧记录不受影响',()=>{
 for(const spot of [null,undefined,'before-board',0,23])assert.ok(validGuessSpot(spot));
 for(const spot of [-1,24,1.5,'18',{},'wrong'])assert.ok(!validGuessSpot(spot));
 const s=trial(fresh(),'先看看',18);s.trials[0].guessSpot=24;assert.equal(readSaved(JSON.stringify(s)),null);
});

test('旧猜想进入比较、画廊和三格时仍指向那次水迹',()=>{
 let s=fresh();s.support=true;s.cleared=true;s.grid[18]={kind:'straight',rotation:0};s=trial(s,'会在半路停下',18);const first=s.trials[0];assert.equal(snapshot(first).guessSpot,18);
 const source=trialSource(first);assert.match(source.record,/水槽口却没接上/);assert.match(source.trialDetail.guess,/第4行、第1格/);const frame=makeFrame(source);assert.match(frame.record,/水槽口却没接上/);
 s.grid[18]={kind:'bend',rotation:0};s=trial(s,'我还想先看看');s.comparison.draft={a:1,b:2,marks:[],note:'',question:''};s=saveComparison(s,1,2);const page=s.comparison.pages[0];assert.equal(page.a.guessSpot,18);assert.match(comparisonRecord(page),/水槽口却没接上/);assert.match(comparisonHtml(page),/第4行、第1格/);assert.ok(readSaved(JSON.stringify(s)));
});
