import Link from 'next/link';
import { ArrowRight, BookOpen, PenLine, Play, Search } from 'lucide-react';
import { getTopics, subjects } from '@/lib/content';
import { EmptyState, SubjectCards, TopicList } from '@/components/catalog';

export default function Dashboard() {
  const topics = getTopics();
  const simulations = topics.reduce((total, topic) => total + topic.simulations.length, 0);
  const exercises = topics.reduce((total, topic) => total + topic.exercises.length, 0);
  const latestTopics = [...topics]
    .sort((a, b) => b.manifest.updated.localeCompare(a.manifest.updated))
    .slice(0, 3);

  return (
    <div className="dashboard-page">
      <section className="dashboard-welcome" aria-labelledby="welcome-title">
        <div className="welcome-copy">
          <div className="eyebrow">LM·32 STUDY HUB <span aria-hidden="true">/</span> PANORAMICA</div>
          <h1 id="welcome-title">Il tuo studio,<br />con ordine.</h1>
          <p>Appunti, materie e strumenti per riprendere il filo da dove vuoi.</p>
          <Link className="button primary" href="/materie">
            Scegli una materia <ArrowRight size={17} />
          </Link>
        </div>
        <div className="welcome-summary" aria-label="Contenuti disponibili">
          <div>
            <span>Materie</span>
            <strong>{subjects.length.toString().padStart(2, '0')}</strong>
          </div>
          <div>
            <span>Appunti</span>
            <strong>{topics.length.toString().padStart(2, '0')}</strong>
          </div>
          <div>
            <span>Strumenti pratici</span>
            <strong>{(simulations + exercises).toString().padStart(2, '0')}</strong>
          </div>
        </div>
      </section>

      <section className="dashboard-section" aria-labelledby="subjects-title">
        <div className="section-heading dashboard-section-heading">
          <div>
            <div className="eyebrow">LA TUA RACCOLTA</div>
            <h2 id="subjects-title">Scegli una materia</h2>
          </div>
          <Link href="/materie">Tutte le materie <ArrowRight size={16} /></Link>
        </div>
        <SubjectCards topics={topics} />
      </section>

      <div className="dashboard-bottom-grid">
        <section className="dashboard-section recent-section" aria-labelledby="recent-title">
          <div className="section-heading dashboard-section-heading">
            <div>
              <div className="eyebrow">AGGIORNAMENTI</div>
              <h2 id="recent-title">Appunti recenti</h2>
            </div>
            <Link href="/argomenti" aria-label="Tutti gli appunti">Tutti <ArrowRight size={16} /></Link>
          </div>
          {latestTopics.length ? (
            <TopicList topics={latestTopics} />
          ) : (
            <EmptyState
              compact
              icon={<BookOpen size={21} />}
              title="La raccolta è pronta"
              description="Gli appunti appariranno qui dopo la revisione."
              actionHref="/materie"
              actionLabel="Esplora le materie"
            />
          )}
        </section>

        <section className="dashboard-section study-tools" aria-labelledby="tools-title">
          <div className="section-heading dashboard-section-heading">
            <div>
              <div className="eyebrow">QUANDO VUOI APPROFONDIRE</div>
              <h2 id="tools-title">Strumenti di studio</h2>
            </div>
          </div>
          <div className="study-tool-list">
            <Link href="/simulazioni" className="study-tool-link">
              <span className="tool-icon"><Play size={18} /></span>
              <span><strong>Simulazioni</strong><small>{simulations} disponibili</small></span>
              <ArrowRight size={17} />
            </Link>
            <Link href="/esercizi" className="study-tool-link">
              <span className="tool-icon"><PenLine size={18} /></span>
              <span><strong>Esercizi</strong><small>{exercises} disponibili</small></span>
              <ArrowRight size={17} />
            </Link>
            <Link href="/ricerca" className="study-tool-link">
              <span className="tool-icon"><Search size={18} /></span>
              <span><strong>Cerca nella raccolta</strong><small>Materie, sezioni e contenuti</small></span>
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
