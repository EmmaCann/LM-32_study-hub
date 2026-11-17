import { getCurriculum } from '@/lib/study-content';
import { StudyPortal } from '@/components/study-portal';
export default function Dashboard() {
  return <StudyPortal lessons={getCurriculum()} />;
}
