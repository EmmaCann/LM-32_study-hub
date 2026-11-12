'use client';
import { useEffect, useId, useRef, useState, type ReactNode, type CSSProperties } from 'react';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';
import type { Frame } from './aos-models';

export function useLabTransport(count: number, step: number, setStep: (n: number) => void) {
  const [running, setRunning] = useState(false);
  const [delay, setDelay] = useState(2400);
  const playing = running && step < count - 1;
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => setStep(step + 1), delay);
    return () => clearTimeout(timer);
  }, [playing, step, delay, setStep]);
  const stop = () => setRunning(false);
  return { playing, delay, setDelay, stop, toggle: () => { if (step === count-1) setStep(0); setRunning(!playing); } };
}
export function useSceneClock(playing: boolean) {
  const [time, setTime] = useState(0);
  useEffect(() => {
    if (!playing || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0, previous = 0, accumulator = 0;
    const frame = (now: number) => {
      if (previous) accumulator += Math.min(now-previous,100);
      previous = now;
      if (accumulator >= 40) { const dt=accumulator; setTime(t=>t+dt); accumulator=0; }
      raf=requestAnimationFrame(frame);
    };
    raf=requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [playing]);
  return time;
}
export type VisualCheck = { label: string; ok: boolean; note?: string };
type Transport = ReturnType<typeof useLabTransport>;
export function VisualPlayer({id,title,frame,step,count,onStep,transport,options,scene,checks,legend}: {
  id:string;title:string;frame:Frame;step:number;count:number;onStep:(n:number)=>void;
  transport:Transport;options:ReactNode;scene:ReactNode;checks:VisualCheck[];legend:string;
}) {
  const [expanded,setExpanded]=useState(false),[zoom,setZoom]=useState(1);
  const root=useRef<HTMLElement>(null);
  useEffect(()=>{
    if(!expanded)return;
    const previous=document.body.style.overflow;document.body.style.overflow='hidden';
    root.current?.focus();
    return()=>{document.body.style.overflow=previous;};
  },[expanded]);
  function move(n:number){transport.stop();onStep(Math.max(0,Math.min(count-1,n)));}
  return <section ref={root} tabIndex={-1} id={id} data-visual-version="2" data-playing={transport.playing} className={`simulation aos-lab aos-theatre ${expanded?'is-expanded':''}`} aria-label={title} onKeyDown={e=>{
    if(e.key==='Escape')setExpanded(false);
    if((e.target as HTMLElement).closest('input,select,button'))return;
    if(e.key==='ArrowRight'){e.preventDefault();move(step+1);}
    if(e.key==='ArrowLeft'){e.preventDefault();move(step-1);}
  }}>
    <header className="theatre-heading"><div><span className="eyebrow">AOS / ESPLORAZIONE ANIMATA</span><h3>{title}</h3></div><button type="button" className="theatre-expand" onClick={()=>setExpanded(!expanded)} aria-label={expanded?'Riduci scena':'Espandi scena'}>{expanded?<Minimize2 size={17}/>:<Maximize2 size={17}/>}<span>{expanded?'Riduci':'Espandi'}</span></button></header>
    <div className="aos-options theatre-options">{options}</div>
    <div className="theatre-layout">
      <div className="theatre-stage"><div className="theatre-viewport" style={{'--scene-zoom':zoom} as CSSProperties}>{scene}</div><div className="theatre-caption"><span>{legend}</span><div className="theatre-zoom"><button type="button" aria-label="Riduci zoom" disabled={zoom<=1} onClick={()=>setZoom(Math.max(1,zoom-.5))}><ZoomOut size={16}/></button><output>{Math.round(zoom*100)}%</output><button type="button" aria-label="Ingrandisci scena" disabled={zoom>=3} onClick={()=>setZoom(Math.min(3,zoom+.5))}><ZoomIn size={16}/></button></div></div></div>
      <aside className="theatre-inspector"><span className="eyebrow">COSA STA SUCCEDENDO</span><div className="theatre-step-title"><span>{String(step+1).padStart(2,'0')}</span><h4>{frame.title}</h4></div><p className="theatre-description" aria-live="polite">{frame.detail}</p><div className="theatre-checks"><h5>Relazioni da osservare</h5>{checks.map(c=><div key={c.label} className={c.ok?'check-pass':'check-fail'}><b aria-label={c.ok?'Rispettata':'Non rispettata'}>{c.ok?'✓':'×'}</b><div>{c.label}{c.note&&<small>{c.note}</small>}</div></div>)}</div></aside>
    </div>
    <div className="theatre-controls"><div className="theatre-buttons"><button type="button" aria-label="Indietro" disabled={step===0} onClick={()=>move(step-1)}><ChevronLeft size={18}/><span>Indietro</span></button><button type="button" className="theatre-play" aria-label={transport.playing?'Pausa':'Riproduci animazione'} onClick={transport.toggle}>{transport.playing?<Pause size={17}/>:<Play size={17}/>}<span>{transport.playing?'Pausa':'Riproduci'}</span></button><button type="button" aria-label="Avanti" disabled={step===count-1} onClick={()=>move(step+1)}><span>Avanti</span><ChevronRight size={18}/></button><button type="button" aria-label="Reset" onClick={()=>move(0)}><RotateCcw size={17}/><span>Reset</span></button></div><label className="theatre-speed">Ritmo<select aria-label="Velocità animazione" value={transport.delay} onChange={e=>transport.setDelay(Number(e.target.value))}><option value={3600}>Lento</option><option value={2400}>Normale</option><option value={1300}>Veloce</option></select></label><output className="theatre-progress">{step+1} / {count}</output></div>
    <label className="theatre-timeline"><span>Esplora i passaggi</span><input type="range" aria-label="Passaggio" min={0} max={count-1} value={step} onChange={e=>move(Number(e.target.value))}/></label>
    <details className="theatre-details"><summary>Contatori e stato del modello</summary><dl className="aos-values">{Object.entries(frame.values).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></details>
    <p className="aos-note theatre-note">Frecce ← → per i passaggi. Ingrandisci la scena per esplorarla su schermi piccoli. Il movimento rappresenta il modello, non i tempi reali dell’hardware.</p>
  </section>;
}
export function Scene({title,children,playing=false,height=500}:{title:string;children:ReactNode;playing?:boolean;height?:number}){
  const ref=useRef<SVGSVGElement>(null),uid=useId().replaceAll(':','');
  useEffect(()=>{if(playing)ref.current?.unpauseAnimations();else ref.current?.pauseAnimations();},[playing]);
  return <svg ref={ref} className="aos-scene" viewBox={`0 0 900 ${height}`} role="img" aria-label={title} data-scene={title}>
    <defs><pattern id={`grid-${uid}`} width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="currentColor" opacity=".12"/></pattern></defs>
    <rect width="900" height={height} className="scene-background"/><rect width="900" height={height} fill={`url(#grid-${uid})`}/>{children}
  </svg>;
}
export function NodeBox({x,y,w=170,h=85,title,sub,tone='blue',active=false}:{x:number;y:number;w?:number;h?:number;title:string;sub?:string;tone?:string;active?:boolean}){
 return <g className={`scene-node tone-${tone} ${active?'node-lit':''}`}><rect x={x} y={y} width={w} height={h} rx="14"/><rect x={x+12} y={y+16} width="4" height={h-32} rx="2" className="node-accent"/><text x={x+27} y={y+34} className="scene-title">{title}</text>{sub&&<text x={x+27} y={y+58} className="scene-small">{sub}</text>}</g>;
}
export function Wire({d,active=false,tone='blue',label,x,y}:{d:string;active?:boolean;tone?:string;label?:string;x?:number;y?:number}){
 const uid=useId().replaceAll(':','');
 return <g className={`scene-wire tone-${tone} ${active?'wire-lit':''}`}><defs><marker id={`arrow-${uid}`} markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6Z" fill="currentColor"/></marker></defs><path d={d} fill="none" markerEnd={`url(#arrow-${uid})`}/>{label&&<text x={x} y={y} className="scene-small wire-label">{label}</text>}</g>;
}
export function MovingToken({x,y,label,tone='blue',small=false,delay=0}:{x:number;y:number;label:string;tone?:string;small?:boolean;delay?:number}){
 const width=small?40:Math.max(88,label.length*8+24);
 return <g className={`moving-token tone-${tone}`} data-moving-object={label} style={{transform:`translate(${x}px,${y}px)`,transitionDelay:`${delay}ms`}}><rect x={-width/2} y={small?-13:-19} width={width} height={small?26:38} rx={small?7:10}/><text y="5" textAnchor="middle" className={small?'scene-small':'scene-title'}>{label}</text></g>;
}
export function Signal({path,tone='teal',delay='0s'}:{path:string;tone?:string;delay?:string}){
 return <g className={`signal tone-${tone}`}><circle r="6" fill="currentColor"><animateMotion dur="1.8s" begin={delay} repeatCount="indefinite" path={path}/></circle></g>;
}
