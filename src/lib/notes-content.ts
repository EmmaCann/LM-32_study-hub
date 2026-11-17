import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { publishedNotesSchema } from './published-notes';
import type { StudyLesson } from './study-schema';
export function validatePublishedNotes(lessons: StudyLesson[]) {
  const root = path.resolve('public/notes');
  const index = publishedNotesSchema.parse(
    JSON.parse(fs.readFileSync(path.join(root, 'index.json'), 'utf8')),
  );
  if (new Set(index.documents.map((d) => d.id)).size !== index.documents.length)
    throw new Error('ID appunti duplicati.');
  for (const lesson of lessons) {
    if (!lesson.document) continue;
    const document = lesson.document;
    const entry = index.documents.find((d) => d.id === document.id);
    if (
      !entry ||
      entry.lessonId !== lesson.id ||
      entry.subject !== lesson.subject ||
      entry.fingerprint !== document.fingerprint ||
      entry.pages.length !== document.pages ||
      entry.url !== `/notes/${entry.filename}`
    )
      throw new Error(`Appunti mancanti o non aggiornati: ${lesson.id}`);
    const file = path.join(root, entry.filename);
    if (fs.lstatSync(file).isSymbolicLink()) throw new Error('Link simbolico negli appunti.');
    if (createHash('sha256').update(fs.readFileSync(file)).digest('hex') !== entry.fingerprint)
      throw new Error(`Integrità PDF non valida: ${lesson.id}`);
  }
  if (index.documents.some((d) => !lessons.some((l) => l.document?.id === d.id)))
    throw new Error('Appunti senza lezione associata.');
  const allowed = new Set(['index.json', ...index.documents.map((d) => d.filename)]);
  if (fs.readdirSync(root).some((name) => !allowed.has(name)))
    throw new Error('File non dichiarato nella raccolta appunti pubblica.');
  return index.documents;
}
