'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { FileText, RotateCw } from 'lucide-react';
import { publishedNotesSchema, type PublishedNote } from '@/lib/published-notes';
import type { LocalPdf } from '@/lib/pdf-library';
const Viewer = dynamic(() => import('./pdf-viewer').then((m) => m.PdfViewer), {
  ssr: false,
  loading: () => <div className="desk-loading">Preparazione lettore…</div>,
});
let notesIndex: PublishedNote[] | undefined;
const cache = new Map<string, LocalPdf>();
export async function getPublishedNotes(signal?: AbortSignal) {
  if (notesIndex) return notesIndex;
  const response = await fetch('/notes/index.json', { signal });
  if (!response.ok) throw new Error('Raccolta appunti non disponibile.');
  notesIndex = publishedNotesSchema.parse(await response.json()).documents;
  return notesIndex;
}
export function LessonDocument({
  documentId,
  page = 1,
  onPageChange,
  compact = false,
}: {
  documentId: string;
  page?: number;
  onPageChange?: (page: number) => void;
  compact?: boolean;
}) {
  const [document, setDocument] = useState<LocalPdf>();
  const [message, setMessage] = useState('Apertura automatica degli appunti…');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    void (async () => {
      try {
        const entries = await getPublishedNotes(controller.signal);
        const entry = entries.find((d) => d.id === documentId);
        if (!entry) throw new Error('Gli appunti di questa lezione non sono ancora disponibili.');
        let pdf = cache.get(entry.fingerprint);
        if (!pdf) {
          const response = await fetch(entry.url, { signal: controller.signal });
          if (!response.ok) throw new Error('Impossibile aprire gli appunti. Riprova.');
          const blob = await response.blob();
          pdf = {
            id: entry.id,
            name: entry.filename,
            fingerprint: entry.fingerprint,
            blob,
            pages: entry.pages,
            anchors: {},
          };
          cache.set(entry.fingerprint, pdf);
          if (cache.size > 4) cache.delete(cache.keys().next().value!);
        }
        if (active) setDocument(pdf);
      } catch (error) {
        if (active && !controller.signal.aborted)
          setMessage(error instanceof Error ? error.message : 'Impossibile aprire gli appunti.');
      }
    })();
    const abort = () => controller.abort();
    window.addEventListener('pagehide', abort);
    return () => {
      active = false;
      window.removeEventListener('pagehide', abort);
      controller.abort();
    };
  }, [documentId, attempt]);
  return (
    <div className={`desk-document ${compact ? 'is-compact' : ''}`}>
      {document ? (
        <Viewer document={document} page={page} onPageChange={onPageChange} />
      ) : (
        <div className="desk-loading" role="status">
          <FileText size={36} />
          <p>{message}</p>
          <button className="button secondary" onClick={() => setAttempt((n) => n + 1)}>
            <RotateCw size={15} /> Riprova
          </button>
        </div>
      )}
    </div>
  );
}
