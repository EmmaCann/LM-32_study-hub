import assert from 'node:assert/strict';
import {test} from 'node:test';
import {insertion,merge,parseInput} from '../src/simulations/algoritmi-sorting-models';
test('Insertion Sort conserves elements, settled invariants, stable identities and operation counts',()=>{
  for(const a of [[],[1],[5,2,4,6,1,3],[6,5,4,3,2,1],[1,2,3],[2,1,2,1],[-3,0,-8,9]]){
    const m=insertion(a);assert.deepEqual(m.result,[...a].sort((x,y)=>x-y));
    assert(m.frames.every(f=>f.invariant));
    for(const f of m.frames.filter(f=>f.settled))assert.deepEqual([...f.array!].sort((x,y)=>x-y),[...a].sort((x,y)=>x-y));
    const end=m.frames.at(-1)!,ids=m.items.slice().sort((x,y)=>end.pos[x.id].x-end.pos[y.id].x);
    for(let i=1;i<ids.length;i++)if(ids[i-1].value===ids[i].value)assert(Number(ids[i-1].origin)<Number(ids[i].origin));
  }
  assert.equal(insertion([6,5,4,3,2,1]).frames.at(-1)!.shifts,15);
  assert.equal(insertion([1,2,3,4,5,6]).frames.at(-1)!.comparisons,5);
});
test('Merge preserves a sorted output, unique identities, stable ties, empty parts and sentinel costs',()=>{
  for(const [l,r]of [[[],[]],[[],[1,2,2]],[[2,4,5,7],[1,2,3,6]],[[1,1],[1,1]],[[-2,0],[0,3]]]){
    const m=merge(l,r);assert.deepEqual(m.result,[...l,...r].sort((a,b)=>a-b));
    assert(m.frames.every(f=>f.invariant));assert.equal(new Set(m.identities).size,l.length+r.length);
    assert.equal(m.frames.at(-1)!.comparisons,l.length+r.length);
  }
  assert.deepEqual(merge([1,1],[1,1]).identities,['l0','l1','r0','r1']);
  assert.throws(()=>merge([3,1],[2]),/ordinate/);
});
test('Input validation rejects unsupported sizes, fractional, nonfinite and out-of-range values',()=>{
  assert.deepEqual(parseInput('-3, 2;2',5),[-3,2,2]);assert.deepEqual(parseInput('',5),[]);
  for(const x of ['1.5','NaN','Infinity','1000','1,2,3,4,5,6'])assert.throws(()=>parseInput(x,5));
});
