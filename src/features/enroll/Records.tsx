import { Receipt } from '@gravity-ui/icons';
import { Button, Card, cn } from '@heroui/react';
import { useState } from 'react';
import { DataTable } from '@/components/ui/DataTable';
import { Empty } from '@/components/ui/Empty';
import { MetaChip } from '@/components/ui/StatusChip';
import { levelTitle } from '@/data/catalog';
import { balanceOf, dueInstallments, INVOICE_META, invoiceState, MARK_META, METHOD_LABEL } from '@/data/status';
import { formatDate, formatDay } from '@/lib/dates';
import { faNumber, toman } from '@/lib/format';
import { useApp } from '@/store/app';
import { attendanceSummary, gradeTotal } from '@/store/selectors';
import type { Enrollment, Invoice } from '@/types';
import { PaymentDialog } from './Payment';

/** Invoices with their balance, next due installment and payments; staff can record a desk payment. */
export function InvoiceList({ invoices, staff = false, showStudent = false }: { invoices: Invoice[]; staff?: boolean; showStudent?: boolean }) {
  const students = useApp((s) => s.students);
  const enrollments = useApp((s) => s.enrollments);
  const bookings = useApp((s) => s.bookings);
  const [payId, setPayId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const heldUntil = (inv: Invoice) => (inv.ref.kind === 'enrollment' ? enrollments.find((e) => e.id === inv.ref.id)?.heldUntil : inv.ref.kind === 'mock' ? bookings.find((b) => b.id === inv.ref.id)?.heldUntil : undefined);
  const sorted = [...invoices].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const open = sorted.find((i) => i.id === openId);
  return (
    <>
      <DataTable label="فاکتورها" rows={sorted} getId={(i) => i.id} onAction={(i) => setOpenId(i.id === openId ? null : i.id)}
        empty={<Empty icon={Receipt} title="فاکتوری وجود ندارد" description="پس از هر ثبت‌نام، رزرو یا خرید، فاکتور اینجا می‌آید." />}
        columns={[
          { key: 'code', label: 'شماره', render: (i) => <span className="font-semibold tabular">{i.code}</span> },
          ...(showStudent ? [{ key: 'student', label: 'زبان‌آموز', render: (i: Invoice) => students.find((s) => s.id === i.studentId)?.name }] : []),
          { key: 'title', label: 'شرح', render: (i) => <span className="text-[13px]">{i.title}</span> },
          { key: 'total', label: 'مبلغ', render: (i) => <span className="tabular">{toman(i.total)}</span> },
          { key: 'balance', label: 'مانده', render: (i) => <span className={cn('tabular', balanceOf(i) > 0 && invoiceState(i) !== 'cancelled' ? 'font-semibold' : 'text-muted')}>{invoiceState(i) === 'cancelled' ? '—' : toman(balanceOf(i))}</span> },
          { key: 'due', label: 'سررسید بعدی', render: (i) => { const next = dueInstallments(i)[0]; return next && ['unpaid', 'partial', 'overdue'].includes(invoiceState(i)) ? formatDay(next.due) : '—'; } },
          { key: 'state', label: 'وضعیت', render: (i) => <MetaChip meta={INVOICE_META[invoiceState(i)]} /> },
          { key: 'act', label: '', render: (i) => (['unpaid', 'partial', 'overdue'].includes(invoiceState(i)) ? <Button size="sm" variant={staff ? 'secondary' : 'primary'} onPress={() => setPayId(i.id)}>{staff ? 'ثبت دریافت' : 'پرداخت'}</Button> : null) },
        ]} />
      {open ? (
        <Card className="mt-3 gap-3 p-5">
          <div className="flex items-center justify-between"><div className="font-bold">جزئیات {open.code}</div><span className="text-xs text-muted">صدور {formatDate(open.createdAt)}</span></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-semibold text-muted">اقساط</div>
              <ul className="grid gap-1 text-[13px]">{open.installments.map((inst, idx) => <li key={inst.id} className="flex justify-between"><span>قسط {faNumber(idx + 1)} · {formatDay(inst.due)}</span><span className="tabular">{toman(inst.amount)}</span></li>)}</ul>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold text-muted">پرداخت‌ها</div>
              {open.payments.length ? <ul className="grid gap-1 text-[13px]">{open.payments.map((p) => <li key={p.id} className="flex justify-between gap-2"><span>{formatDay(p.at)} · {METHOD_LABEL[p.method]} · <bdi className="tabular">{p.ref}</bdi></span><span className={cn('tabular', p.amount < 0 && 'text-danger')}>{p.amount < 0 ? `بازپرداخت ${toman(-p.amount)}` : toman(p.amount)}</span></li>)}</ul> : <p className="text-[13px] text-muted">پرداختی ثبت نشده است.</p>}
            </div>
          </div>
        </Card>
      ) : null}
      <PaymentDialog invoiceId={payId ?? undefined} isOpen={Boolean(payId)} onOpenChange={(o) => !o && setPayId(null)} staff={staff} heldUntil={payId ? heldUntil(invoices.find((i) => i.id === payId)!) : undefined} />
    </>
  );
}

/** Term report card for one enrollment. */
export function ReportCard({ enrollment }: { enrollment: Enrollment }) {
  const s = useApp();
  const cls = s.classes.find((c) => c.id === enrollment.classId)!;
  const term = s.terms.find((t) => t.id === cls.termId);
  const teacher = s.teachers.find((t) => t.id === cls.teacherId);
  const g = enrollment.grade;
  const total = gradeTotal(g);
  const w = s.settings.grades;
  const att = attendanceSummary(s, cls.id, enrollment.studentId);
  const released = g?.status === 'released';
  return (
    <Card className="gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-base font-bold">{levelTitle(cls.levelId)} · {cls.code}</div>
          <div className="text-[13px] text-muted">{term?.title} · استاد {teacher?.name}</div>
        </div>
        {released && total != null ? (
          <div className={cn('rounded-xl px-3 py-1.5 text-center', total >= w.pass ? 'bg-success-soft text-success-soft-foreground' : 'bg-danger-soft text-danger')}>
            <div className="text-xl font-extrabold tabular">{faNumber(total)}</div>
            <div className="text-[11px] font-semibold">{total >= w.pass ? 'قبول' : 'مردود'}</div>
          </div>
        ) : <span className="text-xs text-muted">{g?.status === 'submitted' ? 'در انتظار تأیید آموزش' : 'کارنامه هنوز منتشر نشده'}</span>}
      </div>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {([['فعالیت کلاسی', g?.activity, w.activity], ['تکلیف', g?.homework, w.homework], ['میان‌ترم', g?.midterm, w.midterm], ['پایان‌ترم', released ? g?.final : null, w.final]] as const).map(([label, value, max]) => (
          <div key={label} className="rounded-lg bg-surface-secondary p-3"><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 font-bold tabular">{value != null ? faNumber(value) : '—'} <span className="text-xs font-normal text-muted">از {faNumber(max)}</span></dd></div>
        ))}
      </dl>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink-2">
        <span>جلسه‌های برگزارشده: {faNumber(att.held)}</span>
        {(['present', 'late', 'absent', 'excused'] as const).map((m) => <span key={m}>{MARK_META[m].label}: {faNumber(att[m])}</span>)}
      </div>
      {released && g?.comment ? <p className="rounded-lg border border-border p-3 text-[13.5px] leading-7">{g.comment}</p> : null}
    </Card>
  );
}
