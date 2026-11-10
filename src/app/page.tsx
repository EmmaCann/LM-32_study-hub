import Link from 'next/link';
import { ArrowRight, BookOpen, Layers, Play, ArrowUpRight } from 'lucide-react';
import { getTopics, subjects } from '@/lib/content';
import { topicPath } from '@/lib/schema';
import { PageHeading, SubjectCards, TopicList } from '@/components/catalog';
export default function Dashboard() {
  const topics = getTopics(),
    simulations = topics.flatMap((t) =>
      t.simulations.map((s) => ({ ...s, url: `${topicPath(t.manifest)}#${s.id}` })),
    );
  return (
    <>
      <PageHeading
        eyebrow="IL TUO PERCORSO, UN CONCETTO ALLA VOLTA"
        title="Spazio alle tue idee."
        description="Riprendi un argomento, esplora una simulazione, metti in pratica ciò che impari."
      />
      <div className="dashboard-intro">
        <div className="intro-copy">
          <span className="eyebrow">LA TUA BIBLIOTECA PERSONALE</span>
          <h2>
            Capire. Collegare.
            <br />
            <span>Fare un passo avanti.</span>
          </h2>
          <p>Uno spazio ordinato per trasformare gli appunti in conoscenza.</p>
          <Link className="button primary" href="/argomenti">
            Esplora gli appunti <ArrowRight size={18} />
          </Link>
        </div>
        <div className="intro-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-center">
            <BookOpen size={42} />
          </div>
          <span className="art-label label-a">λ · idee</span>
          <span className="art-label label-b">&lt;/&gt; pratica</span>
          <span className="art-dot dot-a" />
          <span className="art-dot dot-b" />
        </div>
      </div>
      <div className="stats">
        <div>
          <BookOpen />
          <strong>{subjects.length}</strong>
          <span>Materie nel tuo spazio</span>
        </div>
        <div>
          <Layers />
          <strong>{topics.length}</strong>
          <span>Argomenti disponibili</span>
        </div>
        <div>
          <Play />
          <strong>{simulations.length}</strong>
          <span>Simulazioni da esplorare</span>
        </div>
      </div>
      <section>
        <div className="section-heading">
          <div>
            <span className="eyebrow">ORGANIZZA IL TUO STUDIO</span>
            <h2>Le tue materie</h2>
          </div>
          <Link href="/materie">
            Tutte le materie <ArrowRight size={16} />
          </Link>
        </div>
        <SubjectCards topics={topics} />
      </section>
      <div className="dashboard-lower">
        <section>
          <div className="section-heading">
            <h2>Ultimi appunti</h2>
            <Link href="/argomenti">
              Vedi tutti <ArrowRight size={16} />
            </Link>
          </div>
          <TopicList
            topics={[...topics]
              .sort((a, b) => b.manifest.updated.localeCompare(a.manifest.updated))
              .slice(0, 3)}
          />
        </section>
        <section>
          <div className="section-heading">
            <h2>Impara sperimentando</h2>
          </div>
          <div className="lab-card">
            <span className="lab-icon">
              <Play size={23} />
            </span>
            <h3>La teoria prende forma.</h3>
            <p>Segui ogni passaggio e osserva cosa cambia.</p>
            {simulations.map((s) => (
              <Link href={s.url} key={s.id}>
                {s.title}
                <ArrowUpRight size={17} />
              </Link>
            ))}
          </div>
        </section>
      </div>
      <p className="demo-note">
        Questa prima raccolta contiene esempi dimostrativi. Non rappresenta il programma ufficiale
        dei corsi.
      </p>
    </>
  );
}
