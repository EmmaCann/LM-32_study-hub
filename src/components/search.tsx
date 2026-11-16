'use client';
import { useDeferredValue, useState } from 'react';
import Link from 'next/link';
import { Search, ArrowUpRight } from 'lucide-react';
import { normalizeSearch, pdfSearch, usePdfLibrary } from '@/lib/pdf-library';
type Entry = { title: string; kind: string; url: string; text: string; subject?: string };
type LessonEntry = {
  id: string;
  title: string;
  description: string;
  subject: string;
  documentId?: string;
};
export function SearchBox({
  entries,
  lessons = [],
}: {
  entries: Entry[];
  lessons?: LessonEntry[];
}) {
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const [kind, setKind] = useState('');
  const [subject, setSubject] = useState('');
  const { documents } = usePdfLibrary();
  const terms = normalizeSearch(deferred).trim().split(/\s+/).filter(Boolean);
  const all: Entry[] = [
    ...entries.map((e) => ({ ...e, subject: e.url.split('/')[1] })),
    ...lessons.map((l) => ({
      title: l.title,
      kind: 'Lezione',
      url: `/percorso/${l.id}`,
      text: l.description,
      subject: l.subject,
    })),
    ...pdfSearch(documents, deferred).map((m) => ({
      title: `${m.title} ? pagina ${m.page}`,
      kind: 'PDF locale',
      url: `/biblioteca?document=${m.id}&page=${m.page}`,
      text: m.excerpt,
      subject: lessons.find((l) => l.documentId === m.id)?.subject,
    })),
  ];
  const found = terms.length
    ? all.filter(
        (e) =>
          (!kind || e.kind === kind) &&
          (!subject || e.subject === subject) &&
          (e.kind === 'PDF locale' ||
            terms.every((t) => normalizeSearch(e.title + ' ' + e.text).includes(t))),
      )
    : [];
  return (
    <>
      <label className="search-box">
        <Search />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Cerca in tutti i contenuti"
          placeholder="Un argomento, una lezione, una pagina dei tuoi PDF?"
        />
      </label>
      <div className="study-actions study-search-filters">
        <label>
          Materia
          <select
            aria-label="Filtra ricerca per materia"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="">Tutte</option>
            <option value="aos">AOS</option>
            <option value="algoritmi">Algoritmi</option>
            <option value="cpp">C++</option>
            <option value="ottimizzazione">Ottimizzazione</option>
          </select>
        </label>
        <label>
          Tipo
          <select
            aria-label="Filtra ricerca per tipo"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="">Tutti</option>
            {[
              'Lezione',
              'Argomento',
              'Sezione',
              'Simulazione',
              'Esercizio',
              'PDF locale',
              'Capitolo',
              'Materia',
            ].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        <Link href="/biblioteca">Gestisci i PDF locali →</Link>
      </div>
      <p role="status" className="muted">
        {terms.length
          ? `${found.length} risultati`
          : 'Cerca nei contenuti del sito e nei PDF che hai selezionato su questo dispositivo.'}
      </p>
      <div className="list">
        {found.slice(0, 100).map((e, i) => (
          <Link className="list-row" key={`${e.url}-${i}`} href={e.url}>
            <div>
              <span className="eyebrow">{e.kind}</span>
              <h3>{e.title}</h3>
              {e.kind === 'PDF locale' && <p className="study-search-excerpt">{e.text}</p>}
            </div>
            <ArrowUpRight />
          </Link>
        ))}
      </div>
      {found.length > 100 && <p>Mostrati i primi 100 risultati. Affina la ricerca.</p>}
      {terms.length > 0 && !found.length && (
        <div className="empty">
          Nessun risultato. Prova un?altra parola o collega i tuoi PDF nella biblioteca.
        </div>
      )}
    </>
  );
}
