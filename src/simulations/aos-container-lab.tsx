'use client';
import {useEffect,useMemo,useState} from 'react';
import {VisualPlayer,Scene} from './aos-visual-player';
import {containerTrace,containerModes,experiments,experimentDefault,type ContainerMode,type ContainerFrame} from './aos-container-model';
import './aos-container.css';
const c={ink:'#e8f1ff',blue:'#183853',green:'#16443b',red:'#4a2936',amber:'#4b3c2b',line:'#4c7094',paper:'#14263d'};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t*t*(3-2*t);
function Box({x,y,w=210,h=65,title,sub='',fill=c.paper}:{x:number;y:number;w?:number;h?:number;title:string;sub?:string;fill?:string}){return <g><path className='container-surface' d={`M${x+8} ${y}H${x+w-14}L${x+w} ${y+14}V${y+h-8}L${x+w-8} ${y+h}H${x+8}L${x} ${y+h-8}V${y+8}Z`} fill={fill} stroke={c.line}/><path d={`M${x+12} ${y+4}H${x+w-20}`} fill='none' stroke={c.line} opacity={.4}/><text x={x+15} y={y+27} className='exp-label'>{title}</text>{sub&&<text x={x+15} y={y+49} className='exp-small'>{sub}</text>}</g>;}
function Edge({d,active=false,dashed=false}:{d:string;active?:boolean;dashed?:boolean}){return <path d={d} fill='none' stroke={active?'#57d9f8':'#547393'} strokeWidth={active?4:2} strokeDasharray={dashed?'7 6':undefined}/>;}
function Probe({x,y,label}:{x:number;y:number;label:string}){return <g data-experiment-probe transform={`translate(${x} ${y})`}><rect x={-24} y={-15} width={48} height={30} rx={8} fill={c.amber} stroke={c.ink} strokeWidth={2}/><text y={6} textAnchor='middle' className='exp-small'>{label}</text></g>;}
function Result({text,ok}:{text:string;ok:boolean}){return <g data-experiment-result><rect x={30} y={480} width={840} height={48} rx={10} fill={ok?c.green:c.red}/><text x={50} y={510} className='exp-label'>{text}</text></g>;}
function ExperimentScene({mode,scenario,path,a,b,t,time}:{mode:ContainerMode;scenario:string;path:string;a:ContainerFrame;b:ContainerFrame;t:number;time:number}) {
 const k=a.phase,x=mix(a.x,b.x,t),y=mix(a.y,b.y,t),fresh=scenario==='fresh',inside=scenario!=='host',external=['internet','routed'].includes(scenario);
 return <Scene title={containerModes[mode]} height={550}><g data-time={time.toFixed(4)}>
 {mode==='pid'&&<>
  <text x={30} y={35} className='exp-title'>getpid() e ps stanno interrogando la stessa cosa?</text>
  <Box x={30} y={65} w={240} h={95} title={inside?'Task A · shell interna':'Shell host'} sub={inside?'UTS: box · PID figlio':'UTS: ubuntu-vm · PID host'} fill={c.blue}/>
  <Box x={30} y={190} w={240} title={`getpid() → ${inside?'1':'812'}`} sub='Risposta del kernel al task' fill={k>=1?c.green:c.paper}/>
  <Edge d='M150 160V190' active={k>=1}/>
  <rect x={320} y={70} width={230} height={345} rx={14} fill={c.paper} stroke={c.line}/>
  <text x={340} y={105} className='exp-label'>/proc montato: {fresh?'FIGLIO':'HOST'}</text>
  <text x={340} y={132} className='exp-small'>Sorgente letta da ps</text>
  {(fresh?['/1  → task A','/2  → task B','/3  → task C']:['/1  → systemd','/812 → shell host','/4242 → task A','/4243 → task B','/4244 → task C']).map((r,j)=><g key={r}><rect x={337} y={160+j*43} width={196} height={35} rx={6} fill={k>=3?c.blue:'#f2f5f8'}/><text x={350} y={183+j*43} className='exp-mono'>{r}</text></g>)}
  <Edge d='M270 285H320' active={k>=2}/><text x={30} y={300} className='exp-label'>$ ps</text>
  <rect x={595} y={70} width={275} height={345} rx={14} fill='#1b3047'/><text x={615} y={104} className='exp-console'>PID   CMD       IDENTITÀ</text>
  {a.rows.map((row,j)=><text key={row} x={615} y={151+j*44} className='exp-console'>{row}</text>)}
  {k<3&&<text x={615} y={170} className='exp-console'>in attesa della scansione…</text>}
  <Edge d='M550 255H595' active={k>=4}/>
  <text x={30} y={452} className='exp-small'>A e B sono gli stessi task nelle due viste. UTS e PID sono appartenenze distinte.</text>
  {k<5&&<Probe x={x} y={y} label={k<2?'PID':'ps'}/>}
 </>}
 {mode==='mount'&&(()=>{
  const hostRoot=scenario==='host',oldLink=scenario==='pivot',old=path.startsWith('/oldroot');
  return <>
   <text x={30} y={35} className='exp-title'>Quale file viene raggiunto da {path}?</text>
   <Box x={330} y={60} w={240} title='Radice / del processo' sub={hostRoot?'punta all’host':'punta al rootfs'} fill={c.amber}/>
   <Box x={120} y={155} w={220} title='Root HOST' sub='file dell’host' fill={c.blue}/>
   <Box x={580} y={155} w={220} title='Root BOX' sub='file del rootfs' fill={c.green}/>
   <Edge d={hostRoot?'M450 125L230 155':'M450 125L690 155'} active={k>=1}/>
   <Box x={120} y={270} w={220} title='etc/'/><Box x={580} y={270} w={220} title='etc/'/>
   <Edge d='M230 220V270' active={k>=2&&hostRoot&&!old}/><Edge d='M690 220V270' active={k>=2&&!hostRoot&&!old}/>
   <Box x={120} y={375} w={220} title='passwd' sub='HOST: account dell’host' fill={c.blue}/>
   <Box x={580} y={375} w={220} title='passwd' sub='BOX: account del rootfs' fill={c.green}/>
   <Edge d='M230 335V375' active={k>=3&&(hostRoot||old)&&a.allowed}/><Edge d='M690 335V375' active={k>=3&&!hostRoot&&!old}/>
   {!hostRoot&&<><Edge d='M690 220V240H450V220H340' active={oldLink&&old&&k>=2} dashed={!oldLink}/><rect x={350} y={215} width={200} height={37} rx={7} fill={oldLink?c.amber:c.red}/><text x={365} y={240} className='exp-small'>/oldroot {oldLink?'collegato':'non raggiungibile'}</text></>}
   {scenario==='chroot'&&<text x={30} y={463} className='exp-small'>chroot: questa è la risoluzione ordinaria. Non verifica cwd/fd/privilegi conservati.</text>}
   {k<3&&<Probe x={x} y={y} label='path'/>}
  </>;
 })()}
 {mode==='network'&&<>
  <text x={30} y={35} className='exp-title'>La stessa richiesta incontra link e routing diversi</text>
  <Box x={30} y={70} w={250} title='Mittente nel namespace' sub='192.168.1.100/24 · ve1' fill={c.blue}/>
  <Box x={330} y={70} w={250} title='Host · peer ve2' sub={`192.168.1.200/24 · ${scenario==='down'?'DOWN':'UP'}`} fill={scenario==='down'?c.red:c.green}/>
  <Box x={650} y={70} w={220} title='Server esterno' sub='203.0.113.10' fill={external?c.amber:c.paper}/>
  <Edge d='M150 135V250H450V135' active={k>=2&&scenario!=='down'&&scenario!=='internet'}/>
  <Edge d='M450 250H760V135' active={external&&scenario==='routed'&&k>=3} dashed={scenario!=='routed'}/>
  <text x={250} y={220} className='exp-label'>veth</text><text x={590} y={220} className='exp-small'>inoltro + ritorno</text>
  <Box x={35} y={310} w={265} h={100} title='Tabella di routing mittente' sub={external?(scenario==='routed'?'default → ve1':'default assente'):'192.168.1.0/24 → ve1'} fill={scenario==='internet'?c.red:c.paper}/>
  <Box x={355} y={310} w={480} h={100} title={k<4?'Richiesta ICMP echo':'Risposta ICMP echo'} sub={`dst ${k<4?(external?'203.0.113.10':'192.168.1.200'):'192.168.1.100'} · seq 1`} fill={c.paper}/>
  {k>=1&&scenario==='internet'&&<path d='M255 290l22 22m0-22l-22 22' stroke='#b94e46' strokeWidth={5}/>}
  {scenario==='down'&&<path d='M300 228V275' stroke='#b94e46' strokeWidth={6}/>}
  <text x={30} y={455} className='exp-small'>{scenario==='routed'?'Assunzione esplicita: rotta, inoltro e ritorno esterno configurati. La veth da sola non basta.':'Cambia una condizione, ripeti e osserva dove si arresta il pacchetto.'}</text>
  {k<5&&<Probe x={x} y={y} label={k<4?'echo':'reply'}/>}
 </>}
 {mode==='cap'&&<>
  <text x={30} y={35} className='exp-title'>Modificare cap_t equivale a cambiare i permessi del thread?</text>
  <Box x={30} y={65} w={260} h={150} title='Copia locale cap_t' sub='Oggetto nel programma' fill={c.blue}/>
  <text x={55} y={157} className='exp-label'>E nella copia: {a.localEffective?'1':'0'}</text>
  <Box x={465} y={65} w={385} h={150} title='Stato del thread nel kernel' sub='Solo questo autorizza l’operazione' fill={c.paper}/>
  {[['P',a.permitted],['E',a.effective],['B',a.bounding]].map(([label,value],j)=><g key={String(label)}><rect x={490+j*110} y={140} width={90} height={48} rx={9} fill={value?c.green:c.red}/><text x={508+j*110} y={170} className='exp-label'>{String(label)} = {value?1:0}</text></g>)}
  <Edge d='M160 215V245H560V215' active={scenario==='apply'&&k>=2} dashed={scenario!=='apply'}/><text x={310} y={232} className='exp-small'>{scenario==='apply'?'cap_set_proc()':'nessuna applicazione'}</text>
  <Box x={30} y={305} w={220} title='bind(fd, porta 80)' sub='richiesta dal programma' fill={c.amber}/>
  <Edge d='M255 365H775' active={k>=3}/>
  <rect x={710} y={300} width={140} height={120} rx={12} fill={k>=4?(a.allowed?c.green:c.red):c.paper} stroke={c.line}/>
  <text x={730} y={330} className='exp-label'>Controllo E</text>
  <g data-permission-gate transform={`translate(730 365) rotate(${mix(k>=4&&a.effective?-80:0,b.phase>=4&&b.effective?-80:0,t)})`}><rect x={-6} y={-30} width={12} height={60} rx={5} fill={k>=4&&a.allowed?'#278b70':'#b94e46'}/></g>
  <text x={30} y={455} className='exp-small'>{scenario==='drop'?'E resta attivo dopo DROP B. P può restare fuori da B: E ⊆ P ⊆ B non è un invariante.':'La porta 80 è privilegiata in questa prova. Non vengono modificati permessi reali.'}</text>
  {k<2&&scenario==='apply'&&<Probe x={mix(150,k===1?560:150,t)} y={245} label='apply'/>}
  {k>=2&&k<5&&<Probe x={mix(k===2?275:k===3?660:a.allowed?800:660,k===2?660:a.effective?800:660,t)} y={365} label='bind'/>}
 </>}
 {k>=5&&<Result text={mode==='pid'?(scenario==='stale'?'getpid() = 1; ps legge ancora i PID host':'Vista dei processi coerente con la procfs selezionata'):a.result} ok={a.allowed}/>}
 </g></Scene>;
}
export function AosContainerLab({id,title}:{id:string;title:string}) {
 const [mode,setMode]=useState<ContainerMode>('pid'),[scenario,setScenario]=useState('fresh'),[path,setPath]=useState('/etc/passwd');
 const [time,setTime]=useState(0),[running,setRunning]=useState(false),[delay,setDelay]=useState(2400);
 const frames=useMemo(()=>containerTrace(mode,scenario,path),[mode,scenario,path]),last=frames.length-1,step=Math.min(last,Math.floor(time)),a=frames[step],b=frames[Math.min(last,step+1)],playing=running&&time<last;
 useEffect(()=>{if(!playing)return;let raf=0,previous=0,elapsed=0;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const tick=(now:number)=>{if(previous){const dt=Math.min(now-previous,100);if(reduced){elapsed+=dt;if(elapsed>=delay){setTime(v=>Math.min(last,Math.floor(v)+1));elapsed=0;}}else setTime(v=>Math.min(last,v+dt/delay));}previous=now;raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);},[playing,delay,last]);
 const reset=()=>{setRunning(false);setTime(0);};
 return <div className='container-experiments'><VisualPlayer design="architecture" id={id} title={title} frame={a} step={step} count={frames.length} onStep={n=>{setRunning(false);setTime(n);}} transport={{playing,delay,setDelay,stop:()=>setRunning(false),toggle:()=>{if(time>=last)setTime(0);setRunning(!playing);}}} options={<>
  <label>Scena<select aria-label='Scena container' value={mode} onChange={e=>{const m=e.target.value as ContainerMode;reset();setMode(m);setScenario(experimentDefault(m));}}>{Object.entries(containerModes).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
  <label>Esperimento<select aria-label='Esperimento container' value={scenario} onChange={e=>{reset();setScenario(e.target.value);}}>{experiments[mode].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
  {mode==='mount'&&<label>Percorso<select aria-label='Percorso da risolvere' value={path} onChange={e=>{reset();setPath(e.target.value);}}><option>/etc/passwd</option><option>/oldroot/etc/passwd</option></select></label>}
  <button type='button' className='exp-run' onClick={()=>{setTime(0);setRunning(true);}}>Prova configurazione</button>
 </>} scene={<ExperimentScene mode={mode} scenario={scenario} path={path} a={a} b={b} t={time-step} time={time}/>} checks={[{label:'Stesse identità, viste o condizioni diverse',ok:true},{label:step===last?'Esito calcolato dalla configurazione':'Prima prevedi, poi confronta l’esito',ok:true}]} legend='Le prove sono modelli deterministici: nessun comando reale. Cambia la configurazione e ripeti mantenendo la stessa domanda.'/></div>;
}
