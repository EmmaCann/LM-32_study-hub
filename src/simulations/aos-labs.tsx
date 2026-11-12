'use client';
import { useState } from 'react';
import { cpuTrace, flagsTrace, kvmTrace, queueTrace, type Frame, type Mode } from './aos-models';
export const aosComponents = ['aos-flags', 'aos-cpu-cache', 'aos-virtqueue', 'aos-kvm-run'] as const;
export type AosComponent = typeof aosComponents[number];
export function AosLab({ id, title, component }: {id: string; title: string; component: AosComponent}) {
  const [step, setStep] = useState(0);
  const [corrected, setCorrected] = useState(false);
  const [n, setN] = useState(4);
  const [mode, setMode] = useState<Mode>('interpretazione');
  const [batch, setBatch] = useState(4);
  const [userExit, setUserExit] = useState(true);
  let frames: Frame[], labels: string[];
  switch (component) {
    case 'aos-flags': frames = flagsTrace(corrected); labels = ['Guest deprivilegiato', 'VMM / host']; break;
    case 'aos-cpu-cache': frames = cpuTrace(n, mode); labels = ['A · inizializzazione', 'B · corpo e branch', 'C · ECALL']; break;
    case 'aos-virtqueue': frames = queueTrace(8, batch); labels = ['Driver guest', 'Available', 'Backend host', 'Used', 'Notifica']; break;
    case 'aos-kvm-run': frames = kvmTrace(userExit); labels = ['VMM · host userspace', 'KVM · host kernel', 'Guest / vCPU']; break;
  }
  const current = Math.min(step, frames.length-1), frame = frames[current];
  const choose = (fn: () => void) => { fn(); setStep(0); };
  const move = (delta: number) => setStep(Math.max(0, Math.min(frames.length-1, current+delta)));
  return <section id={id} className="simulation panel aos-lab" aria-label={title}>
    <div className="simulation-header"><div><span className="eyebrow">LABORATORIO AOS · MODELLO DIDATTICO</span><h3>{title}</h3></div><span className="badge">{current+1} / {frames.length}</span></div>
    <div className="aos-options">
      {component === 'aos-flags' && <label>Percorso<select value={corrected ? 'corretto' : 'storico'} onChange={e => choose(() => setCorrected(e.target.value === 'corretto'))}><option value="storico">Solo trap-and-emulate: difetto storico</option><option value="corretto">Ripristino mediato dal VMM</option></select></label>}
      {component === 'aos-cpu-cache' && <><label>n iniziale<select value={n} onChange={e => choose(() => setN(Number(e.target.value)))}>{[1,2,4,8].map(i => <option key={i}>{i}</option>)}</select></label><label>Motore<select value={mode} onChange={e => choose(() => setMode(e.target.value as Mode))}><option value="interpretazione">Interprete</option><option value="cache">Traduzione con cache</option><option value="chaining">Cache e block chaining</option></select></label></>}
      {component === 'aos-virtqueue' && <label>Richieste per gruppo (8 totali)<select value={batch} onChange={e => choose(() => setBatch(Number(e.target.value)))}>{[1,2,4,8].map(i => <option key={i}>{i}</option>)}</select></label>}
      {component === 'aos-kvm-run' && <label>Seconda exit<select value={userExit ? 'user' : 'kernel'} onChange={e => choose(() => setUserExit(e.target.value === 'user'))}><option value="user">I/O da gestire nel VMM</option><option value="kernel">Evento risolto in KVM</option></select></label>}
    </div>
    {component === 'aos-cpu-cache' && <pre aria-label="Programma guest"><code>{'0:  ADDI x1, x0, 0\n4:  ADD  x1, x1, x2\n8:  ADDI x2, x2, -1\n12: BNE  x2, x0, -8\n16: ECALL'}</code></pre>}
    <ol className="aos-flow" aria-label="Componenti e fase attiva">{labels.map((label,i) => <li key={label} aria-current={frame.active === i ? 'step' : undefined}>{label}</li>)}</ol>
    <div className="aos-state" aria-live="polite" aria-atomic="true"><h4>{frame.title}</h4><p>{frame.detail}</p><dl className="aos-values">{Object.entries(frame.values).map(([key,value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
    {frame.items && <div className="aos-items" aria-label={component === 'aos-virtqueue' ? 'Stato richieste' : 'Blocchi in cache'}>{frame.items.length ? frame.items.map(item => <span key={item}>{item}</span>) : <span>Cache vuota</span>}</div>}</div>
    <div className="player-controls aos-controls"><button type="button" disabled={!current} onClick={() => move(-1)}>Indietro</button><button type="button" onClick={() => setStep(0)}>Reset</button><button type="button" disabled={current === frames.length-1} onClick={() => move(1)}>Avanti</button></div>
    <label className="aos-scrub">Passaggio<input aria-label="Passaggio" type="range" min={0} max={frames.length-1} value={current} onChange={e => setStep(Number(e.target.value))}/></label>
    <p className="aos-note">Usa Avanti/Indietro o le frecce sul cursore. Cambiare scenario riporta all’inizio. Nessuna animazione automatica; i contatori non misurano prestazioni reali.</p>
  </section>;
}
