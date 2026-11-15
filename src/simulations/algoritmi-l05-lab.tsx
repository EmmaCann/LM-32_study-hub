'use client';
import { useEffect, useMemo, useState } from 'react';
import { VisualPlayer } from './aos-visual-player';
import {
  l5Defaults,
  l5Trace,
  type L5Mode,
  type L5Node,
  type L5Options,
} from './algoritmi-l05-model';

export function AlgoritmiLesson5Lab({
  id,
  title,
  mode,
}: {
  id: string;
  title: string;
  mode: L5Mode;
}) {
  const initial = mode === 'hash' ? [12, 7, 3, 22, 8] : [9, 16, 4, 1];
  const [values, setValues] = useState(initial),
    [draft, setDraft] = useState(initial.join(',')),
    [opts, setOpts] = useState({ ...l5Defaults, query: mode === 'hash' ? 12 : 4 }),
    [error, setError] = useState('');
  const model = useMemo(() => l5Trace(values, mode, opts), [values, mode, opts]);
  const [time, setTime] = useState(0),
    [running, setRunning] = useState(false),
    [delay, setDelay] = useState(2400),
    [reduced, setReduced] = useState(false);
  const last = model.frames.length - 1,
    playing = running && time < last;
  useEffect(() => {
    const q = matchMedia('(prefers-reduced-motion: reduce)'),
      fn = () => setReduced(q.matches);
    fn();
    q.addEventListener('change', fn);
    return () => q.removeEventListener('change', fn);
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
  function change(p: Partial<L5Options>) {
    move(0);
    setOpts((o) => ({ ...o, ...p }));
  }
  function apply() {
    try {
      const a = draft.trim() ? draft.split(',').map((x) => (x.trim() ? Number(x) : NaN)) : [];
      l5Trace(a, mode, opts);
      setValues(a);
      move(0);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const shown = reduced ? Math.floor(time) : time,
    step = Math.floor(shown),
    f = model.frames[step],
    g = model.frames[Math.min(last, step + 1)],
    u = shown - step,
    t = u * u * (3 - 2 * u),
    current = u > 0.001 ? g : f;
  const nodes = f.nodes.map((a, i) => {
    const b = g.nodes[i];
    return { ...(u > 0.001 ? b : a), x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  });
  const ink = { fill: '#203848' },
    height = mode === 'hash' ? 260 + opts.m * 65 : mode === 'containers' ? 650 : 540;
  const node = (id: string) => nodes.find((x) => x.id === id)!;
  const slot = (i: number) => {
    const angle = ((i - 1) * Math.PI * 2) / opts.capacity - Math.PI / 2;
    return { x: 440 + 165 * Math.cos(angle), y: 315 + 165 * Math.sin(angle) };
  };
  function edgePath(a: L5Node, b: L5Node, kind: 'next' | 'prev') {
    const y = kind === 'next' ? -10 : 10;
    if (mode === 'list' && ((kind === 'next' && a.x > b.x) || (kind === 'prev' && a.x < b.x))) {
      const bottom = kind === 'next' ? 355 : 390;
      return `M${a.x} ${a.y + 23}V${bottom}H${b.x}V${b.y + 25}`;
    }
    const direction = b.x > a.x ? 1 : -1;
    return `M${a.x + direction * 34} ${a.y + y} C${(a.x + b.x) / 2} ${a.y + y},${(a.x + b.x) / 2} ${b.y + y},${b.x - direction * 37} ${b.y + y}`;
  }
  return (
    <VisualPlayer
      id={id}
      title={title}
      subjectLabel="ALGORITMI / LEZIONE 5"
      step={step}
      count={model.frames.length}
      onStep={move}
      frame={{
        active: 0,
        title: current.title,
        detail: current.detail,
        values: {
          Elementi: current.size,
          Confronti: current.compared,
          Risultato: current.result,
          ...(mode === 'hash'
            ? { 'Fattore di carico': `${current.size}/${opts.m}` }
            : { Head: current.head, Tail: current.tail }),
        },
      }}
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
            Chiavi intere 0–99, separate da virgola
            <input
              aria-label="Chiavi lezione 5"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </label>
          <button onClick={apply}>Applica input</button>
          {mode === 'containers' ? (
            <>
              <label>
                Politica
                <select
                  aria-label="Tipo di contenitore"
                  value={opts.container}
                  onChange={(e) => change({ container: e.target.value as L5Options['container'] })}
                >
                  <option value="queue">Coda FIFO</option>
                  <option value="stack">Pila LIFO</option>
                </select>
              </label>
              <label>
                Celle N
                <select
                  aria-label="Numero celle"
                  value={opts.capacity}
                  onChange={(e) => change({ capacity: Number(e.target.value) })}
                >
                  {[4, 6, 8].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
            </>
          ) : (
            <>
              <label>
                Chiave da cercare
                <input
                  aria-label="Chiave cercata"
                  type="number"
                  min="0"
                  max="99"
                  value={opts.query}
                  onChange={(e) => {
                    const q = Number(e.target.value);
                    if (Number.isInteger(q) && q >= 0 && q <= 99) change({ query: q });
                  }}
                />
              </label>
              {mode === 'list' ? (
                <>
                  <label>
                    Rappresentazione
                    <select
                      aria-label="Rappresentazione lista"
                      value={opts.sentinel ? 'sentinel' : 'plain'}
                      onChange={(e) => change({ sentinel: e.target.value === 'sentinel' })}
                    >
                      <option value="plain">Con bordi NIL</option>
                      <option value="sentinel">Circolare con sentinella</option>
                    </select>
                  </label>
                  <label>
                    Inserimento
                    <select
                      aria-label="Posizione inserimento"
                      value={opts.prepend ? 'head' : 'after'}
                      onChange={(e) => change({ prepend: e.target.value === 'head' })}
                    >
                      <option value="after">Dopo il primo nodo</option>
                      <option value="head">In testa</option>
                    </select>
                  </label>
                  <button
                    onClick={() => {
                      setValues([]);
                      setDraft('');
                      move(0);
                      setError('');
                    }}
                  >
                    Prova lista vuota
                  </button>
                </>
              ) : (
                <>
                  <label>
                    Liste m
                    <select
                      aria-label="Numero liste hash"
                      value={opts.m}
                      onChange={(e) => change({ m: Number(e.target.value) })}
                    >
                      {[3, 5, 8].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Funzione
                    <select
                      aria-label="Funzione hash"
                      value={opts.hash}
                      onChange={(e) => change({ hash: e.target.value as L5Options['hash'] })}
                    >
                      <option value="division">k mod m</option>
                      <option value="multiplication">Moltiplicazione, w=16</option>
                      <option value="universal">Famiglia con p=101</option>
                      <option value="constant">Tutte nella lista 0</option>
                    </select>
                  </label>
                  {opts.hash === 'universal' && (
                    <>
                      <label>
                        Parametro a
                        <input
                          type="number"
                          aria-label="Parametro a"
                          min="1"
                          max="100"
                          value={opts.a}
                          onChange={(e) => {
                            const a = Number(e.target.value);
                            if (Number.isInteger(a) && a >= 1 && a <= 100) change({ a });
                          }}
                        />
                      </label>
                      <label>
                        Parametro b
                        <input
                          type="number"
                          aria-label="Parametro b"
                          min="0"
                          max="100"
                          value={opts.b}
                          onChange={(e) => {
                            const b = Number(e.target.value);
                            if (Number.isInteger(b) && b >= 0 && b <= 100) change({ b });
                          }}
                        />
                      </label>
                    </>
                  )}
                </>
              )}
            </>
          )}
          {error && <p role="alert">{error}</p>}
        </>
      }
      scene={
        <svg className="aos-scene" viewBox={`0 0 900 ${height}`} role="img" aria-label={title}>
          <defs>
            <marker
              id={`${id}-next`}
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="3"
              orient="auto"
            >
              <path d="M0 0L7 3L0 6Z" fill="#35688b" />
            </marker>
            <marker
              id={`${id}-prev`}
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="3"
              orient="auto"
            >
              <path d="M0 0L7 3L0 6Z" fill="#7b638c" />
            </marker>
          </defs>
          <rect width="900" height={height} fill="#f5f8fb" />
          <text x="25" y="32" fontSize="21" style={ink}>
            {mode === 'containers'
              ? opts.container === 'queue'
                ? `Coda circolare: capacità utile ${opts.capacity - 1}`
                : `Pila: capacità ${opts.capacity}`
              : mode === 'list'
                ? opts.sentinel
                  ? 'Lista circolare con sentinella S'
                  : 'Lista doppia con estremi NIL'
                : `Chaining: m = ${opts.m}; α = ${current.size}/${opts.m}`}
          </text>
          <text x="25" y="58" fontSize="16" style={ink}>
            {mode === 'hash'
              ? opts.hash === 'universal'
                ? `h(k) = ((${opts.a}k + ${opts.b}) mod 101) mod ${opts.m}; scelta dei parametri esplicita`
                : opts.hash === 'multiplication'
                  ? `h(k) = floor(${opts.m} · ((k · 40503) mod 65536) / 65536)`
                  : 'Cambia m o funzione per ricostruire l’intera traccia; non è un ridimensionamento gratuito.'
              : 'Oggetti persistenti: # distingue i record; il movimento illustra l’operazione.'}
          </text>
          {mode === 'containers' && (
            <>
              {Array.from({ length: opts.capacity }, (_, j) => {
                const p = opts.container === 'queue' ? slot(j + 1) : { x: 440, y: 490 - j * 43 };
                return (
                  <g key={j}>
                    <rect
                      x={p.x - 39}
                      y={p.y - 25}
                      width="78"
                      height="50"
                      fill="white"
                      stroke="#99afbf"
                    />
                    <text x={p.x - 60} y={p.y + 5} fontSize="17" style={ink}>
                      {j + 1}
                    </text>
                  </g>
                );
              })}
              {opts.container === 'queue' ? (
                <>
                  <text x="370" y="300" fontSize="20" style={ink}>
                    head = {current.head}
                  </text>
                  <text x="370" y="335" fontSize="20" style={ink}>
                    tail = {current.tail}
                  </text>
                  <text x="350" y="370" fontSize="17" style={ink}>
                    {current.size === 0
                      ? 'vuota'
                      : current.size === opts.capacity - 1
                        ? 'piena'
                        : 'cella riservata'}
                  </text>
                </>
              ) : (
                <text x="540" y="250" fontSize="22" style={ink}>
                  top = {current.size}
                </text>
              )}
              <text x="25" y="135" fontSize="16" style={ink}>
                In attesa
              </text>
              <text x="25" y="620" fontSize="16" style={ink}>
                Estratti: ordine da sinistra a destra
              </text>
            </>
          )}
          {mode === 'hash' &&
            Array.from({ length: opts.m }, (_, j) => (
              <g key={j}>
                <rect
                  x="180"
                  y={150 + j * 65}
                  width="680"
                  height="58"
                  fill="#eaf0f5"
                  stroke="#b8c9d4"
                />
                <text x="30" y={184 + j * 65} fontSize="20" style={ink}>
                  T[{j}]
                </text>
              </g>
            ))}
          {mode === 'list' && (
            <>
              <text x="25" y="170" fontSize="17" style={ink}>
                Blu: next · viola: prev · giallo: nodo speciale o confronto
              </text>
              <text x="25" y="205" fontSize="18" style={ink}>
                {opts.sentinel
                  ? 'S.next è la testa; S.prev è l’ultimo.'
                  : `head → ${current.order.length ? node(current.order[0]).key : 'NIL'}; estremi non collegati → NIL`}
              </text>
              {opts.sentinel && !current.order.length && (
                <>
                  <path
                    d="M65 260H110V330H35V288"
                    fill="none"
                    stroke="#35688b"
                    markerEnd={`url(#${id}-next)`}
                  />
                  <text x="120" y="320" fontSize="17" style={ink}>
                    S.next = S.prev = S
                  </text>
                </>
              )}
            </>
          )}
          {current.edges.map((e, i) => (
            <path
              key={`${e.kind}-${e.from}-${e.to}-${i}`}
              data-l05-edge={e.kind}
              d={edgePath(node(e.from), node(e.to), e.kind)}
              fill="none"
              stroke={e.kind === 'next' ? '#35688b' : '#7b638c'}
              strokeWidth="2"
              markerEnd={`url(#${id}-${e.kind})`}
            />
          ))}
          {nodes.map((n, i) => (
            <g key={n.id} data-l05-item={n.id} transform={`translate(${n.x},${n.y})`}>
              <rect
                x="-32"
                y="-22"
                width="64"
                height="44"
                rx="6"
                fill={
                  n.mark || n.id === 'sentinel'
                    ? '#fff0c8'
                    : n.state !== 'stored'
                      ? '#e9edf2'
                      : '#ddecf0'
                }
                stroke="#62869c"
                strokeWidth={n.mark ? 3 : 1}
              />
              <text textAnchor="middle" y="1" fontSize="18" style={ink}>
                {n.key}
              </text>
              <text textAnchor="middle" y="16" fontSize="10" style={ink}>
                {n.id === 'sentinel' ? 'sentinella' : `#${i + 1}`}
              </text>
            </g>
          ))}
        </svg>
      }
      checks={[
        {
          label: current.valid ? 'Stato completo della struttura' : 'Collegamenti in aggiornamento',
          ok: true,
        },
        {
          label:
            mode === 'hash'
              ? 'Funzione coerente durante la traccia'
              : mode === 'containers'
                ? 'Controlli di pieno e vuoto attivi'
                : 'Identità dei nodi conservate',
          ok: true,
        },
      ]}
      detailPanel={
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            padding: 12,
            background: '#edf2f6',
            color: '#203848',
            fontSize: 13,
          }}
        >
          {current.code}
        </pre>
      }
      legend={
        mode === 'hash'
          ? 'Hash e confronti sono un modello illustrativo. Parametri a,b scelti qui dall’utente, non campioni casuali; nessuna garanzia empirica di uniformità.'
          : mode === 'list'
            ? 'Nodi e archi seguono l’aggiornamento. Lo scollegamento non simula la liberazione della memoria.'
            : 'Pila e coda usano array a capacità fissa. La sequenza prova pieno, vuoto e riuso delle celle; tempi illustrativi.'
      }
    />
  );
}
