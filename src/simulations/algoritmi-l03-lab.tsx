'use client';
import { useEffect, useMemo, useState } from 'react';
import { VisualPlayer } from './aos-visual-player';
import { lesson3Trace, itemPosition, type Mode } from './algoritmi-l03-model';
export function AlgoritmiLesson3Lab({
  id,
  title,
  mode,
}: {
  id: string;
  title: string;
  mode: Mode;
}) {
  const initial =
    mode === 'partition'
      ? '2,8,7,1,3,5,6,4'
      : mode === 'counting'
        ? '2,5,3,0,2,3,0,3'
        : '3,1,5,2,4';
  const [draft, setDraft] = useState(initial),
    [values, setValues] = useState(initial.split(',').map(Number)),
    [seed, setSeed] = useState(1),
    [error, setError] = useState('');
  const model = useMemo(() => lesson3Trace(values, mode, seed), [values, mode, seed]);
  const [time, setTime] = useState(0),
    [running, setRunning] = useState(false),
    [delay, setDelay] = useState(2400),
    [reduced, setReduced] = useState(false);
  const last = model.frames.length - 1,
    playing = running && time < last;
  useEffect(() => {
    const m = matchMedia('(prefers-reduced-motion: reduce)'),
      fn = () => setReduced(m.matches);
    fn();
    m.addEventListener('change', fn);
    return () => m.removeEventListener('change', fn);
  }, []);
  useEffect(() => {
    if (!playing) return;
    let raf = 0,
      prev = 0;
    const tick = (t: number) => {
      const dt = prev ? Math.min(t - prev, 100) : 0;
      prev = t;
      setTime((x) => Math.min(last, x + dt / delay));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, last, delay]);
  const shown = reduced ? Math.floor(time) : time,
    step = Math.floor(shown),
    f = model.frames[step],
    g = model.frames[Math.min(step + 1, last)],
    u = shown - step,
    ease = u * u * (3 - 2 * u),
    current = u > 0.001 ? g : f;
  function move(n: number) {
    setRunning(false);
    setTime(n);
  }
  function apply() {
    try {
      const a = draft.split(',').map((s) => (s.trim() ? Number(s) : NaN));
      lesson3Trace(a, mode, seed);
      setValues(a);
      move(0);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const textStyle = { fill: '#203848' };
  return (
    <VisualPlayer
      id={id}
      title={title}
      subjectLabel="ALGORITMI / LEZIONE 3"
      frame={{
        ...current,
        active: 0,
        values: {
          i: current.i + 1,
          j: current.j + 1,
          'Posizione pivot': current.q + 1,
          Fase: current.phase,
        },
      }}
      step={step}
      count={model.frames.length}
      onStep={move}
      transport={{
        playing,
        delay,
        setDelay,
        stop: () => setRunning(false),
        toggle: () => {
          if (time >= last) setTime(0);
          setRunning(!playing);
        },
      }}
      options={
        <>
          <label>
            Array: 2–10 interi da 0 a 9
            <input
              aria-label="Array del laboratorio"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </label>
          <button onClick={apply}>Applica input</button>
          {mode === 'shuffle' && (
            <label>
              Seme
              <input
                aria-label="Seme"
                type="number"
                min="1"
                max="9999"
                value={seed}
                onChange={(e) => {
                  setSeed(Number(e.target.value) || 1);
                  move(0);
                }}
              />
            </label>
          )}
          {error && <p role="alert">{error}</p>}
        </>
      }
      scene={
        <svg className="aos-scene" viewBox="0 0 900 470" role="img" aria-label={title}>
          <rect width="900" height="470" fill="#f5f8fb" />
          <text x="25" y="35" fontSize="21" style={textStyle}>
            {mode === 'counting'
              ? 'A: input e B: output · C: conteggi / prefissi'
              : mode === 'partition'
                ? 'Partition · indici da 1 · pivot iniziale nell’ultima cella'
                : 'Permutazione: prefisso fissato e suffisso disponibile'}
          </text>
          {Array.from({ length: values.length }, (_, i) => (
            <g key={i}>
              <rect
                x={36 + 80 * i}
                y="115"
                width="58"
                height="50"
                rx="5"
                fill="none"
                stroke="#a7b9c6"
              />
              <text x={65 + 80 * i} y="95" fontSize="17" textAnchor="middle" style={textStyle}>
                {i + 1}
              </text>
              {mode === 'counting' && (
                <text x={65+80*i} y="147" fontSize="25" textAnchor="middle" style={textStyle}>{values[i]}</text>
              )}
              {mode === 'counting' && (
                <rect
                  x={36 + 80 * i}
                  y="335"
                  width="58"
                  height="50"
                  rx="5"
                  fill="none"
                  stroke="#a7b9c6"
                />
              )}
            </g>
          ))}
          {mode === 'counting' && (
            <>
              <text x="25" y="218" fontSize="19" style={textStyle}>
                C: indice = valore della chiave
              </text>
              {current.counts.map((c, i) => (
                <g key={i}>
                  <rect
                    x={30 + 85 * i}
                    y="250"
                    width="65"
                    height="42"
                    fill="#e3edf5"
                    stroke="#8da7bb"
                  />
                  <text x={62 + 85 * i} y="239" fontSize="16" textAnchor="middle" style={textStyle}>
                    {i}
                  </text>
                  <text x={62 + 85 * i} y="278" fontSize="22" textAnchor="middle" style={textStyle}>
                    {c}
                  </text>
                </g>
              ))}
              <text x="25" y="320" fontSize="19" style={textStyle}>
                B: celle dell’output
              </text>
            </>
          )}
          {model.items.map((item) => {
            const a = itemPosition(item.id, f, mode),
              b = itemPosition(item.id, g, mode),
              x = a.x + (b.x - a.x) * ease,
              y = a.y + (b.y - a.y) * ease,
              idx = current.order.indexOf(item.id);
            const fill =
              mode === 'partition'
                ? idx === current.q || (idx === values.length - 1 && current.q < 0)
                  ? '#ffe2a1'
                  : idx <= current.i
                    ? '#deecd1'
                    : idx < current.j || current.q >= 0 ? '#f0deda' : '#e1ebf6'
                : mode === 'counting'
                  ? '#dcece6'
                  : idx <= current.i - (current.phase === 'choose' ? 1 : 0)
                    ? '#deecd1'
                    : '#e1ebf6';
            return (
              <g key={item.id} data-l03-item={item.id} transform={`translate(${x},${y})`}>
                <rect
                  x="-27"
                  y="-22"
                  width="54"
                  height="44"
                  rx="6"
                  fill={fill}
                  stroke="#52758f"
                  strokeWidth="2"
                />
                <text y="7" textAnchor="middle" fontSize="25" style={textStyle}>
                  {item.value}
                </text>
              </g>
            );
          })}
          {mode !== 'counting' && (
            <>
              <text x="25" y="245" fontSize="20" style={textStyle}>
                {mode === 'partition'
                  ? `i=${current.i + 1}, j=${current.j + 1} · giallo: pivot · verde: regione ≤ pivot`
                  : `i=${current.i + 1}, j=${current.j + 1} · verde: prefisso fissato`}
              </text>
              <text x="25" y="290" fontSize="18" style={textStyle}>
                {mode === 'partition'
                  ? 'La partizione non ordina automaticamente le due regioni.'
                  : 'Gli elementi già fissati non partecipano alle scelte successive.'}
              </text>
            </>
          )}
        </svg>
      }
      detailPanel={
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            background: '#edf2f6',
            color: '#203848',
            padding: 12,
            fontSize: 13,
          }}
        >
          {current.code}
        </pre>
      }
      legend={
        mode === 'counting'
          ? 'Gli elementi si spostano verso B senza modificare A. C cambia significato dopo le somme prefisse.'
          : 'Gli oggetti conservano gli ID durante gli scambi; avanzamento e pseudocodice sono sincronizzati.'
      }
      checks={[
        {
          label: 'Ogni elemento mantiene un’identità distinta',
          ok: new Set(current.order).size === values.length,
        },
        {
          label:
            mode === 'counting' ? 'Output senza sovrascritture' : 'Taglia dell’array conservata',
          ok:
            mode === 'counting'
              ? new Set(current.output.filter(Boolean)).size ===
                current.output.filter(Boolean).length
              : current.order.length === values.length,
        },
      ]}
    />
  );
}
