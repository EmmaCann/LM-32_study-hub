import test from 'node:test';
import assert from 'node:assert/strict';
import {memoryTrace,walkReads,buddyOf,experiments,freeBlocks,largestBlock,type MemoryMode} from '../src/simulations/aos-memory-model';
test('Tutte le configurazioni preservano frame, risorse e progresso',()=>{
 let count=0;
 for(const [mode,choices] of Object.entries(experiments))for(const [scenario]of choices){
  for(const amount of mode==='buddy'?[2,4,8]:mode==='latency'?[3,4,5,6,8,9,10,12]:[4])for(const writer of mode==='ksm'?['A','B','none']:['A']){
   const frames=memoryTrace(mode as MemoryMode,scenario,amount,writer);count++;
   for(const f of frames){assert.equal(new Set(f.positions).size,f.positions.length);assert(f.positions.every(p=>p>=0&&p<8));assert(!f.allocated.some(p=>f.positions.includes(p)));assert(f.guestFree>=0);assert(f.donated<=4);assert(f.useful<=3);}
   assert(frames.at(-1)?.result);
  }
 }
 assert.equal(count,49);
});
test('Shootdown: una lettura obsoleta non viene sanata dall’ACK tardivo',()=>{
 const good=memoryTrace('shootdown','wait'),bad=memoryTrace('shootdown','early');
 assert.equal(good[4].owner,'vecchio processo');assert.equal(bad[4].owner,'processo B');assert.equal(bad[4].ack,1);assert.equal(bad[4].remoteValid,true);
 assert(good.at(-1)?.ok);assert(!bad.at(-1)?.ok);assert.equal(bad.at(-1)?.ack,2);
});
test('Buddy: stessa quantita libera, esiti diversi con pagine non mobili',()=>{
 assert.equal(buddyOf(8,2),12);assert.equal(largestBlock([0,2,4,6]),1);assert.deepEqual(freeBlocks([0,1,2,3],2),[4]);
 assert(memoryTrace('buddy','fragmented',4).at(-1)?.ok);assert(!memoryTrace('buddy','pinned',4).at(-1)?.ok);assert(memoryTrace('buddy','pinned',2).at(-1)?.ok);assert(!memoryTrace('buddy','contiguous',8).at(-1)?.ok);
});
test('Walk: nativo, annidato, huge page asimmetrica e hit TLB',()=>{
 assert.equal(walkReads(4,4),24);assert.equal(walkReads(3,4),19);assert.equal(walkReads(3,3),15);
 for(const [scenario,reads]of [['native',4],['nested',24],['guestHuge',19],['bothHuge',15],['hit',0]]as const)assert.equal(memoryTrace('walk',scenario).at(-1)?.reads,reads);
});
test('Balloon: target limitato dalle pagine cedibili e deflazione distinta',()=>{
 const f=memoryTrace('balloon','6');assert.equal(f[4].donated,4);assert.equal(f[4].backing,4);assert(!f[4].ok);assert.equal(f.at(-1)?.guestFree,4);assert.equal(f.at(-1)?.donated,0);assert(!f.at(-1)?.ok);assert.match(f.at(-1)!.result,/4\/6 NON raggiunto/);
});
test('KSM: il contenuto dell’altro mapping resta invariato dopo COW',()=>{
 const a=memoryTrace('ksm','same',4,'A'),b=memoryTrace('ksm','same',4,'B'),none=memoryTrace('ksm','same',4,'none'),different=memoryTrace('ksm','different',4,'A');
 assert.equal(a[2].physical,1);assert.equal(a[5].bytesA,'ABC');assert.equal(a[6].bytesA,'XYZ');assert.equal(a[6].bytesB,'ABC');assert.equal(b[6].bytesA,'ABC');assert.equal(b[6].bytesB,'XYZ');assert.equal(none.at(-1)?.physical,1);assert.equal(different[2].physical,2);assert.equal(different.at(-1)?.bytesB,'DEF');
});
test('Deadline: il tempo di attesa non fa avanzare il lavoro utile',()=>{
 const cold=memoryTrace('latency','cold',5),pressure=memoryTrace('latency','pressure',6),prepared=memoryTrace('latency','prepared',3);
 assert(cold.at(-1)?.ok);assert(!pressure.at(-1)?.ok);assert(prepared.at(-1)?.ok);assert.equal(pressure.at(-1)?.useful,3);assert.equal(cold[2].useful,cold[1].useful);assert.equal(cold.at(-1)?.elapsed,5);assert.equal(pressure.at(-1)?.elapsed,9);
});
