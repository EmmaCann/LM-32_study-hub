import test from 'node:test';
import assert from 'node:assert/strict';
import {memoryTrace,walkReads,buddyOf} from '../src/simulations/aos-memory-model';
test('Walk: distingue letture di traduzione e accesso al dato',()=>{assert.equal(walkReads(4,4),24);assert.equal(walkReads(3,3),15);assert.equal(walkReads(4,0),4);assert.equal(memoryTrace('walk',false).at(-1)?.values['Con dato'],25);});
test('Buddy e shootdown conservano i vincoli di riuso',()=>{assert.equal(buddyOf(8,2),12);assert(memoryTrace('shootdown',false).slice(0,4).every(f=>!f.safe));assert(memoryTrace('shootdown',false).at(-1)?.safe);assert.equal(memoryTrace('buddy',true)[1].values.Esito,'non soddisfatta');});
test('Balloon, COW e preparazione mantengono risorse ed esiti distinti',()=>{assert.equal(memoryTrace('balloon',false)[3].values['Backing restituito'],2);assert.equal(memoryTrace('balloon',false).at(-1)?.values['Pagine balloon'],0);assert.deepEqual(memoryTrace('ksm',false).map(f=>f.values['Frame host']),[2,1,1,2,2]);assert.equal(memoryTrace('latency',false).at(-1)?.values.Esito,'deadline superata');assert.equal(memoryTrace('latency',true).at(-1)?.values.Esito,'completato');});
