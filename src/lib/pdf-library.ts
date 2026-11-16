'use client';
import { useSyncExternalStore } from 'react';
export type LocalPdf = {
  id: string;
  name: string;
  fingerprint: string;
  blob: Blob;
  pages: string[];
  anchors: Record<string, { page: number; section: string; fingerprint: string }>;
};
type StoredPdf = Omit<LocalPdf, 'blob'> & { bytes: ArrayBuffer };
function restoreDocument(stored: StoredPdf | LocalPdf): LocalPdf {
  if ('bytes' in stored) {
    const { bytes, ...metadata } = stored;
    return { ...metadata, blob: new Blob([bytes], { type: 'application/pdf' }) };
  }
  return stored;
}
type Snapshot = { documents: LocalPdf[]; ready: boolean; warning: string };
const initial: Snapshot = { documents: [], ready: false, warning: '' };
let state = initial;
let initialized = false;
const listeners = new Set<() => void>();
let database: Promise<IDBDatabase> | undefined;
function db() {
  return (database ??= new Promise((resolve, reject) => {
    const request = indexedDB.open('lm32-private-pdfs-v1', 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore('documents', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Archivio occupato da un’altra scheda.'));
  }));
}
async function transaction<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('documents', mode);
    const request = run(tx.objectStore('documents'));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
function notify() {
  for (const listener of listeners) listener();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!initialized) {
    initialized = true;
    void transaction('readonly', (s) => s.getAll())
      .then((documents) => {
        state = {
          documents: (documents as (StoredPdf | LocalPdf)[]).map(restoreDocument),
          ready: true,
          warning: '',
        };
        notify();
      })
      .catch(() => {
        state = {
          ...state,
          ready: true,
          warning: 'Archivio PDF non disponibile: i documenti resteranno solo nella sessione.',
        };
        notify();
      });
  }
  return () => {
    listeners.delete(listener);
  };
}
export function usePdfLibrary() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => initial,
  );
}
export async function storePdf(document: LocalPdf) {
  let warning = '';
  try {
    // File-backed Blobs are not consistently serializable in WebKit. Store a
    // plain ArrayBuffer and reconstruct the Blob when reading the local DB.
    const { blob, ...metadata } = document;
    const stored: StoredPdf = { ...metadata, bytes: await blob.arrayBuffer() };
    await transaction('readwrite', (s) => s.put(stored));
  } catch {
    warning =
      'Impossibile conservare il PDF sul dispositivo. È disponibile in questa sessione; selezionalo nuovamente alla prossima apertura.';
  }
  state = {
    documents: [...state.documents.filter((d) => d.id !== document.id), document],
    ready: true,
    warning,
  };
  notify();
}
export async function removePdf(id: string) {
  try {
    await transaction('readwrite', (s) => s.delete(id));
  } catch {
    state = {
      ...state,
      warning:
        'PDF rimosso dalla sessione. L’archivio persistente non è accessibile: se era già salvato, riprova a rimuoverlo quando l’archivio torna disponibile.',
    };
  }
  state = { ...state, documents: state.documents.filter((d) => d.id !== id) };
  notify();
}
export async function pdfEngine() {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf/pdf.worker.min.mjs';
  return pdfjs;
}
export async function indexPdf(
  file: File,
  id: string,
  signal: AbortSignal,
  onProgress: (message: string) => void,
): Promise<LocalPdf> {
  if (file.size > 50 * 1024 * 1024) throw new Error('Limite di 50 MiB per documento.');
  if (!globalThis.crypto?.subtle)
    throw new Error('Per collegare i PDF usa localhost oppure una connessione HTTPS.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const fingerprint = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  signal.throwIfAborted();
  const pdfjs = await pdfEngine();
  const task = pdfjs.getDocument({
    data: bytes,
    standardFontDataUrl: '/pdf/standard_fonts/',
    cMapUrl: '/pdf/cmaps/',
    cMapPacked: true,
    wasmUrl: '/pdf/wasm/',
  });
  const abort = () => {
    void task.destroy();
  };
  signal.addEventListener('abort', abort, { once: true });
  try {
    const pdf = await task.promise;
    if (pdf.numPages > 500) throw new Error('Limite di 500 pagine per documento.');
    const pages: string[] = [];
    let length = 0;
    for (let i = 1; i <= pdf.numPages; i++) {
      signal.throwIfAborted();
      onProgress(`Indicizzazione pagina ${i} di ${pdf.numPages}…`);
      const page = await pdf.getPage(i);
      const text = await page.getTextContent();
      const value = text.items.map((item) => ('str' in item ? item.str : '')).join(' ');
      length += value.length;
      if (length > 5000000) throw new Error('Testo troppo esteso per l’indice locale.');
      pages.push(value);
      page.cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    signal.throwIfAborted();
    return { id, name: file.name, fingerprint, blob: file, pages, anchors: {} };
  } finally {
    signal.removeEventListener('abort', abort);
    await task.destroy();
  }
}
export const normalizeSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
export function pdfSearch(documents: LocalPdf[], query: string) {
  const terms = normalizeSearch(query).trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return documents.flatMap((doc) =>
    doc.pages.flatMap((text, index) => {
      const normalized = normalizeSearch(text);
      if (!terms.every((term) => normalized.includes(term))) return [];
      const start = Math.max(0, normalized.indexOf(terms[0]) - 65);
      return [
        {
          id: doc.id,
          title: doc.name,
          page: index + 1,
          excerpt: `${start ? '…' : ''}${text.slice(start, start + 220)}${start + 220 < text.length ? '…' : ''}`,
        },
      ];
    }),
  );
}
