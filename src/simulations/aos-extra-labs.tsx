'use client';
import { useState } from 'react';
import { addressTrace, decodeTrace, interruptTrace, timingTrace, type AddressMode } from './aos-extra-models';
export const extraComponents=['aos-decode','aos-time','aos-interrupts','aos-addresses','aos-memory-slot'] as const;
export type ExtraComponent=typeof extraComponents[number];
export function AosExtraLab({id,title,component}:{id:string;title:string;component:ExtraComponent}){
 const [step,setStep]=useState(0),[word,setWord]=useState(0x002080b3),[mips,setMips]=useState(100),[period,setPeriod]=useState(1000),[masked,setMasked]=useState(false),[mode,setMode]=useState<AddressMode>('cpu'),[valid,setValid]=useState(true);
 const change=(fn:()=>void)=>{fn();setStep(0);};
 const frames=component==='aos-decode'?decodeTrace(word):component==='aos-time'?timingTrace(mips,period):component==='aos-interrupts'?interruptTrace(masked):addressTrace(component==='aos-memory-slot'?'slot':mode,valid);
 const labels=component==='aos-decode'?['opcode','rd','funct3','rs1','rs2','funct7']:component==='aos-time'?['CPU modello','TIM2','LED','Misure']:component==='aos-interrupts'?['Dispositivo fisico','Host / driver','Controller virtuale','Handler guest']:component==='aos-memory-slot'?['Mapping host','Limiti slot','Stessi byte']:mode==='cpu'?['CPU / GVA','Page table / GPA','EPT / HPA']:['Dispositivo / IOVA','IOMMU','RAM o fault'];
 const frame=frames[step];
 return <section id={id} className="simulation panel aos-lab aos-extra-lab" aria-label={title}>
 <div className="simulation-header"><div><span className="eyebrow">LABORATORIO AOS · MODELLO DIDATTICO</span><h3>{title}</h3></div><span className="badge">{step+1} / {frames.length}</span></div>
 <div className="aos-options">
 {component==='aos-decode'&&<label>Parola ADD<select value={word} onChange={e=>change(()=>setWord(Number(e.target.value)))}><option value={0x002080b3}>0x002080B3 · add x1, x1, x2</option><option value={0x003101b3}>0x003101B3 · add x3, x2, x3</option></select></label>}
 {component==='aos-time'&&<><label>MIPS del modello<select value={mips} onChange={e=>change(()=>setMips(Number(e.target.value)))}>{[50,100,200].map(n=><option key={n}>{n}</option>)}</select></label><label>Periodo timer (ms virtuali)<select value={period} onChange={e=>change(()=>setPeriod(Number(e.target.value)))}>{[125,500,1000,4000].map(n=><option key={n}>{n}</option>)}</select></label></>}
 {component==='aos-interrupts'&&<label>Accettazione iniziale guest<select value={masked?'masked':'ready'} onChange={e=>change(()=>setMasked(e.target.value==='masked'))}><option value="ready">Pronto</option><option value="masked">Interrupt inizialmente mascherato</option></select></label>}
 {component==='aos-addresses'&&<label>Percorso<select value={mode} onChange={e=>change(()=>setMode(e.target.value as AddressMode))}><option value="cpu">CPU: GVA → GPA → HPA</option><option value="dma">DMA: IOVA → IOMMU → HPA</option></select></label>}
 {(component==='aos-memory-slot'||component==='aos-addresses'&&mode==='dma')&&<label>Richiesta<select value={valid?'valid':'invalid'} onChange={e=>change(()=>setValid(e.target.value==='valid'))}><option value="valid">Consentita</option><option value="invalid">Fuori intervallo / non autorizzata</option></select></label>}
 </div>
 <ol className="aos-flow" aria-label="Percorso e fase attiva">{labels.map((l,i)=><li key={l} aria-current={frame.active===i?'step':undefined}>{l}</li>)}</ol>
 <div className="aos-state" aria-live="polite" aria-atomic="true"><h4>{frame.title}</h4><p>{frame.detail}</p><dl className="aos-values">{Object.entries(frame.values).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>{frame.items&&<div className="aos-items">{frame.items.map(t=><span key={t}>{t}</span>)}</div>}</div>
 <div className="player-controls aos-controls"><button type="button" disabled={step===0} onClick={()=>setStep(step-1)}>Indietro</button><button type="button" onClick={()=>setStep(0)}>Reset</button><button type="button" disabled={step===frames.length-1} onClick={()=>setStep(step+1)}>Avanti</button></div>
 <label className="aos-scrub">Passaggio<input aria-label="Passaggio" type="range" min={0} max={frames.length-1} value={step} onChange={e=>setStep(Number(e.target.value))}/></label>
 <p className="aos-note">Avanti/Indietro, reset e cursore da tastiera. Cambiare scenario riporta all’inizio. Valori didattici, nessuna misura di prestazioni reali.</p>
 </section>;
}
