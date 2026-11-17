import { getCurriculum } from '@/lib/study-content';
import { AllCourses } from '@/components/study-portal';
import { StudyBackup } from '@/components/study-backup';
export const metadata = { title: 'Percorso di studio' };
export default function PathPage() {
  return (
    <>
      <AllCourses lessons={getCurriculum()} />
      <details className="portal-backup-details">
        <summary>Gestisci backup e progressi</summary>
        <StudyBackup />
      </details>
    </>
  );
}
