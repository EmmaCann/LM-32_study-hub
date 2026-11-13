import type{Frame}from'./aos-models';
export type ContainerMode='pid'|'mount'|'network'|'cap';
export const containerModes:Record<ContainerMode,string>={pid:'Processi, PID e UTS',mount:'Cambio della radice',network:'Collegamento veth',cap:'Capabilities e minimo privilegio'};
export type ContainerFrame=Frame&{phase:number;x:number;y:number;permitted:boolean;effective:boolean;bounding:boolean;packet:boolean;hostName:string;boxName:string;rootDetached:boolean};
export function execCaps(i:number,fp:number,fi:number,b:number,a:number,fileEffective:boolean,privileged:boolean){const ambient=privileged?0:a,permitted=(i&fi)|(fp&b)|ambient;return{permitted,effective:fileEffective?permitted:ambient,ambient};}
export function containerTrace(mode:ContainerMode,scenario='ok'):ContainerFrame[]{
 const frames:ContainerFrame[]=[];const emit=(title:string,detail:string,phase:number,x:number,y:number,extra:Partial<ContainerFrame>={})=>frames.push({title,detail,phase,x,y,active:phase,values:{},permitted:false,effective:false,bounding:true,packet:false,hostName:'ubuntu-vm',boxName:'ubuntu-vm',rootDetached:false,...extra});
 if(mode==='pid'){
  emit('Il padre è nella vista iniziale','Il task padre resta nel namespace iniziale. Il kernel è uno solo; UTS e PID sono appartenenze indipendenti.',0,140,165);
  emit('clone: il figlio nasce nel nuovo ambiente','La shell nasce nel nuovo PID namespace: per l’host è 4242, per se stessa è 1. Non è la stessa shell spostata dopo la nascita e non sono due copie del task.',1,540,165,{values:{'PID host shell':4242,'PID interno shell':1}});
  emit('Cambia solo l’hostname del nuovo UTS','sethostname("box") cambia il nome dell’istanza UTS del figlio. L’host continua a vedere ubuntu-vm; versione del kernel e altri namespace non cambiano.',2,540,165,{boxName:'box',values:{'Hostname host':'ubuntu-vm','Hostname dentro':'box'}});
  emit('Un figlio della shell: altri due numeri','Il task worker è 4243 nella vista host e 2 in quella interna. Il padre può osservare entrambi; la vista figlia non include systemd dell’host.',3,690,310,{boxName:'box',values:{'PID host worker':4243,'PID interno worker':2}});
  emit('Una nuova procfs rende coerente ps','Il mount /proc deve corrispondere alla vista PID. Dopo il mount appropriato ps non usa più la procfs host. Il namespace da solo non cambia un vecchio mount.',4,690,310,{boxName:'box',values:{'/proc':'vista del namespace figlio'}});
 }else if(mode==='mount'){
  emit('Un albero, due riferimenti da distinguere','La directory rootfs è inizialmente sotto la root host. chroot cambia la risoluzione dei percorsi; questa scena mostra invece il cambio del root mount.',0,450,275);
  emit('Predisporre mount privati e rootfs come mount point','Lavoro nel nuovo mount namespace: propagazione privata e bind mount della directory su se stessa. I contenuti dei file non vengono copiati.',1,450,275);
  emit('pivot_root: rootfs diventa /','Il vecchio root viene ricollocato in /oldroot, sotto il nuovo. La nuova directory corrente deve essere /. Nessun file host è stato cancellato.',2,450,110);
  emit('Distacco della vecchia root','umount scollega /oldroot dalla vista. Riferimenti già aperti richiedono comunque attenzione: il cambio dei mount non revoca privilegi o file descriptor.',3,450,110,{rootDetached:true});
 }else if(mode==='network'){
  emit('Due stack di rete distinti','Il namespace nuovo non eredita eth0: ha solo lo, inizialmente DOWN. Le porte appartengono allo stack del rispettivo namespace.',0,250,220);
  emit('La coppia veth collega due endpoint','ve1 e ve2 sono le estremità dello stesso collegamento virtuale, una per namespace. Il collegamento esiste anche se gli endpoint non sono ancora utilizzabili.',1,250,220);
  emit(scenario==='down'?'Un endpoint resta DOWN':'Interfacce UP e indirizzi assegnati',scenario==='down'?'In questo scenario l’endpoint ve2 resta DOWN. Il cavo virtuale da solo non rende il collegamento operativo.':'ve1 è 192.168.1.100/24 e ve2 è 192.168.1.200/24: una rete locale compatibile. Gli indirizzi sono delle interfacce, non dei PID.',2,250,220);
  emit(scenario==='ok'?'Il peer riceve e risponde':'La richiesta si ferma',scenario==='internet'?'La destinazione è fuori dalla rete locale: questa configurazione non ha una rotta né NAT verso Internet. Il pacchetto si ferma al controllo di instradamento.':scenario==='down'?'Il pacchetto si ferma al collegamento non operativo: non attraversa magicamente un endpoint DOWN.':'La richiesta ICMP ha attraversato ve1 → ve2. Ora il peer risponde; il token è un pacchetto, non un processo che cambia namespace.',3,scenario==='ok'?650:scenario==='internet'?340:420,220,{packet:true,values:{'Raggiungibile':scenario==='ok'?'sì':'no'}});
  emit(scenario==='ok'?'La risposta torna al mittente':'Nessuna risposta',scenario==='ok'?'Il peer risponde lungo la coppia veth. Nessuna VM o kernel aggiuntivo è stato creato.':'Correggere il percorso richiede operazioni distinte: UP per l’endpoint oppure routing/inoltro appropriati per un’altra rete.',4,scenario==='ok'?250:scenario==='internet'?340:420,220,{packet:scenario==='ok',values:{'Esito':scenario==='ok'?'richiesta e risposta':'collegamento o rotta mancanti'}});
 }else{
  emit('Permitted consente, Effective è spento','Il privilegio è disponibile in P, ma il kernel non lo considera attivo finché manca da E. La chiave rappresenta l’autorizzazione attiva, non un bit trasferito fuori da P.',0,180,125,{permitted:true});
  emit('Attivazione applicata al thread','cap_set_flag modifica la copia cap_t; cap_set_proc applica la modifica. Ora P ed E contengono CAP_NET_BIND_SERVICE.',1,180,285,{permitted:true,effective:true});
  emit('bind consentito nel modello','La porta 80 è configurata come privilegiata in questo esempio. La capability attiva permette il bind; non concede tutti i poteri di root.',2,730,285,{permitted:true,effective:true,values:{'bind':'consentito'}});
  emit('DROP Bounding non spegne Effective','B perde la capability, ma E e P la conservano. PR_CAPBSET_DROP da solo non è una revoca dei privilegi correnti.',3,730,285,{permitted:true,effective:true,bounding:false,values:{'E sottoinsieme P':'sì','P sottoinsieme B':'no'}});
  emit('Abbassamento soltanto in Effective','CAP_CLEAR in E, applicato con cap_set_proc, spegne il privilegio corrente. La socket già associata resta aperta; P conserva la possibilità di riattivare E.',4,180,125,{permitted:true,bounding:false});
  emit('P permette ancora la riattivazione','Il thread può riportare la capability in E perché è ancora in P, anche se manca da B. Il diagramma E ⊆ P ⊆ B non è un invariante generale.',5,180,285,{permitted:true,effective:true,bounding:false});
  emit('Rinuncia ai privilegi correnti','Questa scena termina rimuovendo anche da P ed E. Una rinuncia robusta deve considerare inoltre I, A e i percorsi futuri di exec; non basta la sola operazione sul Bounding set.',6,180,125,{bounding:false,values:{'P ed E':'vuoti'}});
 }
 return frames;
}
