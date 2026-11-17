'use client';
import Link from 'next/link';
import { Check, ArrowUpRight, Map, CircleDot, LockKeyhole } from 'lucide-react';
import { activityKey, lessonStatus, type StudyLesson } from '@/lib/study-schema';
import { useStudyProgress } from '@/lib/study-store';

export function CourseMap({ lessons }: { lessons: StudyLesson[] }) {
  const { progress } = useStudyProgress();
  const groups = [...new Set(lessons.map((lesson) => lesson.chapter))];
  return (
    <section className="course-map" aria-label="Mappa del percorso">
      <div className="course-map-intro">
        <div>
          <Map size={20} />
          <span>La tua rotta di studio</span>
        </div>
        <p>
          Apri una tappa o vai direttamente a un sottoargomento. La tappa si colora dopo la verifica
          finale.
        </p>
        <div className="map-legend" aria-label="Legenda della mappa">
          <span>
            <i />
            Da iniziare
          </span>
          <span>
            <i className="is-current" />
            In corso
          </span>
          <span>
            <i className="is-complete" />
            Completata
          </span>
        </div>
      </div>
      {groups.map((group) => (
        <div className="map-group" key={group}>
          <h3>{group}</h3>
          <ol>
            {lessons
              .filter((lesson) => lesson.chapter === group)
              .map((lesson) => {
                const status = lessonStatus(lesson, progress);
                const complete = status === 'Completata';
                const planned = lesson.availability === 'planned';
                const current = status === 'In corso' || status === 'Da verificare';
                const required = lesson.activities.filter((activity) => activity.required);
                const passed = required.filter(
                  (activity) =>
                    progress.passed[activityKey(lesson.id, activity.id)]?.signature ===
                    activity.signature,
                ).length;
                return (
                  <li
                    key={lesson.id}
                    data-lesson={lesson.id}
                    data-state={
                      complete ? 'complete' : planned ? 'planned' : current ? 'current' : 'pending'
                    }
                  >
                    <span
                      className="map-node"
                      aria-label={`Tappa ${lessons.indexOf(lesson) + 1}: ${status}`}
                    >
                      {complete ? (
                        <Check size={20} />
                      ) : planned ? (
                        <LockKeyhole size={17} />
                      ) : (
                        String(lessons.indexOf(lesson) + 1).padStart(2, '0')
                      )}
                    </span>
                    <article className="map-stop">
                      <div className="map-stop-heading">
                        <span className="map-state">
                          {current && <CircleDot size={12} />}
                          {status}
                        </span>
                        <h4>
                          <Link href={`/percorso/${lesson.id}`}>
                            {lesson.title}
                            <ArrowUpRight size={17} />
                          </Link>
                        </h4>
                        <p>{lesson.description}</p>
                        {!planned && (
                          <span className="map-checks">
                            {passed}/{required.length} attività superate
                          </span>
                        )}
                      </div>
                      <div className="map-branches">
                        <span className="map-branch-label">
                          {lesson.sections.length
                            ? 'ARGOMENTI E SOTTOARGOMENTI'
                            : 'OBIETTIVI DELLA TAPPA'}
                        </span>
                        <ul>
                          {lesson.sections.length
                            ? lesson.sections.map((section) => (
                                <li key={section.id}>
                                  <Link
                                    href={`/percorso/${lesson.id}?view=theory&page=${section.page}`}
                                  >
                                    <span>{section.title}</span>
                                    <small>p. {section.page}</small>
                                  </Link>
                                </li>
                              ))
                            : lesson.objectives.map((objective, i) => (
                                <li key={i}>
                                  <Link
                                    href={`/percorso/${lesson.id}?view=${planned ? 'theory' : 'code'}`}
                                  >
                                    {objective}
                                  </Link>
                                </li>
                              ))}
                        </ul>
                      </div>
                    </article>
                  </li>
                );
              })}
          </ol>
        </div>
      ))}
    </section>
  );
}
