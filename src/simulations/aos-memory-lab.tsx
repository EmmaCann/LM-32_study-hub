'use client';
import {useEffect,useMemo,useState} from 'react';
import {VisualPlayer,Scene} from './aos-visual-player';
import {memoryTrace,modes,experiments,defaultExperiment,walkConfig,latencySegments,largestBlock,freeBlocks,type MemoryMode,type MemoryFrame} from './aos-memory-model';
import './aos-memory.css';
const C={ink:'#20384f',line:'#879aad',blue:'#bad8ee',green:'#a3d7bc',amber:'#f2ca8a',red:'#efb2ad',paper:'#edf3f8'};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t*t*(3-2*t);
type View={a:MemoryFrame;b:MemoryFrame;t:number;scenario:string;amount:number;writer:string};
function Box({x,y,w=220,h=90,title,sub,fill=C.paper}:{x:number;y:number;w?:number;h?:number;title:string;sub?:string;fill?:string}){return <g><rect x={x} y={y} width={w} height={h} rx={12} fill={fill} stroke={C.line}/><text x={x+16} y={y+30} className='mem-label'>{title}</text>{sub&&<text x={x+16} y={y+57} className='mem-small'>{sub}</text>}</g>;}
function Edge({d,color=C.line,dashed=false}:{d:string;color?:string;dashed?:boolean}){return <path d={d} fill='none' stroke={color} strokeWidth={3} strokeDasharray={dashed?'6 5':undefined}/>;}
function Probe({x,y,label='acceso'}:{x:number;y:number;label?:string}){return <g data-memory-probe transform={`translate(${x} ${y})`}><circle r={12} fill={C.amber} stroke={C.ink} strokeWidth={2}/><text x={18} y={5} className='mem-small'>{label}</text></g>;}
function Outcome({a}:{a:MemoryFrame}){return a.result&&<g data-memory-result><rect x={28} y={505} width={844} height={43} rx={10} fill={a.ok?C.green:C.red}/><text x={44} y={532} className='mem-result'>{a.result}</text></g>;}
function Shootdown({a,b,t,scenario}:View){
 const path=[[150,205],[745,205],[150,260],[745,270],[745,360],[150,270],[745,440],[745,440]],p=path[a.phase],q=path[b.phase];
 return <>
 <text x={30} y={35} className='mem-title'>Quando può F17 passare a un altro processo?</text>
 <Box x={30} y={70} w={230} title='Core 0 · coordinatore' sub='PTE rimossa; TLB locale vuota'/>
 <Box x={345} y={70} w={230} title='Core 1 · stesso AS' sub={a.ack>=1?'TLB invalidata · ACK 1':'VA → F17 in TLB'} fill={a.ack>=1?C.green:C.amber}/>
 <Box x={640} y={70} w={230} title='Core 2 · in ritardo' sub={a.remoteValid?'VA → F17 ancora valida':'TLB invalidata · ACK 2'} fill={a.remoteValid?C.amber:C.green}/>
 <Edge d='M145 160V205H755V160'/><text x={320} y={197} className='mem-small'>IPI → invalidazione remota → ACK</text>
 <Edge d='M755 160V325' color={a.phase===4&&scenario==='early'?'#b64440':C.line}/>
 <Box x={30} y={320} w={320} h={125} title={`Barriera: ${a.ack} / 2 ACK`} sub={a.ack===2?'Riuso consentito':'Riuso vietato dal protocollo'} fill={a.ack===2?C.green:C.amber}/>
 <g data-frame-owner><Box x={570} y={320} w={300} h={125} title={`Frame F17 · ${a.owner==='processo B'?'B':'vecchio AS'}`} sub={a.owner==='processo B'?'byte: SEGRETO':'byte: dati precedenti'} fill={a.owner==='processo B'?C.blue:C.paper}/></g>
 <text x={30} y={480} className='mem-small'>Core 3 usa un altro address space. Le IPI sono mirate ai core interessati.</text>
 {a.phase<7&&<Probe x={mix(p[0],q[0],t)} y={mix(p[1],q[1],t)} label={a.phase<=1?'IPI':a.phase===3||a.phase===4?'accesso VA':'ACK / riuso'}/>}
 </>;
}
function Buddy({a,b,t,scenario,amount}:View){return <>
 <text x={30} y={36} className='mem-title'>Quattro frame liberi: bastano per la richiesta R?</text>
 <text x={30} y={77} className='mem-small'>Richiesta: {amount} frame contigui e allineati. I frame fisici restano fermi.</text>
 {Array.from({length:8},(_,j)=><g key={j}><rect x={52+j*99} y={160} width={90} height={130} rx={10} fill={a.allocated.includes(j)?C.green:C.paper} stroke={C.line}/><text x={97+j*99} y={315} textAnchor='middle' className='mem-small'>F{j}</text>{a.allocated.includes(j)&&<text x={97+j*99} y={235} textAnchor='middle' className='mem-label'>R</text>}</g>)}
 {a.positions.map((p,j)=><g key={j} data-memory-page={'ABCD'[j]} data-memory-probe={j===1||j===3?'page':undefined} transform={`translate(${mix(57+p*99,57+b.positions[j]*99,t)} ${190-Math.sin(Math.PI*t)*(p===b.positions[j]?0:50)})`}><rect width={80} height={66} rx={9} fill={scenario==='pinned'&&j===2?C.red:C.blue} stroke={C.ink}/><text x={40} y={27} textAnchor='middle' className='mem-label'>{'ABCD'[j]}</text><text x={40} y={49} textAnchor='middle' className='mem-small'>{scenario==='pinned'&&j===2?'fissa':'mobile'}</text></g>)}
 {[0,4].map(start=><g key={start}><path d={`M${52+start*99} 335v12h387v-12`} fill='none' stroke={C.line}/><text x={245+start*99} y={371} textAnchor='middle' className='mem-small'>Blocco ordine 2 · F{start}–F{start+3}</text></g>)}
 <Box x={40} y={400} w={390} h={80} title={`Prima di R: blocco max ${largestBlock(a.positions)} frame`} sub='Totale libero prima di R: 4 frame'/>
 <Box x={455} y={400} w={405} h={80} title={`Prima di R, blocchi da ${amount}: ${freeBlocks(a.positions,Math.log2(amount)).map(p=>'F'+p).join(', ')||'nessuno'}`} sub='Compattazione distinta dal buddy allocator'/>
 </>;}
function Walk({a,b,t,scenario}:View){
 const {g,s}=walkConfig(scenario),rows=g+1,cols=s+1,cell=(row:number,col:number)=>[155+col*140,100+row*64],pos=(f:MemoryFrame)=>f.phase===0?[65,80]:[cell(f.row,f.col)[0]+104,cell(f.row,f.col)[1]+14],p=pos(a),q=pos(b);
 return <>
 <text x={30} y={34} className='mem-title'>Segui ogni lettura: tabelle prima, dato per ultimo</text>
 {Array.from({length:rows},(_,row)=><g key={row}><text x={24} y={128+row*64} className='mem-small'>{row===g?'dato finale':`PTE guest ${row+1}`}</text>{Array.from({length:cols},(_,col)=>{const [x,y]=cell(row,col),final=row===g&&col===s,visited=a.phase>0&&(row<a.row||row===a.row&&col<=a.col);return <g key={col}><rect x={x} y={y} width={120} height={48} rx={8} fill={visited?(final?C.green:col===s?C.blue:C.amber):C.paper} stroke={C.line}/><text x={x+12} y={y+30} className='mem-small'>{col===s?final?'DATO':'PTE guest':`stage 2 · L${col+1}`}</text></g>;})}</g>)}
 {scenario==='hit'&&<Box x={370} y={100} w={450} h={120} title='Hit TLB: traduzione GVA → HPA pronta' sub='Salta tutte le letture delle tabelle.' fill={C.green}/>}
 {scenario==='native'&&<Box x={370} y={100} w={450} h={120} title='Nativo: nessuno stage 2' sub='Quattro PTE + una lettura del dato.' fill={C.blue}/>}
 <Probe x={mix(p[0],q[0],t)} y={mix(p[1],q[1],t)} label=''/>
 <text x={30} y={461} className='mem-label'>Letture tabelle: {a.reads} · dato: {a.result?1:0}</text>
 <text x={30} y={486} className='mem-small'>Nessuna cache dei walk. Livelli ridotti = ipotesi di huge page nello stadio indicato.</text>
 </>;
}
function Balloon({a,b,t,scenario}:View){
 const target=Number(scenario),grant=Math.min(target,4),reclaimed=a.backing<8;
 const pos=(f:MemoryFrame,j:number)=>f.backing<8?[58+(8-grant+j)*99,380]:[58+(8-grant+j)*99,205];
 return <>
 <text x={30} y={35} className='mem-title'>Il balloon può restituire più pagine di quelle cedibili?</text>
 <rect x={30} y={65} width={840} height={210} rx={12} fill='none' stroke={C.line}/><text x={48} y={94} className='mem-label'>GUEST · target {target} · cedibili 4 · ora libere {a.guestFree}</text>
 {Array.from({length:8},(_,j)=><g key={j}><rect x={52+j*99} y={120} width={90} height={63} rx={8} fill={j<4?C.blue:j>=8-a.donated?C.amber:C.green} stroke={C.line}/><text x={97+j*99} y={145} textAnchor='middle' className='mem-label'>G{j}</text><text x={97+j*99} y={168} textAnchor='middle' className='mem-small'>{j<4?'dati vivi':j>=8-a.donated?'balloon':'libera'}</text></g>)}
 <text x={48} y={220} className='mem-small'>G: pagine guest</text><text x={48} y={246} className='mem-small'>H: backing host cedibile</text>
 <rect x={30} y={305} width={840} height={165} rx={12} fill='none' stroke={C.line}/><text x={48} y={335} className='mem-label'>HOST · pool recuperato: {8-a.backing} frame</text>
 {Array.from({length:grant},(_,j)=>{const p=pos(a,j),q=pos(b,j);return <g key={j} data-memory-probe='backing' transform={`translate(${mix(p[0],q[0],t)} ${mix(p[1],q[1],t)})`}><rect width={76} height={42} rx={8} fill={C.amber} stroke={C.ink}/><text x={38} y={27} textAnchor='middle' className='mem-small'>{a.phase===5?'H nuovo':`H${8-grant+j}`}</text></g>;})}
 <text x={48} y={452} className='mem-small'>{reclaimed?'I backing ceduti sono recuperabili dall’host; G0–G3 conservano i propri dati.':'Backing in uso guest: 8. Il pool può crescere solo con backing effettivamente ceduto.'}</text>
 </>;
}
function Ksm({a,b,t,scenario,writer}:View){
 const endpoint=(map:number)=>[map===0?260:630,290],pa=endpoint(a.mapA),qa=endpoint(b.mapA),pb=endpoint(a.mapB),qb=endpoint(b.mapB);
 const content0=a.mapA===0?a.bytesA:a.bytesB,content1=a.mapA===1?a.bytesA:a.bytesB;
 return <>
 <text x={30} y={35} className='mem-title'>Condividere il backing significa condividere le scritture?</text>
 <Box x={60} y={70} w={270} title='Mapping A' sub={`legge: ${a.bytesA}${a.merged&&a.phase<5?' · sola lettura':''}`} fill={C.blue}/>
 <Box x={560} y={70} w={270} title='Mapping B' sub={`legge: ${a.bytesB}${a.merged&&a.phase<5?' · sola lettura':''}`} fill={C.blue}/>
 <Edge d={`M195 160L${mix(pa[0],qa[0],t)} ${mix(pa[1],qa[1],t)}`} color='#4087b8'/>
 <Edge d={`M695 160L${mix(pb[0],qb[0],t)} ${mix(pb[1],qb[1],t)}`} color='#3b9a79'/>
 {[0,1].map(j=><g key={j}><Box x={j===0?155:525} y={290} w={220} h={130} title={`Frame H${j} · ${j===1&&a.physical===1?'libero':'usato'}`} sub={j===1&&a.physical===1?'recuperabile dall’host':`byte: ${j===0?content0:content1}`} fill={j===1&&a.physical===1?C.green:C.paper}/></g>)}
 {a.phase<3&&<Probe x={mix(a.phase===0?260:630,scenario==='same'&&a.phase>=1?260:630,t)} y={250} label={a.phase===0?'confronto byte':'riferimento B'}/>}
 {a.phase>=4&&a.phase<6&&scenario==='same'&&writer!=='none'&&<Probe x={mix(a.phase===4?260:630,630,t)} y={370} label='copia ABC'/>}
 <text x={30} y={470} className='mem-small'>{a.phase===4&&scenario==='same'&&writer!=='none'?`Fault di protezione sul mapping ${writer}: prima copia privata, poi scrittura.`:`Frame usati: ${a.physical} · Scrittore: ${writer==='none'?'nessuno':writer}. I frame fisici H0/H1 non si spostano.`}</text>
 </>;
}
function Latency({a,b,t,scenario,amount}:View){
 const unit=62,x0=55,segments=latencySegments(scenario);
 return <>
 <text x={30} y={35} className='mem-title'>Il tempo passa anche quando il lavoro utile è fermo</text>
 <text x={30} y={80} className='mem-small'>Stesso lavoro: 3 unità. Durate illustrative, non benchmark o limiti massimi.</text>
 {Array.from({length:13},(_,j)=><g key={j}><path d={`M${x0+j*unit} 165V340`} stroke='#d8e1e9'/><text x={x0+j*unit} y={363} textAnchor='middle' className='mem-small'>{j}</text></g>)}
 {segments.map((seg,j)=>{const x=x0+segments.slice(0,j).reduce((n,s)=>n+s.duration,0)*unit;return <g key={j}><rect x={x} y={205} width={seg.duration*unit-3} height={65} rx={7} fill={seg.useful?C.green:C.amber}/><text x={x+7} y={243} className='mem-small'>{seg.label}</text></g>;})}
 <path d={`M${x0+amount*unit} 130V375`} stroke='#b64d48' strokeWidth={3} strokeDasharray='7 5'/><text x={x0+amount*unit} y={120} textAnchor='middle' className='mem-small'>deadline {amount}</text>
 <Probe x={x0+mix(a.elapsed,b.elapsed,t)*unit} y={310} label='task'/>
 <text x={30} y={415} className='mem-label'>Lavoro utile: {a.useful}/3</text>
 <rect x={260} y={395} width={360} height={24} rx={6} fill={C.paper}/><rect x={260} y={395} width={120*mix(a.useful,b.useful,t)} height={24} rx={6} fill={C.green}/>
 <text x={30} y={470} className='mem-small'>{scenario==='prepared'?'Preparazione pagata prima della fase critica. Nessuna garanzia contro tutte le interferenze.':'Durante fault, reclaim e compattazione il progresso utile non aumenta.'}</text>
 </>;
}
function MemoryScene({mode,time,...view}:View&{mode:MemoryMode;time:number}){return <Scene title={modes[mode]} height={565}><g data-time={time.toFixed(4)}>
 {mode==='shootdown'?<Shootdown {...view}/>:mode==='buddy'?<Buddy {...view}/>:mode==='walk'?<Walk {...view}/>:mode==='balloon'?<Balloon {...view}/>:mode==='ksm'?<Ksm {...view}/>:<Latency {...view}/>}
 <Outcome a={view.a}/></g></Scene>;}
export function AosMemoryLab({id,title}:{id:string;title:string}){
 const[mode,setMode]=useState<MemoryMode>('shootdown'),[scenario,setScenario]=useState(defaultExperiment('shootdown')),[amount,setAmount]=useState(4),[writer,setWriter]=useState('A');
 const[time,setTime]=useState(0),[running,setRunning]=useState(false),[delay,setDelay]=useState(2400);
 const frames=useMemo(()=>memoryTrace(mode,scenario,amount,writer),[mode,scenario,amount,writer]),last=frames.length-1,step=Math.min(last,Math.floor(time)),a=frames[step],b=frames[Math.min(last,step+1)],playing=running&&time<last;
 useEffect(()=>{if(!playing)return;let raf=0,previous=0,elapsed=0;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const tick=(now:number)=>{if(previous){const dt=Math.min(now-previous,100);if(reduced){elapsed+=dt;if(elapsed>=delay){setTime(v=>Math.min(last,Math.floor(v)+1));elapsed=0;}}else setTime(v=>Math.min(last,v+dt/delay));}previous=now;raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);},[playing,delay,last]);
 const reset=()=>{setRunning(false);setTime(0);};
 return <div className='memory-experiments'><VisualPlayer id={id} title={title} frame={a} step={step} count={frames.length} onStep={n=>{setRunning(false);setTime(n);}} transport={{playing,delay,setDelay,stop:()=>setRunning(false),toggle:()=>{if(time>=last)setTime(0);setRunning(!playing);}}} options={<>
 <label>Scena<select aria-label='Scena memoria' value={mode} onChange={e=>{const m=e.target.value as MemoryMode;reset();setMode(m);setScenario(defaultExperiment(m));setAmount(m==='latency'?6:4);setWriter('A');}}>{Object.entries(modes).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
 <label>Esperimento<select aria-label='Esperimento memoria' value={scenario} onChange={e=>{reset();setScenario(e.target.value);}}>{experiments[mode].map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
 {mode==='buddy'&&<label>Richiesta<select aria-label='Frame richiesti' value={amount} onChange={e=>{reset();setAmount(Number(e.target.value));}}>{[2,4,8].map(n=><option key={n} value={n}>{n} frame</option>)}</select></label>}
 {mode==='ksm'&&<label>Scrittore<select aria-label='Mapping che scrive' value={writer} onChange={e=>{reset();setWriter(e.target.value);}}><option value='A'>A scrive XYZ</option><option value='B'>B scrive XYZ</option><option value='none'>Nessuna scrittura</option></select></label>}
 {mode==='latency'&&<label>Deadline<select aria-label='Deadline' value={amount} onChange={e=>{reset();setAmount(Number(e.target.value));}}>{[3,4,5,6,8,9,10,12].map(n=><option key={n} value={n}>{n} unità</option>)}</select></label>}
 <button type='button' className='mem-run' onClick={()=>{setTime(0);setRunning(true);}}>Prova configurazione</button>
 </>} scene={<MemoryScene mode={mode} scenario={scenario} amount={amount} writer={writer} a={a} b={b} t={time-step} time={time}/>} checks={[{label:'Cambia le condizioni, prevedi l’esito, poi ripeti',ok:true},{label:a.result?'Vincolo della prova rispettato':'Identità e risorse distinte durante i passaggi',ok:a.ok}]} legend='Blu: dati e mapping. Ambra: protocollo o attesa. Verde: risorsa libera o prova riuscita. Le durate sono illustrative; nessun comando reale.'/></div>;
}
