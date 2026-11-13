'use client';
import {useCallback,useState} from 'react';
import {VisualPlayer,Scene,NodeBox,Wire,MovingToken,useLabTransport,useSceneClock} from './aos-visual-player';
import {loaderTrace,pitTrace,gapTrace,gapTime,gapSample,PIT_HZ} from './aos-baremetal-models';

export type BaremetalComponent='aos-elf-loader'|'aos-pit-read'|'aos-vcpu-gaps';
function LoaderScene({step,playing}:{step:number;playing:boolean}){
 return <Scene title="Segmenti ELF, RAM guest e avvio della CPU" playing={playing}>
  <rect x="25" y="45" width="255" height="395" rx="20" className="domain-host"/>
  <text x="45" y="78" className="scene-kicker">FILE ELF · HOST</text>
  <NodeBox x={45} y={95} w={215} h={70} title="Intestazioni" sub="segmenti · entry" active={step===1}/>
  <text x="45" y="360" className="scene-small">Il file non contiene</text><text x="45" y="382" className="scene-small">i byte di tutta la .bss.</text>
  <rect x="535" y="45" width="340" height="395" rx="20" className="domain-guest"/>
  <text x="555" y="78" className="scene-kicker">RAM GUEST · SCHEMA NON IN SCALA</text>
  {[['Codice · 0x100000',180],['Costanti',250],['.bss + stack',320]].map(([label,y],i)=><g key={label}><rect x="560" y={Number(y)-24} width="290" height="53" rx="8" className={step>=4&&Number(y)===320?'buffer-done':'ring-cell'}/>{(i===2||step<i+2)&&<text x="575" y={Number(y)+9} className="scene-small">{step>=4&&Number(y)===320?'0000 0000 · azzerata':label}</text>}</g>)}
  <Wire d="M280 190 H535" active={step===2||step===3} label="copia i byte" x={345} y={169}/>
  <MovingToken x={step>=2?700:150} y={step>=2?183:218} label=".text" tone="violet"/>
  <MovingToken x={step>=3?700:150} y={step>=3?253:290} label=".rodata" tone="teal"/>
  <NodeBox x={307} y={255} w={195} h={80} title="Loader" sub="Copia + zero-fill" active={step>=1&&step<=5}/>
  <text x="550" y="400" className="scene-small">Boot info → EBX · ingresso → EIP</text>
  <Wire d="M405 350 V467 H835" active={step>=6} tone="amber"/>
  <text x="35" y="475" className="scene-small">CPU:</text>
  <MovingToken x={step<6?160:step===6?450:760} y={467} label={step<6?'non avviata':step===6?'_start → ESP':'firmware_main()'} tone="amber"/>
 </Scene>;
}
function PitScene({step,playing,mode}:{step:number;playing:boolean;mode:'kvm'|'tcg'}){
 const clock=useSceneClock(playing),angle=-(clock*.04+step*34);
 const destinations=[[190,140],[680,140],[400,285],[400,355],[190,220],[190,220]];
 const [x,y]=destinations[step];
 return <Scene title="PIT: contatore vivo, latch e due byte" playing={playing}>
  <rect x="25" y="55" width="255" height="375" rx="20" className="domain-guest"/>
  <text x="45" y="88" className="scene-kicker">FIRMWARE · POLLING</text>
  <NodeBox x={45} y={260} w={210} h={90} title="clock_now()" sub="last − count mod 65536" active={step===5}/>
  <rect x="520" y="55" width="355" height="375" rx="20" className="domain-host"/>
  <text x="540" y="88" className="scene-kicker">{mode==='kvm'?'HOST KERNEL · KVM':'PROCESSO QEMU · TCG'}</text>
  <circle cx="685" cy="180" r="66" fill="none" stroke="#839aab" strokeWidth="2"/>
  <g data-pit-hand="true" style={{transform:`rotate(${angle}deg)`,transformOrigin:'685px 180px'}}><path d="M685 180L685 125" stroke="#268c85" strokeWidth="5"/><circle cx="685" cy="180" r="7" fill="#268c85"/></g>
  <text x="605" y="278" className="scene-title">Contatore vivo ↓</text>
  <text x="570" y="306" className="scene-small">Continua anche durante il latch</text>
  <NodeBox x={570} y={330} w={255} h={75} title={step?'Latch: 0xBEEF':'Latch non acquisito'} sub={step?'Copia stabile: BE | EF':'Attende OUT 0x43'} tone="amber" active={step>=1&&step<=3}/>
  <Wire d="M280 130 H520" active={step===1} label="OUT 0x43 · acquisisci" x={305} y={116} tone="violet"/>
  <Wire d="M520 285 H280" active={step===2} label="IN 0x42 · basso: EF" x={305} y={266} tone="teal"/>
  <Wire d="M520 355 H280" active={step===3} label="IN 0x42 · alto: BE" x={305} y={338} tone="teal"/>
  <MovingToken x={x} y={y} label={step===1?'LATCH':step===2?'0xEF':step===3?'0xBE':step>=4?'0xBEEF':'richiesta'} tone={step===1?'violet':'teal'}/>
  <text x="45" y="470" className="scene-small">{mode==='kvm'?'Tre accessi intercettati; gestore nel kernel, nessun ritorno al VMM per queste porte.':'Tre operazioni sul modello software: nessuna transizione VMX per questi accessi.'}</text>
 </Scene>;
}
function GapScene({step,pauseMs,playing}:{step:number;pauseMs:number;playing:boolean}){
 const x=120+step*65, paused=step>=4&&step<=7, guestX=120+Math.min(step,3)*65+(step>=8?(step-7)*65:0);
 const host=gapTime(step,pauseMs),angle=host*10;
 return <Scene title="Il tempo avanza, il guest può fermarsi" playing={playing}>
  <text x="30" y="62" className="scene-kicker">TRACCIA ILLUSTRATIVA · NON UN BENCHMARK</text>
  <rect x="315" y="92" width="325" height="305" rx="16" fill="#f5e8df" opacity=".8"/>
  <text x="350" y="121" className="scene-title">Pausa vCPU: {pauseMs} ms</text>
  <text x="30" y="184" className="scene-small">Tempo host</text><Wire d="M120 180 H820" active/>
  <MovingToken x={x} y={180} label={`${host.toFixed(1)} ms`} tone="blue"/>
  <text x="30" y="260" className="scene-small">Lavoro guest</text><Wire d="M120 260 H820" tone="violet"/>
  <MovingToken x={guestX} y={260} label={paused?'sospeso':'esegue'} tone="violet"/>
  <text x="30" y="342" className="scene-small">Campioni</text><Wire d="M120 345 H820"/>
  {Array.from({length:11},(_,i)=>i<=step&&gapSample(i)?<g key={i}><path d={`M${120+i*65} 325V365`} stroke="#328d83" strokeWidth="4"/><circle cx={120+i*65} cy="345" r="6" fill="#328d83"/></g>:null)}
  {step>=8&&<><path d="M315 375V392H640V375" fill="none" stroke="#ad6842" strokeWidth="2"/><text x="330" y="421" className="scene-small">Distanza fra campioni: {pauseMs+1} ms reali</text></>}
  <circle cx="780" cy="70" r="30" fill="none" stroke="#839aab"/><g data-gap-hand="true" style={{transform:`rotate(${angle}deg)`,transformOrigin:'780px 70px'}}><path d="M780 70V45" stroke="#268c85" strokeWidth="4"/></g>
  <text x="35" y="470" className="scene-small">{pauseMs>=55?'Pausa oltre un giro PIT: il conteggio modulo 65536 perde tempo.':'IF guest = 0: non impedisce allo scheduler host di sospendere la vCPU.'}</text>
 </Scene>;
}
export function AosBaremetalLab({id,title,component}:{id:string;title:string;component:BaremetalComponent}){
 const [step,setStep]=useState(0),[mode,setMode]=useState<'kvm'|'tcg'>('kvm'),[pauseMs,setPauseMs]=useState(25),[epoch,setEpoch]=useState(0);
 const onStep=useCallback((n:number)=>{setStep(n);if(n===0)setEpoch(e=>e+1);},[]);
 const frames=component==='aos-elf-loader'?loaderTrace():component==='aos-pit-read'?pitTrace(mode):gapTrace(pauseMs);
 const transport=useLabTransport(frames.length,step,onStep);
 const options=component==='aos-pit-read'?<label>Gestore PIT<select aria-label="Gestore PIT" value={mode} onChange={e=>{transport.stop();onStep(0);setMode(e.target.value as 'kvm'|'tcg');}}><option value="kvm">KVM: nel kernel</option><option value="tcg">TCG: modello QEMU</option></select></label>:component==='aos-vcpu-gaps'?<label>Pausa illustrativa<select aria-label="Durata pausa" value={pauseMs} onChange={e=>{transport.stop();onStep(0);setPauseMs(Number(e.target.value));}}><option value={25}>25 ms: inferiore al giro PIT</option><option value={80}>80 ms: si perde un giro PIT</option></select></label>:<span>ELF → RAM → stato CPU → esecuzione</span>;
 const scene=component==='aos-elf-loader'?<LoaderScene step={step} playing={transport.playing}/>:component==='aos-pit-read'?<PitScene key={`${epoch}-${mode}`} step={step} playing={transport.playing} mode={mode}/>:<GapScene step={step} playing={transport.playing} pauseMs={pauseMs}/>;
 const checks=component==='aos-elf-loader'?[{label:'Caricare è distinto da eseguire',ok:true},{label:'.bss azzerata, non copiata dal file',ok:true}]:component==='aos-pit-read'?[{label:'Il latch conserva la stessa acquisizione',ok:true},{label:'Tre accessi: OUT, IN basso, IN alto',ok:true}]:[{label:'Il tempo host continua durante la pausa',ok:true},{label:'Tempo ricostruibile senza perdere giri PIT',ok:pauseMs+1<65536/PIT_HZ*1000,note:pauseMs>55?'Caso intenzionale: la lettura a 16 bit è ambigua.':undefined}];
 return <VisualPlayer id={id} title={title} frame={frames[step]} step={step} count={frames.length} onStep={onStep} transport={transport} options={options} scene={scene} checks={checks} legend={component==='aos-elf-loader'?'I blocchi mantengono identità durante la copia; la CPU parte solo dopo la preparazione.':component==='aos-pit-read'?'La lancetta segue il contatore vivo; la copia resta ferma. Tempi rallentati e valore acquisito illustrativo.':'Il cursore host attraversa la pausa; il lavoro guest resta fermo e i campioni si diradano.'}/>;
}
