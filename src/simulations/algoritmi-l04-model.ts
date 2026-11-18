export type L4Mode = 'radix' | 'bucket' | 'select';
export type L4Item = { id: string; value: number; origin: number };
export type L4Frame = {
  title: string;
  detail: string;
  code: string;
  order: string[];
  active: string[];
  pivot: string | null;
  groups: string[][];
  buckets: string[][];
  digit: number;
  rank: number;
  phase: string;
  answer: number | null;
};
export function medianPivot(a: L4Item[]): L4Item {
  const sorted = (a: L4Item[]) => [...a].sort((x, y) => x.value - y.value);
  if (a.length <= 5) return sorted(a)[Math.floor((a.length - 1) / 2)];
  const medians: L4Item[] = [];
  for (let i = 0; i < a.length; i += 5) {
    const g = sorted(a.slice(i, i + 5));
    medians.push(g[Math.floor((g.length - 1) / 2)]);
  }
  return deterministicSelect(medians, Math.floor((medians.length + 1) / 2));
}
function deterministicSelect(a: L4Item[], rank: number): L4Item {
  if (a.length <= 5) return [...a].sort((x, y) => x.value - y.value)[rank - 1];
  const p = medianPivot(a),
    left = a.filter((x) => x.value < p.value),
    right = a.filter((x) => x.value > p.value);
  return rank === left.length + 1
    ? p
    : rank <= left.length
      ? deterministicSelect(left, rank)
      : deterministicSelect(right, rank - left.length - 1);
}
export function lesson4Trace(
  values: number[],
  mode: L4Mode,
  rank = 1,
  strategy: 'random' | 'medians' = 'medians',
  seed = 1,
  m = 5,
) {
  if (
    values.length < 2 ||
    values.length > (mode === 'select' ? 25 : 10) ||
    values.some((x) => !Number.isFinite(x))
  )
    throw Error('Taglia ammessa: 2–10 elementi; selezione fino a 25.');
  if (
    mode === 'bucket'
      ? values.some((x) => x < 0 || x >= 1)
      : values.some((x) => !Number.isSafeInteger(x) || x < 0 || x > 999)
  )
    throw Error(mode === 'bucket' ? 'Bucket: valori in [0,1).' : 'Usa interi da 0 a 999.');
  if (
    mode === 'select' &&
    (new Set(values).size !== values.length ||
      !Number.isInteger(rank) ||
      rank < 1 ||
      rank > values.length)
  )
    throw Error('Selezione: chiavi distinte e rango fra 1 e n.');
  if (![3, 5, 10].includes(m)) throw Error('Numero di bucket non ammesso.');
  const items = values.map((value, origin) => ({ value, origin, id: 'e' + origin })),
    a = [...items],
    frames: L4Frame[] = [];
  let active = [...a],
    pivot: L4Item | null = null,
    groups: L4Item[][] = [],
    digit = 0,
    phase = 'start',
    answer: number | null = null,
    rng = seed >>> 0;
  const buckets: L4Item[][] = Array.from({ length: m }, () => []);
  const push = (title: string, detail: string, code: string) =>
    frames.push({
      title,
      detail,
      code,
      order: a.map((x) => x.id),
      active: active.map((x) => x.id),
      pivot: pivot?.id ?? null,
      groups: groups.map((g) => g.map((x) => x.id)),
      buckets: buckets.map((g) => g.map((x) => x.id)),
      digit,
      rank,
      phase,
      answer,
    });
  push(
    'Input iniziale',
    'Le etichette # distinguono gli elementi e restano con loro durante gli spostamenti.',
    '',
  );
  if (mode === 'radix') {
    for (digit = 1; digit <= 3; digit++) {
      phase = 'digit';
      push(
        'Passata sulla cifra ' + digit,
        'Si ordina per la cifra corrente conservando l’ordine relativo sulle cifre già elaborate.',
        'ordina stabilmente per cifra t',
      );
      const pow = 10 ** (digit - 1);
      a.sort((x, y) => (Math.floor(x.value / pow) % 10) - (Math.floor(y.value / pow) % 10));
      phase = 'pass';
      push(
        'Passata stabile completata',
        'Gli oggetti interi cambiano posizione. Le etichette rendono osservabile l’ordine delle chiavi uguali.',
        'fine della passata ' + digit,
      );
    }
    phase = 'done';
    push(
      'Tutte le tre cifre elaborate',
      'I valori sono ordinati numericamente; il modello usa esattamente tre cifre con zeri iniziali.',
      'fine',
    );
  } else if (mode === 'bucket') {
    phase = 'distribute';
    for (const item of a) {
      const b = Math.floor(m * item.value);
      buckets[b].push(item);
      push(
        'Distribuisci ' + item.value + ' in B[' + b + ']',
        'Indice floor(m·x): tutti gli elementi del bucket appartengono allo stesso sottointervallo.',
        'inserisci in B[floor(m·x)]',
      );
    }
    for (let b = 0; b < m; b++) {
      phase = 'local';
      push(
        'Ordina la lista B[' + b + ']',
        'Ogni lista è ordinata separatamente; non si ordina tutto l’input a ogni iterazione.',
        'Insertion Sort su B[' + b + ']',
      );
      for (let j = 1; j < buckets[b].length; j++) {
        let k = j;
        while (k > 0 && buckets[b][k].value < buckets[b][k - 1].value) {
          [buckets[b][k], buckets[b][k - 1]] = [buckets[b][k - 1], buckets[b][k]];
          k--;
          push(
            'Scambio dentro B[' + b + ']',
            'Insertion Sort sposta l’elemento nella lista locale.',
            'scambia due elementi adiacenti',
          );
        }
      }
    }
    phase = 'done';
    a.splice(0, a.length, ...buckets.flat());
    push(
      'Concatena i bucket in ordine',
      'Il risultato segue l’indice del bucket e l’ordine all’interno di ogni lista. Non è una garanzia di tempo lineare per ogni input.',
      'concatena B[0], …, B[m−1]',
    );
  } else {
    while (active.length > 1) {
      if (strategy === 'medians') {
        groups = [];
        for (let j = 0; j < active.length; j += 5)
          groups.push([...active.slice(j, j + 5)].sort((x, y) => x.value - y.value));
        phase = 'groups';
        push(
          'Ordina i gruppi di al più cinque',
          'Ogni colonna è un gruppo. L’ordinamento del singolo gruppo ha costo limitato perché la taglia non cresce.',
          'Insertion Sort per gruppo',
        );
        if (active.length <= 5) {
          const ordered = groups[0];
          const slots = a
            .map((x, i) => (active.some((y) => y.id === x.id) ? i : -1))
            .filter((i) => i >= 0);
          slots.forEach((s, i) => (a[s] = ordered[i]));
          pivot = ordered[rank - 1];
          answer = pivot.value;
          phase = 'done';
          push(
            'Caso base: ' + answer,
            'Il gruppo ha al più cinque elementi: dopo averlo ordinato si restituisce direttamente il rango locale.',
            'return gruppo[i]',
          );
          break;
        }
        pivot = medianPivot(active);
        phase = 'pivot';
        push(
          'Scegli la mediana delle mediane',
          'Le celle centrali di ogni gruppo sono candidate; il pivot si trova selezionando ricorsivamente la mediana di quei valori, non ordinando tutto l’input.',
          'x ← SELECT(vettore delle mediane, rango centrale)',
        );
      } else {
        rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0;
        pivot = active[Math.floor((rng / 4294967296) * active.length)];
        phase = 'pivot';
        push(
          'Scegli un pivot pseudocasuale',
          'Il seme rende riproducibile il modello. Non è una prova del costo atteso.',
          'pivot ← scelta nel sottoarray attivo',
        );
      }
      const left = active.filter((x) => x.value < pivot!.value),
        right = active.filter((x) => x.value > pivot!.value),
        k = left.length + 1;
      const slots = a
          .map((x, i) => (active.some((y) => y.id === x.id) ? i : -1))
          .filter((i) => i >= 0),
        part = [...left, pivot, ...right];
      slots.forEach((s, i) => (a[s] = part[i]));
      phase = 'partition';
      push(
        'Il pivot ha rango locale ' + k,
        `Rango richiesto ${rank}. La partizione raggruppa i valori, senza ordinare ogni lato.`,
        'k ← numero di elementi a sinistra + 1',
      );
      if (rank === k) {
        answer = pivot.value;
        phase = 'done';
        push(
          'Trovato: ' + answer,
          'Il valore del pivot è la statistica richiesta. Gli altri elementi non devono essere tutti ordinati.',
          'return pivot',
        );
        break;
      }
      if (rank < k) {
        active = left;
      } else {
        active = right;
        rank -= k;
      }
      phase = 'keep';
      push(
        'Conserva un solo lato',
        `Nuovo rango locale ${rank}; ${active.length} elementi ancora attivi.`,
        'se vai a destra: i ← i−k',
      );
    }
    if (answer === null) {
      answer = active[0].value;
      pivot = active[0];
      phase = 'done';
      push(
        'Un solo elemento: ' + answer,
        'Il rango locale è 1: il risultato è l’unico valore rimasto.',
        'return unico elemento',
      );
    }
  }
  return { items, frames };
}
export function l4Position(id: string, f: L4Frame, mode: L4Mode) {
  if (mode === 'bucket' && f.phase !== 'done') {
    const b = f.buckets.findIndex((a) => a.includes(id));
      if (b >= 0) return { x: 225 + 60 * f.buckets[b].indexOf(id), y: 163 + b * 42 };
  }
  if (
    mode === 'select' &&
    (f.phase === 'groups' || f.phase === 'pivot') &&
    f.groups.some((g) => g.includes(id))
  ) {
    const g = f.groups.findIndex((g) => g.includes(id));
    return { x: 95 + 165 * g, y: 150 + f.groups[g].indexOf(id) * 60 };
  }
  return {
    x: 45 + Math.min(80, 800 / f.order.length) * f.order.indexOf(id),
    y: mode === 'bucket' && f.phase === 'done' ? 120 : mode === 'select' ? 100 : 170,
  };
}
