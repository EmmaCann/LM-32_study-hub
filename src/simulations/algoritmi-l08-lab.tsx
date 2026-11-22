'use client';
import { useEffect, useState } from 'react';
import { algorithmEase } from './algoritmi-motion';
import { initial, trace, type Mode } from './algoritmi-l08-model';
import { VisualPlayer } from './aos-visual-player';

const labels: Record<Mode, string> = {
  huffman: 'Frequenze separate da virgole',
  multipop: 'Comandi: +valore per PUSH, -k per MULTIPOP',
  select: 'Rango da cercare, da 1 a 7',
};

export function Lesson8Lab({ id, title, mode }: { id: string; title: string; mode: Mode }) {
  const [draft, setDraft] = useState(initial[mode]);
  const [frames, setFrames] = useState(() => trace(mode, initial[mode]));
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [delay, setDelay] = useState(1300);
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);
  const last = frames.length - 1;
  const playing = running && time < last;
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    setReady(true);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!playing) return;
    let previous = 0, handle = 0;
    const tick = (now: number) => {
      const elapsed = previous ? Math.min(now - previous, 80) : 0;
      previous = now;
      setTime((t) => Math.min(t + elapsed / delay, last));
      handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, [delay, last, playing]);

  const step = Math.floor(time), a = frames[step], b = frames[Math.min(step + 1, last)];
  const t = reduced ? 0 : algorithmEase(time - step);
  const reveal = mode === 'huffman' ? Math.max(0, (t - 0.58) / 0.42) : t;
  const points = new Map(a.points.map((p) => [p.id, { ...p, opacity: 1 }]));
  for (const dest of b.points) {
    const from = points.get(dest.id);
    points.set(dest.id, {
      ...dest,
      x: from ? from.x + (dest.x - from.x) * t : dest.x,
      y: from ? from.y + (dest.y - from.y) * t : dest.y,
      opacity: from ? 1 : reveal,
      label: t < 0.5 && from ? from.label : dest.label,
    });
  }
  const edges = new Map(a.links.map((edge) => [edge.join(':'), { edge, opacity: 1 }]));
  for (const edge of b.links) {
    const key = edge.join(':');
    if (!edges.has(key)) edges.set(key, { edge, opacity: reveal });
  }
  const frame = t >= 0.5 ? b : a;
  function apply() {
    try {
      setFrames(trace(mode, draft));
      setRunning(false);
      setTime(0);
      setError('');
    } catch (cause) { setError((cause as Error).message); }
  }
  return (
    <VisualPlayer
      id={id} title={title} subjectLabel="ALGORITMI / LEZIONE 8"
      frame={frame} step={step} count={frames.length} onStep={setTime}
      transport={{
        playing, delay, setDelay, stop: () => setRunning(false),
        toggle: () => {
          if (time >= last) setTime(0);
          setRunning(!playing);
        },
      }}
      options={<>
        <label>{labels[mode]}<input disabled={!ready} value={draft} onChange={(e) => setDraft(e.target.value)} /></label>
        <button type="button" disabled={!ready} onClick={apply}>Applica input</button>
        {error && <span role="alert">{error}</span>}
      </>}
      legend={mode === 'select' ? 'Nodo: chiave · size. Il cursore indica il rango residuo.'
        : mode === 'multipop' ? 'La cima è in alto. Gli stessi elementi passano dalla pila alla zona delle estrazioni.'
        : 'Confronta i pesi delle radici per trovare i due minimi. Le foglie mantengono la propria colonna.'}
      checks={[{ label: mode === 'select' ? 'Rango rinumerato a destra'
        : mode === 'multipop' ? 'Estrazioni ≤ inserimenti' : 'Genitore con peso pari alla somma dei figli', ok: true }]}
      detailPanel={<pre>{frame.code}</pre>}
      scene={
        <svg className="aos-scene algoritmi-scene" viewBox={mode === 'multipop' ? '0 0 900 365' : '0 0 900 320'}
          role="img" aria-label={title}>
          <rect className="algorithm-backdrop" width="100%" height="100%" />
          {mode === 'multipop' && <>
            <path d="M245 56V342H375V56" fill="none" stroke="#66899e" strokeWidth="2" />
            <text x="310" y="36" textAnchor="middle">Pila</text>
            <text x="650" y="68" textAnchor="middle">Estratti in ordine</text>
          </>}
          {[...edges].map(([key, { edge: [from, to], opacity }]) => {
            const x = points.get(from)!, y = points.get(to)!;
            return <line key={key} x1={x.x} y1={x.y} x2={y.x} y2={y.y}
              stroke="#66899e" strokeWidth="2" opacity={opacity} />;
          })}
          {[...points].map(([key, p]) => {
            const w = p.active ? 32 : mode === 'multipop' ? 38 : 76;
            return <g key={key} data-l08-item={key} transform={'translate(' + p.x + ' ' + p.y + ')'} opacity={p.opacity}>
              <rect x={-w / 2} y={-14} width={w} height="28" rx="8" fill={p.active ? '#ffd58b' : '#deedf4'} />
              <text y="5" textAnchor="middle" fontSize="16">{p.label}</text>
            </g>;
          })}
        </svg>}
    />
  );
}
