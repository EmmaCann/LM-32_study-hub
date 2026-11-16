'use client';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, BookOpen, Route } from 'lucide-react';
import { useEffect } from 'react';
import { activityKey, lessonStatus, recommendedLesson, type StudyLesson } from '@/lib/study-schema';
import { updateProgress, useStudyProgress } from '@/lib/study-store';
export const lessonHref = (id: string) => `/percorso/${id}`;
export function StudyStorageNotice() {
  const { warning } = useStudyProgress();
  return warning ? (
    <p className="callout" role="status">
      {warning}
    </p>
  ) : null;
}
export function LessonVisit({ id }: { id: string }) {
  useEffect(() => {
    updateProgress((p) => ({
      ...p,
      lastLesson: id,
      visited: { ...p.visited, [id]: new Date().toISOString() },
    }));
  }, [id]);
  return null;
}
export function StudyRoadmap({
  lessons,
  subjectTitle,
}: {
  lessons: StudyLesson[];
  subjectTitle?: string;
}) {
  const { progress, ready, warning } = useStudyProgress();
  const completed = lessons.filter((l) => lessonStatus(l, progress) === 'Completata').length;
  return (
    <section
      className="study-roadmap"
      aria-label={subjectTitle ? `Percorso ${subjectTitle}` : 'Percorso di studio'}
    >
      <div className="study-section-heading">
        <div>
          <span className="eyebrow">IL TUO PERCORSO</span>
          <h2>{subjectTitle ?? 'Una lezione alla volta'}</h2>
        </div>
        <span>
          {ready ? `${completed} di ${lessons.length} completate` : 'Caricamento progressi…'}
        </span>
      </div>
      {warning && (
        <p role="status" className="callout">
          {warning}
        </p>
      )}
      <p className="muted">
        Segui l’ordine consigliato o scegli liberamente. Completa le verifiche per registrare ciò
        che hai imparato.
      </p>
      <ol className="study-steps">
        {lessons.map((lesson, index) => {
          const status = lessonStatus(lesson, progress);
          const required = lesson.activities.filter((a) => a.required);
          const passed = required.filter(
            (a) => progress.passed[activityKey(lesson.id, a.id)]?.signature === a.signature,
          ).length;
          return (
            <li
              key={lesson.id}
              className={status === 'Completata' ? 'study-step is-complete' : 'study-step'}
            >
              <span className="study-step-number">
                {status === 'Completata' ? (
                  <CheckCircle2 size={23} />
                ) : (
                  String(index + 1).padStart(2, '0')
                )}
              </span>
              <div>
                <span className="study-badge">{status}</span>
                <h3>
                  <Link href={lessonHref(lesson.id)}>{lesson.title}</Link>
                </h3>
                <p>{lesson.description}</p>
                <small>
                  {lesson.availability === 'ready'
                    ? `${passed}/${required.length} verifiche obbligatorie · ${lesson.topicIds.length} argomenti interattivi`
                    : 'Disponibile quando gli appunti saranno pronti'}
                </small>
              </div>
              <Link
                className="button secondary"
                href={lessonHref(lesson.id)}
                aria-label={`Apri ${lesson.title}`}
              >
                Apri <ArrowRight size={16} />
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
export function StudyResume({ lessons }: { lessons: StudyLesson[] }) {
  const { progress, ready, warning } = useStudyProgress();
  const next = recommendedLesson(lessons, progress);
  return (
    <section className="study-resume panel">
      <div>
        <span className="eyebrow">IL PROSSIMO PASSO</span>
        <h2>{ready && next ? next.title : 'Il tuo percorso di studio'}</h2>
        <p>
          {ready && next
            ? next.description
            : 'Teoria, laboratori e verifiche nello stesso percorso.'}
        </p>
        {warning && <p role="status">{warning}</p>}
      </div>
      <div className="study-actions">
        <Link className="button primary" href={ready && next ? lessonHref(next.id) : '/percorso'}>
          <Route size={18} />{' '}
          {progress.lastLesson === next?.id ? 'Riprendi lo studio' : 'Inizia a studiare'}
        </Link>
        <Link className="button secondary" href="/biblioteca">
          <BookOpen size={18} /> I miei PDF
        </Link>
      </div>
    </section>
  );
}
export function StudySections({ lesson }: { lesson: StudyLesson }) {
  const { progress } = useStudyProgress();
  const complete = lessonStatus(lesson, progress) === 'Completata';
  return (
    <section className="study-lesson-topics">
      <h2>Argomenti della lezione</h2>
      <p className="muted">
        Segui gli argomenti negli appunti. La verifica finale registra il completamento della
        lezione nel suo insieme.
      </p>
      <ol className="study-section-list">
        {lesson.sections.map((section) => {
          const key = `${lesson.id}-${section.id}`;
          return (
            <li key={section.id}>
              <div>
                <strong>{section.title}</strong>
                <small>
                  {complete
                    ? 'Verifica di lezione superata'
                    : progress.visited[key]
                      ? 'Consultato · verifica di lezione da completare'
                      : 'Da studiare'}
                </small>
              </div>
              <Link
                className="button secondary"
                href={`/biblioteca?document=${lesson.document!.id}&page=${section.page}`}
                onClick={() =>
                  updateProgress((p) => ({
                    ...p,
                    visited: { ...p.visited, [key]: new Date().toISOString() },
                  }))
                }
              >
                Teoria · p. {section.page}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
export function SubjectProgress({ lessons }: { lessons: StudyLesson[] }) {
  const { progress, ready } = useStudyProgress();
  const completed = lessons.filter((l) => lessonStatus(l, progress) === 'Completata').length;
  return (
    <div className="study-subject-progress">
      <span>
        {ready ? `${completed}/${lessons.length} lezioni completate` : 'Percorso di studio'}
      </span>
      <progress aria-label="Avanzamento materia" max={lessons.length || 1} value={completed} />
    </div>
  );
}
