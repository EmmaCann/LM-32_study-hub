export type L6Mode = 'rb' | 'rod' | 'matrix';
export type L6Node = { id: string; label: string; x: number; y: number; color: string };
export type L6Frame = {
  title: string;
  detail: string;
  nodes: L6Node[];
  edges: [string, string][];
  values: Record<string, string | number>;
  valid: boolean;
  code: string;
};
export function l6Trace(mode: L6Mode, input: number[], choice = 0): L6Frame[] {
  if (input.some((x) => !Number.isInteger(x))) throw Error('Usa soltanto interi.');
  const frames: L6Frame[] = [];
  if (mode === 'rb') {
    if (
      input.length < 1 ||
      input.length > 9 ||
      new Set(input).size !== input.length ||
      input.some((x) => x < 0 || x > 99)
    )
      throw Error('Da 1 a 9 chiavi distinte tra 0 e 99.');
    type N = {
      key: number;
      left: number | null;
      right: number | null;
      p: number | null;
      color: 'R' | 'N';
    };
    const ns = new Map<number, N>();
    let root: number | null = null;
    const get = (k: number) => ns.get(k)!;
    const color = (k: number | null) => (k === null ? 'N' : get(k).color);
    const sorted = [...input].sort((a, b) => a - b);
    function record(title: string, detail: string, code: string) {
      const depth = new Map<number, number>();
      const edges: [string, string][] = [];
      function visit(k: number | null, d: number) {
        if (k === null) return;
        depth.set(k, d);
        for (const c of [get(k).left, get(k).right])
          if (c !== null) {
            edges.push([String(k), String(c)]);
            visit(c, d + 1);
          }
      }
      visit(root, 0);
      function bh(k: number | null): number {
        if (k === null) return 1;
        const n = get(k),
          a = bh(n.left),
          b = bh(n.right);
        if (
          a < 0 ||
          b < 0 ||
          a !== b ||
          (n.color === 'R' && (color(n.left) === 'R' || color(n.right) === 'R'))
        )
          return -1;
        return a + (n.color === 'N' ? 1 : 0);
      }
      const valid = root === null || (color(root) === 'N' && bh(root) > 0);
      frames.push({
        title,
        detail,
        code,
        valid,
        edges,
        nodes: input.map((k, i) => ({
          id: String(k),
          label: String(k) + (depth.has(k) ? ' ' + color(k) : ''),
          x: depth.has(k) ? 80 + sorted.indexOf(k) * 85 : 90 + i * 85,
          y: depth.has(k) ? 250 + depth.get(k)! * 95 : 80,
          color: depth.has(k) ? color(k) : 'attesa',
        })),
        values: {
          Radice: root ?? 'vuoto',
          Inseriti: ns.size,
          Proprieta: valid ? 'tutte rispettate' : 'riparazione in corso',
        },
      });
    }
    function rotate(x: number, left: boolean) {
      const a = get(x),
        y = (left ? a.right : a.left)!;
      const b = get(y);
      const beta = left ? b.left : b.right;
      if (left) a.right = beta;
      else a.left = beta;
      if (beta !== null) get(beta).p = x;
      b.p = a.p;
      if (a.p === null) root = y;
      else if (get(a.p).left === x) get(a.p).left = y;
      else get(a.p).right = y;
      if (left) b.left = x;
      else b.right = x;
      a.p = y;
    }
    record(
      'Albero vuoto',
      'Le chiavi nella fascia superiore attendono di essere inserite. Le foglie NIL nere sono implicite.',
      'z = prossimo nodo',
    );
    for (const key of input) {
      let p: number | null = null,
        x = root;
      while (x !== null) {
        p = x;
        x = key < get(x).key ? get(x).left : get(x).right;
      }
      ns.set(key, { key, left: null, right: null, p, color: 'R' });
      if (p === null) root = key;
      else if (key < get(p).key) get(p).left = key;
      else get(p).right = key;
      let z = key;
      record(
        'Inserisci ' + key + ' rosso',
        'Inserimento BST. Il rosso conserva i conteggi neri; verifica padre e radice.',
        'z.color = RED; FIXUP(z)',
      );
      while (color(get(z).p) === 'R') {
        const pa = get(z).p!,
          g = get(pa).p!,
          left = get(g).left === pa,
          u = left ? get(g).right : get(g).left;
        if (color(u) === 'R') {
          get(pa).color = 'N';
          get(u!).color = 'N';
          get(g).color = 'R';
          z = g;
          record(
            'Caso 1: zio rosso',
            'Padre e zio neri, nonno rosso. z sale al nonno; può ripetere il ciclo.',
            'p.color = u.color = BLACK; g.color = RED; z = g',
          );
        } else {
          if ((left ? get(pa).right : get(pa).left) === z) {
            z = pa;
            rotate(z, left);
            record(
              'Caso 2: triangolo',
              'Rotazione sul padre: il triangolo diventa una linea. I colori non cambiano.',
              'z = p; ROTATE(T,z)',
            );
          }
          const pp = get(z).p!,
            gg = get(pp).p!;
          get(pp).color = 'N';
          get(gg).color = 'R';
          rotate(gg, !left);
          record(
            'Caso 3: linea',
            'Padre nero, nonno rosso e rotazione sul nonno. Il fixup termina.',
            'p.color = BLACK; g.color = RED; ROTATE(T,g)',
          );
        }
      }
      get(root!).color = 'N';
      record(
        'Inserimento completato',
        'La radice è nera; tutte le proprietà e l’ordine BST sono rispettati.',
        'T.root.color = BLACK',
      );
    }
    return frames;
  }
  if (mode === 'rod') {
    if (input.length < 1 || input.length > 10 || input.some((x) => x < 0 || x > 99))
      throw Error('Da 1 a 10 prezzi interi tra 0 e 99.');
    const n = input.length,
      r = Array(n + 1).fill(0) as number[],
      s = Array(n + 1).fill(0) as number[];
    const record = (
      j: number,
      i: number,
      q: number,
      title: string,
      detail: string,
      split = false,
    ) =>
      frames.push({
        title,
        detail,
        valid: true,
        code: split ? 'j = j - s[j]' : 'q = max(q, p[i] + r[j-i]); r[j] = q',
        edges: [],
        values: {
          Lunghezza: j,
          'Primo pezzo': i,
          Candidato: q,
          'r[0..n]': r.join(', '),
          's[1..n]': s.slice(1).join(', '),
        },
        nodes: Array.from({ length: n }, (_, k) => ({
          id: String(k),
          label: String(k + 1),
          x: 65 + k * 75 + (split && k >= i ? 35 : 0),
          y: k >= j ? 75 : split ? (k < i ? 210 : 340) : 210,
          color: k < i ? 'R' : 'N',
        })),
      });
    record(
      0,
      0,
      0,
      'r[0] = 0',
      'Le unità dell’asta sono persistenti. La tabella si costruisce per lunghezze crescenti.',
    );
    for (let j = 1; j <= n; j++) {
      let q = -Infinity;
      for (let i = 1; i <= j; i++) {
        const v = input[i - 1] + r[j - i];
        if (v > q) {
          q = v;
          s[j] = i;
        }
        r[j] = q;
        record(
          j,
          i,
          v,
          'Prova il primo pezzo ' + i,
          'Lunghezza ' +
            j +
            ': prezzo ' +
            input[i - 1] +
            ' + ricavo ottimo del resto ' +
            r[j - i] +
            '. Migliore corrente ' +
            q +
            '. Le celle future della tabella sono ancora provvisorie.',
        );
      }
      record(
        j,
        s[j],
        q,
        'Conferma r[' + j + '] = ' + q,
        'La lunghezza ' +
          j +
          ' è conclusa: tutte le scelte del primo pezzo sono state confrontate.',
        true,
      );
    }
    let rest = n;
    const pieces: number[] = [];
    while (rest) {
      pieces.push(s[rest]);
      rest -= s[rest];
    }
    record(
      n,
      s[n],
      r[n],
      'Pezzi ottimi: ' + pieces.join(' + '),
      'Ricavo ' +
        r[n] +
        '. Il primo pezzo non è l’intera soluzione: continua sul residuo fino a zero.',
      true,
    );
    return frames;
  }
  if (input.length !== 4 || input.some((x) => x < 1 || x > 200))
    throw Error('Quattro dimensioni intere tra 1 e 200.');
  const [a, b, c, d] = input;
  const left = choice === 0,
    cost1 = left ? a * b * c : b * c * d,
    cost2 = left ? a * c * d : a * b * d;
  const sizes = [`${a} x ${b}`, `${b} x ${c}`, `${c} x ${d}`];
  for (let stage = 0; stage < 3; stage++)
    frames.push({
      title:
        stage === 0
          ? 'Scegli le parentesi'
          : stage === 1
            ? 'Forma l’intermedio'
            : 'Completa il prodotto',
      detail:
        stage === 0
          ? 'Le matrici restano nell’ordine A1, A2, A3. Cambiano soltanto le parentesi.'
          : stage === 1
            ? `Primo prodotto: ${cost1} moltiplicazioni scalari. Intermedio ${left ? a : b} x ${left ? c : d}.`
            : `Secondo prodotto: ${cost2}. Totale ${cost1 + cost2}; il risultato è ${a} x ${d}.`,
      code: left ? '(A1 A2) A3' : 'A1 (A2 A3)',
      valid: true,
      values: { 'Primo prodotto': cost1, 'Secondo prodotto': cost2, Totale: cost1 + cost2 },
      edges: stage
        ? [
            [left ? '0' : '1', '3'],
            [left ? '1' : '2', '3'],
            ...(stage === 2
              ? ([
                  ['3', '4'],
                  [left ? '2' : '0', '4'],
                ] as [string, string][])
              : []),
          ]
        : [],
      nodes: [
        ...sizes.map((v, i) => ({
          id: String(i),
          label: `A${i + 1}: ${v}`,
          x: 160 + i * 270,
          y: stage && ((left && i < 2) || (!left && i > 0)) ? 260 : stage === 2 ? 360 : 100,
          color: 'N',
        })),
        {
          id: '3',
          label: stage === 0 ? 'M: attesa' : `M: ${left ? a : b} x ${left ? c : d}`,
          x: left ? 295 : 565,
          y: stage === 0 ? 480 : 360,
          color: 'R',
        },
        {
          id: '4',
          label: stage === 2 ? `C: ${a} x ${d}` : 'C: attesa',
          x: 430,
          y: stage === 2 ? 535 : 650,
          color: stage === 2 ? 'R' : 'attesa',
        },
      ],
    });
  return frames;
}
