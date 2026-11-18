export type L5Mode = 'containers' | 'list' | 'hash';
export type L5Node = {
  id: string;
  key: number | string;
  x: number;
  y: number;
  state: 'incoming' | 'stored' | 'out';
  mark?: boolean;
};
export type L5Edge = { from: string; to: string; kind: 'next' | 'prev' };
export type L5Frame = {
  title: string;
  detail: string;
  code: string;
  nodes: L5Node[];
  edges: L5Edge[];
  order: string[];
  head: number;
  tail: number;
  size: number;
  compared: number;
  result: string;
  valid: boolean;
  event: string;
};
export type L5Options = {
  container: 'stack' | 'queue';
  capacity: number;
  sentinel: boolean;
  prepend: boolean;
  query: number;
  m: number;
  hash: 'division' | 'multiplication' | 'universal' | 'constant';
  a: number;
  b: number;
};
export const l5Defaults: L5Options = {
  container: 'queue',
  capacity: 6,
  sentinel: false,
  prepend: false,
  query: 4,
  m: 5,
  hash: 'division',
  a: 3,
  b: 1,
};
export function l5Hash(k: number, o: L5Options) {
  if (o.hash === 'constant') return 0;
  if (o.hash === 'universal') return ((o.a * k + o.b) % 101) % o.m;
  if (o.hash === 'multiplication') return Math.floor((o.m * ((k * 40503) % 65536)) / 65536);
  return k % o.m;
}
export function l5Trace(values: number[], mode: L5Mode, o: L5Options) {
  if (
    values.length > 5 ||
    (mode !== 'list' && values.length < 2) ||
    values.some((x) => !Number.isInteger(x) || x < 0 || x > 99)
  )
    throw Error('Usa da 2 a 5 interi fra 0 e 99; per le liste è ammesso anche l’input vuoto.');
  if (!Number.isInteger(o.query) || o.query < 0 || o.query > 99)
    throw Error('Chiave cercata fra 0 e 99.');
  if (
    ![4, 6, 8].includes(o.capacity) ||
    ![3, 5, 8].includes(o.m) ||
    !Number.isInteger(o.a) ||
    o.a < 1 ||
    o.a > 100 ||
    !Number.isInteger(o.b) ||
    o.b < 0 ||
    o.b > 100
  )
    throw Error('Parametri fuori dai limiti del modello.');
  if (mode !== 'containers' && new Set(values).size !== values.length)
    throw Error('In questa scena usa chiavi distinte.');
  const frames: L5Frame[] = [];
  let nodes: L5Node[] = [],
    edges: L5Edge[] = [],
    order: string[] = [],
    head = 1,
    tail = 1,
    size = 0,
    compared = 0,
    result = '—';
  function snap(title: string, detail: string, code: string, event = 'step', valid = true) {
    frames.push({
      title,
      detail,
      code,
      event,
      valid,
      nodes: nodes.map((x) => ({ ...x })),
      edges: edges.map((x) => ({ ...x })),
      order: [...order],
      head,
      tail,
      size,
      compared,
      result,
    });
  }
  if (mode === 'containers') {
    const cap = o.container === 'queue' ? o.capacity - 1 : o.capacity;
    nodes = Array.from({ length: cap + 3 }, (_, i) => ({
      id: 'n' + i,
      key: values[i % values.length],
      x: 50 + i * 72,
      y: 85,
      state: 'incoming' as const,
    }));
    const slots = new Map<string, number>();
    let nextId = 0;
    const removed: string[] = [];
    const next = (i: number) => (i === o.capacity ? 1 : i + 1);
    function layout() {
      nodes.forEach((n, i) => {
        if (slots.has(n.id)) {
          const slot = slots.get(n.id)!;
          n.state = 'stored';
          if (o.container === 'queue') {
            const angle = ((slot - 1) * Math.PI * 2) / o.capacity - Math.PI / 2;
            n.x = 440 + 115 * Math.cos(angle);
            n.y = 255 + 115 * Math.sin(angle);
          } else {
            n.x = 440;
            n.y = 490 - (slot - 1) * 43;
          }
        } else if (removed.includes(n.id)) {
          n.state = 'out';
          n.x = 50 + removed.indexOf(n.id) * 72;
          n.y = 570;
        } else {
          n.state = 'incoming';
          n.x = 50 + i * 72;
          n.y = 85;
        }
      });
    }
    snap(
      'Contenitore vuoto',
      o.container === 'queue'
        ? 'Head = tail = 1. Una cella resta riservata: capacità N−1.'
        : 'Top = 0. La prima scrittura usa la cella 1.',
      'inizializza indici',
      'initial',
    );
    function put() {
      if (size === cap) {
        snap(
          'Inserimento rifiutato',
          'Il controllo di pieno precede la scrittura: nessun record viene sovrascritto.',
          o.container === 'queue' ? 'if NEXT(tail) = head: piena' : 'if top = N: piena',
          'overflow',
        );
        return;
      }
      const id = nodes[nextId++].id;
      slots.set(id, o.container === 'queue' ? tail : size + 1);
      order.push(id);
      size++;
      if (o.container === 'queue') tail = next(tail);
      layout();
      snap(
        'Inserisci ' + nodes.find((n) => n.id === id)!.key,
        o.container === 'queue'
          ? 'Scrivi nella vecchia tail e falla avanzare circolarmente.'
          : 'Incrementa top e colloca il nuovo elemento in cima.',
        o.container === 'queue' ? 'Q[tail] ← x; tail ← NEXT(tail)' : 'top ← top + 1; S[top] ← x',
        'insert',
      );
    }
    function take() {
      if (!size) {
        snap(
          'Estrazione rifiutata',
          'Il contenitore è vuoto; gli indici e i record non cambiano.',
          'if vuoto: segnala errore',
          'underflow',
        );
        return;
      }
      const id = o.container === 'queue' ? order.shift()! : order.pop()!;
      result = String(nodes.find((n) => n.id === id)!.key);
      slots.delete(id);
      removed.push(id);
      size--;
      if (o.container === 'queue') head = next(head);
      layout();
      snap(
        'Estrai ' + result,
        o.container === 'queue'
          ? 'Esce il record più vecchio. Non si traslano gli altri elementi.'
          : 'Esce la cima: il record inserito più recentemente.',
        o.container === 'queue'
          ? 'x ← Q[head]; head ← NEXT(head); return x'
          : 'top ← top − 1; return S[top+1]',
        'remove',
      );
    }
    for (let i = 0; i < cap; i++) put();
    put();
    take();
    take();
    put();
    put();
    for (let i = 0; i <= cap; i++) take();
  } else if (mode === 'list') {
    const original = values.map((_, i) => 'n' + i),
      insertKey = Array.from({ length: 100 }, (_, i) => i).find((x) => !values.includes(x))!;
    nodes = values.map((key, i) => ({
      id: 'n' + i,
      key,
      x: 160 + i * 130,
      y: 260,
      state: 'stored',
    }));
    nodes.push({ id: 'new', key: insertKey, x: 55, y: 90, state: 'incoming' });
    if (o.sentinel) nodes.push({ id: 'sentinel', key: 'S', x: 35, y: 260, state: 'stored' });
    order = [...original];
    size = order.length;
    function link(ids: string[]) {
      const chain = o.sentinel ? ['sentinel', ...ids] : ids;
      const es: L5Edge[] = [];
      for (let i = 0; i < chain.length - 1; i++) {
        es.push(
          { from: chain[i], to: chain[i + 1], kind: 'next' },
          { from: chain[i + 1], to: chain[i], kind: 'prev' },
        );
      }
      if (o.sentinel && ids.length) {
        es.push(
          { from: ids.at(-1)!, to: 'sentinel', kind: 'next' },
          { from: 'sentinel', to: ids.at(-1)!, kind: 'prev' },
        );
      }
      return es;
    }
    function place() {
      order.forEach((id, i) => {
        const n = nodes.find((n) => n.id === id)!;
        n.x = 160 + i * 110;
        n.y = 260;
        n.state = 'stored';
      });
    }
    edges = link(order);
    snap(
      'Lista iniziale',
      o.sentinel
        ? 'S è la sentinella. Nella lista vuota i suoi due link tornano a S.'
        : 'La testa è il primo nodo. I link mancanti ai bordi valgono NIL.',
      'head / S.next',
      'initial',
    );
    const pos = o.prepend || !order.length ? 0 : 1,
      previous = pos === 0 ? (o.sentinel ? 'sentinel' : null) : order[pos - 1],
      successor = order[pos] ?? (o.sentinel ? 'sentinel' : null);
    if (successor) edges.push({ from: 'new', to: successor, kind: 'next' });
    if (previous) edges.push({ from: 'new', to: previous, kind: 'prev' });
    snap(
      'Prepara i link del nuovo nodo',
      'Il nodo resta distinguibile mentre si preparano i suoi collegamenti. È un aggiornamento in corso, non una lista finale.',
      'x.next ← successore; x.prev ← predecessore',
      'prepare',
      false,
    );
    order.splice(pos, 0, 'new');
    size++;
    edges = link(order);
    place();
    snap(
      'Collega il nuovo nodo',
      o.sentinel
        ? 'I bordi usano la stessa sentinella: non servono test su NIL.'
        : 'Aggiorna i vicini e, se inserisci in testa, anche head.',
      'aggiorna prev del successore; aggiorna next del predecessore',
      'insert',
    );
    const target = order.find((id) => nodes.find((n) => n.id === id)!.key === o.query);
    for (const id of order) {
      compared++;
      nodes.forEach((n) => (n.mark = n.id === id));
      snap(
        'Confronta la chiave ' + nodes.find((n) => n.id === id)!.key,
        'La ricerca segue next; il numero di confronti è concreto per questa lista.',
        'if x.key = k: trovato; altrimenti x ← x.next',
        'compare',
      );
      if (id === target) break;
    }
    nodes.forEach((n) => (n.mark = false));
    if (!target) {
      result = 'NIL';
      snap(
        'Chiave assente',
        o.sentinel
          ? 'La ricerca raggiunge S: il risultato pubblico è NIL.'
          : 'La ricerca raggiunge NIL. Non si chiama DELETE su un risultato assente.',
        'return NIL',
        'absent',
      );
    } else {
      result = String(o.query);
      snap(
        'Nodo trovato',
        'Il puntatore al nodo è ora disponibile. La cancellazione che segue non ripete la ricerca.',
        'return x',
        'found',
      );
      order = order.filter((id) => id !== target);
      size--;
      edges = link(order);
      const deleted = nodes.find((n) => n.id === target)!;
      deleted.x = 440;
      deleted.y = 455;
      deleted.state = 'out';
      place();
      snap(
        'Rimuovi il nodo noto',
        'I due vicini vengono ricongiunti. Il nodo staccato resta mostrato in basso, senza simulare una deallocazione.',
        'x.prev.next ← x.next; x.next.prev ← x.prev (con controlli senza S)',
        'remove',
      );
    }
  } else {
    nodes = values.map((key, i) => ({
      id: 'n' + i,
      key,
      x: 50 + i * 140,
      y: 85,
      state: 'incoming',
    }));
    const buckets: string[][] = Array.from({ length: o.m }, () => []);
    function layout() {
      buckets.forEach((chain, j) =>
        chain.forEach((id, i) => {
          const n = nodes.find((x) => x.id === id)!;
          n.x = 235 + i * 112;
          n.y = 152 + j * 48;
          n.state = 'stored';
        }),
      );
      edges = buckets.flatMap((chain) =>
        chain.slice(1).flatMap((id, i) => [
          { from: chain[i], to: id, kind: 'next' as const },
          { from: id, to: chain[i], kind: 'prev' as const },
        ]),
      );
      order = buckets.flat();
    }
    snap(
      'Tabella inizialmente vuota',
      'La funzione e i suoi parametri restano gli stessi durante tutta questa costruzione.',
      'T[0..m−1] ← liste vuote',
      'initial',
    );
    for (const n of nodes) {
      const j = l5Hash(Number(n.key), o);
      n.mark = true;
      snap(
        'Calcola h(' + n.key + ') = ' + j,
        'L’indice seleziona una lista; non identifica da solo il record.',
        'j ← h(x.key)',
        'hash',
      );
      n.mark = false;
      buckets[j].unshift(n.id);
      size++;
      layout();
      snap(
        'Inserisci nella lista ' + j,
        'Inserimento in testa: i record già presenti conservano identità e scalano di una posizione.',
        'LIST-PREPEND(T[j], x)',
        'insert',
      );
    }
    const j = l5Hash(o.query, o);
    snap(
      'Cerca ' + o.query + ' nella lista ' + j,
      'Si confrontano le chiavi complete soltanto nella lista selezionata.',
      'LIST-SEARCH(T[h(k)], k)',
      'search',
    );
    let found: string | undefined;
    for (const id of buckets[j]) {
      compared++;
      nodes.forEach((n) => (n.mark = n.id === id));
      snap(
        'Confronto ' + compared,
        'Hash uguali possono appartenere a chiavi diverse; verifica key = k.',
        'x.key = k ?',
        'compare',
      );
      if (nodes.find((n) => n.id === id)!.key === o.query) {
        found = id;
        break;
      }
    }
    nodes.forEach((n) => (n.mark = false));
    result = found ? String(o.query) : 'NIL';
    snap(
      found ? 'Chiave trovata' : 'Chiave assente',
      'Confronti effettuati: ' +
        compared +
        '. Questo è un conteggio dell’esempio, non una misura del costo atteso.',
      'return x oppure NIL',
      found ? 'found' : 'absent',
    );
    if (found) {
      buckets[j] = buckets[j].filter((id) => id !== found);
      size--;
      layout();
      const n = nodes.find((x) => x.id === found)!;
      n.state = 'out';
      n.x = 750;
      n.y = 100;
      snap(
        'Cancella con puntatore noto',
        'Il puntatore è già stato ottenuto: unlink locale, senza nuova ricerca.',
        'LIST-DELETE(T[h(x.key)], x)',
        'remove',
      );
    }
  }
  return { frames };
}
