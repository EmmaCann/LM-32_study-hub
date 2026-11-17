import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lesson4Trace, medianPivot } from '../src/simulations/algoritmi-l04-model';
test('Radix is sorted and preserves ties through every digit pass', () => {
  const a = [329, 457, 657, 839, 436, 720, 355, 329],
    m = lesson4Trace(a, 'radix');
  const ids = (f: (typeof m.frames)[number]) =>
    f.order.map((id) => m.items.find((x) => x.id === id)!);
  for (const f of m.frames.filter((f) => f.phase === 'pass')) {
    const v = ids(f),
      mod = 10 ** f.digit;
    assert(v.every((x, i) => !i || v[i - 1].value % mod <= x.value % mod));
    assert(v.filter((x) => x.value === 329)[0].origin < v.filter((x) => x.value === 329)[1].origin);
  }
  assert.deepEqual(
    ids(m.frames.at(-1)!).map((x) => x.value),
    [...a].sort((a, b) => a - b),
  );
});
test('Bucket handles empty lists, boundary values and concentrated inputs', () => {
  for (const a of [
    [0, 0.999, 0.1, 0.11, 0.5],
    [0.19, 0.18, 0.17, 0.16, 0.15],
  ])
    for (const count of [3, 5, 10]) {
      const m = lesson4Trace(a, 'bucket', 1, 'medians', 1, count),
        f = m.frames.at(-1)!;
      assert.deepEqual(
        f.order.map((id) => m.items.find((x) => x.id === id)!.value),
        [...a].sort((a, b) => a - b),
      );
      assert.equal(new Set(f.buckets.flat()).size, a.length);
    }
  assert.throws(() => lesson4Trace([0, 1], 'bucket'));
});
test('Selection returns all ranks with either pivot strategy and keeps a valid local rank', () => {
  for (const n of [2, 5, 6, 11, 15, 25]) {
    const a = Array.from({ length: n }, (_, i) => (i * 7) % 31);
    for (const strategy of ['random', 'medians'] as const)
      for (let rank = 1; rank <= n; rank++) {
        const m = lesson4Trace(a, 'select', rank, strategy, 3),
          f = m.frames.at(-1)!;
        assert.equal(f.answer, [...a].sort((a, b) => a - b)[rank - 1]);
        assert(m.frames.every((f) => f.rank >= 1 && f.rank <= f.active.length));
        assert(m.frames.every((f) => new Set(f.order).size === n));
      }
    const items = a.map((value, i) => ({ value, id: '' + i, origin: i }));
    assert(items.includes(medianPivot(items)));
  }
  assert.throws(() => lesson4Trace([1, 1], 'select'));
});
