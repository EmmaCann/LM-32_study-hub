import { z } from 'zod';
export const slug = z
  .string()
  .regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/, 'Usare identificatori minuscoli separati da trattini');
export const assetName = z
  .string()
  .regex(
    /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.(pdf|png|jpg|jpeg|webp|cpp)$/,
    'Asset non ammesso o percorso non sicuro',
  );
export const manifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: slug,
    subject: slug,
    chapter: z
      .object({ id: slug, title: z.string().min(1), order: z.number().int().nonnegative() })
      .strict(),
    slug,
    title: z.string().min(1),
    description: z.string().min(1),
    order: z.number().int().nonnegative(),
    demo: z.boolean(),
    updated: z.iso.date(),
    revision: z.number().int().positive(),
    review: z
      .object({
        status: z.enum(['draft', 'approved']),
        reviewer: z.string(),
        sources: z.array(z.string()),
      })
      .strict(),
    assets: z.array(assetName).default([]),
    pdf: assetName.optional(),
  })
  .strict();
export const exerciseSchema = z
  .object({
    id: slug,
    type: z.enum(['multiple-choice', 'true-false', 'short', 'programming', 'algorithm']),
    title: z.string().min(1),
    prompt: z.string().min(1),
    options: z.array(z.string()).optional(),
    answer: z.string(),
    hints: z.array(z.string()),
    solution: z.string(),
    explanation: z.string(),
    download: assetName.optional(),
  })
  .strict()
  .superRefine((e, c) => {
    if (
      ['multiple-choice', 'true-false'].includes(e.type) &&
      (!e.options?.includes(e.answer) || e.options.length < 2)
    )
      c.addIssue({ code: 'custom', message: 'Opzioni e risposta non coerenti' });
  });
export const simulationSchema = z
  .object({
    id: slug,
    component: z.enum(['vm-exit', 'avl-rotation', 'aos-memory', 'aos-container', 'aos-flags', 'aos-cpu-cache', 'aos-virtqueue', 'aos-kvm-run', 'aos-decode', 'aos-time', 'aos-interrupts', 'aos-addresses', 'aos-memory-slot', 'aos-elf-loader', 'aos-pit-read', 'aos-vcpu-gaps', 'aos-partition', 'aos-ivshmem', 'aos-ring', 'aos-cache-colors', 'algoritmi-insertion', 'algoritmi-merge']),
    title: z.string(),
    description: z.string(),
  })
  .strict();
export type Manifest = z.infer<typeof manifestSchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
export type Simulation = z.infer<typeof simulationSchema>;
export type Topic = {
  manifest: Manifest;
  content: string;
  exercises: Exercise[];
  simulations: Simulation[];
};
export const topicPath = (m: Manifest) => `/${m.subject}/${m.chapter.id}/${m.slug}`;
export const assetPath = (m: Manifest, name: string) => `/assets/${m.id}/${name}`;
export function stableUrl(base: string, m: Manifest, anchor?: string) {
  const url = new URL(base);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  )
    throw new Error('SITE_URL deve essere un’origine HTTPS senza percorso o credenziali');
  if (anchor) slug.parse(anchor);
  return `${url.origin}${topicPath(m)}${anchor ? `#${anchor}` : ''}`;
}
