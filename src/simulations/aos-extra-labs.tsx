'use client';
import { useCallback, useState, type ReactNode } from 'react';
import { addressTrace, decodeTrace, interruptTrace, timingTrace, type AddressMode } from './aos-extra-models';
import { AddressScene, DecodeScene, InterruptScene, MemoryScene, TimerScene } from './aos-extra-scenes';
import { useLabTransport, VisualPlayer, type VisualCheck } from './aos-visual-player';
export const extraComponents=['aos-decode','aos-time','aos-interrupts','aos-addresses','aos-memory-slot'] as const;
export type ExtraComponent=typeof extraComponents[number];
export function AosExtraLab({id,title,component}:{id:string;title:string;component:ExtraComponent}){
 const [step,setStep]=useState(0),[word,setWord]=useState(0x002080b3),[mips,setMips]=useState(100),[period,setPeriod]=useState(1000),[masked,setMasked]=useState(false),[mode,setMode]=useState<AddressMode>('cpu'),[valid,setValid]=useState(true),[clockEpoch,setClockEpoch]=useState(0);
 const onStep=useCallback((n:number)=>{setStep(n);if(n===0)setClockEpoch(e=>e+1);},[]);
 const frames=component==='aos-decode'?decodeTrace(word):component==='aos-time'?timingTrace(mips,period):component==='aos-interrupts'?interruptTrace(masked):addressTrace(component==='aos-memory-slot'?'slot':mode,valid);
 const transport=useLabTransport(frames.length,step,onStep),frame=frames[step];
 const change=(fn:()=>void)=>{transport.stop();onStep(0);fn();};
 let scene:ReactNode,checks:VisualCheck[],legend:string;
 switch(component){
 case 'aos-decode':scene=<DecodeScene word={word} step={step} playing={transport.playing}/>;checks=[{label:'I sei campi coprono 32 bit',ok:true},{label:'Opcode e funzioni identificano ADD',ok:(word&127)===51&&(word>>>25)===0}];legend='Ogni segmento mantiene i propri bit mentre esce dalla parola.';break;
 case 'aos-time':scene=<TimerScene key={`${clockEpoch}-${mips}-${period}`} mips={mips} period={period} playing={transport.playing} step={step}/>;checks=[{label:'MIPS e clock del timer distinti',ok:true},{label:'Due update per un ciclo completo del LED',ok:true},{label:'Tempo host da misurare separatamente',ok:true}];legend='Riproduci: il timer ruota, l’update raggiunge il LED, il carico CPU si completa. Scala rallentata.';break;
 case 'aos-interrupts':scene=<InterruptScene frame={frame} step={step} masked={masked} playing={transport.playing}/>;checks=[{label:'Pendente non significa handler in esecuzione',ok:!(Number(frame.values['Interrupt virtuale pendente'])&&frame.active===3)},{label:'Handler host e guest distinti',ok:true}];legend='Il pacchetto attraversa i domini. Se mascherato si ferma al cancello. EOI percorre la strada di ritorno.';break;
 case 'aos-addresses':scene=<AddressScene mode={mode} valid={valid} step={step} playing={transport.playing}/>;checks=[{label:'CPU e DMA: traduzioni distinte',ok:true},{label:'DMA non autorizzato bloccato prima della RAM',ok:mode==='cpu'||valid||frame.values.Esito!=='HPA 0x9000'}];legend='Viola: CPU. Verde: DMA. Rosso: fault. I percorsi autorizzati raggiungono gli stessi byte.';break;
 case 'aos-memory-slot':scene=<MemoryScene valid={valid} step={step} playing={transport.playing}/>;checks=[{label:'Stesso offset, stessi byte nelle due viste',ok:true},{label:'Il limite superiore dello slot è escluso',ok:valid||frame.values.Esito!=='HVA 0x70010000'}];legend='Due scale sullo stesso backing. La sonda individua l’indirizzo e il byte corrispondente.';break;
 }
 const options=<>
 {component==='aos-decode'&&<label>Parola ADD<select aria-label="Parola ADD" value={word} onChange={e=>change(()=>setWord(Number(e.target.value)))}><option value={0x002080b3}>0x002080B3 · add x1, x1, x2</option><option value={0x003101b3}>0x003101B3 · add x3, x2, x3</option></select></label>}
 {component==='aos-time'&&<><label>MIPS del modello<select aria-label="MIPS del modello" value={mips} onChange={e=>change(()=>setMips(Number(e.target.value)))}>{[50,100,200].map(n=><option key={n}>{n}</option>)}</select></label><label>Periodo timer (ms virtuali)<select aria-label="Periodo timer" value={period} onChange={e=>change(()=>setPeriod(Number(e.target.value)))}>{[125,500,1000,4000].map(n=><option key={n}>{n}</option>)}</select></label></>}
 {component==='aos-interrupts'&&<label>Accettazione iniziale guest<select aria-label="Accettazione iniziale guest" value={masked?'masked':'ready'} onChange={e=>change(()=>setMasked(e.target.value==='masked'))}><option value="ready">Pronto</option><option value="masked">Interrupt inizialmente mascherato</option></select></label>}
 {component==='aos-addresses'&&<label>Percorso<select aria-label="Percorso indirizzi" value={mode} onChange={e=>change(()=>setMode(e.target.value as AddressMode))}><option value="cpu">CPU: GVA → GPA → HPA</option><option value="dma">DMA: IOVA → IOMMU → HPA</option></select></label>}
 {(component==='aos-memory-slot'||component==='aos-addresses'&&mode==='dma')&&<label>Richiesta<select aria-label="Richiesta" value={valid?'valid':'invalid'} onChange={e=>change(()=>setValid(e.target.value==='valid'))}><option value="valid">Consentita</option><option value="invalid">Fuori intervallo / non autorizzata</option></select></label>}
 </>;
 return <VisualPlayer id={id} title={title} frame={frame} step={step} count={frames.length} onStep={onStep} transport={transport} options={options} scene={scene} checks={checks} legend={legend}/>;
}
