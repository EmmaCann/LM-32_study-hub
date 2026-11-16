import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurriculum } from '@/lib/study-content';
import { getTopics } from '@/lib/content';
import { topicPath } from '@/lib/schema';
import { PageHeading, TopicList } from '@/components/catalog';
import { LessonVisit, StudySections } from '@/components/study-roadmap';
import { StudyAssessment } from '@/components/study-assessment';
export const dynamicParams = false;
export function generateStaticParams() {
  return getCurriculum().map((l) => ({ lessonId: l.id }));
}
export async function generateMetadata({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  return { title: getCurriculum().find((l) => l.id === lessonId)?.title ?? 'Lezione' };
}
export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const lessons = getCurriculum();
  const lesson = lessons.find((l) => l.id === lessonId);
  if (!lesson) notFound();
  const topics = getTopics().filter((t) => lesson.topicIds.includes(t.manifest.id));
  const subjectLessons = lessons.filter((l) => l.subject === lesson.subject);
  const index = subjectLessons.findIndex((l) => l.id === lesson.id);
  const next = subjectLessons[index + 1];
  return (
    <>
      <LessonVisit id={lesson.id} />
      <nav className="breadcrumbs" aria-label="Percorso">
        <Link href="/percorso">Percorso</Link>
        <span>/</span>
        <Link href={`/${lesson.subject}`}>{lesson.subject}</Link>
      </nav>
      <PageHeading eyebrow={lesson.chapter} title={lesson.title} description={lesson.description} />
      <div className="study-lesson-intro">
        <section className="panel">
          <h2>Cosa saprai fare</h2>
          <ul>
            {lesson.objectives.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
          <div className="study-actions">
            {lesson.document && (
              <Link
                className="button secondary"
                href={`/biblioteca?document=${lesson.document.id}`}
              >
                Apri gli appunti PDF
              </Link>
            )}
            {lesson.availability === 'ready' && (
              <a className="button primary" href="#verifica">
                Vai alla verifica finale
              </a>
            )}
          </div>
        </section>
        <section className="panel">
          <span className="eyebrow">COME STUDIARE</span>
          <h2>Leggi, sperimenta, verifica</h2>
          <p>
            Consulta gli appunti, esplora i laboratori e completa tutte le attività obbligatorie. Il
            percorso registra il superamento delle verifiche, non il tempo trascorso sulla pagina.
          </p>
        </section>
      </div>
      {lesson.sections.length > 0 && <StudySections lesson={lesson} />}
      <section className="study-lesson-topics">
        <h2>Argomenti e laboratori</h2>
        {topics.length ? (
          <TopicList topics={topics} />
        ) : (
          <p>
            {lesson.availability === 'ready'
              ? 'Per questa lezione consulta la teoria nel PDF e svolgi le verifiche qui sotto. I laboratori animati non sono ancora disponibili.'
              : 'Contenuti e verifiche in preparazione.'}
          </p>
        )}
        {topics.flatMap((t) =>
          t.simulations.map((s) => (
            <Link
              className="study-lab-link"
              key={`${t.manifest.id}-${s.id}`}
              href={`${topicPath(t.manifest)}#${s.id}`}
            >
              Apri animazione: {s.title} →
            </Link>
          )),
        )}
      </section>
      {lesson.availability === 'ready' && (
        <StudyAssessment lesson={lesson} next={next && { id: next.id, title: next.title }} />
      )}
      <nav className="study-actions study-lesson-nav" aria-label="Lezioni adiacenti">
        {subjectLessons[index - 1] && (
          <Link className="button secondary" href={`/percorso/${subjectLessons[index - 1].id}`}>
            ← Lezione precedente
          </Link>
        )}
        <Link className="button secondary" href={`/${lesson.subject}`}>
          Roadmap della materia
        </Link>
        {next && (
          <Link className="button secondary" href={`/percorso/${next.id}`}>
            Lezione successiva →
          </Link>
        )}
      </nav>
    </>
  );
}
