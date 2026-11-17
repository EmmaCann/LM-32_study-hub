'use client';
import { getPublishedNotes } from './lesson-document';
import type { PublishedNote } from '@/lib/published-notes';

import { useDeferredValue, useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Search, ArrowUpRight } from 'lucide-react';
import { normalizeSearch, pdfSearch } from '@/lib/pdf-library';
type Entry = { title: string; kind: string; url: string; text: string; subject?: string };
const subscribeHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;
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
  const [documents, setDocuments] = useState<PublishedNote[]>([]);
  const ready = useSyncExternalStore(subscribeHydration, clientReady, serverReady);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    void getPublishedNotes(controller.signal)
      .then((items) => {
        if (active) setDocuments(items);
      })
      .catch(() => {});
    const abort = () => controller.abort();
    window.addEventListener('pagehide', abort);
    return () => {
      active = false;
      window.removeEventListener('pagehide', abort);
      controller.abort();
    };
  }, []);
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
    ...pdfSearch(
      documents.map((d) => ({ id: d.id, name: d.title, pages: d.pages })),
      deferred,
    ).map((m) => ({
      title: `${m.title} · pagina ${m.page}`,
      kind: 'PDF',
      url: `/percorso/${documents.find((d) => d.id === m.id)!.lessonId}?page=${m.page}&view=theory`,
      text: m.excerpt,
      subject: lessons.find((l) => l.documentId === m.id)?.subject,
    })),
  ];
  const found = terms.length
    ? all.filter(
        (e) =>
          (!kind || e.kind === kind) &&
          (!subject || e.subject === subject) &&
          (e.kind === 'PDF' ||
            terms.every((t) => normalizeSearch(e.title + ' ' + e.text).includes(t))),
      )
    : [];
  return (
    <>
      <label className="search-box">
        <Search />
        <input
          disabled={!ready}
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Cerca in tutti i contenuti"
          placeholder="Un argomento, una lezione, una pagina degli appunti…"
        />
      </label>
      <div className="study-actions study-search-filters">
        <label>
          Materia
          <select
            aria-label="Filtra ricerca per materia"
            disabled={!ready}
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
            disabled={!ready}
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
              'PDF',
              'Capitolo',
              'Materia',
            ].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        <Link href="/percorso">Torna alle lezioni →</Link>
      </div>
      <p role="status" className="muted">
        {terms.length
          ? `${found.length} risultati`
          : 'Cerca negli appunti inclusi, nelle lezioni e nei laboratori.'}
      </p>
      <div className="list">
        {found.slice(0, 100).map((e, i) => (
          <Link className="list-row" key={`${e.url}-${i}`} href={e.url}>
            <div>
              <span className="eyebrow">{e.kind}</span>
              <h3>{e.title}</h3>
              {e.kind === 'PDF' && <p className="study-search-excerpt">{e.text}</p>}
            </div>
            <ArrowUpRight />
          </Link>
        ))}
      </div>
      {found.length > 100 && <p>Mostrati i primi 100 risultati. Affina la ricerca.</p>}
      {terms.length > 0 && !found.length && (
        <div className="empty">
          Nessun risultato. Prova un’altra parola o prova un termine più specifico.
        </div>
      )}
    </>
  );
}
