import {test} from 'node:test';
import assert from 'node:assert/strict';
import {brakeDecision,carDefault,carResult,carTrace,carModes} from '../src/simulations/aos-car-model';
test('Decisioni e confini della legge di frenata',()=>{
 const {stop}=brakeDecision(75,60,50);assert(Math.abs(stop-41.41865)<.001);
 assert.equal(brakeDecision(75,stop,200).state,'WARNING');
 assert.equal(brakeDecision(75,2*stop,200).state,'OK');
 assert.equal(brakeDecision(130,3,201).state,'FAIL-SAFE');
 assert.equal(brakeDecision(130,3,50).state,'BRAKE');
 assert.throws(()=>brakeDecision(-1,3,0),RangeError);
});
test('Sorgente, vista filesystem e dipendenze danno esiti diversi',()=>{
 assert.match(carResult('network',carDefault),/RIFIUTATO/);
 assert.match(carResult('network',{...carDefault,isolated:false}),/BRAKE/);
 assert.match(carResult('network',{...carDefault,fake:false}),/WARNING/);
 assert.match(carResult('replacement',carDefault),/ORIGINALE/);
 assert.match(carResult('replacement',{...carDefault,isolated:false}),/SOSTITUITO/);
 assert.match(carResult('bootstrap',{...carDefault,joinBeforeRoot:false}),/ERRORE/);
 assert.match(carResult('bootstrap',{...carDefault,joinBeforeUnshare:false}),/VISTA ERRATA/);
});
test('Quota e attesa sono parametri separati, non una misura dello scheduler',()=>{
 assert.match(carResult('budget',{...carDefault,wait:4}),/entro deadline/);
 assert.match(carResult('budget',{...carDefault,wait:5}),/DEADLINE MISS/);
 for(const mode of Object.keys(carModes) as (keyof typeof carModes)[])for(const isolated of [false,true])for(const fake of [false,true]){
  const frames=carTrace(mode,{...carDefault,isolated,fake});assert.equal(frames.length,6);assert(frames.at(-1)?.values.Esito);
 }
 assert.throws(()=>carTrace('budget',{...carDefault,quota:0}),RangeError);
});
