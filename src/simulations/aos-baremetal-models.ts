import type { Frame } from './aos-models';
export const PIT_HZ = 1193182;
export const PIT_MOD = 65536;
export function pitDelta(previous: number, current: number) {
  return ((previous - current) % PIT_MOD + PIT_MOD) % PIT_MOD;
}
export function pitCounter(ticks: number) {
  return ((PIT_MOD - 1 - ticks) % PIT_MOD + PIT_MOD) % PIT_MOD;
}
export function loaderTrace(): Frame[] {
  const steps = [
    ['Il file non è ancora un programma in esecuzione', 'ELF contiene intestazioni e byte. RAM guest e CPU sono ancora da preparare.'],
    ['Il loader controlla i segmenti', 'Verifica offset, dimensioni e destinazioni dei segmenti caricabili. Le sezioni descrivono il contenuto; i program header guidano il caricamento.'],
    ['Copia il codice', 'I byte del segmento che contiene il codice arrivano nella RAM alla destinazione di collegamento, a partire da 1 MiB. Non sono istruzioni già eseguite.'],
    ['Copia le costanti', 'Anche i dati presenti nel file vengono collocati nella RAM guest. Le posizioni del diagramma sono schematiche.'],
    ['Azzera lo spazio senza byte nel file', 'La parte memsz oltre filesz viene azzerata: qui sono rappresentati .bss e spazio dello stack. Nessun blocco .bss viene letto dal file.'],
    ['Prepara il contratto di avvio', 'Il VMM configura protected mode a 32 bit, paging guest disabilitato, ingresso e parametri Multiboot. EBX indica le boot info.'],
    ['La CPU entra in _start', 'KVM avvia la vCPU. _start imposta ESP nello spazio riservato allo stack prima di chiamare C.'],
    ['Il firmware esegue', 'La CPU chiama firmware_main(). Copiare, inizializzare e avviare sono operazioni distinte.'],
  ];
  return steps.map(([title, detail], i) => ({title, detail, active:i,
    values:{'Codice in RAM':i>=2?'sì':'no','Costanti in RAM':i>=3?'sì':'no','.bss azzerata':i>=4?'sì':'no','CPU':i<6?'non avviata':i===6?'_start':'firmware_main()'}}));
}
export function pitTrace(mode: 'kvm'|'tcg'): Frame[] {
  const where=mode==='kvm'?'KVM nel kernel host':'il modello PIT nel processo QEMU';
  const steps=[
    ['Il contatore scende', 'Il PIT continua a contare. Il firmware non usa un handler periodico: legge quando serve.'],
    ['OUT 0x43: latch', `Il comando raggiunge ${where}. Il latch conserva una copia a 16 bit, mentre il contatore vero prosegue.`],
    ['IN 0x42: byte basso', 'Il primo IN restituisce il byte basso della copia. Nel diagramma la copia è 0xBEEF: il byte basso è 0xEF.'],
    ['IN 0x42: byte alto', 'Il secondo IN restituisce 0xBE. I due byte appartengono alla stessa acquisizione, non a due istanti del contatore vivo.'],
    ['Ricompone 0xBEEF', 'Un OUT e due IN per ogni lettura. Nel percorso KVM illustrato gli I/O sono intercettati e gestiti nel kernel; in TCG sono operazioni del modello QEMU.'],
    ['Estende il conteggio', 'Con last = 0xBEFF, la differenza modulare è 16 tick. Se passasse un intero giro non sarebbe ricostruibile da queste sole letture.'],
  ];
  return steps.map(([title,detail],i)=>({title,detail,active:i,values:{'Accessi porte completati':Math.min(i,3),'Gestore':where,'Copia acquisita':i?'0xBEEF':'—','Byte basso':i>=2?'0xEF':'—','Byte alto':i>=3?'0xBE':'—','Differenza tick':i===5?16:'—'}}));
}
export function gapTime(step: number, pauseMs: number) {
  return step<=3?step:step<=7?3+(step-3)*pauseMs/4:pauseMs+step-4;
}
export function gapSample(step: number) { return step<=3 || step>=8; }
export function gapTrace(pauseMs: number): Frame[] {
  return Array.from({length:11},(_,i)=>{
    const paused=i>=4&&i<=7, host=gapTime(i,pauseMs), actual=pauseMs+1;
    const previous=pitCounter(Math.round(3*PIT_HZ/1000));
    const current=pitCounter(Math.round((pauseMs+4)*PIT_HZ/1000));
    const observed=pitDelta(previous,current)*1000/PIT_HZ;
    return {title:i===0?'Prima lettura':paused?'Il thread guest è sospeso':i===8?'Il guest torna a leggere':'Il loop campiona il PIT',
      detail:paused?'La linea host avanza, ma il firmware non esegue letture. IF = 0 nel guest non impedisce questa sospensione.':i>=8?`Fra i campioni ai bordi della pausa passano ${actual} ms. ${actual>54.925?'Il periodo del PIT è superato: la differenza modulare vede solo circa '+observed.toFixed(2)+' ms.':'Il salto temporale comprende pausa e normale costo del ciclo.'}`:'In questo esempio illustrativo una lettura ogni millisecondo. I numeri sono scelti per capire il fenomeno, non misure hardware.',
      active:i,values:{'Tempo host (ms)':host,'Letture':i<=3?i+1:i<=7?4:i-3,'vCPU':paused?'sospesa':'esegue','Gap reale al rientro (ms)':i>=8?actual:'—','Gap ricostruito dal PIT (ms)':i>=8?observed.toFixed(2):'—'}};
  });
}
