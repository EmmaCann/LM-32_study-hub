import Link from 'next/link';
import { getCurriculum } from '@/lib/study-content';
import { getTopics } from '@/lib/content';
import { PageHeading, SubjectCards } from '@/components/catalog';
import { StudyResume } from '@/components/study-roadmap';
import { StudyBackup } from '@/components/study-backup';
export default function Dashboard() {
  return (
    <div className="study-dashboard">
      <PageHeading
        eyebrow="LM·32 STUDY HUB"
        title="Dai un filo al tuo studio."
        description="Lezioni in ordine, teoria a portata di mano e piccole verifiche per capire cosa hai davvero imparato."
      />
      <StudyResume lessons={getCurriculum()} />
      <section>
        <div className="study-section-heading">
          <h2>Le tue materie</h2>
          <div className="study-actions">
            <Link href="/materie">Tutte le materie</Link>
            <Link href="/percorso">Tutto il percorso →</Link>
          </div>
        </div>
        <SubjectCards topics={getTopics()} lessons={getCurriculum()} />
      </section>
      <section className="study-tool-grid">
        <Link className="panel" href="/biblioteca">
          <span className="eyebrow">LEGGI</span>
          <h2>La tua teoria</h2>
          <p>Collega i PDF dal dispositivo e cerca una pagina, un termine o un concetto.</p>
          <strong>Apri i tuoi PDF →</strong>
        </Link>
        <Link className="panel" href="/simulazioni">
          <span className="eyebrow">SPERIMENTA</span>
          <h2>Guarda i meccanismi</h2>
          <p>Animazioni collegate al punto corrispondente degli appunti.</p>
          <strong>Esplora i laboratori →</strong>
        </Link>
        <Link className="panel" href="/aos/playground">
          <span className="eyebrow">METTITI ALLA PROVA</span>
          <h2>Scrivi codice</h2>
          <p>Frammenti C per AOS e compilazione reale nel Playground C++.</p>
          <strong>Apri le esercitazioni AOS →</strong>
        </Link>
      </section>
      <StudyBackup />
    </div>
  );
}
