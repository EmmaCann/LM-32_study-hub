import type {Frame} from './aos-models';
export type MemoryMode='shootdown'|'buddy'|'walk'|'balloon'|'ksm'|'latency';
export const modes:Record<MemoryMode,string>={shootdown:'TLB shootdown',buddy:'Buddy e frammentazione',walk:'Walk nativo e annidato',balloon:'Ballooning',ksm:'KSM e copy-on-write',latency:'Deadline e percorsi lenti'};
export const experiments:Record<MemoryMode,readonly (readonly [string,string])[]>={
 shootdown:[['wait','Aspetta tutti gli ACK'],['early','Errore: riusa dopo il primo ACK']],
 buddy:[['contiguous','RAM già contigua'],['fragmented','Frammentata: pagine mobili'],['pinned','Frammentata: C non migrabile']],
 walk:[['nested','4 KiB: guest 4 / stage 2 4'],['native','Nativo: 4 livelli'],['guestHuge','Huge page guest: 3 / 4'],['bothHuge','Huge page in entrambi: 3 / 3'],['hit','Hit nella TLB combinata']],
 balloon:[['2','Richiedi 2 pagine'],['4','Richiedi 4 pagine'],['6','Richiedi 6 pagine: solo 4 cedibili']],
 ksm:[['same','A e B contengono ABC'],['different','A = ABC, B = DEF']],
 latency:[['cold','Primo accesso: minor fault'],['pressure','Fault + reclaim e compattazione'],['prepared','Pagine preparate prima della fase critica']]
};
export const defaultExperiment=(m:MemoryMode)=>m==='buddy'?'fragmented':experiments[m][0][0];
export function walkReads(g:number,s:number){return s?g*(s+1)+s:g;}
export function buddyOf(p:number,order:number){return p^(2**order);}
export function freeBlocks(positions:readonly number[],order:number){const size=2**order,out:number[]=[];for(let start=0;start<8;start+=size)if(Array.from({length:size},(_,j)=>start+j).every(p=>!positions.includes(p)))out.push(start);return out;}
export function largestBlock(positions:readonly number[]){for(let order=3;order>=0;order--)if(freeBlocks(positions,order).length)return 2**order;return 0;}
export type MemoryFrame=Frame & {phase:number;result:string;ok:boolean;ack:number;owner:string;remoteValid:boolean;positions:number[];allocated:number[];reads:number;row:number;col:number;donated:number;backing:number;guestFree:number;merged:boolean;mapA:number;mapB:number;bytesA:string;bytesB:string;physical:number;elapsed:number;useful:number;total:number};
export function walkConfig(s:string){return s==='native'?{g:4,s:0}:s==='guestHuge'?{g:3,s:4}:s==='bothHuge'?{g:3,s:3}:s==='hit'?{g:0,s:0}:{g:4,s:4};}
export function latencySegments(s:string){return s==='prepared'?[{label:'utile',duration:3,useful:true}]:s==='cold'?[{label:'utile',duration:1,useful:true},{label:'minor fault',duration:2,useful:false},{label:'utile',duration:2,useful:true}]:[{label:'utile',duration:1,useful:true},{label:'minor fault',duration:2,useful:false},{label:'utile',duration:1,useful:true},{label:'reclaim',duration:2,useful:false},{label:'compaction',duration:2,useful:false},{label:'utile',duration:1,useful:true}];}
export function memoryTrace(mode:MemoryMode,scenario:string,amount=4,writer='A'):MemoryFrame[]{
 if(!experiments[mode].some(([id])=>id===scenario))throw new Error('Esperimento memoria sconosciuto');
 if(!Number.isInteger(amount)|| (mode==='buddy'&&![2,4,8].includes(amount)) || (mode==='latency'&&(amount<3||amount>12)))throw new Error('Parametro memoria non valido');
 if(!['A','B','none'].includes(writer))throw new Error('Scrittore non valido');
 const out:MemoryFrame[]=[];
 const base:MemoryFrame={title:'',detail:'',active:0,values:{},phase:0,result:'',ok:true,ack:0,owner:'vecchio processo',remoteValid:true,positions:[],allocated:[],reads:0,row:0,col:0,donated:0,backing:8,guestFree:4,merged:false,mapA:0,mapB:1,bytesA:'ABC',bytesB:'ABC',physical:2,elapsed:0,useful:0,total:0};
 const emit=(title:string,detail:string,state:Partial<MemoryFrame>={})=>{const prev=out.at(-1)??base;out.push({...prev,...state,title,detail,phase:out.length,active:out.length,values:{...prev.values,...state.values}});};
 if(mode==='shootdown'){
  emit('La PTE cambia; la TLB remota è ancora vecchia','Il core 0 invalida localmente VA → F17. Core 1 e 2 possono conservare quella traduzione: aggiornare la PTE non aggiorna le loro TLB.');
  emit('Invia le invalidazioni ai core interessati','Nel modello core 1 risponde prima e core 2 è in ritardo. Core 3 usa un altro address space e non è un destinatario.');
  emit('Arriva il primo ACK','Core 1 ha invalidato. Core 2 conserva VA → F17: il primo ACK non basta.',{ack:1});
  emit(scenario==='early'?'Errore: F17 assegnato a B troppo presto':'F17 resta riservato fino alla barriera',scenario==='early'?'B scrive SEGRETO nel frame F17. Core 2 può ancora raggiungerlo con la traduzione obsoleta.':'Il vecchio backing non viene assegnato ad altri mentre manca un ACK.',{owner:scenario==='early'?'processo B':'vecchio processo'});
  emit('Core 2 tenta un accesso con la vecchia TLB',scenario==='early'?'La richiesta raggiunge il nuovo contenuto di B: violazione di isolamento nel protocollo errato.':'La vecchia traduzione raggiunge ancora il vecchio backing, non dati di un nuovo proprietario.',{result:scenario==='early'?'LETTURA OBSOLETA: core 2 legge SEGRETO di B':'Core 2 legge il vecchio backing; B è ancora in attesa',ok:scenario!=='early'});
  emit('Core 2 invalida e invia il secondo ACK','Ora tutte le copie interessate sono invalidate. Le sincronizzazioni e l’ordinamento reali non sono simulati.',{ack:2,remoteValid:false});
  emit('Riuso dopo la barriera',scenario==='early'?'Gli ACK tardivi non annullano una lettura già avvenuta.':'Solo adesso F17 passa a B. Un accesso successivo dalla vecchia VA non ha più una traduzione TLB valida.',{owner:'processo B'});
  emit('Confronta il momento del riuso','Il problema è il riuso prima dell’invalidazione completa, non la sola durata dell’IPI.',{result:scenario==='early'?'NON SICURO: B letto prima del secondo ACK':'SICURO: F17 riusato dopo 2 ACK',ok:scenario!=='early',values:{ACK:2,Protocollo:scenario==='early'?'violato':'rispettato'}});
 }else if(mode==='buddy'){
  const initial=scenario==='contiguous'?[0,1,2,3]:[0,2,4,6];let pos=[...initial];
  emit('Stessa RAM libera, geometria diversa','A, B, C e D occupano quattro frame. Le celle vuote sono libere: conta il blocco contiguo e allineato, non solo il totale.',{positions:pos,values:{Liberi:4,Richiesta:amount}});
  emit('Cerca un blocco buddy adatto','Le parentesi raggruppano blocchi allineati. Un blocco di quattro frame deve iniziare a 0 oppure 4.');
  for(let j=1;j<=3;j++){
   const canMove=scenario!=='contiguous'&&!(scenario==='pinned'&&j===2);if(canMove){pos=[...pos];pos[j]=j;}
   emit(canMove?`Migra la pagina ${'ABCD'[j]}`:scenario==='pinned'&&j===2?'C non può essere migrata':'Nessuna migrazione necessaria',canMove?'Il token è il contenuto della pagina che viene copiato in un frame libero; le etichette F0…F7 restano ferme.':scenario==='pinned'&&j===2?'Il vincolo su C impedisce di liberare il blocco F4–F7.':'Il blocco libero è già disponibile.',{positions:[...pos]});
  }
  const order=Math.log2(amount),start=freeBlocks(pos,order)[0],ok=start!==undefined;
  emit('Ricalcola i blocchi liberi',`Massimo blocco buddy disponibile: ${largestBlock(pos)} frame. Compattazione idealizzata; il buddy da solo non migra le pagine.`,{values:{'Massimo blocco':largestBlock(pos)}});
  emit('Tenta l’allocazione',ok?`La richiesta R occupa F${start}–F${start+amount-1}.`:'La quantità libera non contiene un blocco buddy della dimensione richiesta.',{allocated:ok?Array.from({length:amount},(_,j)=>start+j):[],result:ok?`ALLOCAZIONE RIUSCITA: ${amount} frame contigui`:`ALLOCAZIONE FALLITA: servono ${amount}, massimo ${largestBlock(pos)}`,ok});
 }else if(mode==='walk'){
  const {g,s}=walkConfig(scenario);let reads=0;
  emit('Prevedi il numero di letture','Un token rappresenta un accesso alle strutture di traduzione, non il dato finale. Cache dei walk escluse; il caso TLB hit è separato.',{row:0,col:0,values:{'Livelli guest':g,'Livelli stage 2':s}});
  for(let row=0;row<g;row++){
   for(let col=0;col<s;col++)emit(`Stage 2: livello ${col+1} per PTE guest ${row+1}`,'Prima di leggere una PTE guest serve tradurne il GPA in indirizzo fisico host.',{row,col,reads:++reads});
   emit(`Leggi PTE guest ${row+1}`,s?'Il walk stage 2 ha reso raggiungibile questa entry guest.':'Walk nativo: si legge direttamente la entry del livello successivo.',{row,col:s,reads:++reads});
  }
  for(let col=0;col<s;col++)emit(`Stage 2 per il GPA del dato: livello ${col+1}`,'Anche il GPA finale deve essere tradotto; queste letture sono distinte dall’accesso al dato.',{row:g,col,reads:++reads});
  emit('Leggi il dato',scenario==='hit'?'La TLB combinata fornisce la traduzione finale: nessuna lettura delle tabelle in questo accesso.':`${g} × (${s}+1) + ${s} = ${reads} letture di traduzione; poi una lettura del dato.`,{row:g,col:s,reads,result:`${reads} letture di traduzione + 1 dato = ${reads+1}`,values:{'Traduzione':reads,'Con dato':reads+1,'Nativo 4 livelli':5}});
 }else if(mode==='balloon'){
  const target=Number(scenario),grant=Math.min(target,4);
  emit('Il guest ha quattro pagine vive e quattro cedibili','G0–G3 contengono dati dell’applicazione. G4–G7 sono libere nel guest ma hanno ancora backing host nel modello.',{values:{Richieste:target,Cedibili:4}});
  emit('Il driver prende solo le pagine cedibili',`Il balloon può ottenere ${grant} pagine. In questa prova non si aggiunge swap né reclaim dei dati vivi.`,{donated:grant,guestFree:4-grant});
  emit('Comunica i PFN al gestore host','Le pagine guest del balloon non sono disponibili alle applicazioni. La comunicazione permette di restituire il backing corrispondente.');
  emit('Il backing torna al pool host','I token H sono frame host recuperati. I dati vivi G0–G3 restano al loro posto.',{backing:8-grant});
  emit('Verifica il target','Capacità guest indisponibile e memoria host recuperata sono due viste della stessa operazione, non due copie dei dati.',{result:grant===target?`TARGET RAGGIUNTO: ${grant} backing recuperati`:`TARGET NON RAGGIUNTO: ${grant}/${target}; 2 pagine mancanti`,ok:grant===target,values:{'Backing recuperato':grant,'Guest libero':4-grant}});
  emit('Deflazione: il guest riottiene capacità','Le pagine tornano utilizzabili. Il backing verrà reso disponibile secondo il protocollo; non si garantiscono gli stessi frame fisici né i vecchi byte.',{donated:0,guestFree:4,backing:8,result:`DEFLAZIONE: guest ripristinato; target inflazione ${grant}/${target} ${grant===target?'raggiunto':'NON raggiunto'}`,ok:grant===target});
 }else if(mode==='ksm'){
  const same=scenario==='same',write=writer!=='none',cow=same&&write;
  emit('Confronta i byte, non i nomi delle pagine','A e B sono mapping anonimi ammessi a KSM. H0 e H1 sono frame fisici distinti e rimangono fermi.',{bytesB:same?'ABC':'DEF'});
  emit('Scansione e confronto dei contenuti',same?'I byte coincidono: il modello può fondere i mapping.':'I byte differiscono: nessuna fusione possibile. La scansione costa lavoro anche senza risparmio.');
  emit(same?'Entrambi i mapping puntano a H0':'Ogni mapping mantiene il proprio frame',same?'I riferimenti convergono su H0 in sola lettura; H1 è recuperabile. Non si sposta H0.':'A continua su H0 e B su H1.',{merged:same,mapB:same?0:1,physical:same?1:2});
  emit('Leggi da A e da B','Il contenuto visibile non cambia per effetto della fusione.');
  emit(write?`${writer} tenta di scrivere XYZ`:'Nessuna scrittura',cow?'Il mapping condiviso è in sola lettura: il fault di protezione avvia il copy-on-write.':write?'Mapping già privato: non serve una copia COW.':'La condivisione può restare finché non serve una copia privata.');
  emit(cow?'Copia H0 nel frame privato H1':'Nessuna copia necessaria',cow?'Prima si alloca e si copia; il mapping dello scrittore passa a H1. L’altro resta su H0.':'L’assenza di una scrittura condivisa evita questo costo.',{mapA:cow&&writer==='A'?1:0,mapB:cow?(writer==='B'?1:0):same?0:1,physical:cow?2:same?1:2});
  emit(write?'Ora applica la scrittura':'I mapping restano condivisi',write?'Solo il contenuto dello scrittore diventa XYZ. Il dirty bit non è il trigger della copia.':'Nessun frame privato viene creato senza necessità.',{bytesA:writer==='A'?'XYZ':'ABC',bytesB:writer==='B'?'XYZ':same?'ABC':'DEF'});
  emit('Confronta ciò che leggono A e B','La fusione non autorizza un mapping a modificare i dati osservati dall’altro.',{result:`A = ${writer==='A'?'XYZ':'ABC'}; B = ${writer==='B'?'XYZ':same?'ABC':'DEF'}; frame usati = ${same&&!write?1:2}`,values:{'Frame usati':same&&!write?1:2,'Copia COW':cow?'sì':'no'}});
 }else{
  const seg=latencySegments(scenario),total=seg.reduce((n,s)=>n+s.duration,0);let elapsed=0,useful=0;
  emit('Il task deve completare tre unità di lavoro utile','Unità temporali arbitrarie, identiche tra le prove. La preparazione viene pagata fuori dalla fase critica; non elimina ogni interferenza.',{total,values:{Deadline:amount,'Lavoro utile richiesto':3}});
  for(const s of seg)for(let j=0;j<s.duration;j++){elapsed++;if(s.useful)useful++;emit(s.useful?'Avanza il lavoro utile':`Il task attende: ${s.label}`,s.useful?'Il cursore del tempo e il progresso del task avanzano insieme.':'Il tempo passa ma il lavoro utile non aumenta. La durata è un’ipotesi didattica, non una misura.',{elapsed,useful});}
  emit('Confronta il completamento con la deadline','La memoria preparata evita questi percorsi nel modello, senza costituire una garanzia real-time del sistema.',{result:total<=amount?`DEADLINE RISPETTATA: ${total} ≤ ${amount}`:`DEADLINE SUPERATA: ${total} > ${amount}`,ok:total<=amount,values:{'Tempo totale':total,'Lavoro utile':useful}});
 }
 return out;
}
