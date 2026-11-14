'use client';
import {useId} from 'react';
import {P,mix,Wire,Signal,Pill,Chip,MemorySlab,Header,type Point} from './aos-architecture-primitives';
import type {ContainerMode,ContainerFrame} from './aos-container-model';
import './aos-container-scenes.css';
type View={a:ContainerFrame;b:ContainerFrame;t:number;scenario:string;path:string;uid:string};
function Trace({points,t,tag,uid,color=P.cyan}:{points:Point[];t:number;tag:string;uid:string;color?:string}){return <Signal points={points} t={t} tag={tag} uid={uid} color={color} probe='experiment'/>;}
function Task({x,y,id,host,local,active=false,color=P.cyan}:{x:number;y:number;id:string;host:number;local?:number;active?:boolean;color?:string}){return <g data-task-id={id} transform={`translate(${x} ${y})`}>
 <circle r={active?28:23} fill='#10273b' stroke={color} strokeWidth={active?3:1.5}/><text y={6} textAnchor='middle' className='mv-label' style={{fill:color}}>{id}</text>
 <text y={-42} textAnchor='middle' className='mv-code' style={{fill:P.muted}}>host {host}</text>
 {local!==undefined&&<g transform='translate(-29 36)'><rect width={58} height={26} rx={13} fill='#183e4d' stroke={color} strokeOpacity={.4}/><text x={29} y={18} textAnchor='middle' className='mv-code' style={{fill:color}}>PID {local}</text></g>}
 </g>;}
function Pid({a,t,scenario,uid}:View){
 const k=a.phase,fresh=scenario==='fresh',inside=scenario!=='host',caller:Point=inside?[300,300]:[115,370],scope:Point=fresh?[300,300]:[115,250];
 const routes:Point[][]=[[[580,260],[600,260],[600,207],[655,207]],[caller,[caller[0],450],[430,450]],[[430,450],scope,[580,scope[1]],[580,335],[630,335]],[[300,300],[580,300],[580,375],[630,375]],[[630,375],[830,375]],[[830,375],[830,375]]];
 return <>
 <Header kicker='01 / IDENTITÀ E VISTE' title='Gli stessi task. Due numerazioni. Una sorgente per ps.' subtitle='Il PID namespace e il namespace UTS sono distinti; qui il task appartiene a entrambi.'/>
 <path d='M28 145H550L578 173V490H28Z' fill='#102338' stroke={fresh?P.line:P.cyan} strokeWidth={fresh?1:2}/>
 <text x={48} y={172} className='mv-tiny' style={{fill:P.cyan}}>HOST · UTS ubuntu-vm</text>
 <path d='M225 195H543V425H225Z' fill='#1e203c' fillOpacity={.8} stroke={fresh?P.violet:'#554471'} strokeWidth={fresh?2:1}/>
 <text x={244} y={220} className='mv-tiny' style={{fill:P.violet}}>PID NAMESPACE FIGLIO · UTS box</text>
 <Task x={115} y={250} id='init' host={1}/><text x={115} y={288} textAnchor='middle' className='mv-tiny'>systemd</text>
 <Task x={115} y={370} id='sh' host={812} active={!inside}/><text x={115} y={408} textAnchor='middle' className='mv-tiny'>shell host</text>
 {(['A','B','C']as const).map((id,j)=><Task key={id} x={300+j*96} y={300} id={id} host={4242+j} local={j+1} color={P.violet} active={inside&&j===0}/>)}
 <text x={300} y={388} textAnchor='middle' className='mv-tiny'>sh</text><text x={396} y={388} textAnchor='middle' className='mv-tiny'>worker</text><text x={492} y={388} textAnchor='middle' className='mv-tiny'>ps</text>
 <Pill x={225} y={444} text={fresh?'/proc · vista figlio':'/proc · vista host'} color={fresh?P.violet:P.cyan}/>
 <Wire d='M578 450H615V330' color={fresh?P.violet:P.cyan} dashed={k<2}/>
 <g transform='translate(615 145)'><path d='M0 0H240L255 15V345H0Z' fill='#091629' stroke='#3f5d7e'/><circle cx={16} cy={17} r={3} fill={P.red}/><circle cx={29} cy={17} r={3} fill={P.amber}/><circle cx={42} cy={17} r={3} fill={P.green}/><text x={16} y={62} className='mv-code' style={{fill:P.cyan}}>getpid() = {k>=1?(inside?'1':'812'):'?'}</text><path d='M16 85H235' stroke={P.line}/><text x={16} y={112} className='mv-tiny' style={{fill:P.muted}}>ps → /proc {fresh?'figlio':'host'}</text>
 {k<3?<text x={16} y={154} className='mv-code' style={{fill:P.muted}}>in attesa...</text>:a.rows.map((row,j)=><g key={row}><path d={`M7 ${149+j*31}v16`} stroke={row.includes('[A]')?P.violet:row.includes('[B]')?P.cyan:P.line} strokeWidth={3}/><text x={16} y={163+j*31} className='mv-code'>{row}</text></g>)}
 </g>
 <text x={34} y={549} className='mv-small'>A, B e C mantengono la propria identità: ps cambia vista in base alla procfs montata.</text>
 {k<5&&<Trace points={routes[k]} t={t} tag={k===0?'getpid':k===1?'ps':'lettura /proc'} uid={uid} color={fresh?P.violet:P.cyan}/>}
 </>;
}
function Volume({x,y,name,color}:{x:number;y:number;name:string;color:string}){return <g transform={`translate(${x} ${y})`}>
 {[18,9,0].map(offset=><path key={offset} d={`M-76 ${offset}l76-28 76 28-76 28Z`} fill='#16283d' stroke={color} strokeOpacity={.7}/>)}
 <path d='M-76 0v37l76 28 76-28V0L0 28Z' fill='#112237' stroke={color} strokeOpacity={.6}/><path d='M0 28V65' stroke={color} strokeOpacity={.4}/><text y={15} textAnchor='middle' className='mv-label' style={{fill:color}}>{name}</text>
 </g>;}
function Folder({x,y,label,color}:{x:number;y:number;label:string;color:string}){return <g transform={`translate(${x} ${y})`}><path d='M-65-16h45l10 9h75v48H-65Z' fill='#192b43' stroke={color}/><path d='M-65-7H65' stroke={color} opacity={.3}/><text y={20} textAnchor='middle' className='mv-code' style={{fill:color}}>{label}</text></g>;}
function FileNode({x,y,label,identity,color}:{x:number;y:number;label:string;identity:string;color:string}){return <g transform={`translate(${x} ${y})`}><path d='M-70-26H48L70-4v58H-70Z' fill='#14273b' stroke={color}/><path d='M48-26v22h22' fill='none' stroke={color}/><text x={-53} y={0} className='mv-label' style={{fill:color}}>{label}</text><text x={-53} y={27} className='mv-tiny'>{identity}</text><path d='M-53 40h74' stroke={color} strokeOpacity={.4}/></g>;}
function Mount({a,t,scenario,path,uid}:View){
 const k=a.phase,host=scenario==='host',link=scenario==='pivot',old=path.startsWith('/oldroot'),found=!old||link,root:Point=host?[195,252]:[690,252],dest=host||old?195:690,stop:Point=[440,318];
 const stage:Point[]=[[450,155],root,old?(found?[195,252]:stop):[dest,370],found?[dest,472]:stop,found?[dest,472]:stop,found?[dest,472]:stop];
 let points:Point[]=[stage[k],stage[Math.min(5,k+1)]];
 if(k===1&&old)points=host?[root,[440,252],stop]:[root,[690,318],stop,...(found?[[195,318],[195,252]]as Point[]:[])];
 if(k===2&&old&&found)points=[[195,252],[195,370],[195,472]];
 return <>
 <Header kicker='02 / RISOLUZIONE DEI PERCORSI' title='I filesystem restano fermi. Cambia il punto di partenza.' subtitle={`Percorso cercato: ${path}. La radice del processo sceglie il primo collegamento.`}/>
 <g transform='translate(450 155)'><circle r={30} fill='#3f3326' stroke={P.amber} strokeWidth={2}/><text y={10} textAnchor='middle' className='mv-big' style={{fill:P.amber}}>/</text><text x={48} y={4} className='mv-tiny' style={{fill:P.amber}}>RADICE DEL PROCESSO</text></g>
 <Wire d={host?'M425 173L195 225':'M475 173L690 225'} color={P.amber} width={3}/>
 <Volume x={195} y={245} name='HOST' color={P.cyan}/><Volume x={690} y={245} name='ROOTFS' color={P.green}/>
 <Wire d='M195 310V354M195 411V446' color={dest===195&&found?P.cyan:P.line} width={3}/><Wire d='M690 310V354M690 411V446' color={dest===690&&found?P.green:P.line} width={3}/>
 <Folder x={195} y={370} label='etc/' color={P.cyan}/><Folder x={690} y={370} label='etc/' color={P.green}/>
 <FileNode x={195} y={472} label='passwd' identity='FILE HOST · H' color={P.cyan}/><FileNode x={690} y={472} label='passwd' identity='FILE ROOTFS · B' color={P.green}/>
 {(!host||old)&&<><Wire d='M690 305V318H195V305' color={link?P.violet:P.line} dashed={!link}/><g transform='translate(440 318)'><rect x={-83} y={-18} width={166} height={36} rx={18} fill='#19253c' stroke={link?P.violet:P.red}/><text y={5} textAnchor='middle' className='mv-code' style={{fill:link?P.violet:P.red}}>/oldroot {link?'→ H':'×'}</text></g></>}
 <text x={34} y={550} className='mv-small'>{scenario==='chroot'?'chroot: risoluzione ordinaria. Non verifica cwd, file descriptor o privilegi conservati.':scenario==='detached'?'Distacco: il percorso /oldroot sparisce; non significa cancellare i file host.':'Il token percorre riferimenti e directory. I file H e B hanno identità distinte.'}</text>
 {k<5&&<Trace points={points} t={t} tag={found?'lookup':'ricerca /oldroot'} uid={uid} color={old?P.violet:P.amber}/>}
 </>;
}
function Port({x,y,name,up=true,color=P.cyan}:{x:number;y:number;name:string;up?:boolean;color?:string}){return <g transform={`translate(${x} ${y})`}><path d='M-22-24h44v48H-22Z' fill='#112238' stroke={up?color:P.red} strokeWidth={2}/><path d='M-12-13h24v18h-24Zm4 18v10m8-10v10m8-10v10' fill='none' stroke={up?color:P.red}/><text y={48} textAnchor='middle' className='mv-code' style={{fill:up?color:P.red}}>{name}</text></g>;}
function Network({a,t,scenario,uid}:View){
 const k=a.phase,external=['internet','routed'].includes(scenario),route=scenario!=='internet',up=scenario!=='down',ok=route&&up,stop:Point=route?[325,342]:[145,389];
 const stages:Point[]=[[145,245],[145,389],ok?[385,342]:stop,ok?(external?[765,310]:[465,245]):stop,ok?(external?[550,342]:[385,342]):stop,ok?[145,245]:stop];
 const paths:Point[][]=[[stages[0],stages[1]],route?[stages[1],[145,342],[265,342],stages[2]]:[stop,stop],ok?[stages[2],[465,342],...(external?[[550,342],[765,342],[765,310]]as Point[]:[[465,245]]as Point[])]:[stop,stop],ok?(external?[[765,310],[765,342],[550,342]]:[[465,245],[465,342],[385,342]]):[stop,stop],ok?[stages[4],[385,342],[265,342],[145,342],[145,245]]:[stop,stop]];
 return <>
 <Header kicker='03 / IL VIAGGIO DEL PACCHETTO' title='Una veth collega due estremità. La rotta decide dove andare.' subtitle={`Da 192.168.1.100 a ${external?'203.0.113.10':'192.168.1.200'}: segui andata, blocchi e ritorno.`}/>
 <path d='M28 145H295V495H28Z' fill='#10273b' stroke='#365d7c'/><path d='M330 145H610V495H330Z' fill='#102c2d' stroke='#2f665c'/>
 <text x={48} y={173} className='mv-tiny' style={{fill:P.cyan}}>NET NAMESPACE</text><text x={350} y={173} className='mv-tiny' style={{fill:P.green}}>HOST</text><text x={665} y={173} className='mv-tiny' style={{fill:P.muted}}>RETE ESTERNA</text>
 <Wire d='M145 245V342H465V245' color={up&&route?P.cyan:P.line} width={3}/><Wire d='M465 342H765V310' color={scenario==='routed'?P.green:P.line} width={3} dashed={scenario!=='routed'}/>
 <g transform='translate(145 245)'><circle r={34} fill='#173b4b' stroke={P.cyan}/><path d='M-14-12h28v25h-28Zm0-6h28' fill='none' stroke={P.cyan}/><text y={-50} textAnchor='middle' className='mv-code' style={{fill:P.cyan}}>.100 /24</text></g>
 <g transform='translate(465 245)'><circle r={34} fill='#153b34' stroke={P.green}/><path d='M-14-12h28v25h-28Zm0-6h28' fill='none' stroke={P.green}/><text y={-50} textAnchor='middle' className='mv-code' style={{fill:P.green}}>.200 /24</text></g>
 <Port x={265} y={342} name='ve1' color={P.cyan}/><Port x={385} y={342} name='ve2' up={up} color={P.green}/>
 <text x={325} y={313} textAnchor='middle' className='mv-tiny'>veth</text>
 {!up&&<path d='M325 319v46m-8-12 16-16' stroke={P.red} strokeWidth={5}/>}
 <g transform='translate(765 286)'><path d='M-55-50h110v130H-55Z' fill='#162439' stroke={external?P.amber:P.line}/>{[0,1,2].map(j=><g key={j}><rect x={-42} y={-35+j*31} width={84} height={24} rx={3} fill='#0c182a' stroke={P.line}/><circle cx={27} cy={-23+j*31} r={3} fill={scenario==='routed'?P.green:P.muted}/></g>)}<text y={106} textAnchor='middle' className='mv-code' style={{fill:P.amber}}>203.0.113.10</text></g>
 <g transform='translate(55 411)'><path d='M0 0H212V63H0Z' fill='#091729' stroke={route?P.cyan:P.red}/><text x={12} y={23} className='mv-tiny'>ROUTING DEL MITTENTE</text><text x={12} y={47} className='mv-code' style={{fill:route?P.cyan:P.red}}>{external?(route?'default → ve1':'default assente'):'192.168.1.0/24 → ve1'}</text></g>
 <text x={350} y={436} className='mv-tiny'>{scenario==='routed'?'Forwarding + ritorno':'Percorso esterno'}</text><text x={350} y={458} className='mv-tiny'>{scenario==='routed'?'configurati nella prova':'non usato / non pronto'}</text>
 <text x={34} y={550} className='mv-small'>{scenario==='routed'?'Assunzione: rotta, inoltro host e ritorno esterno pronti. La sola veth non basta.':!route?'Il pacchetto si ferma nella ricerca della rotta, prima di attraversare la veth.':!up?'L’indirizzamento non compensa un endpoint DOWN. Nessuna consegna al peer.':'Passano pacchetti, non processi: la risposta percorre la coppia veth al contrario.'}</text>
 {k<5&&<Trace points={paths[k]} t={t} tag={k===0?'route':k>=3?'echo reply':'ICMP echo'} uid={uid} color={!ok&&k>=1?P.red:k>=3?P.green:P.cyan}/>}
 </>;
}
function SetDial({x,y,name,on,next,t,color}:{x:number;y:number;name:string;on:boolean;next:boolean;t:number;color:string}){const fill=mix(on?1:0,next?1:0,t);return <g transform={`translate(${x} ${y})`}><circle r={31} fill='#0b192c' stroke={P.line} strokeWidth={6}/><circle r={31} fill='none' stroke={color} strokeWidth={6} opacity={fill} strokeDasharray={`${194.78*fill} 194.78`} transform='rotate(-90)'/><text y={6} textAnchor='middle' className='mv-label' style={{fill:on?color:P.muted}}>{name}={on?1:0}</text></g>;}
function Capability({a,b,t,scenario,uid}:View){
 const k=a.phase,applied=scenario==='apply',openA=k>=4&&a.effective,openB=b.phase>=4&&b.effective,open=mix(openA?1:0,openB?1:0,t),label=applied?'cap_set_proc()':scenario==='flag'?'copia non applicata':scenario==='drop'?'DROP Bounding':'revoca E / P';
 const applyPath:Point[]=[[250,245],[355,245],[430,245],[550,245]],bindPath:Point[]=k===2?[[210,480],[600,480]]:k===3?[[600,480],[a.effective?790:600,480]]:[[a.effective?790:600,480],[a.effective?790:600,480]];
 return <>
 <Header kicker='04 / DOVE VIVE IL PRIVILEGIO' title='La copia cap_t e lo stato del thread sono oggetti diversi.' subtitle='Il controllo di bind usa Effective nel kernel. Modificare la copia locale da solo non basta.'/>
 <path d='M390 140V534' stroke='#3c5873' strokeDasharray='5 7'/><text x={34} y={142} className='mv-tiny' style={{fill:P.cyan}}>USER SPACE</text><text x={438} y={142} className='mv-tiny' style={{fill:P.violet}}>KERNEL / THREAD</text>
 <MemorySlab x={65} y={190} w={200} h={119} color={P.cyan} label='cap_t' sub={`E nella copia: ${a.localEffective?1:0}`} uid={uid} titleY={34}/>
 <g transform='translate(282 252)' opacity={a.localEffective?1:.3}><circle r={11} fill='none' stroke={P.amber} strokeWidth={4}/><path d='M11 0h27m-7 0v9m-10-9v6' stroke={P.amber} strokeWidth={4}/></g>
 <Chip x={650} y={223} name='THREAD' sub='credenziali' accent={P.violet} uid={uid}/>
 {(applied||scenario==='flag')&&<><Wire d='M265 245H553' color={applied?P.violet:P.line} dashed={scenario==='flag'}/><text x={400} y={303} textAnchor='middle' className='mv-tiny' style={{fill:applied?P.violet:P.muted}}>{label}</text></>}
 {['drop','revoke'].includes(scenario)&&<><text x={70} y={365} className='mv-code' style={{fill:P.amber}}>{label}</text><Wire d={`M245 360H430V370H${scenario==='drop'?780:650}`} color={P.violet} dashed={k<2}/></>}
 <Wire d='M520 330H780' color={P.line}/>
 <SetDial x={520} y={330} name='P' on={a.permitted} next={b.permitted} t={t} color={P.cyan}/><SetDial x={650} y={330} name='E' on={a.effective} next={b.effective} t={t} color={P.green}/><SetDial x={780} y={330} name='B' on={a.bounding} next={b.bounding} t={t} color={P.violet}/>
 <Wire d='M650 363V424' color={P.green} dashed/><text x={675} y={402} className='mv-tiny'>controllo E</text>
 <g transform='translate(135 480)'><circle r={33} fill='#332c23' stroke={P.amber}/><path d='M-13-9h26v18h-26Z' fill='none' stroke={P.amber}/><text x={0} y={-53} textAnchor='middle' className='mv-code' style={{fill:P.amber}}>bind(fd, 80)</text></g>
 <Wire d='M168 480H790' color={k>=3?(a.effective?P.green:P.red):P.line} width={3}/>
 <g data-permission-gate transform={`translate(650 480) rotate(${-80*open})`}><rect x={-6} y={-34} width={12} height={68} rx={4} fill={open>.8?P.green:P.red}/></g>
 <g transform='translate(790 480)'><path d='M-33-20-16-36h34l30 35-30 37h-34l-17-17Z' fill='#112735' stroke={k>=4&&a.allowed?P.green:P.line}/><text y={7} textAnchor='middle' className='mv-label' style={{fill:k>=4&&a.allowed?P.green:P.muted}}>80</text></g>
 <text x={34} y={550} className='mv-small'>{scenario==='drop'?'DROP B non revoca P/E già attivi: il gate può ancora aprirsi. Confronta con la revoca.':'Porta 80 privilegiata in questo modello. Si osserva lo stato, senza comandi reali.'}</text>
 {k===0&&<Trace points={[[95,235],[235,235]]} t={t} tag='copia locale' uid={uid} color={P.amber}/>}
 {k===1&&<Trace points={scenario==='flag'?[[282,252],[282,252]]:applied?applyPath:[[245,360],[430,360],[430,370],[scenario==='drop'?780:650,370]]} t={t} tag={label} uid={uid} color={scenario==='flag'?P.amber:P.violet}/>}
 {k>=2&&k<5&&<Trace points={bindPath} t={t} tag='bind' uid={uid} color={k>=3&&!a.effective?P.red:P.amber}/>}
 </>;
}
export function ContainerArchitectureScene({mode,time,...props}:{mode:ContainerMode;time:number}&Omit<View,'uid'>){const uid='container-'+useId().replaceAll(':',''),{a,scenario}=props;const summary=mode==='pid'?(scenario==='stale'?'getpid() = 1; ps legge ancora i PID host':'Vista coerente con la procfs selezionata'):a.result;return <svg className='aos-scene container-cinematic' viewBox='0 0 900 640' role='img' aria-label={`Container: ${mode}`} data-container-design='3'>
 <defs><radialGradient id={`${uid}-bg`} cx='.65' cy='.18' r='.95'><stop stopColor='#193252'/><stop offset='1' stopColor='#08111f'/></radialGradient><linearGradient id={`${uid}-chip`} x2='.4' y2='1'><stop stopColor='#233d5d'/><stop offset='1' stopColor='#111e34'/></linearGradient><filter id={`${uid}-glow`} x='-100%' y='-100%' width='300%' height='300%'><feGaussianBlur stdDeviation='4'/></filter><pattern id={`${uid}-grid`} width='32' height='32' patternUnits='userSpaceOnUse'><path d='M32 0H0V32' fill='none' stroke='#8db5dd' strokeWidth='.5' opacity='.08'/></pattern></defs>
 <rect width={900} height={640} fill={`url(#${uid}-bg)`}/><rect width={900} height={640} fill={`url(#${uid}-grid)`}/><path d='M28 111H872' stroke={P.line}/>
 <g data-time={time.toFixed(4)}>{mode==='pid'?<Pid {...props} uid={uid}/>:mode==='mount'?<Mount {...props} uid={uid}/>:mode==='network'?<Network {...props} uid={uid}/>:<Capability {...props} uid={uid}/>}
 {a.phase>=5&&<g data-experiment-result transform='translate(28 580)'><rect width={844} height={39} rx={5} fill={a.allowed?'#123b32':'#3e2630'}/><path d='M0 0v39' stroke={a.allowed?P.green:P.red} strokeWidth={3}/><text x={17} y={26} className='mv-result' style={{fill:a.allowed?P.green:P.red}}>{summary}</text></g>}
 </g></svg>;}
