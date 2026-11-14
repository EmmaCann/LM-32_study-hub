import Link from 'next/link';
import {getTopics} from '@/lib/content';
import {topicPath} from '@/lib/schema';
import {PageHeading} from '@/components/catalog';
export const metadata={title:'Playground AOS'};
export default function AosPlayground(){
 const topics=getTopics().filter(t=>t.manifest.subject==='aos'&&t.simulations.length);
 return <><PageHeading eyebrow='ADVANCED OPERATING SYSTEMS' title='Playground AOS' description='Esperimenti guidati su architetture, processi e isolamento. Modifica le condizioni e segui gli effetti: sono modelli didattici, senza esecuzione di comandi Linux nel browser.'/><div className='resource-grid'>{topics.slice().reverse().map(t=><Link className='panel resource-card' key={t.manifest.id} href={`${topicPath(t.manifest)}#${t.simulations[0].id}`}><span className='eyebrow'>{t.manifest.chapter.title}</span><h2>{t.manifest.title}</h2><p>{t.manifest.description}</p><span className='text-link'>Apri il laboratorio →</span></Link>)}</div></>;
}
