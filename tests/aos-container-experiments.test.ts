import test from 'node:test';
import assert from 'node:assert/strict';
import {containerTrace,experiments,execCaps} from '../src/simulations/aos-container-model';
test('19 configurazioni: stati coerenti e risultati deterministici',()=>{
 let count=0;
 for(const [mode,scenarios] of Object.entries(experiments))for(const [scenario]of scenarios)for(const path of mode==='mount'?['/etc/passwd','/oldroot/etc/passwd']:['/etc/passwd']){
  const frames=containerTrace(mode as keyof typeof experiments,scenario,path);assert.equal(frames.length,6);assert(frames.every(f=>!f.effective||f.permitted));assert(frames.at(-1)?.result);count++;
 }assert.equal(count,19);
});
test('Stesso getpid, diversa procfs: ps distingue la fonte dei dati',()=>{
 const good=containerTrace('pid','fresh').at(-1)!,old=containerTrace('pid','stale').at(-1)!;
 assert.equal(good.values['getpid()'],1);assert.equal(old.values['getpid()'],1);assert(!good.result.includes('systemd'));assert(old.result.includes('4242'));assert(old.result.includes('systemd'));
});
test('I percorsi seguono la root e /oldroot, senza eliminare i file host',()=>{
 assert.match(containerTrace('mount','host').at(-1)!.result,/HOST/);assert.match(containerTrace('mount','chroot').at(-1)!.result,/BOX/);
 assert.match(containerTrace('mount','pivot','/oldroot/etc/passwd').at(-1)!.result,/HOST/);assert.match(containerTrace('mount','detached','/oldroot/etc/passwd').at(-1)!.result,/ENOENT/);
});
test('Link e instradamento sono condizioni distinte del ping',()=>{
 for(const scenario of ['ok','routed'])assert(containerTrace('network',scenario).at(-1)!.allowed);
 for(const scenario of ['down','internet'])assert(!containerTrace('network',scenario).at(-1)!.allowed);
});
test('Copia cap_t, applicazione al thread e DROP Bounding producono esiti diversi',()=>{
 const flag=containerTrace('cap','flag').at(-1)!,apply=containerTrace('cap','apply').at(-1)!,drop=containerTrace('cap','drop').at(-1)!;
 assert(flag.localEffective&&!flag.effective&&!flag.allowed);assert(apply.localEffective&&apply.effective&&apply.allowed);
 assert(drop.effective&&!drop.bounding&&drop.allowed);assert(!containerTrace('cap','revoke').at(-1)!.allowed);
 assert.equal(execCaps(0,1,0,0,0,true,true).permitted,0);assert.equal(execCaps(1,0,1,0,0,true,true).permitted,1);
});
