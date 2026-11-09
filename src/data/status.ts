import type { BookingStatus, ClassGroup, Correction, Enrollment, EnrollmentStatus, Invoice, MockBooking, Term } from '@/types';

export type Tone = 'default' | 'accent' | 'success' | 'warning' | 'danger';
interface Meta { label: string; tone: Tone; student?: string }

// One vocabulary per entity, shared by every panel (docs/07-states.md).
//   gray  → waiting on the student / nothing to do
//   blue  → in progress
//   amber → someone at the school has to act
//   green / red → final

export type EffectiveBooking = BookingStatus | 'expired';
export const BOOKING_META: Record<EffectiveBooking, Meta> = {
  held: { label: 'در انتظار پرداخت', tone: 'default', student: 'در انتظار پرداخت' },
  expired: { label: 'منقضی (پرداخت نشد)', tone: 'default', student: 'مهلت پرداخت تمام شد' },
  confirmed: { label: 'قطعی', tone: 'accent', student: 'رزرو قطعی' },
  in_progress: { label: 'در حال آزمون', tone: 'accent', student: 'آزمون نیمه‌تمام' },
  awaiting_grading: { label: 'در انتظار تصحیح', tone: 'warning', student: 'در حال تصحیح' },
  graded: { label: 'آماده انتشار', tone: 'warning', student: 'در حال تصحیح' },
  released: { label: 'نتیجه منتشر شد', tone: 'success', student: 'نتیجه آماده است' },
  cancelled: { label: 'لغو شده', tone: 'default', student: 'لغو شده' },
  no_show: { label: 'غایب', tone: 'danger', student: 'غیبت در آزمون' },
};
export const bookingStatus = (b: Pick<MockBooking, 'status' | 'heldUntil'>): EffectiveBooking =>
  b.status === 'held' && b.heldUntil && new Date(b.heldUntil).getTime() < Date.now() ? 'expired' : b.status;
/** Seats a booking takes: confirmed and live holds. */
export const bookingTakesSeat = (b: MockBooking) => !['cancelled', 'expired', 'no_show'].includes(bookingStatus(b));

export type EffectiveEnrollment = EnrollmentStatus | 'expired';
export const ENROLLMENT_META: Record<EffectiveEnrollment, Meta> = {
  held: { label: 'در انتظار پرداخت', tone: 'default' },
  expired: { label: 'منقضی (پرداخت نشد)', tone: 'default' },
  confirmed: { label: 'ثبت‌نام قطعی', tone: 'accent' },
  waitlisted: { label: 'در لیست انتظار', tone: 'warning' },
  cancelled: { label: 'انصراف', tone: 'default' },
  transferred: { label: 'منتقل شد', tone: 'default' },
  completed: { label: 'پایان دوره', tone: 'success' },
};
export const enrollmentStatus = (e: Pick<Enrollment, 'status' | 'heldUntil'>): EffectiveEnrollment =>
  e.status === 'held' && e.heldUntil && new Date(e.heldUntil).getTime() < Date.now() ? 'expired' : e.status;
export const enrollmentTakesSeat = (e: Enrollment) => ['held', 'confirmed', 'completed'].includes(enrollmentStatus(e));

export type ClassState = 'upcoming' | 'open' | 'full' | 'running' | 'finished' | 'cancelled';
export const CLASS_META: Record<ClassState, Meta> = {
  upcoming: { label: 'ثبت‌نام بسته', tone: 'default' },
  open: { label: 'در حال ثبت‌نام', tone: 'accent' },
  full: { label: 'تکمیل ظرفیت', tone: 'warning' },
  running: { label: 'در حال برگزاری', tone: 'success' },
  finished: { label: 'پایان‌یافته', tone: 'default' },
  cancelled: { label: 'لغو شده', tone: 'danger' },
};
export const classState = (cls: ClassGroup, term: Term | undefined, seatsTaken: number): ClassState => {
  if (cls.cancelled) return 'cancelled';
  if (!term) return 'upcoming';
  const now = Date.now();
  if (now > new Date(term.end).getTime()) return 'finished';
  const regOpen = now >= new Date(term.regOpen).getTime() && now <= new Date(term.regClose).getTime();
  if (now >= new Date(term.start).getTime() && !regOpen) return 'running';
  if (regOpen) return seatsTaken >= cls.capacity ? 'full' : 'open';
  return now >= new Date(term.start).getTime() ? 'running' : 'upcoming';
};

export type TermState = 'upcoming' | 'registration' | 'running' | 'finished';
export const TERM_META: Record<TermState, Meta> = {
  upcoming: { label: 'آینده', tone: 'default' },
  registration: { label: 'ثبت‌نام باز', tone: 'accent' },
  running: { label: 'در حال برگزاری', tone: 'success' },
  finished: { label: 'پایان‌یافته', tone: 'default' },
};
export const termState = (term: Term): TermState => {
  const now = Date.now();
  if (now > new Date(term.end).getTime()) return 'finished';
  if (now >= new Date(term.regOpen).getTime() && now <= new Date(term.regClose).getTime()) return 'registration';
  if (now >= new Date(term.start).getTime()) return 'running';
  return 'upcoming';
};

export type InvoiceState = 'paid' | 'partial' | 'unpaid' | 'overdue' | 'cancelled' | 'refunded';
export const INVOICE_META: Record<InvoiceState, Meta> = {
  paid: { label: 'تسویه', tone: 'success' },
  partial: { label: 'پرداخت جزئی', tone: 'accent' },
  unpaid: { label: 'پرداخت‌نشده', tone: 'default' },
  overdue: { label: 'سررسید گذشته', tone: 'danger' },
  cancelled: { label: 'باطل', tone: 'default' },
  refunded: { label: 'بازپرداخت شد', tone: 'default' },
};
export const paidOf = (inv: Invoice) => inv.payments.reduce((sum, p) => sum + p.amount, 0);
export const balanceOf = (inv: Invoice) => Math.max(0, inv.total - paidOf(inv));
/** Installments not yet covered by payments, in due order. */
export const dueInstallments = (inv: Invoice) => {
  let covered = paidOf(inv);
  return inv.installments.filter((inst) => {
    if (covered >= inst.amount) { covered -= inst.amount; return false; }
    covered = 0;
    return true;
  });
};
export const invoiceState = (inv: Invoice): InvoiceState => {
  if (inv.status === 'cancelled') return 'cancelled';
  if (inv.status === 'refunded') return 'refunded';
  const paid = paidOf(inv);
  if (paid >= inv.total) return 'paid';
  const next = dueInstallments(inv)[0];
  if (next && new Date(next.due).getTime() < Date.now()) return 'overdue';
  return paid > 0 ? 'partial' : 'unpaid';
};

export const CORRECTION_META: Record<Correction['status'], Meta> = {
  held: { label: 'در انتظار پرداخت', tone: 'default' },
  submitted: { label: 'در صف تصحیح', tone: 'warning' },
  in_review: { label: 'در حال تصحیح', tone: 'accent' },
  returned: { label: 'بازخورد آماده است', tone: 'success' },
};

export const LEAD_META = {
  new: { label: 'جدید', tone: 'warning' },
  contacted: { label: 'تماس گرفته شد', tone: 'accent' },
  converted: { label: 'ثبت‌نام شد', tone: 'success' },
  lost: { label: 'منصرف شد', tone: 'default' },
} as const satisfies Record<string, Meta>;
export const LEAD_KIND = { contact: 'تماس با ما', corporate: 'دوره سازمانی', ttc: 'درخواست TTC', private: 'کلاس خصوصی', placement: 'تعیین سطح حضوری' } as const;

export const APPROVAL_META = {
  pending: { label: 'در انتظار', tone: 'warning' },
  approved: { label: 'تأیید شد', tone: 'success' },
  rejected: { label: 'رد شد', tone: 'danger' },
} as const satisfies Record<string, Meta>;
export const APPROVAL_KIND = { refund: 'بازپرداخت', discount: 'تخفیف ویژه', transfer: 'انتقال کلاس', leave: 'مرخصی استاد', remark: 'بازبینی نمره' } as const;

export const MARK_META = {
  present: { label: 'حاضر', short: 'ح', tone: 'success' },
  late: { label: 'تأخیر', short: 'ت', tone: 'warning' },
  absent: { label: 'غایب', short: 'غ', tone: 'danger' },
  excused: { label: 'غیبت موجه', short: 'م', tone: 'default' },
} as const;

export const PANEL_LABEL = { student: 'پنل زبان‌آموز', parent: 'پنل والدین', teacher: 'پنل استاد', admin: 'پنل مدیریت' } as const;
export const STAFF_ROLE_LABEL = { manager: 'مدیر آموزشگاه', reception: 'پذیرش و آموزش', finance: 'امور مالی' } as const;
export const MODULE_LABEL = { academic: 'آکادمیک', general: 'جنرال' } as const;
export const DELIVERY_LABEL = { center: 'در آموزشگاه (کامپیوتری)', online: 'آنلاین از خانه' } as const;
export const METHOD_LABEL = { online: 'درگاه آنلاین', pos: 'کارت‌خوان', cash: 'نقدی', transfer: 'کارت به کارت' } as const;
export const TASK_LABEL = { t1_academic: 'Task 1 آکادمیک (نمودار)', t1_general: 'Task 1 جنرال (نامه)', t2: 'Task 2 (مقاله)' } as const;
