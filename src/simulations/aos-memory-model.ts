import type { Frame } from './aos-models';
export type MemoryMode='shootdown'|'buddy'|'walk'|'balloon'|'ksm'|'latency';
export type MemoryFrame=Frame & {x:number;y:number;phase:number;reads:number;safe:boolean};
export const modes:Record<MemoryMode,string>={shootdown:'TLB shootdown',buddy:'Buddy e frammentazione',walk:'Walk nativo e annidato',balloon:'Ballooning',ksm:'KSM e copy-on-write',latency:'Deadline e percorsi lenti'};
export function walkReads(guest:number,stage2:number){return stage2?guest*(stage2+1)+stage2:guest;}
export function buddyOf(p:number,order:number){return p^(2**order);}
export function memoryTrace(mode:MemoryMode,alternative:boolean):MemoryFrame[]{
 const out:MemoryFrame[]=[];
 const emit=(title:string,detail:string,x:number,y:number,phase:number,values:Frame['values']={},safe=false,reads=0)=>out.push({title,detail,x,y,phase,values,safe,reads,active:phase});
 if(mode==='shootdown'){
  emit('La PTE cambia, le altre TLB no','Il core 0 rimuove il mapping e invalida la propria voce. I core 1 e 2 possono conservare una traduzione vecchia dello stesso spazio di indirizzi.',150,150,0,{'ACK':0});
  emit('Invio delle IPI mirate','La richiesta raggiunge i core interessati. Il core 3 esegue un altro spazio: non è un destinatario automatico.',450,120,1,{'ACK':0});
  emit('Il core 1 invalida e risponde','La prima conferma non basta: una copia obsoleta può restare nel core 2.',150,240,2,{'ACK':1});
  emit('Anche il core 2 conferma','Il protocollo aspetta tutte le conferme richieste, con l’ordinamento necessario.',150,300,3,{'ACK':2});
  emit('Il frame può cambiare proprietario','Dopo l’invalidazione completa il frame può essere riutilizzato: nessun vecchio mapping deve ancora consentirne l’accesso.',720,380,4,{'ACK':2},true);
 }else if(mode==='buddy'){
  if(alternative){
   emit('RAM libera, ma a intervalli','Otto frame: P0, P2, P4 e P6 sono occupati; gli altri sono liberi. Quattro pagine libere non formano un blocco contiguo di quattro.',90,160,0,{'Liberi':4,'Massimo blocco libero':1});
   emit('Una richiesta di quattro pagine non entra','Il buddy non può unire pagine che non sono buddy liberi dello stesso ordine. La compattazione è un lavoro diverso.',780,160,1,{'Richiesta':4,'Esito':'non soddisfatta'});
   emit('Migrazione di pagine mobili','Esempio idealizzato: P2, P4 e P6 vengono copiati in altri frame. L’identità della pagina non coincide con il numero del frame.',780,310,2,{'Pagine migrate':3});
   emit('Quattro frame contigui disponibili','I frame 4–7 ora formano un blocco di ordine 2. Nella realtà pagine non mobili e vincoli possono impedire questo risultato.',780,310,3,{'Massimo blocco libero':4},true);
  }else{
   const texts=[['16 KiB liberi','Un blocco di ordine 2 contiene quattro frame base.'],['Split: due blocchi da 8 KiB','Il blocco viene diviso in due buddy allineati.'],['Split: due blocchi da 4 KiB','Solo il buddy sinistro viene diviso ancora.'],['Assegna A1','Una richiesta da 4 KiB occupa A1. A2 e B restano nelle rispettive liste libere.'],['Libera A1 e unisci con A2','A1 e A2 sono liberi, della stessa dimensione e allineati: si ricostruisce A.'],['Unisci A con B','Anche B è libero: si ricostruisce il blocco originale da 16 KiB.']];
   texts.forEach(([t,d],k)=>emit(t,d,130+k*120,150,k,{'Ordine massimo libero':k===0||k===5?2:1,'A1':k===3?'occupato':'libero'},k===5));
  }
 }else if(mode==='walk'){
  const g=alternative?3:4,s=alternative?3:4;
  emit('Un accesso, più traduzioni','Modello senza hit nelle cache. Ogni riga è una entry della gerarchia guest; prima di leggerla bisogna tradurne il GPA.',80,80,0,{'Livelli guest':g,'Livelli stage 2':s,'Letture traduzione':0});
  let n=0;
  for(let row=0;row<g;row++){
   for(let col=0;col<s;col++)emit('Stage 2 per la PTE guest '+(row+1),'Questa lettura appartiene a EPT/NPT e traduce l’indirizzo della entry guest, non ancora quello del dato finale.',150+col*135,105+row*62,1,{'Riga guest':row+1,'Letture traduzione':++n},false,n);
   emit('Leggi la PTE guest '+(row+1),'Ora la entry guest è raggiungibile in memoria fisica host; contiene l’indirizzo del livello guest successivo o del dato.',150+s*135,105+row*62,2,{'Letture traduzione':++n},false,n);
  }
  for(let col=0;col<s;col++)emit('Stage 2 per il dato finale','Il GPA finale richiede la propria traduzione. I risultati intermedi possono essere riutilizzati dalle cache reali.',150+col*135,105+g*62,3,{'Letture traduzione':++n},false,n);
  emit('Traduzione conclusa, poi accesso al dato',`${g}(${s}+1)+${s} = ${n} letture per tradurre, più una per il dato. Un walk nativo a ${g} livelli ne richiederebbe ${g}, più il dato. Sono conteggi senza cache, non latenze misurate.`,150+s*135,105+g*62,4,{'Letture traduzione':n,'Con dato':n+1,'Nativo, con dato':g+1},true,n);
 }else if(mode==='balloon'){
  emit('Backing host e pagine guest','Il modello mostra otto pagine guest, di cui quattro occupate. I frame host che le supportano sono una risorsa distinta.',150,140,0,{'Pagine balloon':0,'Backing restituito':0});
  emit('Il driver ottiene pagine dal guest','Il driver seleziona pagine che il guest può cedere; non sottrae arbitrariamente i dati vivi dell’applicazione.',500,210,1,{'Pagine balloon':2,'Backing restituito':0});
  emit('Segnala i PFN al gestore host','Il guest considera le pagine del balloon indisponibili per l’uso ordinario. L’host può recuperare il backing fisico corrispondente.',650,300,2,{'Pagine balloon':2,'Backing restituito':2});
  emit('I frame host tornano al pool','Si muovono i token dei frame host: i dati dell’applicazione non vengono spostati nel balloon.',760,380,3,{'Pagine balloon':2,'Backing restituito':2},true);
  emit('Deflazione: capacità di nuovo al guest','Il protocollo rende nuovamente utilizzabili le pagine. Il backing può essere ripristinato secondo il sistema: le capacità guest e host restano concetti distinti.',500,210,4,{'Pagine balloon':0,'Backing restituito':0},true);
 }else if(mode==='ksm'){
  emit('Due pagine, contenuto identico','Due mapping anonimi ammessi a KSM hanno frame distinti con gli stessi byte. L’identità dei mapping viene conservata.',280,230,0,{'Frame host':2});
  emit('Confronto e fusione protetta','KSM confronta i contenuti e fa convergere i riferimenti su un frame in sola lettura; uno dei backing può essere recuperato.',450,230,1,{'Frame host':1});
  emit('Letture condivise','Entrambi leggono lo stesso contenuto. La fusione consuma lavoro di scansione e non è applicata automaticamente a ogni pagina del sistema.',450,230,2,{'Frame host':1});
  emit('Scrittura: fault di protezione','Il mapping A tenta una scrittura. Il permesso di sola lettura provoca il fault che permette al kernel di predisporre una copia privata.',280,230,3,{'Frame host':2});
  emit('Due copie possono divergere','A aggiorna la propria copia; B continua a vedere il contenuto precedente. Il dirty bit non era il trigger della duplicazione.',280,230,4,{'Frame host':2},true);
 }else{
  const total=alternative?4:9;
  const stages=alternative?['Buffer già preparati','Esecuzione utile','Esecuzione utile','Lavoro completato']:['Esecuzione utile','Primo accesso','Minor fault','Ripresa','Richiesta e direct reclaim','Direct compaction','Compattazione in corso','Ripresa','Lavoro completato'];
  stages.forEach((t,k)=>emit(t,alternative?'Preallocazione, pre-fault e lock verificati spostano parte del lavoro nell’inizializzazione. Non eliminano ogni interferenza del sistema.':'La stessa attività può incontrare percorsi più lunghi. La timeline è qualitativa: non è una misura né un limite massimo garantito.',110+k*75,200,k,{'Unità illustrative':k,'Deadline':6,'Esito':k>6?'deadline superata':k===total-1?'completato':'in corso'},k===total-1));
 }
 return out;
}
