// src/lib/eventSchedule.ts
// Shared formatting for an event's recurring weekly schedule. Used by both the
// events index (the bottom "Upending-style" blocks) and the single event page
// (the sidebar) so the two never drift in how times/days are displayed.
//
// The shape mirrors Keystatic's `recurring` conditional field: the outer
// { discriminant, value } toggles whether the event recurs, and `value` holds
// one entry per weekday — each itself a conditional { discriminant, value }
// where `value` carries the 24h "HH:MM" start/end times.

export interface RecurringTimeRange {
  start: string;
  end: string;
}

export interface RecurringDay {
  discriminant: boolean;
  value?: RecurringTimeRange | null;
}

type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface RecurringField {
  discriminant: boolean;
  value?: Partial<Record<Weekday, RecurringDay | undefined>> | null;
}

const WEEKDAY_LABELS: ReadonlyArray<readonly [Weekday, string]> = [
  ['monday', 'Mondays'],
  ['tuesday', 'Tuesdays'],
  ['wednesday', 'Wednesdays'],
  ['thursday', 'Thursdays'],
  ['friday', 'Fridays'],
  ['saturday', 'Saturdays'],
  ['sunday', 'Sundays'],
];

/** Whether an event's `recurring` field is toggled on. */
export function isRecurringSchedule(recurring: RecurringField | undefined): boolean {
  return recurring?.discriminant === true;
}

/** Convert a stored 24h "HH:MM" slot into a friendly 12-hour label ("5:00 PM"). */
export function formatTimeSlot(value: string): string {
  const [hour24, minute] = value.split(':').map(Number);
  if (Number.isNaN(hour24)) return value;
  const period = hour24 < 12 ? 'AM' : 'PM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
}

/**
 * Build one display line per active weekday, e.g. "Mondays: 5:00 PM – 8:00 PM".
 * Returns [] when the event isn't recurring or has no days selected.
 *
 * `separator` sits between the day label and the time range. The sidebar uses
 * the default ": "; the bold index blocks pass " " (and uppercase the result).
 */
export function recurringScheduleLines(
  recurring: RecurringField | undefined,
  separator = ': ',
): string[] {
  if (!isRecurringSchedule(recurring) || !recurring?.value) return [];
  const days = recurring.value;
  return WEEKDAY_LABELS.flatMap(([key, label]) => {
    const day = days[key];
    if (!day?.discriminant || !day.value) return [];
    return [
      `${label}${separator}${formatTimeSlot(day.value.start)} – ${formatTimeSlot(day.value.end)}`,
    ];
  });
}
