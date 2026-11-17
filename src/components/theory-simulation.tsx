'use client';
import Link from 'next/link';
import { useState } from 'react';
import { LessonDocument } from './lesson-document';
import type { Lesson } from '@/lib/study-schema';
export type TheoryReference = {
  document: NonNullable<Lesson['document']>;
  page: number;
  section: string;
  lessonId: string;
  key: string;
};
export function TheorySimulation({
  reference,
  children,
}: {
  reference: TheoryReference;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mobileView, setMobileView] = useState<'animation' | 'theory'>('animation');
  const [page, setPage] = useState(reference.page);
  return (
    <section
      data-mobile-view={mobileView}
      className={`study-theory ${open ? 'is-open' : ''} ${expanded ? 'is-expanded' : ''}`}
    >
      <div className="study-theory-toolbar">
        <Link
          href={`/percorso/${reference.lessonId}?view=labs&lab=${encodeURIComponent(reference.key)}`}
        >
          Apri nello spazio di studio
        </Link>
        <button
          className="button secondary"
          onClick={() => {
            setOpen((v) => !v);
            setMobileView('theory');
          }}
          aria-expanded={open}
        >
          {open ? 'Chiudi teoria' : 'Apri la teoria'} · p. {reference.page}
        </button>
        {open && (
          <button className="button secondary" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Riduci teoria' : 'Espandi teoria'}
          </button>
        )}
      </div>
      {open && (
        <div className="study-theory-views" role="group" aria-label="Vista dell’attività">
          <button
            className="button secondary"
            aria-pressed={mobileView === 'animation'}
            onClick={() => setMobileView('animation')}
          >
            Animazione
          </button>
          <button
            className="button secondary"
            aria-pressed={mobileView === 'theory'}
            onClick={() => setMobileView('theory')}
          >
            Teoria
          </button>
        </div>
      )}
      <div className="study-theory-layout">
        <div className="study-animation">{children}</div>
        {open && (
          <aside className="panel study-theory-pane" aria-label="Teoria della simulazione">
            <h3>{reference.section}</h3>
            <LessonDocument
              documentId={reference.document.id}
              page={page}
              onPageChange={setPage}
              compact
            />
          </aside>
        )}
      </div>
    </section>
  );
}
