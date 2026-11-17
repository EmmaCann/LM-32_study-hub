import { getTopics } from '@/lib/content';
import { ExerciseCard } from '@/components/exercise';
import Link from 'next/link';
import { PageHeading } from '@/components/catalog';
import { getCurriculum } from '@/lib/study-content';
import { StudyActivityCard } from '@/components/study-assessment';
export const metadata = { title: 'Playground AOS · C' };
export default function AosPlayground() {
  const published = getTopics()
    .filter((t) => t.manifest.subject === 'aos')
    .flatMap((t) =>
      t.exercises.filter((e) => e.type === 'programming').map((e) => ({ topic: t, exercise: e })),
    );
  const lessons = getCurriculum().filter(
    (l) => l.subject === 'aos' && l.activities.some((a) => a.type === 'c-fragment'),
  );
  return (
    <>
      <PageHeading
        eyebrow="ESERCITAZIONI DI CODICE C"
        title="Playground AOS"
        description="Completa il codice che scrivi tu. Il contesto è fornito; i controlli indicano esattamente cosa è stato verificato."
      />
      <p className="callout">
        Questi esercizi verificano frammenti rispetto ad alternative previste. Non compilano né
        eseguono syscall, processi o moduli Linux. Gli ZIP originali del docente restano fuori dalla
        piattaforma.
      </p>
      <nav className="study-actions" aria-label="Esercitazioni C per lezione">
        {lessons.map((l) => (
          <a className="button secondary" key={l.id} href={`#${l.id}`}>
            {l.title.split(' - ')[0]}
          </a>
        ))}
      </nav>
      {published.length > 0 && (
        <section>
          <h2>Esercitazioni dei laboratori AOS</h2>
          {published.map(({ topic, exercise }) => (
            <ExerciseCard key={`${topic.manifest.id}-${exercise.id}`} exercise={exercise} />
          ))}
        </section>
      )}
      {published.length > 0 && (
        <section>
          <h2>Esercitazioni dei laboratori AOS</h2>
          {published.map(({ topic, exercise }) => (
            <ExerciseCard key={`${topic.manifest.id}-${exercise.id}`} exercise={exercise} />
          ))}
        </section>
      )}
      {lessons.map((l) => (
        <section key={l.id} id={l.id} className="study-aos-group">
          <div className="study-section-heading">
            <h2>{l.title}</h2>
            <Link href={`/percorso/${l.id}`}>Teoria e verifica completa →</Link>
          </div>
          {l.activities
            .filter((a) => a.type === 'c-fragment')
            .map((a) => (
              <StudyActivityCard key={a.id} lessonId={l.id} activity={a} />
            ))}
        </section>
      ))}
    </>
  );
}
