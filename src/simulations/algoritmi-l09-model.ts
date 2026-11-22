import type { Frame } from './aos-models';

export type Mode = 'interval' | 'btree';
export type Node = { id: number; values: number[]; x: number; y: number; children: number[]; red?: boolean };
type SearchStep = Frame & { code: string; focus: number; compared?: number; result?: boolean };
type Search = { nodes: Node[]; frames: SearchStep[]; query: number[] };

const intervals: Node[] = [
  { id: 0, values: [16,21], x: 440, y: 65, children: [1,2] },
  { id: 1, values: [8,9], x: 240, y: 129, children: [3,4], red: true },
  { id: 2, values: [25,30], x: 670, y: 129, children: [5,6], red: true },
  { id: 3, values: [5,8], x: 130, y: 193, children: [7,8] },
  { id: 4, values: [15,23], x: 335, y: 193, children: [] },
  { id: 5, values: [17,19], x: 560, y: 193, children: [-1,9] },
  { id: 6, values: [26,26], x: 785, y: 193, children: [] },
  { id: 7, values: [0,3], x: 69, y: 257, children: [], red: true },
  { id: 8, values: [6,10], x: 199, y: 257, children: [], red: true },
  { id: 9, values: [19,20], x: 623, y: 257, children: [], red: true },
];
const btree: Node[] = [
  { id: 0, values: [8], x: 450, y: 65, children: [1,2] },
  { id: 1, values: [4], x: 211, y: 151, children: [3,4] },
  { id: 2, values: [10,14], x: 628, y: 151, children: [5,6,7] },
  { id: 3, values: [1,2], x: 101, y: 237, children: [] },
  { id: 4, values: [5,6], x: 298, y: 237, children: [] },
  { id: 5, values: [9], x: 444, y: 237, children: [] },
  { id: 6, values: [11,13], x: 612, y: 237, children: [] },
  { id: 7, values: [16,18], x: 794, y: 237, children: [] },
];

export function maxHigh(id: number): number {
  const node = intervals[id];
  return node ? Math.max(node.values[1], ...node.children.map(maxHigh)) : -Infinity;
}

export function searchTrace(mode: Mode, input: string): Search {
  const entries = input.split(',').map((value) => value.trim());
  const query = entries.map(Number);
  if (entries.some((v) => !v || !Number.isFinite(Number(v))) ||
      (mode === 'interval' ? query.length !== 2 || query[0] > query[1] : query.length !== 1))
    throw Error(mode === 'interval' ? 'Inserisci due estremi ordinati, per esempio 22,25.' : 'Inserisci una chiave numerica.');
  const nodes = mode === 'interval' ? intervals : btree;
  const frames: SearchStep[] = [];
  function add(step: Omit<SearchStep, 'active'>) {
    frames.push({ ...step, active: frames.length });
  }
  let focus = 0, reads = 0;
  if (mode === 'interval') {
    const [a,b] = query;
    while (true) {
      const node = intervals[focus];
      const [low,high] = node.values, left = node.children[0] ?? -1;
      const maximum = maxHigh(left), goLeft = maximum >= a;
      const result = b >= low && high >= a;
      const values = { Richiesta: '[' + query.join(', ') + ']', 'Max a sinistra': maximum === -Infinity ? '−∞' : maximum };
      add({ title: result ? 'Intersezione trovata' : goLeft ? 'Scendi a sinistra' : 'Scendi a destra',
        detail: result ? 'Intersezione [' + Math.max(a,low) + ', ' + Math.min(b,high) + '].'
          : 'Il nodo corrente non interseca la richiesta. ' + (goLeft ? 'Il ramo sinistro può contenere una risposta.' : 'Tutti gli intervalli a sinistra finiscono prima della richiesta.'),
        code: result ? 'b ≥ low e high ≥ a → restituisci il nodo' : 'left.max ≥ a → sinistra; altrimenti destra',
        focus, values, ...(result ? { result } : {}) });
      if (result) break;
      const next = goLeft ? left : node.children[1] ?? -1;
      if (next < 0) {
        add({ title: 'Arrivo a NIL', detail: 'Il ramo scelto è terminato. Nessuna intersezione.', code: 'restituisci NIL',
          focus, values, result: false });
        break;
      }
      focus = next;
    }
  } else {
    const [k] = query;
    add({ title: 'Parti dalla radice', detail: 'La radice è già in RAM.', code: 'SEARCH(radice, k)', focus, values: { Chiave: k, Letture: reads } });
    while (true) {
      const node = btree[focus];
      let lo = 0, hi = node.values.length;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2), lower = k <= node.values[mid];
        add({ title: 'Confronta con ' + node.values[mid],
          detail: lower ? 'La prima posizione ammissibile è qui o a sinistra.' : 'La prima posizione ammissibile è a destra.',
          code: lower ? 'j ← m' : 'i ← m + 1', focus, compared: mid,
          values: { Chiave: k, Letture: reads, i: lo + 1, j: hi + 1, m: mid + 1 } });
        if (lower) hi = mid;
        else lo = mid + 1;
      }
      const found = node.values[lo] === k;
      if (found || !node.children.length) {
        add({ title: found ? 'Chiave trovata' : 'Chiave assente',
          detail: found ? 'Restituisci il nodo e la posizione ' + (lo + 1) + '.' : 'La foglia candidata non contiene la chiave.',
          code: found ? 'restituisci (x, i)' : 'restituisci NIL', focus,
          compared: found ? lo : undefined, values: { Chiave: k, Letture: reads, i: lo + 1 }, result: found });
        break;
      }
      reads++;
      focus = node.children[lo];
      add({ title: 'Leggi il blocco del figlio ' + (lo + 1),
        detail: 'Il separatore indica il figlio candidato. Carica il suo blocco in RAM prima di confrontare altre chiavi.',
        code: 'DISK-READ(x.child[i])', focus, values: { Chiave: k, Letture: reads, i: lo + 1 } });
    }
  }
  return { nodes, frames, query };
}
