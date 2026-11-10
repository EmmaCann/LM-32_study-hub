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
test('demo approvate, riferimenti e capitoli coerenti', () => {
  const topics = getTopics();
  assert.equal(topics.length, 6);
  assert.equal(topics.flatMap((t) => t.simulations).length, 2);
  assert.equal(topics.flatMap((t) => t.exercises).length, 2);
  assert(topics.every((t) => t.manifest.demo));
  assert(headings(topics[0].content).length >= 3);
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
  const m = getTopics()[0].manifest;
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
  assert.throws(() => validateCollection([...topics, topics[0]]));
  const copy = structuredClone(topics);
  copy[1].manifest.chapter.title = 'Altro nome';
  assert.throws(() => validateCollection(copy));
});
test('pacchetti draft, asset mancanti e componenti sconosciuti bloccati', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'lm32-test-'));
  try {
    const topic = getTopics().find((t) => t.manifest.subject === 'cpp' && t.exercises.length)!;
    const write = (name: string, data: unknown) =>
      fs.writeFileSync(path.join(temp, name), JSON.stringify(data));
    write('manifest.json', {
      ...topic.manifest,
      review: { ...topic.manifest.review, status: 'draft' },
    });
    fs.writeFileSync(path.join(temp, 'content.mdx'), topic.content);
    write('exercises.json', topic.exercises);
    write('simulations.json', []);
    assert.throws(() => readPackage(temp, true), /revisione/);
    write('manifest.json', topic.manifest);
    assert.throws(() => readPackage(temp, true), /Asset mancante/);
    write('simulations.json', [
      { id: 'unknown', component: 'run-javascript', title: 'X', description: 'X' },
    ]);
    assert.throws(() => readPackage(temp, true));
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
