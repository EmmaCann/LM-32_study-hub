import { PageHeading } from '@/components/catalog';
import { PdfLibrary } from '@/components/pdf-library';
import { StudyBackup } from '@/components/study-backup';
import { getCurriculum } from '@/lib/study-content';
export const metadata = { title: 'I miei PDF' };
export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ document?: string; page?: string }>;
}) {
  const params = await searchParams;
  return (
    <>
      <PageHeading
        eyebrow="LA TUA BIBLIOTECA LOCALE"
        title="I miei PDF"
        description="Cerca nei tuoi appunti e ritrova il punto della teoria collegato a ogni laboratorio."
      />
      <PdfLibrary
        key={`${params.document ?? 'library'}-${params.page ?? 1}`}
        lessons={getCurriculum()}
        initialDocument={params.document}
        initialPage={Math.max(1, Number(params.page) || 1)}
      />
      <StudyBackup />
    </>
  );
}
