import { z } from 'zod';
import { slug } from './schema';

const base = {
  id: slug,
  title: z.string().min(1),
  required: z.boolean().default(true),
  explanation: z.string().min(1),
  hints: z.array(z.string().min(1)).default([]),
};
export const activitySchema = z.discriminatedUnion('type', [
  z
    .object({
      ...base,
      type: z.literal('choice'),
      prompt: z.string().min(1),
      options: z.array(z.string().min(1)).min(2),
      answer: z.string().min(1),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal('c-fragment'),
      prompt: z.string().min(1),
      context: z.string().min(1),
      starter: z.string(),
      alternatives: z.array(z.string().min(1)).min(1),
      solution: z.string().min(1),
    })
    .strict(),
  z.object({ ...base, type: z.literal('cpp'), topicId: slug, exerciseId: slug }).strict(),
]);
export const theorySchema = z
  .object({
    topicId: slug,
    simulationId: slug,
    page: z.number().int().positive(),
    section: z.string().min(1),
  })
  .strict();
export const lessonSchema = z
  .object({
    id: slug,
    subject: slug,
    chapter: z.string().min(1),
    order: z.number().int().nonnegative(),
    title: z.string().min(1),
    description: z.string().min(1),
    objectives: z.array(z.string().min(1)).min(1),
    availability: z.enum(['ready', 'planned']),
    topicIds: z.array(slug),
    document: z
      .object({
        id: slug,
        title: z.string().min(1),
        filename: z.string().regex(/^[^\\/:]+\.pdf$/),
        fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
        pages: z.number().int().positive(),
      })
      .strict()
      .optional(),
    theory: z.array(theorySchema),
    activities: z.array(activitySchema),
    sections: z
      .array(
        z
          .object({ id: slug, title: z.string().min(1), page: z.number().int().positive() })
          .strict(),
      )
      .default([]),
  })
  .strict();
export type Activity = z.infer<typeof activitySchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type StudyActivity = Activity & { signature: string };
export type StudyLesson = Omit<Lesson, 'activities'> & { activities: StudyActivity[] };
export const curriculumSchema = z
  .object({ schemaVersion: z.literal(1), lessons: z.array(lessonSchema) })
  .strict();

const timestamp = z.iso.datetime();
const progressKey = z
  .string()
  .regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*--[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/);
export const progressSchema = z
  .object({
    schemaVersion: z.literal(1),
    passed: z.record(
      progressKey,
      z.object({ signature: z.string().regex(/^[a-f0-9]{64}$/), passedAt: timestamp }).strict(),
    ),
    drafts: z.record(
      progressKey,
      z.object({ value: z.string().max(131072), updatedAt: timestamp }).strict(),
    ),
    visited: z.record(slug, timestamp),
    lastLesson: slug.optional(),
  })
  .strict();
export type StudyProgress = z.infer<typeof progressSchema>;
export const emptyProgress = (): StudyProgress => ({
  schemaVersion: 1,
  passed: {},
  drafts: {},
  visited: {},
});
export function activityKey(lessonId: string, activityId: string) {
  return `${lessonId}--${activityId}`;
}
export function lessonStatus(lesson: StudyLesson, progress: StudyProgress) {
  if (lesson.availability === 'planned') return 'Da preparare';
  const required = lesson.activities.filter((a) => a.required);
  const passed = required.filter(
    (a) => progress.passed[activityKey(lesson.id, a.id)]?.signature === a.signature,
  ).length;
  if (required.length && passed === required.length) return 'Completata';
  if (passed || required.some((a) => progress.passed[activityKey(lesson.id, a.id)]))
    return 'Da verificare';
  if (progress.visited[lesson.id]) return 'In corso';
  return 'Da iniziare';
}
export function recommendedLesson(lessons: StudyLesson[], progress: StudyProgress) {
  const available = (lesson: StudyLesson) =>
    lesson.availability === 'ready' && lessonStatus(lesson, progress) !== 'Completata';
  const last = lessons.find((l) => l.id === progress.lastLesson);
  return (
    (last && available(last) ? last : undefined) ??
    lessons.find(
      (l) => l.subject === last?.subject && l.order > (last?.order ?? -1) && available(l),
    ) ??
    lessons.find((l) => l.subject === last?.subject && available(l)) ??
    lessons.find(available)
  );
}
export function mergeProgress(current: StudyProgress, incoming: StudyProgress): StudyProgress {
  const newest = <T extends { [key: string]: unknown }>(
    a: Record<string, T>,
    b: Record<string, T>,
    field: keyof T,
  ) => {
    const result = { ...a };
    for (const [key, value] of Object.entries(b))
      if (!result[key] || String(value[field]) > String(result[key][field])) result[key] = value;
    return result;
  };
  const visited = { ...current.visited };
  for (const [key, value] of Object.entries(incoming.visited))
    if (!visited[key] || value > visited[key]) visited[key] = value;
  return {
    schemaVersion: 1,
    passed: newest(current.passed, incoming.passed, 'passedAt'),
    drafts: newest(current.drafts, incoming.drafts, 'updatedAt'),
    visited,
    lastLesson: incoming.lastLesson ?? current.lastLesson,
  };
}

// Compare C tokens, never evaluate source. Whitespace/comments are skipped only
// outside literals. Unknown or unterminated input is rejected, not discarded.
export function cTokens(source: string): string[] | null {
  const tokens: string[] = [];
  let rest = source;
  const token =
    /^(?:\s+|\/\/[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|[A-Za-z_][A-Za-z_0-9]*|(?:\d+(?:\.\d*)?)(?:[eEpP][+-]?\d+)?[uUlLfF]*|>>=|<<=|->|\+\+|--|&&|\|\||==|!=|<=|>=|<<|>>|[+*/%&|^!<>=-]=|[{}()[\];,.?:~!%^&*+\/=<>|#-])/;
  while (rest) {
    const match = token.exec(rest);
    if (!match || (rest.startsWith('/*') && !match[0].startsWith('/*'))) return null;
    if (!/^\s|^\/\//.test(match[0]) && !match[0].startsWith('/*')) tokens.push(match[0]);
    rest = rest.slice(match[0].length);
  }
  return tokens;
}
export function fragmentMatches(source: string, alternatives: string[]) {
  const actual = cTokens(source);
  return (
    actual !== null &&
    alternatives.some((a) => {
      const expected = cTokens(a);
      return expected !== null && JSON.stringify(actual) === JSON.stringify(expected);
    })
  );
}
