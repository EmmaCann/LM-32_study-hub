'use client';
import {useEffect,useMemo,useState} from 'react';
import {VisualPlayer} from './aos-visual-player';
import {memoryTrace,modes,experiments,defaultExperiment,type MemoryMode} from './aos-memory-model';
import {MemoryScene} from './aos-memory-scenes';
import {Cpu,Layers,Route,Wind,Copy,Timer} from 'lucide-react';
import './aos-memory.css';
const sceneIcons={shootdown:Cpu,buddy:Layers,walk:Route,balloon:Wind,ksm:Copy,latency:Timer};
export function AosMemoryLab({id,title}:{id:string;title:string}){
 const[mode,setMode]=useState<MemoryMode>('shootdown'),[scenario,setScenario]=useState(defaultExperiment('shootdown')),[amount,setAmount]=useState(4),[writer,setWriter]=useState('A');
 const[time,setTime]=useState(0),[running,setRunning]=useState(false),[delay,setDelay]=useState(2400);
 const frames=useMemo(()=>memoryTrace(mode,scenario,amount,writer),[mode,scenario,amount,writer]),last=frames.length-1,step=Math.min(last,Math.floor(time)),a=frames[step],b=frames[Math.min(last,step+1)],playing=running&&time<last;
 useEffect(()=>{if(!playing)return;let raf=0,previous=0,elapsed=0;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const tick=(now:number)=>{if(previous){const dt=Math.min(now-previous,100);if(reduced){elapsed+=dt;if(elapsed>=delay){setTime(v=>Math.min(last,Math.floor(v)+1));elapsed=0;}}else setTime(v=>Math.min(last,v+dt/delay));}previous=now;raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);},[playing,delay,last]);
 const reset=()=>{setRunning(false);setTime(0);};
 const choose=(m:MemoryMode)=>{reset();setMode(m);setScenario(defaultExperiment(m));setAmount(m==='latency'?6:4);setWriter('A');};
 return <div className='memory-experiments'><VisualPlayer id={id} title={title} frame={a} step={step} count={frames.length} onStep={n=>{setRunning(false);setTime(n);}} transport={{playing,delay,setDelay,stop:()=>setRunning(false),toggle:()=>{if(time>=last)setTime(0);setRunning(!playing);}}} options={<>
 <nav className='mem-scene-nav' aria-label='Laboratori memoria'>{Object.entries(modes).map(([key,label],j)=>{const m=key as MemoryMode,Icon=sceneIcons[m];return <button type='button' key={key} aria-pressed={mode===m} onClick={()=>choose(m)}><Icon size={20}/><span><small>0{j+1}</small>{label}</span></button>;})}</nav>
 <label>Scena<select aria-label='Scena memoria' value={mode} onChange={e=>{choose(e.target.value as MemoryMode);}}>{Object.entries(modes).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
 <label>Esperimento<select aria-label='Esperimento memoria' value={scenario} onChange={e=>{reset();setScenario(e.target.value);}}>{experiments[mode].map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
 {mode==='buddy'&&<label>Richiesta<select aria-label='Frame richiesti' value={amount} onChange={e=>{reset();setAmount(Number(e.target.value));}}>{[2,4,8].map(n=><option key={n} value={n}>{n} frame</option>)}</select></label>}
 {mode==='ksm'&&<label>Scrittore<select aria-label='Mapping che scrive' value={writer} onChange={e=>{reset();setWriter(e.target.value);}}><option value='A'>A scrive XYZ</option><option value='B'>B scrive XYZ</option><option value='none'>Nessuna scrittura</option></select></label>}
 {mode==='latency'&&<label>Deadline<select aria-label='Deadline' value={amount} onChange={e=>{reset();setAmount(Number(e.target.value));}}>{[3,4,5,6,8,9,10,12].map(n=><option key={n} value={n}>{n} unità</option>)}</select></label>}
 <button type='button' className='mem-run' onClick={()=>{setTime(0);setRunning(true);}}>Prova configurazione</button>
 </>} scene={<MemoryScene mode={mode} scenario={scenario} amount={amount} writer={writer} a={a} b={b} t={time-step} time={time}/>} checks={[{label:'Cambia le condizioni, prevedi l’esito, poi ripeti',ok:true},{label:a.result?'Vincolo della prova rispettato':'Identità e risorse distinte durante i passaggi',ok:a.ok}]} legend='Ciano: dati e accessi / Viola: traduzioni e riferimenti / Ambra: protocollo o attesa / Verde: risorsa libera o vincolo rispettato. Modello illustrativo.'/></div>;
}
