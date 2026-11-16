import { Code2 } from 'lucide-react';
import { getTopics } from '@/lib/content';
import { assetPath } from '@/lib/schema';
import { EmptyState, PageHeading } from '@/components/catalog';
import { ExerciseCard } from '@/components/exercise';
export const metadata = { title: 'Playground AOS' };
export default function AosPlayground() {
  const exercises = getTopics()
    .filter((t) => t.manifest.subject === 'aos')
    .flatMap((topic) =>
      topic.exercises
        .filter((exercise) => exercise.type === 'programming')
        .map((exercise) => ({ topic, exercise })),
    );
  return (
    <>
      <PageHeading
        eyebrow="ESERCITAZIONI DI CODICE"
        title="Playground AOS"
        description="Uno spazio per scrivere, completare e correggere il codice delle esercitazioni di Advanced Operating Systems."
      />
      {exercises.length ? (
        <div className="list">
          {exercises.map(({ topic, exercise }) => (
            <ExerciseCard
              key={`${topic.manifest.id}-${exercise.id}`}
              exercise={exercise}
              download={
                exercise.download ? assetPath(topic.manifest, exercise.download) : undefined
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Code2 size={24} />}
          title="Nessuna esercitazione di codice ancora disponibile"
          description="Le esercitazioni AOS con codice da completare compariranno qui quando saranno pronte."
        />
      )}
    </>
  );
}
