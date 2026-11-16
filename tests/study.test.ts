import test from 'node:test';
import assert from 'node:assert/strict';
import { getCurriculum, validateCurriculum } from '../src/lib/study-content';
import { getTopics } from '../src/lib/content';
import {
  activityKey,
  cTokens,
  emptyProgress,
  fragmentMatches,
  lessonStatus,
  recommendedLesson,
  mergeProgress,
  progressSchema,
} from '../src/lib/study-schema';
const lessons = getCurriculum();
test('Ripresa: continua la materia scelta dopo una verifica, senza cambiare corso', () => {
  const p = emptyProgress();
  const first = lessons.find((l) => l.id === 'aos-lezione-01')!;
  p.lastLesson = first.id;
  assert.equal(recommendedLesson(lessons, p)?.id, first.id);
  for (const a of first.activities)
    p.passed[activityKey(first.id, a.id)] = {
      signature: a.signature,
      passedAt: new Date().toISOString(),
    };
  assert.equal(recommendedLesson(lessons, p)?.id, 'aos-lezione-02');
});
test('Percorso: tutte le animazioni hanno teoria e le verifiche hanno riferimenti validi', () => {
  assert.ok(lessons.length >= 19);
  assert.equal(validateCurriculum(lessons, getTopics()).length, lessons.length);
  for (const lesson of lessons)
    for (const activity of lesson.activities)
      if (activity.type === 'c-fragment')
        assert.equal(fragmentMatches(activity.solution, activity.alternatives), true);
  const lesson = structuredClone(lessons[0]);
  lesson.theory = [];
  assert.throws(() => validateCurriculum([lesson], getTopics()), /Teoria mancante/);
  const missing = structuredClone(lessons[0]);
  missing.topicIds = ['inesistente'];
  assert.throws(() => validateCurriculum([missing], getTopics()), /Argomento mancante/);
  const incomplete = structuredClone(lessons[0]);
  incomplete.activities = [];
  assert.throws(() => validateCurriculum([incomplete], getTopics()), /obbligatoria/);
});
test('Percorso: completamento solo con tutte le firme attuali; aggiornamenti invalidano solo la verifica cambiata', () => {
  const lesson = lessons[0];
  const p = emptyProgress();
  assert.equal(lessonStatus(lesson, p), 'Da iniziare');
  p.visited[lesson.id] = new Date().toISOString();
  assert.equal(lessonStatus(lesson, p), 'In corso');
  for (const a of lesson.activities)
    p.passed[activityKey(lesson.id, a.id)] = {
      signature: a.signature,
      passedAt: new Date().toISOString(),
    };
  assert.equal(lessonStatus(lesson, p), 'Completata');
  p.passed[activityKey(lesson.id, lesson.activities[0].id)].signature = '0'.repeat(64);
  assert.equal(lessonStatus(lesson, p), 'Da verificare');
  assert.equal(
    lessonStatus(
      lessons.find((l) => l.availability === 'planned')!,
      p,
    ),
    'Da preparare',
  );
});
test('C: confronto per token, commenti fuori dalle stringhe, nessuna esecuzione o equivalenza inventata', () => {
  assert.ok(
    fragmentMatches('rc=ioctl ( fd, KVM_RUN, 0 ); // attesa', ['rc = ioctl(fd, KVM_RUN, 0);']),
  );
  assert.ok(fragmentMatches('/* a */ x ++ ;', ['x++;']));
  assert.equal(fragmentMatches('x += 2;', ['x += 1;']), false);
  assert.equal(fragmentMatches('x + +;', ['x++;']), false);
  assert.equal(fragmentMatches('f("a b");', ['f("ab");']), false);
  assert.equal(fragmentMatches('f("/* hello */");', ['f("");']), false);
  assert.equal(fragmentMatches('x++; unexpected()', ['x++;']), false);
  assert.equal(cTokens('x++; /* non chiuso'), null);
  assert.equal(cTokens('"non chiusa'), null);
  assert.equal(cTokens('x @ y'), null);
});
test('Backup: schema strict, niente PDF o proprietà sconosciute; unione conserva i dati più recenti', () => {
  const old = emptyProgress(),
    incoming = emptyProgress();
  const key = 'aos-lezione-01--trap';
  old.drafts[key] = { value: 'prima', updatedAt: '2026-11-15T10:00:00.000Z' };
  incoming.drafts[key] = { value: 'dopo', updatedAt: '2026-11-16T10:00:00.000Z' };
  old.visited['aos-lezione-01'] = '2026-11-16T10:00:00.000Z';
  incoming.visited['aos-lezione-01'] = '2026-11-15T10:00:00.000Z';
  const merged = mergeProgress(old, incoming);
  assert.equal(merged.drafts[key].value, 'dopo');
  assert.equal(merged.visited['aos-lezione-01'], old.visited['aos-lezione-01']);
  assert.ok(progressSchema.safeParse(merged).success);
  assert.equal(progressSchema.safeParse({ ...old, pdfs: [] }).success, false);
  assert.equal(progressSchema.safeParse({ ...old, schemaVersion: 2 }).success, false);
  assert.equal(
    progressSchema.safeParse({ ...old, visited: { '../escape': '2026-11-15T10:00:00.000Z' } })
      .success,
    false,
  );
});
