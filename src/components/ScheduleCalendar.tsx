import { useEffect, useState } from 'react';

// Self-contained month-calendar island. Fetches the shaped schedule from the
// SSR endpoint (default /api/classes.json), then renders a full grid for the
// CURRENT month — every day shown, including empty ones — placing each day's
// classes into its cell. Classes dated outside the current month are not shown.
// Rendered with client:only="react" since the month depends on the visitor's
// date and a live fetch.

interface DaySchedule {
  date: string; // YYYY-MM-DD
  label: string;
  classes: string[];
}

interface ScheduleCalendarProps {
  /** Endpoint returning { ok, schedule: DaySchedule[] }. */
  endpoint?: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function ScheduleCalendar({ endpoint = '/api/classes.json' }: ScheduleCalendarProps) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based
  const today = now.getDate();

  // day-of-month -> classes[], for the current month only
  const [classesByDay, setClassesByDay] = useState<Map<number, string[]>>(() => new Map());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(endpoint);
        if (!res.ok) return;
        const data = (await res.json()) as { ok: boolean; schedule?: DaySchedule[] };
        if (!data.ok || !Array.isArray(data.schedule)) return;

        const map = new Map<number, string[]>();
        for (const entry of data.schedule) {
          const [y, m, d] = entry.date.split('-').map(Number);
          if (y === year && m - 1 === month) map.set(d, entry.classes);
        }
        if (!cancelled) setClassesByDay(map);
      } catch {
        // leave the calendar empty on failure
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [endpoint, year, month]);

  const firstDow = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [
    ...Array<null>(firstDow).fill(null), // leading blanks before day 1
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="calendar">
      <div className="calendar-month">
        {MONTHS[month]} {year}
      </div>

      <div className="calendar-grid">
        {WEEKDAYS.map((w) => (
          <div key={w} className="calendar-weekday">
            {w}
          </div>
        ))}

        {cells.map((day, i) => {
          if (day === null) return <div key={`blank-${i}`} className="calendar-day is-empty" />;

          const classes = classesByDay.get(day);
          return (
            <div key={day} className={`calendar-day${day === today ? ' is-today' : ''}`}>
              <span className="calendar-date">{day}</span>
              {classes && classes.length > 0 && (
                <ul className="calendar-classes">
                  {classes.map((c, idx) => (
                    <li key={idx} className="calendar-class">
                      {c}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .calendar {
          max-width: 1000px;
          margin: 0 auto 24px;
          text-align: left;
        }

        .calendar-month {
          font-family: var(--font-heading, 'Uniform Pro', sans-serif);
          font-size: 18px;
          font-weight: 700;
          color: #000;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 0 0 16px;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
        }

        .calendar-weekday {
          font-family: var(--font-heading, 'Uniform Pro', sans-serif);
          font-size: 12px;
          font-weight: 700;
          color: var(--color-rust, #B94237);
          text-transform: uppercase;
          letter-spacing: 1px;
          text-align: center;
          padding-bottom: 4px;
        }

        .calendar-day {
          background: #fff;
          border: 1px solid #e5e5e5;
          border-radius: 4px;
          min-height: 92px;
          padding: 6px 8px;
        }

        .calendar-day.is-empty {
          background: transparent;
          border: none;
          min-height: 0;
        }

        .calendar-day.is-today {
          border: 2px solid var(--color-rust, #B94237);
        }

        .calendar-date {
          display: block;
          font-family: var(--font-body, 'Rubik', sans-serif);
          font-size: 12px;
          font-weight: 700;
          color: #888;
          margin-bottom: 4px;
        }

        .calendar-classes {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .calendar-class {
          font-family: var(--font-body, 'Rubik', sans-serif);
          font-size: 11px;
          color: #555;
          line-height: 1.3;
          padding: 2px 0;
        }

        /* 7 columns stay readable on small screens via horizontal scroll. */
        @media (max-width: 768px) {
          .calendar {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .calendar-grid {
            min-width: 620px;
          }
        }
      `}</style>
    </div>
  );
}
