/* Standalone local HTML document, not a Next.js page. */
/* eslint-disable @next/next/no-head-element, @next/next/no-css-tags */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { renderToStaticMarkup } from 'react-dom/server';
import { Notes } from '../src/components/markdown';
import type { Topic } from '../src/lib/schema';
export async function writePreview(topic: Topic, source: string) {
  const output = path.resolve('.preview', topic.manifest.id);
  fs.mkdirSync(output, { recursive: true });
  const notes = await Notes({ content: topic.content, manifest: topic.manifest });
  const body = renderToStaticMarkup(
    <html lang="it">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="robots" content="noindex,nofollow" />
        <title>{`Anteprima · ${topic.manifest.title}`}</title>
        <link rel="stylesheet" href="katex/katex.min.css" />
        <style>
          {
            'body{font:17px/1.8 system-ui;max-width:850px;margin:40px auto;padding:20px;color:#202936}h1,h2{line-height:1.3}pre{overflow:auto;padding:20px;border-radius:8px}table{border-collapse:collapse}td,th{padding:10px;border:1px solid #ddd}blockquote{border-left:3px solid #5968c8;padding-left:20px}img{max-width:100%}.notice{background:#eef0ff;padding:20px}a{color:#4756ad}.katex-display{overflow:auto}'
          }
        </style>
      </head>
      <body>
        <p className="notice">
          ANTEPRIMA LOCALE · Nessuna pubblicazione o approvazione effettuata. I link al sito
          richiedono il server locale. Le simulazioni sotto sono elencate per la revisione;
          l’interattività è verificabile nell’applicazione.
        </p>
        <h1>{topic.manifest.title}</h1>
        {notes}
        <h2>Simulazioni dichiarate</h2>
        {topic.simulations.map((s) => (
          <p key={s.id}>
            <strong>{s.title}</strong> — {s.component}: {s.description}
          </p>
        ))}
        <h2>Esercizi da revisionare</h2>
        {topic.exercises.map((e) => (
          <section key={e.id}>
            <h3>{e.title}</h3>
            <p>{e.prompt}</p>
            <details>
              <summary>Soluzione e spiegazione</summary>
              <pre>{e.solution}</pre>
              <p>{e.explanation}</p>
            </details>
          </section>
        ))}
      </body>
    </html>,
  );
  let html = '<!doctype html>' + body;
  for (const asset of topic.manifest.assets)
    html = html.replaceAll(`/assets/${topic.manifest.id}/${asset}`, `assets/${asset}`);
  fs.writeFileSync(path.join(output, 'index.html'), html);
  const require = createRequire(import.meta.url);
  fs.cpSync(path.dirname(require.resolve('katex')), path.join(output, 'katex'), {
    recursive: true,
  });
  if (topic.manifest.assets.length) {
    fs.mkdirSync(path.join(output, 'assets'), { recursive: true });
    for (const asset of topic.manifest.assets)
      fs.copyFileSync(path.join(source, 'assets', asset), path.join(output, 'assets', asset));
  }
  return path.join(output, 'index.html');
}
