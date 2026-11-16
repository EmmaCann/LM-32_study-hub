import { test } from 'node:test';
import assert from 'node:assert/strict';
import { l6Trace } from '../src/simulations/algoritmi-l06-model';
test('RB completes every insertion with order, reciprocal tree edges and all color/black-count properties', () => {
  for (const a of [
    [11, 2, 14, 1, 7, 15, 5, 8, 4],
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    [9, 8, 7, 6, 5, 4, 3, 2, 1],
    [5],
    [10, 5, 1, 15, 20],
  ]) {
    const fs = l6Trace('rb', a);
    for (const f of fs.filter((x) => x.title === 'Inserimento completato')) {
      assert.equal(f.valid, true);
      const present = f.nodes.filter((n) => n.color !== 'attesa');
      assert.equal(f.edges.length, present.length - 1);
      const parents = new Set<string>();
      for (const [p, c] of f.edges) {
        assert(!parents.has(c));
        parents.add(c);
        const pn = f.nodes.find((n) => n.id === p)!,
          cn = f.nodes.find((n) => n.id === c)!;
        assert(cn.y > pn.y);
        if (cn.x < pn.x) assert(Number(c) < Number(p));
        else assert(Number(c) > Number(p));
      }
    }
    assert.equal(fs.at(-1)!.values.Inseriti, a.length);
    assert.equal(fs.at(-1)!.nodes.length, a.length);
  }
  const f = l6Trace('rb', [11, 2, 14, 1, 7, 15, 5, 8, 4]);
  for (const c of [1, 2, 3]) assert(f.some((x) => x.title.startsWith('Caso ' + c)));
});
test('rod matches exhaustive compositions for different price lists and reconstructs multi-piece results', () => {
  const oracle = (p: number[], n: number): number =>
    n === 0 ? 0 : Math.max(...Array.from({ length: n }, (_, i) => p[i] + oracle(p, n - i - 1)));
  for (const p of [[1, 5, 8, 9, 10, 17, 17, 20, 24], [2, 3, 4], [0, 0, 0], [7], [2, 3, 4, 7, 8]]) {
    const fs = l6Trace('rod', p),
      f = fs.at(-1)!;
    assert.equal(f.values.Candidato, oracle(p, p.length));
    const s = String(f.values['s[1..n]']).split(',').map(Number);
    let n = p.length,
      total = 0,
      pieces = 0;
    while (n) {
      assert(s[n - 1] > 0 && s[n - 1] <= n);
      total += p[s[n - 1] - 1];
      n -= s[n - 1];
      pieces++;
      assert(pieces <= p.length);
    }
    assert.equal(total, oracle(p, p.length));
  }
  assert(l6Trace('rod', [2, 3, 4]).at(-1)!.title.includes('1 + 1 + 1'));
});
test('matrix costs, dimensions and invalid input bounds', () => {
  assert.equal(l6Trace('matrix', [200, 5, 100, 5], 0).at(-1)!.values.Totale, 200000);
  assert.equal(l6Trace('matrix', [200, 5, 100, 5], 1).at(-1)!.values.Totale, 7500);
  assert.equal(l6Trace('matrix', [10, 30, 5, 60], 0).at(-1)!.values.Totale, 4500);
  assert.throws(() => l6Trace('rb', [2, 2]));
  assert.throws(() => l6Trace('rod', [-1]));
  assert.throws(() => l6Trace('matrix', [1, 0, 2, 3]));
});
