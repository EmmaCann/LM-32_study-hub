'use client';
import { useEffect, useMemo, useState } from 'react';
import { VisualPlayer } from './aos-visual-player';
import { l6Trace, type L6Mode } from './algoritmi-l06-model';
export function AlgoritmiLesson6Lab({
  id,
  title,
  mode,
}: {
  id: string;
  title: string;
  mode: L6Mode;
}) {
  const initial =
    mode === 'rb'
      ? [11, 2, 14, 1, 7, 15, 5, 8, 4]
      : mode === 'rod'
        ? [1, 5, 8, 9, 10, 17, 17, 20, 24]
        : [200, 5, 100, 5];
  const [input, setInput] = useState(initial),
    [draft, setDraft] = useState(initial.join(',')),
    [choice, setChoice] = useState(0),
    [error, setError] = useState('');
  const frames = useMemo(() => l6Trace(mode, input, choice), [mode, input, choice]);
  const [time, setTime] = useState(0),
    [running, setRunning] = useState(false),
    [delay, setDelay] = useState(2400),
    [reduced, setReduced] = useState(false);
  const last = frames.length - 1,
    playing = running && time < last;
  useEffect(() => {
    const q = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(q.matches);
    update();
    q.addEventListener('change', update);
    return () => q.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!playing) return;
    let raf = 0,
      previous = 0;
    const tick = (now: number) => {
      const dt = previous ? Math.min(100, now - previous) : 0;
      previous = now;
      setTime((t) => Math.min(last, t + dt / delay));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, last, delay]);
  function move(n: number) {
    setRunning(false);
    setTime(n);
  }
  const shown = reduced ? Math.floor(time) : time,
    step = Math.floor(shown),
    f = frames[step],
    g = frames[Math.min(last, step + 1)],
    u = shown - step,
    t = u * u * (3 - 2 * u),
    current = u > 0.001 ? g : f;
  const nodes = f.nodes.map((a, i) => ({
    ...a,
    x: a.x + (g.nodes[i].x - a.x) * t,
    y: a.y + (g.nodes[i].y - a.y) * t,
    color: u > 0.5 ? g.nodes[i].color : a.color,
    label: u > 0.5 ? g.nodes[i].label : a.label,
  }));
  const get = (key: string) => nodes.find((n) => n.id === key)!;
  function apply() {
    try {
      const values = draft.split(',').map((x) => (x.trim() ? Number(x) : NaN));
      l6Trace(mode, values, choice);
      setInput(values);
      move(0);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <VisualPlayer
      id={id}
      title={title}
      subjectLabel="ALGORITMI / LEZIONE 6"
      step={step}
      count={frames.length}
      onStep={move}
      frame={{ active: 0, title: current.title, detail: current.detail, values: current.values }}
      transport={{
        playing,
        delay,
        setDelay,
        stop: () => setRunning(false),
        toggle: () => {
          if (time === last) setTime(0);
          setRunning(!playing);
        },
      }}
      options={
        <>
          <label>
            {mode === 'rb'
              ? 'Chiavi da inserire'
              : mode === 'rod'
                ? 'Prezzi per lunghezze 1..n'
                : 'Dimensioni p0,p1,p2,p3'}
            <input
              aria-label="Input del laboratorio"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </label>
          <button onClick={apply}>Applica input</button>
          {mode === 'matrix' && (
            <label>
              Parentesi
              <select
                aria-label="Parentesizzazione"
                value={choice}
                onChange={(e) => {
                  move(0);
                  setChoice(Number(e.target.value));
                }}
              >
                <option value={0}>(A1 A2) A3</option>
                <option value={1}>A1 (A2 A3)</option>
              </select>
            </label>
          )}
          {error && <p role="alert">{error}</p>}
        </>
      }
      checks={[
        {
          label:
            mode === 'rb'
              ? 'Proprietà rosso-nere'
              : mode === 'rod'
                ? 'Il candidato usa il resto già ottimo'
                : 'Ordine A1, A2, A3 conservato',
          ok: current.valid,
          note:
            mode === 'rb'
              ? 'Negli stati intermedi il fixup può essere ancora in corso.'
              : undefined,
        },
      ]}
      legend={
        mode === 'rb'
          ? 'R = rosso; N = nero; NIL nere implicite. Le chiavi mantengono la propria identità.'
          : mode === 'rod'
            ? 'Le unità dell’asta restano riconoscibili. Rosso: primo pezzo; azzurro: resto.'
            : 'Le dimensioni degli intermedi determinano il costo; le matrici non vengono permutate.'
      }
      detailPanel={
        <>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
              padding: 12,
              background: '#edf2f6',
              color: '#203848',
            }}
          >
            {current.code}
          </pre>
          {mode === 'rod' && (
            <dl>
              <dt>r[0..n] (future celle provvisorie)</dt>
              <dd>{current.values['r[0..n]']}</dd>
              <dt>s[1..n]</dt>
              <dd>{current.values['s[1..n]']}</dd>
            </dl>
          )}
        </>
      }
      scene={
        <svg className="aos-scene" viewBox="0 0 900 760" role="img" aria-label={title}>
          <rect width="900" height="760" fill="#f5f8fb" />
          {current.edges.map(([a, b]) => {
            const x = get(a),
              y = get(b);
            return (
              <line
                key={a + '-' + b}
                x1={x.x}
                y1={x.y + 23}
                x2={y.x}
                y2={y.y - 23}
                stroke="#537b93"
                strokeWidth="3"
              />
            );
          })}
          {nodes.map((n) => (
            <g key={n.id} data-l06-item={n.id} transform={`translate(${n.x} ${n.y})`}>
              {mode === 'rb' ? (
                <circle
                  r="27"
                  fill={n.color === 'R' ? '#ffe0dc' : n.color === 'N' ? '#d4e2ed' : '#ffffff'}
                  stroke={n.color === 'R' ? '#9d3634' : '#345c75'}
                  strokeWidth="3"
                />
              ) : (
                <rect
                  x={mode === 'matrix' ? -110 : -30}
                  y="-28"
                  width={mode === 'matrix' ? 220 : 60}
                  height="56"
                  rx="5"
                  fill={n.color === 'R' ? '#ffe0dc' : '#dcebf4'}
                  stroke="#537b93"
                />
              )}
              <text
                textAnchor="middle"
                y="6"
                style={{ fill: '#203848', fontSize: mode === 'matrix' ? 21 : 19, fontWeight: 600 }}
              >
                {n.label}
              </text>
            </g>
          ))}
          <text x="40" y="705" style={{ fill: '#203848', fontSize: 20 }}>
            {mode === 'rb'
              ? 'Fascia superiore: chiavi ancora da inserire.'
              : mode === 'rod'
                ? 'Asta divisa in unità: il taglio separa il primo pezzo dal resto.'
                : 'Intermedio M e risultato C: costi aritmetici, non tempi misurati.'}
          </text>
        </svg>
      }
    />
  );
}
