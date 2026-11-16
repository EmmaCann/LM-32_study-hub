'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import { storePdf, usePdfLibrary } from '@/lib/pdf-library';
import type { Lesson } from '@/lib/study-schema';
const Viewer = dynamic(() => import('./pdf-viewer').then((m) => m.PdfViewer), { ssr: false });
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
  const { documents, warning } = usePdfLibrary();
  const pdf = documents.find((d) => d.id === reference.document.id);
  const anchor = pdf?.anchors[reference.key];
  const [page, setPage] = useState(reference.page);
  const [section, setSection] = useState(reference.section);
  const confirmed =
    pdf &&
    (pdf.fingerprint === reference.document.fingerprint || anchor?.fingerprint === pdf.fingerprint);
  const targetPage =
    anchor && anchor.fingerprint === pdf?.fingerprint ? anchor.page : reference.page;
  return (
    <section
      data-mobile-view={mobileView}
      className={`study-theory ${open ? 'is-open' : ''} ${expanded ? 'is-expanded' : ''}`}
    >
      <div className="study-theory-toolbar">
        <Link href={`/percorso/${reference.lessonId}`}>Lezione e verifiche</Link>
        <button
          className="button secondary"
          onClick={() => {
            setOpen((v) => !v);
            setMobileView('theory');
          }}
          aria-expanded={open}
        >
          {open ? 'Chiudi teoria' : 'Apri la teoria'} · p. {targetPage}
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
            <h3>
              {anchor && anchor.fingerprint === pdf?.fingerprint
                ? anchor.section
                : reference.section}
            </h3>
            <p>
              {reference.document.title} · pagina {targetPage}
            </p>
            {pdf ? (
              <>
                {!confirmed && (
                  <p className="callout" role="status">
                    Versione PDF diversa da quella revisionata: controlla e riconferma il
                    riferimento prima di fidarti della pagina indicata.
                  </p>
                )}
                <Viewer
                  key={`${pdf.fingerprint}-${targetPage}`}
                  document={pdf}
                  initialPage={targetPage}
                />
                <details>
                  <summary>Correggi il riferimento per il tuo PDF</summary>
                  <label>
                    Pagina corretta
                    <input
                      aria-label="Pagina riferimento teoria"
                      type="number"
                      value={page}
                      min={1}
                      max={pdf.pages.length}
                      onChange={(e) => setPage(Number(e.target.value))}
                    />
                  </label>
                  <label>
                    Sezione
                    <input
                      aria-label="Sezione riferimento teoria"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                    />
                  </label>
                  <button
                    className="button secondary"
                    disabled={
                      !Number.isInteger(page) ||
                      page < 1 ||
                      page > pdf.pages.length ||
                      !section.trim()
                    }
                    onClick={() =>
                      void storePdf({
                        ...pdf,
                        anchors: {
                          ...pdf.anchors,
                          [reference.key]: {
                            page,
                            section: section.trim(),
                            fingerprint: pdf.fingerprint,
                          },
                        },
                      })
                    }
                  >
                    Conferma riferimento su questo dispositivo
                  </button>
                </details>
              </>
            ) : (
              <>
                <p>Collega il documento dal dispositivo per leggere qui la teoria.</p>
                <Link className="button primary" href="/biblioteca">
                  Collega il documento
                </Link>
              </>
            )}
            {warning && <p role="status">{warning}</p>}
          </aside>
        )}
      </div>
    </section>
  );
}
