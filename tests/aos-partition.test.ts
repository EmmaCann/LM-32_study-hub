import {test} from 'node:test';import assert from 'node:assert/strict';
import {partitionTrace,ivshmemTrace,ringStates,cacheStates} from '../src/simulations/aos-partition-models';
test('assegnazione esclusiva dei core e fault senza sottrarre il core cluster',()=>{
 for(const f of partitionTrace(true)){const ids=[f.values.Root,f.values.Cluster,f.values.IVI].flatMap(v=>String(v).split(',')).filter(v=>v!=='—');assert.equal(ids.length,4);assert.equal(new Set(ids).size,4);}
 assert.equal(partitionTrace(true)[7].values['Core cluster in esecuzione'],'sì');assert.equal(partitionTrace(true)[7].values['Accesso IVI'],'negato');
});
test('payload pubblicato prima del consumo per polling e doorbell',()=>{
 for(const mode of [true,false]){const t=ivshmemTrace(mode);assert.equal(t[1].values.Pubblicato,'no');assert.equal(t[2].values.Pubblicato,'sì');assert.equal(t[5].values['B legge'],'sì');}
});
test('ring: il produttore non cambia rd, il lettore rileva perdite e si riallinea',()=>{
 for(const n of [4,8]){const t=ringStates(n,true);for(let i=1;i<t.length;i++){if(t[i].action==='pubblica')assert.equal(t[i].r,t[i-1].r);assert.ok(t[i].r<=t[i].w);}
 const last=t.at(-1)!;assert.equal(last.lost,10-n);assert.equal(last.read,12-n);assert.deepEqual(t[10].slots.map(v=>v).sort((a,b)=>a-b),Array.from({length:n},(_,i)=>11-n+i));}
 assert.equal(ringStates(8,false).at(-1)!.lost,0);
});
test('colori disgiunti evitano le espulsioni incrociate nel modello',()=>{
 const shared=cacheStates(false),split=cacheStates(true);
 assert.equal(shared[3].evicted,'C0');assert.equal(shared[4].evicted,'C1');assert.equal(shared[5].criticalHit,false);
 assert.equal(split[3].evicted,null);assert.equal(split[5].criticalHit,true);assert.equal(split[6].criticalHit,true);
});
