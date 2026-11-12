import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  getTopics,
  readPackage,
  validateCollection,
  validateMarkup,
  headings,
} from '../src/lib/content';
import { slug, assetName, stableUrl } from '../src/lib/schema';
test('il catalogo contiene solo pacchetti approvati e accetta anche zero contenuti', () => {
  const topics = getTopics();
  assert.ok(topics.every(t => t.manifest.review.status === 'approved' && !t.manifest.demo));
  assert.deepEqual(validateCollection([]), []);
  assert.equal(headings('## Spazio pronto\n\nGli appunti approvati compariranno qui.').length, 1);
});
test('identificatori e asset impediscono traversal', () => {
  for (const value of ['../evil', 'a/b', 'AOS', 'foo--bar'])
    assert.equal(slug.safeParse(value).success, false);
  for (const value of ['../secret.pdf', 'x.html', 'a.svg', 'a.js', 'a.pdf/../../x'])
    assert.equal(assetName.safeParse(value).success, false);
});
test('markup non può importare/eseguire JSX o script', () => {
  for (const content of [
    'import Evil from "evil"',
    '<script>alert(1)</script>',
    '<Component />',
    '[link](javascript:alert)',
  ])
    assert.throws(() => validateMarkup(content));
  assert.doesNotThrow(() => validateMarkup('```cpp\n#include <memory>\n```\nFormula $x_{i}$'));
});
test('URL PDF richiedono origine HTTPS e anchor validi', () => {
  const m = {
    schemaVersion: 1 as const,
    id: 'aos-vm-exit',
    subject: 'aos',
    chapter: { id: 'virtualizzazione', title: 'Virtualizzazione', order: 1 },
    slug: 'vm-exit',
    title: 'VM exit',
    description: 'Appunti',
    order: 1,
    demo: false,
    updated: '2026-11-11',
    revision: 1,
    review: { status: 'approved' as const, reviewer: 'Test', sources: [] },
    assets: [],
  };
  assert(stableUrl('https://studio.example', m, 'demo').startsWith('https://studio.example/'));
  for (const url of [
    'http://studio.example',
    'file:///C:/appunti',
    'https://user:password@example.com',
    'https://example.com/path',
    'https://example.com?x=1',
  ])
    assert.throws(() => stableUrl(url, m));
  assert.throws(() => stableUrl('https://example.com', m, '../escape'));
});
test('duplicati e metadati dei capitoli incoerenti sono rifiutati', () => {
  const topics = getTopics();
  assert.equal(validateCollection(topics).length, topics.length);
  assert.throws(() =>
    validateCollection([
      {
        manifest: {
          schemaVersion: 1,
          id: 'uno',
          subject: 'aos',
          chapter: { id: 'os', title: 'OS', order: 1 },
          slug: 'argomento',
          title: 'Uno',
          description: 'Test',
          order: 1,
          demo: false,
          updated: '2026-11-11',
          revision: 1,
          review: { status: 'approved', reviewer: 'Test', sources: [] },
          assets: [],
        },
        content: '',
        exercises: [],
        simulations: [],
      },
      {
        manifest: {
          schemaVersion: 1,
          id: 'due',
          subject: 'aos',
          chapter: { id: 'os', title: 'Nome diverso', order: 1 },
          slug: 'altro',
          title: 'Due',
          description: 'Test',
          order: 2,
          demo: false,
          updated: '2026-11-11',
          revision: 1,
          review: { status: 'approved', reviewer: 'Test', sources: [] },
          assets: [],
        },
        content: '',
        exercises: [],
        simulations: [],
      },
    ]),
  );
});
test('pacchetti draft, asset mancanti e componenti sconosciuti bloccati', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'lm32-test-'));
  try {
    const topic = JSON.parse(
      fs.readFileSync(new URL('./fixtures/import-package/manifest.json', import.meta.url), 'utf8'),
    );
    const write = (name: string, data: unknown) =>
      fs.writeFileSync(path.join(temp, name), JSON.stringify(data));
    write('manifest.json', { ...topic, review: { ...topic.review, status: 'draft' } });
    fs.writeFileSync(
      path.join(temp, 'content.mdx'),
      fs.readFileSync(new URL('./fixtures/import-package/content.mdx', import.meta.url), 'utf8'),
    );
    write('exercises.json', []);
    write('simulations.json', []);
    assert.throws(() => readPackage(temp, true), /revisione/);
    write('manifest.json', { ...topic, assets: ['missing.pdf'], pdf: 'missing.pdf' });
    assert.throws(() => readPackage(temp, true), /Asset mancante/);
    write('manifest.json', topic);
    write('simulations.json', [
      { id: 'unknown', component: 'run-javascript', title: 'X', description: 'X' },
    ]);
    assert.throws(() => readPackage(temp, true));
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
