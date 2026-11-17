'use client';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Code2,
  Download,
  Layers3,
  ListChecks,
  PanelRightClose,
  PanelRightOpen,
  Play,
  Sparkles,
} from 'lucide-react';
import { LessonDocument } from './lesson-document';
import { LessonVisit } from './study-roadmap';
import { StudyAssessment, StudyActivityCard } from './study-assessment';
import { ExerciseCard } from './exercise';
import { activityKey, lessonStatus, type StudyLesson } from '@/lib/study-schema';
import { useStudyProgress } from '@/lib/study-store';
import type { Exercise, Simulation } from '@/lib/schema';
const Player = dynamic(() => import('@/simulations/registry').then((m) => m.SimulationPlayer), {
  ssr: false,
  loading: () => <div className="desk-loading">Preparazione laboratorio…</div>,
});
const Playground = dynamic(() => import('./cpp-playground').then((m) => m.CppPlayground), {
  ssr: false,
  loading: () => <div className="desk-loading">Preparazione editor…</div>,
});
type View = 'theory' | 'labs' | 'code' | 'check';
export type DeskSimulation = Simulation & { topicId: string };
export type DeskExercise = { topicId: string; exercise: Exercise };
export function LessonWorkspace({
  lesson,
  courseLessons,
  simulations,
  exercises,
  initialView = 'theory',
  initialPage = 1,
  initialLab,
}: {
  lesson: StudyLesson;
  courseLessons: { id: string; title: string }[];
  simulations: DeskSimulation[];
  exercises: DeskExercise[];
  initialView?: View;
  initialPage?: number;
  initialLab?: string;
}) {
  const router = useRouter();
  const { progress } = useStudyProgress();
  const [view, setView] = useState<View>(initialView);
  const [opened, setOpened] = useState<View[]>([initialView]);
  const firstLab = Math.max(
    0,
    simulations.findIndex((s) => `${s.topicId}/${s.id}` === initialLab),
  );
  const firstReference = lesson.theory.find(
    (r) =>
      r.topicId === simulations[firstLab]?.topicId && r.simulationId === simulations[firstLab]?.id,
  );
  const [page, setPage] = useState(
    initialView === 'labs' ? (firstReference?.page ?? initialPage) : initialPage,
  );
  const [labIndex, setLabIndex] = useState(firstLab);
  const [codeIndex, setCodeIndex] = useState(0);
  const [showContext, setShowContext] = useState(true);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const guided = lesson.activities.filter((a) => a.type === 'c-fragment');
  const codeExercises = exercises.filter(
    (e) => e.exercise.type === 'cpp' || e.exercise.type === 'programming',
  );
  const codeCount = codeExercises.length + guided.length;
  const lab = simulations[labIndex];
  const reference = lesson.theory.find(
    (r) => r.topicId === lab?.topicId && r.simulationId === lab?.id,
  );
  const currentCode = codeExercises[codeIndex];
  const currentGuided = guided[codeIndex - codeExercises.length];
  const required = lesson.activities.filter((a) => a.required);
  const passed = required.filter(
    (a) => progress.passed[activityKey(lesson.id, a.id)]?.signature === a.signature,
  ).length;
  const index = courseLessons.findIndex((l) => l.id === lesson.id);
  const next = courseLessons[index + 1];
  function selectView(value: View) {
    if (value === 'labs' && reference) setPage(reference.page);
    const url = new URL(window.location.href);
    url.searchParams.set('view', value);
    url.hash = '';
    if (value === 'labs' && lab) {
      url.searchParams.set('lab', `${lab.topicId}/${lab.id}`);
      if (reference) url.searchParams.set('page', String(reference.page));
    } else if (value === 'theory') url.searchParams.set('page', String(page));
    window.history.replaceState(null, '', url);
    setView(value);
    setOpened((old) => (old.includes(value) ? old : [...old, value]));
  }
  function chooseLab(value: number) {
    setLabIndex(value);
    const selected = simulations[value];
    const ref = lesson.theory.find(
      (r) => r.topicId === selected.topicId && r.simulationId === selected.id,
    );
    if (ref) setPage(ref.page);
    const url = new URL(window.location.href);
    url.searchParams.set('lab', `${selected.topicId}/${selected.id}`);
    if (ref) url.searchParams.set('page', String(ref.page));
    window.history.replaceState(null, '', url);
  }
  useEffect(() => {
    const listener = () => {
      if (window.location.hash === '#verifica') {
        setView('check');
        setOpened((old) => (old.includes('check') ? old : [...old, 'check']));
      }
    };
    const id = requestAnimationFrame(listener);
    window.addEventListener('hashchange', listener);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('hashchange', listener);
    };
  }, []);
  const tabs = [
    { id: 'theory' as const, label: 'Teoria', Icon: BookOpen, count: lesson.document?.pages },
    { id: 'labs' as const, label: 'Laboratori', Icon: Play, count: simulations.length },
    { id: 'code' as const, label: 'Codice', Icon: Code2, count: codeCount },
    {
      id: 'check' as const,
      label: 'Verifica',
      Icon: ListChecks,
      count: `${passed}/${required.length}`,
    },
  ];
  return (
    <div className="lesson-desk" data-view={view}>
      <LessonVisit id={lesson.id} />
      <div className="desk-commandbar">
        <Link href={`/${lesson.subject}`} className="desk-back">
          <ArrowLeft size={16} />
          <span>Il percorso</span>
        </Link>
        <div className="desk-course-mark">
          {lesson.subject === 'aos'
            ? 'SISTEMI OPERATIVI'
            : lesson.subject === 'cpp'
              ? 'PROGRAMMAZIONE C++'
              : lesson.subject === 'algoritmi'
                ? 'ALGORITMI'
                : 'OTTIMIZZAZIONE'}
        </div>
        <label className="desk-switcher">
          <span>Lezione</span>
          <select
            aria-label="Cambia lezione"
            value={lesson.id}
            onChange={(e) => router.push(`/percorso/${e.target.value}`)}
          >
            {courseLessons.map((l) => (
              <option value={l.id} key={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <header className="desk-heading">
        <div>
          <div className="desk-kicker">
            <span /> IL TUO SPAZIO DI STUDIO
          </div>
          <h1>{lesson.title}</h1>
          <p>{lesson.description}</p>
        </div>
        <div
          className={`desk-progress ${lessonStatus(lesson, progress) === 'Completata' ? 'is-complete' : ''}`}
        >
          <CheckCircle2 size={21} />
          <div>
            <strong>
              {lessonStatus(lesson, progress) === 'Completata'
                ? 'Completata'
                : `${passed} di ${required.length} attività`}
            </strong>
            <span>Verifica di comprensione</span>
          </div>
        </div>
      </header>
      <div className="desk-tabs" role="group" aria-label="Contenuti della lezione">
        {tabs.map((tab) => (
          <button
            className={view === tab.id ? 'is-active' : ''}
            key={tab.id}
            aria-pressed={view === tab.id}
            onClick={() => selectView(tab.id)}
          >
            <tab.Icon size={17} />
            <span>{tab.label}</span>
            <small>{tab.count ?? '—'}</small>
          </button>
        ))}
      </div>
      <div className="desk-body">
        <aside className={`desk-outline ${outlineOpen ? 'is-open' : ''}`}>
          <button
            className="desk-outline-mobile-toggle"
            onClick={() => setOutlineOpen((v) => !v)}
            aria-expanded={outlineOpen}
          >
            <Layers3 size={15} /> Indice della lezione
          </button>
          <div className="desk-outline-title">
            <Layers3 size={15} /> IN QUESTA LEZIONE
          </div>
          <div className="desk-outline-scroll">
            {lesson.sections.length ? (
              lesson.sections.map((section, i) => (
                <button
                  key={section.id}
                  className={page === section.page ? 'is-current' : ''}
                  onClick={() => {
                    setPage(section.page);
                    selectView('theory');
                  }}
                >
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <strong>{section.title}</strong>
                  <small>{section.page}</small>
                </button>
              ))
            ) : (
              <div className="desk-outline-note">
                <Code2 size={25} />
                <p>Unisci i concetti nei casi pratici. Ogni esercizio conserva il tuo codice.</p>
              </div>
            )}
          </div>
          <button className="desk-outline-check" onClick={() => selectView('check')}>
            <Check size={16} /> Verifica la comprensione <ArrowRight size={15} />
          </button>
          <div className="desk-outline-foot">
            {lesson.document ? 'Appunti già collegati alla lezione.' : 'Pratica guidata.'}
            <br />
            Il tuo lavoro viene salvato.
          </div>
        </aside>
        <div className="desk-content">
          {opened.includes('theory') && (
            <section
              className="desk-panel"
              hidden={view !== 'theory'}
              aria-label="Teoria della lezione"
            >
              <div className="desk-panel-top">
                <div>
                  <BookOpen size={18} />
                  <strong>Appunti della lezione</strong>
                  <span className="desk-subtle">Appunti rielaborati</span>
                </div>
                {lesson.document && (
                  <a
                    className="desk-icon-link"
                    href={`/notes/${lesson.document.id}.pdf`}
                    download
                    aria-label="Scarica appunti PDF"
                  >
                    <Download size={17} />
                  </a>
                )}
              </div>
              {lesson.document ? (
                <LessonDocument
                  key={lesson.document.id}
                  documentId={lesson.document.id}
                  page={page}
                  onPageChange={setPage}
                />
              ) : (
                <div className="desk-empty">
                  <Code2 size={42} />
                  <h2>Qui si impara facendo.</h2>
                  <p>{lesson.description}</p>
                  <button className="button primary" onClick={() => selectView('code')}>
                    Apri gli esercizi <ArrowRight size={16} />
                  </button>
                </div>
              )}
              <div className="desk-next-action">
                <span>
                  <Sparkles size={16} /> Dalla teoria alla pratica
                </span>
                <button
                  className="button primary"
                  onClick={() =>
                    selectView(simulations.length ? 'labs' : codeCount ? 'code' : 'check')
                  }
                >
                  {simulations.length
                    ? 'Esplora i laboratori'
                    : codeCount
                      ? 'Metti mano al codice'
                      : 'Verifica cosa hai imparato'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </section>
          )}
          {opened.includes('labs') && (
            <section
              className="desk-panel desk-laboratories"
              hidden={view !== 'labs'}
              aria-label="Laboratori della lezione"
            >
              {simulations.length ? (
                <>
                  <div className="desk-lab-strip">
                    {simulations.map((s, i) => (
                      <button
                        className={i === labIndex ? 'is-selected' : ''}
                        onClick={() => chooseLab(i)}
                        key={`${s.topicId}-${s.id}`}
                      >
                        <Play size={13} />
                        {s.title}
                      </button>
                    ))}
                  </div>
                  <div className="desk-panel-top">
                    <div>
                      <strong>{lab?.title}</strong>
                    </div>
                    {lesson.document && (
                      <button
                        className="desk-icon-link"
                        onClick={() => setShowContext((v) => !v)}
                        aria-label={
                          showContext ? 'Nascondi teoria affiancata' : 'Mostra teoria affiancata'
                        }
                      >
                        {showContext ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
                      </button>
                    )}
                  </div>
                  <div
                    className={`desk-lab-grid ${showContext && lesson.document ? 'with-context' : ''}`}
                  >
                    <div className="desk-live-lab">
                      {lab && <Player key={`${lab.topicId}-${lab.id}`} simulation={lab} />}
                    </div>
                    {showContext && lesson.document && (
                      <aside className="desk-context">
                        <div className="desk-context-heading">
                          <BookOpen size={16} />
                          <strong>Il punto nella teoria</strong>
                          <button
                            onClick={() => {
                              if (reference) setPage(reference.page);
                              selectView('theory');
                            }}
                          >
                            Apri ↗
                          </button>
                        </div>
                        <p>{reference?.section ?? lesson.title}</p>
                        <LessonDocument
                          documentId={lesson.document.id}
                          page={page}
                          onPageChange={setPage}
                          compact
                        />
                      </aside>
                    )}
                  </div>
                </>
              ) : (
                <div className="desk-empty">
                  <Play size={36} />
                  <h2>La pratica continua qui.</h2>
                  <p>
                    Per questa lezione trovi gli appunti e le attività di comprensione. I laboratori
                    animati sono in preparazione.
                  </p>
                  <button
                    className="button primary"
                    onClick={() => selectView(codeCount ? 'code' : 'check')}
                  >
                    Vai alle attività <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </section>
          )}
          {opened.includes('code') && (
            <section
              className="desk-panel desk-code"
              hidden={view !== 'code'}
              aria-label="Codice della lezione"
            >
              {codeCount ? (
                <>
                  <div className="desk-code-selector">
                    <label>
                      Esercizio
                      <select
                        aria-label="Scegli esercizio della lezione"
                        value={codeIndex}
                        onChange={(e) => setCodeIndex(Number(e.target.value))}
                      >
                        {codeExercises.map((e, i) => (
                          <option key={`${e.topicId}-${e.exercise.id}`} value={i}>
                            {e.exercise.title}
                          </option>
                        ))}
                        {guided.map((a, i) => (
                          <option key={a.id} value={i + codeExercises.length}>
                            {a.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <span>
                      {codeIndex + 1} / {codeCount}
                    </span>
                    <button
                      className="desk-icon-link"
                      aria-label="Esercizio successivo nella lezione"
                      disabled={codeIndex >= codeCount - 1}
                      onClick={() => setCodeIndex((i) => i + 1)}
                    >
                      <ArrowRight size={18} />
                    </button>
                  </div>
                  <div className="desk-code-workspace">
                    {currentCode ? (
                      currentCode.exercise.type === 'cpp' ? (
                        <Playground
                          key={`${currentCode.topicId}-${currentCode.exercise.id}`}
                          exercise={currentCode.exercise}
                          draftId={`${currentCode.topicId}-${currentCode.exercise.id}`}
                          progressBindings={lesson.activities
                            .filter(
                              (a) =>
                                a.type === 'cpp' &&
                                a.topicId === currentCode.topicId &&
                                a.exerciseId === currentCode.exercise.id,
                            )
                            .map((a) => ({
                              key: activityKey(lesson.id, a.id),
                              signature: a.signature,
                              lessonId: lesson.id,
                            }))}
                        />
                      ) : (
                        <ExerciseCard
                          key={currentCode.exercise.id}
                          exercise={currentCode.exercise}
                        />
                      )
                    ) : currentGuided ? (
                      <StudyActivityCard
                        key={currentGuided.id}
                        lessonId={lesson.id}
                        activity={currentGuided}
                      />
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="desk-empty">
                  <Code2 size={36} />
                  <h2>Prima il ragionamento.</h2>
                  <p>
                    La verifica di questa lezione si concentra sulla comprensione dei meccanismi.
                  </p>
                  <button className="button primary" onClick={() => selectView('check')}>
                    Apri la verifica <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </section>
          )}
          {opened.includes('check') && (
            <section
              className="desk-panel desk-check-panel"
              hidden={view !== 'check'}
              aria-label="Verifica della lezione"
            >
              <StudyAssessment lesson={lesson} next={next} />
            </section>
          )}
        </div>
      </div>
      <nav className="desk-footer-nav" aria-label="Lezioni adiacenti">
        {courseLessons[index - 1] ? (
          <Link href={`/percorso/${courseLessons[index - 1].id}`}>
            <ArrowLeft size={16} /> Lezione precedente
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/percorso/${next.id}`}>
            Prossima lezione <ArrowRight size={16} />
          </Link>
        )}
      </nav>
    </div>
  );
}
