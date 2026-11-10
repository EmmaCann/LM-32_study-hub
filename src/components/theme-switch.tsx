'use client';

import { useSyncExternalStore } from 'react';
import { Sun, Moon } from 'lucide-react';

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

export function ThemeSwitch() {
  const theme = useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset.theme ?? 'light',
    () => 'light',
  );
  function select(value: 'light' | 'dark') {
    document.documentElement.dataset.theme = value;
    try {
      localStorage.setItem('lm32-theme', value);
    } catch {
      /* Theme still works without storage. */
    }
  }
  return (
    <div className="theme-switch" role="group" aria-label="Tema dell’interfaccia">
      <button
        aria-label="Tema chiaro"
        aria-pressed={theme === 'light'}
        onClick={() => select('light')}
      >
        <Sun size={16} />
        <span>Chiaro</span>
      </button>
      <button
        aria-label="Tema scuro"
        aria-pressed={theme === 'dark'}
        onClick={() => select('dark')}
      >
        <Moon size={16} />
        <span>Scuro</span>
      </button>
    </div>
  );
}
