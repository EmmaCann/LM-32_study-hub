import {test} from 'node:test';
import assert from 'node:assert/strict';
import {lesson3Trace} from '../src/simulations/algoritmi-l03-model';
test('Partition conserves elements and places pivot between the two regions',()=>{
 for(const a of [[2,8,7,1,3,5,6,4],[3,3,3],[1,2],[2,1],[9,0,9,0]]){
  const m=lesson3Trace(a,'partition'),f=m.frames.at(-1)!,v=f.order.map(id=>m.items.find(x=>x.id===id)!.value),x=v[f.q];
  assert.deepEqual([...v].sort(),[...a].sort());assert(v.slice(0,f.q).every(v=>v<=x));assert(v.slice(f.q+1).every(v=>v>x));
 }
});
test('Counting writes every original identity exactly once, preserves input and sorted output',()=>{
 for(const a of [[2,5,3,0,2,3,0,3],[0,0],[9,0,9],[1,2,3]]){
  const m=lesson3Trace(a,'counting'),f=m.frames.at(-1)!;
  assert.deepEqual(f.order,m.items.map(x=>x.id));assert.equal(new Set(f.output).size,a.length);
  assert.deepEqual(f.output.map(id=>m.items.find(x=>x.id===id)!.value),[...a].sort((x,y)=>x-y));
 }
});
test('Shuffle selects only remaining suffix and fixes the prefix reproducibly',()=>{
 for(let seed=1;seed<=12;seed++){
  const a=[1,2,3,4,5],m=lesson3Trace(a,'shuffle',seed);let fixed:string[]=[];
  for(const f of m.frames){assert.deepEqual(f.order.slice(0,fixed.length),fixed);if(f.phase==='choose')assert(f.j>=f.i&&f.j<a.length);if(f.phase==='fixed')fixed=f.order.slice(0,f.i+1);}
  assert.deepEqual(m,lesson3Trace(a,'shuffle',seed));
 }
 assert.throws(()=>lesson3Trace([0,10],'counting'));
});
