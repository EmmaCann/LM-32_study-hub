'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ThemeSwitch } from './theme-switch';
import {
  LayoutDashboard,
  Library,
  Layers,
  Play,
  PenLine,
  Search,
  Menu,
  X,
  GraduationCap,
  ArrowUpRight,
} from 'lucide-react';
const links = [
  ['/', 'Dashboard', LayoutDashboard],
  ['/materie', 'Materie', Library],
  ['/argomenti', 'Tutti gli argomenti', Layers],
  ['/simulazioni', 'Simulazioni', Play],
  ['/esercizi', 'Esercizi', PenLine],
  ['/ricerca', 'Ricerca', Search],
] as const;
export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(),
    [open, setOpen] = useState(false);
  return (
    <>
      <a className="skip" href="#main">
        Vai al contenuto
      </a>
      <header className="mobile-header">
        <Link href="/">
          LM·32 <span>Study Hub</span>
        </Link>
        <ThemeSwitch />
        <button
          aria-label={open ? 'Chiudi navigazione' : 'Apri navigazione'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </header>
      {open && <button className="scrim" aria-label="Chiudi menu" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <Link className="brand" href="/" onClick={() => setOpen(false)}>
          <span className="brand-icon">
            <GraduationCap size={25} />
          </span>
          <span>
            LM·32 <small>STUDY HUB</small>
          </span>
        </Link>
        <nav aria-label="Navigazione principale">
          {links.map(([href, label, Icon]) => (
            <Link
              onClick={() => setOpen(false)}
              className={pathname === href ? 'active' : ''}
              href={href}
              key={href}
              aria-current={pathname === href ? 'page' : undefined}
            >
              <Icon size={19} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="muted">Il tuo spazio di studio</span>
        </div>
      </aside>
      <div className="workspace">
        <div className="topbar">
          <Link href="/ricerca">
            <Search size={17} /> Cerca negli appunti <ArrowUpRight size={15} />
          </Link>
          <ThemeSwitch />
        </div>
        <main id="main">{children}</main>
        <footer>
          LM·32 Study Hub <span>Il tuo spazio personale per imparare.</span>
        </footer>
      </div>
    </>
  );
}
