'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ThemeSwitch } from './theme-switch';
import {
  ChevronRight,
  Cpu,
  Network,
  ChartNoAxesCombined,
  Code2,
  House,
  Library as LayersIcon,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Search,
  X,
} from 'lucide-react';
import subjects from '@/content/subjects.json';

const groups = [
  {
    title: 'IL TUO SPAZIO',
    links: [
      { href: '/', label: 'Il mio studio', Icon: House },
      { href: '/percorso', label: 'Percorso', Icon: LayersIcon },
      { href: '/ricerca', label: 'Cerca un concetto', Icon: Search },
    ],
  },
  {
    title: 'LE TUE MATERIE',
    links: [
      { href: '/aos', label: 'Sistemi operativi', Icon: Cpu },
      { href: '/algoritmi', label: 'Algoritmi', Icon: Network },
      { href: '/cpp', label: 'Programmazione C++', Icon: Code2 },
      { href: '/ottimizzazione', label: 'Ottimizzazione', Icon: ChartNoAxesCombined },
    ],
  },
  {
    title: 'STRUMENTI',
    links: [
      { href: '/cpp/playground', label: 'Playground C++', Icon: Code2 },
      { href: '/aos/playground', label: 'Playground AOS', Icon: Code2 },
      { href: '/simulazioni', label: 'Tutti i laboratori', Icon: Play },
    ],
  },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const segments = pathname.split('/').filter(Boolean);
  const isSubjectPath = subjects.some((subject) => subject.id === segments[0]);
  const isTopicPath = isSubjectPath && segments.length >= 3;
  const isAosToolPath = pathname === '/aos/playground';
  const isCppToolPath = /^\/cpp\/(playground|esercitazioni|simulazioni)(\/|$)/.test(pathname);

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    if (subjects.some((s) => href === `/${s.id}`))
      return (
        pathname === href ||
        (pathname.startsWith(href + '/') && !isCppToolPath && !isAosToolPath) ||
        (segments[0] === 'percorso' && segments[1]?.startsWith(href.slice(1) + '-'))
      );
    if (href === '/materie')
      return (
        pathname === href || (isSubjectPath && !isTopicPath && !isCppToolPath && !isAosToolPath)
      );
    if (href === '/argomenti')
      return pathname === href || (isTopicPath && !isCppToolPath && !isAosToolPath);

    if (href === '/cpp/playground') return isCppToolPath;
    return pathname === href;
  }

  const activeLabel = groups
    .flatMap((group) => group.links)
    .find((link) => isActive(link.href))?.label;

  return (
    <>
      <a className="skip" href="#main">
        Vai al contenuto
      </a>
      <header className="mobile-header">
        <Link href="/" aria-label="LM·32 Study Hub, home">
          <Image
            className="mobile-brand-icon"
            src="/study-hub-icon.png"
            alt=""
            width={36}
            height={36}
          />
          <span className="mobile-brand-name">
            LM·32 <span>Study Hub</span>
          </span>
        </Link>
        <ThemeSwitch />
        <button
          aria-label={open ? 'Chiudi navigazione' : 'Apri navigazione'}
          aria-expanded={open}
          aria-controls="study-sidebar"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </header>
      {open && <button className="scrim" aria-label="Chiudi menu" onClick={() => setOpen(false)} />}
      <aside
        id="study-sidebar"
        className={`sidebar${open ? ' open' : ''}${collapsed ? ' desktop-collapsed' : ''}`}
      >
        <div className="sidebar-heading">
          <Link className="brand" href="/" onClick={() => setOpen(false)}>
            <span className="brand-icon">
              <Image src="/study-hub-icon.png" alt="" width={43} height={43} />
            </span>
            <span>
              LM·32 <small>STUDY HUB</small>
            </span>
          </Link>
          <button
            type="button"
            className="sidebar-dismiss"
            aria-label="Chiudi navigazione"
            onClick={() => setOpen(false)}
          >
            <X size={19} />
          </button>
        </div>
        <nav id="primary-navigation" aria-label="Navigazione principale">
          {groups.map((group) => (
            <div className="nav-group" key={group.title}>
              <div className="nav-group-title">{group.title}</div>
              {group.links.map(({ href, label, Icon }) => (
                <Link
                  onClick={() => setOpen(false)}
                  className={isActive(href) ? 'active' : ''}
                  href={href}
                  key={href}
                  aria-current={isActive(href) ? 'page' : undefined}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="sidebar-bottom-mark">
            <span /> Spazio personale
          </span>
          <span>LM·32 · Ingegneria Informatica</span>
        </div>
      </aside>
      <div
        className={`workspace${pathname.startsWith('/percorso/') ? ' is-lesson-workspace' : ''}${collapsed ? ' sidebar-collapsed' : ''}`}
      >
        <div className="topbar">
          <div className="topbar-leading">
            <button
              type="button"
              className="sidebar-toggle"
              aria-label={collapsed ? 'Apri sidebar' : 'Chiudi sidebar'}
              title={collapsed ? 'Apri sidebar' : 'Chiudi sidebar'}
              aria-expanded={!collapsed}
              aria-controls="study-sidebar"
              onClick={() => setCollapsed((value) => !value)}
            >
              {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>
            <div
              className="topbar-location"
              aria-label={`Sezione attuale: ${activeLabel ?? 'Studio'}`}
            >
              <span>STUDY HUB</span>
              <ChevronRight size={14} aria-hidden="true" />
              <strong>{activeLabel ?? 'Studio'}</strong>
            </div>
          </div>
          <div className="topbar-actions">
            <Link className="topbar-search" href="/ricerca">
              <Search size={17} /> <span>Cerca nella raccolta</span>
            </Link>
            <ThemeSwitch />
          </div>
        </div>
        <main id="main">{children}</main>
        <footer>
          <span>LM·32 Study Hub</span>
          <span>Il tuo spazio personale per imparare.</span>
        </footer>
      </div>
    </>
  );
}
