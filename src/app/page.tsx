import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getTopics } from '@/lib/content';
import { topicPath } from '@/lib/schema';
import { SubjectCards, TopicList } from '@/components/catalog';

export default function Dashboard() {
  const topics = getTopics();
  const simulations = topics.flatMap((t) =>
    t.simulations.map((s) => ({ ...s, url: `${topicPath(t.manifest)}#${s.id}` })),
  );
  return (
    <>
      <div className="page-heading home-heading">
        <h1>Il tuo studio</h1>
        <p>Scegli una materia o riprendi dagli ultimi appunti.</p>
      </div>
      <section aria-labelledby="subjects-title">
        <div className="section-heading">
          <h2 id="subjects-title">Materie</h2>
        </div>
        <SubjectCards topics={topics} />
      </section>
      <section aria-labelledby="notes-title">
        <div className="section-heading">
          <h2 id="notes-title">Ultimi appunti</h2>
          <Link href="/argomenti">
            Tutti gli appunti <ArrowRight size={16} />
          </Link>
        </div>
        <TopicList
          topics={[...topics]
            .sort((a, b) => b.manifest.updated.localeCompare(a.manifest.updated))
            .slice(0, 3)}
        />
      </section>
      <section aria-labelledby="practice-title">
        <div className="section-heading">
          <h2 id="practice-title">Fai pratica</h2>
          <Link href="/esercizi">
            Esercizi <ArrowRight size={16} />
          </Link>
        </div>
        <div className="practice-links">
          {simulations.map((s) => (
            <Link href={s.url} key={s.id}>
              <span>
                {s.title}
                <small>Simulazione interattiva</small>
              </span>
              <ArrowRight size={18} />
            </Link>
          ))}
        </div>
      </section>
      <p className="demo-note">I nuovi appunti appariranno qui dopo la revisione.</p>
    </>
  );
}
