// Only revised notes explicitly associated with curriculum lessons are imported.
// Never traverse materials, transcripts, archives, support folders or symlinks.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root = process.env.STUDY_NOTES_ROOT ?? 'C:/LM-32';
const optional = process.argv.includes('--if-available');
if (process.env.VERCEL || !fs.existsSync(root)) {
  if (!optional && !process.env.VERCEL)
    throw new Error('Cartella appunti non disponibile. Configurare STUDY_NOTES_ROOT.');
  console.log('Appunti: utilizzo la raccolta revisionata inclusa nel progetto.');
  process.exit(0);
}
const curriculum = JSON.parse(fs.readFileSync('src/content/curriculum.json', 'utf8'));
const folders = {
  aos: 'advanced operating systems/appunti pronti',
  algoritmi: 'Advanced programming and AI coding/algoritmi/appunti pronti',
  cpp: 'Advanced programming and AI coding/c++/appunti pronti',
};
const output = path.resolve('public/notes');
fs.mkdirSync(output, { recursive: true });
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
const records = [];
function find(folder, name) {
  if (!fs.existsSync(folder)) return [];
  return fs.readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    if (
      entry.isSymbolicLink() ||
      entry.name.startsWith('.') ||
      ['supporto', 'revisioni', 'backups'].includes(entry.name.toLowerCase())
    )
      return [];
    const file = path.join(folder, entry.name);
    return entry.isDirectory() ? find(file, name) : entry.name === name ? [file] : [];
  });
}
for (const lesson of curriculum.lessons) {
  const document = lesson.document;
  if (!document) continue;
  if (
    !folders[lesson.subject] ||
    !/^Appunti_(AOS|Algoritmi|CPP)_Lezione-\d+(?:-\d+)?\.pdf$/.test(document.filename)
  )
    throw new Error(`Documento non ammesso: ${lesson.id}`);
  const candidates = find(path.join(root, folders[lesson.subject]), document.filename);
  if (candidates.length !== 1)
    throw new Error(
      `Atteso un solo appunto revisionato per ${lesson.id}, trovati ${candidates.length}.`,
    );
  const data = fs.readFileSync(candidates[0]);
  if (data.length > 50 * 1024 * 1024 || !data.subarray(0, 5).equals(Buffer.from('%PDF-')))
    throw new Error(`PDF non valido: ${lesson.id}`);
  const fingerprint = createHash('sha256').update(data).digest('hex');
  if (fingerprint !== document.fingerprint)
    throw new Error(
      `Versione appunti cambiata: ${lesson.id}. Aggiornare riferimenti e fingerprint nel catalogo prima della sincronizzazione.`,
    );
  const filename = `${document.id}.pdf`;
  const destination = path.join(output, filename);
  const prior = fs.existsSync(destination) ? fs.readFileSync(destination) : null;
  if (!prior || !prior.equals(data)) fs.writeFileSync(destination, data);
  const task = pdfjs.getDocument({
    data: new Uint8Array(data),
    standardFontDataUrl:
      path.resolve('node_modules/pdfjs-dist/standard_fonts').replaceAll('\\', '/') + '/',
  });
  try {
    const pdf = await task.promise;
    if (pdf.numPages !== document.pages)
      throw new Error(`Numero di pagine incoerente: ${lesson.id}`);
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const text = await page.getTextContent();
      pages.push(text.items.map((item) => ('str' in item ? item.str : '')).join(' '));
      page.cleanup();
    }
    records.push({
      id: document.id,
      lessonId: lesson.id,
      subject: lesson.subject,
      title: lesson.title,
      filename,
      url: `/notes/${filename}`,
      fingerprint,
      pages,
    });
  } finally {
    await task.destroy();
  }
}
const index = JSON.stringify({ schemaVersion: 1, documents: records });
const indexFile = path.join(output, 'index.json');
if (!fs.existsSync(indexFile) || fs.readFileSync(indexFile, 'utf8') !== index)
  fs.writeFileSync(indexFile, index);
console.log(
  `Appunti sincronizzati: ${records.length} PDF rielaborati, associati automaticamente alle lezioni.`,
);
