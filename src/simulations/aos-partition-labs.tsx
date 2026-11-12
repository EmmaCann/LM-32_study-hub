'use client';
import {useCallback,useState} from 'react';
import {VisualPlayer,Scene,NodeBox,MovingToken,Wire,useLabTransport,useSceneClock} from './aos-visual-player';
import {partitionTrace,ivshmemTrace,ringTrace,ringStates,cacheTrace,cacheStates} from './aos-partition-models';
export type PartitionComponent='aos-partition'|'aos-ivshmem'|'aos-ring'|'aos-cache-colors';
function PartitionScene({step,fault,playing}:{step:number;fault:boolean;playing:boolean}){
 const clock=useSceneClock(playing);
 return <Scene title="Jailhouse: assegnazione dei core e contenimento del fault" playing={playing}>
  {[['Root Linux',25,'host'],['Cluster',325,'guest'],['IVI Linux',625,'guest']].map(([name,x,domain])=><g key={name}><rect x={Number(x)} y="70" width="250" height="285" rx="18" className={`domain-${domain}`}/><text x={Number(x)+20} y="105" className="scene-title">{name}</text><text x={Number(x)+20} y="328" className="scene-small">{name==='Cluster'?'RAM privata · nessuna cessione':name==='Root Linux'?'Gestione delle celle':'RAM propria + aree autorizzate'}</text></g>)}
  {[0,1,2,3].map(core=>{const cluster=core===1&&step>=2,ivi=core>=2&&step>=5;return <MovingToken key={core} x={cluster?450:ivi?750:150} y={ivi?155+(core-2)*62:cluster?180:145+core*48} label={`Core ${core}`} tone={cluster?'teal':ivi?'violet':'blue'}/>;})}
  <NodeBox x={25} y={395} w={850} h={70} title={step<1?'Linux nativo':step===7&&fault?'Accesso negato: il core IVI responsabile viene fermato':'Jailhouse · EL2 / VMX root'} sub={step<1?'Enable inserirà il livello di virtualizzazione':'Trasferire proprietà delle risorse non significa spostare fisicamente i core.'} tone={step===7&&fault?'red':'blue'} active/>
  {step>=4&&<g style={{transform:`rotate(${clock*.09}deg)`,transformOrigin:'450px 265px'}} data-cluster-wheel="true"><circle cx="450" cy="265" r="23" fill="none" stroke="#268c85" strokeWidth="3"/><path d="M450 242V288M427 265H473" stroke="#268c85" strokeWidth="3"/></g>}
  {step===7&&<><Wire d="M700 370H530" active tone={fault?'red':'teal'}/><MovingToken x={fault?535:460} y={370} label={fault?'STOP':'lettura'} tone={fault?'red':'teal'}/></>}
 </Scene>;
}
function SharedScene({step,interrupt,playing}:{step:number;interrupt:boolean;playing:boolean}){
 const notify=step===3?[190,350]:step===4?[450,350]:[735,350];
 return <Scene title="IVSHMEM: payload fermo in RAM e notifica separata" playing={playing}>
  <NodeBox x={25} y={70} w={230} h={90} title="Peer A · produttore" sub="Output proprio: scrivibile" tone="violet"/>
  <NodeBox x={645} y={70} w={230} h={90} title="Peer B · lettore" sub="Output A: sola lettura" tone="teal"/>
  <rect x="295" y="185" width="310" height="115" rx="18" className="domain-guest"/><text x="315" y="213" className="scene-title">Stessi byte fisici</text>
  <Wire d="M140 170V250H295" active={step===1} tone="violet"/><Wire d="M760 170V250H605" active={step===5} tone="teal"/>
  <MovingToken x={step>=1?450:140} y={step>=1?260:195} label="payload" tone="violet"/>
  <text x="320" y="290" className="scene-small">{step>=2?'Pubblicato: wr avanzato':'Non ancora pubblicato'}</text>
  <NodeBox x={325} y={335} w={250} h={75} title={interrupt?'Jailhouse':'Controllo periodico'} sub={interrupt?'Intercetta il doorbell':'B legge gli indici'} tone="amber" active={step===4}/>
  {interrupt?<><Wire d="M140 335V445H760V335" active={step>=3} tone="amber"/>{step>=3&&<MovingToken x={notify[0]} y={notify[1]+95} label={step===3?'doorbell':'IRQ'} tone="amber"/>}</>:<><Wire d="M760 320V285H605" active={step>=3} tone="teal"/>{step>=3&&<MovingToken x={step>=4?610:760} y={step>=4?285:315} label="sonda" tone="teal"/>}</>}
  <text x="35" y="480" className="scene-small">{interrupt?'La notifica non copia i dati e non sostituisce il protocollo.':'Polling: modalità usata dal cockpit. Nessun interrupt automatico per ogni frame.'}</text>
 </Scene>;
}
function RingScene({step,size,slow,playing}:{step:number;size:number;slow:boolean;playing:boolean}){
 const s=ringStates(size,slow)[step],position=(index:number)=>{const a=2*Math.PI*(index%size)/size-Math.PI/2;return {x:380+185*Math.cos(a),y:265+120*Math.sin(a)};};
 const w=position(s.w),r=position(s.r),loss=s.lost+Math.max(0,s.w-s.r-size);
 return <Scene title="Ring con un produttore e indice privato del lettore" playing={playing}>
  <ellipse cx="380" cy="265" rx="185" ry="120" fill="none" stroke="#9aaab5" strokeWidth="2" strokeDasharray="5 7"/>
  {s.slots.map((v,i)=>{const p=position(i);return <g key={i}><rect x={p.x-43} y={p.y-23} width="86" height="46" rx="9" className={v?'buffer-done':'ring-cell'}/><text x={p.x} y={p.y+5} textAnchor="middle" className="scene-title">{v?`F${v}`:'vuoto'}</text><text x={p.x} y={p.y+40} textAnchor="middle" className="scene-small">slot {i}</text></g>;})}
  <MovingToken x={w.x} y={w.y-53} label="wr" tone="violet" small/>
  <MovingToken x={r.x} y={r.y+65} label="rd" tone="teal" small/>
  <text x="285" y="255" className="scene-title">{s.action==='legge'?`Consuma F${s.read}`:'Pubblica senza attesa'}</text><text x="315" y="285" className="scene-small">slot = contatore % N</text>
  <NodeBox x={650} y={95} w={220} h={90} title={`w = ${s.w} · rd = ${s.r}`} sub="rd appartiene al lettore" tone="teal"/>
  <NodeBox x={650} y={240} w={220} h={90} title={`Frame persi: ${loss}`} sub={loss?'I vecchi frame sono sostituiti':'Nessun frame perso'} tone={loss?'red':'blue'} active={loss>0}/>
  <text x="35" y="480" className="scene-small">{size} slot nel modello; nella demo 64. Non è una virtqueue: indici e politica sono diversi.</text>
 </Scene>;
}
function CacheScene({step,colored,playing}:{step:number;colored:boolean;playing:boolean}){
 const s=cacheStates(colored)[step],critical=s.access.startsWith('C');
 return <Scene title="Cache condivisa: espulsioni e colori disgiunti" playing={playing}>
  <NodeBox x={30} y={55} w={250} h={90} title="Cluster · critico" sub={colored?'Colori 0 e 1':'Può usare gruppi 0 e 1'} tone="teal"/>
  <NodeBox x={620} y={55} w={250} h={90} title="IVI · non critico" sub={colored?'Colori 2 e 3':'Può contendere gruppi 0 e 1'} tone="violet"/>
  <rect x="40" y="225" width="820" height="150" rx="20" className="domain-host"/><text x="62" y="253" className="scene-kicker">LLC · QUATTRO GRUPPI A UNA LINEA · MODELLO ILLUSTRATIVO</text>
  {s.sets.map((v,i)=><g key={i}><rect x={65+i*198} y="275" width="178" height="70" rx="10" className={v?'buffer-done':'ring-cell'}/><text x={154+i*198} y="298" textAnchor="middle" className="scene-small">Gruppo {i}{colored?` · colore ${i}`:''}</text></g>)}
  <Wire d={`M${critical?155:745} 145V210H${step?154+s.set*198:450}V265`} active={step>0} tone={critical?'teal':'violet'}/>
  {['C0','C1','N0','N1'].map((line,i)=>{const slot=s.sets.indexOf(line),seen=cacheStates(colored).slice(0,step+1).some(t=>t.access===line);return <MovingToken key={line} x={slot>=0?154+slot*198:i<2?110+i*120:650+(i-2)*120} y={slot>=0?324:seen?425:185} label={line} tone={slot<0&&seen?'red':i<2?'teal':'violet'}/>;})}
  <text x="35" y="395" className="scene-small">Linee espulse:</text>
  <text x="35" y="475" className="scene-small">Colori disgiunti evitano questa espulsione incrociata; bus e DRAM possono ancora interferire.</text>
 </Scene>;
}
export function AosPartitionLab({id,title,component}:{id:string;title:string;component:PartitionComponent}){
 const [step,setStep]=useState(0),[choice,setChoice]=useState(true),[size,setSize]=useState(8),[epoch,setEpoch]=useState(0);
 const onStep=useCallback((n:number)=>{setStep(n);if(n===0)setEpoch(e=>e+1);},[]);
 const frames=component==='aos-partition'?partitionTrace(choice):component==='aos-ivshmem'?ivshmemTrace(!choice):component==='aos-ring'?ringTrace(size,choice):cacheTrace(choice);
 const transport=useLabTransport(frames.length,step,onStep),label=component==='aos-partition'?'Accesso IVI':component==='aos-ivshmem'?'Notifica':component==='aos-ring'?'Lettore':'Cache';
 const options=<><label>{label}<select aria-label={label} value={String(choice)} onChange={e=>{transport.stop();onStep(0);setChoice(e.target.value==='true');}}><option value="true">{component==='aos-partition'?'Violazione RAM privata':component==='aos-ivshmem'?'Polling: demo cockpit':component==='aos-ring'?'Lento: si accumulano frame':'Colori disgiunti'}</option><option value="false">{component==='aos-partition'?'Lettura condivisa consentita':component==='aos-ivshmem'?'Doorbell: interrupt separato':component==='aos-ring'?'Veloce: legge fra scritture':'Gruppi condivisi: contesa'}</option></select></label>{component==='aos-ring'&&<label>Slot illustrativi<select aria-label="Slot illustrativi" value={size} onChange={e=>{transport.stop();onStep(0);setSize(Number(e.target.value));}}><option value={8}>8</option><option value={4}>4</option></select></label>}</>;
 const scene=component==='aos-partition'?<PartitionScene key={epoch} step={step} fault={choice} playing={transport.playing}/>:component==='aos-ivshmem'?<SharedScene step={step} interrupt={!choice} playing={transport.playing}/>:component==='aos-ring'?<RingScene step={step} size={size} slow={choice} playing={transport.playing}/>:<CacheScene step={step} colored={choice} playing={transport.playing}/>;
 const checks=component==='aos-partition'?[{label:'Quattro core, nessun overcommitment',ok:true},{label:'Il cluster conserva il core 1',ok:true}]:component==='aos-ivshmem'?[{label:'Payload e notifica restano distinti',ok:true},{label:'Il lettore non scrive nell’output altrui',ok:true}]:component==='aos-ring'?[{label:'Il produttore non modifica rd del lettore',ok:true},{label:'Perdita gestita dal protocollo, non dal doorbell',ok:true}]:[{label:'Coloring esplicitamente configurato',ok:choice,note:choice?'Confronta con il caso senza colori.':'Caso intenzionale di contesa condivisa.'},{label:'Non è isolamento di tutti i bus e della DRAM',ok:true}];
 return <VisualPlayer id={id} title={title} step={step} count={frames.length} onStep={onStep} frame={frames[step]} transport={transport} options={options} scene={scene} checks={checks} legend="Oggetti e percorsi rappresentano il meccanismo; dimensioni, capacità ridotte e tempi dell’animazione non sono misure hardware."/>;
}
