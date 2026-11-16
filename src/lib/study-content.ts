import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  curriculumSchema,
  fragmentMatches,
  cTokens,
  type Lesson,
  type StudyLesson,
} from './study-schema';
import { getTopics, subjects } from './content';
import type { Topic } from './schema';
export function validateCurriculum(lessons: Lesson[], topics: Topic[]) {
  const ids = new Set<string>();
  for (const lesson of lessons) {
    if (ids.has(lesson.id)) throw new Error(`Lezione duplicata: ${lesson.id}`);
    ids.add(lesson.id);
    if (
      new Set(lesson.sections.map((s) => s.id)).size !== lesson.sections.length ||
      lesson.sections.some((s) => !lesson.document || s.page > lesson.document.pages)
    )
      throw new Error(`Sezioni PDF non valide: ${lesson.id}`);
    if (!subjects.some((s) => s.id === lesson.subject))
      throw new Error(`Materia sconosciuta: ${lesson.subject}`);
    if (lesson.availability === 'ready' && !lesson.activities.some((a) => a.required))
      throw new Error(`Verifica obbligatoria mancante: ${lesson.id}`);
    if (lesson.availability === 'planned' && lesson.activities.length)
      throw new Error(`Lezione non pronta con attività: ${lesson.id}`);
    if (
      new Set(lesson.topicIds).size !== lesson.topicIds.length ||
      new Set(lesson.activities.map((a) => a.id)).size !== lesson.activities.length
    )
      throw new Error(`Riferimenti duplicati: ${lesson.id}`);
    for (const topicId of lesson.topicIds)
      if (!topics.some((t) => t.manifest.id === topicId && t.manifest.subject === lesson.subject))
        throw new Error(`Argomento mancante: ${topicId}`);
    for (const activity of lesson.activities) {
      if (
        activity.type === 'choice' &&
        (!activity.options.includes(activity.answer) ||
          new Set(activity.options).size !== activity.options.length)
      )
        throw new Error(`Risposta incoerente: ${activity.id}`);
      if (activity.type === 'c-fragment' && lesson.subject !== 'aos')
        throw new Error('Frammenti C riservati ad AOS');
      if (
        activity.type === 'c-fragment' &&
        (!fragmentMatches(activity.solution, activity.alternatives) ||
          activity.alternatives.some((a) => cTokens(a) === null))
      )
        throw new Error(`Alternative C non valide: ${activity.id}`);
      if (
        activity.type === 'cpp' &&
        !topics.some(
          (t) =>
            t.manifest.id === activity.topicId &&
            t.exercises.some((e) => e.id === activity.exerciseId && e.type === 'cpp'),
        )
      )
        throw new Error(`Esercizio C++ mancante: ${activity.exerciseId}`);
    }
    const refs = new Set<string>();
    for (const ref of lesson.theory) {
      const key = `${ref.topicId}/${ref.simulationId}`;
      if (refs.has(key)) throw new Error(`Riferimento teoria duplicato: ${key}`);
      refs.add(key);
      if (
        !lesson.document ||
        ref.page > lesson.document.pages ||
        !lesson.topicIds.includes(ref.topicId) ||
        !topics.some(
          (t) =>
            t.manifest.id === ref.topicId && t.simulations.some((s) => s.id === ref.simulationId),
        )
      )
        throw new Error(`Riferimento teoria non valido: ${key}`);
    }
    for (const topicId of lesson.topicIds)
      for (const simulation of topics.find((t) => t.manifest.id === topicId)!.simulations) {
        if (!refs.has(`${topicId}/${simulation.id}`))
          throw new Error(`Teoria mancante per animazione: ${simulation.id}`);
      }
  }
  return lessons;
}
export function getCurriculum(): StudyLesson[] {
  const parsed = curriculumSchema.parse(
    JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/content/curriculum.json'), 'utf8')),
  );
  const topics = getTopics();
  return validateCurriculum(parsed.lessons, topics)
    .sort((a, b) => a.order - b.order)
    .map((l) => ({
      ...l,
      activities: l.activities.map((a) => ({
        ...a,
        signature: createHash('sha256')
          .update(
            JSON.stringify({
              activity: a,
              exercise:
                a.type === 'cpp'
                  ? topics
                      .find((t) => t.manifest.id === a.topicId)
                      ?.exercises.find((e) => e.id === a.exerciseId)
                  : undefined,
            }),
          )
          .digest('hex'),
      })),
    }));
}
