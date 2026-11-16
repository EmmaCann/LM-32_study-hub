import fs from 'node:fs';
import path from 'node:path';
import { curriculumSchema } from '../src/lib/study-schema';
import { validateCurriculum } from '../src/lib/study-content';
import { getTopics } from '../src/lib/content';
const [command = 'validate', source, ...flags] = process.argv.slice(2);
try {
  const target = path.resolve('src/content/curriculum.json');
  const current = curriculumSchema.parse(JSON.parse(fs.readFileSync(target, 'utf8')));
  if (command === 'validate') {
    validateCurriculum(current.lessons, getTopics());
    console.log(`Percorso valido: ${current.lessons.length} lezioni.`);
  } else {
    if (!['preview', 'import'].includes(command) || !source)
      throw new Error(
        'Uso: study:content validate | preview staging/<pacchetto>/curriculum.json | import staging/<pacchetto>/curriculum.json --approve',
      );
    const file = path.resolve(source);
    const staging = path.resolve('staging');
    if (
      !file.startsWith(staging + path.sep) ||
      !fs.realpathSync(file).startsWith(fs.realpathSync(staging) + path.sep) ||
      fs.lstatSync(file).isSymbolicLink()
    )
      throw new Error('Usare un file JSON reale contenuto in staging.');
    const candidate = curriculumSchema.parse(JSON.parse(fs.readFileSync(file, 'utf8')));
    const merged = new Map(current.lessons.map((l) => [l.id, l]));
    for (const lesson of candidate.lessons) {
      const old = merged.get(lesson.id);
      if (old && old.subject !== lesson.subject)
        throw new Error('Non cambiare la materia di una lezione pubblicata.');
      if (old && old.activities.some((a) => !lesson.activities.some((next) => next.id === a.id)))
        throw new Error(
          'Mantenere gli ID delle attività esistenti; renderle facoltative se necessario.',
        );
      merged.set(lesson.id, lesson);
    }
    const lessons = validateCurriculum([...merged.values()], getTopics());
    console.log(
      `Anteprima valida: ${candidate.lessons.length} lezioni proposte, ${lessons.length} totali. Nessun PDF incluso.`,
    );
    if (command === 'import') {
      if (!flags.includes('--approve'))
        throw new Error('Importazione richiede --approve dopo revisione di contenuti e fonti.');
      const backupRoot = path.resolve('backups');
      fs.mkdirSync(backupRoot, { recursive: true });
      fs.copyFileSync(target, path.join(backupRoot, `curriculum-${Date.now()}.json`));
      const temporary = target + '.pending';
      fs.writeFileSync(temporary, JSON.stringify({ schemaVersion: 1, lessons }, null, 2) + '\n', {
        flag: 'wx',
      });
      fs.renameSync(temporary, target);
      console.log('Catalogo aggiornato localmente. Nessun commit, push o deployment.');
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
