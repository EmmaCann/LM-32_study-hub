import type { Frame } from './aos-models';
export function decodeTrace(word: number): Frame[] {
  const fields = [['opcode',0,7],['rd',7,5],['funct3',12,3],['rs1',15,5],['rs2',20,5],['funct7',25,7]] as const;
  return fields.map(([name,shift,width],i) => ({title:`Estrarre ${name}`,detail:`${name}: bit ${shift+width-1}…${shift}; shift a destra di ${shift}, poi maschera di ${width} bit. Questa vista isola il formato R di ADD; non è un decoder completo RV32I.`,active:i,values:{'Parola (hex)':`0x${(word>>>0).toString(16).padStart(8,'0')}`,'Shift':shift,'Maschera':`0x${((1<<width)-1).toString(16)}`,'Campo estratto':(word>>>shift)&((1<<width)-1)},items:[(word>>>0).toString(2).padStart(32,'0'),...fields.map(([n,s,w])=>`${n} = ${(word>>>s)&((1<<w)-1)}`)]}));
}
export function timingTrace(mips: number, periodMs: number): Frame[] {
  if (![50,100,200].includes(mips) || ![125,500,1000,4000].includes(periodMs)) throw new RangeError('Parametri non supportati');
  const common={'Prestazione modello (MIPS)':mips,'Istruzioni del carico':6000000,'Durata carico virtuale (ms)':6000000/(mips*1000),'Periodo TIM2 virtuale (ms)':periodMs};
  return [
    {title:'Scegliere il modello temporale',detail:'Il carico didattico ha sei milioni di istruzioni. MIPS esprime istruzioni per secondo virtuale: non è il clock fisico della scheda.',active:0,values:common},
    {title:'Attribuire tempo alle istruzioni',detail:`t = N / (P × 10⁶): il carico occupa ${common['Durata carico virtuale (ms)']} ms virtuali. Cambiare P modifica questa stima; non misura il tempo trascorso sul PC.`,active:0,values:common},
    {title:'Configurare il timer',detail:'TIM2 usa 84 MHz e PSC = 8399: il contatore avanza a 10 kHz. ARR + 1 stabilisce il numero di conteggi per update. Cambiare MIPS non cambia da solo questa configurazione del timer.',active:1,values:{...common,'PSC':8399,'ARR':periodMs*10-1}},
    {title:'Osservare update e LED',detail:`Un update ogni ${periodMs} ms virtuali commuta il LED. Un ciclo completo acceso/spento dura ${2*periodMs} ms. Il modello non include ritardi degli handler o eventi persi.`,active:2,values:{...common,'Ciclo LED virtuale (ms)':2*periodMs}},
    {title:'Distinguere le misure',detail:'Il tempo host dipende dal PC e dalla sincronizzazione dell’emulatore. Il tempo fisico dipende da hardware e carico. Non sono ricavabili da questi soli MIPS: questa vista non garantisce latenze o WCET.',active:3,values:{...common,'Tempo host':'non deducibile','Tempo fisico scheda':'da misurare'}},
  ];
}
export function interruptTrace(masked: boolean): Frame[] {
  const frame=(title:string,detail:string,active:number,exits:number,pending:number,enabled:number):Frame=>({title,detail,active,values:{'VM exit del modello':exits,'Interrupt virtuale pendente':pending,'Guest pronto ad accettarlo':enabled}});
  return [
    frame('Evento del dispositivo','Caso del corso: la CPU sta eseguendo il guest quando arriva l’interrupt fisico. Controller virtuale software, senza le accelerazioni moderne.',0,0,0,masked?0:1),
    frame('Exit e gestione host','Il controllo passa all’host. Il driver fisico gestisce l’evento e individua il lavoro per la VM; l’handler guest non è un handler host.',1,1,0,masked?0:1),
    frame('Preparare l’interrupt virtuale','Il VMM aggiorna il controller virtuale. Preparare un interrupt non implica che l’handler guest inizi subito.',2,1,1,masked?0:1),
    ...(masked?[
      frame('Consegna rinviata','Il guest non può ancora accettare l’interrupt: resta pendente. Non si inventa un’esecuzione immediata del suo handler.',2,1,1,0),
      frame('Guest di nuovo pronto','In questa traccia il guest abilita la consegna. Non si contano altre cause di exit eventualmente associate alla gestione delle maschere.',2,1,1,1),
    ]:[]),
    frame('Entry e handler guest','Quando l’interrupt è accettabile viene consegnato; il guest esegue il proprio handler. Qui il singolo evento passa da pendente a in servizio.',3,1,0,1),
    frame('EOI intercettata','Nel modello l’EOI richiede una seconda exit per aggiornare il controller virtuale software. EOI è un’operazione del controller, non una singola istruzione universale.',2,2,0,1),
    frame('Ripresa del guest','Due exit nel percorso illustrato. Non è un minimo universale: accelerazioni, configurazione e batching possono cambiare la sequenza e i costi.',3,2,0,1),
  ];
}
export type AddressMode='cpu'|'dma'|'slot';
export function addressTrace(mode: AddressMode, valid: boolean): Frame[] {
  const f=(title:string,detail:string,active:number,values:Frame['values']):Frame=>({title,detail,active,values});
  if(mode==='slot'){
    const g0=0x2000, g=valid?0x3000:0x12000, base=0x70000000, size=0x10000, offset=g-g0;
    const v={'Inizio GPA slot':'0x2000','Dimensione slot':'0x10000','Base HVA mem':'0x70000000','GPA richiesto':`0x${g.toString(16)}`};
    return [f('Due viste degli stessi byte','Esempio didattico originale: uno slot RAM espone al guest una regione sostenuta dal mapping userspace host. La registrazione non copia i byte in una seconda RAM.',0,v),f('Controllare i limiti','L’intervallo valido è [g₀, g₀ + size). Il primo indirizzo oltre la fine è escluso, anche se il processo host ha altre mappature.',1,{...v,'Offset g − g₀':`0x${offset.toString(16)}`}),f(valid?'Calcolare il puntatore host':'Fuori dallo slot',valid?'HVA = mem + (g − g₀). HVA non è HPA né GPA; il backing fisico è gestito dall’host.':'Non produrre un puntatore RAM valido. Fuori slot possono esserci MMIO o intervalli invalidi: non tutti i buchi sono dispositivi.',2,{...v,'Esito':offset>=0&&offset<size?`HVA 0x${(base+offset).toString(16)}`:'nessuna RAM in questo slot'})];
  }
  if(mode==='cpu')return [f('Puntatore nel processo guest','Numeri didattici: la CPU guest parte da GVA 0x1000. Il contesto e le page table guest determinano la prima traduzione.',0,{'GVA':'0x1000'}),f('Prima traduzione','Le page table guest traducono GVA in GPA. Non è ancora l’indirizzo fisico della RAM host.',1,{'GVA':'0x1000','GPA':'0x2000'}),f('Secondo livello','Nel modello EPT traduce GPA in HPA. I valori qui scelti non descrivono una macchina reale.',2,{'GVA':'0x1000','GPA':'0x2000','HPA':'0x9000'})];
  return [f('Richiesta DMA','Il dispositivo usa IOVA 0x5000, non automaticamente il puntatore virtuale del processo guest.',0,{'IOVA':'0x5000'}),f('Dominio IOMMU','La traduzione e i permessi del dominio associato al dispositivo controllano la richiesta. EPT della CPU non sostituisce questo controllo.',1,{'IOVA':'0x5000','Mapping e permessi':valid?'consentiti':'non validi'}),f(valid?'DMA autorizzato':'Fault IOMMU',valid?'La richiesta raggiunge HPA 0x9000 nel dominio autorizzato. La coincidenza con l’HPA dell’esempio CPU riguarda gli stessi byte, non l’uguaglianza GVA/IOVA.':'La richiesta non deve scrivere nella RAM non autorizzata. Il modello rappresenta il blocco/fault, non una traduzione permissiva.',2,{'IOVA':'0x5000','Esito':valid?'HPA 0x9000':'accesso bloccato'})];
}
