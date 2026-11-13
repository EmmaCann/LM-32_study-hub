import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PIT_HZ,PIT_MOD,pitDelta,pitCounter,loaderTrace,pitTrace,gapTrace,gapTime} from '../src/simulations/aos-baremetal-models';
test('PIT: differenza modulare, riavvolgimento e perdita di un giro',()=>{
 assert.equal(pitDelta(10,65530),16);
 for(const ticks of [0,1,16,65535,65536,95500]) assert.equal(pitDelta(pitCounter(0),pitCounter(ticks)),ticks%PIT_MOD);
 assert.ok(Math.abs(PIT_MOD/PIT_HZ*1000-54.9254)<.001);
});
test('loader: nessuna esecuzione prima di copia, azzeramento e stato iniziale',()=>{
 const t=loaderTrace();assert.equal(t[5].values.CPU,'non avviata');assert.equal(t[6].values.CPU,'_start');
 assert.equal(t[6].values['.bss azzerata'],'sì');assert.equal(t[7].values.CPU,'firmware_main()');
});
test('lettura PIT: tre accessi e byte coerenti; gestori distinti',()=>{
 for(const mode of ['kvm','tcg'] as const){const t=pitTrace(mode);assert.equal(t[3].values['Accessi porte completati'],3);assert.equal(t[3].values['Byte basso'],'0xEF');assert.equal(t[3].values['Byte alto'],'0xBE');assert.equal(t[5].values['Differenza tick'],16);}
 assert.notEqual(pitTrace('kvm')[3].values.Gestore,pitTrace('tcg')[3].values.Gestore);
});
test('host avanza senza campioni; la pausa lunga rende ambiguo il tempo PIT',()=>{
 for(const pause of [25,80]){const t=gapTrace(pause);assert.equal(t[3].values.Letture,4);assert.equal(t[7].values.Letture,4);assert.ok(gapTime(7,pause)>gapTime(3,pause));assert.equal(t[8].values.Letture,5);assert.equal(t[8].values['Gap reale al rientro (ms)'],pause+1);}
 assert.ok(Number(gapTrace(25)[8].values['Gap ricostruito dal PIT (ms)'])>25.9);
 assert.ok(Number(gapTrace(80)[8].values['Gap ricostruito dal PIT (ms)'])<27);
});
