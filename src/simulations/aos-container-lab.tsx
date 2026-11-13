'use client';
import{useState,useMemo,useEffect}from'react';
import{VisualPlayer,Scene,NodeBox,Wire}from'./aos-visual-player';
import{containerTrace,containerModes,type ContainerMode,type ContainerFrame}from'./aos-container-model';
const mix=(a:number,b:number,t:number)=>a+(b-a)*(t*t*(3-2*t));
const ink='#203146',blue='#8ab5d5',green='#78c5a9',amber='#e5b67e';
function Token({x,y,label,visible=true}:{x:number;y:number;label:string;visible?:boolean}){return <g data-container-token={label} transform={`translate(${x} ${y})`} opacity={visible?1:0}><circle r={16} fill={amber} stroke={ink} strokeWidth={2}/><text textAnchor='middle' y={38} className='scene-small'>{label}</text></g>;}
function ContainerScene({mode,scenario,a,b,t,time}:{mode:ContainerMode;scenario:string;a:ContainerFrame;b:ContainerFrame;t:number;time:number}){
 const k=a.phase,x=mix(a.x,b.x,t),y=mix(a.y,b.y,t);
 return <Scene title={containerModes[mode]} height={500}><g data-time={time.toFixed(4)}>
 {mode==='pid'&&<>
  <rect x={25} y={40} width={850} height={420} rx={18} fill='none' stroke='#738da4'/><text x={45} y={72} className='scene-title'>Un kernel · vista host</text>
  <NodeBox x={55} y={110} w={210} title='Padre · PID 812' sub='hostname ubuntu-vm'/>
  <NodeBox x={55} y={260} w={210} title='systemd · PID 1' sub='non visibile nel figlio'/>
  <rect x={375} y={95} width={465} height={320} rx={18} fill='#edf4f9' stroke='#5287af' strokeDasharray='8 4'/><text x={400} y={128} fill={ink} style={{fontSize:17,fontWeight:700}}>Nuovi namespace PID e UTS</text>
  <text x={400} y={160} fill={ink} style={{fontSize:16}}>hostname: {a.boxName}</text>
  <Wire d='M265 155H355V215H420'/>
  <g data-process='shell' opacity={k>=1?1:t} transform={`translate(425 195) scale(${k===0?mix(.8,1,t):1})`}><rect width={180} height={82} rx={12} fill={blue} stroke={ink}/><text x={90} y={30} textAnchor='middle' fill={ink}>shell · PID interno 1</text><text x={90} y={58} textAnchor='middle' fill={ink}>stesso task: host 4242</text></g>
  {k>=3&&<><Wire d='M600 270L665 300'/><NodeBox x={625} y={305} w={195} title='worker · PID 2' sub='host: 4243' tone='teal'/></>}
  <text x={400} y={390} fill={ink} style={{fontSize:15}}>{k>=4?'/proc: vista del namespace figlio':'/proc: mount ancora da predisporre'}</text>
  <text x={45} y={488} className='scene-small'>I numeri dipendono dalla vista; le identità dei task restano le stesse.</text>
 </>}
 {mode==='mount'&&(()=>{
  const pos=(phase:number,id:string)=>id==='root'?(phase>=2?[720,290]:[450,100]):id==='rootfs'?(phase>=2?[450,100]:[450,275]):id==='bin'?(phase>=2?[180,285]:[180,410]):[450,410];
  const xy=(id:string)=>{if(k===1&&b.phase===2){if(id==='root')return[mix(450,720,Math.min(1,t*2)),mix(100,290,Math.max(0,t*2-1))];if(id==='rootfs')return[450,mix(275,100,Math.max(0,t*2-1))];}const f=pos(k,id),g=pos(b.phase,id);return[mix(f[0],g[0],t),mix(f[1],g[1],t)];};const root=xy('root'),fs=xy('rootfs'),bin=xy('bin');const rootOpacity=k>=3?0:b.phase>=3?1-t:1;
  return <><text x={40} y={45} className='scene-title'>Il contenuto dei file resta al suo posto: cambiano mount e riferimenti</text>
   <Wire d={`M${fs[0]} ${fs[1]+35}L${bin[0]} ${bin[1]-30}`}/>
   <g opacity={rootOpacity}><Wire d={`M${k>=2?fs[0]:root[0]} ${k>=2?fs[1]+35:root[1]+35}L${k>=2?root[0]:fs[0]} ${k>=2?root[1]-30:fs[1]-30}`}/></g>
   {[['root','Vecchia root host',root],['rootfs',k>=2?'rootfs = nuova /':'directory rootfs',fs],['bin','bin · comandi BusyBox',bin]].map(([id,label,coord])=>{const c=coord as number[];return <g key={String(id)} data-mount-node={id} opacity={id==='root'?rootOpacity:1} transform={`translate(${c[0]-95} ${c[1]-30})`}><rect width={190} height={70} rx={12} fill={id==='rootfs'?green:blue} stroke={ink}/><text x={95} y={30} fill={ink} textAnchor='middle'>{String(label)}</text><text x={95} y={53} fill={ink} textAnchor='middle' style={{fontSize:14}}>{id==='root'&&k>=2?'/oldroot':id==='rootfs'&&k<2&&k>=1?'bind mount predisposto':''}</text></g>;})}
   <NodeBox x={550} y={390} w={300} title={a.rootDetached?'Vecchia root scollegata':k>=1?'Propagazione privata':'Namespace da predisporre'} sub='Nessuna cancellazione dei dati host' tone={k>=1?'teal':'amber'}/>
  </>;
 })()}
 {mode==='network'&&<>
  <rect x={35} y={55} width={360} height={350} rx={18} fill='none' stroke='#738da4'/><rect x={505} y={55} width={360} height={350} rx={18} fill='none' stroke='#738da4'/>
  <text x={60} y={95} className='scene-title'>Namespace nuovo</text><text x={530} y={95} className='scene-title'>Namespace host</text>
  <NodeBox x={70} y={125} w={290} title='ve1' sub={k>=2?'192.168.1.100/24 · UP':'indirizzo assente · DOWN'} tone={k>=2?'teal':'amber'}/>
  <NodeBox x={540} y={125} w={290} title='ve2' sub={k>=2?scenario==='down'?'192.168.1.200/24 · DOWN':'192.168.1.200/24 · UP':'indirizzo assente · DOWN'} tone={k>=2&&scenario!=='down'?'teal':'amber'}/>
  <g opacity={k>=1?1:t}><Wire d='M250 215V270H650V215' active={k>=2&&scenario!=='down'}/><text x={405} y={245} className='scene-small'>veth pair</text></g>
  <text x={70} y={355} className='scene-small'>lo: propria istanza di loopback</text><text x={540} y={355} className='scene-small'>eth0 non trasferita al namespace</text>
  {scenario!=='ok'&&k>=3&&<><path d={`M${scenario==='internet'?360:440} 225V295`} stroke='#be5555' strokeWidth={6}/><text x={scenario==='internet'?300:380} y={335} className='scene-small'>{scenario==='down'?'endpoint DOWN':'rotta assente'}</text></>}
  <Token x={x} y={270} label={k>=3&&scenario==='ok'?'risposta':'richiesta'} visible={k>=2}/>
  <text x={45} y={460} className='scene-title'>{scenario==='internet'?'Internet: nessuna rotta creata automaticamente':scenario==='down'?'Un cavo virtuale non basta: verificare lo stato degli endpoint':'Stessa sottorete: richiesta e risposta tra gli endpoint'}</text>
 </>}
 {mode==='cap'&&<>
  <NodeBox x={55} y={55} w={310} title='Permitted · P' sub={a.permitted?'NET_BIND_SERVICE disponibile':'nessuna capability disponibile'} tone={a.permitted?'teal':'amber'}/>
  <NodeBox x={55} y={215} w={310} title='Effective · E' sub={a.effective?'capability attiva':'capability spenta'} tone={a.effective?'teal':'amber'}/>
  <NodeBox x={55} y={375} w={310} title='Bounding · B' sub={a.bounding?'file-permitted non filtrata':'capability rimossa da B'} tone={a.bounding?'teal':'amber'}/>
  <Wire d='M180 145V210'/><Wire d='M370 255H615'/>
  <NodeBox x={620} y={215} w={235} title='bind sulla porta 80' sub={a.effective?'controllo consentito':'privilegio non attivo'} tone={a.effective?'teal':'amber'}/>
  <Token x={x} y={y} label='NET_BIND' visible={k<6}/>
  <text x={415} y={390} className='scene-title'>E ⊆ P</text><text x={415} y={425} className='scene-small'>{k>=3?'B non contiene la capability, ma P può ancora contenerla.':'La porta 80 è privilegiata nella configurazione del modello.'}</text>
 </>}
 </g></Scene>;
}
export function AosContainerLab({id,title}:{id:string;title:string}){
 const[mode,setMode]=useState<ContainerMode>('pid'),[scenario,setScenario]=useState('ok'),[time,setTime]=useState(0),[running,setRunning]=useState(false),[delay,setDelay]=useState(2400);
 const frames=useMemo(()=>containerTrace(mode,scenario),[mode,scenario]),last=frames.length-1,step=Math.min(last,Math.floor(time)),a=frames[step],b=frames[Math.min(last,step+1)],playing=running&&time<last;
 useEffect(()=>{if(!playing)return;let raf=0,previous=0,elapsed=0;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const tick=(now:number)=>{if(previous){const dt=Math.min(now-previous,100);if(reduced){elapsed+=dt;if(elapsed>=delay){setTime(v=>Math.min(last,Math.floor(v)+1));elapsed=0;}}else setTime(v=>Math.min(last,v+dt/delay));}previous=now;raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);},[playing,delay,last]);
 const reset=()=>{setRunning(false);setTime(0);};
 return <VisualPlayer id={id} title={title} frame={a} step={step} count={frames.length} onStep={n=>{setRunning(false);setTime(n);}} transport={{playing,delay,setDelay,stop:()=>setRunning(false),toggle:()=>{if(time>=last)setTime(0);setRunning(!playing);}}} options={<>
  <label>Scena<select aria-label='Scena container' value={mode} onChange={e=>{reset();setMode(e.target.value as ContainerMode);setScenario('ok');}}>{Object.entries(containerModes).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
  {mode==='network'&&<label>Rete<select aria-label='Scenario rete' value={scenario} onChange={e=>{reset();setScenario(e.target.value);}}><option value='ok'>Collegamento locale configurato</option><option value='down'>Endpoint DOWN</option><option value='internet'>Destinazione esterna senza rotta</option></select></label>}
 </>} scene={<ContainerScene mode={mode} scenario={scenario} a={a} b={b} t={time-step} time={time}/>} checks={[{label:'Un solo kernel condiviso',ok:true},{label:mode==='cap'?'Effective resta sottoinsieme di Permitted':'Namespace distinti per tipo',ok:mode!=='cap'||!a.effective||a.permitted}]} legend='ID dei task, archi e mount restano riconoscibili. I pacchetti attraversano veth; le chiavi rappresentano autorizzazioni. Modello qualitativo: nessun comando o privilegio viene eseguito sul dispositivo.'/>
}
