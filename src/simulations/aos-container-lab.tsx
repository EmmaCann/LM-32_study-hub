'use client';
import {useEffect,useMemo,useState} from 'react';
import {VisualPlayer} from './aos-visual-player';
import {containerTrace,containerModes,experiments,experimentDefault,type ContainerMode} from './aos-container-model';
import './aos-container.css';
import {ContainerArchitectureScene} from './aos-container-scenes';
import {Users,FolderTree,Network,KeyRound} from 'lucide-react';
const icons={pid:Users,mount:FolderTree,network:Network,cap:KeyRound};
export function AosContainerLab({id,title}:{id:string;title:string}) {
 const [mode,setMode]=useState<ContainerMode>('pid'),[scenario,setScenario]=useState('fresh'),[path,setPath]=useState('/etc/passwd');
 const [time,setTime]=useState(0),[running,setRunning]=useState(false),[delay,setDelay]=useState(2400);
 const frames=useMemo(()=>containerTrace(mode,scenario,path),[mode,scenario,path]),last=frames.length-1,step=Math.min(last,Math.floor(time)),a=frames[step],b=frames[Math.min(last,step+1)],playing=running&&time<last;
 useEffect(()=>{if(!playing)return;let raf=0,previous=0,elapsed=0;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const tick=(now:number)=>{if(previous){const dt=Math.min(now-previous,100);if(reduced){elapsed+=dt;if(elapsed>=delay){setTime(v=>Math.min(last,Math.floor(v)+1));elapsed=0;}}else setTime(v=>Math.min(last,v+dt/delay));}previous=now;raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);},[playing,delay,last]);
 const reset=()=>{setRunning(false);setTime(0);};
 const choose=(m:ContainerMode)=>{reset();setMode(m);setScenario(experimentDefault(m));};
 return <div className='container-experiments'><VisualPlayer design="architecture" id={id} title={title} frame={a} step={step} count={frames.length} onStep={n=>{setRunning(false);setTime(n);}} transport={{playing,delay,setDelay,stop:()=>setRunning(false),toggle:()=>{if(time>=last)setTime(0);setRunning(!playing);}}} options={<>
  <nav className='container-tabs' aria-label='Architetture container'>{Object.entries(containerModes).map(([key,label])=>{const m=key as ContainerMode,Icon=icons[m];return <button key={key} type='button' aria-pressed={mode===m} onClick={()=>choose(m)}><Icon size={20}/><span>{label}</span></button>;})}</nav>
  <label>Scena<select aria-label='Scena container' value={mode} onChange={e=>{choose(e.target.value as ContainerMode);}}>{Object.entries(containerModes).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
  <label>Esperimento<select aria-label='Esperimento container' value={scenario} onChange={e=>{reset();setScenario(e.target.value);}}>{experiments[mode].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
  {mode==='mount'&&<label>Percorso<select aria-label='Percorso da risolvere' value={path} onChange={e=>{reset();setPath(e.target.value);}}><option>/etc/passwd</option><option>/oldroot/etc/passwd</option></select></label>}
  <button type='button' className='exp-run' onClick={()=>{setTime(0);setRunning(true);}}>Prova configurazione</button>
 </>} scene={<ContainerArchitectureScene mode={mode} scenario={scenario} path={path} a={a} b={b} t={time-step} time={time}/>} checks={[{label:'Stesse identità, viste o condizioni diverse',ok:true},{label:step===last?'Esito calcolato dalla configurazione':'Prima prevedi, poi confronta l’esito',ok:true}]} legend='Le prove sono modelli deterministici: nessun comando reale. Cambia la configurazione e ripeti mantenendo la stessa domanda.'/></div>;
}
