'use client';
export const P={ink:'#e8f1ff',muted:'#8ca5c6',line:'#29415e',cyan:'#57d9f8',violet:'#b899ff',green:'#63e5b4',amber:'#ffcc76',red:'#ff7f93',base:'#101e35'};
export const ease=(t:number)=>t*t*(3-2*t),mix=(a:number,b:number,t:number)=>a+(b-a)*ease(t),clamp=(n:number)=>Math.max(0,Math.min(1,n));
export type Point=readonly[number,number];
export function along(points:readonly Point[],t:number):Point{const lengths=points.slice(1).map((p,j)=>Math.hypot(p[0]-points[j][0],p[1]-points[j][1])),total=lengths.reduce((n,v)=>n+v,0);let d=clamp(t)*total;for(let j=0;j<lengths.length;j++){if(d<=lengths[j]||j===lengths.length-1){const k=lengths[j]?d/lengths[j]:0;return[points[j][0]+(points[j+1][0]-points[j][0])*k,points[j][1]+(points[j+1][1]-points[j][1])*k];}d-=lengths[j];}return points[0];}
export function Wire({d,color=P.line,width=2,dashed=false}:{d:string;color?:string;width?:number;dashed?:boolean}){return <path d={d} fill='none' stroke={color} strokeWidth={width} strokeDasharray={dashed?'5 7':undefined} strokeLinecap='round' strokeLinejoin='round'/>;}
export function Signal({points,t,tag,color=P.cyan,uid,probe='memory'}:{points:readonly Point[];t:number;tag:string;color?:string;uid:string;probe?:'memory'|'experiment'}){const p=along(points,ease(t));return <g data-memory-probe={probe==='memory'?true:undefined} data-experiment-probe={probe==='experiment'?true:undefined} transform={`translate(${p[0]} ${p[1]})`}><circle r={22} style={{fill:color}} opacity={.12}/><circle r={12} fill='#0c1830' stroke={color} strokeWidth={2}/><circle r={4} style={{fill:color}} filter={`url(#${uid}-glow)`}/>{tag&&<text y={-28} textAnchor='middle' className='mv-tag' style={{fill:color}}>{tag}</text>}</g>;}
export function Pill({x,y,text,color=P.cyan}:{x:number;y:number;text:string;color?:string}){return <g transform={`translate(${x} ${y})`}><rect width={text.length*7.8+25} height={27} rx={13.5} style={{fill:color}} fillOpacity={.1} stroke={color} strokeOpacity={.4}/><circle cx={12} cy={13.5} r={3} style={{fill:color}}/><text x={22} y={18} className='mv-tiny' style={{fill:color}}>{text}</text></g>;}
export function Chip({x,y,name,sub,valid=true,accent=P.cyan,uid}:{x:number;y:number;name:string;sub:string;valid?:boolean;accent?:string;uid:string}){return <g transform={`translate(${x} ${y})`}>
 {Array.from({length:7},(_,j)=><g key={j} stroke={P.line} strokeWidth={4}><path d={`M${-61+j*20} -64v-12M${-61+j*20} 64v12M-88 ${-43+j*14}h-12M88 ${-43+j*14}h12`}/></g>)}
 <path d='M-77 -63H66L88 -41V52L77 63H-77L-88 52V-52Z' style={{fill:`url(#${uid}-chip)`}} stroke={accent} strokeOpacity={.6}/>
 <path d='M-70 -47H58L72 -33V44H-70Z' fill='#0b182c' stroke={P.line}/><circle cx={-57} cy={-34} r={3} style={{fill:accent}}/>
 <text y={-12} textAnchor='middle' className='mv-chip-title'>{name}</text><text y={14} textAnchor='middle' className='mv-code' style={{fill:valid?accent:P.muted}}>{sub}</text>
 <g opacity={valid?1:.4}>{[0,1,2,3,4,5].map(j=><rect key={j} x={-55+j*20} y={32} width={12} height={4} rx={2} style={{fill:valid?accent:P.line}}/>)}</g>
 </g>;}
export function MemorySlab({x,y,w=100,h=65,depth=16,color=P.cyan,label,sub,uid,titleY}:{x:number;y:number;w?:number;h?:number;depth?:number;color?:string;label:string;sub?:string;uid:string;titleY?:number}){return <g transform={`translate(${x} ${y})`}>
 <ellipse cx={w/2+8} cy={h+depth+14} rx={w*.6} ry={12} fill='#030a15' opacity={.5}/>
 <path d={`M0 ${h}l${depth} ${depth}h${w}V${depth}L${w} 0v${h}Z`} style={{fill:color}} fillOpacity={.14} stroke={color} strokeOpacity={.55}/>
 <rect width={w} height={h} rx={7} style={{fill:`url(#${uid}-chip)`}} stroke={color} strokeWidth={1.5}/><path d={`M${w} 0l${depth} ${depth}M0 ${h}h${w}l${depth} ${depth}M${w} ${h}V0`} fill='none' stroke={color} strokeOpacity={.7}/>
 <text x={w/2} y={titleY??(sub?h*.42:h*.57)} textAnchor='middle' className='mv-label' style={{fill:color}}>{label}</text>{sub&&<text x={w/2} y={h*.73} textAnchor='middle' className='mv-tiny'>{sub}</text>}
 </g>;}
export function Header({kicker,title,subtitle}:{kicker:string;title:string;subtitle:string}){return <g><text x={34} y={31} className='mv-eyebrow'>{kicker}</text><text x={34} y={65} className='mv-title'>{title}</text><text x={34} y={91} className='mv-small'>{subtitle}</text></g>;}
