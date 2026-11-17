export type L7Mode = 'matrix' | 'lcs' | 'bst' | 'triangle';
export type Item = { id: string; x: number; y: number; label: string; visible: boolean };
export type Cell = { id: string; x: number; y: number; text: string; active: boolean };
export type L7Frame = {
  title: string;
  detail: string;
  code: string;
  items: Item[];
  cells: Cell[];
  edges: [string, string][];
  cursor: [number, number];
  deps: [number, number][];
  values: Record<string, string | number>;
  phase: string;
};
const copy = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const frame = (): L7Frame => ({
  title: '',
  detail: '',
  code: '',
  items: [],
  cells: [],
  edges: [],
  cursor: [30, 45],
  deps: [],
  values: {},
  phase: 'tabella',
});

export function matrixTrace(p: number[]) {
  if (p.length < 2 || p.length > 7 || p.some((x) => !Number.isInteger(x) || x < 1 || x > 100))
    throw Error('Inserisci da 2 a 7 dimensioni intere, tra 1 e 100.');
  const n = p.length - 1,
    m = Array.from({ length: n + 1 }, () => Array(n + 1).fill(0) as number[]),
    s = copy(m),
    frames: L7Frame[] = [],
    f = frame();
  const pos = (i: number, j: number): [number, number] => [90 + j * 82, 60 + i * 43];
  for (let i = 1; i <= n; i++)
    for (let j = i; j <= n; j++) {
      const [x, y] = pos(i, j);
      f.cells.push({ id: `${i},${j}`, x, y, text: i === j ? '0' : '·', active: false });
    }
  for (let a = 1; a <= n; a++)
    f.items.push({ id: `a${a}`, x: 80 + a * 100, y: 430, label: `A${a}`, visible: true });
  const emit = () => frames.push(copy(f));
  f.title = 'Intervalli di una sola matrice';
  f.detail = 'La diagonale costa zero: nessun prodotto. Le celle contengono costi, non matrici.';
  f.code = 'm[i,i] ← 0';
  f.values = { Dimensioni: p.join(' × '), Matrici: n };
  emit();
  for (let j = 2; j <= n; j++)
    for (let i = j - 1; i >= 1; i--) {
      m[i][j] = Infinity;
      for (let k = i; k < j; k++) {
        const left = m[i][k],
          right = m[k + 1][j],
          combine = p[i - 1] * p[k] * p[j],
          q = left + right + combine;
        if (q < m[i][j]) {
          m[i][j] = q;
          s[i][j] = k;
        }
        f.cursor = pos(i, j);
        f.deps = [pos(i, k), pos(k + 1, j)];
        f.cells.forEach((c) => (c.active = c.id === `${i},${j}`));
        f.title = `Intervallo [${i},${j}], separazione k=${k}`;
        f.detail = `Riusa ${left} e ${right}; il prodotto finale costa ${p[i - 1]}·${p[k]}·${p[j]}=${combine}. Candidato ${q}; minimo provvisorio ${m[i][j]}.`;
        f.code = 'q ← m[i,k] + m[k+1,j] + p[i-1]·p[k]·p[j]\nse q < m[i,j]: aggiorna m e s';
        f.values = { i, j, k, Candidato: q, 'Minimo provvisorio': m[i][j] };
        emit();
      }
      f.cells.find((c) => c.id === `${i},${j}`)!.text = String(m[i][j]);
      f.deps = [];
      f.title = `Costo definitivo m[${i},${j}]=${m[i][j]}`;
      f.detail = `Tutte le ${j - i} separazioni sono state considerate. Memorizza s[${i},${j}]=${s[i][j]}.`;
      f.code = 'memorizza il minimo e una separazione';
      emit();
    }
  f.phase = 'albero';
  f.deps = [];
  f.cells.forEach((c) => (c.active = false));
  f.edges = [];
  // Each interval node has a stable identity. Leaves preserve their original IDs.
  const place = (i: number, j: number, depth: number): string => {
    const id = i === j ? `a${i}` : `v${i}-${j}`,
      x = 100 + (i + j - 2) * 60,
      y = 70 + depth * 75;
    if (i === j) {
      const a = f.items.find((a) => a.id === id)!;
      a.x = x;
      a.y = y;
    } else {
      f.items.push({ id, x, y, label: `[${i},${j}]`, visible: true });
      const k = s[i][j];
      f.edges.push([id, place(i, k, depth + 1)], [id, place(k + 1, j, depth + 1)]);
    }
    return id;
  };
  place(1, n, 0);
  f.cursor = [100 + (n - 1) * 60, 70];
  f.title = 'Dalle separazioni all’albero';
  f.detail =
    'Ogni foglia è una matrice, nello stesso ordine iniziale. Ogni nodo interno rappresenta l’ultimo prodotto della sua sottocatena.';
  f.code = 'k ← s[i,j]; ricostruisci [i,k] e [k+1,j]';
  const par = (i: number, j: number): string =>
    i === j ? `A${i}` : `(${par(i, s[i][j])} ${par(s[i][j] + 1, j)})`;
  f.values = { Costo: m[1][n], Parentesi: par(1, n) };
  emit();
  return { frames, m, s, parentheses: par(1, n), cost: m[1][n] };
}

export function lcsTrace(x: string, y: string, tieUp = true) {
  if (!/^[A-Za-z0-9]*$/.test(x + y) || x.length > 8 || y.length > 8)
    throw Error('Usa al massimo 8 lettere o cifre per sequenza; sono ammesse sequenze vuote.');
  const m = x.length,
    n = y.length,
    c = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0) as number[]),
    b = Array.from({ length: m + 1 }, () => Array(n + 1).fill('') as string[]),
    f = frame(),
    frames: L7Frame[] = [];
  const pos = (i: number, j: number): [number, number] => [70 + j * 61, 70 + i * 35];
  for (let i = 0; i <= m; i++)
    for (let j = 0; j <= n; j++) {
      const [a, z] = pos(i, j);
      f.cells.push({
        id: `${i},${j}`,
        x: a,
        y: z,
        text: i === 0 || j === 0 ? '0' : '·',
        active: false,
      });
    }
  for (let i = 0; i < m; i++)
    f.items.push({
      id: `x${i}`,
      x: 620 + (i % 4) * 58,
      y: 110 + Math.floor(i / 4) * 45,
      label: x[i],
      visible: false,
    });
  f.title = 'Prefissi vuoti';
  f.detail = 'Il bordo vale zero. I simboli di X sono sulle righe, quelli di Y sulle colonne.';
  f.code = 'c[i,0] ← 0; c[0,j] ← 0';
  f.values = { X: x || 'vuota', Y: y || 'vuota' };
  frames.push(copy(f));
  for (let j = 1; j <= n; j++)
    for (let i = 1; i <= m; i++) {
      const same = x[i - 1] === y[j - 1];
      let di = i - 1,
        dj = j - 1;
      if (same) {
        c[i][j] = c[i - 1][j - 1] + 1;
        b[i][j] = '↖';
      } else if (c[i - 1][j] > c[i][j - 1] || (tieUp && c[i - 1][j] === c[i][j - 1])) {
        c[i][j] = c[i - 1][j];
        b[i][j] = '↑';
        dj = j;
      } else {
        c[i][j] = c[i][j - 1];
        b[i][j] = '←';
        di = i;
      }
      f.cursor = pos(i, j);
      f.deps = same ? [pos(di, dj)] : [pos(i - 1, j), pos(i, j - 1)];
      f.cells.forEach((z) => (z.active = z.id === `${i},${j}`));
      f.cells.find((z) => z.id === `${i},${j}`)!.text = `${c[i][j]} ${b[i][j]}`;
      f.title = `Confronta X[${i}]=${x[i - 1]} e Y[${j}]=${y[j - 1]}`;
      f.detail = same
        ? `Simboli uguali: diagonale ${c[i - 1][j - 1]} più 1. La freccia diagonale conserverà una lettera.`
        : `Simboli diversi: massimo fra alto ${c[i - 1][j]} e sinistra ${c[i][j - 1]}. Freccia ${b[i][j]}; nei pareggi si privilegia ${tieUp ? 'alto' : 'sinistra'}.`;
      f.code = same
        ? 'c[i,j] ← c[i-1,j-1]+1; b[i,j] ← ↖'
        : 'c[i,j] ← max(c[i-1,j],c[i,j-1]); memorizza la direzione';
      f.values = { i, j, 'Lunghezza del prefisso': c[i][j], X: x, Y: y };
      frames.push(copy(f));
    }
  let i = m,
    j = n,
    z = '';
  const matches: { i: number; j: number; letter: string }[] = [];
  f.phase = 'ricostruzione';
  f.deps = [];
  while (i > 0 && j > 0) {
    const a = i,
      d = j,
      arrow = b[i][j];
    if (arrow === '↖') {
      z = x[i - 1] + z;
      matches.unshift({ i, j, letter: x[i - 1] });
      i--;
      j--;
    } else if (arrow === '↑') i--;
    else j--;
    f.cursor = pos(i, j);
    f.deps = [pos(a, d)];
    f.cells.forEach((c) => (c.active = c.id === `${i},${j}`));
    matches.forEach((m, k) => {
      const item = f.items.find((a) => a.id === `x${m.i - 1}`)!;
      item.visible = true;
      item.x = 90 + k * 70;
      item.y = 430;
    });
    f.title = `Ricostruzione: ${arrow} da [${a},${d}]`;
    f.detail =
      arrow === '↖'
        ? `Conserva ${x[a - 1]} in testa alla soluzione parziale. Le lettere si incontrano in ordine inverso.`
        : 'Questo passo scarta una posizione; non aggiunge simboli.';
    f.code =
      arrow === '↖'
        ? 'segui la diagonale; emetti il simbolo al ritorno'
        : 'segui la freccia senza emettere';
    f.values = { X: x, Y: y, 'Soluzione parziale': z || 'vuota', 'Lunghezza ottima': c[m][n] };
    frames.push(copy(f));
  }
  f.title = 'Una LCS ricostruita';
  f.detail = `Lunghezza ${c[m][n]}; soluzione ${z || 'vuota'}. Cambiare la scelta nei pareggi può cambiare la sequenza, mantenendo la lunghezza ottima.`;
  f.code = 'return una LCS';
  f.values = { X: x, Y: y, LCS: z || 'vuota', Lunghezza: c[m][n] };
  frames.push(copy(f));
  return { frames, c, b, lcs: z, matches };
}

export function bstTrace(weights: number[]) {
  if (
    weights.length !== 11 ||
    weights.some((v) => !Number.isFinite(v) || v < 0) ||
    weights.reduce((a, b) => a + b, 0) === 0
  )
    throw Error('Servono 11 pesi non negativi, con somma positiva: p1..p5, q0..q5.');
  const total = weights.reduce((a, b) => a + b, 0),
    w = weights.map((x) => x / total),
    frames: L7Frame[] = [];
  const layouts = [
    [
      [2, 360, 55],
      [1, 190, 145],
      [4, 560, 145],
      [3, 460, 235],
      [5, 680, 235],
    ],
    [
      [2, 360, 55],
      [1, 190, 145],
      [5, 680, 145],
      [4, 560, 235],
      [3, 460, 325],
    ],
  ];
  const parents = [
    [
      ['k2', 'k1'],
      ['k2', 'k4'],
      ['k4', 'k3'],
      ['k4', 'k5'],
    ],
    [
      ['k2', 'k1'],
      ['k2', 'k5'],
      ['k5', 'k4'],
      ['k4', 'k3'],
    ],
  ] as [string, string][][];
  for (let a = 0; a < 2; a++) {
    const f = frame();
    f.phase = 'confronto';
    f.items = layouts[a].map(([id, x, y]) => ({
      id: `k${id}`,
      x,
      y,
      label: `k${id}`,
      visible: true,
    }));
    f.edges = copy(parents[a]);
    const leaves =
      a === 0
        ? [
            [130, 235],
            [250, 235],
            [415, 325],
            [505, 325],
            [635, 325],
            [725, 325],
          ]
        : [
            [130, 235],
            [250, 235],
            [415, 415],
            [505, 415],
            [610, 325],
            [750, 235],
          ];
    const lp =
      a === 0 ? ['k1', 'k1', 'k3', 'k3', 'k5', 'k5'] : ['k1', 'k1', 'k3', 'k3', 'k4', 'k5'];
    leaves.forEach(([x, y], i) => {
      f.items.push({ id: `d${i}`, x, y, label: `d${i}`, visible: true });
      f.edges.push([lp[i], `d${i}`]);
    });
    const keyDepth = a === 0 ? [1, 0, 2, 1, 2] : [1, 0, 3, 2, 1],
      leafDepth = a === 0 ? [2, 2, 3, 3, 3, 3] : [2, 2, 4, 4, 3, 2];
    const cost =
      keyDepth.reduce((v, d, i) => v + w[i] * (d + 1), 0) +
      leafDepth.reduce((v, d, i) => v + w[i + 5] * (d + 1), 0);
    f.title = a === 0 ? 'Prima forma' : 'Seconda forma';
    f.detail =
      'Confronto di due forme ammesse, non esecuzione di OPTIMAL-BST. Il costo di un esito è profondità + 1, incluse le foglie esterne.';
    f.code = 'E[C] ← somma probabilità(esito) · (profondità(esito)+1)';
    f.values = { 'Costo medio': cost.toFixed(4), 'Somma pesi': total };
    frames.push(f);
  }
  return frames;
}

export const polygon = [
  [130, 210],
  [250, 60],
  [520, 85],
  [710, 240],
  [500, 400],
  [220, 370],
];
export function triangleTrace(root: number) {
  if (!Number.isInteger(root) || root < 0 || root > 5) throw Error('Vertice iniziale da 1 a 6.');
  const d = (a: number, b: number) =>
      Math.hypot(polygon[a][0] - polygon[b][0], polygon[a][1] - polygon[b][1]),
    frames: L7Frame[] = [];
  let perimeter = 0,
    area = 0;
  for (let k = 0; k <= 4; k++) {
    const f = frame();
    f.phase = 'triangoli';
    f.items = polygon.map(([x, y], i) => ({
      id: `q${i}`,
      x,
      y,
      label: `q${i + 1}`,
      visible: true,
    }));
    for (let i = 0; i < 6; i++) f.edges.push([`q${i}`, `q${(i + 1) % 6}`]);
    if (k > 0) {
      const a = root,
        b = (root + k) % 6,
        c = (root + k + 1) % 6;
      perimeter += d(a, b) + d(b, c) + d(c, a);
      area +=
        Math.abs(
          (polygon[b][0] - polygon[a][0]) * (polygon[c][1] - polygon[a][1]) -
            (polygon[b][1] - polygon[a][1]) * (polygon[c][0] - polygon[a][0]),
        ) / 2;
      for (let z = 2; z <= Math.min(k + 1, 4); z++)
        f.edges.push([`q${root}`, `q${(root + z) % 6}`]);
      f.cursor = polygon[c] as [number, number];
      f.deps = [polygon[a] as [number, number]];
    }
    f.title = k === 0 ? 'Poligono convesso' : `Triangolo ${k} di 4`;
    f.detail =
      'Costruzione di una triangolazione a ventaglio scelta dall’utente. Non cerca la triangolazione ottima. Cambia vertice e confronta i totali: l’area resta uguale, i perimetri possono cambiare.';
    f.code = 'costo ← somma dei costi dei triangoli scelti';
    f.values = {
      'Triangoli costruiti': k,
      'Area accumulata': area.toFixed(0),
      'Somma perimetri': perimeter.toFixed(2),
      Unità: 'coordinate illustrative',
    };
    frames.push(f);
  }
  return frames;
}
