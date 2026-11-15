import type {Frame} from './aos-models';
export type ModuleMode='lifecycle'|'dependency'|'atomic';
export const moduleModes:Record<ModuleMode,string>={lifecycle:'Caricamento e parametri',dependency:'Dipendenze e riferimenti',atomic:'Due CPU, un contatore'};
export const moduleCases:Record<ModuleMode,readonly(readonly[string,string])[]>={lifecycle:[['valid','Init valida, poi cambia name'],['invalid','times=20: init rifiuta'],['version','Kernel incompatibile'],['signature','Firma rifiutata dalla policy']],dependency:[['held','Uso e rimozione ordinata'],['reload','Ricarica solo consumer'],['reset','Ricarica anche provider'],['missing','Consumer senza provider']],atomic:[['plain','Incremento ordinario'],['atomic','Read-modify-write atomica']]};
export type ModuleFrame=Frame&{provider:boolean;consumer:boolean;ticket:number;ref:number;value:number;name:string;live:boolean;init:boolean;exit:boolean;error:boolean;result:string};
export function modulesTrace(mode:ModuleMode,scenario:string):ModuleFrame[]{
 if(!moduleCases[mode].some(([id])=>id===scenario))throw new RangeError('Scenario sconosciuto');
 return Array.from({length:7},(_,i)=>{
  let title='',detail='',result='',provider=false,consumer=false,ticket=0,ref=0,value=5,name='Alice',live=false,init=false,exit=false,error=false;
  if(mode==='lifecycle'){
   const early=scenario==='version'||scenario==='signature',valid=scenario==='valid';
   title=['File sul disco','Controlli del loader','Init e validazione','Modulo disponibile','Scrittura del parametro','Rimozione','Stato finale'][i];
   init=!early&&i>=2;live=valid&&i>=3&&i<=4;exit=valid&&i>=5;error=!valid&&i>=(early?1:2);name=i>=4&&valid?'Bob':'Alice';
   result=valid?'RIMOSSO: 3 saluti Alice; goodbye Bob; init una volta':early?(scenario==='version'?'RIFIUTATO: compatibilità kernel; init non eseguita':'RIFIUTATO: firma/policy; init non eseguita'):'-EINVAL: init fallita; exit non chiamata';
   detail=early?'Il modello arresta il file al controllo selezionato; non rappresenta l’ordine interno completo del loader.':!valid?'times=20 è un int valido ma init lo rifiuta. Il rollback del lavoro parziale appartiene a init; exit non è una scorciatoia di cleanup.':i<4?'Il loader prepara il modulo; init valida times=3, stampa tre saluti e salva il tempo. Dopo il ritorno 0 il modulo resta disponibile, senza un main dedicato.':'La scrittura runtime aggiorna name da Alice a Bob: init non riparte e i tre saluti non vengono ripetuti. La rimozione consentita legge il nome aggiornato.';
  }else if(mode==='dependency'){
   const missing=scenario==='missing';provider=!missing&&i>=1;consumer=provider&&i>=2;ticket=consumer?2:0;
   title=['Due oggetti sul disco','Carica provider','Risolvi l’export','Provider ancora in uso','Rilascia i riferimenti','Prova il riavvio','Stato finale'][i];
   if(missing){error=i>=2;result='UNKNOWN SYMBOL: consumer non caricato';detail='insmod non carica le dipendenze: il consumer non trova advos_next_ticket. Nessuna init consumer e nessun ticket assegnato.';}
   else{
    if(i===3)error=true;
    if(i>=4){consumer=false;if(scenario==='held'){if(i>=5)provider=false;ticket=provider?2:0;}else if(scenario==='reload'){consumer=i>=5;ticket=i>=5?4:2;}else{provider=i>=5;consumer=i>=5;ticket=i>=5?2:0;}}
    result=scenario==='held'?'RIMOSSI: prima consumer, poi provider':scenario==='reload'?'TICKET 3 E 4: provider mai rimosso':'TICKET 1 E 2: provider reinizializzato';
    detail=i===3?'rmmod provider viene rifiutato: il consumer mantiene un riferimento. Due chiamate non significano Used by=2.':scenario==='reload'?'Rimuovere e ricaricare soltanto consumer conserva ticket nel provider: la seconda coppia è 3,4.':scenario==='reset'?'Dopo aver rimosso consumer si può rimuovere provider. Il nuovo caricamento reinizializza ticket: la coppia riparte da 1,2.':'Il simbolo deve essere disponibile prima del consumer; la rimozione segue l’ordine inverso. Used by conta il riferimento, non i ticket.';
   }ref=consumer?1:0;
  }else{
   const atomic=scenario==='atomic';value=atomic?(i>=4?7:i>=2?6:5):(i>=3?6:5);
   title=['Valore condiviso 5',atomic?'A: inizia RMW':'A legge 5',atomic?'A ottiene 6':'B legge ancora 5',atomic?'B: inizia RMW':'A scrive 6',atomic?'B ottiene 7':'B scrive 6','Confronta i ticket','Stato finale'][i];
   result=atomic?'VALORE 7: ticket 6 e 7, nessun incremento perso':'VALORE 6: due ticket 6, un incremento perso';
   detail=atomic?'Le RMW sono serializzate sul contatore condiviso. Una RMW comprende incremento e ritorno del nuovo valore; il lucchetto visuale rappresenta l’esclusione dell’operazione, non un mutex aggiunto al sorgente.':'Interleaving illustrativo: entrambi leggono 5 prima delle scritture. Letture e scritture singole non rendono atomica la sequenza read-modify-write. Anche su x86 occorre la semantica atomica appropriata.';
  }
  return {title,detail:i===6?`${detail} ${result}.`:detail,active:i,values:{Esito:i===6?result:'in corso','Used by provider':ref,'Ticket provider':provider?ticket:'non residente','Valore condiviso':value,'Parametro name':name,'Init eseguita':init?'sì':'no','Exit eseguita':exit?'sì':'no'},provider,consumer,ticket,ref,value,name,live,init,exit,error,result};
 });
}
