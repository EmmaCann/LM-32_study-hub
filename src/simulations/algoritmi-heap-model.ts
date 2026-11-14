import type { Frame } from './aos-models';
export type HeapOperation = 'heapify' | 'build' | 'sort';
export type HeapFrame = Frame & {
  order: string[];
  size: number;
  phase: string;
  focus: number[];
  code: string;
  heapOk: boolean;
  sorted: boolean;
  settled: boolean;
};
export const heapExamples = {
  heapify: [16, 4, 10, 14, 7, 9, 3, 2, 8, 1],
  build: [4, 1, 3, 2, 16, 9, 10, 14, 8, 7],
  sort: [4, 1, 3, 2, 16, 9, 10, 14, 8, 7],
};
export function heapTrace(values: number[], operation: HeapOperation) {
  if (values.length < 2 || values.length > 10 || values.some((v) => !Number.isSafeInteger(v)))
    throw Error('Usa da 2 a 10 interi.');
  const items = values.map((value, i) => ({ id: 'h' + i, value })),
    a = [...items],
    frames: HeapFrame[] = [];
  let size = a.length,
    comparisons = 0,
    swaps = 0;
  const subtree = (i: number): boolean =>
    i >= size ||
    ((2 * i + 1 >= size || a[i].value >= a[2 * i + 1].value) &&
      (2 * i + 2 >= size || a[i].value >= a[2 * i + 2].value) &&
      subtree(2 * i + 1) &&
      subtree(2 * i + 2));
  function push(
    title: string,
    detail: string,
    phase: string,
    focus: number[],
    code: string,
    settled = false,
  ) {
    frames.push({
      title,
      detail,
      active: 0,
      order: a.map((v) => v.id),
      size,
      phase,
      focus,
      code,
      settled,
      heapOk: subtree(0),
      sorted: a.slice(size).every((v, i, b) => !i || b[i - 1].value <= v.value),
      values: {
        'heap-size': size,
        length: a.length,
        'Confronti tra chiavi': comparisons,
        Scambi: swaps,
      },
    });
  }
  function exchange(i: number, j: number) {
    [a[i], a[j]] = [a[j], a[i]];
    swaps++;
  }
  function fix(i: number, phase: string) {
    while (true) {
      const l = 2 * i + 1,
        r = l + 1;
      let largest = i;
      if (l < size) {
        comparisons++;
        if (a[l].value > a[largest].value) largest = l;
      }
      if (r < size) {
        comparisons++;
        if (a[r].value > a[largest].value) largest = r;
      }
      push(
        'Confronta il nodo ' + (i + 1) + ' con i figli',
        'largest è l’indice del massimo tra padre e figli esistenti. Si esclude il suffisso già ordinato.',
        phase,
        [i, ...[l, r].filter((x) => x < size)],
        'largest ← massimo fra i e i figli esistenti',
      );
      if (largest === i) {
        push(
          'Il ramo è sistemato',
          'Il nodo è almeno grande quanto i figli: questa chiamata termina.',
          phase,
          [i],
          'if largest = i: termina',
          true,
        );
        break;
      }
      const value = a[i].value;
      exchange(i, largest);
      push(
        'Il valore ' + value + ' scende nel ramo ' + (largest + 1),
        'Sale il figlio massimo; si continua soltanto nel ramo attraversato. Gli archi collegano posizioni fisse dell’albero.',
        phase,
        [i, largest],
        'scambia A[i], A[largest]; i ← largest',
      );
      i = largest;
    }
  }
  if (operation === 'heapify') {
    if (!subtree(3) || !subtree(4))
      throw Error('I sottoalberi figli del nodo 2 devono essere già max-heap.');
    push(
      'Ripara il nodo 2',
      'I sottoalberi figli sono già max-heap: può violare la proprietà soltanto il nodo di partenza.',
      'heapify',
      [1],
      'MAX-HEAPIFY(A, 2)',
    );
    fix(1, 'heapify');
  } else {
    push(
      'Avvia la costruzione del max-heap',
      'L’array può essere già un heap oppure richiedere scambi. Si parte dall’ultimo nodo interno, mantenendo fissa la forma dell’albero.',
      'build',
      [],
      'heap-size ← length[A]',
    );
    for (let i = Math.floor(size / 2) - 1; i >= 0; i--) {
      push(
        'Costruzione: nodo ' + (i + 1),
        'Si scorre da floor(n/2) fino a 1; le foglie sono già heap di un elemento.',
        'build',
        [i],
        'for i ← floor(n/2) downto 1: MAX-HEAPIFY(A, i)',
      );
      fix(i, 'build');
    }
    push(
      'Max-heap costruito',
      'Il massimo è in radice; l’array non è ancora ordinato.',
      'build',
      [],
      'BUILD-MAX-HEAP completato',
      true,
    );
    if (operation === 'sort') {
      for (let end = size - 1; end >= 1; end--) {
        const maximum = a[0].value;
        exchange(0, end);
        push(
          'Scambia il massimo ' + maximum + ' con l’ultimo elemento',
          'Il massimo raggiunge la posizione finale; il nuovo valore in radice può violare l’heap.',
          'sort',
          [0, end],
          'scambia A[1], A[i]',
        );
        size--;
        push(
          'Escludi ' + maximum + ' dall’heap',
          'La lunghezza dell’array non cambia. Il suffisso ordinato non partecipa più ai confronti.',
          'sort',
          [end],
          'heap-size ← heap-size − 1',
        );
        fix(0, 'sort');
      }
      push(
        'Array ordinato',
        'Resta un solo elemento attivo; tutti i valori sono in ordine non decrescente.',
        'sort',
        [],
        'fine',
        true,
      );
    }
  }
  return { items, frames, result: a.map((v) => v.value) };
}
export function heapPosition(index: number, size: number) {
  if (index >= size) return { x: 65 + 80 * index, y: 390 };
  const depth = Math.floor(Math.log2(index + 1)),
    first = 2 ** depth - 1;
  return { x: 40 + ((index - first + 0.5) * 800) / 2 ** depth, y: 60 + 85 * depth };
}
