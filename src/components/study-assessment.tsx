'use client';
import Link from 'next/link';
import { useState } from 'react';
import { CppEditor } from './cpp-editor';
import {
  activityKey,
  fragmentMatches,
  lessonStatus,
  type StudyActivity,
  type StudyLesson,
} from '@/lib/study-schema';
import { passActivity, saveDraft, useStudyProgress } from '@/lib/study-store';
export function StudyActivityCard({
  lessonId,
  activity,
}: {
  lessonId: string;
  activity: StudyActivity;
}) {
  const { progress, ready } = useStudyProgress();
  const key = activityKey(lessonId, activity.id);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [hints, setHints] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const passed = progress.passed[key]?.signature === activity.signature;
  const value =
    progress.drafts[key]?.value ?? (activity.type === 'c-fragment' ? activity.starter : '');
  function verify() {
    const ok =
      activity.type === 'choice'
        ? answer === activity.answer
        : activity.type === 'c-fragment' && fragmentMatches(value, activity.alternatives);
    setFeedback(
      ok
        ? activity.type === 'c-fragment'
          ? 'Frammento verificato rispetto ai requisiti.'
          : 'Risposta corretta.'
        : 'Da rivedere: confronta la risposta con i requisiti e riprova.',
    );
    if (ok) passActivity(key, activity.signature);
  }
  return (
    <section className="panel study-activity" id={activity.id}>
      <span className={`study-badge ${passed ? 'is-passed' : ''}`}>
        {passed ? 'Superata' : activity.required ? 'Obbligatoria' : 'Facoltativa'} ·{' '}
        {activity.type === 'c-fragment'
          ? 'Codice C'
          : activity.type === 'cpp'
            ? 'Codice C++'
            : 'Comprensione'}
      </span>
      <h3>{activity.title}</h3>
      {activity.type === 'cpp' ? (
        <>
          <p>{activity.explanation}</p>
          <Link
            className="button primary"
            href={`/cpp/playground/${activity.topicId}/${activity.exerciseId}`}
          >
            Apri esercizio C++
          </Link>
        </>
      ) : (
        <>
          {activity.title !== activity.prompt && <p>{activity.prompt}</p>}
          {activity.type === 'choice' ? (
            <fieldset>
              <legend>La tua risposta</legend>
              {activity.options.map((option) => (
                <label className="option" key={option}>
                  <input
                    type="radio"
                    disabled={!ready}
                    name={key}
                    value={option}
                    checked={answer === option}
                    onChange={() => {
                      setAnswer(option);
                      setFeedback('');
                    }}
                  />
                  {option}
                </label>
              ))}
            </fieldset>
          ) : (
            <>
              <p className="callout">
                Controllo del frammento C: confronto con alternative previste. Nessuna compilazione
                o esecuzione Linux.
              </p>
              <pre className="study-code">
                <code>{activity.context}</code>
              </pre>
              <label>Scrivi soltanto il frammento da inserire</label>
              {ready && (
                <CppEditor
                  label={`Frammento C: ${activity.title}`}
                  value={value}
                  onChange={(value) => {
                    saveDraft(key, value);
                    setFeedback('');
                  }}
                />
              )}
              <p className="muted">
                Il controllo ignora spazi e commenti esterni alle stringhe. Una soluzione diversa
                può essere valida ma non ancora prevista: un rifiuto non prova che il tuo codice sia
                errato.
              </p>
            </>
          )}
          <div className="study-actions">
            <button
              className="button primary"
              disabled={!ready || (activity.type === 'choice' && !answer)}
              onClick={verify}
            >
              Verifica attività
            </button>
            <button
              className="button secondary"
              disabled={hints >= activity.hints.length}
              onClick={() => setHints((n) => n + 1)}
            >
              Suggerimento {Math.min(hints + 1, activity.hints.length)}/{activity.hints.length}
            </button>
            <button
              className="button secondary"
              onClick={() => setShowSolution((s) => !s)}
              aria-expanded={showSolution}
            >
              {showSolution ? 'Nascondi soluzione' : 'Mostra soluzione'}
            </button>
          </div>
          <p role="status">{feedback}</p>
          {feedback && <p>{activity.explanation}</p>}
          {activity.hints.slice(0, hints).map((h) => (
            <p className="callout" key={h}>
              {h}
            </p>
          ))}
          {showSolution && (
            <div className="callout">
              <pre className="study-code">
                {activity.type === 'choice' ? activity.answer : activity.solution}
              </pre>
              <p>{activity.explanation}</p>
              <small>
                Aprire la soluzione non registra il superamento: verifica la tua risposta.
              </small>
            </div>
          )}
        </>
      )}
    </section>
  );
}
export function StudyAssessment({
  lesson,
  next,
}: {
  lesson: StudyLesson;
  next?: { id: string; title: string };
}) {
  const { progress } = useStudyProgress();
  const status = lessonStatus(lesson, progress);
  const required = lesson.activities.filter((a) => a.required);
  const count = required.filter(
    (a) => progress.passed[activityKey(lesson.id, a.id)]?.signature === a.signature,
  ).length;
  return (
    <section className="study-assessment" id="verifica">
      <div className="study-section-heading">
        <div>
          <span className="eyebrow">METTI ALLA PROVA LA COMPRENSIONE</span>
          <h2>Verifica di fine lezione</h2>
        </div>
        <strong>
          {count}/{required.length} superate
        </strong>
      </div>
      <p>Tutte le attività obbligatorie devono essere superate. Puoi riprovare senza limiti.</p>
      {status === 'Completata' && (
        <div className="study-success" role="status">
          <h3>Lezione completata</h3>
          <p>Hai superato tutte le verifiche richieste.</p>
          {next ? (
            <Link className="button primary" href={`/percorso/${next.id}`}>
              Prossima lezione: {next.title}
            </Link>
          ) : (
            <Link className="button primary" href="/percorso">
              Torna al percorso
            </Link>
          )}
        </div>
      )}
      {lesson.activities.map((activity) => (
        <StudyActivityCard key={activity.id} lessonId={lesson.id} activity={activity} />
      ))}
    </section>
  );
}
