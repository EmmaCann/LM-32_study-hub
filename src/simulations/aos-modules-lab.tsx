'use client';
import {useEffect,useId,useMemo,useState} from 'react';
import {Scene,VisualPlayer} from './aos-visual-player';
import {P,Header,Chip,MemorySlab,Wire,Signal,mix,clamp} from './aos-architecture-primitives';
import {moduleModes,moduleCases,modulesTrace,type ModuleMode,type ModuleFrame} from './aos-modules-model';
import './aos-visual.css';
import './aos-modules.css';
function Cartridge({x,y,label,color,sub}:{x:number;y:number;label:string;color:string;sub:string}){return <g transform={`translate(${x} ${y})`}><ellipse cy={55} rx={82} ry={12} fill='#020914' opacity={.5}/><path d='M-83-37H66L83-20V37H-83Z' fill='#183149' stroke={color} strokeWidth={2}/><path d='M-75-29H59L70-16V15H-75Z' fill='#0c192c' stroke={P.line}/>{[0,1,2,3,4,5,6,7].map(i=><rect key={i} x={-65+i*18} y={32} width={9} height={14} fill={color} opacity={.8}/>)}<text y={-6} textAnchor='middle' className='mod-label'>{label}</text><text y={17} textAnchor='middle' className='mod-tiny' style={{fill:color}}>{sub}</text></g>;}
function ModulesScene({mode,scenario,time,a}:{mode:ModuleMode;scenario:string;time:number;a:ModuleFrame}){
 const uid=useId().replaceAll(':',''),step=Math.min(6,Math.floor(time)),t=time-step;
 const probe=(points:readonly(readonly[number,number])[],start:number,end:number,tag:string,color=P.cyan)=><Signal uid={uid} probe='experiment' points={points} t={clamp((time-start)/(end-start))} tag={tag} color={color}/>;
 const lifePos=[[145,220],[400,220],[680,397],[680,397],[680,397],[400,488],[400,488]]as const;
 const early=scenario==='version'||scenario==='signature';const p=lifePos[step],q=lifePos[Math.min(6,step+1)];
 const x=early&&time>=1?400:scenario==='invalid'&&time>=3?mix(680,145,clamp((time-3)/2)):mix(p[0],q[0],t),y=early&&time>=1?220:scenario==='invalid'&&time>=3?mix(397,488,clamp((time-3)/2)):mix(p[1],q[1],t);
 return <Scene title={moduleModes[mode]} height={620}><defs><linearGradient id={`${uid}-chip`} x2='.3' y2='1'><stop stopColor='#25425f'/><stop offset='1' stopColor='#112138'/></linearGradient><filter id={`${uid}-glow`}><feGaussianBlur stdDeviation='2'/></filter></defs><g className='module-canvas' data-module-scene={mode} data-time={time.toFixed(4)}>
 <Header kicker='AOS 10 / KERNEL MODULES' title={moduleModes[mode]} subtitle='Modello didattico: nessun modulo kernel viene caricato o eseguito.'/>
 {mode==='lifecycle'&&<>
  <path d='M35 315H865V548H35Z' fill='#0b192b' stroke={P.line}/><text x={55} y={342} className='mod-tiny'>KERNEL SPACE · NESSUN PROCESSO SEPARATO PER IL MODULO</text>
  <path d='M55 160H235V268H55Z' fill='#14263d' stroke={P.line}/><path d='M75 180H215M75 192H215M75 204H215' stroke={P.line}/><text x={145} y={145} textAnchor='middle' className='mod-label'>FILE .ko</text>
  <Wire d='M235 220H480V397H585' color={P.cyan}/><text x={405} y={144} textAnchor='middle' className='mod-label'>LOADER</text><text x={405} y={169} textAnchor='middle' className='mod-tiny'>versione · policy · simboli</text>
  <path d='M480 202V265' stroke={early&&step>=1?P.red:P.green} strokeWidth={6} transform={`rotate(${!early&&time>1?-65:0} 480 265)`}/>
  <path d='M580 357H790V451H580Z' fill='#08121f' stroke={P.violet} strokeDasharray='5 4'/><text x={683} y={477} textAnchor='middle' className='mod-tiny'>{a.live?'LIVE · callback disponibili':a.init?'init completata o rollback':'socket codice kernel'}</text>
  <g data-experiment-probe opacity={scenario==='valid'&&time>=5?1-clamp(time-5):1} transform={`translate(${x} ${y})`}><Cartridge x={0} y={0} label='hello.ko' color={a.error?P.red:P.cyan} sub={a.live?'LIVE':a.error?'rifiutato':step>=5?'rilascio':'in transito'}/></g>
  <text x={65} y={375} className='mod-label'>{step===6?'Ultima configurazione (storico)':'Configurazione / variabili'}</text><text x={65} y={408} className='mod-code'>times = {scenario==='invalid'?20:3}</text><text x={65} y={435} className='mod-code'>name = {a.name}</text><text x={65} y={462} className='mod-tiny'>{a.init?'init invocata una volta':'init non ancora invocata'}</text>
  {scenario==='valid'&&step===4&&probe([[310,435],[440,435],[580,397]],4,5,'sysfs: Bob',P.violet)}
 </>}
 {mode==='dependency'&&<>
  <path d='M38 145H860V540H38Z' fill='#0c192b' stroke={P.line}/><text x={60} y={170} className='mod-tiny'>KERNEL · SPAZIO DI INDIRIZZAMENTO CONDIVISO</text>
  <Cartridge x={215} y={255} label='counter_user' color={a.consumer?P.violet:P.muted} sub={a.consumer?'caricato':'su disco / assente'}/>
  <Cartridge x={680} y={255} label='counter_provider' color={a.provider?P.green:P.muted} sub={a.provider?'export disponibile':'su disco / assente'}/>
  <Wire d='M300 255H595' color={a.ref?P.violet:P.line}/><text x={450} y={201} textAnchor='middle' className='mod-tiny'>advos_next_ticket() · riferimento</text>
  <MemorySlab x={565} y={382} w={240} h={77} label={a.provider?`ticket = ${a.ticket}`:'stato non residente'} sub={`Used by = ${a.ref}`} uid={uid} color={P.green}/><Wire d='M680 302V382' color={P.green}/>
  <path d='M455 285V339' stroke={a.error?P.red:P.line} strokeWidth={4}/><text x={450} y={360} textAnchor='middle' className='mod-tiny' style={{fill:a.error?P.red:P.muted}}>{scenario==='missing'?'export assente':step===3?'rmmod provider: IN USE':'dipendenza diretta user → provider'}</text>
  {probe(scenario==='missing'?[[300,255],[445,255]]:[[300,255],[595,255]],1,2,scenario==='missing'?'unknown symbol':'resolve',scenario==='missing'?P.red:P.cyan)}
  {a.consumer&&probe([[680,382],[680,335],[215,335],[215,305]],step>=5?5:2,step>=5?6:3,`ticket ${a.ticket-1},${a.ticket}`,P.green)}
  <text x={65} y={492} className='mod-code'>{scenario==='reload'?'Ricarica user: stato provider conservato':scenario==='reset'?'Ricarica entrambi: ticket riparte da zero':'Rimuovi prima user, poi provider'}</text>
 </>}
 {mode==='atomic'&&<>
  <Chip x={155} y={245} name='CPU A' sub={step>=1?'legge / RMW':'richiesta pronta'} uid={uid}/><Chip x={740} y={245} name='CPU B' sub={scenario==='atomic'&&step<3?'attende il suo RMW':'legge / RMW'} accent={P.violet} uid={uid}/>
  <MemorySlab x={330} y={380} w={240} h={100} label={`ticket = ${a.value}`} sub={scenario==='atomic'?'atomic_inc_return':'int: lettura, somma, scrittura'} uid={uid} color={P.amber}/>
  <Wire d='M155 320V429H330M740 320V429H570' color={P.cyan}/>
  {scenario==='atomic'?(time<1?probe([[155,320],[155,429],[330,429]],0,1,'RMW A'):probe([[330,429],[155,429],[155,320]],1,2,'ticket A = 6')):(time<1?probe([[155,320],[155,429],[330,429]],0,1,'read A'):time<2?probe([[330,429],[155,429],[155,320]],1,2,'A legge 5'):probe([[155,320],[155,429],[330,429]],2,3,'write A = 6'))}
  {scenario==='atomic'?(time<3?probe([[740,320],[740,429],[570,429]],2,3,time<2?'B attende':'RMW B',P.violet):probe([[570,429],[740,429],[740,320]],3,4,'ticket B = 7',P.violet)):(time<2?probe([[740,320],[740,429],[570,429]],1,2,time<1?'B pronto':'read B',P.violet):time<3?probe([[570,429],[740,429],[740,320]],2,3,'B legge 5',P.violet):probe([[740,320],[740,429],[570,429]],3,4,'write B = 6',P.violet))}
  <path d='M410 345V325Q410 290 450 290T490 325V345' fill='none' stroke={scenario==='atomic'?P.green:P.line} strokeWidth={5}/><rect x={397} y={334} width={106} height={37} rx={7} fill='#162c41' stroke={scenario==='atomic'?P.green:P.red}/><text x={450} y={359} textAnchor='middle' className='mod-tiny'>{scenario==='atomic'?'RMW ATOMICA':'RMW SEPARATA'}</text>
  <text x={155} y={174} textAnchor='middle' className='mod-label'>Ticket A: {step>=(scenario==='atomic'?2:3)?6:'—'}</text><text x={740} y={174} textAnchor='middle' className='mod-label'>Ticket B: {step>=4?(scenario==='atomic'?7:6):'—'}</text>
  <text x={450} y={528} textAnchor='middle' className='mod-tiny'>Il lucchetto rappresenta la semantica indivisibile; non è un mutex aggiunto al codice.</text>
 </>}
 <text x={35} y={588} className='mod-result' data-module-result={step===6?'final':'pending'} style={{fill:a.error?P.red:step===6?P.green:P.muted}}>{step===6?a.result:'Avanza o riproduci per osservare lo stesso oggetto attraverso gli stati.'}</text>
 </g></Scene>;
}
export function AosModulesLab({id,title}:{id:string;title:string}){
 const[mode,setMode]=useState<ModuleMode>('lifecycle'),[scenario,setScenario]=useState('valid'),[time,setTime]=useState(0),[running,setRunning]=useState(false),[delay,setDelay]=useState(2400);
 const frames=useMemo(()=>modulesTrace(mode,scenario),[mode,scenario]),step=Math.min(6,Math.floor(time)),playing=running&&time<6;
 const reset=()=>{setRunning(false);setTime(0);};
 useEffect(()=>{if(!playing)return;let raf=0,previous=0,elapsed=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;function tick(now:number){if(previous){const dt=Math.min(100,now-previous);if(reduced){elapsed+=dt;if(elapsed>=delay){setTime(v=>Math.min(6,Math.floor(v)+1));elapsed=0;}}else setTime(v=>Math.min(6,v+dt/delay));}previous=now;raf=requestAnimationFrame(tick);}raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);},[playing,delay]);
 return <div className='modules-lab'><VisualPlayer id={id} title={title} design='architecture' frame={frames[step]} step={step} count={7} onStep={n=>{reset();setTime(n);}} transport={{playing,delay,setDelay,stop:()=>setRunning(false),toggle:()=>{if(time>=6)setTime(0);setRunning(!playing);}}} options={<>
 <nav aria-label='Esperimenti moduli' className='mod-tabs'>{Object.entries(moduleModes).map(([m,label])=><button key={m} type='button' aria-pressed={mode===m} onClick={()=>{reset();setMode(m as ModuleMode);setScenario(moduleCases[m as ModuleMode][0][0]);}}>{label}</button>)}</nav>
 <label>Esperimento<select aria-label='Scenario moduli' value={scenario} onChange={e=>{reset();setScenario(e.target.value);}}>{moduleCases[mode].map(([s,label])=><option key={s} value={s}>{label}</option>)}</select></label><button type='button' onClick={()=>{setTime(0);setRunning(true);}}>Prova configurazione</button>
 </>} scene={<ModulesScene mode={mode} scenario={scenario} time={time} a={frames[step]}/>} checks={[{label:'Modello dichiarato, nessuna esecuzione di codice kernel',ok:true},{label:mode==='atomic'?'L’atomicità riguarda l’intera RMW':mode==='dependency'?'Used by conta riferimenti, non chiamate':'Cambiare name non riesegue init',ok:true}]} legend='Scegli un caso, prevedi il risultato e segui il codice o il dato. Ordine e tempi sono illustrativi, non una traccia interna completa di Linux.'/></div>;
}
