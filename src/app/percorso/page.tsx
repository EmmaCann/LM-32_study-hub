import { getCurriculum } from '@/lib/study-content';
import { subjects } from '@/lib/content';
import { PageHeading } from '@/components/catalog';
import { StudyRoadmap } from '@/components/study-roadmap';
import { StudyBackup } from '@/components/study-backup';
export const metadata = { title: 'Percorso di studio' };
export default function StudyPath() {
  const lessons = getCurriculum();
  return (
    <>
      <PageHeading
        eyebrow="STUDIA CON UN FILO LOGICO"
        title="Il tuo percorso"
        description="Una mappa delle lezioni, dalla teoria alla verifica. Ogni passo resta liberamente accessibile."
      />
      {subjects.map((subject) => (
        <StudyRoadmap
          key={subject.id}
          subjectTitle={subject.short}
          lessons={lessons.filter((l) => l.subject === subject.id)}
        />
      ))}
      <StudyBackup />
    </>
  );
}
