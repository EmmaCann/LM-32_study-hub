'use client';
import { AosContainerLab } from './aos-container-lab';
import { AosMemoryLab } from './aos-memory-lab';
import { useEffect, useState } from 'react';
import { AosLab } from './aos-labs';
import { AosExtraLab } from './aos-extra-labs';
import { AosBaremetalLab } from './aos-baremetal-labs';
import { AosPartitionLab } from './aos-partition-labs';
import { AlgoritmiSortingLab } from './algoritmi-sorting-lab';
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw } from 'lucide-react';
import type { Simulation } from '@/lib/schema';
const vmKernel = [
  'Il guest esegue sulla CPU fisica in modalità guest.',
  'Un evento provoca una VM exit: il controllo passa all’host.',
  'KVM gestisce l’evento nel kernel; non serve emulazione in userspace.',
  'KVM prepara il rientro nel guest, senza coinvolgere QEMU.',
  'La vCPU riprende l’esecuzione del guest.',
];
const vmUser = [
  'Il guest esegue sulla CPU fisica in modalità guest.',
  'Un accesso a un dispositivo emulato provoca una VM exit.',
  'KVM restituisce il controllo a userspace tramite KVM_RUN.',
  'QEMU emula l’operazione richiesta e richiama KVM_RUN.',
  'KVM rientra nel guest: la vCPU riprende l’esecuzione.',
];
const avl = [
  'Albero iniziale: 30 ha come figlio sinistro 20.',
  'Inseriamo 10 come figlio sinistro di 20.',
  'Il nodo 30 ha fattore di bilanciamento +2: caso sinistra-sinistra.',
  'Rotazione a destra su 30: 20 diventa la nuova radice.',
  'Albero bilanciato: 20 ha figli 10 e 30. Le chiavi restano ordinate.',
];
function VmDiagram({ step, user }: { step: number; user: boolean }) {
  const active = step === 0 || step === 4 ? 0 : step === 3 && user ? 2 : 1;
  return (
    <svg
      viewBox="0 0 640 230"
      role="img"
      aria-label={`Percorso VM exit, fase ${step + 1}, ${user ? 'con QEMU' : 'solo KVM'}`}
    >
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3z" fill="currentColor" />
        </marker>
      </defs>
      <path className="diagram-edge" d="M185 100 H245" markerEnd="url(#arrow)" />
      {user && <path className="diagram-edge" d="M395 100 H455" markerEnd="url(#arrow)" />}
      <path className="diagram-edge" d="M320 144 V190 H110 V145" markerEnd="url(#arrow)" />
      {['Guest / vCPU', 'KVM / kernel', 'QEMU / userspace'].map((label, i) => (
        <g
          key={label}
          className={active === i ? 'node current' : 'node'}
          opacity={!user && i === 2 ? 0.35 : 1}
        >
          <rect x={35 + i * 210} y="55" width="150" height="90" rx="15" />
          <text x={110 + i * 210} y="105" textAnchor="middle">
            {label}
          </text>
        </g>
      ))}
      <text x="320" y="220" textAnchor="middle" className="svg-caption">
        {user
          ? 'Percorso con emulazione del dispositivo'
          : 'Gestione nel kernel: QEMU non interviene'}
      </text>
    </svg>
  );
}
function AvlDiagram({ step }: { step: number }) {
  const balanced = step >= 3;
  const nodes = balanced
    ? [
        [20, 320, 45],
        [10, 210, 145],
        [30, 430, 145],
      ]
    : [[30, 390, 40], [20, 290, 120], ...(step >= 1 ? [[10, 190, 200]] : [])];
  return (
    <svg
      viewBox="0 0 640 260"
      role="img"
      aria-label={
        balanced
          ? 'Albero bilanciato con radice 20'
          : step === 0
            ? 'Radice 30 e figlio 20'
            : 'Catena sinistra 30, 20, 10'
      }
    >
      {balanced ? (
        <>
          <line className="diagram-edge" x1="320" y1="45" x2="210" y2="145" />
          <line className="diagram-edge" x1="320" y1="45" x2="430" y2="145" />
        </>
      ) : (
        <>
          <line className="diagram-edge" x1="390" y1="40" x2="290" y2="120" />
          {step >= 1 && <line className="diagram-edge" x1="290" y1="120" x2="190" y2="200" />}
        </>
      )}
      {nodes.map(([value, x, y]) => (
        <g
          key={value}
          className={`node ${(step === 2 && value === 30) || (balanced && value === 20) ? 'current' : ''}`}
        >
          <circle cx={x} cy={y} r="26" />
          <text x={x} y={y + 6} textAnchor="middle">
            {value}
          </text>
        </g>
      ))}
      {step === 2 && (
        <text x="440" y="45" className="svg-caption">
          BF = +2
        </text>
      )}
      <text x="470" y="230" className="svg-caption" textAnchor="middle">
        {balanced ? '10 < 20 < 30' : 'Rotazione semplice a destra'}
      </text>
    </svg>
  );
}
// Components must be reviewed and registered in application code, never loaded from content.
export const registry = { 'vm-exit': VmDiagram, 'avl-rotation': AvlDiagram };
export function SimulationPlayer({ simulation: s }: { simulation: Simulation }) {
  if(s.component === 'aos-container') return <AosContainerLab id={s.id} title={s.title}/>;
  if(s.component === 'aos-memory') return <AosMemoryLab id={s.id} title={s.title}/>;
  if (s.component === 'algoritmi-insertion' || s.component === 'algoritmi-merge') {
    return <AlgoritmiSortingLab id={s.id} title={s.title} mode={s.component === 'algoritmi-insertion' ? 'insertion' : 'merge'} />;
  }
  if (s.component === 'aos-partition' || s.component === 'aos-ivshmem' || s.component === 'aos-ring' || s.component === 'aos-cache-colors') {
    return <AosPartitionLab id={s.id} title={s.title} component={s.component} />;
  }
  if (s.component === 'aos-elf-loader' || s.component === 'aos-pit-read' || s.component === 'aos-vcpu-gaps') {
    return <AosBaremetalLab id={s.id} title={s.title} component={s.component} />;
  }
  if (s.component === 'aos-decode' || s.component === 'aos-time' || s.component === 'aos-interrupts' || s.component === 'aos-addresses' || s.component === 'aos-memory-slot') {
    return <AosExtraLab id={s.id} title={s.title} component={s.component} />;
  }
  if (s.component === 'aos-flags' || s.component === 'aos-cpu-cache' || s.component === 'aos-virtqueue' || s.component === 'aos-kvm-run') {
    return <AosLab id={s.id} title={s.title} component={s.component} />;
  }
  return <LegacySimulationPlayer simulation={{...s, component: s.component}} />;
}
function LegacySimulationPlayer({ simulation: s }: { simulation: Omit<Simulation, 'component'> & {component: 'vm-exit' | 'avl-rotation'} }) {
  const [step, setStep] = useState(0),
    [playing, setPlaying] = useState(false),
    [user, setUser] = useState(true);
  const steps = s.component === 'vm-exit' ? (user ? vmUser : vmKernel) : avl;
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setStep((current) => (current >= 4 ? 0 : current + 1)), 2000);
    return () => clearInterval(timer);
  }, [playing]);
  const Diagram = registry[s.component];
  return (
    <section id={s.id} className="simulation panel">
      <div className="simulation-header">
        <div>
          <span className="eyebrow">LABORATORIO INTERATTIVO</span>
          <h3>{s.title}</h3>
        </div>
        <span className="badge">{step + 1} / 5</span>
      </div>
      {s.component === 'vm-exit' && (
        <label className="select-label">
          Evento{' '}
          <select
            value={user ? 'userspace' : 'kernel'}
            onChange={(e) => {
              setUser(e.target.value === 'userspace');
              setStep(0);
              setPlaying(false);
            }}
          >
            <option value="userspace">Dispositivo emulato da QEMU</option>
            <option value="kernel">Evento gestito interamente da KVM</option>
          </select>
        </label>
      )}
      <div className="diagram">
        <Diagram step={step} user={user} />
      </div>
      <p className="step-description" aria-live="polite">
        <span>{String(step + 1).padStart(2, '0')}</span>
        {steps[step]}
      </p>
      <div className="player-controls">
        <button
          aria-label="Passo precedente"
          disabled={step === 0}
          onClick={() => {
            setStep(step - 1);
            setPlaying(false);
          }}
        >
          <ChevronLeft />
          Indietro
        </button>
        <button aria-label={playing ? 'Pausa' : 'Riproduci'} onClick={() => setPlaying(!playing)}>
          {playing ? <Pause /> : <Play />}
          <span>{playing ? 'Pausa' : 'Riproduci'}</span>
        </button>
        <button
          aria-label="Riavvia"
          onClick={() => {
            setStep(0);
            setPlaying(false);
          }}
        >
          <RotateCcw />
        </button>
        <button
          aria-label="Passo successivo"
          disabled={step === 4}
          onClick={() => {
            setStep(step + 1);
            setPlaying(false);
          }}
        >
          Avanti
          <ChevronRight />
        </button>
      </div>
    </section>
  );
}
