import test from 'node:test';
import assert from 'node:assert/strict';
import { boundRatio, recurrenceTree } from '../src/simulations/algoritmi-analysis-model';
test('limiti: il rapporto è decrescente, ma c2=10 richiede una soglia oltre 20', () => {
  assert.equal(boundRatio(1), 604);
  assert.ok(boundRatio(20) > 10);
  assert.ok(boundRatio(21) < 10);
  for (let n = 1; n < 300; n++) assert.ok(boundRatio(n + 1) < boundRatio(n));
  for (const n of [0, -1, Infinity, NaN]) assert.throws(() => boundRatio(n));
});
test('albero: identità, genitori, foglie e costo completo per le configurazioni ammesse', () => {
  for (const a of [1, 2, 3])
    for (const b of [2, 3, 4])
      for (const power of [1, 2])
        for (const levels of [1, 2, 3]) {
          const tree = recurrenceTree({ a, b, power, levels });
          assert.equal(new Set(tree.nodes.map((n) => n.id)).size, tree.nodes.length);
          for (const node of tree.nodes)
            if (node.parent) {
              const parent = tree.nodes.find((p) => p.id === node.parent)!;
              assert.equal(parent.depth + 1, node.depth);
              assert.equal(parent.size / b, node.size);
            }
          assert.ok(
            tree.nodes.filter((n) => n.depth === levels).every((n) => n.size === 1 && n.cost === 1),
          );
          const direct = (n: number): number => (n === 1 ? 1 : a * direct(n / b) + n ** power);
          assert.equal(tree.total, direct(tree.n));
        }
  assert.deepEqual(recurrenceTree({ a: 3, b: 4, power: 2, levels: 3 }).costs, [4096, 768, 144, 27]);
  assert.throws(() => recurrenceTree({ a: 9, b: 2, power: 1, levels: 1 }));
});
