import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  matrixTrace,
  lcsTrace,
  bstTrace,
  triangleTrace,
} from '../src/simulations/algoritmi-l07-model';

test('matrix DP agrees with exhaustive enumeration, including source erratum, singleton and ties', () => {
  const brute = (p: number[], i: number, j: number): number =>
    i === j
      ? 0
      : Math.min(
          ...Array.from({ length: j - i }, (_, z) => {
            const k = i + z;
            return brute(p, i, k) + brute(p, k + 1, j) + p[i - 1] * p[k] * p[j];
          }),
        );
  for (const p of [
    [30, 35, 15, 5, 10, 20, 25],
    [10, 30, 5, 60],
    [10, 10, 10, 10, 10],
    [7, 11],
    [1, 99, 1, 99, 1],
  ]) {
    const result = matrixTrace(p),
      n = p.length - 1;
    for (let i = 1; i <= n; i++)
      for (let j = i; j <= n; j++) assert.equal(result.m[i][j], brute(p, i, j));
    const realized = (i: number, j: number): number => {
      if (i === j) return 0;
      const k = result.s[i][j];
      assert(k >= i && k < j);
      return realized(i, k) + realized(k + 1, j) + p[i - 1] * p[k] * p[j];
    };
    assert.equal(realized(1, n), result.cost);
  }
  const a = matrixTrace([30, 35, 15, 5, 10, 20, 25]);
  assert.equal(a.cost, 15125);
  assert.equal(a.m[3][5], 2500);
  assert.equal(a.s[3][5], 3);
  assert.equal(matrixTrace([10, 10, 10, 10]).s[1][3], 1);
  for (const p of [[1], [1, 0], [1, NaN], [1, 2.5]]) assert.throws(() => matrixTrace(p));
});
const subsequence = (s: string, t: string) => {
  let i = 0;
  for (const a of t) if (a === s[i]) i++;
  return i === s.length;
};
test('LCS matches exhaustive subsequences and respects both tie choices, duplicates and empties', () => {
  for (const x of ['', 'A', 'AAA', 'ABA', 'ABCBDAB', 'BABBA'])
    for (const y of ['', 'B', 'AA', 'BAA', 'BDCABA']) {
      let best = 0;
      for (let mask = 0; mask < 2 ** x.length; mask++) {
        const z = [...x].filter((_, i) => mask & (1 << i)).join('');
        if (subsequence(z, y)) best = Math.max(best, z.length);
      }
      for (const choice of [true, false]) {
        const a = lcsTrace(x, y, choice);
        assert.equal(a.lcs.length, best);
        assert(subsequence(a.lcs, x) && subsequence(a.lcs, y));
        assert.equal(a.c[x.length][y.length], best);
        let i = 0,
          j = 0;
        for (const m of a.matches) {
          assert(m.i > i && m.j > j);
          assert.equal(x[m.i - 1], y[m.j - 1]);
          i = m.i;
          j = m.j;
        }
      }
    }
  assert.equal(lcsTrace('ABCBDAB', 'BDCABA').lcs, 'BCBA');
  assert.throws(() => lcsTrace('123456789', 'A'));
  assert.throws(() => lcsTrace('A!', 'A'));
});
test('BST keeps the exact source shapes and counts expected costs with external nodes', () => {
  const a = bstTrace([15, 10, 5, 10, 20, 5, 10, 5, 5, 5, 10]);
  assert.equal(a[0].values['Costo medio'], '2.8000');
  assert.equal(a[1].values['Costo medio'], '2.7500');
  for (const f of a) {
    assert.equal(f.items.length, 11);
    assert.equal(f.edges.length, 10);
    const depth = new Map<string, number>([['k2', 0]]);
    for (let t = 0; t < 5; t++)
      for (const [p, c] of f.edges) if (depth.has(p)) depth.set(c, depth.get(p)! + 1);
    assert.equal(depth.size, 11);
    let cost = 0;
    const w = [15, 10, 5, 10, 20, 5, 10, 5, 5, 5, 10];
    f.items.forEach((a) => {
      const i = a.id.startsWith('k') ? Number(a.id.slice(1)) - 1 : 5 + Number(a.id.slice(1));
      cost += (w[i] / 100) * (depth.get(a.id)! + 1);
    });
    assert.equal(cost.toFixed(4), f.values['Costo medio']);
  }
  assert.throws(() => bstTrace(Array(11).fill(0)));
});
test('every fan has four triangles, three diagonals, equal area and geometric perimeter identity', () => {
  const final = Array.from({ length: 6 }, (_, i) => triangleTrace(i).at(-1)!);
  const area = final[0].values['Area accumulata'];
  for (const f of final) {
    assert.equal(f.values['Area accumulata'], area);
    assert.equal(f.edges.length, 9);
    assert.equal(f.values['Triangoli costruiti'], 4);
  }
  assert(new Set(final.map((a) => a.values['Somma perimetri'])).size > 1);
  assert.throws(() => triangleTrace(6));
});
