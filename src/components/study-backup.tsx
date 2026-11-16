'use client';
import { useState } from 'react';
import { mergeProgress, progressSchema, type StudyProgress } from '@/lib/study-schema';
import { updateProgress, useStudyProgress } from '@/lib/study-store';
export function StudyBackup() {
  const { progress, ready, warning } = useStudyProgress();
  const [incoming, setIncoming] = useState<StudyProgress>();
  const [message, setMessage] = useState('');
  function exportBackup() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'study-hub-progressi.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="panel study-backup">
      <h2>Porta con te i progressi</h2>
      <p>
        Salvataggio su questo browser, senza account. Il backup include risultati e bozze di codice,
        senza PDF o testo degli appunti. Copialo sul tuo iPad per continuare.
      </p>
      <div className="study-actions">
        <button className="button primary" disabled={!ready} onClick={exportBackup}>
          Esporta progressi
        </button>
        <label className="button secondary">
          Scegli backup JSON
          <input
            className="study-file-input"
            aria-label="Importa backup progressi"
            type="file"
            accept="application/json,.json"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              setIncoming(undefined);
              if (!file) return;
              try {
                if (file.size > 4 * 1024 * 1024) throw new Error();
                const parsed = progressSchema.parse(JSON.parse(await file.text()));
                setIncoming(parsed);
                setMessage('Backup valido. Controlla il riepilogo prima di importare.');
              } catch {
                setMessage(
                  'Backup non valido o troppo grande. Nessun progresso è stato modificato.',
                );
              }
            }}
          />
        </label>
      </div>
      <p role="status">{message || warning}</p>
      {incoming && (
        <div className="callout">
          <p>
            {Object.keys(incoming.passed).length} risultati · {Object.keys(incoming.drafts).length}{' '}
            bozze · {Object.keys(incoming.visited).length} lezioni visitate. I risultati di
            verifiche precedenti saranno conservati ma non completeranno verifiche cambiate.
          </p>
          <div className="study-actions">
            <button
              className="button primary"
              onClick={() => {
                updateProgress((p) => mergeProgress(p, incoming));
                setIncoming(undefined);
                setMessage('Progressi uniti.');
              }}
            >
              Unisci ai progressi attuali
            </button>
            <button
              className="button secondary"
              onClick={() => {
                updateProgress(() => incoming);
                setIncoming(undefined);
                setMessage('Progressi sostituiti con il backup selezionato.');
              }}
            >
              Sostituisci con questo backup
            </button>
            <button className="button secondary" onClick={() => setIncoming(undefined)}>
              Annulla importazione
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
