import Link from 'next/link';
import {
  ArrowUpRight,
  Cpu,
  Network,
  Code2,
  ChartNoAxesCombined,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { subjects } from '@/lib/content';
import { topicPath, type Topic } from '@/lib/schema';
const icons = { cpu: Cpu, network: Network, code: Code2, chart: ChartNoAxesCombined };
export function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-heading">
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
export function SubjectCards({ topics }: { topics: Topic[] }) {
  return (
    <div className="subject-grid">
      {subjects.map((s) => {
        const Icon = icons[s.icon as keyof typeof icons],
          count = topics.filter((t) => t.manifest.subject === s.id).length;
        return (
          <Link href={`/${s.id}`} className={`subject-card ${s.color}`} key={s.id}>
            <div className="card-top">
              <span className="subject-icon">
                <Icon size={25} />
              </span>
            </div>
            <h3>{s.short}</h3>
            <div className="card-bottom">
              <span>{count ? `${count} argomenti` : 'In attesa di contenuti'}</span>
              <ArrowUpRight size={20} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
export function TopicList({ topics }: { topics: Topic[] }) {
  return (
    <div className="list">
      {topics.map((t) => (
        <Link className="list-row" href={topicPath(t.manifest)} key={t.manifest.id}>
          <span className={`row-icon ${subjects.find((s) => s.id === t.manifest.subject)?.color}`}>
            <FileText size={20} />
          </span>
          <div className="row-content">
            <span className="eyebrow">
              {subjects.find((s) => s.id === t.manifest.subject)?.short} <span> / </span>{' '}
              {t.manifest.chapter.title}
            </span>
            <h3>{t.manifest.title}</h3>
            <p>{t.manifest.description}</p>
          </div>
          <span className="badge">{t.manifest.demo ? 'Demo' : 'Appunto'}</span>
          <ArrowRight size={18} />
        </Link>
      ))}
    </div>
  );
}
