import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { Exercise, Manifest } from './schema';
export const CPP_TOOLCHAIN = '@yowasp/clang@22.0.0-git20542-10';
export const cppReceiptSchema = z
  .object({
    toolchain: z.literal(CPP_TOOLCHAIN),
    digest: z.string().regex(/^[0-9a-f]{64}$/),
    verifiedAt: z.iso.datetime(),
    exercises: z.number().int().positive(),
    tests: z.number().int().positive(),
    passed: z.literal(true),
    starterChecked: z.literal(true),
  })
  .strict();
export function cppDigest(manifest: Manifest, exercises: Exercise[]) {
  return createHash('sha256')
    .update(
      JSON.stringify({
        id: manifest.id,
        subject: manifest.subject,
        chapter: manifest.chapter,
        slug: manifest.slug,
        revision: manifest.revision,
        exercises: exercises.filter((e) => e.type === 'cpp'),
      }),
    )
    .digest('hex');
}
