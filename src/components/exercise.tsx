'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { Exercise } from '@/lib/schema';
export function ExerciseCard({
  exercise: e,
  download,
  playgroundHref,
}: {
  exercise: Exercise;
  download?: string;
  playgroundHref?: string;
}) {
  const [hints, setHints] = useState(0),
    [solution, setSolution] = useState(false),
    [answer, setAnswer] = useState(''),
    [feedback, setFeedback] = useState('');
  if (e.type === 'cpp')
    return (
      <section id={e.id} className="exercise panel">
        <div className="eyebrow">
          ESERCITAZIONE C++ · {e.cpp?.difficulty} · {e.cpp?.standard}
        </div>
        <h3>{e.title}</h3>
        <p>{e.prompt}</p>
        <p>{e.cpp?.tests.length} casi di verifica disponibili.</p>
        {playgroundHref && (
          <Link className="button primary" href={playgroundHref}>
            Apri nel Playground C++
          </Link>
        )}
        {download && (
          <a className="button secondary" href={download} download>
            Scarica codice iniziale .cpp
          </a>
        )}
      </section>
    );
  return (
    <section id={e.id} className="exercise panel">
      <div className="eyebrow">METTI ALLA PROVA LE IDEE</div>
      <h3>{e.title}</h3>
      <p>{e.prompt}</p>
      {e.options ? (
        <fieldset>
          <legend>La tua risposta</legend>
          {e.options.map((o) => (
            <label className="option" key={o}>
              <input
                type="radio"
                name={e.id}
                value={o}
                checked={answer === o}
                onChange={() => {
                  setAnswer(o);
                  setFeedback('');
                }}
              />
              {o}
            </label>
          ))}
        </fieldset>
      ) : (
        <label className="answer-label">
          La tua risposta
          <textarea
            value={answer}
            onChange={(v) => setAnswer(v.target.value)}
            placeholder="Prova a ragionare prima di aprire la soluzione…"
          />
        </label>
      )}
      {e.options && (
        <button
          className="button secondary"
          disabled={!answer}
          onClick={() =>
            setFeedback(
              answer === e.answer
                ? 'Corretto. Ottimo ragionamento!'
                : 'Non ancora: prova un suggerimento e ripensa alla risposta.',
            )
          }
        >
          Verifica risposta
        </button>
      )}
      <p role="status">{feedback}</p>
      {download && (
        <a className="button secondary" href={download} download>
          Scarica esercizio .cpp
        </a>
      )}
      <div className="actions">
        <button
          className="button secondary"
          disabled={hints >= e.hints.length}
          onClick={() => setHints(hints + 1)}
        >
          Suggerimento {Math.min(hints + 1, e.hints.length)}/{e.hints.length}
        </button>
        <button
          className="button secondary"
          onClick={() => setSolution(!solution)}
          aria-expanded={solution}
        >
          {solution ? 'Nascondi soluzione' : 'Mostra soluzione'}
        </button>
      </div>
      {e.hints.slice(0, hints).map((h, i) => (
        <p className="callout" key={h}>
          <strong>Indizio {i + 1}.</strong> {h}
        </p>
      ))}
      {solution && (
        <div className="solution">
          <h4>Soluzione</h4>
          <pre>{e.solution}</pre>
          <p>{e.explanation}</p>
        </div>
      )}
    </section>
  );
}
