import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const project = process.cwd();
test('CLI: anteprima isolata, approvazione, aggiornamento, backup e URL stabili', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lm32-import-'));
  try {
    const stage = path.join(root, 'staging/aos-vm-exit');
    fs.mkdirSync(stage, { recursive: true });
    fs.cpSync(path.join(project, 'tests/fixtures/import-package'), stage, { recursive: true });
    const file = path.join(stage, 'manifest.json'),
      manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
    const save = () => fs.writeFileSync(file, JSON.stringify(manifest));
    const run = (...args: string[]) =>
      spawnSync(
        process.execPath,
        [
          path.join(project, 'node_modules/tsx/dist/cli.mjs'),
          '--tsconfig',
          path.join(project, 'tsconfig.json'),
          path.join(project, 'scripts/content.ts'),
          ...args,
        ],
        { cwd: root, encoding: 'utf8' },
      );
    manifest.review.status = 'draft';
    save();
    let result = run('preview', 'staging/aos-vm-exit');
    assert.equal(result.status, 0, result.stderr);
    assert(fs.existsSync(path.join(root, '.preview/aos-vm-exit/index.html')));
    assert(!fs.existsSync(path.join(root, 'src/content/approved')));
    result = run('import', 'staging/aos-vm-exit', '--approve');
    assert.notEqual(result.status, 0);
    manifest.review.status = 'approved';
    save();
    result = run('import', 'staging/aos-vm-exit');
    assert.notEqual(result.status, 0);
    result = run('import', 'staging/aos-vm-exit', '--approve');
    assert.equal(result.status, 0, result.stderr);
    result = run('import', 'staging/aos-vm-exit', '--approve');
    assert.notEqual(result.status, 0);
    manifest.revision++;
    manifest.slug = 'nuovo-url';
    save();
    result = run('import', 'staging/aos-vm-exit', '--approve');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /URL/);
    manifest.slug = 'vm-exit';
    save();
    result = run('import', 'staging/aos-vm-exit', '--approve');
    assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.readdirSync(path.join(root, 'backups')).length, 1);
    result = run('validate');
    assert.equal(result.status, 0, result.stderr);
    manifest.revision++;
    save();
    const exercisesFile = path.join(stage, 'exercises.json');
    const exercises = [{id:'ancora-stabile',type:'short',title:'Test',prompt:'Domanda',answer:'A',hints:[],solution:'A',explanation:'Esempio originale'}];
    fs.writeFileSync(exercisesFile, JSON.stringify(exercises));
    result = run('import', 'staging/aos-vm-exit', '--approve');
    assert.equal(result.status, 0, result.stderr);
    manifest.revision++;
    save();
    exercises[0].id = 'ancora-rinominata';
    fs.writeFileSync(exercisesFile, JSON.stringify(exercises));
    result = run('import', 'staging/aos-vm-exit', '--approve');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /ID di esercizi e simulazioni/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
