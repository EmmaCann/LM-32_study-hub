import {test} from 'node:test';
import assert from 'node:assert/strict';
import {addressTrace,decodeTrace,interruptTrace,timingTrace} from '../src/simulations/aos-extra-models';
test('ADD: campi contigui e registro destinazione distinguono le due parole',()=>{
 for(const [word,rd,rs1,rs2] of [[0x002080b3,1,1,2],[0x003101b3,3,2,3]]){
  const frames=decodeTrace(word);
  assert.deepEqual(frames.map(f=>f.values['Campo estratto']),[0x33,rd,0,rs1,rs2,0]);
  assert.equal(frames.length,6);
 }
});
test('MIPS modifica il carico virtuale, ARR il periodo timer; LED ha periodo doppio',()=>{
 for(const p of [50,100,200])for(const ms of [125,500,1000,4000]){
  const t=timingTrace(p,ms);
  assert.equal(t[1].values['Durata carico virtuale (ms)'],6000/p);
  assert.equal(t[2].values.ARR,ms*10-1);
  assert.equal(t[3].values['Ciclo LED virtuale (ms)'],2*ms);
  assert.equal(t.at(-1)!.values['Tempo host'],'non deducibile');
 }
});
test('Interrupt mascherato rimane pendente prima di eseguire handler; exit del modello',()=>{
 const trace=interruptTrace(true);
 assert.equal(trace[3].values['Interrupt virtuale pendente'],1);
 assert.equal(trace[3].values['Guest pronto ad accettarlo'],0);
 assert.equal(trace[4].values['Interrupt virtuale pendente'],1);
 for(const masked of [true,false])assert.equal(interruptTrace(masked).at(-1)!.values['VM exit del modello'],2);
});
test('CPU e DMA conservano domini distinti; slot esclude il limite superiore',()=>{
 assert.equal(addressTrace('cpu',true).at(-1)!.values.HPA,'0x9000');
 assert.equal(addressTrace('dma',true).at(-1)!.values.Esito,'HPA 0x9000');
 assert.equal(addressTrace('dma',false).at(-1)!.values.Esito,'accesso bloccato');
 assert.equal(addressTrace('slot',true).at(-1)!.values.Esito,'HVA 0x70001000');
 assert.equal(addressTrace('slot',false).at(-1)!.values.Esito,'nessuna RAM in questo slot');
});
