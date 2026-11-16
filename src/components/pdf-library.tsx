'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { indexPdf, pdfSearch, removePdf, storePdf, usePdfLibrary } from '@/lib/pdf-library';
import type { StudyLesson } from '@/lib/study-schema';
const Viewer = dynamic(() => import('./pdf-viewer').then((m) => m.PdfViewer), {
  ssr: false,
  loading: () => <p>Preparazione lettore…</p>,
});
export function PdfLibrary({
  lessons,
  initialDocument,
  initialPage = 1,
}: {
  lessons: StudyLesson[];
  initialDocument?: string;
  initialPage?: number;
}) {
  const { documents, ready, warning } = usePdfLibrary();
  const [selected, setSelected] = useState(initialDocument ?? '');
  const [page, setPage] = useState(initialPage);
  const [assignment, setAssignment] = useState(lessons.find((l) => l.document)?.document?.id ?? '');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  const matches = pdfSearch(documents, query);
  const document = documents.find((d) => d.id === selected);
  async function load(files: File[]) {
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    try {
      const loadedDocuments = new Map(documents.map((d) => [d.id, d]));
      for (const file of files) {
        const known = lessons.find((l) => l.document?.filename === file.name)?.document;
        const id = known?.id ?? assignment;
        if (!id) throw new Error('Scegli una lezione per questo documento.');
        const previous = loadedDocuments.get(id);
        if (
          previous &&
          !window.confirm(
            `Sostituire ${previous.name}? I riferimenti dovranno essere riconfermati se il PDF è cambiato.`,
          )
        )
          continue;
        setMessage(`Lettura di ${file.name}…`);
        const parsed = await indexPdf(file, id, controller.signal, setMessage);
        if (controller.signal.aborted) break;
        if (previous?.fingerprint === parsed.fingerprint) parsed.anchors = previous.anchors;
        await storePdf(parsed);
        loadedDocuments.set(id, parsed);
        setSelected(id);
        setPage(1);
        setMessage(
          parsed.pages.some((p) => p.trim())
            ? `${file.name}: ${parsed.pages.length} pagine indicizzate sul dispositivo.`
            : `${file.name}: PDF senza testo ricercabile. Puoi sfogliarlo; OCR non incluso.`,
        );
      }
    } catch (error) {
      setMessage(
        controller.signal.aborted
          ? 'Indicizzazione annullata. I documenti già completati restano disponibili.'
          : error instanceof Error
            ? error.message
            : 'PDF non valido, protetto o illeggibile.',
      );
    } finally {
      setBusy(false);
      abort.current = null;
    }
  }
  return (
    <div className="study-library">
      <section className="panel">
        <h2>Collega i tuoi appunti</h2>
        <p>
          I PDF restano su questo dispositivo. Non vengono caricati sul server. Su iPad selezionali
          dall’app File; su un altro dispositivo dovrai selezionarli nuovamente.
        </p>
        <label>
          Associa i file non riconosciuti a{' '}
          <select
            aria-label="Lezione per il PDF"
            value={assignment}
            onChange={(e) => setAssignment(e.target.value)}
          >
            {lessons
              .filter((l) => l.document)
              .map((l) => (
                <option key={l.id} value={l.document!.id}>
                  {l.title}
                </option>
              ))}
          </select>
        </label>
        <div className="study-actions">
          <label className="button primary">
            Seleziona PDF
            <input
              className="study-file-input"
              aria-label="Seleziona PDF locali"
              type="file"
              multiple
              accept="application/pdf,.pdf"
              disabled={!ready || busy}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = '';
                void load(files);
              }}
            />
          </label>
          {busy && (
            <button className="button secondary" onClick={() => abort.current?.abort()}>
              Annulla indicizzazione
            </button>
          )}
        </div>
        <p className="muted">
          I nomi degli appunti già catalogati vengono riconosciuti automaticamente. Limiti: 50 MiB e
          500 pagine per PDF.
        </p>
        <p role="status">{message || (!ready ? 'Apertura archivio locale…' : '')}</p>
        {warning && (
          <p role="status" className="callout">
            {warning}
          </p>
        )}
      </section>
      <div className="study-library-layout">
        <section className="panel">
          <h2>I tuoi documenti</h2>
          {!documents.length && (
            <p>Nessun PDF collegato. Scegli i tuoi appunti per cercare la teoria.</p>
          )}
          {documents.map((d) => {
            const lesson = lessons.find((l) => l.document?.id === d.id);
            return (
              <div className="study-document-row" key={d.id}>
                <button
                  className="study-document-link"
                  onClick={() => {
                    setSelected(d.id);
                    setPage(1);
                  }}
                >
                  <strong>{d.name}</strong>
                  <small>
                    {lesson?.title} · {d.pages.length} pagine
                    {!d.pages.some((p) => p.trim()) ? ' · non ricercabile' : ''}
                  </small>
                </button>
                <button
                  className="button secondary"
                  aria-label={`Rimuovi ${d.name}`}
                  onClick={() => {
                    if (
                      window.confirm(
                        'Rimuovere il PDF e il suo indice da questo browser? Il file originale non verrà modificato.',
                      )
                    )
                      void removePdf(d.id);
                  }}
                >
                  Rimuovi
                </button>
              </div>
            );
          })}
          <label>
            Cerca nei PDF
            <input
              aria-label="Cerca nei PDF"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Un concetto nei tuoi appunti…"
            />
          </label>
          {query.trim() && <p role="status">{matches.length} pagine trovate</p>}
          {matches.slice(0, 100).map((m) => (
            <button
              className="study-search-result"
              key={`${m.id}-${m.page}`}
              onClick={() => {
                setSelected(m.id);
                setPage(m.page);
              }}
            >
              <strong>
                {m.title} · pagina {m.page}
              </strong>
              <span>{m.excerpt}</span>
            </button>
          ))}
          {matches.length > 100 && <p>Mostrate le prime 100 pagine: affina la ricerca.</p>}
        </section>
        <section className="panel study-reader" aria-label="Lettore PDF">
          {document ? (
            <>
              <h2>{document.name}</h2>
              <Viewer
                key={`${document.fingerprint}-${page}`}
                document={document}
                initialPage={page}
              />
            </>
          ) : (
            <>
              <h2>La teoria, nel tuo spazio</h2>
              <p>Seleziona un documento o un risultato per aprire la pagina.</p>
              <Link href="/percorso" className="text-link">
                Torna al percorso di studio →
              </Link>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
