'use client';
import { useState, useSyncExternalStore } from 'react';
import type { Exercise } from '@/lib/schema';
import './code-completion.css';
const subscribeReady = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export function CodeCompletion({exercise:e}:{exercise:Exercise}) {
 const spec=e.completion!;
 const ready=useSyncExternalStore(subscribeReady,clientReady,serverReady);
 const [values,setValues]=useState<Record<string,string>>({});
 const [checked,setChecked]=useState(false),[hints,setHints]=useState(0),[solution,setSolution]=useState(false);
 const correct=(id:string)=>spec.slots.find(s=>s.id===id)!.answers.some(a=>a.trim() === (values[id]??'').trim());
 const chunks=spec.code.split(/(\{\{[a-z][a-z0-9-]*\}\})/g);
 return <section id={e.id} className="exercise panel code-completion">
  <div className="eyebrow">AOS · COMPLETA IL CODICE {spec.language.toUpperCase()}</div>
  <h2>{e.title}</h2><p>{e.prompt}</p>
  <p className="callout">Correzione guidata dei campi nel browser. Codice Linux di riferimento: non compilato e non eseguito qui. Il confronto accetta le forme indicate dalla consegna; non certifica programmi C arbitrari.</p>
  <pre className="completion-editor" aria-label={`Codice da completare: ${e.title}`}><code>{chunks.map((part,i)=>{
   const match=part.match(/^\{\{(.+)\}\}$/);if(!match)return <span key={i}>{part}</span>;
   const slot=spec.slots.find(s=>s.id===match[1])!;
   return <input key={slot.id} disabled={!ready} aria-label={slot.label} autoComplete="off" spellCheck={false}
    value={values[slot.id]??''} placeholder={slot.label}
    aria-invalid={checked&&!correct(slot.id)} style={{width:`${Math.max(12,Math.min(42,(values[slot.id]||slot.label).length+2))}ch`}}
    onChange={event=>{const value=event.target.value;setValues(previous=>({...previous,[slot.id]:value}));setChecked(false);}}/>;
  })}</code></pre>
  <div className="actions">
   <button className="button primary" disabled={!ready} onClick={()=>setChecked(true)}>Correggi i campi</button>
   <button className="button secondary" disabled={hints>=e.hints.length} onClick={()=>setHints(hints+1)}>Suggerimento {Math.min(hints+1,e.hints.length)}/{e.hints.length}</button>
   <button className="button secondary" aria-expanded={solution} onClick={()=>setSolution(!solution)}>{solution?'Nascondi soluzione':'Mostra soluzione commentata'}</button>
   <button className="button secondary" onClick={()=>{setValues({});setChecked(false);setHints(0);setSolution(false);}}>Ricomincia</button>
  </div>
  {checked&&<div role="status"><p><strong>{spec.slots.filter(s=>correct(s.id)).length}/{spec.slots.length} campi corretti</strong></p><ul>{spec.slots.map(s=><li key={s.id}>{s.label}: {correct(s.id)?'corretto':'da rivedere'}. {s.explanation}</li>)}</ul></div>}
  {e.hints.slice(0,hints).map(h=><p className="callout" key={h}>{h}</p>)}
  {solution&&<div className="solution"><h3>Una soluzione di riferimento</h3><pre><code>{spec.code.replace(/\{\{(.+?)\}\}/g,(_,id)=>spec.slots.find(s=>s.id===id)!.answers[0])}</code></pre><p>{e.explanation}</p></div>}
 </section>;
}
