import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from '@playwright/test';
import { readPackage, approvedRoot } from '../src/lib/content';
import { cppDigest, CPP_TOOLCHAIN } from '../src/lib/cpp-publication';
import { passesTest, type RunResult } from '../src/lib/cpp-check';
import { execFileSync } from 'node:child_process';

async function main() {
  execFileSync(process.execPath, ['scripts/prepare-cpp-runtime.mjs'], { stdio: 'inherit' });
  const arg = process.argv[2];
  if (!arg) throw new Error('Uso: npm run cpp:verify -- staging/<id> oppure --all');
  const directories =
    arg === '--all'
      ? fs
          .readdirSync(approvedRoot)
          .filter((n) => !n.startsWith('.'))
          .map((n) => path.join(approvedRoot, n))
      : [path.resolve(arg)];
  for (const dir of directories) {
    const real = fs.realpathSync(dir);
    if (
      ![approvedRoot, path.resolve('staging')].some((root) =>
        real.startsWith(fs.realpathSync(root) + path.sep),
      )
    )
      throw new Error('Verificare soltanto pacchetti in staging o approved');
  }
  const publicRoot = path.resolve('public');
  const server = http.createServer((request, response) => {
    if (request.url === '/') {
      response.setHeader('Content-Type', 'text/html');
      response.end('<!doctype html><title>Verifica C++ locale</title>');
      return;
    }
    const file = path.resolve(publicRoot, '.' + new URL(request.url!, 'http://localhost').pathname);
    if (
      !file.startsWith(path.join(publicRoot, 'cpp') + path.sep) ||
      !fs.existsSync(file) ||
      !fs.statSync(file).isFile()
    ) {
      response.writeHead(404).end();
      return;
    }
    response.setHeader(
      'Content-Type',
      file.endsWith('.js')
        ? 'text/javascript'
        : file.endsWith('.wasm')
          ? 'application/wasm'
          : 'application/octet-stream',
    );
    fs.createReadStream(file).pipe(response);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as { port: number };
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${address.port}`);
    // tsx/esbuild annotates named functions; supply its harmless naming helper in the test page.
    await page.addScriptTag({ content: 'window.__name = function(fn) { return fn; };' });
    for (const directory of directories) {
      const topic = readPackage(directory);
      const exercises = topic.exercises.filter((e) => e.type === 'cpp');
      if (!exercises.length) continue;
      let tests = 0;
      for (const exercise of exercises) {
        if (!exercise.cpp || exercise.cpp.execution !== 'browser')
          throw new Error(`Non verificabile nel browser: ${exercise.id}`);
        const results = await page.evaluate(async (e) => {
          const request = <T>(worker: Worker, payload: object, timeout: number) =>
            new Promise<T>((resolve, reject) => {
              const timer = setTimeout(() => {
                worker.terminate();
                reject(new Error('Timeout verifica C++'));
              }, timeout);
              worker.onerror = (event) => {
                clearTimeout(timer);
                reject(new Error(event.message));
              };
              worker.onmessage = ({ data }) => {
                if (data.phase) return;
                clearTimeout(timer);
                resolve(data as T);
              };
              worker.postMessage({ id: 1, ...payload });
            });
          const compiler = new Worker('/cpp/compiler.worker.js', { type: 'module' });
          try {
            const starter = await request<{ ok: boolean; diagnostics: string; binary: Uint8Array }>(
              compiler,
              { code: e.cpp!.starterCode, standard: e.cpp!.standard, files: e.cpp!.files },
              90000,
            );
            if (!starter.ok)
              throw new Error('Codice iniziale non compilabile: ' + starter.diagnostics);
            const starterRunner = new Worker('/cpp/runner.worker.js', { type: 'module' });
            try {
              const smoke = await request<RunResult>(
                starterRunner,
                {
                  binary: starter.binary,
                  stdin: e.cpp!.tests.find((t) => t.visibility === 'public')!.stdin,
                },
                3000,
              );
              if (smoke.reason !== 'exited')
                throw new Error('Il codice iniziale non termina regolarmente sul caso pubblico');
            } finally {
              starterRunner.terminate();
            }
            const output = await request<{ ok: boolean; diagnostics: string; binary: Uint8Array }>(
              compiler,
              { code: e.solution, standard: e.cpp!.standard, files: e.cpp!.files },
              90000,
            );
            if (!output.ok) throw new Error(output.diagnostics);
            const results = [];
            for (const test of e.cpp!.tests) {
              const runner = new Worker('/cpp/runner.worker.js', { type: 'module' });
              try {
                results.push(
                  await request<RunResult>(
                    runner,
                    { binary: output.binary, stdin: test.stdin },
                    3000,
                  ),
                );
              } finally {
                runner.terminate();
              }
            }
            return results;
          } finally {
            compiler.terminate();
          }
        }, exercise);
        for (let i = 0; i < results.length; i++) {
          if (!passesTest(results[i], exercise.cpp.tests[i]))
            throw new Error(
              `${exercise.id}/${exercise.cpp.tests[i].id}: soluzione non supera il test: ${JSON.stringify(results[i])}`,
            );
          tests++;
        }
        console.log(`C++ reale: ${exercise.id}, ${results.length} test superati.`);
      }
      fs.writeFileSync(
        path.join(directory, 'cpp-verification.json'),
        JSON.stringify(
          {
            toolchain: CPP_TOOLCHAIN,
            digest: cppDigest(topic.manifest, topic.exercises),
            verifiedAt: new Date().toISOString(),
            exercises: exercises.length,
            tests,
            passed: true,
            starterChecked: true,
          },
          null,
          2,
        ) + '\n',
      );
    }
  } finally {
    await browser.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
