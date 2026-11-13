'use client';
import{useEffect,useMemo,useState}from'react';
import{VisualPlayer,Scene,NodeBox,Wire}from'./aos-visual-player';
import{memoryTrace,modes,type MemoryMode,type MemoryFrame}from'./aos-memory-model';
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
const mix=(a:number,b:number,t:number)=>lerp(a,b,t*t*(3-2*t));
const colors={blue:'#83afd4',green:'#74c8aa',amber:'#e7b578',ink:'#162b43'};
function Tile({x,y,label,fill=colors.blue,w=72}:{x:number;y:number;label:string;fill?:string;w?:number}){return <g transform={`translate(${x} ${y})`}><rect width={w} height={46} rx={8} fill={fill} stroke={colors.ink}/><text x={w/2} y={28} textAnchor='middle' fill={colors.ink} style={{fontSize:16,fontWeight:700}}>{label}</text></g>;}
function Dot({x,y,label='richiesta'}:{x:number;y:number;label?:string}){return <g data-memory-token={label} transform={`translate(${x} ${y})`}><circle r={13} fill='#dfaa63' stroke='#172c44' strokeWidth={2}/><text y={32} textAnchor='middle' className='scene-small'>{label}</text></g>;}
function MemoryScene({mode,alternative,a,b,t,time}:{mode:MemoryMode;alternative:boolean;a:MemoryFrame;b:MemoryFrame;t:number;time:number}){
 const phase=a.phase,x=mix(a.x,b.x,t),y=mix(a.y,b.y,t);
 return <Scene title={modes[mode]} height={490}><g data-time={time.toFixed(4)}>
 {mode==='shootdown'&&<>
  <NodeBox x={55} y={65} w={210} title='Core 0' sub='PTE aggiornata'/>
  <NodeBox x={355} y={65} w={210} title='Core 1 · stesso AS' sub={phase>=2?'TLB invalidata':'TLB: vecchio frame'} active={phase===2}/>
  <NodeBox x={645} y={65} w={210} title='Core 2 · stesso AS' sub={phase>=3?'TLB invalidata':'TLB: vecchio frame'} active={phase===3}/>
  <Wire d='M265 96H350'/><Wire d='M265 128H300V190H750V155'/>
  <Wire d='M450 155V240H160V210'/><Wire d='M750 155V300H160V210'/>
  <NodeBox x={55} y={340} w={230} title='Barriera di riuso' sub={a.safe?'tutti gli ACK ricevuti':'frame non riutilizzabile'} tone={a.safe?'teal':'amber'}/>
  <NodeBox x={620} y={340} w={230} title='Nuovo proprietario' sub={a.safe?'può usare il frame':'attende'}/>
  <Dot x={x} y={y} label={phase<2?'IPI':phase<4?'ACK':'frame'}/>
  {phase<4&&(()=>{const points=[[150,195],[750,120],[750,240],[150,300],[150,300]],aa=points[phase],bb=points[b.phase];return <Dot x={mix(aa[0],bb[0],t)} y={mix(aa[1],bb[1],t)} label={phase<2?'IPI core 2':'ACK core 2'}/>;})()}
  <text x={330} y={440} className='scene-small'>Core 3 · altro AS: fuori dai destinatari ordinari di questo esempio</text>
 </>}
 {mode==='buddy'&&!alternative&&<>
  <text x={60} y={62} className='scene-title'>Quattro frame fisici da 4 KiB · ID stabili</text>
  {[0,1,2,3].map(j=>{const split=phase>=2&&phase<=3?2:phase===1||phase===4?1:0;const gap=split===2?(j===0?0:j===1?8:24):split===1?(j<2?0:24):0;const next=b.phase>=2&&b.phase<=3?2:b.phase===1||b.phase===4?1:0;const ng=next===2?(j===0?0:j===1?8:24):next===1?(j<2?0:24):0;return <g key={j} data-block={`p${j}`} transform={`translate(${95+j*170+mix(gap,ng,t)} ${135+mix(split,next,t)*25*(j<2?1:0)})`}><rect width={162} height={95} rx={8} fill={j===0&&phase===3?colors.amber:colors.green} stroke={colors.ink}/><text x={80} y={40} textAnchor='middle' fill={colors.ink}>P{j} · 4 KiB</text><text x={80} y={69} textAnchor='middle' fill={colors.ink}>{j===0&&phase===3?'A1 occupato':'libero'}</text></g>;})}
  <NodeBox x={70} y={335} w={240} title='Ordine 0 · 4 KiB' sub={phase===2?'A1 e A2 liberi':phase===3?'A2 disponibile':'nessun blocco in lista'}/>
  <NodeBox x={330} y={335} w={240} title='Ordine 1 · 8 KiB' sub={phase===1||phase===4?'A e B liberi':phase===2||phase===3?'B disponibile':'nessun blocco in lista'}/>
  <NodeBox x={590} y={335} w={240} title='Ordine 2 · 16 KiB' sub={phase===0||phase===5?'blocco completo libero':'diviso nei sotto-blocchi'}/>
  <text x={70} y={280} className='scene-small'>Split e merge cambiano i blocchi disponibili; non spostano il contenuto delle pagine.</text>
 </>}
 {mode==='buddy'&&alternative&&<>
  <text x={50} y={60} className='scene-title'>Compattazione: si copiano le pagine mobili, non le pagine libere</text>
  {Array.from({length:8},(_,j)=><g key={j}><rect x={55+j*100} y={130} width={90} height={190} rx={9} fill='none' stroke='#7890a8'/><text x={100+j*100} y={350} textAnchor='middle' className='scene-small'>frame {j}</text></g>)}
  {[0,2,4,6].map((id,j)=>{const from=phase>=2?j:id,to=b.phase>=2?j:id;return <g key={id} data-block={`p${id}`} transform={`translate(${mix(60+from*100,60+to*100,t)} ${mix(155,155,t)})`}><rect width={80} height={100} rx={8} fill={colors.blue}/><text x={40} y={55} textAnchor='middle' fill={colors.ink}>P{id}</text></g>;})}
  <NodeBox x={450} y={390} w={380} title={phase>=3?'Frame 4–7 contigui liberi':'Quattro frame liberi, ma separati'} sub='La migrazione può fallire su pagine non mobili.' tone={phase>=3?'teal':'amber'}/>
 </>}
 {mode==='walk'&&<>
  <text x={40} y={42} className='scene-title'>Ogni PTE guest richiede prima il proprio walk stage 2</text>
  {Array.from({length:alternative?4:5},(_,row)=><g key={row}><text x={15} y={112+row*62} className='scene-small'>{row===(alternative?3:4)?'dato GPA':`PTE G${row+1}`}</text>{Array.from({length:alternative?4:5},(_,col)=>{const isFinal=row===(alternative?3:4)&&col===(alternative?3:4);return <Tile key={col} x={115+col*135} y={80+row*62} w={110} label={col===(alternative?3:4)?isFinal?'dato':'PTE guest':`EPT ${col+1}`} fill={col===(alternative?3:4)?colors.green:colors.blue}/>;})}</g>)}
  <Dot x={x} y={y} label={a.reads?`lettura ${a.reads}`:'accesso'}/>
  <text x={40} y={440} className='scene-small'>Pagine {alternative?'2 MiB: 3 livelli per entrambi gli stadi':'4 KiB: 4 livelli per entrambi gli stadi'} · cache volutamente assenti</text>
 </>}
 {mode==='balloon'&&<>
  <rect x={30} y={45} width={840} height={220} rx={15} fill='none' stroke='#7890a8'/><text x={50} y={78} className='scene-title'>Guest: pagine disponibili e pagine cedute al balloon</text>
  {Array.from({length:8},(_,j)=><Tile key={j} x={55+j*100} y={110} label={`G${j}`} fill={j<4?colors.blue:j>=6&&phase>=1&&phase<4?colors.amber:colors.green}/>)}
  <ellipse cx={730} cy={210} rx={mix(phase>=1&&phase<4?100:40,b.phase>=1&&b.phase<4?100:40,t)} ry={mix(phase>=1&&phase<4?38:20,b.phase>=1&&b.phase<4?38:20,t)} fill='#e7b57888' stroke='#b58a42'/><text x={730} y={195} textAnchor='middle' className='scene-small'>balloon driver</text>
  <rect x={35} y={300} width={830} height={155} rx={15} fill='none' stroke='#7890a8'/><text x={55} y={332} className='scene-title'>Host: backing fisico → pool recuperabile</text>
  {[0,1].map(j=>{const pos=(k:number)=>k>=3?[680+j*80,370]:[580+j*80,205];const [ax,ay]=pos(phase),[bx,by]=pos(b.phase);return <g key={j} data-block={`backing${j}`} transform={`translate(${mix(ax,bx,t)} ${mix(ay,by,t)})`}><rect width={62} height={46} rx={7} fill={colors.amber} stroke={colors.ink}/><text x={31} y={28} fill={colors.ink} textAnchor='middle'>H{j+6}</text></g>;})}
  <text x={55} y={400} className='scene-small'>Le pagine guest cedute non sono più usabili</text><text x={55} y={425} className='scene-small'>dalle applicazioni finché il balloon non si sgonfia.</text>
 </>}
 {mode==='ksm'&&<>
  <NodeBox x={75} y={65} w={230} title='Mapping A' sub={phase>=4?'scrive la propria copia':'contenuto iniziale'}/><NodeBox x={595} y={65} w={230} title='Mapping B' sub='contenuto iniziale'/>
  {(()=>{const pos=(k:number,j:number)=>k>=1&&k<=2?[410,260]:[j?(k>=3?410:620):200,260];const [ax,ay]=pos(phase,0),[bx,by]=pos(b.phase,0),[cx,cy]=pos(phase,1),[dx,dy]=pos(b.phase,1);const xa=mix(ax,bx,t),xb=mix(cx,dx,t);return <>
   <Wire d={`M190 155L${xa+38} 250`}/><Wire d={`M710 155L${xb+38} 250`}/>
   <g data-block='copyA' transform={`translate(${xa} ${mix(ay,by,t)})`}><rect width={90} height={100} rx={10} fill={phase>=4?colors.amber:colors.blue}/><text x={45} y={50} textAnchor='middle' fill={colors.ink}>{phase>=4?'XYZ':'ABC'}</text><text x={45} y={78} textAnchor='middle' fill={colors.ink}>frame A</text></g>
   <g data-block='copyB' opacity={phase>=1&&phase<=2?0:1} transform={`translate(${xb} ${mix(cy,dy,t)})`}><rect width={90} height={100} rx={10} fill={colors.blue}/><text x={45} y={50} textAnchor='middle' fill={colors.ink}>ABC</text><text x={45} y={78} textAnchor='middle' fill={colors.ink}>frame B</text></g>
  </>;})()}
  <text x={110} y={415} className='scene-title'>{phase>=1&&phase<=2?'Riferimenti condivisi · sola lettura':phase>=3?'Copia privata prima della scrittura':'Due backing fisici distinti'}</text>
 </>}
 {mode==='latency'&&<>
  <text x={45} y={55} className='scene-title'>Una deadline non si valuta dalla sola latenza media</text>
  <path d='M100 280H830M560 100V390' stroke='#9b6661' strokeWidth={2} strokeDasharray='7 5'/><text x={525} y={420} className='scene-small'>deadline 6</text>
  {(alternative?[['Esecuzione',0,3,colors.green]]:[['Esecuzione',0,1,colors.green],['Fault',1,2,colors.amber],['Ripresa',3,1,colors.green],['Reclaim',4,1,colors.amber],['Compaction',5,2,colors.amber],['Ripresa',7,1,colors.green]]).map(([label,start,len,fill])=><g key={label+'-'+start}><rect x={110+Number(start)*75} y={180} width={Number(len)*75-5} height={60} rx={8} fill={String(fill)}/><text x={112+Number(start)*75} y={215} fill={colors.ink} style={{fontSize:14}}>{label}</text></g>)}
  <Dot x={x} y={300} label='task'/><path d={`M${x} 245V325`} stroke={colors.ink} strokeWidth={2}/>
  <text x={55} y={370} className='scene-small'>{alternative?'Il costo di preparazione viene pagato prima della fase critica.':'Stallo: il lavoro utile aspetta il percorso del kernel.'}</text>
 </>}
 </g></Scene>;
}
export function AosMemoryLab({id,title}:{id:string;title:string}){
 const[mode,setMode]=useState<MemoryMode>('shootdown'),[alternative,setAlternative]=useState(false),[time,setTime]=useState(0),[running,setRunning]=useState(false),[delay,setDelay]=useState(2400);
 const frames=useMemo(()=>memoryTrace(mode,alternative),[mode,alternative]),last=frames.length-1,step=Math.min(last,Math.floor(time)),a=frames[step],b=frames[Math.min(last,step+1)],fraction=time-step,playing=running&&time<last;
 useEffect(()=>{if(!playing)return;let raf=0,previous=0,elapsed=0;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const tick=(now:number)=>{if(previous){const dt=Math.min(now-previous,100);if(reduced){elapsed+=dt;if(elapsed>=delay){setTime(v=>Math.min(last,Math.floor(v)+1));elapsed=0;}}else setTime(v=>Math.min(last,v+dt/delay));}previous=now;raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);},[playing,delay,last]);
 const reset=()=>{setRunning(false);setTime(0);};
 return <VisualPlayer id={id} title={title} frame={a} step={step} count={frames.length} onStep={n=>{setRunning(false);setTime(n);}} transport={{playing,delay,setDelay,stop:()=>setRunning(false),toggle:()=>{if(time>=last)setTime(0);setRunning(!playing);}}} options={<>
  <label>Scena<select aria-label='Scena memoria' value={mode} onChange={e=>{reset();setMode(e.target.value as MemoryMode);setAlternative(false);}}>{Object.entries(modes).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
  {['buddy','walk','latency'].includes(mode)&&<label>Scenario<select aria-label='Scenario memoria' value={alternative?'alternativo':'base'} onChange={e=>{reset();setAlternative(e.target.value==='alternativo');}}><option value='base'>{mode==='buddy'?'Split / merge':mode==='walk'?'4 KiB · 4 + 4 livelli':'Fault e compattazione'}</option><option value='alternativo'>{mode==='buddy'?'RAM frammentata e compattazione':mode==='walk'?'2 MiB · 3 + 3 livelli':'Memoria preparata'}</option></select></label>}
 </>} scene={<MemoryScene mode={mode} alternative={alternative} a={a} b={b} t={fraction} time={time}/>} checks={[{label:'Modello didattico, non benchmark',ok:true},{label:a.safe?'Fase conclusa':'Protocollo in corso',ok:a.safe}]} legend='Blu: pagine o tabelle. Verde: disponibilità o esito. Ambra: richiesta, attesa o backing ceduto. ID e collegamenti conservano il significato durante il movimento.'/>
}
