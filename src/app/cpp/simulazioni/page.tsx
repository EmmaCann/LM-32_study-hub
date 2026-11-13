import Link from 'next/link';
import { Play } from 'lucide-react';
import { getTopics } from '@/lib/content';
import { topicPath } from '@/lib/schema';
import { PageHeading, EmptyState } from '@/components/catalog';
import { CppNavigation } from '@/components/cpp-navigation';
import '../playground/playground.css';
export const metadata = { title: 'Simulazioni C++' };
export default function CppSimulations() {
  const items = getTopics()
    .filter((t) => t.manifest.subject === 'cpp')
    .flatMap((t) => t.simulations.map((s) => ({ ...s, url: `${topicPath(t.manifest)}#${s.id}` })));
  return (
    <>
      <CppNavigation />
      <PageHeading
        eyebrow="C++ INTERATTIVO"
        title="Simulazioni C++"
        description="Visualizzazioni interattive collegate agli argomenti del corso."
      />
      {items.length ? (
        <div className="resource-grid">
          {items.map((s) => (
            <Link key={s.url} className="panel resource-card" href={s.url}>
              <Play />
              <h2>{s.title}</h2>
              <p>{s.description}</p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Play />}
          title="Nessuna simulazione C++ pubblicata"
          description="Le future simulazioni revisionate compariranno qui. Puoi già lavorare sulle esercitazioni."
          actionHref="/cpp/esercitazioni"
          actionLabel="Apri le esercitazioni"
        />
      )}
    </>
  );
}
