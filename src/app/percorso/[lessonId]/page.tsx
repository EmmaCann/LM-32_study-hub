import { notFound } from 'next/navigation';
import { getCurriculum } from '@/lib/study-content';
import { getTopics } from '@/lib/content';
import { LessonWorkspace } from '@/components/lesson-workspace';
export const dynamicParams = false;
export function generateStaticParams() {
  return getCurriculum().map((l) => ({ lessonId: l.id }));
}
export async function generateMetadata({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  return { title: getCurriculum().find((l) => l.id === lessonId)?.title ?? 'Lezione' };
}
export default async function LessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ view?: string; page?: string; lab?: string }>;
}) {
  const { lessonId } = await params;
  const query = await searchParams;
  const lessons = getCurriculum();
  const lesson = lessons.find((l) => l.id === lessonId);
  if (!lesson) notFound();
  const topics = getTopics().filter((t) => lesson.topicIds.includes(t.manifest.id));
  const simulations = topics.flatMap((t) =>
    t.simulations.map((s) => ({ ...s, topicId: t.manifest.id })),
  );
  const requestedPage = Number(query.page);
  const initialPage = Number.isSafeInteger(requestedPage)
    ? Math.min(lesson.document?.pages ?? 1, Math.max(1, requestedPage))
    : 1;
  const view = ['theory', 'labs', 'code', 'check'].includes(query.view ?? '')
    ? (query.view as 'theory' | 'labs' | 'code' | 'check')
    : !lesson.document && simulations.length ? 'labs' : 'theory';
  return (
    <LessonWorkspace
      key={lesson.id}
      lesson={lesson}
      courseLessons={lessons
        .filter((l) => l.subject === lesson.subject)
        .map((l) => ({ id: l.id, title: l.title }))}
      simulations={simulations}
      exercises={topics.flatMap((t) =>
        t.exercises.map((exercise) => ({ topicId: t.manifest.id, exercise })),
      )}
      initialLab={query.lab}
      initialView={view}
      initialPage={initialPage}
    />
  );
}
