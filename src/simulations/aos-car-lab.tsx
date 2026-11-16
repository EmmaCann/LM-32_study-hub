'use client';
import {useEffect,useId,useMemo,useState} from 'react';
import {VisualPlayer,Scene} from './aos-visual-player';
import {P,Wire,Signal,Chip,MemorySlab,Header,mix,clamp} from './aos-architecture-primitives';
import {carDefault,carModes,carResult,carTrace,type CarConfig,type CarMode} from './aos-car-model';
import './aos-visual.css';
import './aos-car.css';

function Car({x,y,color=P.cyan,label}:{x:number;y:number;color?:string;label:string}){return <g transform={`translate(${x} ${y})`}><ellipse cy={35} rx={65} ry={8} fill='#020916' opacity={.6}/><path d='M-58 8L-40-24H30L53 5L67 12V29H-65V14Z' fill='#142c43' stroke={color} strokeWidth={2}/><path d='M-31-19H22L39 3H-43Z' fill={color} fillOpacity={.22}/><circle cx={-40} cy={28} r={12} fill='#08121e' stroke={color}/><circle cx={39} cy={28} r={12} fill='#08121e' stroke={color}/><text y={65} textAnchor='middle' className='car-label'>{label}</text></g>;}
function CarScene({mode,c,time}:{mode:CarMode;c:CarConfig;time:number}){
 const uid=useId().replaceAll(':',''),phase=Math.min(5,Math.floor(time)),t=time-phase,result=carResult(mode,c);
 const token=(points:readonly(readonly[number,number])[],n:number,tag:string,color=P.cyan)=><Signal uid={uid} points={points} t={clamp(time-n)} tag={tag} color={color} probe='experiment'/>;
 return <Scene title={carModes[mode]} height={620}><defs><linearGradient id={`${uid}-chip`} x2='.5' y2='1'><stop stopColor='#223e5a'/><stop offset='1' stopColor='#112038'/></linearGradient><filter id={`${uid}-glow`}><feGaussianBlur stdDeviation='2'/></filter></defs><g className='car-canvas' data-car-scene={mode} data-time={time.toFixed(4)}>
 <Header kicker='AOS 09 / CAR · MODELLO DIDATTICO' title={carModes[mode]} subtitle={mode==='budget'?'Tempi ipotetici: quota CPU e risposta del freno sono grandezze distinte.':'Oggetti persistenti, configurazione modificabile e percorsi causali.'}/>
 {mode==='network'&&<>
  <path d='M36 128H858V522H36Z' fill='#0d1b2c' stroke={P.line}/><text x={54} y={150} className='car-tiny'>VM UBUNTU · KERNEL CONDIVISO</text>
  <Chip x={150} y={236} name='HOST' sub={c.isolated?'socat 2222':'porta VM 2222'} uid={uid}/><Car x={730} y={228} color={P.violet} label='INFOTAINMENT'/>
  <text x={730} y={317} textAnchor='middle' className='car-code'>{c.isolated?'eth1 .100.2 / eth0 .1.4':'socket nel namespace host'}</text>
  <Wire d='M249 236H660' color={P.violet}/><text x={445} y={217} textAnchor='middle' className='car-tiny'>{c.isolated?'hostlink .100.1 ↔ eth1 .100.2 · seconda connessione':'porta VM → servizio locale · senza socat'}</text>
  {c.isolated?<MemorySlab x={350} y={353} w={200} h={46} label='br-car · L2' sub='' uid={uid}/>:<g><ellipse cx={450} cy={376} rx={99} ry={26} fill='#152b41' stroke={P.cyan}/><text x={450} y={382} textAnchor='middle' className='car-label'>loopback host</text></g>}
  <Wire d='M730 326V376H550M350 376H150V400M450 400V440H700V400' color={P.cyan}/>
  <Car x={150} y={456} label={c.isolated?'RADAR .1.2':'RADAR 127.0.0.1'}/><Chip x={700} y={444} name='BRAKE' sub='UDP 5000' accent={P.amber} uid={uid}/>
  {phase<=1?token([[150,236],[500,236],[660,236]],0,'SSH',P.violet):token(c.fake?[[730,326],[730,376],[450,376],[450,440],[600,440]]:[[150,400],[150,376],[450,376],[450,440],[600,440]],2,c.fake?'SPEED 130 DIST 3':'SPEED 75 DIST 60',c.fake?P.red:P.cyan)}
  <path d='M602 415V470' stroke={c.fake&&c.isolated?P.red:P.green} strokeWidth={5} transform={`rotate(${phase>=4&&!(c.fake&&c.isolated)?-65:0} 602 470)`}/>
  <text x={450} y={513} textAnchor='middle' className='car-tiny'>{c.isolated?'Filtro: atteso .1.2; infotainment invia da .1.4':'Loopback comune: radar e infotainment appaiono 127.0.0.1'}</text>
 </>}
 {mode==='replacement'&&<>
  <MemorySlab x={65} y={390} w={735} h={70} depth={22} label={c.isolated?'LOWER COMUNE · radar originale':'FILE CONDIVISO · /opt/car/image/bin/radar'} uid={uid} color={P.cyan}/>
  <MemorySlab x={60} y={163} w={300} h={70} label={c.isolated?'UPPER INFOTAINMENT':'SHELL INFOTAINMENT'} uid={uid} color={P.violet}/>
  <MemorySlab x={515} y={163} w={300} h={70} label={c.isolated?'UPPER RADAR · vuoto':'PERCORSO RADAR COMUNE'} uid={uid} color={P.green}/>
  <Wire d='M210 390V250M665 390V250' color={P.line}/>
  {token(c.isolated?[[210,390],[210,260]]:[[210,170],[210,350],[430,410]],1,'sostituto',P.red)}
  <g transform={`translate(${mix(665,665,t)} ${phase<4?315:mix(315,287,t)})`}><circle r={42} fill='#132c3d' stroke={phase===3?P.red:P.green} strokeWidth={2}/><text y={-3} textAnchor='middle' className='car-label'>RADAR</text><text y={17} textAnchor='middle' className='car-tiny'>{phase===3?'terminato':phase>=4?'nuovo PID':'in memoria'}</text></g>
  {phase>=4&&token([[665,390],[665,350],[665,315]],4,c.isolated?'ELF originale':'sostituto',c.isolated?P.green:P.red)}
  <text x={50} y={520} className='car-code'>{c.isolated?'La scrittura cambia una vista privata; execv radar risolve un’altra vista.':'Il restart riapre lo stesso percorso: riavvio e integrità sono separati.'}</text>
 </>}
 {mode==='budget'&&<>
  <text x={45} y={152} className='car-label'>Tempo di parete (ms) →</text>
  {Array.from({length:15},(_,i)=><g key={i}><path d={`M${100+i*48} 178V465`} stroke={i===10?P.red:P.line} strokeDasharray={i===10?'6 5':undefined}/><text x={100+i*48} y={490} textAnchor='middle' className='car-tiny'>{i}</text></g>)}
  <text x={45} y={208} className='car-tiny'>INFO</text><rect x={100} y={223} width={c.quota*48} height={48} fill={P.violet} fillOpacity={.7}/><rect x={100+c.quota*48} y={223} width={(10-c.quota)*48} height={48} fill='#1c263b'/><text x={110} y={255} className='car-code'>{c.quota} ms CPU</text>
  <text x={105+c.quota*48} y={296} className='car-tiny'>{c.quota<10?'throttled fino al rifornimento':'quota pari al periodo'}</text>
  <text x={45} y={355} className='car-tiny'>BRAKE</text><rect x={100} y={373} width={c.wait*48} height={48} fill={P.amber} fillOpacity={.18}/><rect x={100+c.wait*48} y={373} width={6*48} height={48} fill={P.green} fillOpacity={.65}/><text x={110+c.wait*48} y={404} className='car-code'>6 ms di lavoro CPU</text>
  <text x={590} y={178} className='car-tiny' style={{fill:P.red}}>deadline 10 ms</text>
  {token([[100,345],[100+Math.min(14,6+c.wait)*48,345]],0,'risposta',P.amber)}
  <g data-experiment-probe transform={`translate(${100+clamp(time/5)*672} 453)`}><path d='M0-12L8 0L0 12L-8 0Z' fill={P.cyan}/></g>
  <text x={45} y={528} className='car-tiny'>Un task saturo per infotainment; nessuna riserva o relazione automatica quota → attesa.</text>
 </>}
 {mode==='bootstrap'&&<>
  <path d='M45 145H855V525H45Z' fill='#0c192b' stroke={P.line}/><path d='M460 145V525' stroke={P.violet} strokeDasharray='6 7'/><text x={70} y={172} className='car-label'>PERCORSI HOST</text><text x={490} y={172} className='car-label'>NUOVO AMBIENTE</text>
  <MemorySlab x={80} y={210} w={290} h={65} label='/run/netns/brake' uid={uid}/><MemorySlab x={80} y={385} w={290} h={65} label='car/brake/cgroup.procs' uid={uid} color={P.amber}/>
  <Chip x={665} y={260} name='CHILD' sub={phase>=5?'execv':'PID locale 1'} uid={uid} accent={P.green}/>
  <MemorySlab x={535} y={390} w={260} h={65} label={phase>=4?'root = merged':'merged = overlay'} uid={uid} color={P.violet}/>
  <Wire d='M370 240H565M370 418H480V300H565' color={P.line}/>
  {token(phase<2?(c.joinBeforeRoot?[[370,240],[565,240]]:[[370,240],[440,240]]):[[370,418],[480,418],[480,300],[565,300]],phase<2?0:2,phase<2?(c.joinBeforeRoot?'setns(net)':'ENOENT'):'cgroup.procs = 0',!c.joinBeforeRoot?P.red:P.cyan)}
  <path d='M460 212V320' stroke={phase>=4?P.red:P.green} strokeWidth={6}/>
  <text x={490} y={507} className='car-tiny'>Dopo pivot_root: percorsi host assenti dalla nuova root.</text>
 </>}
 <text x={35} y={588} className='car-result' data-car-result={phase===5?'final':'pending'} style={{fill:phase===5?P.green:P.muted}}>{phase===5?result:'Esplora la sequenza, poi confronta l’esito della configurazione.'}</text>
 </g></Scene>;
}
export function AosCarLab({id,title}:{id:string;title:string}){
 const[mode,setMode]=useState<CarMode>('network'),[c,setC]=useState<CarConfig>(carDefault),[time,setTime]=useState(0),[running,setRunning]=useState(false),[delay,setDelay]=useState(2400);
 const frames=useMemo(()=>carTrace(mode,c),[mode,c]),step=Math.min(5,Math.floor(time)),playing=running&&time<5;
 const reset=()=>{setRunning(false);setTime(0);};
 function update(p:Partial<CarConfig>){reset();setC(v=>({...v,...p}));}
 useEffect(()=>{if(!playing)return;let raf=0,last=0,elapsed=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;function tick(now:number){if(last){const dt=Math.min(100,now-last);if(reduced){elapsed+=dt;if(elapsed>=delay){setTime(n=>Math.min(5,Math.floor(n)+1));elapsed=0;}}else setTime(n=>Math.min(5,n+dt/delay));}last=now;raf=requestAnimationFrame(tick);}raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);},[playing,delay]);
 return <div className='car-lab'><VisualPlayer design='architecture' id={id} title={title} frame={frames[step]} step={step} count={6} onStep={n=>{reset();setTime(n);}} transport={{playing,delay,setDelay,stop:()=>setRunning(false),toggle:()=>{if(time>=5)setTime(0);setRunning(!playing);}}} options={<>
 <nav className='car-tabs' aria-label='Esperimenti car'>{Object.entries(carModes).map(([m,label])=><button type='button' key={m} aria-pressed={mode===m} onClick={()=>{reset();setMode(m as CarMode);}}>{label}</button>)}</nav>
 {(mode==='network'||mode==='replacement')&&<label>Ambiente<select aria-label='Isolamento car' value={String(c.isolated)} onChange={e=>update({isolated:e.target.value==='true'})}><option value='true'>Namespace e upper separati</option><option value='false'>Processi e percorsi comuni</option></select></label>}
 {mode==='network'&&<label>Produttore<select aria-label='Sorgente car' value={String(c.fake)} onChange={e=>update({fake:e.target.value==='true'})}><option value='true'>Infotainment: 130 km/h, 3 m</option><option value='false'>Radar: 75 km/h, 60 m</option></select></label>}
 {mode==='budget'&&<><label>Quota infotainment (ms / 10)<input aria-label='Quota car' type='range' min='1' max='10' value={c.quota} onChange={e=>update({quota:Number(e.target.value)})}/><output>{c.quota}</output></label><label>Attesa ipotetica brake (ms)<input aria-label='Attesa car' type='range' min='0' max='8' value={c.wait} onChange={e=>update({wait:Number(e.target.value)})}/><output>{c.wait}</output></label></>}
 {mode==='bootstrap'&&<><label>Rete<select aria-label='Ordine rete' value={String(c.joinBeforeRoot)} onChange={e=>update({joinBeforeRoot:e.target.value==='true'})}><option value='true'>setns prima di pivot_root</option><option value='false'>setns dopo pivot_root</option></select></label><label>Cgroup<select aria-label='Ordine cgroup' value={String(c.joinBeforeUnshare)} onChange={e=>update({joinBeforeUnshare:e.target.value==='true'})}><option value='true'>migrazione → nuovo namespace</option><option value='false'>nuovo namespace → migrazione</option></select></label></>}
 <button type='button' onClick={()=>{setTime(0);setRunning(true);}}>Prova configurazione</button>
 </>} scene={<CarScene mode={mode} c={c} time={time}/>} checks={[{label:'Modello dichiarato: nessuna syscall Linux eseguita',ok:true},{label:'La soluzione car fornita non riduce le capabilities',ok:true}]} legend='Modifica una condizione, prevedi l’esito e osserva i passaggi. Tempi illustrativi e accessi ordinari; nessuna evasione privilegiata simulata.' detailPanel={<details><summary>Collegamento con il codice</summary><p>{mode==='network'?'setup_network configura bridge/veth; container_main usa open + setns; brake confronta rx_addr con radar.s_addr.':mode==='replacement'?'prepare_layers crea upper/work privati; mount costruisce merged; execv riapre il percorso nella vista del servizio.':mode==='budget'?'setup_cgroups scrive cpu.max; brake misura il lavoro con CLOCK_THREAD_CPUTIME_ID e la risposta con CLOCK_MONOTONIC.':'clone crea il figlio; setns entra in una rete esistente; cgroup.procs cambia appartenenza; unshare cambia la vista; pivot_root cambia radice.'}</p></details>}/></div>;
}
