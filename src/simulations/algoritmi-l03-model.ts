export type Mode = 'partition' | 'counting' | 'shuffle';
export type Item = { id: string; value: number };
export type State = {
  title: string;
  detail: string;
  code: string;
  order: string[];
  output: (string | null)[];
  counts: number[];
  i: number;
  j: number;
  q: number;
  phase: string;
};
export function lesson3Trace(values: number[], mode: Mode, seed = 1) {
  if (
    values.length < 2 ||
    values.length > 10 ||
    values.some((v) => !Number.isSafeInteger(v) || v < 0 || v > 9)
  )
    throw Error('Inserisci da 2 a 10 interi tra 0 e 9.');
  const items = values.map((value, i) => ({ id: 'v' + i, value })),
    a = [...items],
    frames: State[] = [];
  const output: (string | null)[] = Array(values.length).fill(null),
    counts = Array(10).fill(0) as number[];
  let i = -1,
    j = 0,
    q = -1,
    phase = 'start',
    random = seed >>> 0;
  const push = (title: string, detail: string, code: string) =>
    frames.push({
      title,
      detail,
      code,
      order: a.map((v) => v.id),
      output: [...output],
      counts: [...counts],
      i,
      j,
      q,
      phase,
    });
  push('Stato iniziale', 'Gli ID seguono gli elementi, anche quando due valori sono uguali.', '');
  if (mode === 'partition') {
    const x = a.at(-1)!.value;
    for (j = 0; j < a.length - 1; j++) {
      phase = 'compare';
      push(
        'Confronta la posizione ' + (j + 1),
        `Pivot ${x}; i=${i + 1}, j=${j + 1}. A sinistra di i sono ammessi anche valori uguali al pivot.`,
        'if A[j] ≤ x',
      );
      if (a[j].value <= x) {
        i++;
        [a[i], a[j]] = [a[j], a[i]];
        phase = 'swap';
        push(
          'Amplia la regione ≤ pivot',
          'Incrementa i e scambia A[i] con A[j]. Il suffisso non analizzato resta da visitare.',
          'i ← i+1; scambia A[i], A[j]',
        );
      }
    }
    [a[i + 1], a[a.length - 1]] = [a[a.length - 1], a[i + 1]];
    q = i + 1;
    phase = 'done';
    push(
      'Pivot nella posizione ' + (q + 1),
      'Solo il pivot è definitivo. Le due parti non sono ancora necessariamente ordinate.',
      'scambia A[i+1], A[r]; return i+1',
    );
  } else if (mode === 'counting') {
    phase = 'count';
    for (j = 0; j < a.length; j++) {
      counts[a[j].value]++;
      push(
        'Conta il valore ' + a[j].value,
        'C[v] registra le occorrenze del valore v.',
        'C[A[j]] ← C[A[j]]+1',
      );
    }
    phase = 'prefix';
    for (i = 1; i < counts.length; i++) {
      counts[i] += counts[i - 1];
      push(
        'Somma prefissa fino a ' + i,
        'C[v] conta ora gli elementi minori o uguali a v.',
        'C[i] ← C[i]+C[i−1]',
      );
    }
    phase = 'place';
    for (j = a.length - 1; j >= 0; j--) {
      const v = a[j].value,
        pos = counts[v] - 1;
      output[pos] = a[j].id;
      counts[v]--;
      push(
        'Colloca ' + v + ' in B[' + (pos + 1) + ']',
        'La posizione è quella indicata da C prima del decremento. A resta intatto; B riceve gli elementi.',
        'B[C[A[j]]] ← A[j]; C[A[j]] ← C[A[j]]−1',
      );
    }
    phase = 'done';
    push(
      'Output completo',
      'La traccia mostra il conteggio e le collocazioni. Il tema della stabilità è ripreso nella lezione successiva.',
      'fine',
    );
  } else {
    phase = 'shuffle';
    for (i = 0; i < a.length; i++) {
      phase = 'choose';
      random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
      j = i + Math.floor((random / 4294967296) * (a.length - i));
      push(
        'Scegli nel suffisso disponibile',
        `Indice i=${i + 1}; indice scelto j=${j + 1}. Il prefisso precedente è fissato.`,
        'j ← RANDOM(i,n)',
      );
      [a[i], a[j]] = [a[j], a[i]];
      phase = 'fixed';
      push(
        'Fissa la posizione ' + (i + 1),
        'Scambia i due elementi. Il generatore del laboratorio usa un seme riproducibile: è un modello, non una prova di casualità uniforme.',
        'scambia A[i], A[j]',
      );
    }
    phase = 'done';
    push(
      'Permutazione completata',
      'Cambia il seme per un altro esperimento. Una prova finita non dimostra l’uniformità.',
      'fine',
    );
  }
  return { items, frames };
}
export function itemPosition(id: string, f: State, mode: Mode) {
  const target = f.output.indexOf(id);
  return {
    x: 65 + 80 * (mode === 'counting' && target >= 0 ? target : f.order.indexOf(id)),
    y: mode === 'counting' && target >= 0 ? 360 : 140,
  };
}
