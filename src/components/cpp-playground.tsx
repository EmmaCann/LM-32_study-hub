'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CppEditor } from './cpp-editor';
import { CppRuntime, type CppStandard, type CompileResult } from '@/lib/cpp-runtime';
import { passesTest, type RunResult } from '@/lib/cpp-check';
import type { Exercise } from '@/lib/schema';

const initialCode =
  '#include <iostream>\n\nint main() {\n    int numero;\n    std::cin >> numero;\n    std::cout << "Hai scritto: " << numero << "\\n";\n    return 0;\n}\n';
type Check = { id: string; title: string; passed: boolean; result: RunResult; expected: string };
export function CppPlayground({
  exercise,
  referenceHref,
}: {
  exercise?: Exercise;
  referenceHref?: string;
}) {
  const spec = exercise?.cpp;
  const [code, setCode] = useState(spec?.starterCode ?? initialCode);
  const [standard, setStandard] = useState<CppStandard>(spec?.standard ?? 'c++17');
  const [stdin, setStdin] = useState(
    spec?.tests.find((t) => t.visibility === 'public')?.stdin ?? '42\n',
  );
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(
    'Compilatore da avviare. Il primo avvio carica circa 100 MiB dal sito.',
  );
  const [diagnostics, setDiagnostics] = useState('');
  const [output, setOutput] = useState<RunResult>();
  const [checks, setChecks] = useState<Check[]>([]);
  const [hints, setHints] = useState(0);
  const [solution, setSolution] = useState(false);
  const [checkedCode, setCheckedCode] = useState<string>();
  const runtime = useRef<CppRuntime | null>(null);
  const compiled = useRef<{ code: string; standard: CppStandard; result: CompileResult } | null>(
    null,
  );
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      runtime.current?.stop();
    };
  }, []);

  function download(source: string, name: string) {
    const url = URL.createObjectURL(new Blob([source], { type: 'text/x-c++src;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function perform(action: 'compile' | 'run' | 'verify') {
    if (busy) return;
    if (spec?.execution === 'local-only') {
      setStatus(spec.limitation ?? 'Esercizio da eseguire in un ambiente locale.');
      return;
    }
    if (typeof Worker === 'undefined' || typeof WebAssembly === 'undefined') {
      setStatus(
        'Questo browser non supporta l’ambiente. Scarica il codice e usa una toolchain locale.',
      );
      return;
    }
    const snapshot = code;
    const snapshotStandard = standard;
    setBusy(true);
    setChecks([]);
    setOutput(undefined);
    setCheckedCode(undefined);
    try {
      const engine = (runtime.current ??= new CppRuntime());
      let artifact = compiled.current;
      if (
        !artifact ||
        artifact.code !== snapshot ||
        artifact.standard !== snapshotStandard ||
        action === 'compile'
      ) {
        const result = await engine.compile(snapshot, snapshotStandard, spec?.files ?? [], (p) => {
          if (active.current)
            setStatus(
              p.total
                ? `Caricamento toolchain: ${Math.round(((p.loaded ?? 0) / p.total) * 100)}%`
                : (p.message ?? 'Preparazione del compilatore…'),
            );
        });
        if (!active.current) return;
        setDiagnostics(result.diagnostics);
        if (!result.ok || !result.binary) {
          compiled.current = null;
          setStatus('Compilazione non riuscita. Consulta gli errori.');
          return;
        }
        artifact = { code: snapshot, standard: snapshotStandard, result };
        compiled.current = artifact;
      }
      if (action === 'compile') {
        setStatus('Compilazione riuscita. Il programma non è stato eseguito.');
        return;
      }
      if (action === 'run') {
        setStatus('Esecuzione in corso…');
        const result = await engine.run(artifact.result.binary!, stdin);
        if (active.current) {
          setOutput(result);
          setStatus(
            result.reason === 'timeout'
              ? 'Programma interrotto per timeout.'
              : `Esecuzione terminata: codice ${result.exitCode}.`,
          );
        }
      } else if (spec) {
        const results: Check[] = [];
        for (const test of spec.tests) {
          if (!active.current) return;
          setStatus(`Verifica del caso ${results.length + 1}/${spec.tests.length}: ${test.title}`);
          const result = await engine.run(artifact.result.binary!, test.stdin);
          results.push({
            id: test.id,
            title: test.title,
            passed: passesTest(result, test),
            result,
            expected: test.stdout,
          });
          if (active.current) setChecks([...results]);
        }
        if (active.current) {
          setCheckedCode(snapshot);
          setStatus(
            `${results.filter((r) => r.passed).length}/${results.length} casi verificati superati. Questo non dimostra la correttezza per tutti gli input.`,
          );
        }
      }
    } catch (error) {
      compiled.current = null;
      if (active.current)
        setStatus(
          error instanceof Error
            ? error.message === 'Timeout'
              ? 'Compilazione interrotta dopo 90 secondi. Riavvia l’ambiente o scarica il codice per lavorare in locale.'
              : error.message
            : 'Errore WebAssembly. Riavvia l’ambiente.',
        );
    } finally {
      if (active.current) setBusy(false);
    }
  }
  function stop() {
    runtime.current?.stop();
    runtime.current = null;
    compiled.current = null;
  }

  return (
    <div className="cpp-playground">
      <div className="cpp-intro">
        <p>
          {exercise?.prompt ??
            'Scrivi un programma, prepara tutto l’input e compila nel browser. Il codice non viene inviato a un servizio di esecuzione.'}
        </p>
        {spec && (
          <p className="cpp-meta">
            {spec.difficulty} · {spec.tags.join(' · ')} · {spec.standard}
          </p>
        )}
        {spec && (
          <p>
            Lezione di riferimento:{' '}
            {spec.referenceLesson.url || referenceHref ? (
              <Link href={spec.referenceLesson.url ?? referenceHref!}>
                {spec.referenceLesson.title}
              </Link>
            ) : (
              spec.referenceLesson.title
            )}
          </p>
        )}
        {spec?.limitation && <p className="callout">{spec.limitation}</p>}
      </div>
      <div className="cpp-toolbar" aria-label="Comandi del Playground">
        <button
          className="button primary"
          disabled={busy || spec?.execution === 'local-only'}
          onClick={() => void perform('compile')}
        >
          Compila
        </button>
        <button
          className="button secondary"
          disabled={busy || spec?.execution === 'local-only'}
          onClick={() => void perform('run')}
        >
          Esegui
        </button>
        <button
          className="button secondary"
          disabled={busy || !spec || spec.execution === 'local-only'}
          onClick={() => void perform('verify')}
        >
          Verifica esercizio
        </button>
        <button
          className="button secondary"
          onClick={() => {
            stop();
            setStatus('Ambiente interrotto. Il codice è conservato; Compila lo riavvia.');
          }}
        >
          Interrompi / riavvia ambiente
        </button>
        <button
          className="button secondary"
          disabled={busy}
          onClick={() => {
            if (
              window.confirm('Ripristinare il codice iniziale? Il codice attuale verrà sostituito.')
            ) {
              stop();
              setCode(spec?.starterCode ?? initialCode);
              setDiagnostics('');
              setChecks([]);
              setOutput(undefined);
              setCheckedCode(undefined);
              setStatus('Codice iniziale ripristinato.');
            }
          }}
        >
          Ripristina
        </button>
        <button
          className="button secondary"
          onClick={() => download(code, `${exercise?.id ?? 'main'}.cpp`)}
        >
          Scarica .cpp
        </button>
      </div>
      <p className="cpp-status" role="status" aria-live="polite" aria-busy={busy}>
        {status}
      </p>
      {checkedCode !== undefined && checkedCode !== code && (
        <p className="callout">
          Il codice è cambiato: i risultati si riferiscono alla versione verificata precedente.
        </p>
      )}
      <div className="cpp-workbench">
        <section aria-label="Editor C++" className="cpp-source-pane">
          <div className="cpp-pane-title">
            <strong>main.cpp</strong>
            <label>
              Standard{' '}
              <select
                aria-label="Standard C++"
                value={standard}
                disabled={Boolean(spec) || busy}
                onChange={(e) => setStandard(e.target.value as CppStandard)}
              >
                {['c++11', 'c++14', 'c++17', 'c++20'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <CppEditor value={code} onChange={setCode} />
          <p className="cpp-small">
            Tab sposta il focus. Il codice resta nell’editor durante compilazione e verifica; la
            soluzione non lo sostituisce.
          </p>
        </section>
        <div className="cpp-console">
          <label className="cpp-stdin">
            Input standard (stdin)
            <textarea
              aria-label="Input standard (stdin)"
              value={stdin}
              maxLength={32768}
              onChange={(e) => setStdin(e.target.value)}
              spellCheck={false}
            />
          </label>
          <section aria-labelledby="cpp-diagnostics">
            <h2 id="cpp-diagnostics">Compilatore</h2>
            <pre data-testid="cpp-diagnostics">
              {diagnostics || 'Nessun messaggio del compilatore.'}
            </pre>
          </section>
          <section aria-labelledby="cpp-stdout">
            <h2 id="cpp-stdout">stdout</h2>
            <pre data-testid="cpp-stdout">{output?.stdout ?? '—'}</pre>
          </section>
          <section aria-labelledby="cpp-stderr">
            <h2 id="cpp-stderr">stderr</h2>
            <pre data-testid="cpp-stderr">{output?.stderr ?? '—'}</pre>
          </section>
        </div>
      </div>
      {spec?.files.map((file) => (
        <details key={file.name}>
          <summary>File di supporto: {file.name}</summary>
          <pre>{file.content}</pre>
          <button className="button secondary" onClick={() => download(file.content, file.name)}>
            Scarica {file.name}
          </button>
        </details>
      ))}
      {spec && (
        <section className="cpp-tests" aria-labelledby="cpp-tests-title">
          <h2 id="cpp-tests-title">Casi di verifica</h2>
          <p className="cpp-small">
            I test aggiuntivi e la soluzione sono distribuiti al browser e non sono segreti. La
            verifica confronta stdout, stderr e codice di uscita, senza sostituire il tuo codice.
          </p>
          {spec.tests
            .filter((t) => t.visibility === 'public')
            .map((t) => (
              <details key={t.id}>
                <summary>
                  {t.title} · pubblico · confronto {t.comparison}
                </summary>
                <p>stdin</p>
                <pre>{t.stdin || '(vuoto)'}</pre>
                <p>stdout atteso</p>
                <pre>{t.stdout}</pre>
                <p>
                  stderr atteso: {t.stderr || '(vuoto)'} · Uscita attesa: {t.exitCode}
                </p>
              </details>
            ))}
          <p>
            {spec.tests.filter((t) => t.visibility === 'additional').length} test aggiuntivi
            disponibili.
          </p>
          {checks.map((check) => (
            <details
              className={check.passed ? 'cpp-pass' : 'cpp-fail'}
              key={check.id}
              data-testid="cpp-test-result"
            >
              <summary>
                {check.passed ? 'Superato' : 'Non superato'} — {check.title}
              </summary>
              <p>
                Uscita: {check.result.exitCode} · {check.result.reason}
              </p>
              <p>stdout ottenuto</p>
              <pre>{check.result.stdout}</pre>
              <p>stdout atteso</p>
              <pre>{check.expected}</pre>
              <p>stderr</p>
              <pre>{check.result.stderr}</pre>
            </details>
          ))}
        </section>
      )}
      {exercise && (
        <section className="cpp-help">
          <h2>Aiuti</h2>
          <div className="cpp-toolbar">
            <button
              className="button secondary"
              disabled={hints >= exercise.hints.length}
              onClick={() => setHints((n) => n + 1)}
            >
              Suggerimento {Math.min(hints + 1, exercise.hints.length)}/{exercise.hints.length}
            </button>
            <button
              className="button secondary"
              aria-expanded={solution}
              onClick={() => setSolution((v) => !v)}
            >
              {solution ? 'Nascondi soluzione' : 'Mostra soluzione'}
            </button>
          </div>
          {exercise.hints.slice(0, hints).map((h, i) => (
            <p className="callout" key={i}>
              Indizio {i + 1}: {h}
            </p>
          ))}
          {solution && (
            <div className="cpp-solution">
              <h3>Soluzione commentata</h3>
              <pre>{exercise.solution}</pre>
              <p>{exercise.explanation}</p>
            </div>
          )}
        </section>
      )}
      <details className="cpp-limits">
        <summary>Toolchain, limiti e alternativa locale</summary>
        <p>
          Clang/LLD 22 YoWASP, WASI preview 1. C++11–20 con la libreria disponibile. Eccezioni C++
          disattivate; niente thread, rete, processi nativi o accesso ai file del dispositivo.
          Programma: memoria lineare massima 64 MiB, stack 1 MiB, output 64 KiB, esecuzione 3
          secondi. Compilazione: 90 secondi; la memoria del compilatore dipende dal browser e non ha
          un tetto totale garantito. Su iPad il sistema può chiudere la scheda per memoria
          insufficiente.
        </p>
        <p>
          Per funzioni non supportate, scarica sorgente e file di supporto ed eseguili in un
          ambiente locale fidato: <code>clang++ -std={standard} main.cpp -o programma</code>. Study
          Hub non esegue questo comando sul server.
        </p>
        <p>
          <a href="/cpp/licenses/NOTICE.md">Licenze e attribuzioni della toolchain</a>
        </p>
      </details>
    </div>
  );
}
