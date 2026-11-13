'use client';
import {useEffect,useId,useMemo,useRef,useState} from 'react';
import {ChevronLeft,ChevronRight,Play,Pause,RotateCcw,Maximize2,Minimize2} from 'lucide-react';
import {insertion,merge,parseInput} from './algoritmi-sorting-models';
const codes={insertion:[[0,'for j = 2..n'],[2,'  key ← A[j]; i ← j−1'],[5,'  while i > 0 and A[i] > key'],[6,'    A[i+1] ← A[i]; i ← i−1'],[8,'  A[i+1] ← key']] as const,
  merge:[[0,'i ← 1; j ← 1'],[1,'if L[i] ≤ R[j]'],[2,'  scrivi L[i]; i ← i+1'],[3,'else scrivi R[j]; j ← j+1']] as const};
export function AlgoritmiSortingLab({id,title,mode}:{id:string;title:string;mode:'insertion'|'merge'}){
  const isMerge=mode==='merge',uid=useId().replaceAll(':',''),root=useRef<HTMLElement>(null);
  const [left,setLeft]=useState(isMerge?'2,4,5,7':'5,2,4,6,1,3'),[right,setRight]=useState('1,2,3,6');
  const [input,setInput]=useState({left:isMerge?[2,4,5,7]:[5,2,4,6,1,3],right:[1,2,3,6]});
  const [error,setError]=useState(''),[time,setTime]=useState(0),[running,setRunning]=useState(false);
  const [delay,setDelay]=useState(1000),[zoom,setZoom]=useState(false),[expanded,setExpanded]=useState(false);
  const model=useMemo(()=>isMerge?merge(input.left,input.right):insertion(input.left),[isMerge,input]);
  const last=model.frames.length-1,playing=running&&time<last;
  const [reduced,setReduced]=useState(false);
  useEffect(()=>{
    const query=matchMedia('(prefers-reduced-motion: reduce)'),update=()=>setReduced(query.matches);
    update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update);
  },[]);
  useEffect(()=>{
    if(!playing)return;
    let raf=0,previous=0;
    const tick=(now:number)=>{const dt=previous?Math.min(100,now-previous):0;previous=now;setTime(t=>Math.min(last,t+dt/delay));raf=requestAnimationFrame(tick);};
    raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);
  },[playing,last,delay]);
  useEffect(()=>{
    if(!expanded)return;
    const previous=document.body.style.overflow;document.body.style.overflow='hidden';root.current?.focus();
    return()=>{document.body.style.overflow=previous;};
  },[expanded]);
  function move(n:number){setRunning(false);setTime(Math.max(0,Math.min(last,n)));}
  function toggle(){if(time>=last)setTime(0);setRunning(!playing);}
  function apply(l=left,r=right){
    setRunning(false);
    try{
      const a=parseInput(l,isMerge?5:10),b=isMerge?parseInput(r,5):[];
      if(isMerge){if(!a.length&&!b.length)throw Error('Inserisci almeno un elemento.');merge(a,b);}
      else if(a.length<2)throw Error('Inserisci almeno due elementi.');
      setInput({left:a,right:b});setTime(0);setError('');
    }catch(e){setError((e as Error).message);}
  }
  const shown=reduced?Math.floor(time):time,k=Math.min(last,Math.floor(shown)),f=model.frames[k],g=model.frames[Math.min(k+1,last)],u=shown-k,ease=u*u*(3-2*u),d=u>.001?g:f;
  const moving=u>.001?model.items.find(item=>f.pos[item.id].x!==g.pos[item.id].x||f.pos[item.id].y!==g.pos[item.id].y):undefined;
  const rows:[number,number,string][]=isMerge?[[80,model.lengths[0],'L'],[175,model.lengths[1],'R'],[310,model.items.length,'Output']]:[[180,model.items.length,'A / indici da 1']];
  return <section ref={root} id={id} tabIndex={-1} className={`simulation alg-lab ${expanded?'alg-expanded':''}`} aria-label={title} data-playing={playing} data-time={shown.toFixed(4)} onKeyDown={e=>{
    if(e.key==='Escape')setExpanded(false);
    if((e.target as HTMLElement).closest('input,select,button'))return;
    if(e.key==='ArrowRight'){e.preventDefault();move(Math.floor(time)+1);}
    if(e.key==='ArrowLeft'){e.preventDefault();move(Math.ceil(time)-1);}
    if(e.code==='Space'){e.preventDefault();toggle();}
  }}>
    <header className="alg-heading"><div><span className="alg-eyebrow">ALGORITMI / ESPLORAZIONE ANIMATA</span><h3>{title}</h3><p>{isMerge?'Confronta le teste di due sequenze già ordinate. Il minimo scende nell’output; a parità vince la sinistra.':'Estrai la chiave, fai scorrere gli elementi maggiori e osserva come cresce il prefisso ordinato.'}</p></div><button aria-label={expanded?'Riduci scena':'Espandi scena'} onClick={()=>setExpanded(!expanded)}>{expanded?<Minimize2 size={17}/>:<Maximize2 size={17}/>}</button></header>
    <div className="alg-options"><label>{isMerge?'Parte sinistra (0–5 interi)':'Sequenza (2–10 interi)'}<input aria-label="Prima sequenza" value={left} onChange={e=>setLeft(e.target.value)}/></label>{isMerge&&<label>Parte destra (0–5 interi)<input aria-label="Parte destra" value={right} onChange={e=>setRight(e.target.value)}/></label>}
      <button onClick={()=>apply()}>Applica input</button><button onClick={()=>{const l=isMerge?'':'6,5,4,3,2,1',r=isMerge?'1,2,2,3':right;setLeft(l);setRight(r);apply(l,r);}}>{isMerge?'Parità e parte vuota':'Caso decrescente'}</button>
    </div>{error&&<p className="alg-error" role="alert">{error}</p>}
    <div className="alg-layout"><div className="alg-scene-column"><div className="alg-viewport"><svg className={zoom?'alg-zoomed':''} viewBox="0 0 960 425" role="img" aria-label={isMerge?'Due parti ordinate e trasferimenti nell’output':'Array e chiave estratta'}>
      <defs><marker id={`arrow-${uid}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10" fill="#b77b2f"/></marker><pattern id={`grid-${uid}`} width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="#638596" opacity=".12"/></pattern></defs>
      <rect width="960" height="425" fill={`url(#grid-${uid})`}/>
      {rows.map(([y,n,label])=><g key={y}><text x="25" y={y-48} className="alg-row-label">{label}</text>{Array.from({length:n},(_,i)=>{const x=isMerge&&y!==310?110+85*i:100+80*i;return <g key={i}><rect x={x-30} y={y-29} width="60" height="60" rx="10" className="alg-slot"/>{!isMerge&&<text x={x} y={y+57} textAnchor="middle" className="alg-index">{i+1}</text>}</g>;})}</g>)}
      {!isMerge?<text x="25" y="35" className="alg-row-label">Key: valore conservato fuori dall’array</text>:<>{[80,175].map((y,i)=><text key={y} x={110+85*model.lengths[i]} y={y+10} className="alg-row-label">∞</text>)}</>}
      {moving&&<path className="alg-motion-path" markerEnd={`url(#arrow-${uid})`} d={`M${f.pos[moving.id].x},${f.pos[moving.id].y} Q${(f.pos[moving.id].x+g.pos[moving.id].x)/2+35},${(f.pos[moving.id].y+g.pos[moving.id].y)/2-35} ${g.pos[moving.id].x},${g.pos[moving.id].y}`}/>}
      {model.items.map(item=>{
        const a=f.pos[item.id],b=g.pos[item.id],x=a.x+(b.x-a.x)*ease,y=a.y+(b.y-a.y)*ease;
        const key=isMerge?d.active===item.id:d.key===item.id;
        const head=isMerge&&(item.id==='l'+d.i||item.id==='r'+d.j);
        const sorted=!key&&(isMerge?d.output.includes(item.id):a.y===180&&Math.round((a.x-100)/80)<d.prefix);
        return <g key={item.id} data-item={item.id} transform={`translate(${x},${y})`} className={`alg-token ${key?'alg-active':''} ${head?'alg-head':''} ${sorted?'alg-sorted':''}`}><rect x="-30" y="-29" width="60" height="60" rx="10"/><text y="5" textAnchor="middle" className="alg-value">{item.value}</text><text y="22" textAnchor="middle" className="alg-identity">{item.origin}</text></g>;
      })}
    </svg></div><div className="alg-legend"><span>{isMerge?'Blu: teste · Verde: output ordinato · Gli ID L/R distinguono gli uguali.':'Verde: prefisso ordinato · Oro: key · I numeri piccoli identificano gli elementi originali.'} Scorri la scena se non entra nello schermo.</span><button aria-label={zoom?'Riduci zoom':'Ingrandisci scena'} onClick={()=>setZoom(!zoom)}>{zoom?'Zoom −':'Zoom +'}</button></div></div>
    <aside className="alg-inspector"><span className="alg-eyebrow">STATO CORRENTE</span><h4>{d.title}</h4><p aria-live="polite">{d.detail}</p><output className="alg-pill">{isMerge?`Teste: L = ${d.leftHead} · R = ${d.rightHead}`:`j = ${d.j<0?'—':d.j+1} · i = ${d.i<0?0:d.i+1}`}</output><div className="alg-invariant">{isMerge?'Proprietà: l’output contiene in ordine gli elementi già consumati; le teste sono i minimi rimasti.':'Invariante: prima di estrarre key, A[1..j−1] è ordinato. Durante gli spostamenti key resta conservata.'}</div><pre aria-label="Pseudocodice sincronizzato">{codes[mode].map(([line,code])=><span key={line} className={d.line===line?'alg-code-current':''}>{code}</span>)}</pre><output className="alg-stats">Confronti tra {isMerge?'teste (sentinelle incluse)':'chiavi'}: {d.comparisons} · {isMerge?`Scritture: ${d.output.length}`:`Spostamenti: ${d.shifts}`}</output></aside></div>
    <div className="alg-transport"><div className="alg-controls"><button aria-label="Indietro" disabled={time<=0} onClick={()=>move(Math.ceil(time)-1)}><ChevronLeft size={17}/>Indietro</button><button className="alg-play" aria-label={playing?'Pausa':'Riproduci animazione'} onClick={toggle}>{playing?<Pause size={17}/>:<Play size={17}/>} {playing?'Pausa':'Riproduci'}</button><button aria-label="Avanti" disabled={time>=last} onClick={()=>move(Math.floor(time)+1)}>Avanti<ChevronRight size={17}/></button><button aria-label="Ricomincia" onClick={()=>move(0)}><RotateCcw size={17}/>Ricomincia</button><label>Ritmo<select aria-label="Velocità animazione" value={delay} onChange={e=>setDelay(Number(e.target.value))}><option value={1500}>Lento</option><option value={1000}>Normale</option><option value={550}>Veloce</option></select></label><output>{k+1} / {model.frames.length}</output></div><label className="alg-timeline">Passaggio<input aria-label="Passaggio" type="range" min={0} max={last} value={k} onChange={e=>move(Number(e.target.value))}/></label></div>
    <p className="alg-note">Frecce ← →: passaggi · Spazio: riproduci/pausa. {isMerge?'Le sentinelle rappresentano valori maggiori di ogni chiave valida.':'Il buco è una posizione logica da riscrivere: l’array può contenere copie temporanee.'} I movimenti non misurano il tempo di esecuzione.</p>
  </section>;
}
