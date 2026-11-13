import test from 'node:test';
import assert from 'node:assert/strict';
import {containerTrace,execCaps} from '../src/simulations/aos-container-model';
test('Namespace: identita, hostname e root mount restano distinti',()=>{const pid=containerTrace('pid');assert.equal(pid[2].hostName,'ubuntu-vm');assert.equal(pid[2].boxName,'box');assert.equal(pid[1].values['PID host shell'],4242);assert(containerTrace('mount').at(-1)?.rootDetached);});
test('Veth: endpoint DOWN e rotta assente impediscono la consegna',()=>{assert.equal(containerTrace('network','ok')[3].x,650);assert.equal(containerTrace('network','down')[3].x,420);assert.equal(containerTrace('network','internet')[3].x,340);});
test('Bounding non revoca E/P e non filtra il ramo inheritable di exec',()=>{const cap=containerTrace('cap');assert(cap.every(f=>!f.effective||f.permitted));assert(cap[3].effective&&cap[3].permitted&&!cap[3].bounding);assert(cap[5].effective);assert(!cap[6].permitted);assert.equal(execCaps(0,1,0,0,0,true,true).permitted,0);assert.equal(execCaps(1,0,1,0,0,true,true).permitted,1);assert.equal(execCaps(0,0,0,1,1,false,false).effective,1);assert.equal(execCaps(0,0,0,1,1,false,true).ambient,0);});
