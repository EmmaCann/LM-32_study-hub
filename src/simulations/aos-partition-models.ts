import type {Frame} from './aos-models';
export function partitionTrace(fault:boolean):Frame[]{
 const steps=[['Linux avvia la macchina','La root futura usa inizialmente i quattro core. Le icone rappresentano proprietà delle risorse, non core fisici che si spostano.'],['Enable: nasce la root cell','Jailhouse si attiva sotto Linux. Il dominio di gestione è ora root cell.'],['Create del cluster','Il core 1 e le risorse previste vengono tolti alla root e assegnati alla cella cluster.'],['Load del cluster','Il binario è caricato nella RAM assegnata, ma non è ancora in esecuzione.'],['Start del cluster','Il core 1 inizia a eseguire l’inmate bare metal.'],['Create della cella IVI','I core 2 e 3 passano dalla root all’IVI. Il core 0 rimane alla root.'],['Load e start dell’IVI','Il Linux dell’infotainment parte sulle sue risorse. Non usa i core del cluster.'],[fault?'Accesso alla RAM privata altrui':'Accesso autorizzato',fault?'L’IVI tenta una scrittura vietata. L’accesso è bloccato e il core responsabile può essere parcheggiato; il core cluster non viene ceduto.':'L’IVI legge soltanto la regione condivisa autorizzata. I confini della memoria privata restano invariati.'],['Gestione del recupero',fault?'Un supervisore può rilevare il guasto e distruggere/ricaricare/riavviare l’IVI. Il riavvio non è una proprietà automatica dell’isolamento.':'Le celle proseguono; il piano amministrativo resta distinto dal loro lavoro ordinario.']];
 return steps.map(([title,detail],i)=>({title,detail,active:i,values:{'Root':i<2?'0,1,2,3':i<5?'0,2,3':'0','Cluster':i>=2?'1':'—','IVI':i>=5?'2,3':'—','Core cluster in esecuzione':i>=4?'sì':'no','Accesso IVI':i===7&&fault?'negato':'nessuna violazione'}}));
}
export function ivshmemTrace(interrupt:boolean):Frame[]{
 const steps=[['Due celle, una regione autorizzata','A può scrivere nel proprio output; B lo legge. La RAM privata delle celle non viene resa condivisa.'],['A scrive il payload','Il messaggio arriva nella regione condivisa. Una normale scrittura non genera automaticamente un interrupt.'],['A pubblica il nuovo dato','Indici e payload vengono pubblicati con l’ordinamento previsto dal protocollo. Il lettore può individuare il lavoro pronto.'],[interrupt?'A scrive il doorbell':'B attende il prossimo controllo',interrupt?'A indirizza il vettore al peer B. Si muove una notifica, non il messaggio in RAM.':'Il polling periodico controlla lo stato, come nel cockpit. Nessun doorbell è richiesto per questo passo.'],[interrupt?'Jailhouse notifica B':'B osserva il contatore',interrupt?'Il destinatario valido e abilitato riceve l’interrupt. Non è una copia del payload.':'B vede che la pubblicazione è avanzata e può consumare i nuovi frame.'],['B legge il payload','Il dato viene letto dalla stessa regione fisica condivisa. La notifica non sostituisce il controllo dello stato.']];
 return steps.map(([title,detail],i)=>({title,detail,active:i,values:{'Payload':i?'RAM condivisa':'non scritto','Pubblicato':i>=2?'sì':'no','Metodo':interrupt?'doorbell':'polling','B legge':i===5?'sì':'no'}}));
}
export type RingState={w:number;r:number;lost:number;slots:number[];action:string;read?:number};
export function ringStates(size:number,slow:boolean):RingState[]{
 let w=0,r=0,lost=0;const slots=Array<number>(size).fill(0);
 const states:RingState[]=[{w,r,lost,slots:[...slots],action:'inizio'}];
 const ops=slow?['W','W','W','W','W','W','W','W','W','W','R','R']:['W','R','W','R','W','R','W','R','W','R','W','R'];
 for(const op of ops){let read:number|undefined;
  if(op==='W'){slots[w%size]=w+1;w++;}
  else {const oldest=Math.max(0,w-size);if(r<oldest){lost+=oldest-r;r=oldest;}if(r<w){read=slots[r%size];r++;}}
  states.push({w,r,lost,slots:[...slots],action:op==='W'?'pubblica':'legge',read});
 }
 return states;
}
export function ringTrace(size:number,slow:boolean):Frame[]{return ringStates(size,slow).map((s,i)=>({title:i===0?'Ring vuoto':s.action==='pubblica'?`Pubblicato frame ${s.w}`:`Il lettore consuma frame ${s.read}`,
 detail:s.w-s.r>size?`Il produttore non attende. ${s.w-s.r-size} frame non letti sono già sovrascritti. L’indice privato del lettore non è stato scritto dal produttore.`:s.action==='legge'?`Il lettore aggiorna il proprio rd. Frame persi rilevati e saltati: ${s.lost}. È una politica illustrativa di riallineamento.`:'Ogni slot mantiene la propria posizione; cambiano contenuto e cursore. Demo reale: 64 slot da 32 byte; qui la capacità è ridotta.',active:i,
 values:{'Pubblicazioni w':s.w,'Letture/indice r':s.r,'Posizione prossima scrittura':s.w%size,'Frame persi':s.lost+Math.max(0,s.w-s.r-size),'Lettura':s.read??'—'}}));}
export type CacheState={sets:(string|null)[];access:string;set:number;evicted:string|null;criticalHit:boolean};
export function cacheStates(colored:boolean):CacheState[]{
 const sets:(string|null)[]=Array(4).fill(null);const events=[['C0',0],['C1',1],['N0',colored?2:0],['N1',colored?3:1],['C0',0],['C1',1]] as const;
 return [{sets:[...sets],access:'inizio',set:-1,evicted:null,criticalHit:false},...events.map(([access,set])=>{const previous=sets[set],hit=previous===access;sets[set]=access;return {sets:[...sets],access,set,evicted:previous!==access?previous:null,criticalHit:access.startsWith('C')&&hit};})];
}
export function cacheTrace(colored:boolean):Frame[]{return cacheStates(colored).map((s,i)=>({title:i===0?'Cache del modello vuota':`${s.access} → gruppo ${s.set}`,
 detail:i===0?'Modello didattico di quattro gruppi a una sola linea: non è la geometria di una CPU reale.':s.evicted?`L’accesso espelle ${s.evicted}. ${colored?'I colori disgiunti evitano qui espulsioni tra domini.':'Con gruppi condivisi il lavoro non critico può espellere linee del cluster.'}`:s.criticalHit?'La linea critica è ancora presente: hit nel modello. La banda DRAM e il bus restano risorse da analizzare.':'La linea occupa il gruppo assegnato. I colori vincolano le pagine fisiche, non sono colori dei dati applicativi.',active:i,values:{'Coloring':colored?'disgiunto':'non applicato','Accesso':s.access,'Gruppo':s.set,'Espulsa':s.evicted??'nessuna','Hit critico':s.criticalHit?'sì':'no'}}));}
