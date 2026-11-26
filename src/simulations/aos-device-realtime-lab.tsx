'use client';

import { useState } from 'react';

const sensorSteps = [
  [
    'Il lettore entra in attesa',
    'read() non trova un campione e sospende il task nella wait queue.',
  ],
  [
    'Il sensore segnala una misura pronta',
    'Il GPIO genera un IRQ. Il top half chiede di avviare il thread IRQ.',
  ],
  [
    'Il thread IRQ legge il sensore',
    'Il trasferimento I²C può dormire. Il lettore resta sospeso mentre il trasferimento è in corso.',
  ],
  [
    'Il thread pubblica il campione',
    'Aggiorna distanza, timestamp e condizione di disponibilità sotto la protezione prevista, quindi rilascia il lock.',
  ],
  [
    'Il thread risveglia il lettore',
    'wake_up_interruptible() rende eseguibile il lettore. La CPU gli verrà assegnata dallo scheduler.',
  ],
  [
    'Il lettore consegna la misura',
    'Al ritorno in CPU ricontrolla la condizione, acquisisce una copia coerente e trasferisce i dati in user space fuori dal lock.',
  ],
] as const;

const schedules = {
  normale: {
    end: 8,
    segments: [
      [0, 2, 'τ₂ prima del lock'],
      [2, 8, 'τ₁ esegue e completa'],
      [8, 24, 'τ₂ riprende e completa'],
    ],
  },
  doppia: {
    end: 10.5,
    segments: [
      [0, 1.5, 'τ₂ prima del lock'],
      [1.5, 2, 'τ₂ acquisisce il lock'],
      [2, 3, 'τ₁ esegue, poi attende il lock'],
      [3, 8.5, 'τ₂ riprende e rilascia il lock'],
      [8.5, 10.5, 'τ₁ riprende e completa'],
      [10.5, 12, 'τ₂ completa'],
    ],
  },
} as const;

const formatTime = new Intl.NumberFormat('it-IT');

export function AosSensorLab({ title }: { title: string }) {
  const [step, setStep] = useState(0);
  const [heading, details] = sensorSteps[step];

  return (
    <section className="space-y-4" aria-label={title}>
      <h3>{title}</h3>
      <progress
        className="w-full"
        aria-label="Avanzamento del laboratorio"
        value={step + 1}
        max={sensorSteps.length}
      />
      <div aria-live="polite">
        <h4>{heading}</h4>
        <p>{details}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded border px-3 py-1 disabled:opacity-50"
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
        >
          Indietro
        </button>
        <button
          type="button"
          className="rounded border px-3 py-1 disabled:opacity-50"
          disabled={step === sensorSteps.length - 1}
          onClick={() => setStep(step + 1)}
        >
          Avanza
        </button>
        <button type="button" className="rounded border px-3 py-1" onClick={() => setStep(0)}>
          Ricomincia
        </button>
      </div>
    </section>
  );
}

export function AosRealtimeLab({ title }: { title: string }) {
  const [speed, setSpeed] = useState<keyof typeof schedules>('normale');
  const { end, segments } = schedules[speed];
  const deadline = 9;

  return (
    <section className="space-y-4" aria-label={title}>
      <h3>{title}</h3>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Velocità della CPU">
        <button
          type="button"
          className="rounded border px-3 py-1 aria-pressed:font-bold aria-pressed:underline"
          aria-pressed={speed === 'normale'}
          onClick={() => setSpeed('normale')}
        >
          Velocità normale
        </button>
        <button
          type="button"
          className="rounded border px-3 py-1 aria-pressed:font-bold aria-pressed:underline"
          aria-pressed={speed === 'doppia'}
          onClick={() => setSpeed('doppia')}
        >
          Velocità doppia
        </button>
      </div>
      <p aria-live="polite">
        τ₁ {end <= deadline ? 'rispetta' : 'manca'} la deadline a t = 9. Completa a t ={' '}
        {formatTime.format(end)} con tempo di risposta {formatTime.format(end - 2)}.
      </p>
      <div className="relative h-6 overflow-hidden rounded border" aria-hidden="true">
        {segments.map(([from, to, label]) => (
          <div
            key={from}
            title={label}
            className={`absolute inset-y-0 border-r border-white ${label.startsWith('τ₁') ? 'bg-sky-600' : 'bg-slate-400'}`}
            style={{ left: `${(from / 25) * 100}%`, width: `${((to - from) / 25) * 100}%` }}
          />
        ))}
        <div className="absolute inset-y-0 border-l-2 border-red-700" style={{ left: '36%' }} />
      </div>
      <ol className="space-y-1">
        {segments.map(([from, to, label]) => (
          <li key={from}>
            <strong>
              {formatTime.format(from)}–{formatTime.format(to)}
            </strong>{' '}
            · {label}
          </li>
        ))}
      </ol>
    </section>
  );
}
