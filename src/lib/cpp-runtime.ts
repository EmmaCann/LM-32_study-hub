import type { RunResult } from './cpp-check';
export type CppStandard = 'c++11' | 'c++14' | 'c++17' | 'c++20';
export type CompileResult = { ok: boolean; diagnostics: string; binary?: Uint8Array };
export type CompileProgress = { phase: string; message?: string; total?: number; loaded?: number };
export class CppRuntime {
  private compiler?: Worker;
  private runner?: Worker;
  private cancel = new Set<() => void>();
  private sequence = 0;

  compile(
    code: string,
    standard: CppStandard,
    files: { name: string; content: string }[],
    progress: (p: CompileProgress) => void,
  ) {
    this.compiler ??= new Worker('/cpp/compiler.worker.js', { type: 'module' });
    return this.request<CompileResult>(this.compiler, { code, standard, files }, 90000, progress);
  }
  async run(binary: Uint8Array, stdin: string): Promise<RunResult> {
    this.runner = new Worker('/cpp/runner.worker.js', { type: 'module' });
    const worker = this.runner;
    try {
      return await this.request<RunResult>(worker, { binary, stdin }, 3000);
    } catch (error) {
      if (error instanceof Error && error.message === 'Timeout')
        return {
          exitCode: -1,
          stdout: '',
          stderr: 'Tempo massimo di 3 secondi superato.',
          reason: 'timeout',
        };
      throw error;
    } finally {
      worker.terminate();
      if (this.runner === worker) this.runner = undefined;
    }
  }
  private request<T>(
    worker: Worker,
    payload: object,
    timeout: number,
    progress?: (p: CompileProgress) => void,
  ): Promise<T> {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const stop = () => {
        cleanup();
        reject(new Error('Ambiente interrotto. Puoi riavviarlo senza perdere il codice.'));
      };
      const cleanup = () => {
        clearTimeout(timer);
        this.cancel.delete(stop);
        worker.onmessage = null;
        worker.onerror = null;
      };
      const timer = setTimeout(() => {
        cleanup();
        worker.terminate();
        if (this.compiler === worker) this.compiler = undefined;
        reject(new Error('Timeout'));
      }, timeout);
      this.cancel.add(stop);
      worker.onerror = (event) => {
        cleanup();
        worker.terminate();
        if (this.compiler === worker) this.compiler = undefined;
        reject(new Error(event.message || 'Errore del worker WebAssembly'));
      };
      worker.onmessage = ({ data }) => {
        if (data.id !== id) return;
        if (data.phase) {
          progress?.(data);
          return;
        }
        cleanup();
        resolve(data as T);
      };
      worker.postMessage({ ...payload, id });
    });
  }
  stop() {
    for (const cancel of [...this.cancel]) cancel();
    this.compiler?.terminate();
    this.runner?.terminate();
    this.compiler = undefined;
    this.runner = undefined;
  }
}
