import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getCurriculum } from '../src/lib/study-content';
import { validatePublishedNotes } from '../src/lib/notes-content';
import { publishedNotesSchema } from '../src/lib/published-notes';
test('PDF automatici: tutti i 26 appunti sono associati, integri e ricercabili', () => {
  const lessons = getCurriculum();
  const records = validatePublishedNotes(lessons);
  assert.equal(records.length, 26);
  assert.equal(records.length, lessons.filter((l) => l.document).length);
  assert.ok(records.every((r) => r.pages.some((page) => page.trim())));
  assert.ok(
    records
      .find((r) => r.lessonId === 'aos-lezioni-09-10')!
      .pages.join(' ')
      .includes('supervisor'),
  );
  assert.ok(records.every((r) => r.url.startsWith('/notes/') && !r.filename.includes('..')));
  const files = fs.readdirSync('public/notes');
  assert.equal(files.filter((f) => f.endsWith('.pdf')).length, records.length);
});
test('L’indice pubblico non ammette URL remoti, percorsi personali o file non PDF', () => {
  const sample = JSON.parse(fs.readFileSync('public/notes/index.json', 'utf8'));
  sample.documents[0].url = 'file:///C:/LM-32/private.pdf';
  assert.equal(publishedNotesSchema.safeParse(sample).success, false);
  sample.documents[0].url = '/notes/../../originale.zip';
  assert.equal(publishedNotesSchema.safeParse(sample).success, false);
});
