'use client';
import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { pdfEngine, type LocalPdf } from '@/lib/pdf-library';
export function PdfViewer({
  document,
  initialPage = 1,
  page: controlledPage,
  onPageChange,
}: {
  document: LocalPdf;
  initialPage?: number;
  page?: number;
  onPageChange?: (page: number) => void;
}) {
  const [internalPage, setPage] = useState(
    Math.min(Math.max(1, initialPage), document.pages.length),
  );
  const pageNumber = Math.min(document.pages.length, Math.max(1, controlledPage ?? internalPage));
  function changePage(value: number) {
    const next = Math.min(document.pages.length, Math.max(1, Math.floor(value)));
    setPage(next);
    onPageChange?.(next);
  }
  const [zoom, setZoom] = useState<'page' | 'width' | number>('page');
  const [message, setMessage] = useState('Apertura PDF…');
  const [pdf, setPdf] = useState<PDFDocumentProxy>();
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderedScale = useRef(1);
  const [width, setWidth] = useState(600);
  const [height, setHeight] = useState(600);
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
        if (active) setMessage('Appunti non leggibili. Riprova ad aprire la lezione.');
      }
    })();
    return () => {
      active = false;
      void task?.destroy();
    };
  }, [document.blob]);
  useEffect(() => {
    if (!host.current) return;
    const measure = () => {
      if (!host.current) return;
      const box = host.current;
      setWidth(Math.max(1, box.clientWidth - 24));
      const maximum = Number.parseFloat(getComputedStyle(box).maxHeight);
      setHeight(
        Math.max(
          180,
          Math.min(window.innerHeight * 0.7, Number.isFinite(maximum) ? maximum : 800) - 24,
        ),
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(host.current);
    window.addEventListener('resize', measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
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
        const scale =
          zoom === 'page'
            ? Math.min(width / base.width, height / base.height, 1)
            : zoom === 'width'
              ? width / base.width
              : zoom;
        const viewport = page.getViewport({ scale });
        renderedScale.current = scale;
        // Bound the bitmap even for large pages/zoom on high-density tablets.
        const ratio = Math.min(
          window.devicePixelRatio || 1,
          2,
          Math.sqrt(12_000_000 / (viewport.width * viewport.height)),
          8192 / viewport.width,
          8192 / viewport.height,
        );
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
  }, [pdf, pageNumber, width, height, zoom]);
  function adjustZoom(direction: number) {
    const current = typeof zoom === 'number' ? zoom : renderedScale.current;
    setZoom(Math.max(0.1, Math.min(3, Math.round((current + direction) * 100) / 100)));
  }
  return (
    <div className="study-pdf-viewer">
      <div className="study-actions">
        <button
          className="button secondary"
          disabled={pageNumber <= 1}
          onClick={() => changePage(pageNumber - 1)}
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
            onChange={(e) => changePage(Number(e.target.value) || 1)}
          />
        </label>
        <span>di {document.pages.length}</span>
        <button
          className="button secondary"
          disabled={pageNumber >= document.pages.length}
          onClick={() => changePage(pageNumber + 1)}
          aria-label="Pagina successiva PDF"
        >
          →
        </button>
        <button
          className="button secondary"
          aria-label="Riduci zoom PDF"
          onClick={() => adjustZoom(-0.25)}
          disabled={zoom === 0.1}
        >
          −
        </button>
        <label>
          Zoom{' '}
          <select
            aria-label="Zoom PDF"
            value={zoom}
            onChange={(e) =>
              setZoom(
                e.target.value === 'page' || e.target.value === 'width'
                  ? e.target.value
                  : Number(e.target.value),
              )
            }
          >
            <option value="page">Pagina intera</option>
            <option value="width">Larghezza</option>
            {[0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, ...(typeof zoom === 'number' ? [zoom] : [])]
              .filter((v, i, all) => all.indexOf(v) === i)
              .sort((a, b) => a - b)
              .map((v) => (
                <option value={v} key={v}>
                  {Math.round(v * 100)}%
                </option>
              ))}
          </select>
        </label>
        <button
          className="button secondary"
          aria-label="Aumenta zoom PDF"
          onClick={() => adjustZoom(0.25)}
          disabled={zoom === 3}
        >
          +
        </button>
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
