'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty">
      <h1>Non è stato possibile aprire il contenuto.</h1>
      <p>Riprova. Se il problema persiste, controlla la validazione dei pacchetti.</p>
      <button className="button primary" onClick={reset}>
        Riprova
      </button>
    </div>
  );
}
