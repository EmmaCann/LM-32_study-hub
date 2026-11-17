'use client';
import { CppNavigation } from './cpp-navigation';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  BookOpen,
  Check,
  Code2,
  Cpu,
  GitBranch,
  Layers3,
  MoveUpRight,
  Play,
  Route,
  Search,
} from 'lucide-react';
import { lessonStatus, recommendedLesson, type StudyLesson } from '@/lib/study-schema';
import { useStudyProgress } from '@/lib/study-store';
import subjects from '@/content/subjects.json';
const icons = { aos: Cpu, algoritmi: GitBranch, cpp: Code2, ottimizzazione: Route };
const summaries = {
  aos: 'Dal processore al kernel. Guarda cosa succede, poi mettilo alla prova.',
  algoritmi: 'Rendi visibile il ragionamento. Esplora strutture, costi e dipendenze.',
  cpp: 'Dai concetti al codice. Scrivi, compila e verifica il tuo programma.',
  ottimizzazione: 'Modelli, metodi e scelte. Il prossimo percorso da costruire.',
};
function CourseCard({
  subject,
  lessons,
  index,
}: {
  subject: (typeof subjects)[number];
  lessons: StudyLesson[];
  index: number;
}) {
  const { progress } = useStudyProgress();
  const Icon = icons[subject.id as keyof typeof icons] ?? BookOpen;
  const ready = lessons.filter((l) => l.availability === 'ready');
  const complete = ready.filter((l) => lessonStatus(l, progress) === 'Completata').length;
  return (
    <Link href={`/${subject.id}`} className={`portal-course course-${subject.id}`}>
      <div className="portal-course-top">
        <span className="portal-course-icon">
          <Icon size={25} strokeWidth={1.5} />
        </span>
        <span className="portal-course-number">0{index + 1}</span>
        <MoveUpRight size={19} />
      </div>
      <div className="portal-course-art" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <i key={i} style={{ '--i': i } as React.CSSProperties} />
        ))}
        <span>
          {subject.id === 'cpp'
            ? 'C++'
            : subject.id === 'aos'
              ? 'OS'
              : subject.id === 'algoritmi'
                ? 'ƒ(n)'
                : '∇'}
        </span>
      </div>
      <span className="portal-overline">
        {subject.id === 'cpp'
          ? 'SCRIVI E SPERIMENTA'
          : subject.id === 'aos'
            ? 'ESPLORA IL SISTEMA'
            : subject.id === 'algoritmi'
              ? 'SEGUI IL RAGIONAMENTO'
              : 'COSTRUISCI IL MODELLO'}
      </span>
      <h2>{subject.short}</h2>
      <p>{summaries[subject.id as keyof typeof summaries]}</p>
      <div className="portal-course-bottom">
        <div>
          <span>
            {ready.length
              ? `${complete} / ${ready.length} lezioni completate`
              : 'Percorso in preparazione'}
          </span>
          <div className="portal-meter">
            <i style={{ width: `${ready.length ? (complete / ready.length) * 100 : 0}%` }} />
          </div>
        </div>
        <span className="portal-course-go">
          <ArrowRight size={18} />
        </span>
      </div>
    </Link>
  );
}
export function StudyPortal({ lessons }: { lessons: StudyLesson[] }) {
  const { progress } = useStudyProgress();
  const next = recommendedLesson(lessons, progress);
  const completed = lessons.filter((l) => lessonStatus(l, progress) === 'Completata').length;
  return (
    <div className="study-portal">
      <header className="portal-intro">
        <div>
          <span className="portal-overline">
            <span className="portal-status-dot" /> IL TUO CAMPUS DIGITALE
          </span>
          <h1>
            Più connessioni.
            <br />
            <em>Meno distrazioni.</em>
          </h1>
          <p>
            La teoria, il laboratorio, la prova. Tutto quello che serve per fare il prossimo passo,
            nello stesso posto.
          </p>
        </div>
        <div className="portal-today">
          <span>IL TUO PERCORSO</span>
          <strong>
            {String(completed).padStart(2, '0')}
            <small> / {lessons.filter((l) => l.availability === 'ready').length}</small>
          </strong>
          <span>lezioni completate</span>
        </div>
      </header>
      <section className="portal-resume">
        <div className="portal-resume-art" aria-hidden="true">
          <div className="portal-orbit one" />
          <div className="portal-orbit two" />
          <div className="portal-orbit three" />
          <span>
            <Layers3 size={48} strokeWidth={1} />
          </span>
          <i className="portal-orbit-point a" />
          <i className="portal-orbit-point b" />
        </div>
        <div className="portal-resume-copy">
          <span className="portal-overline">
            {progress.lastLesson ? 'RIPRENDI IL FILO' : 'IL PRIMO PASSO'} <span>↗</span>
          </span>
          <h2>{next?.title ?? 'Il percorso è tuo.'}</h2>
          <p>
            {next?.description ?? 'Esplora le materie e torna sulle idee che vuoi approfondire.'}
          </p>
          <Link className="portal-primary" href={next ? `/percorso/${next.id}` : '/percorso'}>
            {progress.lastLesson === next?.id ? 'Continua a studiare' : 'Entra nella lezione'}
            <ArrowRight size={18} />
          </Link>
        </div>
        <div className="portal-study-sequence">
          <span>
            <BookOpen size={17} />
            <b>01</b> Leggi la teoria
          </span>
          <span>
            <Play size={17} />
            <b>02</b> Esplora il meccanismo
          </span>
          <span>
            <Check size={17} />
            <b>03</b> Verifica le idee
          </span>
        </div>
      </section>
      <div className="portal-section-label">
        <div>
          <span className="portal-overline">SCEGLI UNA DIREZIONE</span>
          <h2>Le tue materie</h2>
        </div>
        <Link href="/percorso">
          Il percorso completo <ArrowDownRight size={17} />
        </Link>
      </div>
      <div className="portal-courses">
        {subjects.map((s, i) => (
          <CourseCard
            key={s.id}
            subject={s}
            index={i}
            lessons={lessons.filter((l) => l.subject === s.id)}
          />
        ))}
      </div>
      <Link className="portal-search-callout" href="/ricerca">
        <span className="portal-search-icon">
          <Search size={24} />
        </span>
        <div>
          <h3>Hai un concetto in mente?</h3>
          <p>Cerca negli appunti, nelle lezioni e nei laboratori. Ti portiamo al punto giusto.</p>
        </div>
        <ArrowRight size={23} />
      </Link>
    </div>
  );
}
export function CourseOverview({
  lessons,
  subjectId,
  embedded = false,
}: {
  lessons: StudyLesson[];
  subjectId: string;
  embedded?: boolean;
}) {
  const { progress } = useStudyProgress();
  const subject = subjects.find((s) => s.id === subjectId)!;
  const Heading = embedded ? 'h2' : 'h1';
  const Icon = icons[subjectId as keyof typeof icons] ?? BookOpen;
  const next = recommendedLesson(lessons, progress);
  const ready = lessons.filter((l) => l.availability === 'ready');
  const complete = ready.filter((l) => lessonStatus(l, progress) === 'Completata').length;
  return (
    <div className={`course-overview course-${subjectId}`}>
      <header className="course-cover">
        <span className="course-cover-symbol" aria-hidden="true">
          <Icon size={130} strokeWidth={0.7} />
        </span>
        <Link className="course-back" href="/">
          ← Il mio studio
        </Link>
        <span className="portal-overline">
          IL PERCORSO · {String(ready.length).padStart(2, '0')} LEZIONI
        </span>
        <Heading>{subject.short}</Heading>
        <p>{summaries[subjectId as keyof typeof summaries]}</p>
        {next && (
          <Link className="portal-primary" href={`/percorso/${next.id}`}>
            Continua il percorso <ArrowRight size={17} />
          </Link>
        )}
        <div className="course-cover-progress">
          <span>
            {complete} di {ready.length} completate
          </span>
          <div className="portal-meter">
            <i style={{ width: `${ready.length ? (complete / ready.length) * 100 : 0}%` }} />
          </div>
        </div>
      </header>
      {subjectId === 'cpp' && <CppNavigation />}
      <div className="portal-section-label">
        <div>
          <span className="portal-overline">LA STRADA, UN PASSO ALLA VOLTA</span>
          <h2>Il programma di studio</h2>
        </div>
        <span className="course-free-access">Ordine consigliato · accesso libero</span>
      </div>
      <ol className="course-roadmap">
        {lessons.map((l, i) => {
          const status = lessonStatus(l, progress);
          return (
            <li key={l.id} className={status === 'Completata' ? 'is-complete' : ''}>
              <span className="course-roadmap-index">
                {status === 'Completata' ? <Check size={19} /> : String(i + 1).padStart(2, '0')}
              </span>
              <Link href={`/percorso/${l.id}`} className="course-lesson-card">
                <div className="course-lesson-head">
                  <span className="portal-overline">{l.chapter}</span>
                  <span
                    className={`course-lesson-status ${status === 'Completata' ? 'is-complete' : ''}`}
                  >
                    {status}
                  </span>
                </div>
                <h3>{l.title}</h3>
                <p>{l.description}</p>
                <div className="course-lesson-bottom">
                  <span>
                    {l.document ? (
                      <>
                        <BookOpen size={14} /> Appunti inclusi
                      </>
                    ) : (
                      <>
                        <Code2 size={14} /> Pratica guidata
                      </>
                    )}
                  </span>
                  <span>
                    <Layers3 size={14} />
                    {l.topicIds.length} argomenti
                  </span>
                  <span className="course-enter">
                    Entra <ArrowRight size={16} />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
export function AllCourses({ lessons }: { lessons: StudyLesson[] }) {
  const [subject, setSubject] = useState('aos');
  return (
    <>
      <div className="portal-section-label">
        <div>
          <span className="portal-overline">LA MAPPA COMPLETA</span>
          <h1>Il tuo percorso</h1>
        </div>
        <Link href="/">
          Il mio studio <ArrowRight size={16} />
        </Link>
      </div>
      <div className="portal-subject-tabs" role="group" aria-label="Scegli materia">
        {subjects.map((s) => (
          <button
            key={s.id}
            className={subject === s.id ? 'is-active' : ''}
            aria-pressed={subject === s.id}
            onClick={() => setSubject(s.id)}
          >
            {s.short}
          </button>
        ))}
      </div>
      <CourseOverview
        key={subject}
        subjectId={subject}
        embedded
        lessons={lessons.filter((l) => l.subject === subject)}
      />
    </>
  );
}
