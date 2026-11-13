// Original deterministic models, adapted from the reviewed local lesson-1 prototype.
export type Item = {value:number;id:string;origin:string};
export type Position = {x:number;y:number};
export type SortingFrame = {
  title:string;detail:string;line:number;pos:Record<string,Position>;comparisons:number;
  i:number;j:number;key?:string;active?:string;prefix:number;shifts:number;
  output:string[];leftHead?:number|string;rightHead?:number|string;
  invariant:boolean;settled?:boolean;array?:number[];
};
export type SortingModel = {
  mode:'insertion'|'merge';items:Item[];frames:SortingFrame[];result:number[];
  identities:string[];lengths:[number,number];
};
const ordered=(a:Item[])=>a.every((v,i)=>!i||a[i-1].value<=v.value);
const clone=(f:SortingFrame):SortingFrame=>structuredClone(f);
export function insertion(input:number[]):SortingModel {
  const items=input.map((value,i)=>({value,id:'a'+i,origin:String(i+1)}));
  const a=[...items],pos=Object.fromEntries(items.map((v,i)=>[v.id,{x:100+80*i,y:180}]));
  const frames:SortingFrame[]=[];let comparisons=0,shifts=0;
  function push(title:string,detail:string,line:number,j=-1,i=-1,key?:Item,settled=false){
    frames.push(clone({title,detail,line,j,i,key:key?.id,pos,comparisons,shifts,
      prefix:settled?j+1:Math.max(1,j),settled,array:settled?a.map(v=>v.value):undefined,
      output:[],invariant:settled?ordered(a.slice(0,j+1)):true}));
  }
  push('Il primo elemento è già ordinato','Si estende un prefisso ordinato, una chiave alla volta.',0);
  for(let j=1;j<a.length;j++){
    const key=a[j];let i=j-1;pos[key.id]={x:100+j*80,y:70};
    push('Estrai key = '+key.value,'La chiave resta conservata mentre gli altri elementi fanno spazio.',2,j,i,key);
    while(i>=0){
      comparisons++;
      push('Confronta '+a[i].value+' con '+key.value,a[i].value>key.value?'Il valore è maggiore: deve spostarsi a destra.':'Il valore è minore o uguale: la posizione è trovata.',5,j,i,key);
      if(a[i].value<=key.value)break;
      const moved=a[i];a[i+1]=moved;pos[moved.id]={x:100+80*(i+1),y:180};shifts++;
      push('Sposta '+moved.value+' a destra','Uno spostamento, non uno scambio con key. La chiave resta sul ripiano.',6,j,i,key);i--;
    }
    a[i+1]=key;pos[key.id]={x:100+80*(i+1),y:180};
    push('Inserisci key nella posizione '+(i+2),'Il prefisso fino a j = '+(j+1)+' è ordinato e contiene gli elementi originali.',8,j,i,key,true);
  }
  return {mode:'insertion',items,frames,result:a.map(x=>x.value),identities:a.map(x=>x.id),lengths:[a.length,0]};
}
export function merge(left:number[],right:number[]):SortingModel {
  const l=left.map((value,i)=>({value,id:'l'+i,origin:'L'+(i+1)}));
  const r=right.map((value,i)=>({value,id:'r'+i,origin:'R'+(i+1)}));
  if(!ordered(l)||!ordered(r))throw Error('Le due parti di Merge devono essere già ordinate.');
  const items=[...l,...r],pos=Object.fromEntries(items.map(v=>[v.id,{x:110+85*Number(v.id.slice(1)),y:v.id[0]==='l'?80:175}]));
  const frames:SortingFrame[]=[],out:Item[]=[];let i=0,j=0,comparisons=0;
  function push(title:string,detail:string,line:number,active?:string){
    frames.push(clone({title,detail,line,pos,i,j,active,comparisons,shifts:0,prefix:0,
      output:out.map(x=>x.id),invariant:ordered(out),leftHead:l[i]?.value??'∞',rightHead:r[j]?.value??'∞'}));
  }
  push('Due parti già ordinate','Si confrontano soltanto le due teste non ancora consumate.',0);
  while(out.length<items.length){
    const lv=l[i]?.value??Infinity,rv=r[j]?.value??Infinity;comparisons++;
    push('Confronta '+(lv===Infinity?'∞':lv)+' e '+(rv===Infinity?'∞':rv),lv===rv?'Parità: la sinistra precede la destra, conservando la stabilità.':'La testa minore è il prossimo elemento del risultato.',1);
    const takeLeft=lv<=rv,node=takeLeft?l[i++]:r[j++];
    out.push(node);pos[node.id]={x:100+80*(out.length-1),y:310};
    push('Trasferisci '+node.value+' dalla '+(takeLeft?'sinistra':'destra'),'Il prefisso del risultato resta ordinato. Avanza soltanto la testa scelta.',takeLeft?2:3,node.id);
  }
  return {mode:'merge',items,frames,result:out.map(x=>x.value),identities:out.map(x=>x.id),lengths:[l.length,r.length]};
}
export function parseInput(value:string,max:number):number[]{
  if(!value.trim())return [];
  const a=value.split(/[ ,;]+/).filter(Boolean).map(Number);
  if(a.some(v=>!Number.isSafeInteger(v)||Math.abs(v)>999)||a.length>max)
    throw Error('Usa al massimo '+max+' interi tra −999 e 999.');
  return a;
}
