import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { exerciseSchema, cppExercisePath } from '../src/lib/schema';
import { getTopics, readPackage } from '../src/lib/content';
import { compareOutput, passesTest } from '../src/lib/cpp-check';
test('C++: confronti espliciti e risultati limitati ai test verificati', () => {
  assert.equal(compareOutput('a\n', 'a', 'exact'), false);
  assert.equal(compareOutput('a\r\n', 'a', 'trim'), true);
  assert.equal(compareOutput('2  4\n', '2\t4', 'tokens'), true);
  const test = {
    id: 'test',
    title: 'Test',
    visibility: 'public' as const,
    stdin: '',
    stdout: 'ok',
    stderr: '',
    exitCode: 0,
    comparison: 'trim' as const,
  };
  assert(passesTest({ reason: 'exited', exitCode: 0, stdout: 'ok\n', stderr: '' }, test));
  assert(!passesTest({ reason: 'timeout', exitCode: 0, stdout: 'ok', stderr: '' }, test));
  assert(!passesTest({ reason: 'exited', exitCode: 1, stdout: 'ok', stderr: '' }, test));
  assert(!passesTest({ reason: 'exited', exitCode: 0, stdout: 'ok', stderr: 'errore' }, test));
});
test('C++: schema compatibile, file sicuri e URL stabili', () => {
  const topic = getTopics().find((t) => t.manifest.id === 'cpp-esercitazioni-guidate')!;
  assert.equal(topic.exercises.length, 3);
  const original = topic.exercises[0];
  assert.equal(
    cppExercisePath(topic.manifest, original.id),
    '/cpp/playground/cpp-esercitazioni-guidate/somma-interi',
  );
  assert(!exerciseSchema.safeParse({ ...original, cpp: undefined }).success);
  assert(
    !exerciseSchema.safeParse({
      ...original,
      cpp: { ...original.cpp, files: [{ name: '../private.hpp', content: '' }] },
    }).success,
  );
  assert(
    !exerciseSchema.safeParse({
      ...original,
      cpp: { ...original.cpp, tests: [original.cpp!.tests[0], original.cpp!.tests[0]] },
    }).success,
  );
  assert(
    !exerciseSchema.safeParse({
      ...original,
      cpp: {
        ...original.cpp,
        referenceLesson: { title: 'Locale', url: 'file:///C:/LM-32/private.pdf' },
      },
    }).success,
  );
  assert(
    exerciseSchema.safeParse({
      id: 'legacy',
      type: 'short',
      title: 'Legacy',
      prompt: 'Domanda',
      answer: 'A',
      hints: [],
      solution: 'B',
      explanation: 'C',
    }).success,
  );
});
test('C++: una modifica al codice invalida il gate di pubblicazione', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'study-hub-cpp-'));
  try {
    fs.cpSync('src/content/approved/cpp-esercitazioni-guidate', dir, { recursive: true });
    assert.doesNotThrow(() => readPackage(dir, true));
    const exercises = JSON.parse(fs.readFileSync(path.join(dir, 'exercises.json'), 'utf8'));
    exercises[0].cpp.starterCode += '\n// modifica';
    fs.writeFileSync(path.join(dir, 'exercises.json'), JSON.stringify(exercises));
    assert.throws(() => readPackage(dir, true), /Verifica C\+\+/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
