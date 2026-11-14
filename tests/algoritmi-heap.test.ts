import assert from 'node:assert/strict';
import { test } from 'node:test';
import { heapTrace, heapExamples } from '../src/simulations/algoritmi-heap-model';
test('Heap sort preserves all identities and the ordered suffix across varied inputs', () => {
  for (let n = 2; n <= 10; n++)
    for (const kind of ['ascending', 'descending', 'duplicates']) {
      const a = Array.from({ length: n }, (_, i) =>
          kind === 'duplicates' ? i % 3 : kind === 'descending' ? n - i : i,
        ),
        m = heapTrace(a, 'sort');
      assert.deepEqual(
        m.result,
        [...a].sort((a, b) => a - b),
      );
      assert(m.frames.every((f) => f.sorted && new Set(f.order).size === a.length));
      assert(m.frames.filter((f) => f.phase === 'sort' && f.settled).every((f) => f.heapOk));
    }
});
test('The lecture examples and Heapify preconditions are respected', () => {
  for (const op of ['build', 'heapify'] as const)
    assert.deepEqual(heapTrace(heapExamples[op], op).result, [16, 14, 10, 8, 7, 9, 3, 2, 4, 1]);
  assert.throws(() => heapTrace([1, 2, 3, 0, 0, 0, 0, 4], 'heapify'), /sottoalberi/);
});
