import type { Frame } from './aos-models';
export type ContainerMode='pid'|'mount'|'network'|'cap';
export const containerModes:Record<ContainerMode,string>={pid:'Processi, PID e UTS',mount:'Cambio della radice',network:'Collegamento veth',cap:'Capabilities e minimo privilegio'};
export const experiments:Record<ContainerMode,[string,string][]>= {
 pid:[['fresh','Dentro: /proc rimontato'],['stale','Dentro: vecchio /proc host'],['host','Osservatore host']],
 mount:[['host','Prima: root host'],['chroot','Solo chroot(rootfs)'],['pivot','Pivot: /oldroot presente'],['detached','Dopo distacco di /oldroot']],
 network:[['ok','Peer: rete locale pronta'],['down','Peer: ve2 DOWN'],['internet','Server esterno: rotta assente'],['routed','Server esterno: percorso completo']],
 cap:[['flag','Solo cap_set_flag sulla copia'],['apply','Flag + cap_set_proc sul thread'],['drop','Solo DROP Bounding, E già attivo'],['revoke','Revoca da E e P']]
};
export type ContainerFrame=Frame&{phase:number;x:number;y:number;permitted:boolean;effective:boolean;bounding:boolean;localEffective:boolean;rows:string[];result:string;allowed:boolean};
// Maschere ridotte, caso ordinario non-root; non emula tutte le regole Linux.
export function execCaps(i:number,fp:number,fi:number,b:number,a:number,fe:boolean,privileged:boolean){const ambient=privileged?0:a,permitted=(i&fi)|(fp&b)|ambient;return{permitted,effective:fe?permitted:ambient,ambient};}
export const experimentDefault=(mode:ContainerMode)=>experiments[mode][0][0];
export function containerTrace(mode:ContainerMode,scenario=experimentDefault(mode),path='/etc/passwd'):ContainerFrame[]{
 if(!experiments[mode].some(([v])=>v===scenario))throw new RangeError('Esperimento sconosciuto');
 const frames:ContainerFrame[]=[];
 const emit=(title:string,detail:string,x:number,y:number,extra:Partial<ContainerFrame>={})=>{const phase=frames.length;frames.push({title,detail,x,y,phase,active:phase,values:{},permitted:true,effective:false,bounding:true,localEffective:false,rows:[],result:'',allowed:false,...extra});};
 if(mode==='pid'){
  const inside=scenario!=='host',fresh=scenario==='fresh',rows=fresh?['1  sh       [A]','2  worker   [B]','3  ps       [C]']:['1     systemd','812   shell host','4242  sh     [A]','4243  worker [B]','4244  ps     [C]'];
  emit('Prevedi: che cosa mostrerà ps?',inside?'Il chiamante è nel PID namespace figlio. Confronta due mount /proc mantenendo invariato il task.':'Il chiamante è la shell host.',115,170);
  emit('getpid() interroga il task',`Restituisce ${inside?'1':'812'}: non ricava il PID leggendo /proc.`,115,255,{values:{'getpid()':inside?1:812}});
  emit('ps apre il mount /proc',fresh?'La procfs è montata per il namespace figlio.':'La procfs è quella host, anche se il chiamante può essere nel namespace figlio.',440,255);
  emit('La sorgente dei dati determina la vista',fresh?'La scansione elenca i task del namespace figlio.':'La scansione legge i PID host: compaiono anche i processi degli antenati nella vista di questa procfs.',440,350,{rows});
  emit('Riconosci A e B nelle righe','I tag A/B identificano gli stessi task; cambiano i numeri nella vista, non le identità.',570,255,{rows});
  emit(fresh?'getpid() e ps sono coerenti':inside?'getpid() = 1, ma ps mostra i PID host':'Entrambe le operazioni osservano l’host',inside&&!fresh?'La discrepanza è causata dal vecchio mount /proc. Rimontalo nella prova e confronta.':'Cambia l’osservatore o il mount e ripeti: il risultato deve essere prevedibile.',720,255,{rows,result:rows.join('\n'),allowed:fresh||!inside,values:{'getpid()':inside?1:812,'procfs':fresh?'figlio':'host'}});
 }else if(mode==='mount'){
  if(!['/etc/passwd','/oldroot/etc/passwd'].includes(path))throw new RangeError('Percorso non previsto');
  const old=path.startsWith('/oldroot'),host=scenario==='host',found=!old||scenario==='pivot',hostFile=host||old,px=hostFile?230:690;
  const result=found?(hostFile?'HOST: account dell’host':'BOX: account del rootfs'):'ENOENT: percorso non trovato';
  emit('Due file omonimi, due contenuti',`Cerchiamo ${path}. La risoluzione parte dal riferimento / del processo.`,450,140);
  emit('Scegli la radice della ricerca',host?'La / punta al root host.':'La / punta a rootfs. I file non vengono copiati o spostati.',host?230:690,240);
  emit(old?'Cerca il collegamento oldroot':'Cerca la directory etc',old?(found?'/oldroot collega il vecchio root host.':'In questa configurazione /oldroot non è raggiungibile.'):'Lo stesso nome viene risolto sotto la radice selezionata.',old?(found?230:550):px,350);
  emit(found?'Raggiungi il file passwd':'La ricerca si ferma',found?'Il token segue i collegamenti della vista. Il contenuto finale dipende dal file raggiunto.':'Il vecchio mount può esistere altrove, ma non è raggiungibile tramite questo percorso.',found?px:550,390);
  emit('Leggi l’esito',result,found?px:550,390,{result,allowed:found});
  emit(found?'Percorso risolto':'Percorso non trovato',scenario==='chroot'?'Questo è il comportamento ordinario dei percorsi. chroot da solo non è una sandbox: cwd, fd e privilegi richiedono attenzione.':'Confronta prima e dopo il distacco di /oldroot usando lo stesso percorso.',found?px:550,390,{result,allowed:found,values:{'Percorso':path,'Esito':result}});
 }else if(mode==='network'){
  const external=['internet','routed'].includes(scenario),link=scenario!=='down',route=scenario!=='internet',ok=link&&route,dst=external?'203.0.113.10':'192.168.1.200',stop=route?300:225;
  emit('Prevedi: il destinatario è raggiungibile?',`Richiesta da 192.168.1.100 a ${dst}. Indirizzi delle interfacce, non dei PID.`,150,250);
  emit('Controlla prima la rotta',route?(external?'In questa prova sono predisposti rotta, inoltro host e percorso di ritorno.':'La rotta connessa /24 seleziona ve1.'):'Il destinatario è fuori dalla /24 e manca una rotta: non si raggiunge la veth.',route?150:225,route?250:285);
  emit(link?'Attraversa la coppia veth':'ve2 è DOWN',!route?'Il pacchetto resta nel namespace mittente.':link?'Un’estremità consegna il pacchetto all’altra.':'Il collegamento virtuale esiste ma non è operativo.',ok?450:stop,route?250:285);
  emit(ok?(external?'Inoltro verso la rete esterna':'Il peer riceve la richiesta'):'Nessuna consegna',ok?(external?'È necessario il percorso esterno completo: la sola veth non lo crea.':'La destinazione è l’endpoint ve2.'):'Osserva il punto di arresto: link e instradamento sono condizioni diverse.',ok?(external?760:450):stop,ok||route?250:285);
  emit(ok?'La risposta torna verso il mittente':'Nessuna risposta',ok?'Anche il cammino di ritorno deve essere valido.':'Confronta la stessa destinazione con la configurazione funzionante.',ok?450:stop,ok||route?250:285);
  emit(ok?'Ping riuscito nel modello':'Ping non riuscito',ok?'Tra i namespace sono transitati pacchetti, non processi.':'Ripara la condizione mancante e ripeti l’esperimento.',ok?150:stop,ok||route?250:285,{allowed:ok,result:ok?'echo reply ricevuta':!route?'Network unreachable: rotta assente':'nessuna consegna: endpoint DOWN',values:{'Destinazione':dst,'Link UP':link?'sì':'no','Percorso':route?'disponibile':'assente'}});
 }else{
  const initial=['drop','revoke'].includes(scenario),apply=scenario==='apply',effective=apply||scenario==='drop',permitted=scenario!=='revoke',bounding=scenario!=='drop',local=scenario!=='revoke',editsCopy=['flag','apply'].includes(scenario);
  emit('Un privilegio disponibile non è sempre attivo','La porta 80 è privilegiata in questo modello. cap_t è una copia locale; P/E/B appartengono al thread.',150,160,{effective:initial,localEffective:initial});
  emit(editsCopy?'Modifica la copia cap_t':scenario==='drop'?'Togli la capability da Bounding':'Revoca da E e P',editsCopy?'cap_set_flag modifica la copia, non ancora il thread.':scenario==='drop'?'Il thread parte con E attivo. DROP B non cancella E/P.':'Si rinuncia ai privilegi correnti. Altri percorsi futuri sono fuori da questa prova.',150,160,{effective:initial,localEffective:local});
  emit(apply?'Applica con cap_set_proc':'Osserva lo stato del thread',apply?'La copia viene applicata: il kernel vede E=1.':scenario==='flag'?'La copia dice E=1, ma nel thread E è ancora 0.':scenario==='drop'?'B=0, P=1, E=1. Il privilegio resta attivo.':'P=0, E=0: il privilegio corrente è stato rimosso.',apply?560:150,160,{effective,permitted,bounding,localEffective:local});
  const result=effective?'bind: consentito':'bind: Permission denied',state={effective,permitted,bounding,localEffective:local};
  emit('bind arriva al controllo del kernel','Il kernel controlla E del thread, non la variabile cap_t.',800,350,state);
  emit(effective?'Il gate si apre':'Il gate resta chiuso',result,800,350,{...state,result,allowed:effective});
  emit(effective?'Associazione riuscita':'Associazione rifiutata',scenario==='flag'?'Prova la stessa modifica seguita da cap_set_proc e confronta.':scenario==='drop'?'Confronta DROP B con la revoca da E/P: non hanno lo stesso effetto.':'Ora puoi collegare lo stato degli insiemi all’operazione consentita o rifiutata.',800,350,{...state,result,allowed:effective,values:{P:permitted?1:0,E:effective?1:0,B:bounding?1:0}});
 }
 return frames;
}
