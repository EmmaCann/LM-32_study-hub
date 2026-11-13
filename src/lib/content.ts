import fs from 'node:fs';
import path from 'node:path';
import { manifestSchema, exerciseSchema, simulationSchema, topicPath, type Topic } from './schema';
import subjects from '../content/subjects.json';
import { cppDigest, cppReceiptSchema } from './cpp-publication';
export { subjects };
export const approvedRoot = path.join(process.cwd(), 'src/content/approved');
const withoutCode = (content: string) => content.replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, '');
export function headings(content: string) {
  return [...withoutCode(content).matchAll(/^## (.+)$/gm)].map((m, i) => ({
    title: m[1],
    id: `sezione-${i + 1}`,
  }));
}
export function validateMarkup(content: string) {
  // Markdown data only: never compile MDX/JSX, imports, expressions, or raw HTML.
  const prose = withoutCode(content);
  if (
    /^\s*(import|export)\s/m.test(prose) ||
    /<\/?[A-Za-z][^>]*>/.test(prose) ||
    /\]\(\s*(?:javascript|data|file):/i.test(prose)
  )
    throw new Error('Contenuto non sicuro: HTML, JSX, import/export e URL eseguibili non ammessi');
  if (/^\s*\[[^\]]+\]:/m.test(prose))
    throw new Error('Usare link inline espliciti, non riferimenti Markdown separati');
}
export function readPackage(dir: string, approved = false): Topic {
  if (fs.lstatSync(dir).isSymbolicLink()) throw new Error('Link simbolici non ammessi');
  const read = (name: string) => {
    const file = path.join(dir, name);
    if (fs.lstatSync(file).isSymbolicLink()) throw new Error('Link simbolici non ammessi');
    return fs.readFileSync(file, 'utf8');
  };
  const manifest = manifestSchema.parse(JSON.parse(read('manifest.json')));
  if (!subjects.some((s) => s.id === manifest.subject))
    throw new Error(`Materia sconosciuta: ${manifest.subject}`);
  if (approved && (manifest.review.status !== 'approved' || !manifest.review.reviewer.trim()))
    throw new Error('Contenuto privo di revisione approvata');
  const content = read('content.mdx');
  validateMarkup(content);
  const exercises = exerciseSchema.array().parse(JSON.parse(read('exercises.json')));
  const cppExercises = exercises.filter((e) => e.type === 'cpp');
  if (cppExercises.length && manifest.subject !== 'cpp')
    throw new Error('Esercizi C++ ammessi soltanto nella materia cpp');
  if (approved && (manifest.pdf || manifest.assets.some((a) => a.endsWith('.pdf'))))
    throw new Error('I PDF completi restano locali: non possono essere pubblicati su Study Hub');
  if (approved && cppExercises.length) {
    if (cppExercises.some((e) => e.cpp?.execution !== 'browser'))
      throw new Error(
        'Esercizio C++ non verificabile nel browser: revisione locale necessaria, pubblicazione automatica bloccata',
      );
    const receipt = cppReceiptSchema.parse(JSON.parse(read('cpp-verification.json')));
    if (
      receipt.digest !== cppDigest(manifest, exercises) ||
      receipt.exercises !== cppExercises.length ||
      receipt.tests !== cppExercises.reduce((n, e) => n + (e.cpp?.tests.length ?? 0), 0)
    )
      throw new Error('Verifica C++ mancante o non aggiornata: eseguire npm run cpp:verify');
  }
  const simulations = simulationSchema.array().parse(JSON.parse(read('simulations.json')));
  const anchors = [...exercises, ...simulations, ...headings(content)].map((x) => x.id);
  if (new Set(anchors).size !== anchors.length)
    throw new Error('ID esercizi/simulazioni duplicati');
  if (manifest.pdf && !manifest.pdf.endsWith('.pdf'))
    throw new Error('Il PDF deve avere estensione .pdf');
  if (exercises.some((e) => e.download && !e.download.endsWith('.cpp')))
    throw new Error('Il download di un esercizio deve essere un file .cpp');
  if (new Set(manifest.assets).size !== manifest.assets.length)
    throw new Error('Nomi asset duplicati');
  for (const name of [
    ...manifest.assets,
    ...(manifest.pdf ? [manifest.pdf] : []),
    ...exercises.flatMap((e) => (e.download ? [e.download] : [])),
  ]) {
    if (!manifest.assets.includes(name)) throw new Error(`Asset non dichiarato: ${name}`);
    const file = path.join(dir, 'assets', name);
    if (
      !fs.existsSync(file) ||
      !fs.statSync(file).isFile() ||
      fs.lstatSync(file).isSymbolicLink() ||
      fs.lstatSync(path.join(dir, 'assets')).isSymbolicLink()
    )
      throw new Error(`Asset mancante o non sicuro: ${name}`);
  }
  for (const match of withoutCode(content).matchAll(/!?\[[^\]]*\]\(([^\s)]+)(?:\s+[^)]*)?\)/g)) {
    const href = match[1];
    if (match[0].startsWith('!') && !/^assets\/.+\.(png|jpg|jpeg|webp)$/.test(href))
      throw new Error('Le immagini devono riferirsi ad asset locali dichiarati');
    if (href.startsWith('assets/')) {
      if (!manifest.assets.includes(href.slice(7)))
        throw new Error(`Asset non dichiarato: ${href}`);
    } else if (!href.startsWith('https://') && !href.startsWith('#') && !/^\/[a-z]/.test(href))
      throw new Error(`Link non ammesso: ${href}`);
  }
  return { manifest, content, exercises, simulations };
}
export function validateCollection(topics: Topic[]) {
  const ids = new Set<string>(),
    urls = new Set<string>(),
    chapters = new Map<string, string>();
  for (const t of topics) {
    const m = t.manifest,
      url = topicPath(m);
    if (ids.has(m.id) || urls.has(url)) throw new Error(`ID o URL duplicato: ${m.id}`);
    ids.add(m.id);
    urls.add(url);
    const key = `${m.subject}/${m.chapter.id}`,
      value = JSON.stringify(m.chapter);
    if (chapters.has(key) && chapters.get(key) !== value)
      throw new Error(`Metadati capitolo incoerenti: ${key}`);
    chapters.set(key, value);
  }
  return topics;
}
export function getTopics(): Topic[] {
  if (!fs.existsSync(approvedRoot)) return [];
  return validateCollection(
    fs
      .readdirSync(approvedRoot, { withFileTypes: true })
      .filter((d) => (d.isDirectory() || d.isSymbolicLink()) && !d.name.startsWith('.pending-'))
      .map((d) => {
        const topic = readPackage(path.join(approvedRoot, d.name), true);
        if (d.name !== topic.manifest.id)
          throw new Error(`La cartella deve coincidere con l’ID: ${d.name}`);
        return topic;
      }),
  ).sort(
    (a, b) =>
      a.manifest.chapter.order - b.manifest.chapter.order || a.manifest.order - b.manifest.order,
  );
}
export function searchEntries() {
  const topics = getTopics();
  return [
    ...subjects.map((s) => ({
      title: s.title,
      kind: 'Materia',
      url: `/${s.id}`,
      text: s.description,
    })),
    ...Array.from(
      new Map(
        topics.map((t) => [
          `${t.manifest.subject}/${t.manifest.chapter.id}`,
          {
            title: t.manifest.chapter.title,
            kind: 'Capitolo',
            url: `/${t.manifest.subject}/${t.manifest.chapter.id}`,
            text: t.manifest.subject,
          },
        ]),
      ).values(),
    ),
    ...topics.flatMap((t) => {
      const url = topicPath(t.manifest);
      return [
        { title: t.manifest.title, kind: 'Argomento', url, text: t.content },
        ...headings(t.content).map((h) => ({
          title: h.title,
          kind: 'Sezione',
          url: `${url}#${h.id}`,
          text: t.manifest.title,
        })),
        ...t.simulations.map((s) => ({
          title: s.title,
          kind: 'Simulazione',
          url: `${url}#${s.id}`,
          text: s.description,
        })),
        ...t.exercises.map((e) => ({
          title: e.title,
          kind: 'Esercizio',
          url: `${url}#${e.id}`,
          text: e.prompt,
        })),
      ];
    }),
  ];
}
