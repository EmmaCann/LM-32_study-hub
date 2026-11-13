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
import type { ReactNode } from 'react';
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
      {subjects.map((s, index) => {
        const Icon = icons[s.icon as keyof typeof icons];
        const subjectTopics = topics.filter((t) => t.manifest.subject === s.id);
        const chapters = new Set(subjectTopics.map((t) => t.manifest.chapter.id)).size;
        return (
          <Link href={`/${s.id}`} className={`subject-card ${s.color}`} key={s.id}>
            <div className="subject-card-top">
              <span className="subject-icon">
                <Icon size={22} strokeWidth={1.8} />
              </span>
              <span className="subject-index">{String(index + 1).padStart(2, '0')}</span>
            </div>
            <h3>{s.short}</h3>
            <p>{s.description}</p>
            <div className="subject-card-meta">
              <span>{subjectTopics.length} {subjectTopics.length === 1 ? 'appunto' : 'appunti'}</span>
              <span aria-hidden="true">·</span>
              <span>{chapters} {chapters === 1 ? 'capitolo' : 'capitoli'}</span>
            </div>
            <div className="subject-card-action">
              <span>Apri materia</span>
              <ArrowUpRight size={17} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
export function EmptyState({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
  compact = false,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  compact?: boolean;
}) {
  return (
    <div className={`empty-state${compact ? ' compact' : ''}`}>
      <span className="empty-state-icon" aria-hidden="true">{icon}</span>
      <h2>{title}</h2>
      <p>{description}</p>
      {actionHref && actionLabel && (
        <Link className="empty-state-action" href={actionHref}>
          {actionLabel} <ArrowRight size={16} />
        </Link>
      )}
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
