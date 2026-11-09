import { Persons } from '@gravity-ui/icons';
import { Alert, Button, Card, Chip, Tabs } from '@heroui/react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Empty } from '@/components/ui/Empty';
import { SelectField } from '@/components/ui/Fields';
import { Page, PageHeader, Section } from '@/components/ui/Page';
import { PersonAvatar } from '@/components/ui/Person';
import { MetaChip } from '@/components/ui/StatusChip';
import { EnrollWizard } from '@/features/enroll/EnrollWizard';
import { InvoiceList, ReportCard } from '@/features/enroll/Records';
import { levelTitle } from '@/data/catalog';
import { balanceOf, ENROLLMENT_META, enrollmentStatus, invoiceState, MARK_META } from '@/data/status';
import { formatDateTime, formatDay } from '@/lib/dates';
import { faNumber, toman } from '@/lib/format';
import { daysLabel, timeRange } from '@/lib/schedule';
import { useShallow } from 'zustand/react/shallow';
import { useApp, useSessionUser } from '@/store/app';
import { attendanceSummary } from '@/store/selectors';
import type { Parent } from '@/types';

export function ParentHome() {
  const s = useApp();
  const me = useSessionUser() as Parent;
  const navigate = useNavigate();
  const children = s.students.filter((st) => me.childIds.includes(st.id));
  const [tab, setTab] = useState(children[0]?.id ?? '');
  if (!children.length) return <Page><Card><Empty icon={Persons} title="فرزندی به حساب شما وصل نیست" description="هنگام ثبت‌نام زبان‌آموز زیر ۱۸ سال، شماره شما به‌عنوان ولی ثبت می‌شود." /></Card></Page>;
  return (
    <Page>
      <PageHeader title="فرزندان من" description="حضور، تکلیف، کارنامه و پرداخت‌های هر فرزند." actions={<Button onPress={() => navigate('/parent/enroll')}>ثبت‌نام ترم جدید</Button>} />
      <Tabs selectedKey={tab} onSelectionChange={(k) => setTab(String(k))} variant="secondary">
        <Tabs.ListContainer>
          <Tabs.List aria-label="فرزندان" className="mb-5">
            {children.map((c) => <Tabs.Tab key={c.id} id={c.id}><PersonAvatar name={c.name} />{c.name}<Tabs.Indicator /></Tabs.Tab>)}
          </Tabs.List>
        </Tabs.ListContainer>
        {children.map((child) => {
          const current = s.enrollments.filter((e) => e.studentId === child.id && ['held', 'confirmed', 'waitlisted'].includes(enrollmentStatus(e)));
          const reports = s.enrollments.filter((e) => e.studentId === child.id && e.grade?.status === 'released');
          const unpaid = s.invoices.filter((i) => i.studentId === child.id && ['unpaid', 'partial', 'overdue'].includes(invoiceState(i)));
          return (
            <Tabs.Panel key={child.id} id={child.id} className="grid gap-4">
              {unpaid.length ? (
                <Alert status={unpaid.some((i) => invoiceState(i) === 'overdue') ? 'danger' : 'warning'}>
                  <Alert.Content>
                    <Alert.Title>مانده پرداخت: {toman(unpaid.reduce((sum, i) => sum + balanceOf(i), 0))}</Alert.Title>
                    <Alert.Description>{unpaid.map((i) => i.title).join('، ')}</Alert.Description>
                  </Alert.Content>
                  <Button size="sm" onPress={() => navigate('/parent/payments')}>پرداخت</Button>
                </Alert>
              ) : null}
              {current.map((e) => {
                const cls = s.classes.find((c) => c.id === e.classId)!;
                const att = attendanceSummary(s, cls.id, child.id);
                const recent = s.attendance.filter((a) => a.classId === cls.id && a.marks[child.id]).sort((a, b) => b.session - a.session).slice(0, 8);
                const hw = s.homework.filter((h) => h.classId === cls.id && new Date(h.due).getTime() > Date.now());
                return (
                  <Section key={e.id} title={`${levelTitle(cls.levelId)} · ${cls.code}`} description={`${daysLabel(cls.days)} · ${timeRange(cls.start, cls.minutes)} · استاد ${s.teachers.find((t) => t.id === cls.teacherId)?.name}`} actions={<MetaChip meta={ENROLLMENT_META[enrollmentStatus(e)]} />}>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div>
                        <div className="mb-2 text-xs font-semibold text-muted">حضور و غیاب ({faNumber(att.held)} جلسه)</div>
                        <div className="mb-3 flex flex-wrap gap-2 text-[13px]">{(['present', 'late', 'absent', 'excused'] as const).map((m) => <Chip key={m} size="sm" variant="soft" color={MARK_META[m].tone as 'success'}>{MARK_META[m].label}: {faNumber(att[m])}</Chip>)}</div>
                        {att.absent >= s.settings.absenceAlert ? <p className="mb-2 text-[13px] font-semibold text-danger">تعداد غیبت‌ها از حد مجاز ({faNumber(s.settings.absenceAlert)}) گذشته است.</p> : null}
                        <ul className="grid gap-1 text-[13px]">{recent.map((a) => <li key={a.id} className="flex justify-between"><span>جلسه {faNumber(a.session)} · {formatDateTime(a.date)}</span><span className="font-semibold">{MARK_META[a.marks[child.id]].label}</span></li>)}</ul>
                      </div>
                      <div>
                        <div className="mb-2 text-xs font-semibold text-muted">تکلیف‌های پیش رو</div>
                        {hw.length ? <ul className="grid gap-2">{hw.map((h) => <li key={h.id} className="rounded-lg border border-border px-3 py-2 text-[13px]"><div className="font-semibold">{h.title}</div><div className="text-muted">مهلت {formatDay(h.due)} · {h.detail}</div></li>)}</ul> : <p className="text-[13px] text-muted">تکلیفی ثبت نشده است.</p>}
                      </div>
                    </div>
                  </Section>
                );
              })}
              {!current.length ? <Card><Empty title={`${child.name} در کلاس فعالی ثبت‌نام نکرده است`} action={<Button size="sm" onPress={() => navigate('/parent/enroll')}>ثبت‌نام</Button>} /></Card> : null}
              {reports.length ? <div className="grid gap-3"><h2 className="text-[15px] font-bold">کارنامه‌ها</h2>{reports.map((e) => <ReportCard key={e.id} enrollment={e} />)}</div> : null}
            </Tabs.Panel>
          );
        })}
      </Tabs>
    </Page>
  );
}

export function ParentEnrollPage() {
  const s = useApp();
  const me = useSessionUser() as Parent;
  const children = s.students.filter((st) => me.childIds.includes(st.id));
  const [childId, setChildId] = useState(children[0]?.id ?? '');
  const { search } = useLocation();
  const child = children.find((c) => c.id === childId);
  return (
    <Page width="narrow">
      <PageHeader title="ثبت‌نام فرزند" description="کلاس‌های ترم آینده را برای هر فرزند انتخاب و پرداخت کنید." />
      <div className="grid gap-4">
        <Section><SelectField label="فرزند" value={childId} onChange={setChildId} options={children.map((c) => ({ id: c.id, label: c.name, description: `متولد ${faNumber(c.birthYear)}` }))} /></Section>
        {child ? <EnrollWizard key={`${child.id}${search}`} student={child} by="parent" /> : null}
      </div>
    </Page>
  );
}

export function ParentPaymentsPage() {
  const me = useSessionUser() as Parent;
  const invoices = useApp(useShallow((s) => s.invoices.filter((i) => me.childIds.includes(i.studentId))));
  return (
    <Page>
      <PageHeader title="پرداخت‌ها" description="فاکتورهای همه فرزندان." />
      <InvoiceList invoices={invoices} showStudent />
    </Page>
  );
}
