'use client';
import { useEffect, useId, useMemo, useState } from 'react';
import { VisualPlayer } from './aos-visual-player';
import { heapTrace, heapPosition, heapExamples, type HeapOperation } from './algoritmi-heap-model';
import { parseInput } from './algoritmi-sorting-models';
export function AlgoritmiHeapLab({ id, title }: { id: string; title: string }) {
  const [operation, setOperation] = useState<HeapOperation>('sort'),
    [draft, setDraft] = useState(heapExamples.sort.join(','));
  const [input, setInput] = useState<number[]>(heapExamples.sort),
    [error, setError] = useState('');
  const model = useMemo(() => heapTrace(input, operation), [input, operation]);
  const [time, setTime] = useState(0),
    [running, setRunning] = useState(false),
    [delay, setDelay] = useState(2400),
    [reduced, setReduced] = useState(false);
  const last = model.frames.length - 1,
    playing = running && time < last,
    arrow = useId().replaceAll(':', '');
  useEffect(() => {
    const q = matchMedia('(prefers-reduced-motion: reduce)'),
      fn = () => setReduced(q.matches);
    fn();
    q.addEventListener('change', fn);
    return () => q.removeEventListener('change', fn);
  }, []);
  useEffect(() => {
    if (!playing) return;
    let previous = 0,
      raf = 0;
    const tick = (now: number) => {
      const dt = previous ? Math.min(100, now - previous) : 0;
      previous = now;
      setTime((t) => Math.min(last, t + dt / delay));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, delay, last]);
  const shown = reduced ? Math.floor(time) : time,
    step = Math.min(last, Math.floor(shown)),
    f = model.frames[step],
    g = model.frames[Math.min(last, step + 1)],
    u = shown - step,
    ease = u * u * (3 - 2 * u),
    current = u > 0.001 ? g : f;
  function apply(next: HeapOperation = operation, text = draft) {
    setRunning(false);
    try {
      const a = parseInput(text, 10);
      heapTrace(a, next);
      setInput(a);
      setOperation(next);
      setDraft(text);
      setTime(0);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const transport = {
    playing,
    delay,
    setDelay,
    stop: () => setRunning(false),
    toggle: () => {
      if (time >= last) setTime(0);
      setRunning(!playing);
    },
  };
  const scene = (
    <svg
      className="aos-scene"
      viewBox="0 0 900 540"
      role="img"
      aria-label="Heap e array sincronizzati"
      data-time={shown.toFixed(4)}
    >
      <defs>
        <marker id={arrow} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0 0L6 3L0 6" fill="#b77b2f" />
        </marker>
      </defs>
      <rect width="900" height="540" fill="#f3f8fa" />
      <text x="25" y="24" fontSize="15" fill="#365c6b">
        Albero: heap attivo · indici da 1 · fase {current.phase}
      </text>
      {Array.from({ length: current.size }, (_, i) => i)
        .filter((i) => i > 0)
        .map((i) => {
          const p = heapPosition(Math.floor((i - 1) / 2), current.size),
            c = heapPosition(i, current.size);
          return (
            <line key={i} x1={p.x} y1={p.y} x2={c.x} y2={c.y} stroke="#a2bbc7" strokeWidth="2" />
          );
        })}
      <text x="25" y="357" fontSize="14" fill="#365c6b">
        Massimi esclusi dall’heap: suffisso ordinato
      </text>
      <text x="25" y="458" fontSize="14" fill="#365c6b">
        Array completo: stessa struttura, seconda vista · heap-size = {current.size}
      </text>
      {Array.from({ length: input.length }, (_, i) => (
        <text key={i} x={65 + 80 * i} y="475" textAnchor="middle" fontSize="11" fill="#587484">
          {i + 1}
        </text>
      ))}
      {model.items.map((item) => {
        const i = f.order.indexOf(item.id),
          j = g.order.indexOf(item.id),
          a = heapPosition(i, f.size),
          b = heapPosition(j, g.size),
          x = a.x + (b.x - a.x) * ease,
          y = a.y + (b.y - a.y) * ease,
          index = i + (j - i) * ease;
        const selected = current.focus.includes(current.order.indexOf(item.id)),
          sorted = current.order.indexOf(item.id) >= current.size,
          fill = selected ? '#ffe6b4' : sorted ? '#dceee2' : '#e0eef5',
          stroke = selected ? '#b77b2f' : sorted ? '#3f7763' : '#517f98';
        return (
          <g key={item.id}>
            <g data-heap-item={item.id} transform={`translate(${x},${y})`}>
              <circle r="23" fill={fill} stroke={stroke} strokeWidth={selected ? 3 : 1.5} />
              <text y="6" textAnchor="middle" fontSize="20" fill="#203848">
                {item.value}
              </text>
            </g>
            <g data-array-item={item.id} transform={`translate(${65 + 80 * index},500)`}>
              <rect x="-29" y="-20" width="58" height="40" rx="6" fill={fill} stroke={stroke} />
              <text y="6" textAnchor="middle" fontSize="19" fill="#203848">
                {item.value}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
  return (
    <VisualPlayer
      id={id}
      title={title}
      subjectLabel="ALGORITMI / HEAP IN MOVIMENTO"
      frame={current}
      step={step}
      count={model.frames.length}
      onStep={(n) => {
        setRunning(false);
        setTime(n);
      }}
      transport={transport}
      options={
        <>
          <label>
            Operazione
            <select
              aria-label="Operazione heap"
              value={operation}
              onChange={(e) => {
                const next = e.target.value as HeapOperation;
                apply(next, heapExamples[next].join(','));
              }}
            >
              <option value="sort">Costruzione e Heapsort</option>
              <option value="build">Solo Build-Max-Heap</option>
              <option value="heapify">Max-Heapify sul nodo 2</option>
            </select>
          </label>
          <label>
            Array (2–10 interi)
            <input
              aria-label="Array heap"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </label>
          <button onClick={() => apply()}>Applica input</button>
          {error && <p role="alert">{error}</p>}
        </>
      }
      scene={scene}
      legend="Gli elementi mantengono la loro identità negli scambi. Albero e array mostrano gli stessi valori; il suffisso ordinato è verde."
      detailPanel={
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            fontSize: 12,
            padding: 12,
            background: '#eef3f5',
            color: '#203848',
          }}
        >
          {current.code}
        </pre>
      }
      checks={[
        { label: 'Dimensione attiva entro la lunghezza', ok: current.size <= input.length },
        { label: 'Suffisso escluso ordinato', ok: current.sorted },
        {
          label: 'Proprietà max-heap globale',
          ok: current.heapOk,
          note: current.heapOk
            ? 'Rispettata.'
            : 'Può essere falsa durante la costruzione; una riparazione locale non corregge violazioni esterne al suo sottoalbero.',
        },
      ]}
    />
  );
}
