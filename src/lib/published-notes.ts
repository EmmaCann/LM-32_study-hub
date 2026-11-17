import { z } from 'zod';
import { slug } from './schema';
export const publishedNotesSchema = z
  .object({
    schemaVersion: z.literal(1),
    documents: z.array(
      z
        .object({
          id: slug,
          lessonId: slug,
          subject: slug,
          title: z.string().min(1),
          filename: z.string().regex(/^[a-z][a-z0-9-]*\.pdf$/),
          url: z.string().regex(/^\/notes\/[a-z][a-z0-9-]*\.pdf$/),
          fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
          pages: z.array(z.string()).min(1).max(500),
        })
        .strict(),
    ),
  })
  .strict();
export type PublishedNote = z.infer<typeof publishedNotesSchema>['documents'][number];
