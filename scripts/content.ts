import fs from 'node:fs';
import path from 'node:path';
import { approvedRoot, getTopics, readPackage, validateCollection } from '../src/lib/content';
import { stableUrl, topicPath } from '../src/lib/schema';
import { writePreview } from './preview';
const [command = 'validate', arg, ...flags] = process.argv.slice(2);
async function main() {
  try {
    if (command === 'validate') {
      const topics = getTopics();
      console.log(`Validati ${topics.length} argomenti approvati.`);
    } else if (command === 'preview' || command === 'import') {
      if (!arg) throw new Error('Specificare una directory in staging');
      const staging = path.resolve('staging'),
        source = path.resolve(arg);
      if (!source.startsWith(staging + path.sep))
        throw new Error('Il pacchetto deve trovarsi in staging');
      if (!fs.realpathSync(source).startsWith(fs.realpathSync(staging) + path.sep))
        throw new Error('Il pacchetto esce da staging');
      const candidate = readPackage(source, command === 'import'),
        m = candidate.manifest,
        topics = getTopics(),
        old = topics.find((t) => t.manifest.id === m.id);
      if (old && topicPath(old.manifest) !== topicPath(m))
        throw new Error('Aggiornamento rifiutato: gli URL devono restare stabili');
      if (old && m.revision <= old.manifest.revision)
        throw new Error('Incrementare revision per aggiornare un argomento');
      validateCollection([...topics.filter((t) => t.manifest.id !== m.id), candidate]);
      console.log(
        JSON.stringify(
          {
            action: old ? 'aggiornamento' : 'nuovo',
            title: m.title,
            url: topicPath(m),
            revision: m.revision,
            assets: m.assets,
            exercises: candidate.exercises.length,
            simulations: candidate.simulations.length,
          },
          null,
          2,
        ),
      );
      if (command === 'import') {
        if (!flags.includes('--approve'))
          throw new Error('Importazione non eseguita: dopo la revisione usare --approve');
        const target = path.join(approvedRoot, m.id),
          temp = path.join(approvedRoot, `.pending-${m.id}`);
        fs.mkdirSync(approvedRoot, { recursive: true });
        if (fs.existsSync(temp))
          throw new Error('Operazione incompleta: controllare la directory .pending');
        fs.mkdirSync(temp);
        for (const f of ['manifest.json', 'content.mdx', 'exercises.json', 'simulations.json'])
          fs.copyFileSync(path.join(source, f), path.join(temp, f));
        if (m.assets.length) {
          fs.mkdirSync(path.join(temp, 'assets'));
          for (const f of m.assets)
            fs.copyFileSync(path.join(source, 'assets', f), path.join(temp, 'assets', f));
        }
        if (fs.existsSync(target)) {
          const backup = path.resolve('backups', `${m.id}-${Date.now()}`);
          fs.mkdirSync(path.dirname(backup), { recursive: true });
          fs.renameSync(target, backup);
          try {
            fs.renameSync(temp, target);
          } catch (error) {
            fs.renameSync(backup, target);
            throw error;
          }
        } else fs.renameSync(temp, target);
        console.log(
          'Contenuto approvato inserito. Ricostruire il sito; nessun deployment eseguito.',
        );
      } else console.log('Anteprima HTML locale:', await writePreview(candidate, source));
    } else if (command === 'links') {
      if (!arg) throw new Error('Specificare il dominio HTTPS definitivo');
      console.log(
        getTopics()
          .flatMap((t) => [
            stableUrl(arg, t.manifest),
            ...t.simulations.map((s) => stableUrl(arg, t.manifest, s.id)),
          ])
          .join('\n'),
      );
    } else
      throw new Error(
        'Comandi: validate | preview staging/cartella | import staging/cartella --approve | links https://dominio',
      );
  } catch (error) {
    console.error('Errore contenuti:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
void main();
