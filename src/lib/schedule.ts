import type { ClassGroup, Weekday } from '@/types';
import { faDigits, faNumber } from './format';

export const WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'] as const;

/** JS getDay(): 0 = Sunday … 6 = Saturday → Persian week 0 = Saturday. */
export const persianWeekday = (date: Date): Weekday => ((date.getDay() + 1) % 7) as Weekday;

export const daysLabel = (days: Weekday[]) => days.map((d) => WEEKDAYS[d]).join(' و ');

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
export const endTime = (start: string, minutes: number) => {
  const total = toMinutes(start) + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};
export const timeRange = (start: string, minutes: number) => faDigits(`${start} تا ${endTime(start, minutes)}`);

/** Two classes collide when they share a weekday and their times overlap. */
export const overlaps = (a: Pick<ClassGroup, 'days' | 'start' | 'minutes'>, b: Pick<ClassGroup, 'days' | 'start' | 'minutes'>) => {
  if (!a.days.some((d) => b.days.includes(d))) return false;
  const a0 = toMinutes(a.start);
  const b0 = toMinutes(b.start);
  return a0 < b0 + b.minutes && b0 < a0 + a.minutes;
};

export interface Conflict { kind: 'teacher' | 'room'; other: ClassGroup }

/** Teacher and room clashes for a class within the same term. */
export const conflictsFor = (candidate: Omit<ClassGroup, 'id' | 'code'> & { id?: string }, classes: ClassGroup[]): Conflict[] =>
  classes
    .filter((other) => other.id !== candidate.id && other.termId === candidate.termId && !other.cancelled && overlaps(candidate, other))
    .flatMap((other) => {
      const found: Conflict[] = [];
      if (other.teacherId === candidate.teacherId) found.push({ kind: 'teacher', other });
      if (candidate.roomId && other.roomId === candidate.roomId) found.push({ kind: 'room', other });
      return found;
    });

/** Session dates of a class from the term start, skipping holidays. */
export const sessionDates = (cls: Pick<ClassGroup, 'days' | 'sessions' | 'start'>, termStart: string, holidays: string[] = []) => {
  const dates: Date[] = [];
  const cursor = new Date(termStart);
  cursor.setHours(0, 0, 0, 0);
  const [h, m] = cls.start.split(':').map(Number);
  let guard = 0;
  while (dates.length < cls.sessions && guard < 400) {
    guard += 1;
    const key = cursor.toISOString().slice(0, 10);
    if (cls.days.includes(persianWeekday(cursor)) && !holidays.includes(key)) {
      const d = new Date(cursor);
      d.setHours(h, m, 0, 0);
      dates.push(d);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

export const sessionsLabel = (n: number, minutes: number) => `${faNumber(n)} جلسه ${faNumber(minutes)} دقیقه‌ای`;
