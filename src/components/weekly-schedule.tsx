'use client';
import { useEffect, useState } from 'react';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';

const storageKey = 'lm32-weekly-schedule-v1';
const days = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
type Event = { id: string; day: number; time: string; title: string; place: string };

function validEvent(value: unknown): value is Event {
  if (!value || typeof value !== 'object') return false;
  const event = value as Record<string, unknown>;
  return (
    typeof event.id === 'string' &&
    typeof event.title === 'string' &&
    event.title.trim().length > 0 &&
    typeof event.place === 'string' &&
    typeof event.day === 'number' &&
    Number.isInteger(event.day) &&
    event.day >= 0 &&
    event.day < 7 &&
    typeof event.time === 'string' &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(event.time)
  );
}

export function WeeklySchedule() {
  const [events, setEvents] = useState<Event[]>([]);
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState(0);
  const [open, setOpen] = useState(false);
  const [warning, setWarning] = useState('');
  const [day, setDay] = useState(0);
  const [time, setTime] = useState('09:00');
  const [title, setTitle] = useState('');
  const [place, setPlace] = useState('');
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const data: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
        if (!Array.isArray(data) || !data.every(validEvent))
          throw new Error('Calendario non valido');
        setEvents(data);
      } catch {
        setWarning('Calendario non disponibile: controlla i dati salvati nel browser.');
      }
      const current = (new Date().getDay() + 6) % 7;
      setToday(current);
      setDay(current);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);
  function save(next: Event[]) {
    setEvents(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setWarning('');
    } catch {
      setWarning('Salvataggio non disponibile: le modifiche resteranno solo in questa sessione.');
    }
  }
  const ordered = [...events].sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
  const todaysEvents = ordered.filter((event) => event.day === today);
  return (
    <section className="weekly-schedule" aria-label="Orario settimanale">
      <div className="schedule-heading">
        <div>
          <span className="portal-overline">
            <CalendarDays size={15} /> ORGANIZZA LA SETTIMANA
          </span>
          <h1>Il tuo orario</h1>
          <p>Lezioni e impegni ricorrenti, a portata di mano.</p>
        </div>
        <button
          className="schedule-add"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          <Plus size={16} /> {open ? 'Chiudi' : 'Aggiungi lezione'}
        </button>
      </div>
      {warning && (
        <p className="schedule-warning" role="alert">
          {warning}
        </p>
      )}
      {open && (
        <form
          className="schedule-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            save([
              ...events,
              { id: crypto.randomUUID(), day, time, title: title.trim(), place: place.trim() },
            ]);
            setTitle('');
            setPlace('');
            setOpen(false);
          }}
        >
          <label>
            Lezione
            <input
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Es. Sistemi operativi"
            />
          </label>
          <label>
            Giorno
            <select value={day} onChange={(e) => setDay(Number(e.target.value))}>
              {days.map((name, index) => (
                <option key={name} value={index}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ora
            <input required type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
          <label>
            Aula o luogo <span>(facoltativo)</span>
            <input
              maxLength={100}
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Es. Aula 2"
            />
          </label>
          <button className="button primary" type="submit" disabled={!ready}>
            Salva
          </button>
        </form>
      )}
      <div className="schedule-grid">
        <div className="schedule-today">
          <span className="schedule-label">OGGI · {ready ? days[today].toUpperCase() : '...'}</span>
          {todaysEvents.length ? (
            todaysEvents.map((event) => (
              <div className="schedule-today-item" key={event.id}>
                <time>{event.time}</time>
                <div>
                  <strong>{event.title}</strong>
                  {event.place && <small>{event.place}</small>}
                </div>
              </div>
            ))
          ) : (
            <p>{ready ? 'Nessuna lezione inserita per oggi.' : 'Caricamento orario…'}</p>
          )}
        </div>
        <div className="schedule-week">
          <span className="schedule-label">SETTIMANA TIPO</span>
          {ordered.length ? (
            <ul>
              {ordered.map((event) => (
                <li key={event.id}>
                  <span>
                    {days[event.day].slice(0, 3)} · {event.time}
                  </span>
                  <strong>{event.title}</strong>
                  {event.place && <small>{event.place}</small>}
                  <button
                    onClick={() => save(events.filter((item) => item.id !== event.id))}
                    aria-label={`Elimina ${event.title}, ${days[event.day]} alle ${event.time}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>Aggiungi le lezioni per creare il tuo orario settimanale.</p>
          )}
        </div>
      </div>
      <p className="schedule-note">
        L’orario si ripete ogni settimana ed è salvato in questo browser.
      </p>
    </section>
  );
}
