'use client';
import {useId} from 'react';
import {walkConfig,latencySegments,largestBlock,type MemoryFrame,type MemoryMode} from './aos-memory-model';
const P={ink:'#e8f1ff',muted:'#8ca5c6',line:'#29415e',cyan:'#57d9f8',violet:'#b899ff',green:'#63e5b4',amber:'#ffcc76',red:'#ff7f93',base:'#101e35'};
const ease=(t:number)=>t*t*(3-2*t),mix=(a:number,b:number,t:number)=>a+(b-a)*ease(t),clamp=(n:number)=>Math.max(0,Math.min(1,n));
type Point=readonly[number,number];
type View={a:MemoryFrame;b:MemoryFrame;t:number;scenario:string;amount:number;writer:string;uid:string};
function along(points:readonly Point[],t:number):Point{const lengths=points.slice(1).map((p,j)=>Math.hypot(p[0]-points[j][0],p[1]-points[j][1])),total=lengths.reduce((n,v)=>n+v,0);let d=clamp(t)*total;for(let j=0;j<lengths.length;j++){if(d<=lengths[j]||j===lengths.length-1){const k=lengths[j]?d/lengths[j]:0;return[points[j][0]+(points[j+1][0]-points[j][0])*k,points[j][1]+(points[j+1][1]-points[j][1])*k];}d-=lengths[j];}return points[0];}
function Wire({d,color=P.line,width=2,dashed=false}:{d:string;color?:string;width?:number;dashed?:boolean}){return <path d={d} fill='none' stroke={color} strokeWidth={width} strokeDasharray={dashed?'5 7':undefined} strokeLinecap='round' strokeLinejoin='round'/>;}
function Signal({points,t,tag,color=P.cyan,uid}:{points:readonly Point[];t:number;tag:string;color?:string;uid:string}){const p=along(points,ease(t));return <g data-memory-probe transform={`translate(${p[0]} ${p[1]})`}><circle r={22} style={{fill:color}} opacity={.12}/><circle r={12} fill='#0c1830' stroke={color} strokeWidth={2}/><circle r={4} style={{fill:color}} filter={`url(#${uid}-glow)`}/>{tag&&<text y={-28} textAnchor='middle' className='mv-tag' style={{fill:color}}>{tag}</text>}</g>;}
function Pill({x,y,text,color=P.cyan}:{x:number;y:number;text:string;color?:string}){return <g transform={`translate(${x} ${y})`}><rect width={text.length*7.8+25} height={27} rx={13.5} style={{fill:color}} fillOpacity={.1} stroke={color} strokeOpacity={.4}/><circle cx={12} cy={13.5} r={3} style={{fill:color}}/><text x={22} y={18} className='mv-tiny' style={{fill:color}}>{text}</text></g>;}
function Chip({x,y,name,sub,valid=true,accent=P.cyan,uid}:{x:number;y:number;name:string;sub:string;valid?:boolean;accent?:string;uid:string}){return <g transform={`translate(${x} ${y})`}>
 {Array.from({length:7},(_,j)=><g key={j} stroke={P.line} strokeWidth={4}><path d={`M${-61+j*20} -64v-12M${-61+j*20} 64v12M-88 ${-43+j*14}h-12M88 ${-43+j*14}h12`}/></g>)}
 <path d='M-77 -63H66L88 -41V52L77 63H-77L-88 52V-52Z' style={{fill:`url(#${uid}-chip)`}} stroke={accent} strokeOpacity={.6}/>
 <path d='M-70 -47H58L72 -33V44H-70Z' fill='#0b182c' stroke={P.line}/><circle cx={-57} cy={-34} r={3} style={{fill:accent}}/>
 <text y={-12} textAnchor='middle' className='mv-chip-title'>{name}</text><text y={14} textAnchor='middle' className='mv-code' style={{fill:valid?accent:P.muted}}>{sub}</text>
 <g opacity={valid?1:.4}>{[0,1,2,3,4,5].map(j=><rect key={j} x={-55+j*20} y={32} width={12} height={4} rx={2} style={{fill:valid?accent:P.line}}/>)}</g>
 </g>;}
function MemorySlab({x,y,w=100,h=65,depth=16,color=P.cyan,label,sub,uid,titleY}:{x:number;y:number;w?:number;h?:number;depth?:number;color?:string;label:string;sub?:string;uid:string;titleY?:number}){return <g transform={`translate(${x} ${y})`}>
 <ellipse cx={w/2+8} cy={h+depth+14} rx={w*.6} ry={12} fill='#030a15' opacity={.5}/>
 <path d={`M0 ${h}l${depth} ${depth}h${w}V${depth}L${w} 0v${h}Z`} style={{fill:color}} fillOpacity={.14} stroke={color} strokeOpacity={.55}/>
 <rect width={w} height={h} rx={7} style={{fill:`url(#${uid}-chip)`}} stroke={color} strokeWidth={1.5}/><path d={`M${w} 0l${depth} ${depth}M0 ${h}h${w}l${depth} ${depth}M${w} ${h}V0`} fill='none' stroke={color} strokeOpacity={.7}/>
 <text x={w/2} y={titleY??(sub?h*.42:h*.57)} textAnchor='middle' className='mv-label' style={{fill:color}}>{label}</text>{sub&&<text x={w/2} y={h*.73} textAnchor='middle' className='mv-tiny'>{sub}</text>}
 </g>;}
function Header({kicker,title,subtitle}:{kicker:string;title:string;subtitle:string}){return <g><text x={34} y={31} className='mv-eyebrow'>{kicker}</text><text x={34} y={65} className='mv-title'>{title}</text><text x={34} y={91} className='mv-small'>{subtitle}</text></g>;}
function Outcome({a}: {a:MemoryFrame}){return <g data-memory-result={a.result?true:undefined} transform='translate(28 532)'>
 <path d='M0 0H844V44H0Z' style={{fill:a.result?(a.ok?P.green:P.red):P.line}} fillOpacity={.09}/><path d='M0 0v44' stroke={a.result?(a.ok?P.green:P.red):P.cyan} strokeWidth={3}/>
 <text x={17} y={27} className='mv-result' style={{fill:a.result?(a.ok?P.green:P.red):P.muted}}>{a.result||'Modifica le condizioni. Segui gli oggetti, poi confronta il risultato.'}</text>
 </g>;}
function Shootdown({a,b,t,scenario,uid}:View){
 const points:readonly (readonly Point[])[]=[[[140,240],[140,290],[450,290],[760,290],[760,240]],[[450,240],[450,395]],(scenario==='early'?[[450,395],[550,395],[550,350],[735,350],[735,380]]:[[450,395],[450,395]]),[[760,240],[760,395]],[[760,240],[760,290],[450,290],[450,395]],[[450,395],[735,395]],[[735,395],[765,395]],[[765,395],[765,395]]];
 const progress=mix(a.ack,b.ack,t)/2,opened=mix(a.ack===2?1:0,b.ack===2?1:0,t);
 return <>
 <Header kicker='01 / COERENZA TRA CORE' title='Una traduzione vecchia può leggere dati nuovi.' subtitle='Segui IPI, conferme e accesso: il momento del riuso decide l’isolamento.'/>
 <Wire d='M140 245V290H760V245' width={4}/><Wire d='M450 245V395H735' width={4}/><Wire d='M760 245V395' width={4} color={a.phase===4&&scenario==='early'?P.red:P.line}/>
 <Chip x={140} y={185} name='CORE 0' sub='PTE rimossa' accent={P.cyan} uid={uid}/>
 <Chip x={450} y={185} name='CORE 1' sub={a.ack>=1?'TLB vuota':'VA → F17'} valid={a.ack<1} accent={a.ack>=1?P.green:P.amber} uid={uid}/>
 <Chip x={760} y={185} name='CORE 2' sub={a.remoteValid?'VA → F17':'TLB vuota'} valid={a.remoteValid} accent={a.remoteValid?P.amber:P.green} uid={uid}/>
 <Pill x={100} y={264} text='IPI' color={P.cyan}/><Pill x={600} y={264} text={a.remoteValid?'COPIA OBSOLETA':'INVALIDATA'} color={a.remoteValid?P.amber:P.green}/>
 <g transform='translate(450 402)'><circle r={64} fill='#0c1830' stroke={P.line} strokeWidth={9}/><circle r={64} fill='none' stroke={P.green} strokeWidth={9} strokeDasharray={`${402.12*progress} 402.12`} transform='rotate(-90)'/><text y={6} textAnchor='middle' className='mv-big'>{a.ack}<tspan fontSize={18} style={{fill:P.muted}}> / 2</tspan></text><text y={30} textAnchor='middle' className='mv-tiny'>ACK RICEVUTI</text></g>
 <g data-permission-gate transform={`translate(600 401) rotate(${-80*opened})`}><rect x={-5} y={-31} width={10} height={62} rx={4} style={{fill:opened>.9?P.green:P.red}}/></g>
 <MemorySlab x={680} y={365} w={140} h={78} label='F17' sub={a.owner==='processo B'?'B · SEGRETO':'vecchio AS'} color={a.owner==='processo B'?P.violet:P.cyan} uid={uid}/>
 {scenario==='early'&&a.phase>=3&&a.phase<6&&<Wire d='M515 380Q590 315 680 380' color={P.red} dashed/>}
 <text x={34} y={375} className='mv-label'>BARRIERA DI RIUSO</text><text x={34} y={402} className='mv-small'>{a.ack===2?'Tutte le copie invalidate.':'Un ACK mancante basta'}</text><text x={34} y={425} className='mv-small'>{a.ack===2?'Il frame può passare a B.':'a tenere chiuso il passaggio.'}</text>
 <text x={34} y={497} className='mv-tiny'>CORE 3 / altro address space: fuori da questo shootdown.</text>
 {a.phase<7&&<Signal points={points[a.phase]} t={t} tag={['IPI','ACK 1',scenario==='early'?'RIUSO':'ATTESA','ACCESSO VA','ACK 2','RIUSO','F17'][a.phase]} color={a.phase===3&&scenario==='early'?P.red:P.cyan} uid={uid}/>}
 </>;
}
function Buddy({a,b,t,scenario,amount}:View){
 const cellX=(j:number)=>64+j*96,cellY=296;
 return <>
 <Header kicker='02 / GEOMETRIA DELLA RAM' title='Stessa memoria libera. Spazio utilizzabile diverso.' subtitle='Le pagine possono migrare; gli indirizzi dei frame fisici restano fermi.'/>
 <g transform='translate(34 179)'><text className='mv-big'>{amount}<tspan fontSize={17} style={{fill:P.muted}}> frame richiesti</tspan></text><text y={27} className='mv-small'>contigui e allineati</text></g>
 <Pill x={470} y={156} text={scenario==='pinned'?'C NON MIGRABILE':scenario==='contiguous'?'GIÀ CONTIGUA':'COMPATTAZIONE'} color={scenario==='pinned'?P.red:P.violet}/>
 <path d='M35 277H825L867 322V408H77L35 366Z' fill='#14243b' stroke='#345270'/><path d='M35 366H825L867 408M825 277V366L867 408' fill='none' stroke='#345270'/>
 {Array.from({length:8},(_,j)=><g key={j} transform={`translate(${cellX(j)} ${cellY})`}><path d='M0 0H78L88 11V68H10L0 56Z' style={{fill:a.allocated.includes(j)?P.green:'#091626'}} fillOpacity={a.allocated.includes(j)?.25:1} stroke={a.allocated.includes(j)?P.green:P.line}/><path d='M0 56H78L88 68M78 0V56' fill='none' stroke={P.line}/><text x={40} y={98} textAnchor='middle' className='mv-code' style={{fill:P.muted}}>F{j}</text>{a.allocated.includes(j)&&<text x={39} y={33} textAnchor='middle' className='mv-label' style={{fill:P.green}}>R</text>}</g>)}
 {a.positions.map((p,j)=>{const next=b.positions[j],lift=p===next?0:Math.sin(Math.PI*t)*90,x=mix(cellX(p),cellX(next),t),y=cellY-24-lift,color=scenario==='pinned'&&j===2?P.red:j%2?P.violet:P.cyan;return <g key={j} data-memory-page={'ABCD'[j]} data-memory-probe={'ABCD'[j]} transform={`translate(${x} ${y})`}>
 <path d='M0 0H74L84 10V49H10L0 39Z' fill='#13263f' stroke={color} strokeWidth={2}/><path d='M0 39H74L84 49M74 0V39' fill='none' stroke={color} strokeOpacity={.5}/><text x={38} y={25} textAnchor='middle' className='mv-label' style={{fill:color}}>{'ABCD'[j]}</text>
 {scenario==='pinned'&&j===2&&<g transform='translate(54 -10)'><path d='M0 0v18m-8-7h16' stroke={P.red} strokeWidth={3}/><circle r={5} style={{fill:P.red}}/></g>}
 </g>;})}
 {[0,4].map(start=><g key={start}><path d={`M${cellX(start)} 425v11h366v-11`} fill='none' stroke={start===4&&largestBlock(a.positions)>=4?P.green:P.line} strokeWidth={2}/><text x={cellX(start)+183} y={461} textAnchor='middle' className='mv-tiny'>ORDINE 2 / F{start}–F{start+3}</text></g>)}
 <text x={34} y={500} className='mv-small'>Libero prima di R: 4 frame <tspan style={{fill:P.ink}}> / </tspan> massimo blocco buddy: <tspan style={{fill:P.green}}>{largestBlock(a.positions)}</tspan></text>
 </>;
}
function PageTable({x,y,label,active,done,uid,color=P.cyan}:{x:number;y:number;label:string;active:boolean;done:boolean;uid:string;color?:string}){return <g transform={`translate(${x} ${y})`}>
 <path d='M-28 -29h57l10 10v58h-57l-10-10Z' style={{fill:`url(#${uid}-chip)`}} stroke={active?color:done?P.green:P.line} strokeWidth={active?2:1}/>
 {[0,1,2,3].map(j=><path key={j} d={`M-18 ${-12+j*11}h37`} stroke={j===2&&active?color:P.line} strokeWidth={j===2&&active?4:2}/>)}
 <text y={65} textAnchor='middle' className='mv-tiny' style={{fill:done?P.green:P.muted}}>{label}</text>
 </g>;}
function Walk({a,b,t,scenario,uid}:View){
 const {g,s}=walkConfig(scenario),guestX=(j:number)=>180+j*145,stageX=(j:number)=>210+j*155,guestY=178,stageY=371;
 const pos=(f:MemoryFrame):Point=>f.phase===0?[55,178]:f.col<s?[stageX(f.col),stageY]:f.row<g?[guestX(f.row),guestY]:[805,guestY];
 const p=pos(a),q=pos(b),row=Math.min(a.row,Math.max(0,g-1)),targetX=guestX(row);
 const points:Point[]=a.phase===0?(s?[[55,178],[115,178],[115,371],q]:[[55,178],q]):a.col===s&&b.col===0&&s?[p,[p[0],280],[stageX(0),280],q]:a.col<s&&b.col===s?[p,[p[0],280],[q[0],280],q]:[p,q];
 return <>
 <Header kicker='03 / IL VIAGGIO DI UN INDIRIZZO' title={scenario==='hit'?'TLB hit: traduzione pronta, nessun walk.':scenario==='native'?'Quattro livelli. Una sola gerarchia da attraversare.':'Per leggere una PTE guest serve prima raggiungerla.'} subtitle={scenario==='hit'?'Il dato usa la traduzione GVA / HPA presente nella TLB.':scenario==='native'?'Nel caso nativo non esiste uno stage 2: segui quattro PTE, poi il dato.':'Il percorso inferiore si ripete per ciascuna PTE guest, poi per il dato finale.'}/>
 <Wire d='M55 178H805' width={3}/><text x={34} y={135} className='mv-tiny' style={{fill:P.cyan}}>{scenario==='native'?'VA':'GVA'}</text><text x={735} y={135} className='mv-tiny' style={{fill:P.green}}>HPA / DATO</text>
 {Array.from({length:g},(_,j)=><PageTable key={j} x={guestX(j)} y={guestY} label={`${scenario==='native'?'NATIVO':'GUEST'} L${j+1}`} active={a.row===j} done={a.row>j} uid={uid}/>)}
 <g transform='translate(805 178)'><circle r={34} fill='#112c32' stroke={P.green}/><path d='M-12-8h24v22h-24Zm0-6h24' fill='none' stroke={P.green} strokeWidth={2}/></g>
 {s>0&&<>
 <Wire d={`M${targetX-28} 205H${targetX-58}V275H${stageX(0)}V335`} color={P.violet} dashed/><Wire d={`M${stageX(s-1)} 335V275H${(a.row===g?805:targetX)+58}V205H${(a.row===g?805:targetX)+29}`} color={P.cyan} dashed/>
 <path d='M132 315H793L810 332V437H132Z' fill='#181b36' fillOpacity={.8} stroke='#423765'/>
 <text x={150} y={306} className='mv-tiny' style={{fill:P.violet}}>STAGE 2 / TRADUCI IL GPA {a.row<g?`DELLA PTE ${a.row+1}`:'DEL DATO'}</text>
 <Wire d={`M${stageX(0)} 371H${stageX(s-1)}`} color='#614f8a' width={3}/>
 {Array.from({length:s},(_,j)=><PageTable key={j} x={stageX(j)} y={stageY} label={`S2 · L${j+1}`} active={a.col===j&&a.phase>0} done={a.col>j} color={P.violet} uid={uid}/>)}
 </>}
 {scenario==='native'&&<><text x={280} y={355} className='mv-label' style={{fill:P.cyan}}>Quattro livelli. Una sola gerarchia.</text><text x={280} y={385} className='mv-small'>Nessuno stage 2 da attraversare.</text></>}
 {scenario==='hit'&&<><path d='M120 178Q450 10 772 162' fill='none' stroke={P.green} strokeWidth={3}/><Pill x={345} y={260} text='TLB COMBINATA · HIT' color={P.green}/><text x={300} y={330} className='mv-label' style={{fill:P.green}}>0 letture delle tabelle</text></>}
 <Signal points={scenario==='hit'?[[55,178],[230,120],[450,110],[650,120],[805,178]]:points} t={t} tag={a.result?'DATO':s&&a.col<s?'GPA':'PTE'} color={s&&a.col<s?P.violet:P.cyan} uid={uid}/>
 <text x={34} y={497} className='mv-small'><tspan className='mv-counter' style={{fill:P.cyan}}>{a.reads}</tspan> letture tabelle <tspan style={{fill:P.line}}> / </tspan> {a.result?1:0} dato <tspan style={{fill:P.line}}> / </tspan> cache dei walk escluse</text>
 </>;
}
function Balloon({a,b,t,scenario,uid}:View){
 const grant=Math.min(Number(scenario),4),inflation=mix(a.donated,b.donated,t)/4,rx=44+58*inflation,ry=35+45*inflation;
 const backingPos=(f:MemoryFrame,j:number):Point=>f.backing<8?[655+(j%2)*87,300+Math.floor(j/2)*78]:[80+j*47,430];
 return <>
 <Header kicker='04 / DUE VISTE DELLA STESSA MEMORIA' title='Il balloon cresce nel guest. Il backing torna all’host.' subtitle='G0–G3 hanno dati vivi. Solo le altre quattro pagine sono cedibili in questa prova.'/>
 <path d='M28 135H525L549 159V459H28Z' fill='#112139' stroke='#2c4a67'/><path d='M575 135H847L872 159V459H575Z' fill='#111e30' stroke='#2c4a67'/>
 <text x={48} y={164} className='mv-label' style={{fill:P.cyan}}>GUEST</text><text x={595} y={164} className='mv-label' style={{fill:P.green}}>POOL HOST</text>
 <text x={595} y={204} className='mv-big'>{8-a.backing}<tspan fontSize={14} style={{fill:P.muted}}> recuperati</tspan></text>
 {Array.from({length:8},(_,j)=><g key={j} transform={`translate(${59+j*57} 211)`}><rect width={43} height={69} rx={5} style={{fill:j<4?'#163d51':j>=8-a.donated?'#604d32':'#164337'}} stroke={j<4?P.cyan:j>=8-a.donated?P.amber:P.green}/><text x={21} y={27} textAnchor='middle' className='mv-code' style={{fill:j<4?P.cyan:j>=8-a.donated?P.amber:P.green}}>G{j}</text><path d='M10 40h23m-23 8h23m-23 8h15' stroke={j<4?P.cyan:P.line} strokeWidth={2}/></g>)}
 <g data-balloon-dome transform={`translate(375 356) scale(${1+inflation*.04})`}><ellipse rx={rx+15} ry={ry+15} style={{fill:P.amber}} opacity={.04}/><ellipse rx={rx} ry={ry} style={{fill:`url(#${uid}-balloon)`}} stroke={P.amber} strokeWidth={2}/><path d={`M0 ${-ry}C${-rx*.55} ${-ry} ${-rx*.55} ${ry} 0 ${ry}M0 ${-ry}C${rx*.55} ${-ry} ${rx*.55} ${ry} 0 ${ry}`} fill='none' stroke={P.amber} opacity={.3}/><ellipse rx={rx} ry={ry*.3} fill='none' stroke={P.amber} opacity={.3}/><path d={`M-5 ${ry}h10l5 12h-20Z`} style={{fill:P.amber}}/><text y={-3} textAnchor='middle' className='mv-counter' style={{fill:P.amber}}>{a.donated}</text><text y={20} textAnchor='middle' className='mv-tiny' style={{fill:P.amber}}>PAGINE PRESE</text></g>
 <Wire d='M510 352H648' color={P.green} dashed/><path d='M552 345l9 7-9 7' fill='none' stroke={P.green} strokeWidth={2}/>
 <text x={48} y={326} className='mv-small'>Dati vivi intatti</text><text x={48} y={350} className='mv-tiny'>Il volume indica pagine</text><text x={48} y={370} className='mv-tiny'>indisponibili al guest.</text>
 {Array.from({length:grant},(_,j)=>{const p=backingPos(a,j),q=backingPos(b,j),points:Point[]=[p,[p[0],465+j*12],[q[0],465+j*12],q],pos=a.backing===b.backing?p:along(points,ease(clamp((t-j*.09)/.73)));return <g key={j} data-memory-probe transform={`translate(${pos[0]} ${pos[1]})`}><rect x={-20} y={-15} width={41} height={30} rx={5} fill='#102d32' stroke={P.green}/><path d='M-13-8h25m-25 7h25' stroke={P.green} strokeWidth={2}/><text y={12} textAnchor='middle' className='mv-micro' style={{fill:P.green}}>{a.phase===5?'H nuovo':`H${8-grant+j}`}</text></g>;})}
 <text x={48} y={193} className='mv-tiny'>Target {scenario} / cedibili 4 / libere guest {a.guestFree}</text>
 </>;
}
function Ksm({a,b,t,scenario,writer,uid}:View){
 const xMap=(id:number)=>id===0?330:650,xa=mix(xMap(a.mapA),xMap(b.mapA),t),xb=mix(xMap(a.mapB),xMap(b.mapB),t),content0=a.mapA===0?a.bytesA:a.bytesB,content1=a.mapA===1?a.bytesA:a.bytesB;
 const copying=scenario==='same'&&writer!=='none'&&a.phase===4;
 return <>
 <Header kicker='05 / CONDIVIDERE SENZA CONFONDERE' title='Un solo backing finché qualcuno prova a scrivere.' subtitle='I frame restano fermi. Sono i riferimenti dei mapping a cambiare destinazione.'/>
 <g transform='translate(110 185)'><circle r={47} fill='#113345' stroke={P.cyan} strokeWidth={2}/><text y={5} textAnchor='middle' className='mv-big' style={{fill:P.cyan}}>A</text><text y={76} textAnchor='middle' className='mv-code' style={{fill:P.cyan}}>legge {a.bytesA}</text></g>
 <g transform='translate(790 185)'><circle r={47} fill='#2a2348' stroke={P.violet} strokeWidth={2}/><text y={5} textAnchor='middle' className='mv-big' style={{fill:P.violet}}>B</text><text y={76} textAnchor='middle' className='mv-code' style={{fill:P.violet}}>legge {a.bytesB}</text></g>
 <Wire d={`M151 208C195 280 ${xa-35} 235 ${xa} 340`} color={P.cyan} width={3}/><Wire d={`M747 208C700 280 ${xb+35} 235 ${xb} 340`} color={P.violet} width={3}/>
 {[0,1].map(j=>{const free=j===1&&a.physical===1,content=j===0?content0:content1;return <g key={j}>
 <MemorySlab x={xMap(j)-96} y={340} w={180} h={104} depth={17} color={free?P.green:j===0?P.cyan:P.violet} label={`H${j}`} titleY={22} sub={free?'recuperabile':'frame fisico'} uid={uid}/>
 {!free&&[0,1,2].map(k=><g key={k} transform={`translate(${xMap(j)-64+k*44} 378)`}><rect width={34} height={26} rx={4} style={{fill:j===0?'#184157':'#372c55'}} stroke={j===0?P.cyan:P.violet} strokeOpacity={.35}/><text x={17} y={18} textAnchor='middle' className='mv-code' style={{fill:j===0?P.cyan:P.violet}}>{content[k]}</text></g>)}
 </g>;})}
 {a.merged&&(a.phase<5||writer==='none')&&<g transform='translate(330 302)'><path d='M-8 0v-8a8 8 0 0 1 16 0v8m-19 0h22v18h-22Z' fill='#173d40' stroke={P.green}/><text x={20} y={14} className='mv-tiny' style={{fill:P.green}}>SOLA LETTURA</text></g>}
 {a.phase<=1&&<Signal points={[[650,315],[330,315]]} t={t} tag={a.phase===0?'CONFRONTA BYTE':scenario==='same'?'RIMAPPA B':'BYTE DIVERSI'} color={P.violet} uid={uid}/>}
 {copying&&<Signal points={[[330,402],[490,465],[650,402]]} t={t} tag='COPIA ABC' color={P.amber} uid={uid}/>}
 {a.phase===5&&writer!=='none'&&<Signal points={writer==='A'?[[110,185],[155,275],[xa,340]]:[[790,185],[745,275],[xb,340]]} t={t} tag='XYZ' color={P.amber} uid={uid}/>}
 {a.phase===4&&scenario==='same'&&writer!=='none'&&<Pill x={365} y={128} text='FAULT DI PROTEZIONE' color={P.red}/>}
 <text x={34} y={506} className='mv-small'>Frame usati: <tspan style={{fill:P.green}}>{a.physical}</tspan> <tspan style={{fill:P.line}}> / </tspan> scrittore {writer==='none'?'nessuno':writer} <tspan style={{fill:P.line}}> / </tspan> l’altro mapping conserva i propri byte</text>
 </>;
}
function Latency({a,b,t,scenario,amount,uid}:View){
 const segments=latencySegments(scenario),elapsed=mix(a.elapsed,b.elapsed,t),useful=mix(a.useful,b.useful,t),x0=65,unit=61,deadlineX=x0+amount*unit;
 const active=(()=>{let end=0;for(const seg of segments){end+=seg.duration;if(elapsed<end)return seg;}return segments.at(-1)!;})();
 const robotX=100+useful*200,done=useful>=3;
 return <>
 <Header kicker='06 / TEMPO TRASCORSO ≠ LAVORO SVOLTO' title='Durante uno stallo il tempo corre. Il task no.' subtitle='Stesso lavoro utile: tre unità. Cambia il percorso, poi sposta la deadline.'/>
 <text x={34} y={140} className='mv-tiny'>ESECUZIONE DEL TASK</text>
 <Wire d='M100 235H745' width={7}/><Wire d={`M100 235H${robotX}`} color={active.useful?P.cyan:P.amber} width={7}/>
 {[0,1,2,3].map(j=><g key={j} transform={`translate(${100+j*200} 235)`}><circle r={j===3?21:12} style={{fill:useful>=j?'#113b37':'#112139'}} stroke={useful>=j?P.green:P.line} strokeWidth={2}/><text y={48} textAnchor='middle' className='mv-tiny'>{j===3?'COMPLETATO':`${j}/3 utile`}</text></g>)}
 <g data-memory-probe transform={`translate(${robotX} 204)`}><path d='M-30-19h48l14 14v41h-62Z' style={{fill:`url(#${uid}-chip)`}} stroke={active.useful?P.cyan:P.amber} strokeWidth={2}/><path d='M-16-6h31M-16 3h20' stroke={active.useful?P.cyan:P.amber} strokeWidth={3}/><circle cx={-12} cy={29} r={6} style={{fill:P.ink}}/><circle cx={18} cy={29} r={6} style={{fill:P.ink}}/><g transform={`translate(0 0) rotate(${active.useful?elapsed*100:0})`}><path d='M-5 16h10m-5-5v10' stroke={P.muted} strokeWidth={1.5}/></g></g>
 <Pill x={325} y={128} text={done?'LAVORO CONCLUSO':active.useful?'ESECUZIONE UTILE':`ATTESA · ${active.label}`} color={done?P.green:active.useful?P.cyan:P.amber}/>
 <text x={34} y={340} className='mv-tiny'>TEMPO DEL SISTEMA / unità illustrative</text>
 {segments.map((seg,j)=>{const start=segments.slice(0,j).reduce((n,s)=>n+s.duration,0);return <g key={j}><rect x={x0+start*unit} y={365} width={seg.duration*unit-3} height={45} rx={5} style={{fill:seg.useful?'#123d45':'#3b3025'}} stroke={seg.useful?P.cyan:P.amber} strokeOpacity={.45}/><text x={x0+start*unit+7} y={393} className='mv-tiny' style={{fill:seg.useful?P.cyan:P.amber}}>{seg.label}</text></g>;})}
 {Array.from({length:13},(_,j)=><g key={j}><path d={`M${x0+j*unit} 418v7`} stroke={P.line}/><text x={x0+j*unit} y={447} textAnchor='middle' className='mv-code' style={{fill:P.muted}}>{j}</text></g>)}
 <path d={`M${deadlineX} 350V468`} stroke={P.red} strokeDasharray='5 5' strokeWidth={2}/><text x={deadlineX} y={487} textAnchor='middle' className='mv-tiny' style={{fill:P.red}}>DEADLINE {amount}</text>
 <g data-memory-probe transform={`translate(${x0+elapsed*unit} 360)`}><path d='M-8-13h16L0 0Z' style={{fill:P.ink}}/><path d='M0 0v54' stroke={P.ink} strokeWidth={2}/></g>
 <text x={34} y={510} className='mv-small'>Trascorso {a.elapsed} <tspan style={{fill:P.line}}> / </tspan> lavoro utile {a.useful}/3 <tspan style={{fill:P.line}}> / </tspan> preparazione fuori dalla fase critica</text>
 </>;
}
export function MemoryScene({mode,time,...props}:{mode:MemoryMode;time:number}&Omit<View,'uid'>){const uid='mem-'+useId().replaceAll(':',''),v={...props,uid};return <svg className='aos-scene memory-cinematic' viewBox='0 0 900 600' role='img' aria-label={`Memoria: ${mode}`} data-memory-design='3'>
 <defs>
 <radialGradient id={`${uid}-bg`} cx='.62' cy='.2' r='.9'><stop stopColor='#182d4d'/><stop offset='1' stopColor='#070f1e'/></radialGradient>
 <linearGradient id={`${uid}-chip`} x2='.5' y2='1'><stop stopColor='#233d5d'/><stop offset='1' stopColor='#111e34'/></linearGradient>
 <radialGradient id={`${uid}-balloon`} cx='.28' cy='.2'><stop stopColor='#d4a45a' stopOpacity='.4'/><stop offset='.7' stopColor='#856044' stopOpacity='.3'/><stop offset='1' stopColor='#f0b761' stopOpacity='.12'/></radialGradient>
 <filter id={`${uid}-glow`} x='-100%' y='-100%' width='300%' height='300%'><feGaussianBlur stdDeviation='4'/></filter>
 <pattern id={`${uid}-grid`} width='32' height='32' patternUnits='userSpaceOnUse'><path d='M32 0H0V32' fill='none' stroke='#7aa7d4' strokeWidth='.5' opacity='.08'/></pattern>
 </defs>
 <rect width='900' height='600' style={{fill:`url(#${uid}-bg)`}}/><rect width='900' height='600' style={{fill:`url(#${uid}-grid)`}}/><path d='M28 110H872' stroke='#29415e' opacity='.5'/>
 <g data-time={time.toFixed(4)}>{mode==='shootdown'?<Shootdown {...v}/>:mode==='buddy'?<Buddy {...v}/>:mode==='walk'?<Walk {...v}/>:mode==='balloon'?<Balloon {...v}/>:mode==='ksm'?<Ksm {...v}/>:<Latency {...v}/>}<Outcome a={props.a}/></g>
 </svg>;}
