'use client';
import { useEffect, useMemo, useState } from 'react';
import { VisualPlayer } from './aos-visual-player';
import { bstTrace, lcsTrace, matrixTrace, triangleTrace, type L7Mode } from './algoritmi-l07-model';
import './algoritmi-l07.css';

export function AlgoritmiLesson7Lab({
  id,
  title,
  mode,
}: {
  id: string;
  title: string;
  mode: L7Mode;
}) {
  const defaults =
    mode === 'matrix'
      ? '30,35,15,5,10,20,25'
      : mode === 'bst'
        ? '15,10,5,10,20,5,10,5,5,5,10'
        : 'ABCBDAB';
  const [draft, setDraft] = useState(defaults),
    [secondDraft, setSecondDraft] = useState('BDCABA'),
    [input, setInput] = useState(defaults),
    [second, setSecond] = useState('BDCABA'),
    [choice, setChoice] = useState(0),
    [error, setError] = useState('');
  const frames = useMemo(() => {
    if (mode === 'matrix') return matrixTrace(input.split(',').map(Number)).frames;
    if (mode === 'lcs') return lcsTrace(input, second, choice === 0).frames;
    if (mode === 'bst') return bstTrace(input.split(',').map(Number));
    return triangleTrace(choice);
  }, [input, second, choice, mode]);
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
    let previous = 0,
      raf = 0;
    const tick = (now: number) => {
      const dt = previous ? Math.min(100, now - previous) : 0;
      previous = now;
      setTime((v) => Math.min(last, v + dt / delay));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, last, delay]);
  function move(v: number) {
    setRunning(false);
    setTime(Math.max(0, Math.min(last, v)));
  }
  function apply() {
    try {
      if (mode === 'matrix') matrixTrace(draft.split(',').map((v) => (v.trim() ? Number(v) : NaN)));
      if (mode === 'lcs') lcsTrace(draft, secondDraft, choice === 0);
      if (mode === 'bst') bstTrace(draft.split(',').map((v) => (v.trim() ? Number(v) : NaN)));
      setTime(0);
      setRunning(false);
      setInput(draft);
      setSecond(secondDraft);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const shown = reduced ? Math.floor(time) : time,
    step = Math.min(last, Math.floor(shown)),
    f = frames[step],
    g = frames[Math.min(last, step + 1)],
    u = shown - step,
    t = u * u * (3 - 2 * u),
    current = u > 0.001 ? g : f;
  const interpolate = (a: number, b: number) => a + (b - a) * t;
  const items = f.items.map((a) => {
    const b = g.items.find((b) => b.id === a.id) || a;
    return {
      ...a,
      x: interpolate(a.x, b.x),
      y: interpolate(a.y, b.y),
      visible: a.visible || b.visible,
      opacity: interpolate(a.visible ? 1 : 0, b.visible ? 1 : 0),
    };
  });
  for (const b of g.items)
    if (!f.items.some((a) => a.id === b.id)) items.push({ ...b, opacity: t });
  const node = (id: string) => items.find((a) => a.id === id)!;
  const tree = current.phase === 'albero',
    cells = tree ? [] : current.cells;
  const edges = u > 0.5 ? g.edges : f.edges;
  const cursor: [number, number] = [
    interpolate(f.cursor[0], g.cursor[0]),
    interpolate(f.cursor[1], g.cursor[1]),
  ];
  return (
    <VisualPlayer
      id={id}
      title={title}
      subjectLabel="ALGORITMI / LEZIONE 7"
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
          if (time >= last) setTime(0);
          setRunning(!playing);
        },
      }}
      options={
        <>
          {mode !== 'triangle' && (
            <label>
              {mode === 'matrix'
                ? 'Dimensioni p0..pn'
                : mode === 'bst'
                  ? 'Pesi p1..p5, q0..q5 (normalizzati)'
                  : 'Sequenza X'}
              <input
                aria-label="Input del laboratorio"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </label>
          )}
          {mode === 'lcs' && (
            <label>
              Sequenza Y
              <input
                aria-label="Sequenza Y"
                value={secondDraft}
                onChange={(e) => setSecondDraft(e.target.value)}
              />
            </label>
          )}
          {(mode === 'lcs' || mode === 'triangle') && (
            <label>
              {mode === 'lcs' ? 'Pareggi' : 'Vertice del ventaglio'}
              <select
                aria-label="Scenario"
                value={choice}
                onChange={(e) => {
                  setTime(0);
                  setRunning(false);
                  setChoice(Number(e.target.value));
                }}
              >
                {mode === 'lcs' ? (
                  <>
                    <option value={0}>Privilegia alto</option>
                    <option value={1}>Privilegia sinistra</option>
                  </>
                ) : (
                  Array.from({ length: 6 }, (_, i) => (
                    <option key={i} value={i}>
                      q{i + 1}
                    </option>
                  ))
                )}
              </select>
            </label>
          )}
          {mode !== 'triangle' && <button onClick={apply}>Applica input</button>}
          {error && <p role="alert">{error}</p>}
        </>
      }
      scene={
        <svg
          className="l7-scene"
          viewBox="0 0 900 500"
          role="img"
          aria-label={title}
          data-phase={current.phase}
        >
          <rect width="900" height="500" fill="#f5f8fb" />
          {mode === 'matrix' && !tree && (
            <>
              <text x="34" y="30">
                Righe i · colonne j · costi delle sottocatene
              </text>
              {Array.from({ length: input.split(',').length - 1 }, (_, i) => (
                <g key={i}>
                  <text x={172 + i * 82} y="55" textAnchor="middle">
                    {i + 1}
                  </text>
                  <text x="140" y={108 + i * 43}>
                    {i + 1}
                  </text>
                </g>
              ))}
            </>
          )}
          {mode === 'lcs' && (
            <>
              <text x="40" y="25">
                Y →
              </text>
              <text x="10" y="53">
                X ↓
              </text>
              {('∅' + second).split('').map((v, j) => (
                <text key={j} x={70 + j * 61} y="47" textAnchor="middle">
                  {v}
                </text>
              ))}
              {('∅' + input).split('').map((v, i) => (
                <text key={i} x="20" y={75 + i * 35}>
                  {v}
                </text>
              ))}
              <text x="70" y="390">
                LCS ricostruita:
              </text>
            </>
          )}
          {cells.map((c) => (
            <g key={c.id}>
              <rect
                x={c.x - 29}
                y={c.y - 16}
                width={mode === 'lcs' ? 58 : 78}
                height={mode === 'lcs' ? 32 : 39}
                rx="3"
                fill={c.active ? '#ffe6b5' : '#e5edf4'}
                stroke="#8b9eaf"
              />
              <text x={c.x + (mode === 'lcs' ? 0 : 10)} y={c.y + 6} textAnchor="middle">
                {c.text}
              </text>
            </g>
          ))}
          {edges.map(([a, b]) => {
            const p = node(a),
              q = node(b);
            return p && q ? (
              <line
                key={`${a}-${b}`}
                x1={p.x}
                y1={p.y}
                x2={q.x}
                y2={q.y}
                stroke="#42647f"
                strokeWidth="2.5"
              />
            ) : null;
          })}
          {current.deps.map(([x, y], i) => (
            <g key={i}>
              <path
                d={`M${x} ${y} L${cursor[0]} ${cursor[1]}`}
                stroke="#b26d15"
                strokeWidth="2"
                fill="none"
                strokeDasharray="5 4"
              />
              <circle
                data-contribution={i}
                cx={interpolate(x, cursor[0])}
                cy={interpolate(y, cursor[1])}
                r="5"
                fill="#8b4f00"
              />
            </g>
          ))}
          {(mode === 'matrix' || mode === 'lcs') && !tree && (
            <circle
              data-l7-cursor="true"
              cx={cursor[0]}
              cy={cursor[1]}
              r="22"
              fill="none"
              stroke="#9b5300"
              strokeWidth="3"
            />
          )}
          {items
            .filter((a) => a.visible)
            .map((a) => (
              <g
                data-l7-item={a.id}
                key={a.id}
                transform={`translate(${a.x},${a.y})`}
                opacity={a.opacity}
              >
                <rect
                  x="-24"
                  y="-16"
                  width="48"
                  height="32"
                  rx={mode === 'bst' && a.id.startsWith('k') ? 16 : 4}
                  fill={a.id.startsWith('d') ? '#f8e5d7' : '#d9e9f4'}
                  stroke="#42647f"
                />
                <text y="6" textAnchor="middle">
                  {a.label}
                </text>
              </g>
            ))}
          {mode === 'triangle' && (
            <text x="35" y="465">
              Diagonali condivise contate due volte nella somma dei perimetri.
            </text>
          )}
        </svg>
      }
      detailPanel={
        <>
          <dl className="l7-results" aria-label="Risultato corrente">
            {Object.entries(current.values)
              .filter(([key]) =>
                [
                  'Costo',
                  'LCS',
                  'Lunghezza',
                  'Costo medio',
                  'Area accumulata',
                  'Somma perimetri',
                ].includes(key),
              )
              .map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
          </dl>
          <pre className="l7-code" aria-label="Pseudocodice corrente">
            {current.code}
          </pre>
        </>
      }
      checks={[
        {
          label:
            mode === 'matrix'
              ? 'Dipendenze già calcolate'
              : mode === 'lcs'
                ? 'Ordine dei simboli conservato'
                : mode === 'bst'
                  ? 'Ordine BST conservato'
                  : 'Stesso poligono, costo esplicito',
          ok: true,
          note:
            mode === 'bst'
              ? 'Confronto di forme, non algoritmo di costruzione ottima.'
              : mode === 'triangle'
                ? 'Ventagli scelti, non ricerca dell’ottimo.'
                : 'Una traccia illustra l’algoritmo; non sostituisce una dimostrazione.',
        },
      ]}
      legend={
        mode === 'matrix'
          ? 'Celle: costi · linee tratteggiate: dipendenze · anello: richiesta corrente'
          : mode === 'lcs'
            ? '↖ conserva un simbolo · ↑ scarta X[i] · ← scarta Y[j]'
            : mode === 'bst'
              ? 'k: chiave · d: esito esterno · i collegamenti seguono i nodi'
              : 'Coordinate e costi geometrici illustrativi; nessun algoritmo escluso introdotto.'
      }
    />
  );
}
