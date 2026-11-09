import { ArrowLeft, Book, Calendar, CircleCheck, Display, FileText, GraduationCap, Pencil, Receipt, Ticket, VolumeFill, Video } from '@gravity-ui/icons';
import { Alert, Button, Card, Chip, cn, Radio, RadioGroup, toast } from '@heroui/react';
import { useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router';
import { BandBadge } from '@/components/ui/Band';
import { ConfirmDialog, FormDialog } from '@/components/ui/Dialog';
import { Empty } from '@/components/ui/Empty';
import { TextInput } from '@/components/ui/Fields';
import { Page, PageHeader, Section } from '@/components/ui/Page';
import { MetaChip } from '@/components/ui/StatusChip';
import { EnrollWizard } from '@/features/enroll/EnrollWizard';
import { PaymentDialog } from '@/features/enroll/Payment';
import { InvoiceList, ReportCard } from '@/features/enroll/Records';
import { FORMAT_LABEL, levelTitle } from '@/data/catalog';
import { PLACEMENT, placementResult } from '@/data/placement';
import { balanceOf, bookingStatus, dueInstallments, ENROLLMENT_META, enrollmentStatus, invoiceState, MARK_META, termState } from '@/data/status';
import { formatDate, formatDateTime, formatDay, longDate, relativeDay } from '@/lib/dates';
import { faNumber, onlyDigits, toman } from '@/lib/format';
import { daysLabel, timeRange } from '@/lib/schedule';
import { nationalIdError } from '@/lib/validation';
import { useShallow } from 'zustand/react/shallow';
import { useApp, useSessionUser } from '@/store/app';
import { bookingScores, classSessions, examWindow, gradePartial } from '@/store/selectors';
import type { Student } from '@/types';


export function StudentHome() {
  const s = useApp();
  const me = useSessionUser() as Student;
  const navigate = useNavigate();
  const myBookings = s.bookings.filter((b) => b.studentId === me.id);
  const examNow = myBookings.find((b) => (bookingStatus(b) === 'confirmed' && examWindow(s.mockSessions.find((m) => m.id === b.sessionId)!).open) || b.status === 'in_progress');
  const nextMock = myBookings.filter((b) => bookingStatus(b) === 'confirmed').map((b) => ({ b, session: s.mockSessions.find((m) => m.id === b.sessionId)! })).sort((a, b) => a.session.at.localeCompare(b.session.at))[0];
  const lastResult = myBookings.filter((b) => b.status === 'released').sort((a, b) => (b.releasedAt ?? '').localeCompare(a.releasedAt ?? ''))[0];
  const myClasses = s.enrollments.filter((e) => e.studentId === me.id && e.status === 'confirmed').map((e) => ({ e, cls: s.classes.find((c) => c.id === e.classId)! }));
  const nextSession = myClasses.flatMap(({ cls }) => classSessions(s, cls).filter((d) => d.getTime() > Date.now()).slice(0, 1).map((d) => ({ cls, d }))).sort((a, b) => a.d.getTime() - b.d.getTime())[0];
  const due = s.invoices.filter((i) => i.studentId === me.id && ['unpaid', 'partial', 'overdue'].includes(invoiceState(i)));
  const nextDue = due.map((i) => ({ i, inst: dueInstallments(i)[0] })).filter((x) => x.inst).sort((a, b) => a.inst.due.localeCompare(b.inst.due))[0];
  const homework = s.homework.filter((h) => myClasses.some(({ cls }) => cls.id === h.classId) && new Date(h.due).getTime() > Date.now());

  return (
    <Page>
      <PageHeader title={me.name} description={longDate()} />
      <div className="grid gap-4">
        {examNow ? (
          <Card className="flex-row flex-wrap items-center gap-4 border-accent bg-accent-soft p-5">
            <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground"><Ticket className="size-5" /></span>
            <div className="min-w-[200px] flex-1">
              <div className="text-base font-extrabold">{examNow.status === 'in_progress' ? 'آزمون ماک شما نیمه‌تمام است' : 'آزمون ماک آنلاین شما باز است'}</div>
              <div className="text-[13px] text-ink-2">کد {examNow.code} · لیسنینگ، ریدینگ و رایتینگ در یک نشست؛ حدود ۲ ساعت و ۳۰ دقیقه.</div>
            </div>
            <Button size="lg" onPress={() => navigate(`/portal/mock/${examNow.id}/exam`)}>{examNow.status === 'in_progress' ? 'ادامه آزمون' : 'شروع آزمون'}<ArrowLeft /></Button>
          </Card>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="gap-2 p-5">
            <div className="flex items-center gap-2 text-[13px] text-muted"><Calendar className="size-4" />جلسه بعدی کلاس</div>
            {nextSession ? <><div className="text-[15px] font-bold">{nextSession.cls.code}</div><div className="text-[13px] text-ink-2">{relativeDay(nextSession.d)} · {formatDateTime(nextSession.d)}</div></> : <div className="text-[13px] text-muted">کلاس فعالی ندارید.</div>}
            <Button size="sm" variant="ghost" className="mt-auto justify-start px-0" onPress={() => navigate('/portal/classes')}>کلاس‌های من<ArrowLeft /></Button>
          </Card>
          <Card className="gap-2 p-5">
            <div className="flex items-center gap-2 text-[13px] text-muted"><Ticket className="size-4" />آزمون ماک بعدی</div>
            {nextMock ? <><div className="text-[15px] font-bold">{formatDate(nextMock.session.at)}</div><div className="text-[13px] text-ink-2">{relativeDay(nextMock.session.at)} · کد {nextMock.b.code}</div></> : <div className="text-[13px] text-muted">رزرو فعالی ندارید.</div>}
            <Button size="sm" variant="ghost" className="mt-auto justify-start px-0" onPress={() => navigate(nextMock ? '/portal/mock' : '/portal/mock/book')}>{nextMock ? 'آزمون‌های من' : 'رزرو آزمون'}<ArrowLeft /></Button>
          </Card>
          <Card className="gap-2 p-5">
            <div className="flex items-center gap-2 text-[13px] text-muted"><FileText className="size-4" />آخرین نتیجه ماک</div>
            {lastResult ? <><div className="flex items-center gap-2"><BandBadge band={bookingScores(lastResult, s.mockSessions.find((m) => m.id === lastResult.sessionId)).overall} /><span className="text-[13px] text-ink-2">Overall</span></div><div className="text-[13px] text-muted">{formatDay(lastResult.releasedAt!)}</div></> : <div className="text-[13px] text-muted">هنوز نتیجه‌ای ندارید.</div>}
            {lastResult ? <Button size="sm" variant="ghost" className="mt-auto justify-start px-0" onPress={() => navigate(`/portal/mock/${lastResult.id}/result`)}>کارنامه<ArrowLeft /></Button> : null}
          </Card>
          <Card className={cn('gap-2 p-5', nextDue && invoiceState(nextDue.i) === 'overdue' && 'border-danger')}>
            <div className="flex items-center gap-2 text-[13px] text-muted"><Receipt className="size-4" />پرداخت بعدی</div>
            {nextDue ? <><div className="text-[15px] font-bold tabular">{toman(Math.min(nextDue.inst.amount, balanceOf(nextDue.i)))}</div><div className={cn('text-[13px]', invoiceState(nextDue.i) === 'overdue' ? 'font-semibold text-danger' : 'text-ink-2')}>{nextDue.i.title} · {relativeDay(nextDue.inst.due)}</div></> : <div className="text-[13px] text-muted">پرداخت معوقی ندارید.</div>}
            <Button size="sm" variant="ghost" className="mt-auto justify-start px-0" onPress={() => navigate('/portal/payments')}>پرداخت‌ها<ArrowLeft /></Button>
          </Card>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="تکلیف‌های پیش رو">
            {homework.length ? <ul className="grid gap-2">{homework.map((h) => <li key={h.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"><div><div className="text-sm font-semibold">{h.title}</div><div className="text-xs text-muted">{s.classes.find((c) => c.id === h.classId)?.code} · {h.detail}</div></div><Chip size="sm" variant="soft">{relativeDay(h.due)}</Chip></li>)}</ul> : <p className="text-[13px] text-muted">تکلیف تازه‌ای ندارید.</p>}
          </Section>
          <Section title="دسترسی سریع">
            <div className="grid grid-cols-2 gap-2">
              {[{ to: '/portal/enroll', label: 'ثبت‌نام ترم جدید', icon: Calendar }, { to: '/portal/corrections/new', label: 'ارسال رایتینگ برای تصحیح', icon: Pencil }, { to: '/portal/placement', label: 'تعیین سطح آنلاین', icon: GraduationCap }, { to: '/portal/grades', label: 'کارنامه‌ها', icon: FileText }].map((l) => (
                <button key={l.to} type="button" onClick={() => navigate(l.to)} className="flex items-center gap-2.5 rounded-xl border border-border p-3 text-start text-[13.5px] font-semibold outline-none hover:bg-default focus-visible:ring-2 focus-visible:ring-focus"><l.icon className="size-4 text-accent" />{l.label}</button>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </Page>
  );
}

export function StudentEnrollPage() {
  const me = useSessionUser() as Student;
  const { search } = useLocation();
  return (
    <Page width="narrow">
      <PageHeader title="ثبت‌نام ترم جدید" description="دوره و کلاس را انتخاب کنید؛ با پرداخت، ثبت‌نام همان لحظه قطعی می‌شود." />
      <EnrollWizard key={search} student={me} by="student" />
    </Page>
  );
}

export function StudentClassesPage() {
  const s = useApp();
  const me = useSessionUser() as Student;
  const navigate = useNavigate();
  const rows = s.enrollments.filter((e) => e.studentId === me.id && ['held', 'confirmed', 'waitlisted'].includes(enrollmentStatus(e))).map((e) => ({ e, cls: s.classes.find((c) => c.id === e.classId)! }));
  const past = s.enrollments.filter((e) => e.studentId === me.id && e.status === 'completed');
  return (
    <Page>
      <PageHeader title="کلاس‌های من" actions={<Button onPress={() => navigate('/portal/enroll')}><Calendar />ثبت‌نام ترم جدید</Button>} />
      {rows.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map(({ e, cls }) => {
            const term = s.terms.find((t) => t.id === cls.termId)!;
            return (
              <Card key={e.id} className="gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div><div className="font-bold">{levelTitle(cls.levelId)}</div><div className="text-[13px] text-muted">{cls.code} · {term.title} · {FORMAT_LABEL[cls.format]}</div></div>
                  <MetaChip meta={ENROLLMENT_META[enrollmentStatus(e)]} />
                </div>
                <div className="text-[13px] text-ink-2">{daysLabel(cls.days)} · {timeRange(cls.start, cls.minutes)} · استاد {s.teachers.find((t) => t.id === cls.teacherId)?.name}</div>
                <div className="flex justify-end border-t border-separator pt-3"><Button size="sm" variant="ghost" onPress={() => navigate(`/portal/classes/${e.id}`)}>جزئیات کلاس<ArrowLeft /></Button></div>
              </Card>
            );
          })}
        </div>
      ) : <Card><Empty icon={GraduationCap} title="در کلاسی ثبت‌نام نکرده‌اید" action={<Button size="sm" onPress={() => navigate('/portal/enroll')}>ثبت‌نام</Button>} /></Card>}
      {past.length ? <p className="mt-6 text-[13px] text-muted">{faNumber(past.length)} دوره گذرانده‌اید؛ کارنامه‌ها در بخش «کارنامه‌ها» است.</p> : null}
    </Page>
  );
}

export function StudentClassPage() {
  const { id } = useParams();
  const s = useApp();
  const me = useSessionUser() as Student;
  const navigate = useNavigate();
  const cancelEnrollment = useApp((st) => st.cancelEnrollment);
  const [online, setOnline] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [pay, setPay] = useState(false);
  const e = s.enrollments.find((x) => x.id === id && x.studentId === me.id);
  if (!e) return <Navigate to="/portal/classes" replace />;
  const cls = s.classes.find((c) => c.id === e.classId)!;
  const term = s.terms.find((t) => t.id === cls.termId)!;
  const sessions = classSessions(s, cls);
  const status = enrollmentStatus(e);
  const started = termState(term) !== 'registration' && Date.now() >= new Date(term.start).getTime();
  const hw = s.homework.filter((h) => h.classId === cls.id);
  return (
    <Page>
      <PageHeader title={`${levelTitle(cls.levelId)} · ${cls.code}`} badge={<MetaChip meta={ENROLLMENT_META[status]} />} crumbs={[{ label: 'کلاس‌های من', href: '/portal/classes' }, { label: cls.code }]}
        actions={<div className="flex flex-wrap gap-2">
          {status === 'held' ? <Button onPress={() => setPay(true)}>پرداخت</Button> : null}
          {cls.format === 'online' && status === 'confirmed' ? <Button onPress={() => setOnline(true)}><Display />ورود به کلاس آنلاین</Button> : null}
          {['held', 'confirmed', 'waitlisted'].includes(status) && !started ? <Button variant="ghost" className="text-danger" onPress={() => setCancel(true)}>انصراف</Button> : null}
        </div>} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Section title="جلسه‌ها و حضور" flush>
          <ul className="max-h-[480px] overflow-y-auto">
            {sessions.map((d, i) => {
              const sheet = s.attendance.find((a) => a.classId === cls.id && a.session === i + 1);
              const mark = sheet?.marks[me.id];
              return (
                <li key={i} className="flex items-center justify-between gap-3 border-b border-separator px-5 py-2.5 text-[13px] last:border-0">
                  <span><span className="font-semibold tabular">جلسه {faNumber(i + 1)}</span> · {formatDateTime(d)}</span>
                  {mark ? <Chip size="sm" variant="soft" color={MARK_META[mark].tone as 'success'}>{MARK_META[mark].label}</Chip> : <span className="text-xs text-muted">{d.getTime() > Date.now() ? 'آینده' : '—'}</span>}
                </li>
              );
            })}
          </ul>
        </Section>
        <div className="grid content-start gap-4">
          <Section title="مشخصات">
            <dl className="grid gap-2 text-[13px]">
              <div className="flex justify-between"><dt className="text-muted">ترم</dt><dd className="font-semibold">{term.title}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">برنامه</dt><dd className="font-semibold">{daysLabel(cls.days)} · {timeRange(cls.start, cls.minutes)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">استاد</dt><dd className="font-semibold">{s.teachers.find((t) => t.id === cls.teacherId)?.name}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">محل</dt><dd className="font-semibold">{s.rooms.find((r) => r.id === cls.roomId)?.name ?? 'آنلاین'}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">نمره تا امروز</dt><dd className="font-semibold tabular">{faNumber(gradePartial(e.grade))} از ۱۰۰</dd></div>
            </dl>
          </Section>
          <Section title="تکلیف‌ها">
            {hw.length ? <ul className="grid gap-2">{hw.map((h) => <li key={h.id} className="rounded-lg border border-border px-3 py-2"><div className="text-sm font-semibold">{h.title}</div><div className="text-xs text-muted">مهلت {formatDay(h.due)} · {h.detail}</div></li>)}</ul> : <p className="text-[13px] text-muted">تکلیفی ثبت نشده است.</p>}
          </Section>
        </div>
      </div>
      <FormDialog isOpen={online} onOpenChange={setOnline} icon={<Video />} title="کلاس آنلاین" description="در نسخه واقعی، این دکمه شما را مستقیم به اتاق کلاس آنلاین می‌برد؛ فقط زبان‌آموزان ثبت‌نام‌شده اجازه ورود دارند." footer={<Button slot="close">بستن</Button>}>
        <div className="rounded-lg bg-surface-secondary p-3 text-[13px]"><bdi className="ltr">{cls.onlineUrl}</bdi></div>
      </FormDialog>
      <ConfirmDialog isOpen={cancel} onOpenChange={setCancel} title="انصراف از کلاس؟" description={status === 'confirmed' ? 'شهریه طبق قانون انصراف پیش از شروع ترم بازگردانده می‌شود. اگر کسی در لیست انتظار باشد، صندلی به او پیشنهاد می‌شود.' : 'رزرو شما لغو می‌شود.'} confirmLabel="ثبت انصراف"
        onConfirm={() => { cancelEnrollment(e.id, 'انصراف زبان‌آموز', me.id); setCancel(false); toast.success('انصراف ثبت شد'); navigate('/portal/classes'); }} />
      <PaymentDialog invoiceId={e.invoiceId} isOpen={pay} onOpenChange={setPay} heldUntil={e.heldUntil} />
    </Page>
  );
}

export function StudentPlacementPage() {
  const me = useSessionUser() as Student;
  const updateStudent = useApp((s) => s.updateStudent);
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const correct = PLACEMENT.filter((q) => answers[q.id] === q.answer).length;
  const result = placementResult(correct);
  const teen = 1405 - me.birthYear < 18;
  const submit = () => { setDone(true); updateStudent(me.id, { levelId: teen ? result.teens : result.adults }); };
  if (done)
    return (
      <Page width="narrow">
        <Card className="items-center gap-3 p-8 text-center">
          <CircleCheck className="size-10 text-success" />
          <h1 className="text-xl font-extrabold">سطح پیشنهادی: {levelTitle(teen ? result.teens : result.adults)}</h1>
          <p className="text-sm leading-7 text-muted">{faNumber(correct)} پاسخ درست از {faNumber(PLACEMENT.length)} · معادل CEFR {result.cefr}. کلاس‌های همین سطح در ثبت‌نام علامت‌گذاری شده‌اند. پذیرش در صورت نیاز سطح را با یک گفت‌وگوی کوتاه تأیید می‌کند.</p>
          <Button onPress={() => navigate('/portal/enroll')}>انتخاب کلاس<ArrowLeft /></Button>
        </Card>
      </Page>
    );
  return (
    <Page width="narrow">
      <PageHeader title="تعیین سطح آنلاین" description="۱۵ سؤال از آسان به سخت. اگر جواب را نمی‌دانید، حدس نزنید؛ سؤال را رها کنید." />
      <div className="grid gap-3">
        {PLACEMENT.map((q, i) => (
          <Card key={q.id} className="gap-2 p-4">
            <div className="exam-text text-[15px]"><b>{i + 1}.</b> {q.prompt}</div>
            <RadioGroup aria-label={`سؤال ${i + 1}`} value={answers[q.id] != null ? String(answers[q.id]) : ''} onChange={(v) => setAnswers({ ...answers, [q.id]: Number(v) })} orientation="horizontal" className="ltr flex flex-wrap gap-4">
              {q.options.map((o, oi) => <Radio key={o} value={String(oi)}><Radio.Control><Radio.Indicator /></Radio.Control><Radio.Content className="text-[14.5px]">{o}</Radio.Content></Radio>)}
            </RadioGroup>
          </Card>
        ))}
        <Button size="lg" onPress={submit}>ثبت و دیدن سطح ({faNumber(Object.keys(answers).length)} از {faNumber(PLACEMENT.length)} پاسخ)</Button>
      </div>
    </Page>
  );
}

export function StudentGradesPage() {
  const me = useSessionUser() as Student;
  const enrollments = useApp(useShallow((s) => s.enrollments.filter((e) => e.studentId === me.id && e.grade && ['confirmed', 'completed'].includes(e.status))));
  const sorted = [...enrollments].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <Page width="narrow">
      <PageHeader title="کارنامه‌ها" description="کارنامه هر ترم پس از تأیید آموزش منتشر می‌شود. نمره‌های کلاس جاری تا پیش از پایان ترم ناقص است." actions={<Button variant="secondary" className="no-print" onPress={() => window.print()}>چاپ</Button>} />
      {sorted.length ? <div className="grid gap-4">{sorted.map((e) => <ReportCard key={e.id} enrollment={e} />)}</div> : <Card><Empty icon={FileText} title="هنوز کارنامه‌ای ندارید" /></Card>}
    </Page>
  );
}

export function StudentPaymentsPage() {
  const me = useSessionUser() as Student;
  const invoices = useApp(useShallow((s) => s.invoices.filter((i) => i.studentId === me.id)));
  const balance = invoices.filter((i) => ['unpaid', 'partial', 'overdue'].includes(invoiceState(i))).reduce((sum, i) => sum + balanceOf(i), 0);
  const overdue = invoices.some((i) => invoiceState(i) === 'overdue');
  return (
    <Page>
      <PageHeader title="پرداخت‌ها" description={balance ? `مانده قابل پرداخت: ${toman(balance)}` : 'همه فاکتورها تسویه شده‌اند.'} />
      {overdue ? <Alert status="danger" className="mb-4"><Alert.Content><Alert.Description>سررسید یکی از اقساط گذشته است. لطفاً پرداخت کنید یا با پذیرش تماس بگیرید.</Alert.Description></Alert.Content></Alert> : null}
      <InvoiceList invoices={invoices} />
    </Page>
  );
}

const KIND_ICON = { book: Book, file: FileText, audio: VolumeFill, video: Video };

export function StudentResourcesPage() {
  const me = useSessionUser() as Student;
  const resources = useApp((s) => s.resources);
  const buyBook = useApp((s) => s.buyBook);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  return (
    <Page>
      <PageHeader title="منابع و کتاب" description="کتاب‌ها پس از پرداخت در پذیرش آموزشگاه تحویل داده می‌شوند." />
      <div className="grid gap-3 md:grid-cols-2">
        {resources.map((r) => {
          const Icon = KIND_ICON[r.kind];
          return (
            <Card key={r.id} className="flex-row items-start gap-4 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-default text-ink-2"><Icon className="size-5" /></span>
              <div className="min-w-0 flex-1"><div className="text-sm font-bold">{r.title}</div><div className="text-[13px] text-muted">{r.description}</div></div>
              {r.kind === 'book' ? (
                r.stock ? <Button size="sm" onPress={() => setInvoiceId(buyBook(me.id, r.id))}>خرید {toman(r.price ?? 0)}</Button> : <Chip size="sm" variant="soft" color="warning">ناموجود</Chip>
              ) : <Button size="sm" variant="secondary" onPress={() => toast('در نمونه اولیه فایل واقعی وجود ندارد')}>دریافت</Button>}
            </Card>
          );
        })}
      </div>
      <PaymentDialog invoiceId={invoiceId ?? undefined} isOpen={Boolean(invoiceId)} onOpenChange={(o) => !o && setInvoiceId(null)} allowInstallments={false} />
    </Page>
  );
}

export function StudentProfilePage() {
  const me = useSessionUser() as Student;
  const parent = useApp((s) => s.parents.find((p) => p.id === me.parentId));
  const updateStudent = useApp((s) => s.updateStudent);
  const [name, setName] = useState(me.name);
  const [email, setEmail] = useState(me.email ?? '');
  const [nid, setNid] = useState(me.nationalId ?? '');
  const nidError = useMemo(() => (nid ? nationalIdError(nid) : ''), [nid]);
  return (
    <Page width="narrow">
      <PageHeader title="حساب کاربری" />
      <div className="grid gap-4">
        <Section title="مشخصات">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="نام و نام خانوادگی" value={name} onChange={setName} />
            <TextInput label="شماره موبایل" value={me.mobile} onChange={() => undefined} description="برای تغییر شماره با پذیرش تماس بگیرید." inputMode="tel" />
            <TextInput label="کد ملی (اختیاری)" value={nid} onChange={setNid} inputMode="numeric" maxLength={10} error={nidError} description="برای صدور گواهی پایان دوره لازم است." />
            <TextInput label="ایمیل (اختیاری)" value={email} onChange={setEmail} ltr type="email" />
          </div>
          <Button className="mt-4" isDisabled={Boolean(nidError) || name.trim().length < 3} onPress={() => { updateStudent(me.id, { name: name.trim(), email: email.trim() || undefined, nationalId: onlyDigits(nid) || undefined }); toast.success('مشخصات ذخیره شد'); }}>ذخیره</Button>
        </Section>
        {parent ? (
          <Section title="ولی">
            <p className="text-[13.5px] text-ink-2">{parent.name} · <bdi className="tabular">{parent.mobile}</bdi> — حضور، نمره و پرداخت‌های شما را در پنل والدین می‌بیند.</p>
          </Section>
        ) : null}
      </div>
    </Page>
  );
}
