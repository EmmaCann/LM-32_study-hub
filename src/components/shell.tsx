'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BookOpen,
  LayoutDashboard,
  Library,
  Layers,
  Play,
  PenLine,
  Search,
  Sun,
  Moon,
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
    [open, setOpen] = useState(false),
    [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('lm32-theme');
    const value = saved
      ? saved === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = value ? 'dark' : 'light';
  }, []);
  function toggle() {
    const value = document.documentElement.dataset.theme !== 'dark';
    setDark(value);
    document.documentElement.dataset.theme = value ? 'dark' : 'light';
    localStorage.setItem('lm32-theme', value ? 'dark' : 'light');
  }
  return (
    <>
      <a className="skip" href="#main">
        Vai al contenuto
      </a>
      <header className="mobile-header">
        <Link href="/">
          LM·32 <span>Study Hub</span>
        </Link>
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
        <p className="nav-label">IL TUO SPAZIO DI STUDIO</p>
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
        <div className="sidebar-note">
          <BookOpen size={21} />
          <strong>Un concetto alla volta.</strong>
          <p>
            Appunti, pratica e intuizioni.
            <br />
            Tutto nello stesso spazio.
          </p>
        </div>
        <div className="sidebar-bottom">
          <button onClick={toggle} aria-label="Cambia tema">
            {dark ? <Sun size={18} /> : <Moon size={18} />}Cambia tema
          </button>
          <span className="local-dot">Ambiente locale</span>
        </div>
      </aside>
      <div className="workspace">
        <div className="topbar">
          <span>
            Laurea magistrale <span className="muted">/</span> Ingegneria Informatica
          </span>
          <Link href="/ricerca">
            <Search size={17} /> Cerca negli appunti <ArrowUpRight size={15} />
          </Link>
        </div>
        <main id="main">{children}</main>
        <footer>
          LM·32 Study Hub <span>Il tuo spazio personale per imparare.</span>
        </footer>
      </div>
    </>
  );
}
