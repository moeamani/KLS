import { ArrowLeft } from '@gravity-ui/icons';
import { Button, Card, cn } from '@heroui/react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { KpiStrip } from '@/components/ui/Kpi';
import { Page, PageHeader, Section } from '@/components/ui/Page';
import { COURSES } from '@/data/catalog';
import { invoiceState, termState } from '@/data/status';
import { longDate } from '@/lib/dates';
import { faNumber, tomanShort } from '@/lib/format';
import { formatBand } from '@/lib/ielts';
import { useApp, useSessionUser } from '@/store/app';
import { bookingScores, mockSessionState } from '@/store/selectors';
import type { Staff } from '@/types';

/** Horizontal bars, labelled and readable without a legend. */
export function BarList({ rows, format = faNumber, tone = 'accent' }: { rows: { label: string; value: number; hint?: string }[]; format?: (n: number) => string; tone?: 'accent' | 'success' | 'warning' }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="grid gap-2.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,140px)_1fr_auto] items-center gap-3 text-[13px]">
          <span className="truncate text-ink-2">{r.label}</span>
          <span className="h-2.5 overflow-hidden rounded-full bg-default"><span className={cn('block h-full rounded-full', tone === 'success' ? 'bg-success' : tone === 'warning' ? 'bg-warning' : 'bg-accent')} style={{ width: `${(r.value / max) * 100}%` }} /></span>
          <span className="min-w-14 text-end font-semibold tabular">{format(r.value)}{r.hint ? <span className="ms-1 text-xs font-normal text-muted">{r.hint}</span> : null}</span>
        </li>
      ))}
    </ul>
  );
}

export function AdminDashboard() {
  const s = useApp();
  const me = useSessionUser() as Staff;
  const navigate = useNavigate();
  const data = useMemo(() => {
    const monthAgo = Date.now() - 30 * 86_400_000;
    const payments = s.invoices.flatMap((i) => i.payments.map((p) => ({ p, i }))).filter(({ p }) => new Date(p.at).getTime() > monthAgo);
    const revenue = payments.reduce((sum, { p }) => sum + p.amount, 0);
    const bySource = (['enrollment', 'mock', 'correction', 'book', 'remark'] as const).map((kind) => ({ kind, value: payments.filter(({ i }) => i.ref.kind === kind).reduce((sum, { p }) => sum + p.amount, 0) }));
    const running = s.terms.find((t) => termState(t) === 'running');
    const activeStudents = new Set(s.enrollments.filter((e) => e.status === 'confirmed' && s.classes.find((c) => c.id === e.classId)?.termId === running?.id).map((e) => e.studentId)).size;
    const upcomingMocks = s.mockSessions.filter((m) => !m.onDemand && ['open', 'full', 'closed', 'today'].includes(mockSessionState(s, m)));
    const released = s.bookings.filter((b) => b.status === 'released').map((b) => bookingScores(b, s.mockSessions.find((m) => m.id === b.sessionId)).overall).filter((v): v is number => v != null);
    const bands = [[4, 5], [5, 6], [6, 7], [7, 8], [8, 9.5]].map(([lo, hi]) => ({ label: `${formatBand(lo)} تا ${formatBand(hi === 9.5 ? 9 : hi - 0.5)}`, value: released.filter((b) => b >= lo && b < hi).length }));
    const next = s.terms.find((t) => termState(t) === 'registration');
    const byCourse = COURSES.filter((c) => c.category !== 'corporate').map((c) => ({ label: c.title, value: s.enrollments.filter((e) => ['confirmed', 'held'].includes(e.status) && s.classes.find((cl) => cl.id === e.classId && cl.termId === next?.id && cl.courseId === c.id)).length })).filter((r) => r.value);
    const overdue = s.invoices.filter((i) => invoiceState(i) === 'overdue');
    return { revenue, bySource, activeStudents, upcomingMocks, bands, released, byCourse, next, overdue };
  }, [s]);

  const todo = [
    { count: s.bookings.filter((b) => b.status === 'graded').length, label: 'نتیجه آزمون ماک آماده انتشار', to: '/admin/bookings?status=graded' },
    { count: s.approvals.filter((a) => a.status === 'pending').length, label: 'درخواست در صندوق تأیید', to: '/admin/approvals' },
    { count: s.corrections.filter((c) => c.status === 'submitted').length, label: 'متن تصحیح بدون ممتحن', to: '/admin/corrections' },
    { count: s.leads.filter((l) => l.status === 'new').length, label: 'درخواست تازه از سایت', to: '/admin/leads' },
    { count: data.overdue.length, label: 'فاکتور با قسط سررسیدگذشته', to: '/admin/finance' },
    { count: s.enrollments.filter((e) => e.grade?.status === 'submitted').length ? new Set(s.enrollments.filter((e) => e.grade?.status === 'submitted').map((e) => e.classId)).size : 0, label: 'کلاس با نمره در انتظار تأیید', to: '/admin/classes' },
  ].filter((t) => t.count);
  const SOURCE = { enrollment: 'شهریه کلاس‌ها', mock: 'آزمون ماک', correction: 'خدمات تصحیح', book: 'فروش کتاب', remark: 'بازبینی نمره' };

  return (
    <Page width="wide">
      <PageHeader title="داشبورد" description={`${longDate()} · ${me.name}`} />
      <div className="grid gap-4">
        <KpiStrip items={[
          { label: 'دریافتی ۳۰ روز گذشته (تومان)', value: data.revenue, format: tomanShort },
          { label: 'زبان‌آموز فعال این ترم', value: data.activeStudents },
          { label: 'آزمون ماک پیش رو', value: data.upcomingMocks.length, hint: `${faNumber(s.bookings.filter((b) => b.status === 'confirmed').length)} رزرو قطعی` },
          { label: `ثبت‌نام ${data.next?.title ?? 'ترم بعد'}`, value: data.byCourse.reduce((sum, r) => sum + r.value, 0), hint: 'قطعی و در انتظار پرداخت' },
        ]} />
        <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
          <Section title="کارهای در انتظار">
            {todo.length ? (
              <ul className="grid gap-1">
                {todo.map((t) => (
                  <li key={t.label}>
                    <button type="button" onClick={() => navigate(t.to)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-start outline-none hover:bg-default focus-visible:ring-2 focus-visible:ring-focus">
                      <span className="grid min-w-8 place-items-center rounded-lg bg-warning-soft px-2 py-1 text-sm font-extrabold text-warning-soft-foreground tabular">{faNumber(t.count)}</span>
                      <span className="flex-1 text-[13.5px]">{t.label}</span>
                      <ArrowLeft className="size-4 text-ink-3" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p className="text-[13px] text-muted">کاری در انتظار نیست.</p>}
          </Section>
          <Section title="دریافتی ۳۰ روز گذشته به تفکیک منبع">
            <BarList rows={data.bySource.filter((r) => r.value).map((r) => ({ label: SOURCE[r.kind], value: r.value }))} format={tomanShort} />
          </Section>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="نمره کل آزمون‌های ماک منتشرشده" description={`${faNumber(data.released.length)} نتیجه`}>
            <BarList rows={data.bands} tone="success" />
          </Section>
          <Section title={`ثبت‌نام ${data.next?.title ?? ''} به تفکیک دوره`}>
            {data.byCourse.length ? <BarList rows={data.byCourse} /> : <p className="text-[13px] text-muted">هنوز ثبت‌نامی نیست.</p>}
          </Section>
        </div>
        <Card className="flex-row flex-wrap items-center justify-between gap-3 p-4">
          <span className="text-[13.5px] text-ink-2">آزمون‌های ماک پیش رو: {data.upcomingMocks.map((m) => m.title).join('، ')}</span>
          <Button size="sm" variant="secondary" onPress={() => navigate('/admin/mock')}>مدیریت آزمون‌ها</Button>
        </Card>
      </div>
    </Page>
  );
}
