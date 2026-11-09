import { ArrowLeft, Calendar, CircleCheck, GraduationCap, Microphone, Pencil, Plus } from '@gravity-ui/icons';
import { Alert, Button, Card, cn, Tabs, toast } from '@heroui/react';
import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { DataTable } from '@/components/ui/DataTable';
import { FormDialog } from '@/components/ui/Dialog';
import { Empty } from '@/components/ui/Empty';
import { SelectField, TextAreaField, TextInput } from '@/components/ui/Fields';
import { Page, PageHeader, Section } from '@/components/ui/Page';
import { PersonCell } from '@/components/ui/Person';
import { MetaChip } from '@/components/ui/StatusChip';
import { APPROVAL_META, CLASS_META, MARK_META } from '@/data/status';
import { addDays, longDate, formatDate, formatDateTime, formatDay, formatTime, iso } from '@/lib/dates';
import { faNumber } from '@/lib/format';
import { daysLabel, timeRange } from '@/lib/schedule';
import { useApp, useSessionUser } from '@/store/app';
import { classInfo, classSessions, gradePartial, gradeTotal, rosterOf } from '@/store/selectors';
import type { GradeSheet, Mark, Teacher } from '@/types';

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

export function TeacherHome() {
  const s = useApp();
  const me = useSessionUser() as Teacher;
  const navigate = useNavigate();
  const myClasses = s.classes.filter((c) => c.teacherId === me.id && !c.cancelled).map((c) => classInfo(s, c));
  const todays = myClasses.flatMap((row) => classSessions(s, row.cls).map((d, i) => ({ row, d, n: i + 1 })).filter(({ d }) => sameDay(d, new Date())));
  const upcoming = myClasses.filter((r) => r.state === 'running').flatMap((row) => classSessions(s, row.cls).map((d, i) => ({ row, d, n: i + 1 })).filter(({ d }) => d.getTime() > Date.now())).sort((a, b) => a.d.getTime() - b.d.getTime()).slice(0, 5);
  const writing = s.bookings.filter((b) => b.writingExaminerId === me.id && !b.writing && b.status === 'awaiting_grading').length;
  const speakingSlots = s.mockSessions.flatMap((m) => m.slots.filter((x) => x.examinerId === me.id && x.bookingId && new Date(x.at).getTime() > Date.now() - 6 * 3600_000).map((x) => ({ x, m }))).filter(({ x }) => { const b = s.bookings.find((bk) => bk.id === x.bookingId); return b && !b.speaking && !b.speakingNoShow; }).sort((a, b) => a.x.at.localeCompare(b.x.at)).slice(0, 5);
  return (
    <Page>
      <PageHeader title={me.name} description={longDate()} />
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="gap-1 p-5"><div className="text-[13px] text-muted">کلاس امروز</div><div className="text-[28px] font-extrabold tabular">{faNumber(todays.length)}</div></Card>
          <Card className="gap-1 p-5"><div className="text-[13px] text-muted">رایتینگ در صف شما</div><div className="text-[28px] font-extrabold tabular">{faNumber(writing)}</div><Button size="sm" variant="ghost" className="justify-start px-0" onPress={() => navigate('/teacher/grading')}>صف تصحیح<ArrowLeft /></Button></Card>
          <Card className="gap-1 p-5"><div className="text-[13px] text-muted">اسپیکینگ پیش رو</div><div className="text-[28px] font-extrabold tabular">{faNumber(speakingSlots.length)}</div></Card>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="جلسه‌های پیش رو">
            {upcoming.length ? <ul className="grid gap-2">{upcoming.map(({ row, d, n }) => (
              <li key={`${row.cls.id}-${n}`} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
                <div><div className="text-sm font-semibold">{row.cls.code} · جلسه {faNumber(n)}</div><div className="text-xs text-muted">{formatDateTime(d)} · {row.room?.name ?? 'آنلاین'}</div></div>
                <Button size="sm" variant="secondary" onPress={() => navigate(`/teacher/classes/${row.cls.id}?session=${n}`)}>حضور و غیاب</Button>
              </li>
            ))}</ul> : <p className="text-[13px] text-muted">جلسه‌ای در پیش ندارید.</p>}
          </Section>
          <Section title="اسپیکینگ‌های پیش رو">
            {speakingSlots.length ? <ul className="grid gap-2">{speakingSlots.map(({ x, m }) => {
              const b = s.bookings.find((bk) => bk.id === x.bookingId)!;
              return (
                <li key={x.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
                  <div className="flex items-center gap-3"><Microphone className="size-4 text-accent" /><div><div className="text-sm font-semibold">{s.students.find((st) => st.id === b.studentId)?.name}</div><div className="text-xs text-muted">{formatDay(x.at)} · {formatTime(x.at)} · {m.title}</div></div></div>
                  <Button size="sm" variant="secondary" onPress={() => navigate(`/teacher/grading/speaking/${b.id}`)}>ثبت نمره</Button>
                </li>
              );
            })}</ul> : <p className="text-[13px] text-muted">اسپیکینگی برای شما برنامه‌ریزی نشده است.</p>}
          </Section>
        </div>
      </div>
    </Page>
  );
}

export function TeacherClassesPage() {
  const s = useApp();
  const me = useSessionUser() as Teacher;
  const rows = s.classes.filter((c) => c.teacherId === me.id).map((c) => classInfo(s, c)).sort((a, b) => (b.term?.start ?? '').localeCompare(a.term?.start ?? ''));
  return (
    <Page width="wide">
      <PageHeader title="کلاس‌های من" />
      <DataTable label="کلاس‌ها" rows={rows} getId={(r) => r.cls.id} href={(r) => `/teacher/classes/${r.cls.id}`} empty={<Empty icon={GraduationCap} title="کلاسی به شما سپرده نشده است" />}
        columns={[
          { key: 'code', label: 'کلاس', render: (r) => <div><div className="font-semibold">{r.cls.code}</div><div className="text-xs text-muted">{r.level}</div></div> },
          { key: 'term', label: 'ترم', render: (r) => r.term?.title },
          { key: 'time', label: 'برنامه', render: (r) => <span className="text-[13px]">{daysLabel(r.cls.days)} · {timeRange(r.cls.start, r.cls.minutes)}</span> },
          { key: 'room', label: 'محل', render: (r) => r.room?.name ?? 'آنلاین' },
          { key: 'seats', label: 'زبان‌آموز', render: (r) => <span className="tabular">{faNumber(r.taken)} / {faNumber(r.cls.capacity)}</span> },
          { key: 'state', label: 'وضعیت', render: (r) => <MetaChip meta={CLASS_META[r.state]} /> },
        ]} />
    </Page>
  );
}

const MARKS: Mark[] = ['present', 'late', 'absent', 'excused'];

export function TeacherClassPage() {
  const { id } = useParams();
  const s = useApp();
  const me = useSessionUser() as Teacher;
  const saveAttendance = useApp((st) => st.saveAttendance);
  const saveGrade = useApp((st) => st.saveGrade);
  const submitGrades = useApp((st) => st.submitGrades);
  const addHomework = useApp((st) => st.addHomework);
  const cls = s.classes.find((c) => c.id === id && c.teacherId === me.id);
  const sessions = useMemo(() => (cls ? classSessions(s, cls) : []), [s, cls]);
  const params = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
  const defaultSession = Number(params.get('session')) || Math.max(1, sessions.filter((d) => d.getTime() <= Date.now() + 3 * 3600_000).length);
  const [session, setSession] = useState(String(defaultSession));
  const [tab, setTab] = useState('attendance');
  const [draft, setDraft] = useState<Record<string, Mark> | null>(null);
  const [hwOpen, setHwOpen] = useState(false);
  const [hw, setHw] = useState({ title: '', detail: '', days: '7' });
  if (!cls) return <Navigate to="/teacher/classes" replace />;
  const info = classInfo(s, cls);
  const roster = rosterOf(s, cls.id);
  const n = Number(session);
  const date = sessions[n - 1];
  const sheet = s.attendance.find((a) => a.classId === cls.id && a.session === n);
  const marks = draft ?? sheet?.marks ?? Object.fromEntries(roster.map(({ student }) => [student.id, 'present' as Mark]));
  const future = date && date.getTime() > Date.now() + 3 * 3600_000;
  const w = s.settings.grades;
  const submitted = roster.some(({ enrollment }) => enrollment.grade?.status === 'submitted' || enrollment.grade?.status === 'released');
  const homework = s.homework.filter((h) => h.classId === cls.id);

  const gradeCell = (enrollmentId: string, g: GradeSheet | undefined, key: 'activity' | 'homework' | 'midterm' | 'final', max: number) => (
    <input type="number" min={0} max={max} aria-label={key} disabled={submitted} value={g?.[key] ?? ''} onChange={(e) => { const v = e.target.value === '' ? null : Math.max(0, Math.min(max, Number(e.target.value))); saveGrade(enrollmentId, { [key]: v }); }}
      className="w-16 rounded-md border border-line-strong bg-surface px-2 py-1 text-center text-sm tabular outline-none focus:border-focus disabled:bg-default" />
  );

  return (
    <Page width="wide">
      <PageHeader title={`${info.level} · ${cls.code}`} description={`${info.term?.title} · ${daysLabel(cls.days)} ${timeRange(cls.start, cls.minutes)} · ${info.room?.name ?? 'آنلاین'} · ${faNumber(roster.length)} زبان‌آموز`} crumbs={[{ label: 'کلاس‌های من', href: '/teacher/classes' }, { label: cls.code }]} badge={<MetaChip meta={CLASS_META[info.state]} />} />
      <Tabs selectedKey={tab} onSelectionChange={(k) => setTab(String(k))} variant="secondary">
        <Tabs.ListContainer>
          <Tabs.List aria-label="بخش‌های کلاس" className="mb-4">
            <Tabs.Tab id="attendance">حضور و غیاب<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="grades">نمره‌ها<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="homework">تکلیف‌ها<Tabs.Indicator /></Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel id="attendance">
          <Section title="ثبت حضور" actions={<SelectField label="جلسه" hideLabel value={session} onChange={(v) => { setSession(v); setDraft(null); }} options={sessions.map((d, i) => ({ id: String(i + 1), label: `جلسه ${faNumber(i + 1)} · ${formatDay(d)}` }))} className="w-56" />} flush>
            {future ? <Alert status="accent" className="mx-5 mb-3"><Alert.Content><Alert.Description>این جلسه هنوز برگزار نشده است ({date ? formatDateTime(date) : ''}). حضور را در روز کلاس ثبت کنید.</Alert.Description></Alert.Content></Alert> : null}
            <ul>
              {roster.map(({ student }) => (
                <li key={student.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-separator px-5 py-2.5">
                  <PersonCell name={student.name} sub={s.attendance.filter((a) => a.classId === cls.id && a.marks[student.id] === 'absent').length ? `${faNumber(s.attendance.filter((a) => a.classId === cls.id && a.marks[student.id] === 'absent').length)} غیبت در ترم` : undefined} />
                  <div className="flex gap-1" role="radiogroup" aria-label={`حضور ${student.name}`}>
                    {MARKS.map((m) => (
                      <button key={m} type="button" role="radio" aria-checked={marks[student.id] === m} disabled={future} onClick={() => setDraft({ ...marks, [student.id]: m })}
                        className={cn('rounded-md border px-2.5 py-1 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50', marks[student.id] === m ? (m === 'present' ? 'border-success bg-success-soft text-success-soft-foreground' : m === 'absent' ? 'border-danger bg-danger-soft text-danger' : m === 'late' ? 'border-warning bg-warning-soft text-warning-soft-foreground' : 'border-line-strong bg-default') : 'border-border text-ink-2 hover:bg-default')}>
                        {MARK_META[m].label}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between gap-3 border-t border-separator px-5 py-3">
              <span className="text-xs text-muted">{sheet ? `آخرین ثبت: ${formatDateTime(sheet.at)}` : 'برای این جلسه هنوز حضوری ثبت نشده است.'} غیبت به ولی پیامک می‌شود.</span>
              <Button isDisabled={future || !roster.length} onPress={() => { saveAttendance(cls.id, n, date ? iso(date) : iso(new Date()), marks, me.id); setDraft(null); toast.success(`حضور جلسه ${faNumber(n)} ثبت شد`); }}><CircleCheck />ثبت حضور</Button>
            </div>
          </Section>
        </Tabs.Panel>
        <Tabs.Panel id="grades">
          {submitted ? <Alert status="success" className="mb-4"><Alert.Content><Alert.Description>نمره‌ها برای تأیید آموزش ارسال شده و دیگر قابل ویرایش نیست.</Alert.Description></Alert.Content></Alert> : null}
          <DataTable label="نمره‌ها" rows={roster} getId={(r) => r.enrollment.id} minWidth={820}
            columns={[
              { key: 'name', label: 'زبان‌آموز', render: (r) => <PersonCell name={r.student.name} /> },
              { key: 'activity', label: `فعالیت (${faNumber(w.activity)})`, render: (r) => gradeCell(r.enrollment.id, r.enrollment.grade, 'activity', w.activity) },
              { key: 'homework', label: `تکلیف (${faNumber(w.homework)})`, render: (r) => gradeCell(r.enrollment.id, r.enrollment.grade, 'homework', w.homework) },
              { key: 'midterm', label: `میان‌ترم (${faNumber(w.midterm)})`, render: (r) => gradeCell(r.enrollment.id, r.enrollment.grade, 'midterm', w.midterm) },
              { key: 'final', label: `پایان‌ترم (${faNumber(w.final)})`, render: (r) => gradeCell(r.enrollment.id, r.enrollment.grade, 'final', w.final) },
              { key: 'total', label: 'جمع', render: (r) => { const t = gradeTotal(r.enrollment.grade); return <span className={cn('font-bold tabular', t != null && t < w.pass && 'text-danger')}>{t != null ? faNumber(t) : `${faNumber(gradePartial(r.enrollment.grade))}…`}</span>; } },
            ]}
            footer={!submitted ? (
              <div className="flex items-center justify-between gap-3 border-t border-separator px-5 py-3">
                <span className="text-xs text-muted">نمره‌ها خودکار ذخیره می‌شوند. پس از ثبت پایان‌ترم، برای تأیید آموزش ارسال کنید.</span>
                <Button isDisabled={roster.some((r) => gradeTotal(r.enrollment.grade) == null)} onPress={() => { submitGrades(cls.id, me.id); toast.success('نمره‌ها برای تأیید ارسال شد'); }}>ارسال برای تأیید</Button>
              </div>
            ) : undefined} />
        </Tabs.Panel>
        <Tabs.Panel id="homework">
          <Section title="تکلیف‌ها" actions={<Button size="sm" onPress={() => setHwOpen(true)}><Plus />تکلیف جدید</Button>}>
            {homework.length ? <ul className="grid gap-2">{homework.map((h) => <li key={h.id} className="rounded-lg border border-border px-3 py-2.5"><div className="text-sm font-semibold">{h.title}</div><div className="text-xs text-muted">مهلت {formatDate(h.due)} · {h.detail}</div></li>)}</ul> : <Empty icon={Pencil} title="تکلیفی ثبت نشده است" />}
          </Section>
        </Tabs.Panel>
      </Tabs>
      <FormDialog isOpen={hwOpen} onOpenChange={setHwOpen} title="تکلیف جدید" description="زبان‌آموزان و والدین اعلان می‌گیرند." footer={<><Button variant="tertiary" slot="close">انصراف</Button><Button isDisabled={hw.title.trim().length < 3} onPress={() => { addHomework(cls.id, hw.title.trim(), iso(addDays(new Date(), Number(hw.days) || 7)), hw.detail.trim()); setHwOpen(false); setHw({ title: '', detail: '', days: '7' }); toast.success('تکلیف ثبت شد'); }}>ثبت</Button></>}>
        <div className="grid gap-4">
          <TextInput label="عنوان" value={hw.title} onChange={(v) => setHw({ ...hw, title: v })} />
          <TextAreaField label="توضیح" value={hw.detail} onChange={(v) => setHw({ ...hw, detail: v })} rows={3} />
          <SelectField label="مهلت" value={hw.days} onChange={(v) => setHw({ ...hw, days: v })} options={[['2', 'جلسه بعد'], ['7', 'یک هفته'], ['14', 'دو هفته']].map(([id, label]) => ({ id, label }))} />
        </div>
      </FormDialog>
    </Page>
  );
}

export function TeacherLeavePage() {
  const s = useApp();
  const me = useSessionUser() as Teacher;
  const requestLeave = useApp((st) => st.requestLeave);
  const [from, setFrom] = useState('1');
  const [days, setDays] = useState('1');
  const [reason, setReason] = useState('');
  const leaves = s.leaves.filter((l) => l.teacherId === me.id);
  return (
    <Page width="narrow">
      <PageHeader title="مرخصی" description="درخواست به صندوق تأیید مدیر آموزشگاه می‌رود. برای جلسه‌های این روزها، کلاس جبرانی هماهنگ می‌شود." />
      <div className="grid gap-4">
        <Section title="درخواست جدید">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="از" value={from} onChange={setFrom} options={[1, 2, 3, 5, 7, 10, 14].map((d) => ({ id: String(d), label: formatDate(addDays(new Date(), d)) }))} />
            <SelectField label="مدت" value={days} onChange={setDays} options={[1, 2, 3, 5].map((d) => ({ id: String(d), label: `${faNumber(d)} روز` }))} />
            <TextAreaField label="دلیل" value={reason} onChange={setReason} rows={2} className="sm:col-span-2" />
          </div>
          <Button className="mt-4" isDisabled={reason.trim().length < 3} onPress={() => { const start = addDays(new Date(), Number(from)); requestLeave(me.id, iso(start), iso(addDays(start, Number(days) - 1)), reason.trim()); setReason(''); toast.success('درخواست مرخصی ثبت شد'); }}><Calendar />ثبت درخواست</Button>
        </Section>
        <Section title="درخواست‌های من" flush>
          {leaves.length ? leaves.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-3 border-t border-separator px-5 py-3 first:border-0">
              <div><div className="text-sm font-semibold">{formatDay(l.from)}{l.to !== l.from ? ` تا ${formatDay(l.to)}` : ''}</div><div className="text-xs text-muted">{l.reason}</div></div>
              <MetaChip meta={APPROVAL_META[l.status]} />
            </div>
          )) : <Empty title="درخواستی ثبت نکرده‌اید" />}
        </Section>
      </div>
    </Page>
  );
}
