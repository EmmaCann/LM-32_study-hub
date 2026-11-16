'use client';
import { useSyncExternalStore } from 'react';
import { emptyProgress, progressSchema, type StudyProgress } from './study-schema';
export const progressStorageKey = 'lm32-study-progress-v1';
type Snapshot = { progress: StudyProgress; ready: boolean; warning: string };
const initial: Snapshot = { progress: emptyProgress(), ready: false, warning: '' };
let state = initial;
let initialized = false;
const listeners = new Set<() => void>();
function notify() {
  for (const listener of listeners) listener();
}
function readStorage() {
  try {
    const saved = localStorage.getItem(progressStorageKey);
    state = {
      progress: saved ? progressSchema.parse(JSON.parse(saved)) : emptyProgress(),
      ready: true,
      warning: '',
    };
  } catch {
    state = {
      ...state,
      ready: true,
      warning:
        'Salvataggio locale non disponibile o backup precedente non leggibile. Esporta i progressi prima di chiudere.',
    };
  }
  notify();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!initialized) {
    initialized = true;
    queueMicrotask(readStorage);
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key === progressStorageKey) readStorage();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}
export function useStudyProgress() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => initial,
  );
}
export function updateProgress(update: (value: StudyProgress) => StudyProgress) {
  if (!state.ready) {
    initialized = true;
    readStorage();
  }
  const progress = progressSchema.parse(update(state.progress));
  let warning = '';
  try {
    localStorage.setItem(progressStorageKey, JSON.stringify(progress));
  } catch {
    warning =
      'Spazio locale non disponibile: i progressi restano nella sessione. Esporta un backup.';
  }
  state = { progress, ready: true, warning };
  notify();
}
export function saveDraft(key: string, value: string) {
  updateProgress((p) => ({
    ...p,
    drafts: { ...p.drafts, [key]: { value, updatedAt: new Date().toISOString() } },
  }));
}
export function passActivity(key: string, signature: string) {
  updateProgress((p) => ({
    ...p,
    passed: { ...p.passed, [key]: { signature, passedAt: new Date().toISOString() } },
  }));
}
