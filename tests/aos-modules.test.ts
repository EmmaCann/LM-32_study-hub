import {test} from 'node:test';
import assert from 'node:assert/strict';
import {modulesTrace,moduleCases,type ModuleMode} from '../src/simulations/aos-modules-model';
test('Dieci scenari: riferimenti e caricamenti coerenti',()=>{
 let count=0;for(const mode of Object.keys(moduleCases)as ModuleMode[])for(const [s]of moduleCases[mode]){const f=modulesTrace(mode,s);assert.equal(f.length,7);for(const a of f){assert.equal(a.ref,a.consumer?1:0);assert(!a.consumer||a.provider);}count++;}assert.equal(count,10);assert.throws(()=>modulesTrace('atomic','invalid'),RangeError);
});
test('Init, exit e parametro runtime sono eventi distinti',()=>{
 for(const s of ['version','signature'])assert(modulesTrace('lifecycle',s).every(a=>!a.init&&!a.exit&&!a.live));
 const f=modulesTrace('lifecycle','invalid');assert(f[2].init);assert(f.every(a=>!a.exit&&!a.live));
 const g=modulesTrace('lifecycle','valid');assert(g[3].live);assert.equal(g[3].name,'Alice');assert.equal(g[4].name,'Bob');assert(g[5].exit);assert(!g[6].live);
});
test('Persistenza appartiene al provider; refcount non conta i ticket',()=>{
 assert.equal(modulesTrace('dependency','reload')[6].ticket,4);assert.equal(modulesTrace('dependency','reload')[6].ref,1);
 assert.equal(modulesTrace('dependency','reset')[6].ticket,2);assert.equal(modulesTrace('dependency','held')[3].ref,1);assert(modulesTrace('dependency','held')[3].error);
 assert(modulesTrace('dependency','missing').every(a=>!a.consumer&&a.ticket===0));
});
test('Due RMW atomiche contro una perdita di aggiornamento',()=>{
 const plain=modulesTrace('atomic','plain'),atomic=modulesTrace('atomic','atomic');assert.deepEqual(plain.map(a=>a.value),[5,5,5,6,6,6,6]);assert.deepEqual(atomic.map(a=>a.value),[5,5,6,6,7,7,7]);
});
