import { courseById, levelTitle } from '@/data/catalog';
import { testById } from '@/data/mockTests';
import type { SeedData } from '@/data/seed';
import { bookingStatus, bookingTakesSeat, classState, enrollmentStatus, enrollmentTakesSeat, termState } from '@/data/status';
import { overallBand, scoreSection, speakingBand, writingBand, type SectionScore } from '@/lib/ielts';
import { sessionDates } from '@/lib/schedule';
import type { ClassGroup, GradeSheet, MockBooking, MockSession, Settings } from '@/types';

export const seatsTaken = (s: SeedData, classId: string) => s.enrollments.filter((e) => e.classId === classId && enrollmentTakesSeat(e)).length;
export const waitlistOf = (s: SeedData, classId: string) => s.enrollments.filter((e) => e.classId === classId && e.status === 'waitlisted');

export const classInfo = (s: SeedData, cls: ClassGroup) => {
  const term = s.terms.find((t) => t.id === cls.termId);
  const taken = seatsTaken(s, cls.id);
  return {
    cls,
    term,
    course: courseById(cls.courseId)!,
    level: levelTitle(cls.levelId),
    teacher: s.teachers.find((t) => t.id === cls.teacherId),
    room: s.rooms.find((r) => r.id === cls.roomId),
    taken,
    free: Math.max(0, cls.capacity - taken),
    waitlist: waitlistOf(s, cls.id).length,
    state: classState(cls, term, taken),
  };
};
export type ClassInfo = ReturnType<typeof classInfo>;

export const currentTerm = (s: SeedData) => s.terms.find((t) => termState(t) === 'running') ?? s.terms[s.terms.length - 1];
export const openTerm = (s: SeedData) => s.terms.find((t) => termState(t) === 'registration');

export const classSessions = (s: SeedData, cls: ClassGroup) => {
  const term = s.terms.find((t) => t.id === cls.termId);
  return term ? sessionDates(cls, term.start, s.holidays.map((h) => h.date)) : [];
};

export const rosterOf = (s: SeedData, classId: string) =>
  s.enrollments.filter((e) => e.classId === classId && ['confirmed', 'completed'].includes(enrollmentStatus(e))).map((e) => ({ enrollment: e, student: s.students.find((st) => st.id === e.studentId)! }));

export const attendanceSummary = (s: SeedData, classId: string, studentId: string) => {
  const sheets = s.attendance.filter((a) => a.classId === classId && a.marks[studentId]);
  const count = (m: string) => sheets.filter((a) => a.marks[studentId] === m).length;
  return { held: sheets.length, present: count('present'), late: count('late'), absent: count('absent'), excused: count('excused') };
};

export const gradeTotal = (g: GradeSheet | undefined) => {
  if (!g) return null;
  const parts = [g.activity, g.homework, g.midterm, g.final];
  if (parts.some((p) => p == null)) return null;
  return parts.reduce<number>((sum, p) => sum + (p ?? 0), 0);
};
export const gradePartial = (g: GradeSheet | undefined) => (g ? [g.activity, g.homework, g.midterm, g.final].reduce<number>((sum, p) => sum + (p ?? 0), 0) : 0);
export const passed = (g: GradeSheet | undefined, settings: Settings) => {
  const total = gradeTotal(g);
  return total == null ? null : total >= settings.grades.pass;
};

// ---------- mock ----------
export const sessionSeats = (s: SeedData, session: MockSession) => {
  const taken = s.bookings.filter((b) => b.sessionId === session.id && bookingTakesSeat(b)).length;
  return { taken, free: Math.max(0, session.capacity - taken) };
};

export type MockSessionState = 'open' | 'full' | 'closed' | 'today' | 'done' | 'cancelled';
export const mockSessionState = (s: SeedData, session: MockSession): MockSessionState => {
  if (session.cancelled) return 'cancelled';
  const start = new Date(session.at).getTime();
  if (Date.now() > start + 8 * 3600_000) return 'done';
  if (Date.now() >= start) return 'today';
  if (Date.now() > new Date(session.regClose).getTime()) return 'closed';
  return sessionSeats(s, session).free > 0 ? 'open' : 'full';
};
export const MOCK_SESSION_META: Record<MockSessionState, { label: string; tone: 'default' | 'accent' | 'success' | 'warning' | 'danger' }> = {
  open: { label: 'ثبت‌نام باز', tone: 'accent' },
  full: { label: 'تکمیل ظرفیت', tone: 'warning' },
  closed: { label: 'ثبت‌نام بسته', tone: 'default' },
  today: { label: 'در حال برگزاری', tone: 'success' },
  done: { label: 'برگزار شد', tone: 'default' },
  cancelled: { label: 'لغو شد', tone: 'danger' },
};

/** Online written test is open from the session start for 8 hours. */
export const examWindow = (session: MockSession) => {
  const start = new Date(session.at).getTime();
  const end = start + 8 * 3600_000;
  const t = Date.now();
  return { start, end, open: t >= start && t <= end, before: t < start, after: t > end };
};

export interface BookingScores {
  listening?: SectionScore;
  reading?: SectionScore;
  writing?: number;
  speaking?: number;
  overall?: number;
}
export const bookingScores = (b: MockBooking, session?: MockSession): BookingScores => {
  const test = testById(session?.testIds[b.module]) ?? testById(b.module === 'academic' ? 'test-a-ac' : 'test-a-gt');
  if (!b.attempt || !test) return {};
  const listening = scoreSection(test, 'listening', b.attempt.answers);
  const reading = scoreSection(test, 'reading', b.attempt.answers);
  const writing = b.writing ? writingBand(b.writing.t1, b.writing.t2) : undefined;
  const speaking = b.speaking ? speakingBand(b.speaking.scores) : b.speakingNoShow ? 0 : undefined;
  const overall = writing != null && speaking != null ? overallBand([listening.band, reading.band, writing, speaking]) : undefined;
  return { listening, reading, writing, speaking, overall };
};

export const testFor = (b: MockBooking, session?: MockSession) => testById(session?.testIds[b.module]) ?? testById(b.module === 'academic' ? 'test-a-ac' : 'test-a-gt')!;

export const effectiveBooking = bookingStatus;
