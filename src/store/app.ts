import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { courseById } from '@/data/catalog';
import { createSeed, uid, type SeedData } from '@/data/seed';
import { balanceOf, bookingStatus, bookingTakesSeat, classState, dueInstallments, enrollmentStatus, enrollmentTakesSeat } from '@/data/status';
import { addDays, addMinutes, iso } from '@/lib/dates';
import { faNumber, toman } from '@/lib/format';
import { speakingBand, writingBand } from '@/lib/ielts';
import { overlaps } from '@/lib/schedule';
import type {
  Approval, ClassGroup, Correction, CorrectionTask, DiscountCode, Enrollment, GradeSheet, Invoice, Lead, Mark, MockAttempt, MockBooking, MockDelivery, MockModule, MockSession,
  Panel, PaymentMethod, Session, Settings, SpeakingGrade, Staff, Student, Term, TimelineEvent, WritingGrade, WritingCriterion,
} from '@/types';

export const MOCK_SESSION_KEY = 'kls.mockExam';
const STORE_VERSION = 5;

export type Result<T = string> = { ok: true; id: T } | { ok: false; error: string; code?: 'full' | 'closed' | 'conflict' | 'duplicate' | 'expired' };

const now = () => iso(new Date());
const event = (title: string, detail?: string, by?: string, tone?: TimelineEvent['tone']): TimelineEvent => ({ id: uid('ev'), at: now(), title, detail, by, tone });

interface AppState extends SeedData {
  session: Session | null;

  login: (panel: Panel, userId: string) => void;
  logout: () => void;
  resetAll: () => void;
  sweep: () => void;
  registerStudent: (input: { name: string; mobile: string; birthYear: number; parentName?: string; parentMobile?: string }) => string;
  updateStudent: (id: string, patch: Partial<Student>) => void;
  markRead: (to: string) => void;

  // enrollment
  holdEnrollment: (studentId: string, classId: string, by: Enrollment['by']) => Result;
  joinWaitlist: (studentId: string, classId: string, by: Enrollment['by']) => Result;
  cancelEnrollment: (id: string, reason: string, by: string) => void;
  transferEnrollment: (id: string, toClassId: string, by: string) => Result;

  // payments
  payInvoice: (invoiceId: string, amount: number, method: PaymentMethod, by?: string) => Result;
  applyDiscount: (invoiceId: string, code: string) => Result<number>;
  setInstallments: (invoiceId: string, parts: 1 | 2) => void;

  // teaching
  saveAttendance: (classId: string, session: number, date: string, marks: Record<string, Mark>, by: string) => void;
  saveGrade: (enrollmentId: string, patch: Partial<GradeSheet>) => void;
  submitGrades: (classId: string, by: string) => void;
  releaseGrades: (classId: string, by: string) => void;
  addHomework: (classId: string, title: string, due: string, detail: string) => void;
  requestLeave: (teacherId: string, from: string, to: string, reason: string) => void;

  // IELTS mock
  holdBooking: (studentId: string, sessionId: string, module: MockModule, delivery: MockDelivery) => Result;
  /** Instant online mock: a one-seat session that opens now, plus a held booking for it. */
  holdOnDemand: (studentId: string, module: MockModule) => Result;
  /** Prototype only: an instant mock that is already paid, so the exam can be tried at once. */
  demoMock: (studentId: string, module: MockModule) => string;
  chooseSlot: (bookingId: string, slotId: string) => void;
  cancelBooking: (bookingId: string, reason: string, by: string) => void;
  startAttempt: (bookingId: string) => void;
  submitAttempt: (bookingId: string, attempt: MockAttempt) => void;
  markNoShow: (bookingId: string, by: string) => void;
  assignWriting: (bookingId: string, teacherId: string, by: string) => void;
  saveWritingGrade: (bookingId: string, grade: WritingGrade) => void;
  saveSpeakingGrade: (bookingId: string, grade: SpeakingGrade) => void;
  speakingNoShow: (bookingId: string, by: string) => void;
  releaseResults: (bookingIds: string[], by: string) => void;
  requestRemark: (bookingId: string, skill: 'writing' | 'speaking', reason: string) => void;
  saveMockSession: (input: Omit<MockSession, 'id' | 'slots'> & { id?: string; slotCount: number; examiners: string[] }, by: string) => string;
  cancelMockSession: (id: string, reason: string, by: string) => void;

  // correction service
  holdCorrection: (input: { studentId: string; task: CorrectionTask; prompt: string; text: string; express: boolean }) => string;
  claimCorrection: (id: string, teacherId: string) => void;
  returnCorrection: (id: string, scores: Record<WritingCriterion, number>, comment: string) => void;

  // admin
  saveClass: (input: Omit<ClassGroup, 'id' | 'code'> & { id?: string; code?: string }, by: string) => string;
  cancelClass: (id: string, reason: string, by: string) => void;
  saveTerm: (input: Omit<Term, 'id'> & { id?: string }, by: string) => void;
  decideApproval: (id: string, decision: 'approved' | 'rejected', note: string, by: string) => void;
  addLead: (input: Omit<Lead, 'id' | 'status' | 'createdAt' | 'notes'>) => void;
  updateLead: (id: string, patch: Partial<Pick<Lead, 'status'>>, note?: { by: string; text: string }) => void;
  saveDiscount: (code: DiscountCode, by: string) => void;
  saveStaff: (input: Omit<Staff, 'id' | 'status'> & { id?: string; status?: Staff['status'] }, by: string) => void;
  buyBook: (studentId: string, resourceId: string) => string;
  updateSettings: (patch: Partial<Settings>, by: string) => void;
  log: (actor: string, action: string, target?: string) => void;
}

type ListKey = { [K in keyof SeedData]: SeedData[K] extends unknown[] ? K : never }[keyof SeedData];

const nameOf = (state: SeedData, id?: string) =>
  !id ? '' : state.students.find((p) => p.id === id)?.name ?? state.teachers.find((p) => p.id === id)?.name ?? state.staff.find((p) => p.id === id)?.name ?? state.parents.find((p) => p.id === id)?.name ?? id;

export const useApp = create<AppState>()(
  persist(
    (set, get) => {
      const notify = (to: string | undefined, title: string, body?: string, href?: string) => {
        if (!to) return;
        set((s) => ({ notices: [{ id: uid('n'), to, title, body, href, at: now(), read: false }, ...s.notices] }));
      };
      const log = (actor: string, action: string, target?: string) => set((s) => ({ audit: [{ id: uid('au'), at: now(), actor, action, target }, ...s.audit] }));
      const patcher = <T extends { id: string }>(key: ListKey) => (id: string, fn: (item: T) => T) =>
        set((s) => ({ [key]: (s[key] as unknown as T[]).map((item) => (item.id === id ? fn(item) : item)) }) as Partial<AppState>);
      const up = {
        students: patcher<Student>('students'), enrollments: patcher<Enrollment>('enrollments'), invoices: patcher<Invoice>('invoices'), attendance: patcher<SeedData['attendance'][number]>('attendance'),
        bookings: patcher<MockBooking>('bookings'), corrections: patcher<Correction>('corrections'), resources: patcher<SeedData['resources'][number]>('resources'),
        approvals: patcher<Approval>('approvals'), leaves: patcher<SeedData['leaves'][number]>('leaves'), leads: patcher<Lead>('leads'), staff: patcher<Staff>('staff'),
      };

      let invoiceSeq = 2000;
      const createInvoice = (studentId: string, title: string, amount: number, ref: Invoice['ref']) => {
        const id = uid('inv');
        const code = `KLS-${invoiceSeq++}`;
        set((s) => ({
          invoices: [{ id, code, studentId, title, items: [{ label: title, amount }], total: amount, installments: [{ id: uid('ins'), due: now(), amount }], payments: [], status: 'open', createdAt: now(), ref }, ...s.invoices],
        }));
        return id;
      };
      const refund = (invoiceId: string | undefined, percent: number, by: string) => {
        if (!invoiceId) return;
        up.invoices(invoiceId, (inv) => {
          const paid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
          if (paid <= 0) return { ...inv, status: 'cancelled' };
          const amount = Math.round((paid * percent) / 100);
          return { ...inv, status: 'refunded', payments: [...inv.payments, { id: uid('pay'), amount: -amount, at: now(), method: 'transfer', ref: `RF${Date.now().toString().slice(-6)}`, by }] };
        });
      };
      const parentOf = (studentId: string) => get().students.find((s) => s.id === studentId)?.parentId;

      const seatsTaken = (classId: string) => get().enrollments.filter((e) => e.classId === classId && enrollmentTakesSeat(e)).length;

      const recomputeBooking = (b: MockBooking): MockBooking => {
        if (b.status !== 'awaiting_grading' && b.status !== 'graded') return b;
        const done = Boolean(b.writing) && (Boolean(b.speaking) || Boolean(b.speakingNoShow));
        if (!done) return { ...b, status: 'awaiting_grading' };
        if (get().settings.mock.autoRelease) return { ...b, status: 'released', releasedAt: now(), events: [...b.events, event('نتیجه خودکار منتشر شد', undefined, undefined, 'success')] };
        return { ...b, status: 'graded', events: b.status === 'graded' ? b.events : [...b.events, event('تصحیح کامل شد', 'در انتظار انتشار نتیجه')] };
      };

      return {
        ...createSeed(),
        session: null,

        login: (panel, userId) => {
          set((s) => ({ session: { panel, userId }, staff: panel === 'admin' ? s.staff.map((u) => (u.id === userId ? { ...u, status: u.status === 'invited' ? 'active' : u.status, lastActiveAt: now() } : u)) : s.staff }));
          get().sweep();
        },
        logout: () => set({ session: null }),
        resetAll: () => {
          try { localStorage.removeItem(MOCK_SESSION_KEY); } catch { /* storage unavailable */ }
          set({ ...createSeed() });
        },
        // Unpaid holds whose time ran out free their seat (derived) and their invoice is voided.
        sweep: () =>
          set((s) => {
            const expired = new Set<string>();
            s.enrollments.forEach((e) => enrollmentStatus(e) === 'expired' && e.invoiceId && expired.add(e.invoiceId));
            s.bookings.forEach((b) => bookingStatus(b) === 'expired' && b.invoiceId && expired.add(b.invoiceId));
            s.corrections.forEach((c) => c.status === 'held' && new Date(c.createdAt).getTime() < Date.now() - 86_400_000 && c.invoiceId && expired.add(c.invoiceId));
            if (!expired.size) return {};
            return { invoices: s.invoices.map((inv) => (expired.has(inv.id) && inv.status === 'open' && inv.payments.length === 0 ? { ...inv, status: 'cancelled' } : inv)) };
          }),
        registerStudent: ({ name, mobile, birthYear, parentName, parentMobile }) => {
          const id = uid('st');
          let parentId: string | undefined;
          if (parentMobile) {
            const existing = get().parents.find((p) => p.mobile === parentMobile);
            parentId = existing?.id ?? uid('pa');
            if (existing) set((s) => ({ parents: s.parents.map((p) => (p.id === existing.id ? { ...p, childIds: [...p.childIds, id] } : p)) }));
            else set((s) => ({ parents: [...s.parents, { id: parentId!, name: parentName || 'ولی زبان‌آموز', mobile: parentMobile, childIds: [id] }] }));
          }
          set((s) => ({ students: [...s.students, { id, name, mobile, birthYear, parentId, createdAt: now(), source: 'online' }] }));
          log(name, 'ثبت‌نام در سایت');
          return id;
        },
        updateStudent: (id, p) => up.students(id, (s) => ({ ...s, ...p })),
        markRead: (to) => set((s) => ({ notices: s.notices.map((n) => (n.to === to ? { ...n, read: true } : n)) })),

        // ---------- enrollment ----------
        holdEnrollment: (studentId, classId, by) => {
          const s = get();
          const cls = s.classes.find((c) => c.id === classId);
          const term = s.terms.find((t) => t.id === cls?.termId);
          if (!cls || !term) return { ok: false, error: 'کلاس پیدا نشد.' };
          const state = classState(cls, term, seatsTaken(classId));
          if (state === 'cancelled') return { ok: false, error: 'این کلاس لغو شده است.', code: 'closed' };
          if (state !== 'open' && state !== 'full') return { ok: false, error: 'ثبت‌نام این کلاس بسته است.', code: 'closed' };
          const mine = s.enrollments.filter((e) => e.studentId === studentId && ['held', 'confirmed', 'waitlisted'].includes(enrollmentStatus(e)));
          if (mine.some((e) => e.classId === classId)) return { ok: false, error: 'در این کلاس ثبت‌نام کرده‌اید یا در لیست انتظار آن هستید.', code: 'duplicate' };
          const clash = mine.map((e) => s.classes.find((c) => c.id === e.classId)!).find((c) => c && c.termId === cls.termId && overlaps(c, cls));
          if (clash) return { ok: false, error: `ساعت این کلاس با کلاس ${clash.code} شما تداخل دارد.`, code: 'conflict' };
          if (state === 'full') return { ok: false, error: 'ظرفیت این کلاس تکمیل شده است.', code: 'full' };
          const id = uid('en');
          const invoiceId = createInvoice(studentId, `شهریه ${cls.code} · ${term.title}`, cls.price, { kind: 'enrollment', id });
          set((st) => ({
            enrollments: [...st.enrollments, { id, studentId, classId, status: 'held', heldUntil: iso(addMinutes(new Date(), st.settings.seatHoldMin)), invoiceId, createdAt: now(), by, events: [event('صندلی رزرو شد', `تا ${faNumber(st.settings.seatHoldMin)} دقیقه برای پرداخت`)] }],
          }));
          return { ok: true, id };
        },
        joinWaitlist: (studentId, classId, by) => {
          const s = get();
          if (s.enrollments.some((e) => e.studentId === studentId && e.classId === classId && ['held', 'confirmed', 'waitlisted'].includes(enrollmentStatus(e)))) return { ok: false, error: 'قبلاً در این کلاس ثبت شده‌اید.', code: 'duplicate' };
          const id = uid('en');
          set((st) => ({ enrollments: [...st.enrollments, { id, studentId, classId, status: 'waitlisted', createdAt: now(), by, events: [event('به لیست انتظار اضافه شد')] }] }));
          notify(studentId, 'به لیست انتظار اضافه شدید', 'اگر صندلی آزاد شود پیامک می‌گیرید.');
          return { ok: true, id };
        },
        cancelEnrollment: (id, reason, by) => {
          const e = get().enrollments.find((x) => x.id === id);
          if (!e) return;
          up.enrollments(id, (x) => ({ ...x, status: 'cancelled', events: [...x.events, event('انصراف ثبت شد', reason, nameOf(get(), by), 'danger')] }));
          if (enrollmentStatus(e) === 'held') up.invoices(e.invoiceId!, (inv) => ({ ...inv, status: 'cancelled' }));
          log(nameOf(get(), by), 'ثبت انصراف', get().classes.find((c) => c.id === e.classId)?.code);
          // A freed seat is offered to the first person on the waitlist for 24 hours.
          if (e.status === 'confirmed' || e.status === 'held') {
            const next = get().enrollments.filter((x) => x.classId === e.classId && x.status === 'waitlisted').sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
            if (next) {
              const cls = get().classes.find((c) => c.id === e.classId)!;
              const invoiceId = createInvoice(next.studentId, `شهریه ${cls.code}`, cls.price, { kind: 'enrollment', id: next.id });
              up.enrollments(next.id, (x) => ({ ...x, status: 'held', invoiceId, heldUntil: iso(addDays(new Date(), 1)), events: [...x.events, event('صندلی آزاد شد و پیشنهاد شد', 'تا ۲۴ ساعت برای پرداخت', undefined, 'success')] }));
              notify(next.studentId, `صندلی کلاس ${cls.code} برای شما آزاد شد`, 'تا ۲۴ ساعت فرصت پرداخت دارید.', '/portal/payments');
            }
          }
        },
        transferEnrollment: (id, toClassId, by) => {
          const s = get();
          const e = s.enrollments.find((x) => x.id === id);
          const to = s.classes.find((c) => c.id === toClassId);
          if (!e || !to) return { ok: false, error: 'کلاس مقصد پیدا نشد.' };
          if (seatsTaken(toClassId) >= to.capacity) return { ok: false, error: 'کلاس مقصد ظرفیت خالی ندارد.', code: 'full' };
          const newId = uid('en');
          const from = s.classes.find((c) => c.id === e.classId)!;
          set((st) => ({
            enrollments: [
              ...st.enrollments.map((x) => (x.id === id ? { ...x, status: 'transferred' as const, events: [...x.events, event(`منتقل شد به ${to.code}`, undefined, nameOf(st, by))] } : x)),
              { id: newId, studentId: e.studentId, classId: toClassId, status: 'confirmed', invoiceId: e.invoiceId, createdAt: now(), by: 'reception', grade: e.grade, events: [event(`منتقل‌شده از ${from.code}`, undefined, nameOf(st, by))] },
            ],
          }));
          log(nameOf(get(), by), 'انتقال کلاس', `${from.code} ← ${to.code}`);
          notify(e.studentId, `کلاس شما به ${to.code} منتقل شد`);
          return { ok: true, id: newId };
        },

        // ---------- payments ----------
        payInvoice: (invoiceId, amount, method, by) => {
          const s = get();
          const inv = s.invoices.find((i) => i.id === invoiceId);
          if (!inv) return { ok: false, error: 'فاکتور پیدا نشد.' };
          if (inv.status !== 'open') return { ok: false, error: 'این فاکتور باطل شده است.' };
          const refEnrollment = inv.ref.kind === 'enrollment' ? s.enrollments.find((e) => e.id === inv.ref.id) : undefined;
          const refBooking = inv.ref.kind === 'mock' ? s.bookings.find((b) => b.id === inv.ref.id) : undefined;
          if ((refEnrollment && enrollmentStatus(refEnrollment) === 'expired') || (refBooking && bookingStatus(refBooking) === 'expired')) return { ok: false, error: 'مهلت پرداخت این رزرو تمام شده است. دوباره رزرو کنید.', code: 'expired' };
          const pay = Math.min(amount, balanceOf(inv));
          up.invoices(invoiceId, (i) => ({ ...i, payments: [...i.payments, { id: uid('pay'), amount: pay, at: now(), method, ref: method === 'online' ? `TRX${Date.now().toString().slice(-7)}` : `${method.toUpperCase()}${Date.now().toString().slice(-5)}`, by }] }));
          if (by) log(by, 'ثبت پرداخت', `${inv.code} · ${toman(pay)}`);
          // side effects of a first payment
          if (refEnrollment?.status === 'held') {
            up.enrollments(refEnrollment.id, (e) => ({ ...e, status: 'confirmed', heldUntil: undefined, events: [...e.events, event('پرداخت تأیید شد · ثبت‌نام قطعی', undefined, undefined, 'success')] }));
            const cls = s.classes.find((c) => c.id === refEnrollment.classId);
            notify(refEnrollment.studentId, `ثبت‌نام ${cls?.code} قطعی شد`, 'برنامه کلاس در پنل شما آمده است.', '/portal/classes');
            notify(parentOf(refEnrollment.studentId), `ثبت‌نام ${cls?.code} قطعی شد`);
          }
          if (refBooking?.status === 'held') {
            const session = s.mockSessions.find((m) => m.id === refBooking.sessionId)!;
            const slot = session.slots.find((x) => !x.bookingId);
            set((st) => ({
              bookings: st.bookings.map((b) => (b.id === refBooking.id ? { ...b, status: 'confirmed', heldUntil: undefined, slotId: slot?.id, events: [...b.events, event('پرداخت تأیید شد · رزرو قطعی', undefined, undefined, 'success')] } : b)),
              mockSessions: st.mockSessions.map((m) => (m.id === session.id ? { ...m, slots: m.slots.map((x) => (x.id === slot?.id ? { ...x, bookingId: refBooking.id } : x)) } : m)),
            }));
            notify(refBooking.studentId, `رزرو آزمون ماک قطعی شد`, `${session.title} · کد ${refBooking.code}`, '/portal/mock');
          }
          if (inv.ref.kind === 'correction') {
            up.corrections(inv.ref.id!, (c) => (c.status === 'held' ? { ...c, status: 'submitted', events: [...c.events, event('پرداخت تأیید شد · در صف تصحیح', undefined, undefined, 'success')] } : c));
          }
          if (inv.ref.kind === 'book') up.resources(inv.ref.id!, (r) => ({ ...r, stock: Math.max(0, (r.stock ?? 0) - 1) }));
          return { ok: true, id: invoiceId };
        },
        applyDiscount: (invoiceId, raw) => {
          const s = get();
          const inv = s.invoices.find((i) => i.id === invoiceId);
          const code = raw.trim().toUpperCase();
          const discount = s.discounts.find((d) => d.code === code);
          if (!inv) return { ok: false, error: 'فاکتور پیدا نشد.' };
          if (!discount || !discount.active) return { ok: false, error: 'این کد تخفیف معتبر نیست.' };
          if (new Date(discount.expires).getTime() < Date.now()) return { ok: false, error: 'مهلت استفاده از این کد تمام شده است.' };
          if (discount.used >= discount.maxUses) return { ok: false, error: 'ظرفیت استفاده از این کد تمام شده است.' };
          const scopeOk = discount.scope === 'all' || (discount.scope === 'mock' && inv.ref.kind === 'mock') || (discount.scope === 'courses' && inv.ref.kind === 'enrollment') || (discount.scope === 'correction' && inv.ref.kind === 'correction');
          if (!scopeOk) return { ok: false, error: 'این کد برای این نوع خرید نیست.' };
          if (inv.discount) return { ok: false, error: 'برای این فاکتور قبلاً کد تخفیف ثبت شده است.' };
          const base = inv.items.reduce((sum, item) => sum + item.amount, 0);
          const amount = discount.kind === 'percent' ? Math.round((base * discount.value) / 100) : Math.min(base, discount.value);
          set((st) => ({
            invoices: st.invoices.map((i) => (i.id === invoiceId ? { ...i, discount: { code, amount }, total: base - amount, installments: [{ id: uid('ins'), due: now(), amount: base - amount }] } : i)),
            discounts: st.discounts.map((d) => (d.code === code ? { ...d, used: d.used + 1 } : d)),
          }));
          return { ok: true, id: amount };
        },
        setInstallments: (invoiceId, parts) =>
          up.invoices(invoiceId, (inv) => {
            if (parts === 1) return { ...inv, installments: [{ id: uid('ins'), due: now(), amount: inv.total }] };
            const first = Math.round(inv.total * 0.55 / 10000) * 10000;
            return { ...inv, installments: [{ id: uid('ins'), due: now(), amount: first }, { id: uid('ins'), due: iso(addDays(new Date(), 30)), amount: inv.total - first }] };
          }),

        // ---------- teaching ----------
        saveAttendance: (classId, session, date, marks, by) => {
          const existing = get().attendance.find((a) => a.classId === classId && a.session === session);
          if (existing) up.attendance(existing.id, (a) => ({ ...a, marks, at: now(), by }));
          else set((s) => ({ attendance: [...s.attendance, { id: uid('at'), classId, session, date, marks, by, at: now() }] }));
          const s = get();
          const cls = s.classes.find((c) => c.id === classId);
          for (const [studentId, mark] of Object.entries(marks)) {
            if (mark !== 'absent') continue;
            const total = s.attendance.filter((a) => a.classId === classId && a.marks[studentId] === 'absent').length;
            notify(parentOf(studentId), `غیبت ${nameOf(s, studentId)} در کلاس ${cls?.code}`, total >= s.settings.absenceAlert ? `تعداد غیبت‌ها به ${faNumber(total)} رسید.` : undefined, '/parent');
            if (total >= s.settings.absenceAlert) notify('sf2', `غیبت‌های ${nameOf(s, studentId)} به ${faNumber(total)} رسید`, `کلاس ${cls?.code}`, '/admin/students');
          }
        },
        saveGrade: (enrollmentId, p) =>
          up.enrollments(enrollmentId, (e) => ({ ...e, grade: { ...(e.grade ?? { activity: null, homework: null, midterm: null, final: null, comment: '', status: 'draft' }), ...p, updatedAt: now() } })),
        submitGrades: (classId, by) => {
          set((s) => ({ enrollments: s.enrollments.map((e) => (e.classId === classId && e.grade && e.status === 'confirmed' ? { ...e, grade: { ...e.grade, status: 'submitted' } } : e)) }));
          const cls = get().classes.find((c) => c.id === classId);
          log(nameOf(get(), by), 'ارسال نمره‌های کلاس برای تأیید', cls?.code);
          notify('sf1', `نمره‌های ${cls?.code} برای تأیید ارسال شد`, undefined, '/admin/classes');
        },
        releaseGrades: (classId, by) => {
          const roster = get().enrollments.filter((e) => e.classId === classId && e.grade);
          set((s) => ({ enrollments: s.enrollments.map((e) => (e.classId === classId && e.grade ? { ...e, grade: { ...e.grade, status: 'released' } } : e)) }));
          const cls = get().classes.find((c) => c.id === classId);
          roster.forEach((e) => { notify(e.studentId, `کارنامه ${cls?.code} منتشر شد`, undefined, '/portal/grades'); notify(parentOf(e.studentId), `کارنامه ${cls?.code} منتشر شد`); });
          log(nameOf(get(), by), 'انتشار کارنامه کلاس', cls?.code);
        },
        addHomework: (classId, title, due, detail) => {
          set((s) => ({ homework: [{ id: uid('hw'), classId, title, due, detail }, ...s.homework] }));
          get().enrollments.filter((e) => e.classId === classId && e.status === 'confirmed').forEach((e) => notify(e.studentId, `تکلیف جدید: ${title}`, undefined, '/portal/classes'));
        },
        requestLeave: (teacherId, from, to, reason) => {
          const id = uid('lv');
          set((s) => ({
            leaves: [{ id, teacherId, from, to, reason, status: 'pending', createdAt: now() }, ...s.leaves],
            approvals: [{ id: uid('ap'), kind: 'leave', title: `مرخصی ${nameOf(s, teacherId)}`, detail: reason, requester: nameOf(s, teacherId), status: 'pending', createdAt: now(), ref: { kind: 'leave', id } }, ...s.approvals],
          }));
          notify('sf1', `درخواست مرخصی ${nameOf(get(), teacherId)}`, undefined, '/admin/approvals');
        },

        // ---------- IELTS mock ----------
        holdBooking: (studentId, sessionId, module, delivery) => {
          const s = get();
          const session = s.mockSessions.find((m) => m.id === sessionId);
          if (!session || session.cancelled) return { ok: false, error: 'این آزمون لغو شده است.', code: 'closed' };
          if (Date.now() > new Date(session.regClose).getTime()) return { ok: false, error: 'مهلت ثبت‌نام این آزمون تمام شده است.', code: 'closed' };
          const taken = s.bookings.filter((b) => b.sessionId === sessionId && bookingTakesSeat(b)).length;
          if (taken >= session.capacity) return { ok: false, error: 'ظرفیت این آزمون تکمیل شده است.', code: 'full' };
          if (s.bookings.some((b) => b.sessionId === sessionId && b.studentId === studentId && bookingTakesSeat(b))) return { ok: false, error: 'برای این آزمون رزرو دارید.', code: 'duplicate' };
          const id = uid('bk');
          const code = `M-${600 + s.bookings.length}`;
          const invoiceId = createInvoice(studentId, `آزمون ماک ${session.title}`, session.price, { kind: 'mock', id });
          set((st) => ({
            bookings: [...st.bookings, { id, code, studentId, sessionId, module, delivery, status: 'held', heldUntil: iso(addMinutes(new Date(), st.settings.seatHoldMin)), invoiceId, createdAt: now(), events: [event('رزرو ثبت شد', `تا ${faNumber(st.settings.seatHoldMin)} دقیقه برای پرداخت`)] }],
          }));
          return { ok: true, id };
        },
        holdOnDemand: (studentId, module) => {
          const s = get();
          const examiners = s.teachers.filter((t) => t.skills.includes('examiner') && t.status === 'active');
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(10, 0, 0, 0);
          const id = uid('od');
          const session: MockSession = {
            id, title: 'آزمون ماک فوری', at: now(), modules: [module], deliveries: ['online'],
            testIds: { academic: 'test-a-ac', general: 'test-a-gt' }, capacity: 1, price: s.settings.mock.onDemandPrice,
            regClose: iso(addDays(new Date(), 1)), onDemand: true, note: 'آزمون کتبی تا ۸ ساعت پس از خرید باز است؛ اسپیکینگ از فردا.',
            slots: Array.from({ length: 8 }, (_, i) => ({ id: uid('slot'), at: iso(addMinutes(tomorrow, i * 30)), examinerId: examiners[i % Math.max(1, examiners.length)]?.id ?? 'te1' })),
          };
          set((st) => ({ mockSessions: [...st.mockSessions, session] }));
          return get().holdBooking(studentId, id, module, 'online');
        },
        demoMock: (studentId, module) => {
          const result = get().holdOnDemand(studentId, module);
          if (!result.ok) return '';
          const booking = get().bookings.find((b) => b.id === result.id)!;
          get().payInvoice(booking.invoiceId!, get().settings.mock.onDemandPrice, 'online');
          return booking.id;
        },
        chooseSlot: (bookingId, slotId) =>
          set((s) => {
            const booking = s.bookings.find((b) => b.id === bookingId)!;
            return {
              mockSessions: s.mockSessions.map((m) => (m.id === booking.sessionId ? { ...m, slots: m.slots.map((x) => (x.bookingId === bookingId ? { ...x, bookingId: undefined } : x.id === slotId ? { ...x, bookingId } : x)) } : m)),
              bookings: s.bookings.map((b) => (b.id === bookingId ? { ...b, slotId, events: [...b.events, event('زمان آزمون اسپیکینگ تغییر کرد')] } : b)),
            };
          }),
        cancelBooking: (bookingId, reason, by) => {
          const s = get();
          const booking = s.bookings.find((b) => b.id === bookingId);
          if (!booking) return;
          const session = s.mockSessions.find((m) => m.id === booking.sessionId)!;
          const hoursLeft = (new Date(session.at).getTime() - Date.now()) / 3_600_000;
          const wasPaid = booking.status === 'confirmed';
          set((st) => ({
            bookings: st.bookings.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled', events: [...b.events, event('رزرو لغو شد', reason, nameOf(st, by), 'danger')] } : b)),
            mockSessions: st.mockSessions.map((m) => (m.id === session.id ? { ...m, slots: m.slots.map((x) => (x.bookingId === bookingId ? { ...x, bookingId: undefined } : x)) } : m)),
          }));
          if (!wasPaid) { up.invoices(booking.invoiceId!, (inv) => ({ ...inv, status: 'cancelled' })); return; }
          const percent = hoursLeft >= s.settings.mock.cancelHours ? s.settings.mock.refundPercent : 0;
          const inv = s.invoices.find((i) => i.id === booking.invoiceId);
          if (percent > 0 && inv) {
            set((st) => ({ approvals: [{ id: uid('ap'), kind: 'refund', title: `بازپرداخت رزرو ${booking.code}`, detail: `${reason || 'انصراف زبان‌آموز'} · ${faNumber(percent)}٪ مبلغ طبق قانون لغو`, amount: Math.round((inv.total * percent) / 100), requester: nameOf(st, by), status: 'pending', createdAt: now(), ref: { kind: 'booking', id: bookingId } }, ...st.approvals] }));
            notify('sf3', `درخواست بازپرداخت ${booking.code}`, undefined, '/admin/approvals');
          }
          log(nameOf(get(), by), 'لغو رزرو آزمون ماک', booking.code);
        },
        startAttempt: (bookingId) =>
          up.bookings(bookingId, (b) => (b.status === 'confirmed' ? { ...b, status: 'in_progress', attempt: { answers: {}, writing: { t1: '', t2: '' }, startedAt: now(), log: [] }, events: [...b.events, event('آزمون آغاز شد')] } : b)),
        submitAttempt: (bookingId, attempt) => {
          const s = get();
          const examiners = s.teachers.filter((t) => t.skills.includes('examiner') && t.status === 'active');
          const load = (id: string) => s.bookings.filter((b) => b.writingExaminerId === id && !b.writing).length;
          const examiner = [...examiners].sort((a, b) => load(a.id) - load(b.id))[0];
          const ended = attempt.endReason === 'timeout' ? 'با پایان زمان، پاسخ‌ها خودکار ثبت شد' : attempt.endReason === 'connection' ? 'به دلیل قطع طولانی اتصال، با پاسخ‌های ثبت‌شده پایان یافت' : undefined;
          up.bookings(bookingId, (b) => ({ ...b, status: 'awaiting_grading', attempt: { ...attempt, submittedAt: now() }, writingExaminerId: examiner?.id, events: [...b.events, event('آزمون کتبی ثبت شد', ended), event('رایتینگ به ممتحن سپرده شد', examiner?.name)] }));
          if (examiner) notify(examiner.id, 'رایتینگ جدید در صف تصحیح', undefined, '/teacher/grading');
        },
        markNoShow: (bookingId, by) => {
          up.bookings(bookingId, (b) => ({ ...b, status: 'no_show', events: [...b.events, event('غیبت در آزمون ثبت شد', undefined, nameOf(get(), by), 'danger')] }));
          log(nameOf(get(), by), 'ثبت غیبت در آزمون ماک', get().bookings.find((b) => b.id === bookingId)?.code);
        },
        assignWriting: (bookingId, teacherId, by) => {
          up.bookings(bookingId, (b) => ({ ...b, writingExaminerId: teacherId, events: [...b.events, event('ممتحن رایتینگ تغییر کرد', nameOf(get(), teacherId), nameOf(get(), by))] }));
          notify(teacherId, 'رایتینگ جدید در صف تصحیح', undefined, '/teacher/grading');
        },
        saveWritingGrade: (bookingId, grade) => {
          const b = get().bookings.find((x) => x.id === bookingId);
          if (!b) return;
          if (b.remark?.skill === 'writing' && b.remark.status === 'approved') {
            const before = b.writing ? writingBand(b.writing.t1, b.writing.t2) : undefined;
            const after = writingBand(grade.t1, grade.t2);
            up.bookings(bookingId, (x) => ({ ...x, writing: grade, remark: { ...x.remark!, status: 'done', before, after, examinerId: grade.examinerId }, events: [...x.events, event('بازبینی رایتینگ انجام شد', before === after ? 'نمره تغییر نکرد' : 'نمره تغییر کرد', nameOf(get(), grade.examinerId), 'success')] }));
            notify(b.studentId, 'نتیجه بازبینی رایتینگ آماده است', undefined, `/portal/mock/${bookingId}/result`);
            if (before !== after && b.invoiceId) notify('sf3', `نمره ${b.code} پس از بازبینی تغییر کرد`, 'هزینه بازبینی باید بازگردانده شود.', '/admin/finance');
            return;
          }
          up.bookings(bookingId, (x) => recomputeBooking({ ...x, writing: grade, events: [...x.events, event('نمره رایتینگ ثبت شد', undefined, nameOf(get(), grade.examinerId))] }));
          log(nameOf(get(), grade.examinerId), 'ثبت نمره رایتینگ', b.code);
        },
        saveSpeakingGrade: (bookingId, grade) => {
          const b = get().bookings.find((x) => x.id === bookingId);
          if (!b) return;
          if (b.remark?.skill === 'speaking' && b.remark.status === 'approved') {
            const before = b.speaking ? speakingBand(b.speaking.scores) : undefined;
            const after = speakingBand(grade.scores);
            up.bookings(bookingId, (x) => ({ ...x, speaking: grade, remark: { ...x.remark!, status: 'done', before, after, examinerId: grade.examinerId }, events: [...x.events, event('بازبینی اسپیکینگ انجام شد', before === after ? 'نمره تغییر نکرد' : 'نمره تغییر کرد', nameOf(get(), grade.examinerId), 'success')] }));
            notify(b.studentId, 'نتیجه بازبینی اسپیکینگ آماده است', undefined, `/portal/mock/${bookingId}/result`);
            return;
          }
          up.bookings(bookingId, (x) => recomputeBooking({ ...x, speaking: grade, speakingNoShow: false, events: [...x.events, event('نمره اسپیکینگ ثبت شد', undefined, nameOf(get(), grade.examinerId))] }));
          log(nameOf(get(), grade.examinerId), 'ثبت نمره اسپیکینگ', b.code);
        },
        speakingNoShow: (bookingId, by) =>
          up.bookings(bookingId, (x) => recomputeBooking({ ...x, speakingNoShow: true, events: [...x.events, event('غیبت در اسپیکینگ', 'نمره اسپیکینگ صفر در نظر گرفته می‌شود', nameOf(get(), by), 'danger')] })),
        releaseResults: (bookingIds, by) => {
          const ids = new Set(bookingIds);
          set((s) => ({ bookings: s.bookings.map((b) => (ids.has(b.id) && b.status === 'graded' ? { ...b, status: 'released', releasedAt: now(), events: [...b.events, event('نتیجه منتشر شد', undefined, nameOf(s, by), 'success')] } : b)) }));
          get().bookings.filter((b) => ids.has(b.id)).forEach((b) => notify(b.studentId, 'نتیجه آزمون ماک شما منتشر شد', `کد رزرو ${b.code}`, `/portal/mock/${b.id}/result`));
          log(nameOf(get(), by), 'انتشار نتایج آزمون ماک', `${faNumber(bookingIds.length)} نفر`);
        },
        requestRemark: (bookingId, skill, reason) => {
          const s = get();
          const b = s.bookings.find((x) => x.id === bookingId)!;
          const invoiceId = createInvoice(b.studentId, `بازبینی ${skill === 'writing' ? 'رایتینگ' : 'اسپیکینگ'} ${b.code}`, s.settings.mock.remarkFee, { kind: 'remark', id: bookingId });
          get().payInvoice(invoiceId, s.settings.mock.remarkFee, 'online');
          set((st) => ({
            bookings: st.bookings.map((x) => (x.id === bookingId ? { ...x, remark: { skill, reason, status: 'requested', at: now() }, events: [...x.events, event(`درخواست بازبینی ${skill === 'writing' ? 'رایتینگ' : 'اسپیکینگ'}`, reason)] } : x)),
            approvals: [{ id: uid('ap'), kind: 'remark', title: `بازبینی ${skill === 'writing' ? 'رایتینگ' : 'اسپیکینگ'} ${b.code}`, detail: reason, amount: s.settings.mock.remarkFee, requester: nameOf(st, b.studentId), status: 'pending', createdAt: now(), ref: { kind: 'booking', id: bookingId } }, ...st.approvals],
          }));
          notify('sf1', `درخواست بازبینی نمره ${b.code}`, undefined, '/admin/approvals');
        },
        saveMockSession: (input, by) => {
          const id = input.id ?? uid('ms');
          const existing = get().mockSessions.find((m) => m.id === id);
          const slots = existing?.slots.length ? existing.slots : Array.from({ length: input.slotCount }, (_, i) => ({ id: uid('slot'), at: iso(addMinutes(new Date(input.at), 240 + Math.floor(i / Math.max(1, input.examiners.length)) * 15)), examinerId: input.examiners[i % Math.max(1, input.examiners.length)] }));
          const { slotCount: _count, examiners: _examiners, ...rest } = input;
          void _count; void _examiners;
          const session: MockSession = { ...rest, id, slots };
          set((s) => ({ mockSessions: existing ? s.mockSessions.map((m) => (m.id === id ? session : m)) : [...s.mockSessions, session] }));
          log(nameOf(get(), by), existing ? 'ویرایش جلسه آزمون ماک' : 'ایجاد جلسه آزمون ماک', input.title);
          return id;
        },
        cancelMockSession: (id, reason, by) => {
          const session = get().mockSessions.find((m) => m.id === id);
          if (!session) return;
          const affected = get().bookings.filter((b) => b.sessionId === id && ['held', 'confirmed'].includes(b.status));
          set((s) => ({
            mockSessions: s.mockSessions.map((m) => (m.id === id ? { ...m, cancelled: true, note: reason } : m)),
            bookings: s.bookings.map((b) => (affected.some((a) => a.id === b.id) ? { ...b, status: 'cancelled', events: [...b.events, event('آزمون توسط آموزشگاه لغو شد', `${reason} · مبلغ کامل بازگردانده شد`, nameOf(s, by), 'danger')] } : b)),
          }));
          affected.forEach((b) => { refund(b.invoiceId, 100, nameOf(get(), by)); notify(b.studentId, `آزمون ${session.title} لغو شد`, 'مبلغ رزرو کامل به حساب شما بازگردانده می‌شود.', '/portal/mock'); });
          log(nameOf(get(), by), 'لغو جلسه آزمون ماک', session.title);
        },

        // ---------- correction service ----------
        holdCorrection: ({ studentId, task, prompt, text, express }) => {
          const s = get();
          const id = uid('cr');
          const code = `C-${310 + s.corrections.length}`;
          const price = express ? s.settings.mock.correctionExpressPrice : s.settings.mock.correctionPrice;
          const invoiceId = createInvoice(studentId, `تصحیح ${code}${express ? ' (فوری)' : ''}`, price, { kind: 'correction', id });
          set((st) => ({ corrections: [{ id, code, studentId, task, prompt, text, express, status: 'held', invoiceId, createdAt: now(), events: [event('متن ثبت شد')] }, ...st.corrections] }));
          return id;
        },
        claimCorrection: (id, teacherId) =>
          up.corrections(id, (c) => ({ ...c, status: 'in_review', examinerId: teacherId, events: [...c.events, event('به ممتحن سپرده شد', nameOf(get(), teacherId))] })),
        returnCorrection: (id, scores, comment) => {
          const c = get().corrections.find((x) => x.id === id);
          if (!c) return;
          up.corrections(id, (x) => ({ ...x, status: 'returned', returnedAt: now(), grade: { scores, comment, at: now() }, events: [...x.events, event('بازخورد ارسال شد', undefined, nameOf(get(), x.examinerId), 'success')] }));
          notify(c.studentId, `بازخورد تصحیح ${c.code} آماده است`, undefined, '/portal/corrections');
        },

        // ---------- admin ----------
        saveClass: (input, by) => {
          const id = input.id ?? uid('cl');
          const course = courseById(input.courseId);
          const code = input.code || `${(course?.id ?? 'C').slice(0, 2).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
          set((s) => ({ classes: s.classes.some((c) => c.id === id) ? s.classes.map((c) => (c.id === id ? { ...c, ...input, id, code } : c)) : [...s.classes, { ...input, id, code }] }));
          log(nameOf(get(), by), input.id ? 'ویرایش کلاس' : 'ایجاد کلاس', code);
          return id;
        },
        cancelClass: (id, reason, by) => {
          const cls = get().classes.find((c) => c.id === id);
          const affected = get().enrollments.filter((e) => e.classId === id && ['held', 'confirmed', 'waitlisted'].includes(e.status));
          set((s) => ({
            classes: s.classes.map((c) => (c.id === id ? { ...c, cancelled: true } : c)),
            enrollments: s.enrollments.map((e) => (affected.some((a) => a.id === e.id) ? { ...e, status: 'cancelled', events: [...e.events, event('کلاس توسط آموزشگاه لغو شد', reason, nameOf(s, by), 'danger')] } : e)),
          }));
          affected.forEach((e) => { refund(e.invoiceId, 100, nameOf(get(), by)); notify(e.studentId, `کلاس ${cls?.code} لغو شد`, 'شهریه کامل بازگردانده می‌شود یا می‌توانید کلاس دیگری انتخاب کنید.', '/portal/classes'); });
          log(nameOf(get(), by), 'لغو کلاس', cls?.code);
        },
        saveTerm: (input, by) => {
          const id = input.id ?? uid('term');
          set((s) => ({ terms: s.terms.some((t) => t.id === id) ? s.terms.map((t) => (t.id === id ? { ...input, id } : t)) : [...s.terms, { ...input, id }] }));
          log(nameOf(get(), by), input.id ? 'ویرایش ترم' : 'ایجاد ترم', input.title);
        },
        decideApproval: (id, decision, note, by) => {
          const approval = get().approvals.find((a) => a.id === id);
          if (!approval) return;
          up.approvals(id, (a) => ({ ...a, status: decision, note, decidedBy: nameOf(get(), by), decidedAt: now() }) as Approval);
          log(nameOf(get(), by), decision === 'approved' ? 'تأیید درخواست' : 'رد درخواست', approval.title);
          const ref = approval.ref;
          if (!ref) return;
          if (approval.kind === 'leave') {
            up.leaves(ref.id, (l) => ({ ...l, status: decision }));
            const leave = get().leaves.find((l) => l.id === ref.id);
            notify(leave?.teacherId, decision === 'approved' ? 'مرخصی شما تأیید شد' : 'مرخصی شما تأیید نشد', note || undefined, '/teacher/leave');
          }
          if (approval.kind === 'refund' && decision === 'approved') {
            const booking = get().bookings.find((b) => b.id === ref.id);
            const inv = get().invoices.find((i) => i.id === booking?.invoiceId);
            if (inv && approval.amount) refund(inv.id, Math.round((approval.amount / inv.total) * 100), nameOf(get(), by));
            notify(booking?.studentId, 'بازپرداخت شما تأیید شد', approval.amount ? `${toman(approval.amount)} طی ۷۲ ساعت کاری واریز می‌شود.` : undefined);
          }
          if (approval.kind === 'remark') {
            const booking = get().bookings.find((b) => b.id === ref.id);
            if (!booking?.remark) return;
            if (decision === 'rejected') {
              up.bookings(ref.id, (b) => ({ ...b, remark: { ...b.remark!, status: 'rejected' }, events: [...b.events, event('درخواست بازبینی رد شد', note)] }));
              notify(booking.studentId, 'درخواست بازبینی تأیید نشد', note || undefined);
              return;
            }
            const original = booking.remark.skill === 'writing' ? booking.writing?.examinerId : booking.speaking?.examinerId;
            const other = get().teachers.find((t) => t.skills.includes('examiner') && t.id !== original);
            up.bookings(ref.id, (b) => ({ ...b, remark: { ...b.remark!, status: 'approved', examinerId: other?.id }, writingExaminerId: b.remark!.skill === 'writing' ? other?.id : b.writingExaminerId, events: [...b.events, event('بازبینی تأیید شد', `به ممتحن دوم: ${other?.name ?? ''}`)] }));
            notify(other?.id, `بازبینی ${booking.code} به شما سپرده شد`, undefined, '/teacher/grading');
          }
        },
        addLead: (input) => {
          set((s) => ({ leads: [{ ...input, id: uid('ld'), status: 'new', createdAt: now(), notes: [] }, ...s.leads] }));
          notify('sf2', `درخواست جدید: ${input.name}`, input.message.slice(0, 60), '/admin/leads');
        },
        updateLead: (id, p, note) => up.leads(id, (l) => ({ ...l, ...p, notes: note ? [...l.notes, { ...note, at: now() }] : l.notes })),
        saveDiscount: (code, by) => {
          set((s) => ({ discounts: s.discounts.some((d) => d.code === code.code) ? s.discounts.map((d) => (d.code === code.code ? code : d)) : [code, ...s.discounts] }));
          log(nameOf(get(), by), 'ذخیره کد تخفیف', code.code);
        },
        saveStaff: (input, by) => {
          if (input.id) up.staff(input.id, (u) => ({ ...u, ...input, id: u.id }) as Staff);
          else set((s) => ({ staff: [...s.staff, { ...input, id: uid('sf'), status: 'invited' }] }));
          log(nameOf(get(), by), input.id ? 'ویرایش کاربر' : 'دعوت کاربر', input.name);
        },
        buyBook: (studentId, resourceId) => {
          const r = get().resources.find((x) => x.id === resourceId)!;
          return createInvoice(studentId, `خرید ${r.title}`, r.price ?? 0, { kind: 'book', id: resourceId });
        },
        updateSettings: (p, by) => {
          set((s) => ({ settings: { ...s.settings, ...p, mock: { ...s.settings.mock, ...(p.mock ?? {}) }, grades: { ...s.settings.grades, ...(p.grades ?? {}) } } }));
          log(nameOf(get(), by), 'تغییر تنظیمات');
        },
        log,
      };
    },
    {
      name: 'kls.app',
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      migrate: () => ({ ...createSeed(), session: null }) as unknown as AppState,
    },
  ),
);

// ---------- selectors ----------
export const useSessionUser = () =>
  useApp((s) => {
    const session = s.session;
    if (!session) return undefined;
    if (session.panel === 'student') return s.students.find((x) => x.id === session.userId);
    if (session.panel === 'parent') return s.parents.find((x) => x.id === session.userId);
    if (session.panel === 'teacher') return s.teachers.find((x) => x.id === session.userId);
    return s.staff.find((x) => x.id === session.userId);
  });

export const personName = (state: SeedData, id: string | undefined) => nameOf(state, id);
export { dueInstallments };
