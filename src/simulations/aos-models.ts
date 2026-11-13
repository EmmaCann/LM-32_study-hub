// Modelli didattici originali: nessun codice delle fonti eseguito.
export type Frame = { title: string; detail: string; values: Record<string, string | number>; active: number; items?: string[] };
export type Mode = 'interpretazione' | 'cache' | 'chaining';
export function flagsTrace(corrected: boolean): Frame[] {
  const base = { 'IF fisico host': 1, 'IF virtuale guest': 1, 'IF atteso guest': 1, 'IF salvato': 1 };
  return [
    { title: 'Stato iniziale', detail: 'Modello storico: guest deprivilegiato con CPL > IOPL, nessuna estensione moderna. IF host è mantenuto a 1 dal monitor in questa dimostrazione.', values: base, active: 0 },
    { title: 'PUSHF: salvataggio', detail: 'Per isolare POPF assumiamo che il valore salvato rappresenti correttamente IF virtuale = 1. Anche PUSHF richiederebbe attenzione in un VMM reale.', values: base, active: 0 },
    { title: 'CLI: trap', detail: 'Il VMM intercetta CLI e porta IF virtuale a 0. Non disabilita gli interrupt fisici dell’host per tutta la sezione critica guest.', values: { ...base, 'IF virtuale guest': 0, 'IF atteso guest': 0 }, active: 1 },
    { title: 'Sezione critica guest', detail: 'Il monitor trattiene la consegna degli interrupt virtuali mascherabili interessati. IF fisico e IF virtuale sono stati distinti.', values: { ...base, 'IF virtuale guest': 0, 'IF atteso guest': 0 }, active: 0 },
    { title: corrected ? 'POPF: ripristino mediato' : 'POPF: bit ignorato senza trap', detail: corrected ? 'Con una riscrittura software del ripristino, il VMM viene informato e riporta IF virtuale a 1. Questo ramo rappresenta la correzione, non il comportamento di POPF non intercettata.' : 'Nel caso storico isolato, CPL > IOPL impedisce il ripristino di IF senza produrre la trap necessaria al VMM: IF virtuale resta 0 anziché 1. Non tutta POPF è ignorata.', values: { ...base, 'IF virtuale guest': corrected ? 1 : 0 }, active: corrected ? 1 : 0 },
  ];
}
export function cpuTrace(n: number, mode: Mode): Frame[] {
  if (!Number.isInteger(n) || n < 1 || n > 8) throw new RangeError('n deve essere fra 1 e 8');
  let x1 = 0, x2 = n, decodes = 0, translations = 0, lookups = 0, links = 0;
  const cached = new Set<string>();
  const frames: Frame[] = [];
  const values = (pc: number) => ({ 'PC guest (byte)': pc, x0: 0, x1, x2, 'Istruzioni guest': frames.length, 'Decodifiche guest': decodes, 'Blocchi tradotti': translations, 'Ricerche dispatcher': lookups, 'Salti concatenati': links });
  frames.push({ title: 'Stato iniziale', detail: 'Programma RV32I ridotto: x2 = n; PC iniziale 0. Gli indirizzi sono byte. Il modello esegue gli effetti delle istruzioni, senza generare codice macchina host.', values: values(0), active: 0, items: [] });
  function enter(block: string, size: number, linked = false) {
    if (mode === 'interpretazione') return 'Interpretazione: fetch e decodifica a ogni istruzione.';
    if (linked) links++; else lookups++;
    if (!cached.has(block)) { cached.add(block); translations++; decodes += size; return `Miss del blocco ${block}: decodifica di ${size} istruzioni e traduzione concettuale; inserimento in cache.`; }
    return linked ? `Collegamento già predisposto verso ${block}: nessuna ricerca dispatcher; il branch è comunque valutato.` : `Hit del blocco ${block}: riuso della traduzione; ricerca nel dispatcher.`;
  }
  function emit(title: string, detail: string, pc: number, active: number) {
    if (mode === 'interpretazione') decodes++;
    frames.push({ title, detail, values: values(pc), active, items: [...cached] });
  }
  let info = enter('A · PC 0', 1);
  emit('ADDI x1, x0, 0', info + ' x1 viene inizializzato a 0; PC = 4.', 4, 0);
  for (let i = 0; i < n; i++) {
    info = enter('B · PC 4', 3, mode === 'chaining' && i >= 2);
    x1 = (x1 + x2) >>> 0;
    emit('ADD x1, x1, x2', info + ' Si somma x2 a x1; PC = 8.', 8, 1);
    x2 = (x2 - 1) >>> 0;
    emit('ADDI x2, x2, -1', 'Decremento a 32 bit; PC = 12. Nel blocco tradotto non serve una nuova ricerca dispatcher.', 12, 1);
    emit('BNE x2, x0, -8', x2 ? 'Ramo preso: 12 − 8 = 4. La condizione viene valutata anche con chaining.' : 'Ramo non preso: PC = 16. Il ciclo termina.', x2 ? 4 : 16, 1);
  }
  info = enter('C · PC 16', 1);
  emit('ECALL: arresto della demo', info + ' Solo in questo interprete ECALL è una convenzione di arresto. Non è il significato generale dell’istruzione.', 16, 2);
  return frames;
}
export function queueTrace(total: number, batch: number): Frame[] {
  if (![total,batch].every(Number.isInteger) || total < 1 || total > 8 || batch < 1 || batch > total) throw new RangeError('Dimensioni coda non valide');
  const frames: Frame[] = [];
  let avail = 0, used = 0, reclaimed = 0, kicks = 0, notifications = 0;
  const emit = (title: string, detail: string, active: number) => frames.push({ title, detail, active, values: { 'Pubblicate (avail)': avail, 'Completate (used)': used, 'Buffer recuperati': reclaimed, 'Kick guest → backend': kicks, 'Notifiche backend → guest': notifications }, items: Array.from({length: total}, (_,i) => `${i+1}: ${i < reclaimed ? 'recuperato' : i < used ? 'completato' : i < avail ? 'disponibile al backend' : 'non pubblicato'}`) });
  emit('Coda iniziale', 'Split virtqueue concettuale vuota. Le celle rappresentano buffer/richieste, non il layout binario del ring.', 0);
  for (let start = 0; start < total; start += batch) {
    const end = Math.min(total, start + batch);
    emit('Preparare dati e descrittori', `Il driver prepara le richieste ${start+1}–${end}. I dati devono essere visibili prima di pubblicare l’indice available.`, 0);
    avail = end;
    emit('Pubblicare nello available ring', 'Il guest pubblica riferimenti alle catene di descrittori. Il backend può ora consumarli; il driver non riutilizza ancora i buffer.', 1);
    kicks++;
    emit('Kick al backend', 'Politica scelta per il modello: un kick per gruppo. Non è una regola universale, né un conteggio delle VM exit.', 2);
    used = end;
    emit('Completamento nello used ring', 'Il backend lavora e pubblica i completamenti dopo aver reso visibili i risultati. Non è il guest a pubblicare lo used ring.', 3);
    notifications++;
    emit('Notificare il guest', 'Politica semplificata: una notifica per gruppo completato. Suppressione delle notifiche, polling e accelerazioni possono cambiare questi conteggi.', 4);
    reclaimed = end;
    emit('Recuperare i buffer', 'Il driver osserva i completamenti e può riutilizzare i buffer restituiti secondo il protocollo. Il batching riduce le notifiche del modello, non garantisce un tempo reale.', 0);
  }
  return frames;
}
export function kvmTrace(userExit: boolean): Frame[] {
  const f = (title: string, detail: string, active: number, exits: number, returns: number, calls: number): Frame => ({ title, detail, active, values: { 'Invocazioni KVM_RUN': calls, 'VM exit hardware': exits, 'Ritorni a userspace': returns } });
  return [
    f('Thread VMM in userspace', 'Stato iniziale del thread host che eseguirà la vCPU. KVM_RUN è una ioctl sul descriptor vCPU.', 0, 0, 0, 0),
    f('Prima invocazione di KVM_RUN', 'Il thread entra nel kernel. KVM prepara l’ingresso nel guest; la stessa system call può contenere più cicli guest ↔ KVM.', 1, 0, 0, 1),
    f('Il guest esegue', 'Il guest usa la CPU fisica attraverso il thread vCPU. La mancata restituzione della chiamata non implica che il thread dorma.', 2, 0, 0, 1),
    f('Prima VM exit', 'Evento configurato per essere risolto nel kernel. I nomi delle cause non determinano sempre lo stesso percorso in tutte le configurazioni.', 1, 1, 0, 1),
    f('Rientro interno', 'KVM gestisce l’evento e riprende il guest senza restituire KVM_RUN al VMM.', 2, 1, 0, 1),
    f('Seconda VM exit', userExit ? 'Il dispositivo scelto è emulato in userspace: KVM prepara una richiesta KVM_EXIT_IO in kvm_run.' : 'Anche questo evento viene gestito nel kernel nella configurazione illustrata.', 1, 2, 0, 1),
    ...(userExit ? [
      f('Ritorno al VMM', 'KVM_RUN restituisce con successo; il VMM legge run->exit_reason. Il valore restituito dalla ioctl non è il codice di exit.', 0, 2, 1, 1),
      f('Gestione del dispositivo', 'Il VMM gestisce l’I/O. Per questo percorso il VMM non deve avanzare RIP indiscriminatamente dal codice userspace.', 0, 2, 1, 1),
      f('Seconda KVM_RUN', 'Il VMM richiama KVM_RUN: KVM completa l’operazione I/O pendente e può riprendere il guest.', 1, 2, 1, 2),
      f('Ripresa guest', 'Due VM exit hardware hanno prodotto un solo ritorno a userspace. Le quantità misurano passaggi diversi.', 2, 2, 1, 2),
    ] : [f('Ancora nella prima KVM_RUN', 'Due exit hardware, zero ritorni a userspace e una sola invocazione KVM_RUN. Segnali ed errori sono esclusi da questa traccia.', 2, 2, 0, 1)]),
  ];
}
