import { redirect } from 'next/navigation';
import { getCurriculum } from '@/lib/study-content';
export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ document?: string; page?: string }>;
}) {
  const query = await searchParams;
  const lesson = getCurriculum().find((l) => l.document?.id === query.document);
  redirect(
    lesson ? `/percorso/${lesson.id}?page=${Math.max(1, Number(query.page) || 1)}` : '/percorso',
  );
}
