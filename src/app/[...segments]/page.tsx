import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Download, Play, PenLine } from 'lucide-react';
import { getTopics, subjects, headings, searchEntries } from '@/lib/content';
import { topicPath, assetPath } from '@/lib/schema';
import { PageHeading, SubjectCards, TopicList } from '@/components/catalog';
import { Notes } from '@/components/markdown';
import { ExerciseCard } from '@/components/exercise';
import { SimulationPlayer } from '@/simulations/registry';
import { SearchBox } from '@/components/search';
export const dynamicParams = false;
export function generateStaticParams() {
  const topics = getTopics();
  return [
    ...['materie', 'argomenti', 'simulazioni', 'esercizi', 'ricerca'].map((s) => ({
      segments: [s],
    })),
    ...subjects.map((s) => ({ segments: [s.id] })),
    ...Array.from(new Set(topics.map((t) => `${t.manifest.subject}/${t.manifest.chapter.id}`))).map(
      (s) => ({ segments: s.split('/') }),
    ),
    ...topics.map((t) => ({ segments: topicPath(t.manifest).slice(1).split('/') })),
  ];
}
export async function generateMetadata({ params }: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await params;
  const topic = getTopics().find((t) => topicPath(t.manifest) === '/' + segments.join('/'));
  return {
    title:
      topic?.manifest.title ??
      subjects.find((s) => s.id === segments[0])?.short ??
      segments[0].charAt(0).toUpperCase() + segments[0].slice(1),
  };
}
export default async function Page({ params }: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await params,
    topics = getTopics(),
    [first, chapter] = segments;
  if (segments.length === 1) {
    if (first === 'materie')
      return (
        <>
          <PageHeading
            eyebrow="LA TUA BIBLIOTECA"
            title="Le tue materie"
            description="Quattro spazi di studio, un unico percorso."
          />
          <SubjectCards topics={topics} />
        </>
      );
    if (first === 'argomenti')
      return (
        <>
          <PageHeading
            eyebrow="ESPLORA LA RACCOLTA"
            title="Tutti gli argomenti"
            description="Appunti e percorsi di lettura, organizzati per capitolo."
          />
          <TopicList topics={topics} />
        </>
      );
    if (first === 'ricerca')
      return (
        <>
          <PageHeading
            eyebrow="TROVA UN COLLEGAMENTO"
            title="Cosa vuoi approfondire?"
            description="Una ricerca in tutto il tuo spazio di studio."
          />
          <SearchBox entries={searchEntries()} />
        </>
      );
    if (first === 'simulazioni' || first === 'esercizi') {
      const simulation = first === 'simulazioni';
      return (
        <>
          <PageHeading
            eyebrow={simulation ? 'IMPARA SPERIMENTANDO' : 'DALLA TEORIA ALLA PRATICA'}
            title={simulation ? 'Simulazioni interattive' : 'Esercizi'}
            description={
              simulation
                ? 'Osserva i passaggi. Fermati, torna indietro e ricomincia.'
                : 'Prova da sola, poi scopri suggerimenti e soluzioni.'
            }
          />
          <div className="resource-grid">
            {topics.flatMap((t) =>
              (simulation ? t.simulations : t.exercises).map((r) => (
                <Link
                  className="panel resource-card"
                  href={`${topicPath(t.manifest)}#${r.id}`}
                  key={`${t.manifest.id}-${r.id}`}
                >
                  {simulation ? <Play /> : <PenLine />}
                  <span className="eyebrow">
                    {subjects.find((s) => s.id === t.manifest.subject)?.short}
                  </span>
                  <h2>{r.title}</h2>
                  <p>{'description' in r ? r.description : r.prompt}</p>
                  <span className="text-link">
                    {simulation ? 'Apri simulazione' : 'Prova l’esercizio'} <ArrowRight size={17} />
                  </span>
                </Link>
              )),
            )}
          </div>
        </>
      );
    }
  }
  const subject = subjects.find((s) => s.id === first);
  if (!subject) notFound();
  const subjectTopics = topics.filter((t) => t.manifest.subject === first);
  if (segments.length <= 2) {
    const filtered = chapter
      ? subjectTopics.filter((t) => t.manifest.chapter.id === chapter)
      : subjectTopics;
    if (chapter && !filtered.length) notFound();
    const chapters = Array.from(
      new Map(filtered.map((t) => [t.manifest.chapter.id, t.manifest.chapter])).values(),
    );
    return (
      <>
        <nav className="breadcrumbs" aria-label="Percorso">
          <Link href="/materie">Materie</Link>
          <span>/</span>
          {chapter ? <Link href={`/${first}`}>{subject.short}</Link> : <span>{subject.short}</span>}
          {chapter && (
            <>
              <span>/</span>
              <span>{filtered[0].manifest.chapter.title}</span>
            </>
          )}
        </nav>
        <PageHeading
          eyebrow={chapter ? subject.title : 'IL TUO PERCORSO DI STUDIO'}
          title={chapter ? filtered[0].manifest.chapter.title : subject.short}
          description={subject.description}
        />
        {!filtered.length ? (
          <div className="empty">
            <h2>Questo spazio è pronto per i tuoi appunti.</h2>
            <p>I capitoli saranno aggiunti a partire dai materiali del corso, dopo la revisione.</p>
          </div>
        ) : (
          chapters.map((c) => (
            <section key={c.id}>
              <div className="section-heading">
                <h2>{c.title}</h2>
                {!chapter && (
                  <Link href={`/${first}/${c.id}`}>
                    Apri capitolo <ArrowRight size={16} />
                  </Link>
                )}
              </div>
              <TopicList topics={filtered.filter((t) => t.manifest.chapter.id === c.id)} />
            </section>
          ))
        )}
      </>
    );
  }
  const topic = topics.find((t) => topicPath(t.manifest) === '/' + segments.join('/'));
  if (!topic) notFound();
  const m = topic.manifest,
    index = subjectTopics.findIndex((t) => t.manifest.id === m.id),
    previous = subjectTopics[index - 1],
    next = subjectTopics[index + 1];
  return (
    <>
      <nav className="breadcrumbs" aria-label="Percorso">
        <Link href={`/${first}`}>{subject.short}</Link>
        <span>/</span>
        <Link href={`/${first}/${chapter}`}>{m.chapter.title}</Link>
        <span>/</span>
        <span>{m.title}</span>
      </nav>
      <div className="article-layout">
        <article>
          <div className="article-header">
            <div className="eyebrow">{subject.short}</div>
            <h1>{m.title}</h1>
            <p className="lead">{m.description}</p>
            <div className="article-meta">
              <span>
                Aggiornato il {new Date(m.updated).toLocaleDateString('it-IT', { timeZone: 'UTC' })}
              </span>
              <span>Revisione {m.revision}</span>
              {m.pdf && (
                <a
                  className="button secondary"
                  href={assetPath(m, m.pdf)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download size={17} />
                  Apri PDF
                </a>
              )}
            </div>
          </div>
          <Notes content={topic.content} manifest={m} />
          {topic.simulations.map((s) => (
            <SimulationPlayer key={s.id} simulation={s} />
          ))}
          {topic.exercises.map((e) => (
            <ExerciseCard
              key={e.id}
              exercise={e}
              download={e.download ? assetPath(m, e.download) : undefined}
            />
          ))}
          <details className="sources">
            <summary>Fonti e revisione</summary>
            <p>Revisione: {m.review.reviewer}. </p>
            <ul>
              {m.review.sources.map((s) => (
                <li key={s}>
                  {s.startsWith('https://') ? (
                    <a href={s} rel="noreferrer">
                      {s}
                    </a>
                  ) : (
                    s
                  )}
                </li>
              ))}
            </ul>
          </details>
          <nav className="article-nav" aria-label="Argomenti adiacenti">
            {previous ? (
              <Link href={topicPath(previous.manifest)}>
                <ArrowLeft size={18} />
                <span>
                  <small>PRECEDENTE</small>
                  {previous.manifest.title}
                </span>
              </Link>
            ) : (
              <Link href={`/${first}`}>
                <ArrowLeft size={18} />
                Torna alla materia
              </Link>
            )}
            {next && (
              <Link href={topicPath(next.manifest)}>
                <span>
                  <small>SUCCESSIVO</small>
                  {next.manifest.title}
                </span>
                <ArrowRight size={18} />
              </Link>
            )}
          </nav>
        </article>
        <aside className="toc">
          <span className="eyebrow">IN QUESTA PAGINA</span>
          <nav aria-label="Indice dell’argomento">
            {headings(topic.content).map((h) => (
              <a key={h.id} href={`#${h.id}`}>
                {h.title}
              </a>
            ))}
            {topic.simulations.map((s) => (
              <a key={s.id} href={`#${s.id}`}>
                <Play size={14} />
                {s.title}
              </a>
            ))}
            {topic.exercises.map((e) => (
              <a key={e.id} href={`#${e.id}`}>
                <PenLine size={14} />
                {e.title}
              </a>
            ))}
          </nav>
          <div className="toc-note">
            Prenditi il tempo di capire.
            <br />
            Puoi tornare a ogni passaggio.
          </div>
        </aside>
      </div>
    </>
  );
}
