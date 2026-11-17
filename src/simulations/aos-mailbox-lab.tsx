'use client';
import {useEffect,useId,useState} from 'react';
import {Scene,VisualPlayer} from './aos-visual-player';
import {Header,MemorySlab,Wire,Signal,P,mix,clamp} from './aos-architecture-primitives';
import {mailboxPositions,mailboxFrames} from './aos-mailbox-model';
import './aos-visual.css';
import './aos-modules.css';
export function AosMailboxLab({id,title}:{id:string;title:string}){
 const[registration,setRegistration]=useState(false),[alternative,setAlternative]=useState(false),[time,setTime]=useState(0),[running,setRunning]=useState(false),[delay,setDelay]=useState(2200);
 const uid=useId().replaceAll(':',''),step=Math.min(5,Math.floor(time)),playing=running&&time<5,frames=mailboxFrames(registration,alternative);
 const reset=()=>{setRunning(false);setTime(0);};
 useEffect(()=>{if(!playing)return;let raf=0,last=0,elapsed=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;const tick=(now:number)=>{if(last){const dt=Math.min(100,now-last);if(reduced){elapsed+=dt;if(elapsed>=delay){setTime(v=>Math.min(5,Math.floor(v)+1));elapsed=0;}}else setTime(v=>Math.min(5,v+dt/delay));}last=now;raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);},[playing,delay]);
 const positions=mailboxPositions(alternative,step),next=mailboxPositions(alternative,Math.min(5,step+1)),fraction=time-step;
 const card=(x:number,y:number,label:string,sub:string,color:string)=><g transform={`translate(${x} ${y})`}><path d='M0 0H185L200 15V88H0Z' fill='#142b43' stroke={color} strokeWidth={2}/><text x={15} y={30} className='mod-label'>{label}</text><text x={15} y={62} className='mod-tiny'>{sub}</text></g>;
 return <div className='modules-lab'><VisualPlayer id={id} title={title} design='architecture' frame={frames[step]} step={step} count={6} onStep={n=>{reset();setTime(n);}} transport={{playing,delay,setDelay,stop:()=>setRunning(false),toggle:()=>{if(time>=5)setTime(0);setRunning(!playing);}}}
 options={<><nav className='mod-tabs' aria-label='Esperimenti mailbox'><button aria-pressed={!registration} onClick={()=>{reset();setAlternative(false);setRegistration(false);}}>Buffer e aperture</button><button aria-pressed={registration} onClick={()=>{reset();setAlternative(false);setRegistration(true);}}>Registrazione e rollback</button></nav><label><input type='checkbox' checked={alternative} onChange={e=>{reset();setAlternative(e.target.checked);}}/>{registration?'Fai fallire class_create':'Condividi struct file con dup'}</label></>}
 scene={<Scene title={registration?'Registrazione del driver':'Posizioni e buffer mailbox'} height={610}><g className='module-canvas' data-mailbox-scene={registration?'registration':'read'} data-time={time.toFixed(4)}>
 <Header kicker='AOS 12 / CHARACTER DEVICES' title={registration?'Registrazione e rollback del driver':'Un buffer kernel, due descrittori'} subtitle='Modello delle fonti: nessun modulo Linux viene eseguito nel browser.'/>
 {!registration?<>
 <path d='M30 130H870V300H30Z' fill='#0e2034' stroke={P.line}/><text x={45} y={155} className='mod-tiny'>USER SPACE · BUFFER DESTINAZIONE DEI PROCESSI</text>
 {card(75,185,'Processo A','fd A · read(..., 5)',P.cyan)}{card(620,185,'Processo B','fd B · read(..., 5)',P.violet)}
 <path d='M30 320H870V540H30Z' fill='#0a1728' stroke={P.line}/><text x={45} y={345} className='mod-tiny'>KERNEL SPACE · MESSAGGIO CONDIVISO</text>
 <MemorySlab x={125} y={390} w={650} h={90} titleY={25} label='mbox[256] · mbox_len = 12' sub='' uid={uid} color={P.amber}/>
 <text x={450} y={375} textAnchor='middle' className='mod-tiny'>{alternative?'Una struct file condivisa: un solo f_pos':'Due struct file: due f_pos indipendenti'}</text>
 {'hello world\n'.split('').map((c,i)=><g key={i}><rect x={160+i*43} y={435} width={39} height={33} fill='#12293e' stroke={P.line}/><text x={179+i*43} y={458} textAnchor='middle' className='mod-label'>{c==='\n'?'↵':c===' '?'␣':c}</text></g>)}
 {[0,1].map(i=><g key={i} data-cursor={i} transform={`translate(${160+mix(positions[i],next[i],fraction)*43} ${i?519:493})`}><path d='M-7 8L0-4L7 8Z' fill={i?P.violet:P.cyan}/><text x={10} y={9} className='mod-tiny' style={{fill:i?P.violet:P.cyan}}>{i?'B':'A'}</text></g>)}
 <Wire d='M175 390V275M720 390V275' color={P.cyan}/>
 {step<4&&!(alternative&&step>=3)&&<Signal uid={uid} probe='experiment' points={step===1?[[620,430],[720,350],[720,275]]:[[350,430],[175,350],[175,275]]} t={clamp(fraction)} tag='copia byte' color={step===1?P.violet:P.cyan}/>}
 <text x={450} y={575} textAnchor='middle' className='mod-label'>A = {positions[0]} · B = {positions[1]} · le letture non consumano il messaggio</text>
 </>:<>
 <Wire d='M155 250H740V445H155' color={P.cyan}/>
 {card(60,165,'dev_t',step>=1&&!(alternative&&step===5)?'numeri riservati':'numeri liberi',P.cyan)}
 {card(590,165,'cdev / fops',step>=2&&!(alternative&&step>=4)?'callback raggiungibili':'non registrata',P.violet)}
 {card(590,390,'class',alternative&&step>=3?'IS_ERR → PTR_ERR':step>=3?'classe creata':'non acquisita',alternative?P.red:P.green)}
 {card(60,390,'device / sysfs',!alternative&&step>=4?'registrato':'non acquisito',P.amber)}
 <g data-experiment-probe transform={`translate(${alternative&&time>=3?mix(690,160,clamp((time-3)/2)):mix(160,690,clamp(time/2))} ${alternative&&time>=3?350:290})`}><path d='M-52-19H52V19H-52Z' fill='#24435d' stroke={alternative&&step>=3?P.red:P.cyan} strokeWidth={2}/><text textAnchor='middle' y={5} className='mod-tiny'>{alternative&&step>=3?'UNDO':'mbox_fops'}</text></g>
 <text x={450} y={550} textAnchor='middle' className='mod-label'>{alternative&&step===5?'init fallita: exit non chiamata':step===5?'Init riuscita: rimozione in ordine inverso':'Stato e buffer devono essere pronti prima di cdev_add'}</text>
 </>}
 </g></Scene>} checks={[{label:'Il nodo /dev non contiene il messaggio',ok:true},{label:registration?'Init fallita pulisce da sola le proprie risorse':'dup condivide la posizione; open indipendenti la separano',ok:true}]} legend='Avanza o riproduci. Tempi e collegamenti sono illustrativi; il driver base non sincronizza gli accessi concorrenti.'/></div>;
}
