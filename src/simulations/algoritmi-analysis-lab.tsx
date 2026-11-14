'use client';
import { useEffect, useMemo, useState } from 'react';
import { VisualPlayer } from './aos-visual-player';
import {
  boundRatio,
  recurrencePosition,
  recurrenceTree,
  type RecurrenceConfig,
} from './algoritmi-analysis-model';

function useClock(last: number) {
  const [time, setTime] = useState(0),
    [running, setRunning] = useState(false);
  const [delay, setDelay] = useState(2400),
    [reduced, setReduced] = useState(false);
  const playing = running && time < last;
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
      const dt = previous ? Math.min(now - previous, 100) : 0;
      previous = now;
      setTime((t) => Math.min(last, t + dt / delay));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, last, delay]);
  const move = (n: number) => {
    setRunning(false);
    setTime(Math.max(0, Math.min(last, n)));
  };
  return {
    shown: reduced ? Math.floor(time) : time,
    move,
    transport: {
      playing,
      delay,
      setDelay,
      stop: () => setRunning(false),
      toggle: () => {
        if (time >= last) setTime(0);
        setRunning(!playing);
      },
    },
  };
}

export function AlgoritmiBoundsLab({ id, title }: { id: string; title: string }) {
  const [lower, setLower] = useState(4),
    [upper, setUpper] = useState(10),
    [threshold, setThreshold] = useState(25);
  const clock = useClock(19),
    n = 5 + 5 * clock.shown;
  const yMax = Math.max(50, upper * 1.1),
    x = (v: number) => 75 + ((v - 5) * 760) / 95;
  const y = (v: number) => 430 - (v * 360) / yMax;
  const ratio = boundRatio(n),
    samples = Array.from({ length: 101 - threshold }, (_, i) => threshold + i);
  const fits = samples.every((k) => lower <= boundRatio(k) && boundRatio(k) <= upper);
  function change(set: (v: number) => void, value: number) {
    clock.move(0);
    set(value);
  }
  const frame = {
    active: 0,
    title: `Esplora n = ${n.toFixed(1)}`,
    detail:
      'Dividiamo f(n) = 4n² + 100n + 500 per g(n) = n². Le costanti diventano rette orizzontali: la fascia deve contenere il rapporto da n₀ in poi. Il campionamento finito non è una dimostrazione asintotica.',
    values: {
      'f(n) / n²': ratio.toFixed(3),
      'n₀': threshold,
      'c₁': lower,
      'c₂': upper,
      'Interi campionati': samples.length,
    },
  };
  return (
    <VisualPlayer
      id={id}
      title={title}
      subjectLabel="ALGORITMI / LIMITI ASINTOTICI"
      frame={frame}
      step={Math.floor(clock.shown)}
      count={20}
      onStep={clock.move}
      transport={clock.transport}
      options={
        <>
          <label>
            c₁
            <input
              aria-label="Costante inferiore"
              type="range"
              min={1}
              max={10}
              value={lower}
              onChange={(e) => change(setLower, Number(e.target.value))}
            />
            <output>{lower}</output>
          </label>
          <label>
            c₂
            <input
              aria-label="Costante superiore"
              type="range"
              min={5}
              max={60}
              value={upper}
              onChange={(e) => change(setUpper, Number(e.target.value))}
            />
            <output>{upper}</output>
          </label>
          <label>
            n₀
            <input
              aria-label="Soglia asintotica"
              type="range"
              min={5}
              max={100}
              value={threshold}
              onChange={(e) => change(setThreshold, Number(e.target.value))}
            />
            <output>{threshold}</output>
          </label>
        </>
      }
      scene={
        <svg
          className="aos-scene"
          viewBox="0 0 900 510"
          role="img"
          aria-label="Rapporto f su g e fascia delle costanti"
        >
          <rect width="900" height="510" fill="#f5f8fa" />
          <text x="75" y="30" fill="#24445d" fontSize="19">
            Rapporto f(n) / n²: asse verticale lineare
          </text>
          <rect x={x(threshold)} y="60" width={835 - x(threshold)} height="370" fill="#e6f1ed" />
          {[0, 10, 20, 30, 40, 50, 60]
            .filter((v) => v <= yMax)
            .map((v) => (
              <g key={v}>
                <line x1="75" y1={y(v)} x2="835" y2={y(v)} stroke="#d4dfe5" />
                <text x="60" y={y(v) + 5} textAnchor="end" fontSize="14" fill="#36586b">
                  {v}
                </text>
              </g>
            ))}
          <path d="M75 60 V430 H850" fill="none" stroke="#36586b" />
          <line x1="75" y1={y(lower)} x2="835" y2={y(lower)} stroke="#39826c" strokeWidth="2" />
          <line x1="75" y1={y(upper)} x2="835" y2={y(upper)} stroke="#a86d27" strokeWidth="2" />
          <text x="840" y={y(upper) - 7} textAnchor="end" fill="#8d5b20" fontSize="16">
            c₂ = {upper}
          </text>
          <text x="840" y={y(lower) + 19} textAnchor="end" fill="#286c56" fontSize="16">
            c₁ = {lower}
          </text>
          <line
            x1={x(threshold)}
            y1="60"
            x2={x(threshold)}
            y2="445"
            stroke="#547891"
            strokeDasharray="6 5"
          />
          <text x={x(threshold)} y="465" textAnchor="middle" fill="#36586b" fontSize="16">
            n₀={threshold}
          </text>
          <path
            d={Array.from(
              { length: 96 },
              (_, i) => `${i ? 'L' : 'M'}${x(i + 5)},${y(boundRatio(i + 5))}`,
            ).join(' ')}
            fill="none"
            stroke="#385c9b"
            strokeWidth="4"
          />
          <g data-analysis-cursor transform={`translate(${x(n)},${y(ratio)})`}>
            <circle r="8" fill="#385c9b" stroke="white" strokeWidth="3" />
            <text x="13" y="-13" fill="#24445d" fontSize="17">
              {ratio.toFixed(2)}
            </text>
          </g>
          <text x="75" y="490" fill="#36586b" fontSize="15">
            n da 5 a 100 · verde: intervallo osservato da n₀ · cursore interpolato
          </text>
        </svg>
      }
      legend="Muovi le costanti e la soglia. Un controesempio confuta la fascia scelta; un campione finito non certifica tutti gli n futuri."
      checks={[
        { label: 'Fascia non invertita', ok: lower <= upper },
        {
          label: 'Campione corrente nella fascia',
          ok: lower <= ratio && ratio <= upper,
          note:
            n < threshold
              ? 'Il cursore precede n₀: qui il vincolo non è richiesto.'
              : 'Il confronto riguarda questo campione.',
        },
        {
          label: 'Interi da n₀ a 100 nella fascia',
          ok: fits,
          note: 'Non è una prova per ogni n ≥ n₀.',
        },
      ]}
    />
  );
}

export function AlgoritmiRecurrenceLab({ id, title }: { id: string; title: string }) {
  const [config, setConfig] = useState<RecurrenceConfig>({ a: 3, b: 4, power: 2, levels: 3 });
  const model = useMemo(() => recurrenceTree(config), [config]);
  const clock = useClock(config.levels),
    depth = Math.floor(clock.shown),
    visibleDepth = Math.ceil(clock.shown);
  function update(key: keyof RecurrenceConfig, value: number) {
    clock.move(0);
    setConfig((c) => ({ ...c, [key]: value }));
  }
  function position(node: (typeof model.nodes)[number]) {
    const target = recurrencePosition(node.depth, node.index, config.a);
    if (!node.depth) return target;
    const from = recurrencePosition(node.depth - 1, Math.floor(node.index / config.a), config.a);
    const u = Math.max(0, Math.min(1, clock.shown - node.depth + 1)),
      eased = u * u * (3 - 2 * u);
    return { x: from.x + (target.x - from.x) * eased, y: from.y + (target.y - from.y) * eased };
  }
  const frame = {
    active: 0,
    title: `Espansione fino al livello ${visibleDepth}`,
    detail: `T(n) = ${config.a}T(n/${config.b}) + n^${config.power}, con T(1)=1. Ogni nodo conserva la propria identità mentre nasce dal genitore. I numeri nei nodi sono le taglie, non i costi. n=${model.n} è una potenza di b: non servono arrotondamenti.`,
    values: {
      n: model.n,
      'a / b^p': model.ratio.toFixed(4),
      'Costo per livello': model.costs.join(' + '),
      'Somma del modello finito': model.total,
    },
  };
  return (
    <VisualPlayer
      id={id}
      title={title}
      subjectLabel="ALGORITMI / ALBERO DI RICORRENZA"
      frame={frame}
      step={depth}
      count={config.levels + 1}
      onStep={clock.move}
      transport={clock.transport}
      options={
        <>
          {(
            [
              ['a', [1, 2, 3], 'Sottoproblemi a'],
              ['b', [2, 3, 4], 'Divisore b'],
              ['power', [1, 2], 'Esponente del costo'],
              ['levels', [1, 2, 3], 'Profondità del modello'],
            ] as const
          ).map(([key, choices, label]) => (
            <label key={key}>
              {label}
              <select
                aria-label={label}
                value={config[key]}
                onChange={(e) => update(key, Number(e.target.value))}
              >
                {choices.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </>
      }
      scene={
        <svg
          className="aos-scene"
          viewBox="0 0 900 545"
          role="img"
          aria-label="Espansione animata dei sottoproblemi ricorsivi"
        >
          <rect width="900" height="545" fill="#f5f8fa" />
          <text x="30" y="27" fill="#24445d" fontSize="18">
            Ogni nodo mostra la taglia n / bⁱ · ultimo livello: casi base
          </text>
          {model.nodes
            .filter((node) => node.depth <= visibleDepth && node.parent)
            .map((node) => {
              const parent = model.nodes.find((n) => n.id === node.parent)!,
                p = position(parent),
                q = position(node);
              return (
                <line
                  key={node.id}
                  x1={p.x}
                  y1={p.y}
                  x2={q.x}
                  y2={q.y}
                  stroke="#9db5c3"
                  strokeWidth="1.8"
                />
              );
            })}
          {model.nodes
            .filter((node) => node.depth <= visibleDepth)
            .map((node) => {
              const pos = position(node),
                small = config.a ** node.depth > 10,
                leaf = node.depth === config.levels;
              return (
                <g key={node.id} data-rec-node={node.id} transform={`translate(${pos.x},${pos.y})`}>
                  <circle
                    r={small ? 12 : 24}
                    fill={leaf ? '#dcefe5' : '#e1ecf5'}
                    stroke={leaf ? '#368065' : '#456d96'}
                    strokeWidth="2"
                  />
                  <text
                    y={small ? 4 : 6}
                    textAnchor="middle"
                    fontSize={small ? 11 : 18}
                    fill="#24445d"
                  >
                    {node.size}
                  </text>
                </g>
              );
            })}
          <text x="30" y="445" fill="#24445d" fontSize="16">
            Costo del livello i: aⁱ × (n / bⁱ)ᵖ; per le foglie aᴸ × T(1)
          </text>
          {model.costs.map((cost, i) => (
            <g key={i} transform={`translate(${35 + i * 215},465)`}>
              <rect
                width="200"
                height="60"
                rx="7"
                fill={i <= depth ? '#e1ecf5' : '#eef1f3'}
                stroke="#bdcdd7"
              />
              <text x="100" y="24" textAnchor="middle" fontSize="15" fill="#36586b">
                Livello {i}
                {i === config.levels ? ' (foglie)' : ''}
              </text>
              <text x="100" y="48" textAnchor="middle" fontSize="20" fill="#24445d">
                {cost}
              </text>
            </g>
          ))}
        </svg>
      }
      legend="I figli si aprono dal genitore; gli archi seguono i nodi. Il totale riguarda questo albero finito, non è da solo una prova asintotica."
      detailPanel={
        <p>
          Confronto dei livelli: a/bᵖ{' '}
          {model.ratio < 1
            ? '< 1: i contributi decrescono.'
            : model.ratio === 1
              ? '= 1: i contributi sono uguali.'
              : '> 1: i contributi crescono.'}{' '}
          Le configurazioni modificabili sono esperimenti didattici originali.
        </p>
      }
      checks={[
        {
          label: 'Taglia dei casi base uguale a 1',
          ok: model.nodes.filter((n) => n.depth === config.levels).every((n) => n.size === 1),
        },
        {
          label: 'Numero di nodi al livello i uguale ad aⁱ',
          ok: model.costs.every(
            (_, i) => model.nodes.filter((n) => n.depth === i).length === config.a ** i,
          ),
        },
      ]}
    />
  );
}
