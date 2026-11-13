import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTopics } from '@/lib/content';
import { topicPath } from '@/lib/schema';
import { CppPlayground } from '@/components/cpp-playground';
import { CppNavigation } from '@/components/cpp-navigation';
import { PageHeading } from '@/components/catalog';
import '../../playground.css';
export const dynamicParams = false;
export function generateStaticParams() {
  return getTopics()
    .filter((t) => t.manifest.subject === 'cpp')
    .flatMap((t) =>
      t.exercises
        .filter((e) => e.type === 'cpp')
        .map((e) => ({ topicId: t.manifest.id, exerciseId: e.id })),
    );
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ topicId: string; exerciseId: string }>;
}) {
  const p = await params;
  return {
    title:
      getTopics()
        .find((t) => t.manifest.id === p.topicId)
        ?.exercises.find((e) => e.id === p.exerciseId)?.title ?? 'Esercizio C++',
  };
}
export default async function ExercisePage({
  params,
}: {
  params: Promise<{ topicId: string; exerciseId: string }>;
}) {
  const { topicId, exerciseId } = await params;
  const topic = getTopics().find((t) => t.manifest.subject === 'cpp' && t.manifest.id === topicId);
  const exercise = topic?.exercises.find((e) => e.id === exerciseId && e.type === 'cpp');
  if (!topic || !exercise) notFound();
  return (
    <>
      <CppNavigation />
      <nav className="breadcrumbs" aria-label="Percorso">
        <Link href="/cpp">C++</Link>
        <span>/</span>
        <Link href={`/cpp/${topic.manifest.chapter.id}`}>{topic.manifest.chapter.title}</Link>
        <span>/</span>
        <Link href={topicPath(topic.manifest)}>{topic.manifest.title}</Link>
        <span>/</span>
        <span>{exercise.title}</span>
      </nav>
      <PageHeading
        eyebrow="ESERCITAZIONE C++"
        title={exercise.title}
        description="Compila il tuo tentativo e verifica i casi disponibili."
      />
      <CppPlayground
        key={`${topicId}/${exerciseId}`}
        exercise={exercise}
        referenceHref={topicPath(topic.manifest)}
      />
    </>
  );
}
