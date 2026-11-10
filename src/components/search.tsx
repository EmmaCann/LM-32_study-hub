'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Search, ArrowUpRight } from 'lucide-react';
type Entry = { title: string; kind: string; url: string; text: string };
const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
export function SearchBox({ entries }: { entries: Entry[] }) {
  const [query, setQuery] = useState('');
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  const found = terms.length
    ? entries.filter((e) => terms.every((t) => normalize(e.title + ' ' + e.text).includes(t)))
    : [];
  return (
    <>
      <label className="search-box">
        <Search />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Cerca in tutti i contenuti"
          placeholder="Prova “VM exit”, “AVL” o “ownership”…"
        />
      </label>
      <p role="status" className="muted">
        {terms.length
          ? `${found.length} risultati`
          : 'Cerca materie, capitoli, sezioni, simulazioni ed esercizi.'}
      </p>
      <div className="list">
        {found.map((e, i) => (
          <Link className="list-row" key={`${e.url}-${i}`} href={e.url}>
            <div>
              <span className="eyebrow">{e.kind}</span>
              <h3>{e.title}</h3>
            </div>
            <ArrowUpRight />
          </Link>
        ))}
      </div>
      {terms.length && !found.length && (
        <div className="empty">
          Nessun risultato. Prova una parola più breve o un altro concetto.
        </div>
      )}
    </>
  );
}
