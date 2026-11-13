'use client';
import type { Frame } from './aos-models';
import type { AddressMode } from './aos-extra-models';
import { MovingToken, NodeBox, Scene, Signal, useSceneClock, Wire } from './aos-visual-player';

export function DecodeScene({word,step,playing}:{word:number;step:number;playing:boolean}){
 const fields=[['funct7',25,7,'violet'],['rs2',20,5,'teal'],['rs1',15,5,'blue'],['funct3',12,3,'amber'],['rd',7,5,'pink'],['opcode',0,7,'cyan']] as const;
 let left=82;
 const selected=fields[5-step];
 return <Scene title="La parola RISC-V si separa nei campi del formato R" playing={playing}>
  <text x="42" y="42" className="scene-kicker">UNA PAROLA DI 32 BIT · FORMATO R</text><text x="42" y="76" className="scene-heading">0x{word.toString(16).toUpperCase().padStart(8,'0')}</text>
  <text x="43" y="110" className="scene-small">Il campo selezionato esce dalla parola: conserva esattamente i suoi bit.</text>
  {fields.map(([name,shift,width,tone],i)=>{
    const x=left;left+=width*23;const active=i===5-step,bits=((word>>>shift)&((1<<width)-1)).toString(2).padStart(width,'0');
    return <g key={name} className={`bit-field tone-${tone} ${active?'field-selected':''}`} style={{transform:`translate(${x}px,${active?252:158}px)`}}><text y="-20" x={width*11.5} textAnchor="middle" className="scene-small">{shift+width-1} … {shift}</text><rect width={width*23-4} height="72" rx="9"/>{bits.split('').map((bit,j)=><g key={j}><text x={j*23+10} y="30" textAnchor="middle" className="scene-code">{bit}</text>{j>0&&<line x1={j*23-2} y1="8" x2={j*23-2} y2="38" className="bit-divider"/>}</g>)}<text x={width*11.5} y="57" textAnchor="middle" className="scene-title">{name}</text></g>;
  })}
  <Wire d="M450 334 V365" active tone={selected[3]}/>
  <NodeBox x={244} y={370} w={410} h={90} title={`${selected[0]} = ${(word>>>selected[1])&((1<<selected[2])-1)}`} sub={`(parola >> ${selected[1]}) & 0x${((1<<selected[2])-1).toString(16).toUpperCase()}`} tone={selected[3]} active/>
  <text x="43" y="488" className="scene-small">Gli altri campi restano al loro posto. Opcode, funct3 e funct7 identificano insieme l’operazione.</text>
 </Scene>;
}

export function TimerScene({mips,period,playing,step}:{mips:number;period:number;playing:boolean;step:number}){
 const t=useSceneClock(playing)*.35,duration=6000/mips,load=Math.min(1,t/duration),updates=Math.floor(t/period),on=updates%2===1;
 const range=Math.max(period*2,duration*2),scale=540/range;
 return <Scene title="Due scale temporali: carico CPU, timer periodico e LED" playing={playing}>
  <text x="35" y="42" className="scene-kicker">TEMPO VIRTUALE ILLUSTRATO · IL PC HOST HA UN ALTRO OROLOGIO</text>
  <g className="timer-dial"><circle cx="195" cy="209" r="102"/><circle cx="195" cy="209" r="88" className="dial-face"/>{Array.from({length:12},(_,i)=><line key={i} x1="195" y1="116" x2="195" y2="125" style={{transformOrigin:'195px 209px',transform:`rotate(${i*30}deg)`}}/>)}<g className="timer-hand" style={{transformOrigin:'195px 209px',transform:`rotate(${t/period*360}deg)`}}><line x1="195" y1="209" x2="195" y2="133"/><circle cx="195" cy="209" r="8"/></g></g>
  <text x="195" y="338" textAnchor="middle" className="scene-title">TIM2 · un giro = {period} ms</text><text x="195" y="361" textAnchor="middle" className="scene-small">84 MHz → PSC 8399 → ARR {period*10-1}</text>
  <Wire d="M310 209 H610" active tone="amber" label="update → handler → commuta PA5" x={333} y={185}/>
  {playing&&<Signal path="M310 209 H610" tone="amber"/>}
  <g className={`led-device ${on?'led-on':''}`}><rect x="635" y="100" width="210" height="219" rx="20"/><circle cx="740" cy="203" r="55" className="led-halo"/><circle cx="740" cy="203" r="33" className="led-bulb"/><text x="740" y="143" textAnchor="middle" className="scene-kicker">USCITA PA5</text><text x="740" y="277" textAnchor="middle" className="scene-title">{on?'LED acceso':'LED spento'}</text></g>
  <text x="740" y="345" textAnchor="middle" className="scene-small">Un ciclo completo = {period*2} ms virtuali</text>
  <rect x="35" y="390" width="830" height="83" rx="13" className="scene-paper"/>
  <text x="50" y="415" className="scene-title">Carico CPU: 6M istruzioni</text><rect x="50" y="431" width="180" height="15" rx="6" className="workload-track"/><rect x="50" y="431" width={180*load} height="15" rx="6" className="workload-progress"/><text x="50" y="464" className="scene-small">{duration} ms a {mips} MIPS · {load===1?'completato':'in esecuzione'}</text>
  <line x1="290" y1="445" x2="830" y2="445" className="timeline-axis"/><rect x="290" y="426" width={Math.max(4,duration*scale)} height="18" rx="4" className="workload-progress"/>
  {[1,2].map(i=><g key={i}><line x1={290+period*i*scale} y1="414" x2={290+period*i*scale} y2="449" className="timer-tick"/><text x={290+period*i*scale} y="467" textAnchor="end" className="scene-small">{period*i} ms</text></g>)}
  <text x="290" y="407" className="scene-small">Durata del carico vs update del timer · fase {step+1}</text>
 </Scene>;
}

export function InterruptScene({frame,step,masked,playing}:{frame:Frame;step:number;masked:boolean;playing:boolean}){
 const enabled=Number(frame.values['Guest pronto ad accettarlo'])===1,delivered=step>=(masked?5:3),eoi=frame.title.startsWith('EOI');
 const point=delivered?[752,373]:step===0?[116,176]:step===1?[350,176]:step===2?[595,176]:[683,230];
 return <Scene title="Il pacchetto attraversa controller fisico, host e controller virtuale prima dell’handler guest" playing={playing}>
  <rect x="24" y="44" width="850" height="186" rx="19" className="domain-host"/><text x="42" y="71" className="scene-kicker">HARDWARE E HOST</text>
  <NodeBox x={40} y={91} w={180} title="NIC fisica" sub="Genera l’evento" tone="amber" active={step===0}/>
  <NodeBox x={270} y={91} w={182} title="Driver host" sub="Gestisce la periferica" tone="teal" active={step===1}/>
  <NodeBox x={518} y={91} w={328} title="Controller virtuale nel VMM" sub="Pendenze, priorità e maschere" tone="violet" active={frame.active===2}/>
  <Wire d="M220 132 H267" active={step>=1} tone="amber"/><Wire d="M452 132 H515" active={step>=2} tone="teal"/>
  <rect x="480" y="301" width="394" height="149" rx="19" className="domain-guest"/><text x="500" y="326" className="scene-kicker">DENTRO LA VM</text>
  <NodeBox x={626} y={347} w={228} h={84} title="Handler del guest" sub={delivered?'Interrupt consegnato':'In attesa della consegna'} tone="violet" active={delivered}/>
  <Wire d="M683 178 V343" active={enabled&&step>=2} tone="violet" label="VM entry / iniezione quando accettabile" x={150} y={269}/>
  <g className={`interrupt-gate ${enabled?'gate-open':'gate-closed'}`} style={{transformOrigin:'683px 270px',transform:`rotate(${enabled?90:0}deg)`}}><rect x="618" y="263" width="130" height="14" rx="5"/></g>
  <MovingToken x={point[0]} y={point[1]} label="evento IRQ" tone={delivered?'violet':enabled?'teal':'amber'}/>
  <Wire d="M625 391 H420 V205 H518" active={eoi} tone="blue" label="EOI intercettata → aggiorna il controller" x={43} y={411}/>
  <g opacity={eoi?1:0} className="scene-fade"><MovingToken x={eoi?525:600} y={eoi?205:390} label="EOI" tone="blue"/></g>
  {eoi&&playing&&<Signal path="M625 391 H420 V205 H518" tone="blue"/>}
  {!enabled&&step>=2&&<g className="scene-warning"><rect x="65" y="318" width="342" height="55" rx="10"/><text x="83" y="341">Pendente nel controller virtuale</text><text x="83" y="361" className="scene-small">Il guest mascherato non esegue l’handler.</text></g>}
  <text x="40" y="484" className="scene-small">Percorso software del corso: le accelerazioni hardware possono ridurre o cambiare queste uscite.</text>
 </Scene>;
}

export function AddressScene({mode,valid,step,playing}:{mode:AddressMode;valid:boolean;step:number;playing:boolean}){
 const cpu=mode==='cpu',blocked=!cpu&&!valid;
 const x=[112,401,blocked?553:745][step],y=cpu?145:327;
 return <Scene title="CPU ed I/O convergono sulla RAM attraverso due traduzioni distinte" playing={playing}>
  <text x="35" y="40" className="scene-kicker">DUE DOMINI DI INDIRIZZAMENTO · UNA RAM HOST</text>
  <rect x="24" y="79" width="572" height="150" rx="18" className="domain-guest"/><text x="43" y="106" className="scene-kicker">RICHIESTE DELLA CPU</text>
  <NodeBox x={41} y={126} w={173} h={76} title="Processo guest" sub="GVA 0x1000" active={cpu&&step===0} tone="violet"/>
  <NodeBox x={288} y={126} w={262} h={76} title="Page table guest + EPT" sub="GVA → GPA 0x2000 → HPA" active={cpu&&step===1} tone="violet"/>
  <Wire d="M214 163 H286" active={cpu} tone="violet"/><Wire d="M549 163 H638 L691 231" active={cpu&&step===2} tone="violet"/>
  <rect x="24" y="260" width="572" height="159" rx="18" className="domain-host"/><text x="43" y="288" className="scene-kicker">RICHIESTE DEL DISPOSITIVO</text>
  <NodeBox x={41} y={309} w={173} h={76} title="Periferica DMA" sub="IOVA 0x5000" active={!cpu&&step===0} tone="teal"/>
  <NodeBox x={288} y={309} w={262} h={76} title="IOMMU / dominio" sub={blocked?'Mapping o permessi non validi':'Traduzione e permessi DMA'} active={!cpu&&step===1} tone={blocked?'red':'teal'}/>
  <Wire d="M214 347 H286" active={!cpu} tone="teal"/><Wire d="M549 347 H638 L691 279" active={!cpu&&step===2&&!blocked} tone={blocked?'red':'teal'}/>
  <g className="ram-chip"><rect x="665" y="126" width="202" height="269" rx="18"/><text x="766" y="161" textAnchor="middle" className="scene-title">RAM fisica host</text>{Array.from({length:6},(_,i)=><g key={i}><rect x="687" y={180+i*31} width="159" height="24" rx="4" className={i===2&&step===2&&!blocked?'ram-selected':'ram-cell'}/>{i===2&&<text x="766" y={197+i*31} textAnchor="middle" className="scene-small">HPA 0x9000</text>}</g>)}</g>
  <MovingToken x={x} y={step===2&&!blocked?254:y+55} label={step===2?blocked?'FAULT':'0x9000':step===1?cpu?'GPA 0x2000':'IOVA 0x5000':cpu?'GVA 0x1000':'IOVA 0x5000'} tone={blocked&&step===2?'red':cpu?'violet':'teal'}/>
  {blocked&&step===2&&<g className="fault-barrier"><path d="M583 295 V393"/><text x="585" y="287" textAnchor="middle" className="scene-title">BLOCCO</text></g>}
  {playing&&step===2&&!blocked&&<Signal path={cpu?'M549 163 H638 L691 231':'M549 347 H638 L691 279'} tone={cpu?'violet':'teal'}/>}
  <text x="38" y="465" className="scene-title">{blocked?'Il fault interrompe il percorso prima della RAM.':cpu?'Le page table del guest e il secondo livello servono la CPU.':'La IOMMU controlla il DMA; EPT non sostituisce questo percorso.'}</text>
  <text x="38" y="489" className="scene-small">Indirizzi esemplificativi. Le due richieste autorizzate possono riferirsi agli stessi byte fisici.</text>
 </Scene>;
}

export function MemoryScene({valid,step,playing}:{valid:boolean;step:number;playing:boolean}){
 const target=valid?130:423;
 return <Scene title="Memory slot KVM: un offset identifica gli stessi byte nella vista guest e nella mappatura host" playing={playing}>
  <text x="38" y="39" className="scene-kicker">MEMORY SLOT · DUE VISTE, GLI STESSI BYTE</text>
  <text x="70" y="83" className="scene-title">Indirizzi guest fisici</text><text x="590" y="83" className="scene-title">Indirizzi host virtuali</text>
  <rect x="85" y="105" width="195" height="286" rx="13" className="domain-guest"/><rect x="615" y="105" width="195" height="286" rx="13" className="domain-host"/>
  {Array.from({length:17},(_,i)=><g key={i}><line x1="85" y1={111+i*17} x2="109" y2={111+i*17} className="address-ruler"/><line x1="786" y1={111+i*17} x2="810" y2={111+i*17} className="address-ruler"/></g>)}
  <text x="124" y="119" className="scene-code">0x2000</text><text x="635" y="119" className="scene-code">mem = 0x70000000</text>
  <text x="124" y="377" className="scene-code">0x12000 escluso</text><text x="635" y="377" className="scene-code">mem + 0x10000</text>
  <rect x="335" y="178" width="230" height="142" rx="16" className="ram-backing"/><text x="450" y="208" textAnchor="middle" className="scene-title">Un solo backing</text><text x="450" y="230" textAnchor="middle" className="scene-small">RAM esposta dal VMM</text>
  {Array.from({length:8},(_,i)=><rect key={i} x={355+i*24} y="254" width="17" height="34" rx="4" className={step===2&&valid&&i===1?'ram-selected':'ram-cell'}/>)}
  <Wire d={`M280 ${valid?140:421} H309 V270 H335`} active={step>=1&&valid} tone={valid?'violet':'red'}/>
  <Wire d="M565 270 H590 V140 H615" active={step===2&&valid} tone="teal"/>
  <g className="slot-probe" style={{transform:`translate(0px,${target-130}px)`}}><rect x="86" y="129" width="192" height="6" className={valid?'probe-valid':'probe-invalid'}/><text x="70" y="137" textAnchor="end" className="scene-small">g</text></g>
  {step===2&&valid&&<rect x="616" y="129" width="192" height="6" className="probe-valid"/>}
  <MovingToken x={step===0?183:step===1?valid?305:310:valid?713:310} y={step===0?target:step===1?valid?140:421:valid?140:421} label={step===2?valid?'0x70001000':'FUORI SLOT':valid?'g = 0x3000':'g = 0x12000'} tone={!valid&&step>0?'red':step===2?'teal':'violet'}/>
  {!valid&&step>=1&&<g className="fault-barrier"><path d="M320 388 V452"/><text x="450" y="423" className="scene-title">Il limite superiore è escluso.</text></g>}
  {playing&&step===2&&valid&&<Signal path="M280 140 H309 V270 H565 H590 V140 H615" tone="teal"/>}
  <text x="450" y="473" textAnchor="middle" className="scene-title">HVA = mem + (g − g₀)</text><text x="450" y="496" textAnchor="middle" className="scene-small">Registrare lo slot associa due viste; non crea una seconda copia della RAM.</text>
 </Scene>;
}
