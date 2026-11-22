import type { Frame } from './aos-models';

export type Mode = 'huffman' | 'multipop' | 'select';
export type Point = { id: number; x: number; y: number; label: string; active?: boolean };
export type Step = Frame & { points: Point[]; links: [number, number][]; code: string };
export const initial: Record<Mode, string> = {
  huffman: '57,13,12,24,9,5',
  multipop: '+2,+5,+9,-5,-5,+7,-1',
  select: '6',
};

export function trace(mode: Mode, input: string): Step[] {
  const frames: Step[] = [];
  function add(
    title: string, detail: string, code: string, points: Point[],
    values: Frame['values'], links: Step['links'] = [],
  ) {
    frames.push({ title, detail, code, points, values, links, active: frames.length });
  }
  const tokens = input.split(',').map((s) => s.trim());
  if (mode === 'huffman') {
    const weights = tokens.map(Number);
    if (weights.length < 2 || weights.length > 6 ||
      weights.some((n) => !Number.isInteger(n) || n < 1 || n > 999))
      throw Error('Inserisci da 2 a 6 frequenze intere fra 1 e 999.');
    type Tree = { id: number; weight: number; children: Tree[] };
    const queue: Tree[] = weights.map((weight, id) => ({ id, weight, children: [] }));
    let cost = 0;
    const sort = () => queue.sort((a, b) => a.weight - b.weight || a.id - b.id);
    const snapshots: { roots: Tree[]; title: string; detail: string; cost: number }[] = [];
    const record = (title: string, detail: string) =>
      snapshots.push({ roots: [...sort()], title, detail, cost });
    record('Foresta iniziale', 'Ogni simbolo occupa una foglia. I due pesi minimi saranno fusi per primi.');
    for (let id = weights.length; queue.length > 1; id++) {
      const [x, y] = queue.splice(0, 2), weight = x.weight + y.weight;
      cost += weight;
      queue.push({ id, weight, children: [x, y] });
      record(`Fondi ${x.weight} e ${y.weight}`, `Il nuovo albero pesa ${weight}. Si aggiungono ${weight} bit al costo, perché tutte le foglie unite scendono di un livello.`);
    }
    const columns = new Map<number, number>();
    let leaf = 0;
    function assign(tree: Tree) {
      if (tree.children.length) tree.children.forEach(assign);
      else columns.set(tree.id, leaf++);
    }
    assign(queue[0]);
    for (const snapshot of snapshots) {
      const points: Point[] = [], links: Step['links'] = [];
      const leafWidth = 132;
      function visit(tree: Tree, depth: number): number {
        const xs = tree.children.map((child) => {
          links.push([tree.id, child.id]);
          return visit(child, depth + 1);
        });
        const x = xs.length ? (xs[0] + xs[1]) / 2 : (columns.get(tree.id)! + 0.5) * leafWidth;
        points.push({
          id: tree.id, x, y: 45 + depth * 49,
          label: tree.children.length ? String(tree.weight) : String.fromCharCode(65 + tree.id) + ' · ' + tree.weight,
        });
        return x;
      }
      snapshot.roots.forEach((tree) => visit(tree, 0));
      const offset = (900 - weights.length * leafWidth) / 2;
      points.forEach((p) => { p.x += offset; });
      add(snapshot.title, snapshot.detail, 'x, y ← due minimi; inserisci (x.peso + y.peso)', points,
        { 'Alberi in coda': snapshot.roots.length, 'Somma delle fusioni': snapshot.cost }, links);
    }
  } else if (mode === 'multipop') {
    if (tokens.length > 8 || tokens.some((s) => !/^(?:\+\d{1,2}|-\d{1,2})$/.test(s)))
      throw Error('Usa fino a 8 comandi, per esempio +2,+5,-3. Il segno meno indica quante estrazioni richiedi.');
    const stack: { id: number; label: string }[] = [], removed: typeof stack = [];
    let pushes = 0, calls = 0;
    function record(title: string, detail: string) {
      add(title, detail, 'while k > 0 e la pila non è vuota: POP, k ← k − 1', [
        ...stack.map((p, i) => ({ ...p, x: 310, y: 318 - i * 34 })),
        ...removed.map((p, i) => ({ ...p, x: 510 + i * 42, y: 105 })),
      ], { Chiamate: calls, Inserimenti: pushes, Estrazioni: removed.length });
    }
    record('Pila vuota', 'I contatori partono da zero. La cima della pila è in alto.');
    tokens.forEach((token, id) => {
      calls++;
      if (token.startsWith('+')) {
        pushes++;
        stack.push({ id, label: token.slice(1) });
        record('PUSH ' + token.slice(1), 'L’elemento entra in cima alla pila.');
      } else {
        const k = Number(token.slice(1));
        const count = Math.min(k, stack.length);
        if (!count) record('MULTIPOP ' + k, 'Nessun elemento viene estratto: richiesta nulla o pila vuota.');
        for (let i = 0; i < count; i++) {
          removed.push(stack.pop()!);
          record('MULTIPOP ' + k, `Estrazione ${i + 1} di ${count} nella stessa chiamata.`);
        }
      }
    });
  } else {
    const rank = Number(input);
    if (!Number.isInteger(rank) || rank < 1 || rank > 7)
      throw Error('Scegli un rango intero tra 1 e 7.');
    const keys = [4, 2, 6, 1, 3, 5, 7], sizes = [7, 3, 3, 1, 1, 1, 1];
    const positions = [[450,60],[260,155],[640,155],[165,250],[355,250],[545,250],[735,250]];
    const links = keys.slice(1).map((_, i): [number, number] => [Math.floor(i / 2), i + 1]);
    let at = 0, i = rank;
    while (true) {
      const left = at * 2 + 1, r = 1 + (sizes[left] ?? 0);
      const points: Point[] = positions.map(([x, y], id) => ({ id, x, y, label: keys[id] + ' · ' + sizes[id] }));
      points.push({ id: 9, x: points[at].x, y: points[at].y - 35, label: String(i), active: true });
      const next = i === r ? 'Restituisci il nodo' : i < r ? 'Scendi a sinistra' : 'Scendi a destra';
      add(next, `Nodo ${keys[at]}, rango richiesto ${i}, rango locale ${r}.`, 'r ← size(sinistro) + 1; a destra cerca i − r',
        points, { 'Rango iniziale': rank, 'Rango residuo': i, 'Rango locale': r }, links);
      if (i === r) break;
      if (i > r) { i -= r; at = left + 1; }
      else at = left;
    }
  }
  return frames;
}
