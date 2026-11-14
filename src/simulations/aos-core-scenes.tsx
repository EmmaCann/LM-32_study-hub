'use client';
import type { Frame, Mode } from './aos-models';
import { MovingToken, NodeBox, Scene, Signal, Wire } from './aos-visual-player';
const value=(f:Frame,k:string)=>Number(f.values[k]);

export function FlagsScene({frame,step,playing}:{frame:Frame;step:number;playing:boolean}){
 const open=value(frame,'IF virtuale guest')===1,broken=step===4&&!open;
 return <Scene title="Due percorsi degli interrupt: host fisico e guest virtuale" playing={playing}>
  <rect x="25" y="73" width="850" height="150" rx="20" className="domain-host"/><text x="45" y="100" className="scene-kicker">HOST · STATO FISICO</text>
  <rect x="25" y="248" width="850" height="217" rx="20" className="domain-guest"/><text x="45" y="276" className="scene-kicker">GUEST DEPRIVILEGIATO · STATO MANTENUTO DAL MONITOR</text>
  <NodeBox x={50} y={120} title="Timer fisico" sub="Evento hardware" w={175} tone="teal"/>
  <NodeBox x={685} y={120} title="Handler host" sub="IF fisico = 1" w={165} tone="teal" active/>
  <Wire d="M225 162 H680" active tone="teal" label="L’host continua a ricevere i propri interrupt" x={260} y={145}/>
  {playing&&<Signal path="M225 162 H680"/>}
  <NodeBox x={50} y={325} title="Controller virtuale" sub={step>=3?'Interrupt in arrivo':'Stato del guest'} w={205} tone="violet"/>
  <NodeBox x={690} y={325} title="Handler guest" sub={open?'Consegna abilitata':'Consegna trattenuta'} w={165} tone="violet" active={open}/>
  <Wire d="M255 365 H690" active={open} tone={broken?'red':'violet'}/>
  <g className={`interrupt-gate ${open?'gate-open':'gate-closed'}`} style={{transformOrigin:'595px 365px',transform:`rotate(${open?-70:0}deg)`}}><rect x="588" y="326" width="14" height="78" rx="5"/></g>
  <text x="595" y="424" textAnchor="middle" className={`scene-title ${broken?'text-error':''}`}>IF virtuale = {open?'1':'0'}</text>
  <MovingToken x={step<3?290:open?772:550} y={365} label="IRQ" tone={open?'violet':'amber'}/>
  <g opacity={step>0?1:0} className="scene-fade"><MovingToken x={step===4?480:490} y={step===4?315:215} label="IF salvato: 1" tone="amber"/></g>
  <text x="280" y="455" className="scene-small">{step===1?'PUSHF → salvataggio':step===2?'CLI → trap → IF virtuale = 0':step===4?broken?'POPF ignorata: il monitor non vede il ripristino':'Ripristino mediato: il cancello si riapre':''}</text>
  {broken&&<g className="scene-warning"><rect x="280" y="35" width="470" height="32" rx="8"/><text x="515" y="57" textAnchor="middle">Stato atteso = 1, stato virtuale = 0: equivalenza violata</text></g>}
 </Scene>;
}

export function CpuScene({frame,step,n,mode,playing}:{frame:Frame;step:number;n:number;mode:Mode;playing:boolean}){
 const line=step===0?0:step===1?0:step===3*n+2?4:1+(step-2)%3;
 const lines=['ADDI x1, x0, 0','ADD x1, x1, x2','ADDI x2, x2, -1','BNE x2, x0, -8','ECALL'];
 const cached=frame.items??[],interpreted=mode==='interpretazione',miss=frame.detail.startsWith('Miss'),chained=frame.detail.startsWith('Collegamento');
 return <Scene title="Datapath RISC-V, istruzione corrente e cache dei translation block" playing={playing}>
  <text x="35" y="39" className="scene-kicker">CODICE GUEST</text><text x="318" y="39" className="scene-kicker">MOTORE HOST · {interpreted?'INTERPRETE':'TRADUTTORE DINAMICO'}</text>
  <rect x="26" y="65" width="250" height="265" rx="16" className="scene-paper"/>
  <g className="code-cursor" style={{transform:`translate(0px,${line*44}px)`}}><rect x="36" y="82" width="229" height="36" rx="8"/><path d="M40 100 L49 94 V106Z"/></g>
  {lines.map((text,i)=><g key={text}><text x="60" y={106+i*44} className="scene-code">{[0,4,8,12,16][i].toString().padStart(2,'0')}</text><text x="92" y={106+i*44} className="scene-code">{text}</text></g>)}
  <text x="45" y="305" className="scene-small">PC successivo: {frame.values['PC guest (byte)']} byte</text>
  <NodeBox x={322} y={80} w={225} h={84} title={interpreted?'Fetch + Decode':'Frontend → IR → host'} sub={interpreted?'Decodifica a ogni passaggio':miss?'MISS: costruisci un blocco':'Traduzioni riutilizzabili'} active={interpreted||miss} tone="blue"/>
  <g className="alu-shape"><path d="M372 206 H499 L476 272 H395Z"/><text x="437" y="236" textAnchor="middle" className="scene-title">ALU</text><text x="437" y="257" textAnchor="middle" className="scene-small">{line===1?'x1 + x2':line===2?'x2 − 1':line===3?'x2 ≠ 0 ?':'esecuzione'}</text></g>
  <Wire d="M276 125 H319" active={interpreted||miss}/><Wire d="M437 164 V201" active={interpreted||miss}/>
  <NodeBox shape="memory" x={635} y={65} w={235} h={240} title="Registri guest" sub="Stato della CPU emulata" tone="violet"/>
  {[0,1,2].map((r,i)=><g key={r}><rect x="658" y={142+i*46} width="189" height="36" rx="7" className={`register-cell ${r===1&&line===1||r===2&&line===2?'register-active':''}`}/><text x="672" y={166+i*46} className="scene-code">x{r}</text><text key={`${r}-${frame.values['x'+r]}`} x="824" y={166+i*46} textAnchor="end" className="scene-code register-value">{frame.values['x'+r]}</text></g>)}
  <Wire d="M633 205 H525 L498 225" active={line===1||line===2} tone="violet" label="operandi" x={542} y={191}/><Wire d="M490 256 H580 V279 H632" active={line!==3} tone="teal"/>
  {playing&&<>{(interpreted||miss)&&<Signal path="M276 125 H437 V205" tone="blue"/>}<Signal path="M635 205 H525 L450 230 L490 256 H580 V279 H635" tone="violet" delay=".45s"/></>}
  <rect x="300" y="344" width="569" height="128" rx="16" className="cache-area"/>
  <text x="319" y="370" className="scene-kicker">{interpreted?'INTERPRETAZIONE: NESSUN CODICE HOST IN CACHE':'CACHE SOFTWARE DI CODICE HOST'}</text>
  {['A','B','C'].map((b,i)=>{
    const present=cached.some(s=>s.startsWith(b));
    return <g key={b} className={`translation-block tone-${i===1?'violet':'blue'}`} style={{transform:`translate(${present?325+i*175:65}px,${present?389:88+i*88}px)`,opacity:present?1:0}}><rect width="148" height="55" rx="10"/><text x="15" y="23" className="scene-title">TB {b} · host</text><text x="15" y="43" className="scene-small">{['PC 0','PC 4 · loop','PC 16'][i]}</text></g>;
  })}
  {mode==='chaining'&&cached.length>=2&&<Wire d="M575 445 C575 490 525 490 525 445" active={chained} tone="amber" label="B → B diretto; il branch resta" x={370} y={491}/>}
  {mode==='cache'&&cached.length>=2&&<Wire d="M575 389 V326 H550" active tone="amber" label="ritorno al dispatcher" x={367} y={329}/>}
  {!interpreted&&!miss&&step>0&&<><Wire d="M575 388 V316 H437 V278" active tone="teal"/>{playing&&<Signal path="M575 388 V316 H437 V278" tone="teal"/>}</>}
 </Scene>;
}

export function QueueScene({frame,step,playing}:{frame:Frame;step:number;playing:boolean}){
 const available=value(frame,'Pubblicate (avail)'),used=value(frame,'Completate (used)'),reclaimed=value(frame,'Buffer recuperati'),phase=step?((step-1)%6)+1:0;
 return <Scene title="Split virtqueue: riferimenti ai descrittori tra frontend, available, backend e used" playing={playing}>
  <rect x="215" y="42" width="477" height="405" rx="22" className="domain-guest"/><text x="238" y="68" className="scene-kicker">RAM GUEST CONDIVISA</text>
  <NodeBox x={22} y={172} w={172} h={104} title="Frontend guest" sub="Prepara e recupera" tone="violet" active={phase===1||phase===6}/>
  <NodeBox x={718} y={172} w={162} h={104} title="Backend host" sub="Consuma il lavoro" tone="teal" active={phase===3||phase===4}/>
  <text x="240" y="112" className="scene-title">Available ring</text><text x="240" y="274" className="scene-title">Used ring</text>
  {Array.from({length:8},(_,i)=><g key={i}><rect x={244+i*52} y="129" width="44" height="34" rx="7" className="ring-cell"/><rect x={244+i*52} y="290" width="44" height="34" rx="7" className="ring-cell"/><rect x={243+i*52} y="385" width="45" height="36" rx="6" className={i<used?'buffer-done':'buffer-cell'}/><text x={266+i*52} y="408" textAnchor="middle" className="scene-small">B{i+1}</text></g>)}
  <text x="240" y="371" className="scene-small">Buffer dati: rimangono qui, non vengono spostati dal kick</text>
  <Wire d="M194 207 H215 V146 H239" active={phase===2} tone="violet"/>
  <Wire d="M692 146 H799 V169" active={phase===3} tone="amber" label="kick" x={753} y={128}/>
  <Wire d="M799 278 V307 H696" active={phase===4} tone="teal"/>
  <Wire d="M215 307 H110 V281" active={phase===5||phase===6} tone="violet" label="notifica" x={125} y={329}/>
  {phase===3&&playing&&<Signal path="M692 146 H799 V169" tone="amber"/>}
  {phase===5&&playing&&<Signal path="M215 307 H110 V281" tone="violet"/>}
  {Array.from({length:8},(_,i)=>{
    const done=i<reclaimed,completed=i<used,posted=i<available,processing=posted&&!completed&&phase===3;
    const x=done||!posted?64+(i%2)*67:processing?758+(i%2)*43:266+i*52;
    const y=done||!posted?354+Math.floor(i/2)*29:processing?315+Math.floor(i/2)*29:completed?307:146;
    return <MovingToken key={i} x={x} y={y} label={`D${i+1}`} small delay={i*45} tone={done?'teal':completed?'teal':processing?'amber':'violet'}/>;
  })}
  <text x="32" y="478" className="scene-small">D = riferimento a un descrittore · B = buffer dati · gruppi e notifiche seguono la politica semplificata scelta</text>
 </Scene>;
}

export function KvmScene({frame,step,playing}:{frame:Frame;step:number;playing:boolean}){
 const xy=[[668,393],[668,243],[668,93]][frame.active];
 const kernel=frame.active===1,guest=frame.active===2,user=frame.active===0;
 return <Scene title="Architettura KVM: il controllo percorre il ciclo interno o raggiunge userspace" playing={playing}>
  <rect x="230" y="40" width="610" height="112" rx="18" className="domain-guest"/><text x="250" y="65" className="scene-kicker">GUEST · NON-ROOT</text>
  <NodeBox shape="chip" x={280} y={76} w={330} h={61} title="CPU virtuale in esecuzione" tone="violet" active={guest}/>
  <rect x="230" y="183" width="610" height="119" rx="18" className="domain-host"/><text x="250" y="207" className="scene-kicker">HOST · KERNEL SPACE</text>
  <NodeBox x={280} y={219} w={330} h={64} title="KVM: decidi come gestire la exit" tone="teal" active={kernel}/>
  <rect x="230" y="342" width="610" height="118" rx="18" className="domain-user"/><text x="250" y="367" className="scene-kicker">HOST · USER SPACE</text>
  <NodeBox x={280} y={379} w={330} h={64} title="VMM: modello del dispositivo" tone="blue" active={user}/>
  <Wire d="M340 152 V181" active={step===3||step===5} tone="amber" label="VM exit hardware" x={32} y={170}/>
  <Wire d="M740 184 V151" active={step===4||step===9||step===6&&guest} tone="violet" label="VM entry" x={752} y={173}/>
  <Wire d="M340 303 V340" active={step===6&&user} tone="blue" label="KVM_RUN restituisce" x={33} y={327}/>
  <Wire d="M740 341 V303" active={step===1||step===8} tone="teal" label="ioctl KVM_RUN" x={750} y={328}/>
  <Wire d="M230 239 H186 V95 H230" active={step>=3&&step<=4||step===6&&guest} tone="violet"/>
  <text x="28" y="105" className="scene-title">Ciclo interno</text><text x="28" y="127" className="scene-small">Guest ↔ KVM</text><text x="28" y="148" className="scene-small">stessa system call</text>
  <Wire d="M230 245 H164 V408 H230" active={step>=6&&user} tone="blue"/><text x="28" y="422" className="scene-title">Ciclo esterno</text><text x="28" y="444" className="scene-small">coinvolge userspace</text>
  <MovingToken x={xy[0]} y={xy[1]} label="thread vCPU" tone={guest?'violet':kernel?'teal':'blue'}/>
  {playing&&guest&&<Signal path="M295 111 H590" tone="violet"/>}
  <text x="250" y="487" className="scene-small">La stessa vCPU attraversa i contesti: una VM exit non implica un ritorno al VMM.</text>
 </Scene>;
}
