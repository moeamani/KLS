// Domain model for KLS School. Every entity here is documented in docs/08-data-model-api.md.
// Dates are ISO strings; money is in toman (integer).

export type Panel = 'student' | 'parent' | 'teacher' | 'admin';
export type StaffRole = 'manager' | 'reception' | 'finance';

export interface Session { panel: Panel; userId: string }

// ---------- people ----------
export interface Student {
  id: string;
  name: string;
  mobile: string;
  nationalId?: string;
  birthYear: number; // Persian year
  parentId?: string;
  levelId?: string; // current placement
  email?: string;
  createdAt: string;
  source: 'online' | 'reception';
  note?: string;
}

export interface Parent { id: string; name: string; mobile: string; childIds: string[] }

export type TeacherSkill = 'kids' | 'general' | 'ielts' | 'examiner' | 'ttc';
export interface Teacher {
  id: string;
  name: string;
  mobile: string;
  nationalId: string;
  skills: TeacherSkill[];
  ratePerSession: number;
  status: 'active' | 'inactive';
  bio?: string;
}

export interface Staff {
  id: string;
  name: string;
  mobile: string;
  nationalId: string;
  role: StaffRole;
  status: 'active' | 'invited' | 'disabled';
  lastActiveAt?: string;
}

// ---------- catalog ----------
export type CourseCategory = 'kids' | 'teens' | 'adults' | 'private' | 'ielts' | 'ielts_skills' | 'ttc' | 'corporate';
export interface Level { id: string; title: string; cefr?: string; order: number }
export interface Course {
  id: string;
  category: CourseCategory;
  title: string;
  levels: Level[];
  sessions: number;
  minutes: number;
  price: number; // per term (group) or per session (private)
  priceUnit: 'term' | 'session';
  ageHint?: string;
  needsPlacement: boolean;
}

export interface Term {
  id: string;
  title: string;
  start: string;
  end: string;
  regOpen: string;
  regClose: string;
}

export interface Holiday { date: string; title: string }

export interface Room { id: string; name: string; capacity: number }

export type ClassFormat = 'in_person' | 'online' | 'private' | 'semi_private';
/** 0 = Saturday … 6 = Friday (Persian week). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ClassGroup {
  id: string;
  code: string;
  termId: string;
  courseId: string;
  levelId: string;
  teacherId: string;
  roomId?: string;
  onlineUrl?: string;
  format: ClassFormat;
  days: Weekday[];
  start: string; // HH:MM
  minutes: number;
  capacity: number;
  price: number;
  sessions: number;
  cancelled?: boolean;
}

export interface TimelineEvent { id: string; at: string; title: string; detail?: string; by?: string; tone?: 'default' | 'success' | 'warning' | 'danger' }

export type EnrollmentStatus = 'held' | 'confirmed' | 'waitlisted' | 'cancelled' | 'transferred' | 'completed';
export interface GradeSheet {
  activity: number | null;
  homework: number | null;
  midterm: number | null;
  final: number | null;
  comment: string;
  status: 'draft' | 'submitted' | 'released';
  updatedAt?: string;
}
export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  status: EnrollmentStatus;
  heldUntil?: string;
  invoiceId?: string;
  createdAt: string;
  by: 'student' | 'parent' | 'reception';
  grade?: GradeSheet;
  events: TimelineEvent[];
}

export type Mark = 'present' | 'absent' | 'late' | 'excused';
export interface AttendanceSheet { id: string; classId: string; session: number; date: string; marks: Record<string, Mark>; by: string; at: string }

export interface Homework { id: string; classId: string; title: string; due: string; detail: string }

// ---------- IELTS mock ----------
export type MockModule = 'academic' | 'general';
export type MockDelivery = 'center' | 'online';
export type QuestionType = 'gap' | 'mcq' | 'tfng' | 'ynng' | 'match';

export interface Question {
  id: string;
  n: number;
  type: QuestionType;
  prompt: string;
  options?: string[];
  /** Accepted answers, compared case-insensitively after trimming. For mcq/match: the option letter. */
  answer: string[];
}

export interface QuestionGroup { instructions: string; questions: Question[]; matchOptions?: string[] }

export interface ListeningPart { id: string; title: string; context: string; script: string; groups: QuestionGroup[] }
export interface Passage { id: string; title: string; text: string; groups: QuestionGroup[] }

export interface ChartSpec { kind: 'bar' | 'line'; title: string; unit: string; categories: string[]; series: { name: string; values: number[] }[] }

export interface MockTest {
  id: string;
  title: string;
  module: MockModule;
  status: 'published' | 'draft' | 'retired';
  listening: ListeningPart[];
  reading: Passage[];
  writing: { t1: { prompt: string; chart?: ChartSpec; letter?: boolean }; t2: { prompt: string } };
  speaking: { p1: string[]; p2: { topic: string; bullets: string[]; closing: string }; p3: string[] };
  updatedAt: string;
}

export interface SpeakingSlot { id: string; at: string; examinerId: string; bookingId?: string }

export interface MockSession {
  id: string;
  title: string;
  at: string; // start of the written test
  modules: MockModule[];
  deliveries: MockDelivery[];
  testIds: Partial<Record<MockModule, string>>;
  capacity: number;
  price: number;
  regClose: string;
  slots: SpeakingSlot[];
  cancelled?: boolean;
  note?: string;
}

export type BookingStatus = 'held' | 'confirmed' | 'in_progress' | 'awaiting_grading' | 'graded' | 'released' | 'cancelled' | 'no_show';

export type WritingCriterion = 'ta' | 'cc' | 'lr' | 'gra';
export type SpeakingCriterion = 'fc' | 'lr' | 'gra' | 'p';

export interface WritingGrade {
  t1: Record<WritingCriterion, number>;
  t2: Record<WritingCriterion, number>;
  comments: { t1: string; t2: string; overall: string };
  examinerId: string;
  at: string;
}
export interface SpeakingGrade { scores: Record<SpeakingCriterion, number>; comment: string; examinerId: string; at: string }

export interface ExamLog { type: string; detail?: string; at: string }

export interface MockAttempt {
  answers: Record<string, string>;
  writing: { t1: string; t2: string };
  startedAt: string;
  submittedAt?: string;
  log: ExamLog[];
  endReason?: 'completed' | 'timeout' | 'connection';
}

export interface Remark {
  skill: 'writing' | 'speaking';
  reason: string;
  status: 'requested' | 'approved' | 'rejected' | 'done';
  at: string;
  before?: number;
  after?: number;
  examinerId?: string;
}

export interface MockBooking {
  id: string;
  code: string;
  studentId: string;
  sessionId: string;
  module: MockModule;
  delivery: MockDelivery;
  slotId?: string;
  status: BookingStatus;
  heldUntil?: string;
  invoiceId?: string;
  createdAt: string;
  attempt?: MockAttempt;
  writingExaminerId?: string;
  writing?: WritingGrade;
  speaking?: SpeakingGrade;
  speakingNoShow?: boolean;
  releasedAt?: string;
  remark?: Remark;
  events: TimelineEvent[];
}

export type CorrectionTask = 't1_academic' | 't1_general' | 't2';
export interface Correction {
  id: string;
  code: string;
  studentId: string;
  task: CorrectionTask;
  prompt: string;
  text: string;
  status: 'held' | 'submitted' | 'in_review' | 'returned';
  invoiceId?: string;
  examinerId?: string;
  grade?: { scores: Record<WritingCriterion, number>; comment: string; at: string };
  createdAt: string;
  returnedAt?: string;
  express: boolean;
  events: TimelineEvent[];
}

// ---------- finance ----------
export type PaymentMethod = 'online' | 'pos' | 'cash' | 'transfer';
export interface Installment { id: string; due: string; amount: number }
export interface Payment { id: string; amount: number; at: string; method: PaymentMethod; ref: string; by?: string }
export interface Invoice {
  id: string;
  code: string;
  studentId: string;
  title: string;
  items: { label: string; amount: number }[];
  discount?: { code: string; amount: number };
  total: number;
  installments: Installment[];
  payments: Payment[];
  status: 'open' | 'cancelled' | 'refunded';
  createdAt: string;
  ref: { kind: 'enrollment' | 'mock' | 'correction' | 'book' | 'remark' | 'other'; id?: string };
}

export interface DiscountCode {
  code: string;
  kind: 'percent' | 'amount';
  value: number;
  scope: 'all' | 'mock' | 'courses' | 'correction';
  expires: string;
  maxUses: number;
  used: number;
  active: boolean;
}

// ---------- operations (staff features) ----------
export type LeadKind = 'contact' | 'corporate' | 'ttc' | 'private' | 'placement';
export interface Lead {
  id: string;
  kind: LeadKind;
  name: string;
  mobile: string;
  company?: string;
  message: string;
  data?: Record<string, string>;
  status: 'new' | 'contacted' | 'converted' | 'lost';
  createdAt: string;
  notes: { at: string; by: string; text: string }[];
}

export type ApprovalKind = 'refund' | 'discount' | 'transfer' | 'leave' | 'remark';
export interface Approval {
  id: string;
  kind: ApprovalKind;
  title: string;
  detail: string;
  amount?: number;
  requester: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  decidedBy?: string;
  decidedAt?: string;
  note?: string;
  ref?: { kind: string; id: string };
}

export interface LeaveRequest { id: string; teacherId: string; from: string; to: string; reason: string; status: 'pending' | 'approved' | 'rejected'; createdAt: string }

export interface Notice { id: string; to: string; title: string; body?: string; at: string; read: boolean; href?: string }
export interface AuditEntry { id: string; at: string; actor: string; action: string; target?: string }

export interface Resource { id: string; title: string; kind: 'book' | 'file' | 'audio' | 'video'; audience: string; description: string; price?: number; stock?: number }

export interface NewsItem { id: string; title: string; at: string; body: string }

export interface Settings {
  seatHoldMin: number;
  mock: {
    listeningMin: number;
    readingMin: number;
    writingMin: number;
    graceMin: number;
    timerOnDisconnect: 'run' | 'pause';
    singleSession: boolean;
    maxResumes: number;
    instantLR: boolean;
    autoRelease: boolean;
    cancelHours: number;
    refundPercent: number;
    remarkFee: number;
    correctionPrice: number;
    correctionExpressPrice: number;
  };
  grades: { activity: number; homework: number; midterm: number; final: number; pass: number };
  installmentMin: number;
  absenceAlert: number;
}
