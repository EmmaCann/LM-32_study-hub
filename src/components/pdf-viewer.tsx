'use client';
import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { pdfEngine, type LocalPdf } from '@/lib/pdf-library';
export function PdfViewer({
  document,
  initialPage = 1,
}: {
  document: LocalPdf;
  initialPage?: number;
}) {
  const [pageNumber, setPage] = useState(Math.min(Math.max(1, initialPage), document.pages.length));
  const [zoom, setZoom] = useState(1);
  const [message, setMessage] = useState('Apertura PDF…');
  const [pdf, setPdf] = useState<PDFDocumentProxy>();
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(600);
  useEffect(() => {
    let active = true;
    let task: ReturnType<(typeof import('pdfjs-dist'))['getDocument']> | undefined;
    void (async () => {
      try {
        const pdfjs = await pdfEngine();
        if (!active) return;
        const data = new Uint8Array(await document.blob.arrayBuffer());
        if (!active) return;
        task = pdfjs.getDocument({
          data,
          standardFontDataUrl: '/pdf/standard_fonts/',
          cMapUrl: '/pdf/cmaps/',
          cMapPacked: true,
          wasmUrl: '/pdf/wasm/',
        });
        const loaded = await task.promise;
        if (active) setPdf(loaded);
      } catch {
        if (active) setMessage('PDF non leggibile. Seleziona nuovamente il documento.');
      }
    })();
    return () => {
      active = false;
      void task?.destroy();
    };
  }, [document.blob]);
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver((entries) =>
      setWidth(Math.max(150, entries[0].contentRect.width)),
    );
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!pdf || !canvas.current) return;
    let active = true;
    let renderTask:
      ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']> | undefined;
    void (async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        if (!active || !canvas.current) return;
        const base = page.getViewport({ scale: 1 });
        const scale = (width / base.width) * zoom;
        const viewport = page.getViewport({ scale });
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const node = canvas.current;
        node.width = Math.floor(viewport.width * ratio);
        node.height = Math.floor(viewport.height * ratio);
        node.style.width = `${viewport.width}px`;
        node.style.height = `${viewport.height}px`;
        renderTask = page.render({
          canvas: node,
          viewport,
          transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
        });
        await renderTask.promise;
        if (active) setMessage(`Pagina ${pageNumber} di ${pdf.numPages}`);
      } catch (error) {
        if (active && !(error instanceof Error && error.name === 'RenderingCancelledException'))
          setMessage('Impossibile visualizzare questa pagina.');
      }
    })();
    return () => {
      active = false;
      renderTask?.cancel();
    };
  }, [pdf, pageNumber, width, zoom]);
  return (
    <div className="study-pdf-viewer">
      <div className="study-actions">
        <button
          className="button secondary"
          disabled={pageNumber <= 1}
          onClick={() => setPage((p) => p - 1)}
          aria-label="Pagina precedente PDF"
        >
          ←
        </button>
        <label>
          Pagina{' '}
          <input
            aria-label="Pagina PDF"
            type="number"
            min={1}
            max={document.pages.length}
            value={pageNumber}
            onChange={(e) =>
              setPage(Math.min(document.pages.length, Math.max(1, Number(e.target.value) || 1)))
            }
          />
        </label>
        <span>di {document.pages.length}</span>
        <button
          className="button secondary"
          disabled={pageNumber >= document.pages.length}
          onClick={() => setPage((p) => p + 1)}
          aria-label="Pagina successiva PDF"
        >
          →
        </button>
        <label>
          Zoom{' '}
          <select
            aria-label="Zoom PDF"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          >
            <option value={1}>Adatta</option>
            <option value={1.5}>150%</option>
            <option value={2}>200%</option>
          </select>
        </label>
      </div>
      <p role="status">{message}</p>
      <div className="study-pdf-canvas" ref={host}>
        <canvas ref={canvas} aria-label={`PDF, pagina ${pageNumber}`} />
      </div>
      <details>
        <summary>Testo della pagina</summary>
        <p className="study-pdf-text">
          {document.pages[pageNumber - 1] || 'Questa pagina non contiene testo ricercabile.'}
        </p>
      </details>
    </div>
  );
}
