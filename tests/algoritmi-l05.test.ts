import test from 'node:test';
import assert from 'node:assert/strict';
import { l5Trace, l5Defaults, l5Hash } from '../src/simulations/algoritmi-l05-model';
test('LIFO/FIFO, wraparound e rifiuto senza sovrascrittura', () => {
  for (const container of ['stack', 'queue'] as const)
    for (const capacity of [4, 6, 8]) {
      const { frames } = l5Trace([1, 2, 3, 4], 'containers', {
        ...l5Defaults,
        container,
        capacity,
      });
      const cap = capacity - (container === 'queue' ? 1 : 0);
      frames.forEach((f, i) => {
        assert.ok(f.size >= 0 && f.size <= cap);
        assert.equal(f.order.length, f.size);
        assert.equal(new Set(f.order).size, f.size);
        assert.equal(f.nodes.filter((n) => n.state === 'stored').length, f.size);
        if (container === 'queue') {
          f.order.forEach((id, j) => {
            const node = f.nodes.find((n) => n.id === id)!;
            const slot = ((f.head - 1 + j) % capacity) + 1;
            const angle = ((slot - 1) * Math.PI * 2) / capacity - Math.PI / 2;
            assert.ok(Math.abs(node.x - (440 + 115 * Math.cos(angle))) < 1e-9);
            assert.ok(Math.abs(node.y - (255 + 115 * Math.sin(angle))) < 1e-9);
          });
        }
        if (f.event === 'overflow' || f.event === 'underflow')
          assert.deepEqual(f.nodes, frames[i - 1].nodes);
      });
      const first = frames.find((f) => f.event === 'remove')!;
      assert.equal(first.result, String(container === 'queue' ? 1 : [1, 2, 3, 4][(cap - 1) % 4]));
      assert.equal(frames.at(-1)!.size, 0);
      assert.equal(frames.at(-1)!.event, 'underflow');
      if (container === 'queue') assert.ok(frames.some((f) => f.tail < f.head));
    }
});
test('Liste: link reciproci e bordi per vuota, unico nodo, testa, coda, assente', () => {
  for (const sentinel of [true, false])
    for (const prepend of [true, false])
      for (const values of [[], [4], [9, 16, 4, 1]])
        for (const query of [0, 4, 9, 1, 99]) {
          const { frames } = l5Trace(values, 'list', { ...l5Defaults, sentinel, prepend, query });
          for (const f of frames.filter((f) => f.valid)) {
            assert.equal(f.size, f.order.length);
            for (const e of f.edges) {
              assert.ok(f.nodes.some((n) => n.id === e.from));
              assert.ok(f.nodes.some((n) => n.id === e.to));
              assert.ok(
                f.edges.some((r) => r.from === e.to && r.to === e.from && r.kind !== e.kind),
              );
            }
            assert.equal(
              f.nodes.filter((n) => n.state === 'stored' && n.id !== 'sentinel').length,
              f.size,
            );
          }
          const initialCount = values.length + 1;
          const found = frames.some((f) => f.event === 'found');
          assert.equal(frames.at(-1)!.size, initialCount - (found ? 1 : 0));
          assert.ok(!frames.some((f) => f.nodes.find((n) => n.id === 'sentinel')?.state === 'out'));
        }
});
test('Hash: destinazioni, caso concentrato, ricerca per chiave e cancellazione locale', () => {
  for (const hash of ['division', 'multiplication', 'universal', 'constant'] as const)
    for (const m of [3, 5, 8])
      for (const query of [12, 7, 22, 99]) {
        const opts = { ...l5Defaults, hash, m, query };
        const values = [12, 7, 3, 22, 8];
        const { frames } = l5Trace(values, 'hash', opts);
        for (const k of values) assert.ok(l5Hash(k, opts) >= 0 && l5Hash(k, opts) < m);
        const complete = frames.filter((f) => f.event === 'insert').at(-1)!;
        for (const n of complete.nodes) assert.equal(n.y, 152 + l5Hash(Number(n.key), opts) * 48);
        const outcome = frames.find((f) => f.event === 'found' || f.event === 'absent')!;
        const chain = values.filter((k) => l5Hash(k, opts) === l5Hash(query, opts)).reverse();
        const index = chain.indexOf(query);
        assert.equal(outcome.compared, index < 0 ? chain.length : index + 1);
        assert.equal(outcome.result, values.includes(query) ? String(query) : 'NIL');
      }
  assert.throws(() => l5Trace([1, 1], 'hash', l5Defaults));
  assert.throws(() => l5Trace([100, 2], 'hash', l5Defaults));
});
