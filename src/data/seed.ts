import { addMinutes, daysFromNow, iso, now } from '@/lib/dates';
import { questionsOf } from '@/lib/ielts';
import { sessionDates } from '@/lib/schedule';
import type {
  Approval, AttendanceSheet, AuditEntry, ClassFormat, ClassGroup, Correction, DiscountCode, Enrollment, GradeSheet, Holiday, Homework, Invoice, Lead, LeaveRequest,
  Mark, MockBooking, MockModule, MockSession, NewsItem, Notice, Parent, Resource, Room, Settings, SpeakingGrade, Staff, Student, Teacher, Term, TimelineEvent, Weekday, WritingGrade,
} from '@/types';
import { courseById } from './catalog';
import { MOCK_TESTS, SAMPLE_WRITING, testById } from './mockTests';

// Prototype data, generated relative to "now" so dates always make sense when the demo runs.

let counter = 0;
export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

/** Deterministic pseudo-random numbers so the seed is the same on every reset. */
const rng = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

export const CURRENT = { student: 'st1', parent: 'pa1', teacher: 'te1', admin: 'sf1' } as const;

const ev = (title: string, at: string, detail?: string, by?: string, tone?: TimelineEvent['tone']): TimelineEvent => ({ id: uid('ev'), at, title, detail, by, tone });

export const DEFAULT_SETTINGS: Settings = {
  seatHoldMin: 15,
  mock: {
    listeningMin: 30, readingMin: 60, writingMin: 60, graceMin: 10, timerOnDisconnect: 'run', singleSession: true, maxResumes: 2,
    instantLR: true, autoRelease: false, cancelHours: 48, refundPercent: 80, remarkFee: 600_000, correctionPrice: 450_000, correctionExpressPrice: 750_000,
  },
  grades: { activity: 15, homework: 15, midterm: 30, final: 40, pass: 70 },
  installmentMin: 6_000_000,
  absenceAlert: 3,
};

const NAMES = [
  'سارا رحیمی', 'امیر حسینی', 'نازنین کرمی', 'پویا شریفی', 'آرین کریمی', 'ترانه کریمی', 'محمد صفری', 'زهرا جلالی', 'حسین بیگی', 'فاطمه نظری',
  'علیرضا مرادی', 'مهسا امینی‌پور', 'رضا ویسی', 'شیما زارعی', 'کیان رستمی', 'نیلوفر احمدی', 'آرمان یوسفی', 'هانیه ملکی', 'سینا باقری', 'مریم سلیمی',
  'یاسمن عزیزی', 'بردیا نوروزی', 'پریا قاسمی', 'امید خسروی', 'دنیا فرجی', 'میلاد پاکزاد', 'الناز شهبازی', 'سپهر وکیلی',
];

export interface SeedData {
  students: Student[];
  parents: Parent[];
  teachers: Teacher[];
  staff: Staff[];
  rooms: Room[];
  terms: Term[];
  holidays: Holiday[];
  classes: ClassGroup[];
  enrollments: Enrollment[];
  attendance: AttendanceSheet[];
  homework: Homework[];
  mockSessions: MockSession[];
  bookings: MockBooking[];
  corrections: Correction[];
  invoices: Invoice[];
  discounts: DiscountCode[];
  leads: Lead[];
  approvals: Approval[];
  leaves: LeaveRequest[];
  notices: Notice[];
  audit: AuditEntry[];
  resources: Resource[];
  news: NewsItem[];
  settings: Settings;
}

export function createSeed(): SeedData {
  counter = 0;
  const rand = rng(1405);

  // ---------- people ----------
  const students: Student[] = NAMES.map((name, i) => {
    const id = `st${i + 1}`;
    const birthYear = i === 4 ? 1397 : i === 5 ? 1391 : 1365 + Math.floor(rand() * 18);
    return {
      id, name, birthYear,
      mobile: `0918${String(1234567 + i * 7919).slice(0, 7)}`,
      nationalId: undefined,
      parentId: i === 4 || i === 5 ? 'pa1' : undefined,
      levelId: i === 0 ? 'a4' : undefined,
      createdAt: daysFromNow(-200 + i * 5),
      source: i % 3 === 0 ? 'reception' : 'online',
    };
  });
  students[0].email = 'sara.rahimi@example.com';

  const parents: Parent[] = [{ id: 'pa1', name: 'مریم کریمی', mobile: '09189876543', childIds: ['st5', 'st6'] }];

  const teachers: Teacher[] = [
    { id: 'te1', name: 'علی نوری', mobile: '09121110001', nationalId: '0012345674', skills: ['ielts', 'examiner', 'general'], ratePerSession: 950_000, status: 'active', bio: 'مدرس آیلتس و ممتحن آزمون‌های آزمایشی' },
    { id: 'te2', name: 'نگار صادقی', mobile: '09121110002', nationalId: '0023456781', skills: ['kids', 'general'], ratePerSession: 650_000, status: 'active' },
    { id: 'te3', name: 'کاوه مرادی', mobile: '09121110003', nationalId: '0034567898', skills: ['general', 'ielts', 'examiner'], ratePerSession: 800_000, status: 'active' },
    { id: 'te4', name: 'الهام فتحی', mobile: '09121110004', nationalId: '0045678905', skills: ['kids', 'general'], ratePerSession: 650_000, status: 'active' },
    { id: 'te5', name: 'رضا جهانگیری', mobile: '09121110005', nationalId: '0056789012', skills: ['general', 'ttc'], ratePerSession: 850_000, status: 'active' },
    { id: 'te6', name: 'سمیرا یزدانی', mobile: '09121110006', nationalId: '0067890129', skills: ['ielts', 'examiner'], ratePerSession: 950_000, status: 'active' },
  ];

  const staff: Staff[] = [
    { id: 'sf1', name: 'حمید رستمی', mobile: '09121112001', nationalId: '0078901236', role: 'manager', status: 'active', lastActiveAt: daysFromNow(0, 9) },
    { id: 'sf2', name: 'لیلا اکبری', mobile: '09121112002', nationalId: '0089012343', role: 'reception', status: 'active', lastActiveAt: daysFromNow(0, 8, 30) },
    { id: 'sf3', name: 'بهروز کیانی', mobile: '09121112003', nationalId: '0090123450', role: 'finance', status: 'active', lastActiveAt: daysFromNow(-1, 16) },
    { id: 'sf4', name: 'مینا حیدری', mobile: '09121112004', nationalId: '0101234567', role: 'reception', status: 'invited' },
  ];

  const rooms: Room[] = [
    { id: 'r1', name: 'کلاس ۱', capacity: 12 }, { id: 'r2', name: 'کلاس ۲', capacity: 12 }, { id: 'r3', name: 'کلاس ۳', capacity: 10 },
    { id: 'r4', name: 'کلاس ۴ (بزرگ)', capacity: 16 }, { id: 'r5', name: 'سایت کامپیوتر', capacity: 24 }, { id: 'r6', name: 'کلاس کودکان', capacity: 10 },
  ];

  const terms: Term[] = [
    { id: 'term-sum', title: 'تابستان ۱۴۰۵', regOpen: daysFromNow(-175), regClose: daysFromNow(-135), start: daysFromNow(-140, 0), end: daysFromNow(-62, 23) },
    { id: 'term-aut', title: 'پاییز ۱۴۰۵', regOpen: daysFromNow(-80), regClose: daysFromNow(-40), start: daysFromNow(-45, 0), end: daysFromNow(30, 23) },
    { id: 'term-win', title: 'زمستان ۱۴۰۵', regOpen: daysFromNow(-5), regClose: daysFromNow(45), start: daysFromNow(40, 0), end: daysFromNow(118, 23) },
  ];
  const holidays: Holiday[] = [
    { date: daysFromNow(9).slice(0, 10), title: 'تعطیلی رسمی' },
    { date: daysFromNow(52).slice(0, 10), title: 'تعطیلی رسمی' },
    { date: daysFromNow(64).slice(0, 10), title: 'تعطیلی آموزشگاه' },
  ];

  // ---------- classes ----------
  type Spec = [string, string, string, string, string, string | null, ClassFormat, Weekday[], string, number];
  const specs: Spec[] = [
    ['IE-FND-0', 'term-sum', 'ielts', 'i1', 'te1', 'r4', 'in_person', [0, 2], '18:00', 12],
    ['K2-0', 'term-sum', 'kids', 'k2', 'te2', 'r6', 'in_person', [0, 2], '16:00', 10],
    ['T4-0', 'term-sum', 'teens', 't4', 'te4', 'r2', 'in_person', [1, 3], '16:30', 12],
    ['IE-ADV-1', 'term-aut', 'ielts', 'i2', 'te1', 'r4', 'in_person', [1, 3], '18:00', 12],
    ['A-B2-1', 'term-aut', 'adults', 'a4', 'te3', 'r1', 'in_person', [0, 2], '17:00', 12],
    ['A-A2-1', 'term-aut', 'adults', 'a2', 'te5', 'r3', 'in_person', [0, 2], '18:30', 10],
    ['A-B1-ON1', 'term-aut', 'adults', 'a3', 'te3', null, 'online', [1, 3], '20:00', 14],
    ['K3-1', 'term-aut', 'kids', 'k3', 'te2', 'r6', 'in_person', [0, 2], '16:00', 10],
    ['T5-1', 'term-aut', 'teens', 't5', 'te4', 'r2', 'in_person', [1, 3], '16:30', 12],
    ['SK-W-1', 'term-aut', 'ielts_skills', 's1', 'te6', 'r1', 'in_person', [5], '10:00', 10],
    ['TTC-1', 'term-aut', 'ttc', 'c1', 'te5', 'r4', 'in_person', [5], '14:00', 12],
    ['IE-FND-2', 'term-win', 'ielts', 'i1', 'te1', 'r4', 'in_person', [0, 2], '18:00', 12],
    ['IE-ADV-2', 'term-win', 'ielts', 'i2', 'te1', 'r4', 'in_person', [1, 3], '18:00', 12],
    ['A-B2-2', 'term-win', 'adults', 'a4', 'te3', 'r1', 'in_person', [0, 2], '17:00', 12],
    ['A-B1-2', 'term-win', 'adults', 'a3', 'te5', 'r3', 'in_person', [1, 3], '18:30', 10],
    ['A-A2-ON2', 'term-win', 'adults', 'a2', 'te3', null, 'online', [0, 2], '20:00', 14],
    ['K4-2', 'term-win', 'kids', 'k4', 'te2', 'r6', 'in_person', [0, 2], '16:00', 10],
    ['T6-2', 'term-win', 'teens', 't6', 'te4', 'r2', 'in_person', [1, 3], '16:30', 12],
    ['SK-S-2', 'term-win', 'ielts_skills', 's2', 'te6', 'r1', 'in_person', [5], '10:00', 8],
    ['SK-LR-2', 'term-win', 'ielts_skills', 's3', 'te1', null, 'online', [5], '16:00', 12],
    ['P-1', 'term-aut', 'private', 'p1', 'te3', 'r3', 'private', [4], '11:00', 1],
  ];
  const classes: ClassGroup[] = specs.map(([code, termId, courseId, levelId, teacherId, roomId, format, days, start, capacity]) => {
    const course = courseById(courseId)!;
    return {
      id: `cl-${code.toLowerCase()}`, code, termId, courseId, levelId, teacherId, roomId: roomId ?? undefined,
      onlineUrl: roomId ? undefined : 'https://class.kls.example/room/' + code.toLowerCase(),
      format, days, start, minutes: course.minutes, capacity, sessions: course.sessions,
      price: course.priceUnit === 'session' ? course.price * course.sessions : course.price,
    };
  });
  const cls = (code: string) => classes.find((c) => c.code === code)!;

  // ---------- enrollments, attendance, grades ----------
  const enrollments: Enrollment[] = [];
  const invoices: Invoice[] = [];
  let invoiceNo = 1001;
  const pay = (studentId: string, title: string, amount: number, at: string, ref: Invoice['ref'], opts: { installments?: { due: string; amount: number }[]; paid?: number; method?: 'online' | 'pos' | 'cash' } = {}) => {
    const id = `inv-${invoiceNo}`;
    const paidAmount = opts.paid ?? amount;
    invoices.push({
      id, code: `KLS-${invoiceNo++}`, studentId, title, items: [{ label: title, amount }], total: amount, status: 'open', createdAt: at, ref,
      installments: (opts.installments ?? [{ due: at, amount }]).map((inst, i) => ({ id: `${id}-i${i}`, ...inst })),
      payments: paidAmount > 0 ? [{ id: `${id}-p`, amount: paidAmount, at, method: opts.method ?? 'online', ref: `TRX${700000 + invoiceNo * 13}` }] : [],
    });
    return id;
  };

  const enroll = (studentId: string, code: string, status: Enrollment['status'], at: string, grade?: GradeSheet, by: Enrollment['by'] = 'student') => {
    const c = cls(code);
    const id = `en-${enrollments.length + 1}`;
    const invoiceId = status === 'waitlisted' ? undefined : pay(studentId, `شهریه ${c.code}`, c.price, at, { kind: 'enrollment', id }, status === 'held' ? { paid: 0 } : {});
    enrollments.push({
      id, studentId, classId: c.id, status, createdAt: at, by, invoiceId, grade,
      heldUntil: status === 'held' ? iso(addMinutes(new Date(at), 15)) : undefined,
      events: [ev(status === 'waitlisted' ? 'به لیست انتظار اضافه شد' : 'ثبت‌نام انجام شد', at, undefined, by === 'reception' ? 'لیلا اکبری' : undefined), ...(status === 'confirmed' || status === 'completed' ? [ev('پرداخت شهریه تأیید شد', at, undefined, undefined, 'success')] : [])],
    });
  };

  const fullGrade = (base: number): GradeSheet => ({
    activity: Math.min(15, Math.round(11 + base * 4)), homework: Math.min(15, Math.round(10 + base * 5)), midterm: Math.min(30, Math.round(20 + base * 10)), final: Math.min(40, Math.round(26 + base * 14)),
    comment: base > 0.6 ? 'پیشرفت بسیار خوب؛ برای سطح بعد آماده است.' : 'پیشرفت قابل قبول؛ تمرین بیشتر روی مهارت شنیداری توصیه می‌شود.', status: 'released', updatedAt: daysFromNow(-60),
  });

  // previous term (completed, grades released)
  enroll('st1', 'IE-FND-0', 'completed', daysFromNow(-150), fullGrade(0.8));
  enroll('st5', 'K2-0', 'completed', daysFromNow(-150), fullGrade(0.7), 'parent');
  enroll('st6', 'T4-0', 'completed', daysFromNow(-150), fullGrade(0.4), 'parent');
  ['st2', 'st3', 'st11', 'st12'].forEach((s) => enroll(s, 'IE-FND-0', 'completed', daysFromNow(-148), fullGrade(rand())));

  // current term
  const pool = students.slice(6).map((s) => s.id);
  const currentFill: Record<string, number> = { 'IE-ADV-1': 9, 'A-B2-1': 10, 'A-A2-1': 8, 'A-B1-ON1': 11, 'K3-1': 7, 'T5-1': 9, 'SK-W-1': 6, 'TTC-1': 8, 'P-1': 1 };
  const midGrade = (): GradeSheet => ({ activity: 10 + Math.floor(rand() * 6), homework: 9 + Math.floor(rand() * 7), midterm: 18 + Math.floor(rand() * 13), final: null, comment: '', status: 'draft' });
  enroll('st1', 'IE-ADV-1', 'confirmed', daysFromNow(-60), { activity: 13, homework: 14, midterm: 26, final: null, comment: '', status: 'draft' });
  enroll('st5', 'K3-1', 'confirmed', daysFromNow(-58), midGrade(), 'parent');
  enroll('st6', 'T5-1', 'confirmed', daysFromNow(-58), midGrade(), 'parent');
  let cursor = 0;
  for (const [code, count] of Object.entries(currentFill)) {
    const already = enrollments.filter((e) => e.classId === cls(code).id).length;
    for (let i = already; i < count; i += 1) {
      enroll(pool[cursor % pool.length], code, 'confirmed', daysFromNow(-70 + (i % 25)), midGrade(), i % 4 === 0 ? 'reception' : 'student');
      cursor += 1;
    }
  }
  // the installment plan of the demo student: second part still due
  const st1Invoice = invoices.find((inv) => inv.ref.id === enrollments.find((e) => e.studentId === 'st1' && e.classId === cls('IE-ADV-1').id)?.id)!;
  st1Invoice.installments = [{ id: `${st1Invoice.id}-i0`, due: daysFromNow(-60), amount: 5_000_000 }, { id: `${st1Invoice.id}-i1`, due: daysFromNow(10), amount: 4_500_000 }];
  st1Invoice.payments = [{ id: `${st1Invoice.id}-p`, amount: 5_000_000, at: daysFromNow(-60), method: 'online', ref: 'TRX7731902' }];
  const st6Invoice = invoices.find((inv) => inv.studentId === 'st6' && inv.title.includes('T5-1'))!;
  st6Invoice.installments = [{ id: `${st6Invoice.id}-i0`, due: daysFromNow(-58), amount: 2_200_000 }, { id: `${st6Invoice.id}-i1`, due: daysFromNow(-5), amount: 2_000_000 }];
  st6Invoice.payments = [{ id: `${st6Invoice.id}-p`, amount: 2_200_000, at: daysFromNow(-58), method: 'pos', ref: 'POS55120' }];

  // next term (registration open): one class full with a waitlist, an expired hold
  const nextFill: Record<string, number> = { 'IE-FND-2': 7, 'IE-ADV-2': 5, 'A-B2-2': 6, 'A-B1-2': 10, 'A-A2-ON2': 4, 'K4-2': 3, 'T6-2': 5, 'SK-S-2': 6, 'SK-LR-2': 3 };
  for (const [code, count] of Object.entries(nextFill)) {
    for (let i = 0; i < count; i += 1) {
      enroll(pool[cursor % pool.length], code, 'confirmed', daysFromNow(-4 + (i % 4), 9 + i), undefined, i % 3 === 0 ? 'reception' : 'student');
      cursor += 1;
    }
  }
  enroll('st5', 'K4-2', 'confirmed', daysFromNow(-2, 19), undefined, 'parent');
  enroll('st19', 'A-B1-2', 'waitlisted', daysFromNow(-1, 11));
  enroll('st20', 'A-B1-2', 'waitlisted', daysFromNow(0, 9));
  enroll('st21', 'A-B2-2', 'held', daysFromNow(-1, 14));

  const holidayKeys = holidays.map((h) => h.date);
  const attendance: AttendanceSheet[] = [];
  for (const c of classes.filter((item) => item.termId === 'term-aut')) {
    const term = terms[1];
    const roster = enrollments.filter((e) => e.classId === c.id && e.status === 'confirmed').map((e) => e.studentId);
    sessionDates(c, term.start, holidayKeys).forEach((date, index) => {
      if (date.getTime() > Date.now() - 3 * 3600_000) return;
      const marks: Record<string, Mark> = {};
      for (const s of roster) {
        const r = rand();
        marks[s] = r > 0.93 ? 'absent' : r > 0.88 ? 'late' : r > 0.86 ? 'excused' : 'present';
      }
      if (c.code === 'T5-1' && index < 6 && index % 2 === 1) marks.st6 = 'absent';
      if (c.code === 'IE-ADV-1' && index === 3) marks.st1 = 'absent';
      attendance.push({ id: `at-${c.id}-${index + 1}`, classId: c.id, session: index + 1, date: iso(date), marks, by: c.teacherId, at: iso(addMinutes(date, c.minutes)) });
    });
  }

  const homework: Homework[] = [
    { id: 'hw1', classId: cls('IE-ADV-1').id, title: 'Writing Task 2: Opinion essay', due: daysFromNow(3), detail: 'یک مقاله ۲۷۰ کلمه‌ای درباره موضوع کلاس بنویسید و در جلسه بعد تحویل دهید.' },
    { id: 'hw2', classId: cls('IE-ADV-1').id, title: 'Reading: Matching headings practice', due: daysFromNow(-4), detail: 'تمرین‌های صفحه ۴۲ تا ۴۵.' },
    { id: 'hw3', classId: cls('T5-1').id, title: 'Unit 6 workbook', due: daysFromNow(2), detail: 'تمرین‌های واحد ۶ کتاب کار.' },
    { id: 'hw4', classId: cls('K3-1').id, title: 'آهنگ و کارت‌های واژه', due: daysFromNow(1), detail: 'با کمک والدین کارت‌های واژه درس ۴ را تمرین کنید.' },
  ];

  // ---------- IELTS mock ----------
  const slotsFor = (at: string, count: number, examiners: string[]) =>
    Array.from({ length: count }, (_, i) => ({ id: uid('slot'), at: iso(addMinutes(new Date(at), 240 + Math.floor(i / examiners.length) * 15)), examinerId: examiners[i % examiners.length] }));
  // The online mock "today" opened an hour ago, so its 8-hour window is open whenever the demo runs.
  const todayAt = new Date(now().getTime() - 60 * 60_000);
  todayAt.setSeconds(0, 0);

  const mockSessions: MockSession[] = [
    { id: 'ms-past', title: 'آزمون ماک مهر', at: daysFromNow(-24, 9), modules: ['academic', 'general'], deliveries: ['center', 'online'], testIds: { academic: 'test-a-ac', general: 'test-a-gt' }, capacity: 30, price: 1_900_000, regClose: daysFromNow(-26, 23), slots: slotsFor(daysFromNow(-24, 9), 24, ['te1', 'te3', 'te6']) },
    { id: 'ms-recent', title: 'آزمون ماک آبان (۱)', at: daysFromNow(-3, 9), modules: ['academic', 'general'], deliveries: ['center', 'online'], testIds: { academic: 'test-a-ac', general: 'test-a-gt' }, capacity: 30, price: 1_900_000, regClose: daysFromNow(-5, 23), slots: slotsFor(daysFromNow(-3, 9), 24, ['te1', 'te3', 'te6']) },
    { id: 'ms-today', title: 'آزمون ماک آنلاین امروز', at: iso(todayAt), modules: ['academic', 'general'], deliveries: ['online'], testIds: { academic: 'test-a-ac', general: 'test-a-gt' }, capacity: 20, price: 1_700_000, regClose: iso(addMinutes(todayAt, -60 * 12)), slots: slotsFor(iso(todayAt), 12, ['te1', 'te6']), note: 'آزمون آنلاین تا ۸ ساعت پس از شروع باز است.' },
    { id: 'ms-next', title: 'آزمون ماک آبان (۲)', at: daysFromNow(6, 9), modules: ['academic', 'general'], deliveries: ['center', 'online'], testIds: { academic: 'test-a-ac', general: 'test-a-gt' }, capacity: 30, price: 1_900_000, regClose: daysFromNow(4, 23), slots: slotsFor(daysFromNow(6, 9), 24, ['te1', 'te3', 'te6']) },
    { id: 'ms-cancel', title: 'آزمون ماک ویژه (لغو شد)', at: daysFromNow(10, 9), modules: ['academic'], deliveries: ['center'], testIds: { academic: 'test-a-ac' }, capacity: 16, price: 1_900_000, regClose: daysFromNow(8, 23), slots: [], cancelled: true, note: 'به دلیل تعطیلی رسمی لغو شد؛ مبلغ رزروها کامل بازگردانده شد.' },
    { id: 'ms-azar', title: 'آزمون ماک آذر', at: daysFromNow(20, 9), modules: ['academic', 'general'], deliveries: ['center'], testIds: { academic: 'test-a-ac', general: 'test-a-gt' }, capacity: 20, price: 1_900_000, regClose: daysFromNow(18, 23), slots: slotsFor(daysFromNow(20, 9), 16, ['te1', 'te6']) },
  ];

  const bookings: MockBooking[] = [];
  let bookingNo = 501;
  const writingGrade = (level: number, examinerId: string): WritingGrade => {
    const c = (offset: number) => Math.max(4, Math.min(9, Math.round(level + offset)));
    return {
      t1: { ta: c(0), cc: c(-0.4), lr: c(0.2), gra: c(-0.6) }, t2: { ta: c(0.2), cc: c(0), lr: c(0.3), gra: c(-0.4) },
      comments: {
        t1: 'Overview is clear and key features are selected. Some comparisons lack precise data; vary the language of change more.',
        t2: 'Position is clear throughout and ideas are well organised. Develop the second body paragraph with a more specific example.',
        overall: 'به‌طور کلی پاسخ‌ها ساختار خوبی دارند. برای رسیدن به نمره بالاتر روی دقت دستوری جمله‌های مرکب کار کنید.',
      },
      examinerId, at: daysFromNow(-20, 15),
    };
  };
  const speakingGrade = (level: number, examinerId: string): SpeakingGrade => {
    const c = (offset: number) => Math.max(4, Math.min(9, Math.round(level + offset)));
    return { scores: { fc: c(0), lr: c(0.2), gra: c(-0.5), p: c(0.1) }, comment: 'Speaks at length with some hesitation. Good range of vocabulary; work on complex structures in Part 3.', examinerId, at: daysFromNow(-24, 15) };
  };
  const answersFor = (module: MockModule, accuracy: number) => {
    const test = testById(module === 'academic' ? 'test-a-ac' : 'test-a-gt')!;
    const answers: Record<string, string> = {};
    for (const section of ['listening', 'reading'] as const) {
      for (const question of questionsOf(test, section)) {
        if (rand() < accuracy) answers[question.id] = question.answer[0];
        else if (rand() > 0.15) answers[question.id] = question.options ? (question.answer[0] === 'A' ? 'B' : 'A') : 'unknown';
      }
    }
    return answers;
  };
  const book = (sessionId: string, studentId: string, module: MockModule, status: MockBooking['status'], opts: { level?: number; accuracy?: number; writer?: string; speaker?: string; delivery?: 'center' | 'online'; writingDone?: boolean; speakingDone?: boolean; heldUntil?: string } = {}) => {
    const session = mockSessions.find((s) => s.id === sessionId)!;
    const id = `bk-${bookingNo}`;
    const createdAt = iso(addMinutes(new Date(session.at), -60 * 24 * (6 + Math.floor(rand() * 10))));
    const slot = session.slots.find((s) => !s.bookingId && (!opts.speaker || s.examinerId === opts.speaker));
    if (slot && status !== 'held' && status !== 'cancelled') slot.bookingId = id;
    const taken = ['in_progress', 'awaiting_grading', 'graded', 'released'].includes(status);
    const level = opts.level ?? 6;
    const booking: MockBooking = {
      id, code: `M-${bookingNo++}`, studentId, sessionId, module, delivery: opts.delivery ?? session.deliveries[0], status, createdAt,
      slotId: slot && status !== 'held' && status !== 'cancelled' ? slot.id : undefined,
      heldUntil: opts.heldUntil,
      invoiceId: status === 'held' ? pay(studentId, `آزمون ماک ${session.title}`, session.price, createdAt, { kind: 'mock', id }, { paid: 0 }) : pay(studentId, `آزمون ماک ${session.title}`, session.price, createdAt, { kind: 'mock', id }),
      attempt: taken ? { answers: answersFor(module, opts.accuracy ?? 0.65), writing: SAMPLE_WRITING, startedAt: session.at, submittedAt: iso(addMinutes(new Date(session.at), 150)), log: [{ type: 'start', at: session.at }, { type: 'completed', at: iso(addMinutes(new Date(session.at), 150)) }], endReason: 'completed' } : undefined,
      writingExaminerId: taken ? opts.writer ?? 'te6' : undefined,
      writing: taken && (status === 'graded' || status === 'released' || opts.writingDone) ? writingGrade(level, opts.writer ?? 'te6') : undefined,
      speaking: taken && (status === 'graded' || status === 'released' || opts.speakingDone) ? speakingGrade(level, slot?.examinerId ?? 'te3') : undefined,
      releasedAt: status === 'released' ? iso(addMinutes(new Date(session.at), 60 * 24 * 5)) : undefined,
      events: [ev('رزرو ثبت شد', createdAt), ...(status !== 'held' ? [ev('پرداخت تأیید شد', createdAt, undefined, undefined, 'success')] : [])],
    };
    if (taken) booking.events.push(ev('آزمون کتبی ثبت شد', booking.attempt!.submittedAt!));
    if (status === 'released') booking.events.push(ev('نتیجه منتشر شد', booking.releasedAt!, undefined, 'حمید رستمی', 'success'));
    if (status === 'no_show') booking.events.push(ev('غیبت در آزمون ثبت شد', session.at, undefined, 'لیلا اکبری', 'danger'));
    bookings.push(booking);
    return booking;
  };

  // released results (one month ago)
  book('ms-past', 'st1', 'academic', 'released', { level: 6.4, accuracy: 0.68, writer: 'te6', delivery: 'center' });
  [['st2', 0.55, 5.6], ['st3', 0.8, 7.2], ['st4', 0.45, 5.2], ['st7', 0.72, 6.8], ['st8', 0.6, 6.1], ['st9', 0.5, 5.7], ['st10', 0.85, 7.6]].forEach(([s, a, l], i) =>
    book('ms-past', s as string, i % 3 === 2 ? 'general' : 'academic', 'released', { accuracy: a as number, level: l as number, writer: i % 2 ? 'te1' : 'te6' }));
  // waiting for examiners (3 days ago)
  book('ms-recent', 'st11', 'academic', 'awaiting_grading', { level: 6, writer: 'te1', speaker: 'te3', speakingDone: true, writingDone: false });
  book('ms-recent', 'st12', 'academic', 'awaiting_grading', { level: 6.6, writer: 'te6', speaker: 'te1', writingDone: true, speakingDone: false });
  book('ms-recent', 'st13', 'general', 'awaiting_grading', { level: 5.5, writer: 'te1', speaker: 'te1', writingDone: false, speakingDone: false });
  book('ms-recent', 'st14', 'academic', 'graded', { level: 7, writer: 'te6', speaker: 'te3' });
  book('ms-recent', 'st15', 'academic', 'no_show', {});
  // today: the demo student can sit the online mock now
  book('ms-today', 'st1', 'academic', 'confirmed', { delivery: 'online' });
  book('ms-today', 'st16', 'general', 'confirmed', { delivery: 'online' });
  // upcoming
  book('ms-next', 'st2', 'academic', 'confirmed', {});
  book('ms-next', 'st17', 'academic', 'held', { heldUntil: daysFromNow(-1, 12) });
  for (let i = 0; i < 18; i += 1) book('ms-azar', pool[(i + 3) % pool.length], i % 4 === 0 ? 'general' : 'academic', 'confirmed', {});
  book('ms-next', 'st18', 'general', 'cancelled', {});

  // ---------- correction service ----------
  const corrections: Correction[] = [
    { id: 'cr-1', code: 'C-301', studentId: 'st1', task: 't2', prompt: MOCK_TESTS[0].writing.t2.prompt, text: SAMPLE_WRITING.t2, status: 'returned', examinerId: 'te6', express: false, createdAt: daysFromNow(-12), returnedAt: daysFromNow(-9),
      grade: { scores: { ta: 7, cc: 7, lr: 6, gra: 6 }, comment: 'A well-organised essay with a clear position. Use a wider range of less common vocabulary and check article use (a/the).', at: daysFromNow(-9) },
      events: [ev('متن ارسال شد', daysFromNow(-12)), ev('به ممتحن سپرده شد', daysFromNow(-11), 'سمیرا یزدانی'), ev('بازخورد ارسال شد', daysFromNow(-9), undefined, undefined, 'success')] },
    { id: 'cr-2', code: 'C-302', studentId: 'st3', task: 't1_academic', prompt: MOCK_TESTS[0].writing.t1.prompt, text: SAMPLE_WRITING.t1, status: 'submitted', express: true, createdAt: daysFromNow(0, 8), events: [ev('متن ارسال شد', daysFromNow(0, 8))] },
    { id: 'cr-3', code: 'C-303', studentId: 'st4', task: 't2', prompt: MOCK_TESTS[0].writing.t2.prompt, text: SAMPLE_WRITING.t2.slice(0, 900), status: 'in_review', examinerId: 'te1', express: false, createdAt: daysFromNow(-2), events: [ev('متن ارسال شد', daysFromNow(-2)), ev('به ممتحن سپرده شد', daysFromNow(-1), 'علی نوری')] },
    { id: 'cr-4', code: 'C-304', studentId: 'st1', task: 't1_general', prompt: MOCK_TESTS[1].writing.t1.prompt, text: 'Dear Sir or Madam,\n\nI am writing about the evening course in digital photography that I attended at your college last month...', status: 'submitted', express: false, createdAt: daysFromNow(-1, 20), events: [ev('متن ارسال شد', daysFromNow(-1, 20))] },
  ];
  corrections.forEach((c) => { c.invoiceId = pay(c.studentId, `تصحیح ${c.code}`, c.express ? DEFAULT_SETTINGS.mock.correctionExpressPrice : DEFAULT_SETTINGS.mock.correctionPrice, c.createdAt, { kind: 'correction', id: c.id }); });

  const discounts: DiscountCode[] = [
    { code: 'MOCK10', kind: 'percent', value: 10, scope: 'mock', expires: daysFromNow(30), maxUses: 100, used: 14, active: true },
    { code: 'WINTER1405', kind: 'amount', value: 500_000, scope: 'courses', expires: daysFromNow(40), maxUses: 200, used: 37, active: true },
    { code: 'SIBLING15', kind: 'percent', value: 15, scope: 'courses', expires: daysFromNow(200), maxUses: 999, used: 22, active: true },
    { code: 'SUMMER5', kind: 'percent', value: 5, scope: 'all', expires: daysFromNow(-60), maxUses: 300, used: 120, active: true },
  ];

  const leads: Lead[] = [
    { id: 'ld1', kind: 'corporate', name: 'مهندس سعیدی', mobile: '09181119900', company: 'شرکت صنایع غذایی زاگرس (نمونه)', message: 'برای ۲۰ نفر از کارکنان دوره انگلیسی تجاری در محل شرکت می‌خواهیم.', data: { نفرات: '۲۰', محل: 'در محل شرکت', زمان: 'صبح‌ها' }, status: 'new', createdAt: daysFromNow(0, 10), notes: [] },
    { id: 'ld2', kind: 'ttc', name: 'هستی کرمی', mobile: '09187772211', message: 'مدرک B2 دارم و می‌خواهم در دوره TTC زمستان شرکت کنم.', data: { سطح: 'B2', سابقه: 'یک سال تدریس خصوصی' }, status: 'contacted', createdAt: daysFromNow(-3), notes: [{ at: daysFromNow(-2), by: 'لیلا اکبری', text: 'تماس گرفته شد؛ برای مصاحبه سه‌شنبه هماهنگ شد.' }] },
    { id: 'ld3', kind: 'private', name: 'دکتر فرهادی', mobile: '09183334455', message: 'کلاس خصوصی آیلتس جنرال برای مهاجرت، هفته‌ای دو جلسه عصر.', data: { هدف: 'آیلتس جنرال', روزها: 'یکشنبه و سه‌شنبه' }, status: 'new', createdAt: daysFromNow(-1, 18), notes: [] },
    { id: 'ld4', kind: 'contact', name: 'علی محمدی', mobile: '09185556677', message: 'آیا برای کلاس نوجوانان تخفیف خانوادگی دارید؟', status: 'converted', createdAt: daysFromNow(-9), notes: [{ at: daysFromNow(-8), by: 'لیلا اکبری', text: 'کد SIBLING15 معرفی شد و ثبت‌نام کرد.' }] },
    { id: 'ld5', kind: 'placement', name: 'رها نیکزاد', mobile: '09182224466', message: 'تعیین سطح حضوری برای کلاس کودکان (۷ ساله).', status: 'new', createdAt: daysFromNow(0, 9), notes: [] },
    { id: 'ld6', kind: 'corporate', name: 'خانم یاری', mobile: '09188889900', company: 'بیمارستان خصوصی نمونه', message: 'دوره انگلیسی پزشکی برای کادر درمان.', status: 'lost', createdAt: daysFromNow(-30), notes: [{ at: daysFromNow(-25), by: 'حمید رستمی', text: 'بودجه سازمان تأیید نشد.' }] },
  ];

  const leaves: LeaveRequest[] = [
    { id: 'lv1', teacherId: 'te4', from: daysFromNow(7), to: daysFromNow(8), reason: 'شرکت در کارگاه آموزشی', status: 'pending', createdAt: daysFromNow(-1) },
    { id: 'lv2', teacherId: 'te1', from: daysFromNow(-20), to: daysFromNow(-20), reason: 'بیماری', status: 'approved', createdAt: daysFromNow(-21) },
  ];

  const approvals: Approval[] = [
    { id: 'ap1', kind: 'refund', title: 'بازپرداخت رزرو آزمون ماک M-' + bookings.find((b) => b.studentId === 'st18')!.code.slice(2), detail: 'زبان‌آموز ۵ روز قبل از آزمون انصراف داده است. طبق قانون، ۸۰٪ مبلغ بازگردانده می‌شود.', amount: 1_520_000, requester: 'لیلا اکبری', status: 'pending', createdAt: daysFromNow(-1, 12), ref: { kind: 'booking', id: bookings.find((b) => b.studentId === 'st18')!.id } },
    { id: 'ap2', kind: 'discount', title: 'تخفیف ۳۰٪ برای فرزند همکار', detail: 'ثبت‌نام در کلاس K4-2 برای فرزند خانم صادقی.', amount: 1_140_000, requester: 'لیلا اکبری', status: 'pending', createdAt: daysFromNow(0, 9) },
    { id: 'ap3', kind: 'transfer', title: 'انتقال از A-A2-1 به A-B1-ON1', detail: 'زبان‌آموز به دلیل تغییر ساعت کاری می‌خواهد به کلاس آنلاین منتقل شود.', requester: 'لیلا اکبری', status: 'approved', createdAt: daysFromNow(-6), decidedBy: 'حمید رستمی', decidedAt: daysFromNow(-6) },
    { id: 'ap4', kind: 'leave', title: 'مرخصی الهام فتحی', detail: 'دو روز، شرکت در کارگاه آموزشی. کلاس‌های T5-1 جبرانی برگزار می‌شوند.', requester: 'الهام فتحی', status: 'pending', createdAt: daysFromNow(-1), ref: { kind: 'leave', id: 'lv1' } },
  ];

  const notices: Notice[] = [
    { id: uid('n'), to: 'st1', title: 'آزمون ماک آنلاین امروز باز است', body: 'می‌توانید از پنل، آزمون را شروع کنید.', at: daysFromNow(0, 8), read: false, href: '/portal/mock' },
    { id: uid('n'), to: 'st1', title: 'قسط دوم شهریه IE-ADV-1', body: 'سررسید: ۱۰ روز دیگر', at: daysFromNow(-1, 10), read: false, href: '/portal/payments' },
    { id: uid('n'), to: 'st1', title: 'بازخورد تصحیح C-301 آماده است', at: daysFromNow(-9), read: true, href: '/portal/corrections' },
    { id: uid('n'), to: 'pa1', title: 'غیبت ترانه در کلاس T5-1', body: 'ترانه در جلسه اخیر غایب بود.', at: daysFromNow(-2, 18), read: false, href: '/parent' },
    { id: uid('n'), to: 'te1', title: '۳ مورد در صف تصحیح شما', at: daysFromNow(0, 7), read: false, href: '/teacher/grading' },
    { id: uid('n'), to: 'sf1', title: '۲ درخواست در انتظار تأیید', at: daysFromNow(0, 9), read: false, href: '/admin/approvals' },
    { id: uid('n'), to: 'sf1', title: 'کلاس A-B1-2 تکمیل شد', body: '۲ نفر در لیست انتظار هستند.', at: daysFromNow(-1, 11), read: true, href: '/admin/classes' },
  ];

  const audit: AuditEntry[] = [
    { id: uid('au'), at: daysFromNow(0, 9, 12), actor: 'لیلا اکبری', action: 'ثبت درخواست تخفیف ویژه', target: 'K4-2' },
    { id: uid('au'), at: daysFromNow(-1, 12, 40), actor: 'لیلا اکبری', action: 'لغو رزرو آزمون ماک', target: 'M-' },
    { id: uid('au'), at: daysFromNow(-2, 15), actor: 'سمیرا یزدانی', action: 'ثبت نمره رایتینگ', target: 'آزمون ماک آبان (۱)' },
    { id: uid('au'), at: daysFromNow(-5, 10), actor: 'حمید رستمی', action: 'باز کردن ثبت‌نام ترم', target: 'زمستان ۱۴۰۵' },
    { id: uid('au'), at: daysFromNow(-6, 11), actor: 'حمید رستمی', action: 'تأیید انتقال کلاس', target: 'A-A2-1 → A-B1-ON1' },
    { id: uid('au'), at: daysFromNow(-19, 13), actor: 'حمید رستمی', action: 'انتشار نتایج آزمون ماک', target: 'آزمون ماک مهر' },
    { id: uid('au'), at: daysFromNow(-30, 9), actor: 'بهروز کیانی', action: 'ایجاد کد تخفیف', target: 'MOCK10' },
  ];

  const resources: Resource[] = [
    { id: 'rs1', title: 'کتاب درسی بزرگسالان · سطح Elementary تا Advanced', kind: 'book', audience: 'بزرگسالان', description: 'کتاب درس و کتاب کار هر سطح؛ تحویل در آموزشگاه.', price: 680_000, stock: 42 },
    { id: 'rs2', title: 'کتاب داستان‌محور کودکان', kind: 'book', audience: 'کودکان', description: 'همراه کارت‌های واژه و فایل صوتی.', price: 420_000, stock: 18 },
    { id: 'rs3', title: 'مجموعه تمرین آیلتس KLS', kind: 'book', audience: 'آیلتس', description: 'جزوه تمرین چهار مهارت، تألیف گروه آیلتس آموزشگاه.', price: 520_000, stock: 0 },
    { id: 'rs4', title: 'فهرست ۵۷۰ واژه آکادمیک', kind: 'file', audience: 'آیلتس', description: 'فایل PDF با مثال فارسی.' },
    { id: 'rs5', title: 'نمونه مقاله‌های Task 2 با نمره ۷ به بالا', kind: 'file', audience: 'آیلتس', description: 'همراه تحلیل معیارها.' },
    { id: 'rs6', title: 'پادکست شنیداری هفتگی', kind: 'audio', audience: 'همه سطوح', description: 'هر هفته یک قسمت ۱۰ دقیقه‌ای.' },
    { id: 'rs7', title: 'ویدیوهای آموزش اسپیکینگ', kind: 'video', audience: 'آیلتس', description: 'سه بخش آزمون اسپیکینگ با نمونه پاسخ.' },
  ];

  const news: NewsItem[] = [
    { id: 'nw1', title: 'ثبت‌نام ترم زمستان ۱۴۰۵ آغاز شد', at: daysFromNow(-5), body: 'ثبت‌نام آنلاین و حضوری همه دوره‌ها باز است.' },
    { id: 'nw2', title: 'زمان‌بندی آزمون‌های ماک آذر اعلام شد', at: daysFromNow(-3), body: 'آزمون‌ها به‌صورت کامپیوتری در سایت آموزشگاه برگزار می‌شود.' },
    { id: 'nw3', title: 'دوره جدید تربیت مدرس (TTC)', at: daysFromNow(-12), body: 'متقاضیان تا پایان آذر درخواست خود را ثبت کنند.' },
  ];

  return {
    students, parents, teachers, staff, rooms, terms, holidays, classes, enrollments, attendance, homework, mockSessions, bookings, corrections, invoices, discounts,
    leads, approvals, leaves, notices, audit, resources, news, settings: structuredClone(DEFAULT_SETTINGS),
  };
}

