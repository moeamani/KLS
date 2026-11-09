import type { MockModule, MockTest, Question, SpeakingCriterion, WritingCriterion } from '@/types';

// IELTS band rules used by the mock. The conversion tables are the widely published
// approximate ones; KLS can tune them (docs/02-ielts-mock.md, «امتیازدهی»).

/** [minimum raw score out of 40, band] from the top down. */
const LISTENING: [number, number][] = [[39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5], [16, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1]];
const READING_AC: [number, number][] = [[39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1]];
const READING_GT: [number, number][] = [[40, 9], [39, 8.5], [37, 8], [36, 7.5], [34, 7], [32, 6.5], [30, 6], [27, 5.5], [23, 5], [19, 4.5], [15, 4], [12, 3.5], [9, 3], [6, 2.5], [3, 2], [1, 1]];

export const BAND_TABLES = { listening: LISTENING, readingAcademic: READING_AC, readingGeneral: READING_GT };

/** A short demo test is scaled to the 40-question scale before conversion. */
export const scaleTo40 = (raw: number, total: number) => (total === 40 ? raw : Math.round((raw * 40) / Math.max(1, total)));

const lookup = (table: [number, number][], raw40: number) => table.find(([min]) => raw40 >= min)?.[1] ?? 0;

export const listeningBand = (raw: number, total: number) => lookup(LISTENING, scaleTo40(raw, total));
export const readingBand = (raw: number, total: number, module: MockModule) => lookup(module === 'academic' ? READING_AC : READING_GT, scaleTo40(raw, total));

/** Overall band: the mean of the four skills, rounded to the nearest half band (.25 → .5, .75 → next whole). */
export const roundOverall = (mean: number) => {
  const whole = Math.floor(mean);
  const fraction = mean - whole;
  if (fraction < 0.25) return whole;
  if (fraction < 0.75) return whole + 0.5;
  return whole + 1;
};

/** Criterion average for one Writing task or for Speaking, rounded down to the half band below. */
export const roundDownHalf = (value: number) => Math.floor(value * 2) / 2;

export const criteriaBand = (scores: Record<string, number>) => {
  const values = Object.values(scores);
  return roundDownHalf(values.reduce((sum, v) => sum + v, 0) / values.length);
};

/** Task 2 counts twice as much as Task 1. */
export const writingBand = (t1: Record<WritingCriterion, number>, t2: Record<WritingCriterion, number>) =>
  roundOverall((criteriaBand(t1) + 2 * criteriaBand(t2)) / 3);

export const speakingBand = (scores: Record<SpeakingCriterion, number>) => criteriaBand(scores);

export const overallBand = (bands: number[]) => roundOverall(bands.reduce((sum, b) => sum + b, 0) / bands.length);

export const formatBand = (band: number | undefined | null) => (band == null ? '—' : new Intl.NumberFormat('fa-IR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(band));

/** Indicative CEFR level for a band. */
export const cefrOf = (band: number) => (band >= 8.5 ? 'C2' : band >= 7 ? 'C1' : band >= 5.5 ? 'B2' : band >= 4 ? 'B1' : band >= 3 ? 'A2' : 'A1');

export const BAND_LABEL: Record<number, string> = {
  9: 'کاربر خبره', 8: 'کاربر بسیار خوب', 7: 'کاربر خوب', 6: 'کاربر شایسته', 5: 'کاربر متوسط', 4: 'کاربر محدود', 3: 'کاربر بسیار محدود', 2: 'کاربر گاه‌به‌گاه', 1: 'غیرکاربر', 0: 'بدون پاسخ',
};
export const bandLabel = (band: number) => BAND_LABEL[Math.floor(band)] ?? '';

export const WRITING_CRITERIA: { id: WritingCriterion; label: string; en: string }[] = [
  { id: 'ta', label: 'پاسخ به خواسته سؤال', en: 'Task Achievement / Response' },
  { id: 'cc', label: 'انسجام و پیوستگی', en: 'Coherence & Cohesion' },
  { id: 'lr', label: 'دامنه واژگان', en: 'Lexical Resource' },
  { id: 'gra', label: 'دامنه و دقت دستوری', en: 'Grammatical Range & Accuracy' },
];
export const SPEAKING_CRITERIA: { id: SpeakingCriterion; label: string; en: string }[] = [
  { id: 'fc', label: 'روانی و انسجام', en: 'Fluency & Coherence' },
  { id: 'lr', label: 'دامنه واژگان', en: 'Lexical Resource' },
  { id: 'gra', label: 'دامنه و دقت دستوری', en: 'Grammatical Range & Accuracy' },
  { id: 'p', label: 'تلفظ', en: 'Pronunciation' },
];

export const MIN_WORDS = { t1: 150, t2: 250 } as const;
export const wordCount = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

const normalise = (value: string) => value.trim().toLowerCase().replace(/[.,;:!?]+$/g, '').replace(/\s+/g, ' ');
export const isCorrect = (question: Question, given: string | undefined) => {
  if (!given) return false;
  const answer = normalise(given);
  return question.answer.some((accepted) => normalise(accepted) === answer);
};

export const questionsOf = (test: MockTest, section: 'listening' | 'reading') =>
  (section === 'listening' ? test.listening : test.reading).flatMap((part) => part.groups.flatMap((group) => group.questions));

export interface SectionScore { raw: number; total: number; band: number }

export const scoreSection = (test: MockTest, section: 'listening' | 'reading', answers: Record<string, string>): SectionScore => {
  const questions = questionsOf(test, section);
  const raw = questions.filter((q) => isCorrect(q, answers[q.id])).length;
  const band = section === 'listening' ? listeningBand(raw, questions.length) : readingBand(raw, questions.length, test.module);
  return { raw, total: questions.length, band };
};

export const QUESTION_TYPE_LABEL: Record<Question['type'], string> = {
  gap: 'تکمیل جای خالی',
  mcq: 'چندگزینه‌ای',
  tfng: 'True / False / Not Given',
  ynng: 'Yes / No / Not Given',
  match: 'تطبیق',
};

/** Accuracy per question type, for the result analysis. */
export const byType = (test: MockTest, answers: Record<string, string>) => {
  const rows = new Map<Question['type'], { correct: number; total: number }>();
  for (const section of ['listening', 'reading'] as const) {
    for (const q of questionsOf(test, section)) {
      const row = rows.get(q.type) ?? { correct: 0, total: 0 };
      row.total += 1;
      if (isCorrect(q, answers[q.id])) row.correct += 1;
      rows.set(q.type, row);
    }
  }
  return [...rows.entries()].map(([type, row]) => ({ type, ...row }));
};
