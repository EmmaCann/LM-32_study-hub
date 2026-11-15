'use client';
import { useEffect, useMemo, useState } from 'react';
import { VisualPlayer } from './aos-visual-player';
import { lesson4Trace, l4Position, type L4Mode } from './algoritmi-l04-model';
export function AlgoritmiLesson4Lab({
  id,
  title,
  mode,
}: {
  id: string;
  title: string;
  mode: L4Mode;
}) {
  const initial =
    mode === 'radix'
      ? [329, 457, 657, 839, 436, 720, 355]
      : mode === 'bucket'
        ? [0.78, 0.17, 0.39, 0.26, 0.72, 0.94, 0.21, 0.12, 0.23, 0.68]
        : [17, 4, 9, 23, 1, 8, 15, 3, 21, 6, 14, 20, 2, 11, 19];
  const [draft, setDraft] = useState(initial.join(',')),
    [values, setValues] = useState(initial),
    [rank, setRank] = useState(6),
    [seed, setSeed] = useState(1),
    [strategy, setStrategy] = useState<'random' | 'medians'>('medians'),
    [m, setM] = useState(5),
    [error, setError] = useState('');
  const model = useMemo(
    () => lesson4Trace(values, mode, mode === 'select' ? rank : 1, strategy, seed, m),
    [values, mode, rank, strategy, seed, m],
  );
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
      prev = 0;
    const tick = (n: number) => {
      const dt = prev ? Math.min(100, n - prev) : 0;
      prev = n;
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
  function apply() {
    try {
      const a = draft.split(',').map((s) => (s.trim() ? Number(s) : NaN));
      lesson4Trace(a, mode, Math.min(rank, a.length), strategy, seed, m);
      setValues(a);
      setRank(Math.min(rank, a.length));
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
    ease = u * u * (3 - 2 * u),
    current = u > 0.001 ? g : f,
    ink = { fill: '#203848' },
    height = mode === 'bucket' ? 260 + 65 * m : 540;
  return (
    <VisualPlayer
      id={id}
      title={title}
      subjectLabel="ALGORITMI / LEZIONE 4"
      frame={{
        active: 0,
        title: current.title,
        detail: current.detail,
        values: {
          Fase: current.phase,
          'Rango locale': current.rank,
          Risultato: current.answer ?? 'in ricerca',
          Cifra: Math.min(current.digit, 3),
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
            {mode === 'bucket'
              ? 'Valori in [0,1), separati da virgola'
              : mode === 'select'
                ? 'Chiavi distinte: da 2 a 25 interi'
                : 'Da 2 a 10 interi: 0–999'}
            <input
              aria-label="Array della lezione 4"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </label>
          <button onClick={apply}>Applica input</button>
          {mode === 'select' && (
            <>
              <label>
                Rango cercato
                <select
                  aria-label="Rango cercato"
                  value={rank}
                  onChange={(e) => {
                    move(0);
                    setRank(Number(e.target.value));
                  }}
                >
                  {values.map((_, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Scelta del pivot
                <select
                  aria-label="Scelta del pivot"
                  value={strategy}
                  onChange={(e) => {
                    move(0);
                    setStrategy(e.target.value as 'random' | 'medians');
                  }}
                >
                  <option value="medians">Mediana delle mediane</option>
                  <option value="random">Pseudocasuale con seme</option>
                </select>
              </label>
              <label>
                Seme
                <input
                  aria-label="Seme selezione"
                  type="number"
                  value={seed}
                  onChange={(e) => {
                    move(0);
                    setSeed(Number(e.target.value) || 1);
                  }}
                />
              </label>
            </>
          )}
          {mode === 'bucket' && (
            <>
              <label>
                Numero di bucket
                <select
                  aria-label="Numero di bucket"
                  value={m}
                  onChange={(e) => {
                    move(0);
                    setM(Number(e.target.value));
                  }}
                >
                  {[3, 5, 10].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <button
                onClick={() => {
                  const a = [0.19, 0.18, 0.17, 0.16, 0.15, 0.14, 0.13, 0.12, 0.11, 0.1];
                  setDraft(a.join(','));
                  setValues(a);
                  move(0);
                }}
              >
                Input concentrato
              </button>
            </>
          )}
          {error && <p role="alert">{error}</p>}
        </>
      }
      scene={
        <svg className="aos-scene" viewBox={`0 0 900 ${height}`} role="img" aria-label={title}>
          <rect width="900" height={height} fill="#f5f8fb" />
          <text x="25" y="32" fontSize="21" style={ink}>
            {mode === 'radix'
              ? `Tre cifre: ${current.digit === 0 ? 'input' : current.digit === 1 ? 'unità' : current.digit === 2 ? 'decine' : 'centinaia'}`
              : mode === 'bucket'
                ? 'Distribuzione → ordine locale → concatenazione'
                : `Selezione: rango originale ${rank} · rango locale ${current.rank}`}
          </text>
          <text x="25" y="63" fontSize="17" style={ink}>
            {mode === 'select'
              ? 'Giallo: pivot · verde: elementi attivi · grigio: esclusi. # indica la posizione originaria.'
              : mode === 'radix'
                ? 'Le etichette # mantengono l’identità; si muove l’intero numero.'
                : 'B[b] rappresenta [b/m,(b+1)/m); l’estremo 1 non è ammesso.'}
          </text>
          {mode === 'bucket' &&
            current.phase !== 'done' &&
            Array.from({ length: m }, (_, b) => (
              <g key={b}>
                <rect
                  x="195"
                  y={185 + b * 65}
                  width="680"
                  height="50"
                  fill="#eaf1f6"
                  stroke="#abc0ce"
                />
                <text x="20" y={216 + b * 65} fontSize="18" style={ink}>
                  B[{b}] · {current.buckets[b].length} elementi
                </text>
              </g>
            ))}
          {mode === 'select' &&
            (current.phase === 'groups' || current.phase === 'pivot') &&
            current.groups.map((gr, i) => (
              <text key={i} x={95 + 165 * i} y="125" textAnchor="middle" fontSize="16" style={ink}>
                Gruppo {i + 1}
              </text>
            ))}
          {model.items.map((item) => {
            const a = l4Position(item.id, f, mode),
              b = l4Position(item.id, g, mode),
              x = a.x + (b.x - a.x) * ease;
            let y = a.y + (b.y - a.y) * ease;
            if (mode === 'radix' && a.x !== b.x)
              y += Math.sin(Math.PI * u) * (b.x > a.x ? -40 : 40);
            const active = current.active.includes(item.id),
              pivot = current.pivot === item.id,
              small =
                mode === 'select' &&
                values.length > 15 &&
                current.phase !== 'groups' &&
                current.phase !== 'pivot',
              w = small ? 29 : mode === 'bucket' ? 55 : 70;
            const median = current.groups.some(
              (gr) => gr[Math.floor((gr.length - 1) / 2)] === item.id,
            );
            return (
              <g
                key={item.id}
                data-l04-item={item.id}
                transform={`translate(${x},${y})`}
                opacity={mode === 'select' && !active ? 0.35 : 1}
              >
                <rect
                  x={-w / 2}
                  y="-21"
                  width={w}
                  height="48"
                  rx="6"
                  fill={pivot ? '#ffe2a1' : median && mode === 'select' ? '#d4e3f3' : '#deeee3'}
                  stroke={pivot ? '#aa7628' : '#5e8099'}
                  strokeWidth={pivot ? 3 : 1.5}
                />
                <text
                  y="0"
                  textAnchor="middle"
                  fontSize={small ? 12 : mode === 'bucket' ? 17 : 21}
                  style={ink}
                >
                  {mode === 'radix' ? String(item.value).padStart(3, '0') : item.value}
                </text>
                <text y="19" textAnchor="middle" fontSize={small ? 9 : 11} style={ink}>
                  #{item.origin + 1}
                </text>
              </g>
            );
          })}
          {mode === 'radix' && (
            <>
              <text x="25" y="300" fontSize="22" style={ink}>
                Criterio attivo:{' '}
                {current.digit <= 1 ? 'unità' : current.digit === 2 ? 'decine' : 'centinaia'}
              </text>
              <text x="25" y="345" fontSize="18" style={ink}>
                La cifra più significativa viene elaborata per ultima.
              </text>
              <text x="25" y="385" fontSize="18" style={ink}>
                Sulle cifre uguali si conserva il precedente ordine degli oggetti.
              </text>
            </>
          )}
          {mode === 'select' && current.phase !== 'groups' && current.phase !== 'pivot' && (
            <>
              <text x="25" y="230" fontSize="22" style={ink}>
                Elementi ancora attivi: {current.active.length}
              </text>
              <text x="25" y="280" fontSize="20" style={ink}>
                {current.answer === null
                  ? 'Il passo successivo conserva soltanto il lato che contiene il rango.'
                  : `Risultato della selezione: ${current.answer}`}
              </text>
            </>
          )}
        </svg>
      }
      detailPanel={
        <pre
          style={{
            whiteSpace: 'pre-wrap',
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
        mode === 'radix'
          ? 'Il modello mostra passate stabili sulle cifre, con identità persistenti. Non misura tempi reali.'
          : mode === 'bucket'
            ? 'Modifica m e confronta input distribuiti o concentrati. Il tempo lineare è atteso sotto ipotesi, non garantito da ogni lista.'
            : 'Le colonne visualizzano i gruppi da cinque; il pivot è selezionato ricorsivamente fra le mediane. Le chiavi devono essere distinte.'
      }
      checks={[
        {
          label: 'Identità degli elementi conservate',
          ok: new Set(current.order).size === values.length,
        },
        {
          label:
            mode === 'select'
              ? 'Rango locale valido nella parte attiva'
              : 'Input entro le ipotesi del modello',
          ok: mode === 'select' ? current.rank >= 1 && current.rank <= current.active.length : true,
        },
      ]}
    />
  );
}
