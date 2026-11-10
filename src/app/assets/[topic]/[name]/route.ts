import fs from 'node:fs';
import path from 'node:path';
import { getTopics, approvedRoot } from '@/lib/content';
const types: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.cpp': 'text/plain; charset=utf-8',
};
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ topic: string; name: string }> },
) {
  const { topic, name } = await params;
  const found = getTopics().find((t) => t.manifest.id === topic);
  if (!found || !found.manifest.assets.includes(name))
    return new Response('Asset non trovato', { status: 404 });
  const data = fs.readFileSync(path.join(approvedRoot, topic, 'assets', name));
  return new Response(data, {
    headers: {
      'Content-Type': types[path.extname(name)] ?? 'application/octet-stream',
      'Content-Disposition': `${name.endsWith('.cpp') ? 'attachment' : 'inline'}; filename="${name}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
