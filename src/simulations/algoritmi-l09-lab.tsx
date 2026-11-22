'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { VisualPlayer } from './aos-visual-player';
import { algorithmEase } from './algoritmi-motion';
import { maxHigh, searchTrace, type Mode } from './algoritmi-l09-model';

export function Lesson9Lab({ id, title, mode }: { id: string; title: string; mode: Mode }) {
  const interval = mode === 'interval';
  const [draft, setDraft] = useState(interval ? '22,25' : '13');
  const [model, setModel] = useState(() => searchTrace(mode, draft));
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [running, setRunning] = useState(false);
  const [delay, setDelay] = useState(1300);
  const [time, setTime] = useState(0);
  const last = model.frames.length - 1;
  const playing = running && time < last;
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    setReady(true);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!playing) return;
    let handle = 0;
    let previous = performance.now();
    function tick(now: number) {
      const elapsed = Math.max(0, Math.min(80, now - previous));
      previous = now;
      setTime((value) => Math.min(last, value + elapsed / delay));
      handle = requestAnimationFrame(tick);
    }
    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, [delay, last, playing]);

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setModel(searchTrace(mode, draft));
      setError('');
      setRunning(false);
      setTime(0);
    } catch (cause) {
      setError((cause as Error).message);
    }
  }
  const step = Math.floor(time), a = model.frames[step], b = model.frames[Math.min(last, step + 1)];
  const t = reduced ? 0 : algorithmEase(time - step);
  const frame = t >= 0.5 ? b : a;
  const nodeA = model.nodes[a.focus], nodeB = model.nodes[b.focus];
  const x = nodeA.x + (nodeB.x - nodeA.x) * t;
  const y = nodeA.y + (nodeB.y - nodeA.y) * t;
  return (
    <VisualPlayer
      id={id} title={title} subjectLabel="ALGORITMI / LEZIONE 9"
      frame={frame} step={frame.active} count={model.frames.length} onStep={setTime}
      transport={{ delay, setDelay, playing, stop: () => setRunning(false), toggle: () => {
        if (time === last) setTime(0);
        setRunning(!playing);
      } }}
      options={<form onSubmit={apply} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'end' }}>
        <label>{interval ? 'Estremi della richiesta' : 'Chiave da cercare'}
          <input disabled={!ready} value={draft} onChange={(e) => setDraft(e.target.value)} />
        </label>
        <button disabled={!ready} type="submit">Applica input</button>
        {error && <span role="alert">{error}</span>}
      </form>}
      checks={frame.result === undefined ? [] : [{
        label: interval ? 'Intersezione trovata' : 'Chiave trovata', ok: frame.result,
      }]}
      legend={interval ? 'Ogni nodo riporta intervallo e massimo. L’indicatore segue il cammino scelto.'
        : 'La radice è già in RAM. Il contatore aumenta quando si carica il blocco di un figlio.'}
      detailPanel={<div><pre>{frame.code}</pre><p>{Object.entries(frame.values).map(([label,value]) => label + ': ' + value).join(' · ')}</p></div>}
      scene={<svg className="aos-scene algoritmi-scene" viewBox="0 0 900 295" role="img" aria-label={title}>
        <rect className="algorithm-backdrop" width="100%" height="100%" />
        <text x="25" y="23" style={{ fontSize: 19 }}>{interval ? 'Richiesta [' + model.query.join(', ') + ']' : 'Chiave ' + model.query[0] + ' · Confronti nei blocchi caricati'}</text>
        {model.nodes.flatMap((node) => node.children.filter((id) => id >= 0).map((id) => {
          const child = model.nodes[id];
          return <line key={id} x1={node.x} y1={node.y} x2={child.x} y2={child.y} stroke="#718ba1" strokeWidth="2" />;
        }))}
        {model.nodes.map((node) => {
          const width = interval ? 112 : 114;
          return <g key={node.id} transform={'translate(' + node.x + ' ' + node.y + ')'}>
            <rect x={-width / 2} y="-22" width={width} height="44" rx="7"
              fill={interval ? node.red ? '#f5d9df' : '#dce5ee' : node.id === 0 ? '#d9eee6' : '#e1ebf2'}
              style={{ stroke: interval && node.red ? '#a83b4d' : '#607e94' }} />
            {interval ? <>
              <text y="-2" textAnchor="middle" fontSize="20">[{node.values.join(',')}]</text>
              <text y="15" textAnchor="middle" fontSize="15">max {maxHigh(node.id)}</text>
            </> : node.values.map((value, i) => {
              const offset = (i - (node.values.length - 1) / 2) * 45;
              return <g key={value} transform={'translate(' + offset + ' 0)'}>
                {frame.focus === node.id && frame.compared === i &&
                  <rect x="-20" y="-16" width="40" height="32" rx="5" fill="#ffe1a0" />}
                <text y="7" textAnchor="middle" fontSize="23">{value}</text>
              </g>;
            })}
          </g>;
        })}
        <rect data-search-cursor x={x-61} y={y-27} width="122" height="54" rx="11" fill="none"
          style={{ stroke: frame.result === true ? '#11705b' : '#a16012' }} strokeWidth="3" pointerEvents="none" />
      </svg>}
    />
  );
}
