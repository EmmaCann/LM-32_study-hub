'use client';
import { useState, type ReactNode } from 'react';
import { cpuTrace, flagsTrace, kvmTrace, queueTrace, type Mode } from './aos-models';
import { CpuScene, FlagsScene, KvmScene, QueueScene } from './aos-core-scenes';
import { useLabTransport, VisualPlayer, type VisualCheck } from './aos-visual-player';
export const aosComponents=['aos-flags','aos-cpu-cache','aos-virtqueue','aos-kvm-run'] as const;
export type AosComponent=typeof aosComponents[number];
export function AosLab({id,title,component}:{id:string;title:string;component:AosComponent}){
 const [step,setStep]=useState(0),[corrected,setCorrected]=useState(false),[n,setN]=useState(4),[mode,setMode]=useState<Mode>('interpretazione'),[batch,setBatch]=useState(4),[userExit,setUserExit]=useState(true);
 const frames=component==='aos-flags'?flagsTrace(corrected):component==='aos-cpu-cache'?cpuTrace(n,mode):component==='aos-virtqueue'?queueTrace(8,batch):kvmTrace(userExit);
 const transport=useLabTransport(frames.length,step,setStep),frame=frames[step];
 const choose=(fn:()=>void)=>{transport.stop();setStep(0);fn();};
 const v=(key:string)=>Number(frame.values[key]);
 let checks:VisualCheck[],scene:ReactNode,legend:string;
 if(component==='aos-flags'){
  scene=<FlagsScene frame={frame} step={step} playing={transport.playing}/>;
  legend='Verde: host fisico. Viola: guest. Il cancello abilita o trattiene gli interrupt virtuali.';
  checks=[{label:'IF fisico host indipendente',ok:v('IF fisico host')===1},{label:'IF virtuale corrisponde a quello atteso',ok:v('IF virtuale guest')===v('IF atteso guest'),note:step===4&&!corrected?'POPF non intercettata lascia lo stato guest errato.':undefined}];
 }else if(component==='aos-cpu-cache'){
  scene=<CpuScene frame={frame} step={step} n={n} mode={mode} playing={transport.playing}/>;
  legend='Segui l’istruzione evidenziata. I blocchi tradotti si spostano nella cache e vengono riutilizzati.';
  checks=[{label:'x0 resta zero',ok:v('x0')===0},{label:'PC allineato a 4 byte',ok:v('PC guest (byte)')%4===0},{label:step===frames.length-1?'Risultato della somma corretto':'Il branch conserva la sua condizione',ok:step===frames.length-1?v('x1')===n*(n+1)/2:true,note:mode==='chaining'?'Il collegamento diretto evita il dispatcher, non il controllo del salto.':undefined}];
 }else if(component==='aos-virtqueue'){
  scene=<QueueScene frame={frame} step={step} playing={transport.playing}/>;
  legend='D1…D8: riferimenti ai descrittori. I dati B1…B8 rimangono nella RAM guest condivisa.';
  checks=[{label:'Recupero solo dopo completamento',ok:v('Buffer recuperati')<=v('Completate (used)')},{label:'Completamenti solo di richieste pubblicate',ok:v('Completate (used)')<=v('Pubblicate (avail)')},{label:'Le notifiche non trasportano i buffer',ok:true}];
 }else{
  scene=<KvmScene frame={frame} step={step} playing={transport.playing}/>;
  legend='La capsula segue il thread vCPU. I confini guest, kernel e userspace restano visibili.';
  checks=[{label:'Ritorni userspace ≤ exit hardware',ok:v('Ritorni a userspace')<=v('VM exit hardware')},{label:'Il ciclo interno resta nella stessa ioctl',ok:true,note:v('VM exit hardware')>v('Ritorni a userspace')?'Ora i due conteggi sono diversi.':undefined}];
 }
 const options=<>
 {component==='aos-flags'&&<label>Percorso<select aria-label="Percorso POPF" value={corrected?'corretto':'storico'} onChange={e=>choose(()=>setCorrected(e.target.value==='corretto'))}><option value="storico">Difetto storico di POPF</option><option value="corretto">Ripristino mediato dal VMM</option></select></label>}
 {component==='aos-cpu-cache'&&<><label>n iniziale<select aria-label="n iniziale" value={n} onChange={e=>choose(()=>setN(Number(e.target.value)))}>{[1,2,4,8].map(i=><option key={i}>{i}</option>)}</select></label><label>Motore<select aria-label="Motore" value={mode} onChange={e=>choose(()=>setMode(e.target.value as Mode))}><option value="interpretazione">Interprete</option><option value="cache">Traduzione con cache</option><option value="chaining">Cache + block chaining</option></select></label></>}
 {component==='aos-virtqueue'&&<label>Richieste per gruppo<select aria-label="Richieste per gruppo" value={batch} onChange={e=>choose(()=>setBatch(Number(e.target.value)))}>{[1,2,4,8].map(i=><option key={i}>{i}</option>)}</select></label>}
 {component==='aos-kvm-run'&&<label>Seconda exit<select aria-label="Seconda exit" value={userExit?'user':'kernel'} onChange={e=>choose(()=>setUserExit(e.target.value==='user'))}><option value="user">I/O nel VMM userspace</option><option value="kernel">Gestita internamente da KVM</option></select></label>}
 </>;
 return <VisualPlayer design="architecture" id={id} title={title} frame={frame} step={step} count={frames.length} onStep={setStep} transport={transport} options={options} scene={scene} checks={checks} legend={legend}/>;
}
