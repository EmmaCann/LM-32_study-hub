import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpuTrace, flagsTrace, queueTrace, kvmTrace } from '../src/simulations/aos-models';
test('POPF: difetto isolato e ripristino mediato; IF fisico indipendente', () => {
  for (const corrected of [false,true]) {
    const frames=flagsTrace(corrected);
    assert.ok(frames.every(f => f.values['IF fisico host'] === 1));
    assert.equal(frames[2].values['IF virtuale guest'],0);
    assert.equal(frames.at(-1)!.values['IF virtuale guest'], corrected ? 1 : 0);
    assert.equal(frames.at(-1)!.values['IF atteso guest'],1);
  }
});
test('RISC-V: stesso stato finale per tre motori e tutti gli input; PC e x0', () => {
  for(let n=1;n<=8;n++) for(const mode of ['interpretazione','cache','chaining'] as const) {
    const trace=cpuTrace(n,mode), end=trace.at(-1)!.values;
    assert.equal(end.x1,n*(n+1)/2); assert.equal(end.x2,0);
    assert.equal(end['Istruzioni guest'],3*n+2);
    assert.ok(trace.every(f => f.values.x0 === 0));
    assert.deepEqual(trace.slice(1,5).map(f=>f.values['PC guest (byte)']),[4,8,12,n>1 ? 4 : 16]);
    assert.equal(end['Decodifiche guest'],mode === 'interpretazione' ? 3*n+2 : 5);
    assert.equal(end['Blocchi tradotti'],mode === 'interpretazione' ? 0 : 3);
    assert.equal(end['Ricerche dispatcher'],mode === 'interpretazione' ? 0 : mode === 'cache' ? n+2 : Math.min(n+2,4));
    assert.equal(end['Salti concatenati'],mode === 'chaining' ? Math.max(0,n-2) : 0);
  }
  assert.throws(()=>cpuTrace(0,'cache'));
});
test('Virtqueue: visibilità, completamenti e recupero rispettano ordine; ultimo batch parziale',()=>{
  for(const total of [1,5,8]) for(let batch=1;batch<=total;batch++) {
    const trace=queueTrace(total,batch);
    for(const f of trace) {
      const v=f.values;
      assert.ok(v['Buffer recuperati'] <= v['Completate (used)']);
      assert.ok(v['Completate (used)'] <= v['Pubblicate (avail)']);
      assert.ok(Number(v['Pubblicate (avail)']) <= total);
    }
    const end=trace.at(-1)!.values;
    assert.equal(end['Buffer recuperati'],total);
    assert.equal(end['Kick guest → backend'],Math.ceil(total/batch));
    assert.equal(end['Notifiche backend → guest'],Math.ceil(total/batch));
  }
});
test('KVM_RUN: due exit hardware non impongono due ritorni userspace',()=>{
  const kernel=kvmTrace(false).at(-1)!.values, user=kvmTrace(true).at(-1)!.values;
  assert.equal(kernel['VM exit hardware'],2); assert.equal(kernel['Ritorni a userspace'],0); assert.equal(kernel['Invocazioni KVM_RUN'],1);
  assert.equal(user['VM exit hardware'],2); assert.equal(user['Ritorni a userspace'],1); assert.equal(user['Invocazioni KVM_RUN'],2);
});
