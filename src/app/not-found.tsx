import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="empty">
      <div className="eyebrow">404 · PAGINA NON TROVATA</div>
      <h1>Questo appunto non è qui.</h1>
      <p>Il collegamento potrebbe essere errato o il contenuto non ancora approvato.</p>
      <Link className="button primary" href="/argomenti">
        Esplora gli argomenti
      </Link>
    </div>
  );
}
