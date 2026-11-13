import Link from 'next/link';
import { getTopics } from '@/lib/content';
import { cppExercisePath, topicPath } from '@/lib/schema';
import { PageHeading, EmptyState } from '@/components/catalog';
import { CppNavigation } from '@/components/cpp-navigation';
import { Code2 } from 'lucide-react';
import '../playground/playground.css';
export const metadata = { title: 'Esercitazioni C++' };
export default function ExercisesPage() {
  const topics = getTopics().filter(
    (t) => t.manifest.subject === 'cpp' && t.exercises.some((e) => e.type === 'cpp'),
  );
  return (
    <>
      <CppNavigation />
      <PageHeading
        eyebrow="DALLA LEZIONE AL CODICE"
        title="Esercitazioni C++"
        description="Scegli un argomento e lavora su un esercizio nel Playground."
      />
      {topics.length ? (
        topics.map((t) => (
          <section key={t.manifest.id}>
            <div className="section-heading">
              <div>
                <p className="eyebrow">{t.manifest.chapter.title}</p>
                <h2>{t.manifest.title}</h2>
              </div>
              <Link href={topicPath(t.manifest)}>Apri argomento</Link>
            </div>
            <div className="resource-grid">
              {t.exercises
                .filter((e) => e.type === 'cpp')
                .map((e) => (
                  <Link
                    key={e.id}
                    className="panel resource-card"
                    href={cppExercisePath(t.manifest, e.id)}
                  >
                    <Code2 />
                    <span className="eyebrow">
                      {e.cpp?.difficulty} · {e.cpp?.standard}
                    </span>
                    <h2>{e.title}</h2>
                    <p>{e.prompt}</p>
                    <span className="text-link">Apri esercizio · {e.cpp?.tests.length} test</span>
                  </Link>
                ))}
            </div>
          </section>
        ))
      ) : (
        <EmptyState
          icon={<Code2 />}
          title="Spazio pronto per le esercitazioni"
          description="Qui compariranno gli esercizi originali approvati e verificati."
        />
      )}
    </>
  );
}
