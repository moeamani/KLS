import { Plus, Persons, TriangleExclamation } from '@gravity-ui/icons';
import { Alert, Button, Chip, SearchField, Tabs, toast } from '@heroui/react';
import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { BandBadge } from '@/components/ui/Band';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmDialog, FormDialog } from '@/components/ui/Dialog';
import { Empty } from '@/components/ui/Empty';
import { NumberInput, SelectField, TextAreaField, TextInput } from '@/components/ui/Fields';
import { Page, PageHeader, Section } from '@/components/ui/Page';
import { PersonCell } from '@/components/ui/Person';
import { MetaChip, ToneChip } from '@/components/ui/StatusChip';
import { PaymentDialog } from '@/features/enroll/Payment';
import { InvoiceList } from '@/features/enroll/Records';
import { COURSES, courseById, FORMAT_LABEL, levelTitle } from '@/data/catalog';
import { BOOKING_META, bookingStatus, CLASS_META, ENROLLMENT_META, enrollmentStatus, TERM_META, termState, type EffectiveEnrollment } from '@/data/status';
import { addDays, formatDate, formatDay, iso, relativeTime } from '@/lib/dates';
import { faNumber, onlyDigits, toman } from '@/lib/format';
import { conflictsFor, daysLabel, timeRange, WEEKDAYS } from '@/lib/schedule';
import { mobileError } from '@/lib/validation';
import { useApp, useSessionUser } from '@/store/app';
import { attendanceSummary, bookingScores, classInfo, classSessions, gradeTotal, rosterOf, waitlistOf } from '@/store/selectors';
import type { ClassFormat, Staff, Weekday } from '@/types';

const useStaff = () => useSessionUser() as Staff;

export function AdminClassesPage() {
  const s = useApp();
  const me = useStaff();
  const saveClass = useApp((st) => st.saveClass);
  const saveTerm = useApp((st) => st.saveTerm);
  const navigate = useNavigate();
  const terms = [...s.terms].sort((a, b) => b.start.localeCompare(a.start));
  const [termId, setTermId] = useState(terms.find((t) => termState(t) === 'registration')?.id ?? terms[0].id);
  const [courseFilter, setCourseFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [termOpen, setTermOpen] = useState(false);
  const [term, setTerm] = useState({ title: '', startDays: '120', weeks: '11' });
  const [form, setForm] = useState({ courseId: 'adults', levelId: 'a1', teacherId: 'te3', roomId: 'r1', format: 'in_person' as ClassFormat, days: [0, 2] as Weekday[], start: '17:00', capacity: 12 });
  const rows = s.classes.filter((c) => c.termId === termId && (courseFilter === 'all' || c.courseId === courseFilter)).map((c) => classInfo(s, c));
  const course = courseById(form.courseId)!;
  const candidate = { ...form, termId, roomId: form.format === 'online' ? undefined : form.roomId, minutes: course.minutes, sessions: course.sessions, price: course.priceUnit === 'session' ? course.price * course.sessions : course.price };
  const conflicts = conflictsFor(candidate, s.classes);
  const room = s.rooms.find((r) => r.id === form.roomId);
  const overRoom = form.format !== 'online' && room && form.capacity > room.capacity;
  const canEdit = me.role === 'manager';
  return (
    <Page width="wide">
      <PageHeader title="ترم‌ها و کلاس‌ها" description="هر کلاس در یک ترم، با استاد، اتاق یا لینک، روز و ساعت. پیش از ذخیره، تداخل استاد و اتاق بررسی می‌شود."
        actions={canEdit ? <><Button variant="secondary" onPress={() => setTermOpen(true)}>ترم جدید</Button><Button onPress={() => setOpen(true)}><Plus />کلاس جدید</Button></> : null} />
      <Tabs selectedKey={termId} onSelectionChange={(k) => setTermId(String(k))} variant="secondary">
        <Tabs.ListContainer><Tabs.List aria-label="ترم‌ها" className="mb-4">{terms.map((t) => <Tabs.Tab key={t.id} id={t.id}>{t.title} <MetaChip meta={TERM_META[termState(t)]} /><Tabs.Indicator /></Tabs.Tab>)}</Tabs.List></Tabs.ListContainer>
      </Tabs>
      <DataTable label="کلاس‌ها" rows={rows} getId={(r) => r.cls.id} href={(r) => `/admin/classes/${r.cls.id}`} minWidth={1000}
        header={<SelectField label="دوره" hideLabel value={courseFilter} onChange={setCourseFilter} options={[{ id: 'all', label: 'همه دوره‌ها' }, ...COURSES.map((c) => ({ id: c.id, label: c.title }))]} className="w-56" />}
        empty={<Empty icon={Persons} title="کلاسی برای این ترم تعریف نشده است" />}
        columns={[
          { key: 'code', label: 'کلاس', render: (r) => <div><div className="font-semibold">{r.cls.code}</div><div className="text-xs text-muted">{r.course.title} · {r.level}</div></div> },
          { key: 'time', label: 'برنامه', render: (r) => <span className="text-[13px]">{daysLabel(r.cls.days)} · {timeRange(r.cls.start, r.cls.minutes)}</span> },
          { key: 'teacher', label: 'استاد', render: (r) => r.teacher?.name },
          { key: 'room', label: 'محل', render: (r) => r.room?.name ?? FORMAT_LABEL[r.cls.format] },
          { key: 'seats', label: 'ثبت‌نام', render: (r) => <span className="tabular">{faNumber(r.taken)} / {faNumber(r.cls.capacity)}{r.waitlist ? <span className="ms-1 text-xs text-warning-soft-foreground">+{faNumber(r.waitlist)} انتظار</span> : null}</span> },
          { key: 'grades', label: 'نمره‌ها', render: (r) => { const roster = rosterOf(s, r.cls.id); const sub = roster.some((x) => x.enrollment.grade?.status === 'submitted'); const rel = roster.length && roster.every((x) => x.enrollment.grade?.status === 'released'); return sub ? <Chip size="sm" variant="soft" color="warning">در انتظار تأیید</Chip> : rel ? <Chip size="sm" variant="soft" color="success">منتشر شد</Chip> : <span className="text-muted">—</span>; } },
          { key: 'state', label: 'وضعیت', render: (r) => <MetaChip meta={CLASS_META[r.state]} /> },
        ]} />
      <FormDialog isOpen={open} onOpenChange={setOpen} size="lg" title="کلاس جدید" description={s.terms.find((t) => t.id === termId)?.title}
        footer={<><Button variant="tertiary" slot="close">انصراف</Button><Button isDisabled={conflicts.length > 0 || Boolean(overRoom) || !form.days.length} onPress={() => { const id = saveClass(candidate, me.id); setOpen(false); toast.success('کلاس ایجاد شد'); navigate(`/admin/classes/${id}`); }}>ایجاد کلاس</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="دوره" value={form.courseId} onChange={(v) => setForm({ ...form, courseId: v, levelId: courseById(v)!.levels[0].id })} options={COURSES.map((c) => ({ id: c.id, label: c.title }))} />
          <SelectField label="سطح" value={form.levelId} onChange={(v) => setForm({ ...form, levelId: v })} options={course.levels.map((l) => ({ id: l.id, label: l.title, description: l.cefr }))} />
          <SelectField label="استاد" value={form.teacherId} onChange={(v) => setForm({ ...form, teacherId: v })} options={s.teachers.filter((t) => t.status === 'active').map((t) => ({ id: t.id, label: t.name }))} />
          <SelectField label="نوع کلاس" value={form.format} onChange={(v) => setForm({ ...form, format: v as ClassFormat })} options={(Object.keys(FORMAT_LABEL) as ClassFormat[]).map((f) => ({ id: f, label: FORMAT_LABEL[f] }))} />
          {form.format !== 'online' ? <SelectField label="اتاق" value={form.roomId} onChange={(v) => setForm({ ...form, roomId: v })} options={s.rooms.map((r) => ({ id: r.id, label: r.name, description: `ظرفیت ${faNumber(r.capacity)}` }))} /> : null}
          <SelectField label="ساعت شروع" value={form.start} onChange={(v) => setForm({ ...form, start: v })} options={['09:00', '10:00', '11:00', '14:00', '16:00', '16:30', '17:00', '18:00', '18:30', '20:00'].map((t) => ({ id: t, label: t }))} />
          <NumberInput label="ظرفیت" value={form.capacity} onChange={(v) => setForm({ ...form, capacity: v })} min={1} max={30} />
          <div className="grid content-start gap-2 sm:col-span-2">
            <span className="text-sm font-medium">روزها</span>
            <div className="flex flex-wrap gap-1.5">{WEEKDAYS.map((d, i) => <button key={d} type="button" aria-pressed={form.days.includes(i as Weekday)} onClick={() => setForm({ ...form, days: form.days.includes(i as Weekday) ? form.days.filter((x) => x !== i) : [...form.days, i as Weekday].sort() })} className={`rounded-lg border px-3 py-1.5 text-[13px] font-semibold ${form.days.includes(i as Weekday) ? 'border-accent bg-accent-soft text-accent-soft-foreground' : 'border-border text-ink-2'}`}>{d}</button>)}</div>
          </div>
          <div className="sm:col-span-2 text-[13px] text-muted">{faNumber(course.sessions)} جلسه {faNumber(course.minutes)} دقیقه‌ای · {timeRange(form.start, course.minutes)} · شهریه {toman(candidate.price)}</div>
          {conflicts.length ? (
            <Alert status="danger" className="sm:col-span-2"><Alert.Indicator><TriangleExclamation /></Alert.Indicator><Alert.Content><Alert.Title>تداخل برنامه</Alert.Title><Alert.Description>{conflicts.map((c) => `${c.kind === 'teacher' ? 'استاد' : 'اتاق'} در همین ساعت کلاس ${c.other.code} را دارد.`).join(' ')}</Alert.Description></Alert.Content></Alert>
          ) : null}
          {overRoom ? <Alert status="warning" className="sm:col-span-2"><Alert.Content><Alert.Description>ظرفیت کلاس از ظرفیت {room!.name} ({faNumber(room!.capacity)} نفر) بیشتر است.</Alert.Description></Alert.Content></Alert> : null}
        </div>
      </FormDialog>
      <FormDialog isOpen={termOpen} onOpenChange={setTermOpen} title="ترم جدید" footer={<><Button variant="tertiary" slot="close">انصراف</Button><Button isDisabled={term.title.trim().length < 3} onPress={() => { const start = addDays(new Date(), Number(term.startDays)); saveTerm({ title: term.title.trim(), start: iso(start), end: iso(addDays(start, Number(term.weeks) * 7)), regOpen: iso(addDays(start, -35)), regClose: iso(addDays(start, 5)) }, me.id); setTermOpen(false); toast.success('ترم ایجاد شد'); }}>ایجاد</Button></>}>
        <div className="grid gap-4">
          <TextInput label="عنوان" value={term.title} onChange={(v) => setTerm({ ...term, title: v })} placeholder="مثلاً بهار ۱۴۰۶" />
          <SelectField label="شروع کلاس‌ها" value={term.startDays} onChange={(v) => setTerm({ ...term, startDays: v })} options={[90, 120, 150].map((d) => ({ id: String(d), label: formatDate(addDays(new Date(), d)) }))} description="ثبت‌نام ۳۵ روز پیش از شروع باز و ۵ روز پس از شروع بسته می‌شود." />
          <SelectField label="مدت" value={term.weeks} onChange={(v) => setTerm({ ...term, weeks: v })} options={[8, 10, 11, 12].map((w) => ({ id: String(w), label: `${faNumber(w)} هفته` }))} />
        </div>
      </FormDialog>
    </Page>
  );
}

export function AdminClassPage() {
  const { id } = useParams();
  const s = useApp();
  const me = useStaff();
  const releaseGrades = useApp((st) => st.releaseGrades);
  const cancelClass = useApp((st) => st.cancelClass);
  const holdEnrollment = useApp((st) => st.holdEnrollment);
  const transfer = useApp((st) => st.transferEnrollment);
  const [cancel, setCancel] = useState(false);
  const [reason, setReason] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [payFor, setPayFor] = useState<string | null>(null);
  const cls = s.classes.find((c) => c.id === id);
  if (!cls) return <Navigate to="/admin/classes" replace />;
  const info = classInfo(s, cls);
  const roster = rosterOf(s, cls.id);
  const waitlist = waitlistOf(s, cls.id);
  const submitted = roster.some((r) => r.enrollment.grade?.status === 'submitted');
  const enrolledIds = new Set(s.enrollments.filter((e) => e.classId === cls.id && ['held', 'confirmed', 'waitlisted'].includes(enrollmentStatus(e))).map((e) => e.studentId));
  const sessions = classSessions(s, cls);
  return (
    <Page width="wide">
      <PageHeader title={`${cls.code} · ${info.level}`} badge={<MetaChip meta={CLASS_META[info.state]} />} description={`${info.term?.title} · ${info.course.title} · ${daysLabel(cls.days)} ${timeRange(cls.start, cls.minutes)} · ${info.room?.name ?? 'آنلاین'} · استاد ${info.teacher?.name}`} crumbs={[{ label: 'ترم‌ها و کلاس‌ها', href: '/admin/classes' }, { label: cls.code }]}
        actions={<div className="flex flex-wrap gap-2">
          {submitted && me.role === 'manager' ? <Button onPress={() => { releaseGrades(cls.id, me.id); toast.success('کارنامه‌ها منتشر شد', { description: 'زبان‌آموزان و والدین اعلان گرفتند.' }); }}>تأیید و انتشار کارنامه</Button> : null}
          {['open', 'full', 'upcoming'].includes(info.state) ? <Button variant="secondary" onPress={() => setAddOpen(true)}>ثبت‌نام حضوری</Button> : null}
          {!cls.cancelled && me.role === 'manager' && info.state !== 'finished' ? <Button variant="ghost" className="text-danger" onPress={() => setCancel(true)}>لغو کلاس</Button> : null}
        </div>} />
      <div className="grid gap-4">
        <DataTable label="زبان‌آموزان" rows={roster} getId={(r) => r.enrollment.id} href={(r) => `/admin/students/${r.student.id}`} minWidth={860} empty={<Empty icon={Persons} title="هنوز کسی ثبت‌نام نکرده است" />}
          columns={[
            { key: 'name', label: 'زبان‌آموز', render: (r) => <PersonCell name={r.student.name} sub={r.student.mobile} /> },
            { key: 'att', label: `حضور (${faNumber(sessions.filter((d) => d.getTime() < Date.now()).length)} جلسه)`, render: (r) => { const a = attendanceSummary(s, cls.id, r.student.id); return <span className="text-[13px]">{faNumber(a.present + a.late)} حاضر · <span className={a.absent >= s.settings.absenceAlert ? 'font-bold text-danger' : ''}>{faNumber(a.absent)} غیبت</span></span>; } },
            { key: 'grade', label: 'نمره', render: (r) => { const t = gradeTotal(r.enrollment.grade); return t != null ? <span className={t < s.settings.grades.pass ? 'font-bold text-danger tabular' : 'font-bold tabular'}>{faNumber(t)}</span> : <span className="text-muted">—</span>; } },
            { key: 'gs', label: 'کارنامه', render: (r) => r.enrollment.grade ? <ToneChip tone={r.enrollment.grade.status === 'released' ? 'success' : r.enrollment.grade.status === 'submitted' ? 'warning' : 'default'}>{({ draft: 'پیش‌نویس', submitted: 'در انتظار تأیید', released: 'منتشرشده' } as const)[r.enrollment.grade.status]}</ToneChip> : null },
            { key: 'by', label: 'ثبت‌نام', render: (r) => <span className="text-xs text-muted">{r.enrollment.by === 'reception' ? 'حضوری' : r.enrollment.by === 'parent' ? 'والدین' : 'آنلاین'} · {formatDay(r.enrollment.createdAt)}</span> },
          ]} />
        {waitlist.length ? (
          <Section title="لیست انتظار" description="با آزاد شدن صندلی، اولین نفر خودکار ۲۴ ساعت فرصت پرداخت می‌گیرد. اگر کلاس دیگری مناسب است، او را منتقل کنید." flush>
            <DataTable flat label="لیست انتظار" rows={waitlist} getId={(e) => e.id}
              columns={[
                { key: 'n', label: 'نوبت', render: (e) => faNumber(waitlist.indexOf(e) + 1) },
                { key: 'name', label: 'زبان‌آموز', render: (e) => s.students.find((x) => x.id === e.studentId)?.name },
                { key: 'at', label: 'زمان', render: (e) => relativeTime(e.createdAt) },
                { key: 'move', label: '', render: (e) => <SelectField label="انتقال به" hideLabel value={null} placeholder="انتقال به کلاس…" onChange={(v) => { const r = transfer(e.id, v, me.id); if (r.ok) toast.success('منتقل شد'); else toast.danger(r.error); }} options={s.classes.filter((c) => c.termId === cls.termId && c.courseId === cls.courseId && c.id !== cls.id && !c.cancelled).map((c) => ({ id: c.id, label: `${c.code} · ${levelTitle(c.levelId)}` }))} className="w-56" /> },
              ]} />
          </Section>
        ) : null}
      </div>
      <FormDialog isOpen={addOpen} onOpenChange={setAddOpen} title="ثبت‌نام حضوری" description={`${cls.code} · ${toman(cls.price)}`} footer={<><Button variant="tertiary" slot="close">انصراف</Button><Button isDisabled={!studentId} onPress={() => { const r = holdEnrollment(studentId!, cls.id, 'reception'); if (!r.ok) return toast.danger(r.error); setAddOpen(false); setPayFor(s.enrollments.find((e) => e.id === r.id)?.invoiceId ?? useApp.getState().enrollments.find((e) => e.id === r.id)?.invoiceId ?? null); }}>ادامه و دریافت شهریه</Button></>}>
        <SelectField label="زبان‌آموز" value={studentId} onChange={setStudentId} options={s.students.filter((x) => !enrolledIds.has(x.id)).map((x) => ({ id: x.id, label: x.name, description: x.mobile }))} />
      </FormDialog>
      <PaymentDialog invoiceId={payFor ?? undefined} isOpen={Boolean(payFor)} onOpenChange={(o) => !o && setPayFor(null)} staff />
      <ConfirmDialog isOpen={cancel} onOpenChange={setCancel} title="لغو کلاس؟" description={`ثبت‌نام ${faNumber(roster.length)} نفر لغو و شهریه کامل بازگردانده می‌شود. همه پیامک می‌گیرند.`} confirmLabel="لغو کلاس" isConfirmDisabled={reason.trim().length < 5} onConfirm={() => { cancelClass(cls.id, reason.trim(), me.id); setCancel(false); toast.success('کلاس لغو شد'); }}>
        <TextAreaField label="دلیل" value={reason} onChange={setReason} rows={2} />
      </ConfirmDialog>
    </Page>
  );
}

export function AdminStudentsPage() {
  const s = useApp();
  const register = useApp((st) => st.registerStudent);
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', mobile: '', birthYear: '1380', parentMobile: '' });
  const rows = useMemo(() => s.students.filter((x) => !q || x.name.includes(q) || x.mobile.includes(onlyDigits(q) || '@@')).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [s.students, q]);
  const minor = 1405 - Number(form.birthYear) < 18;
  const err = form.name.trim().length < 3 || mobileError(form.mobile) || (minor && mobileError(form.parentMobile));
  return (
    <Page width="wide">
      <PageHeader title="زبان‌آموزان" description={`${faNumber(s.students.length)} زبان‌آموز`} actions={<Button onPress={() => setOpen(true)}><Plus />زبان‌آموز جدید</Button>} />
      <DataTable label="زبان‌آموزان" rows={rows} getId={(x) => x.id} href={(x) => `/admin/students/${x.id}`} minWidth={860}
        header={<SearchField value={q} onChange={setQ} aria-label="جست‌وجو" className="min-w-[240px] flex-1"><SearchField.Group><SearchField.SearchIcon /><SearchField.Input placeholder="نام یا موبایل" /><SearchField.ClearButton /></SearchField.Group></SearchField>}
        columns={[
          { key: 'name', label: 'زبان‌آموز', render: (x) => <PersonCell name={x.name} sub={<bdi className="tabular">{x.mobile}</bdi>} /> },
          { key: 'age', label: 'سن', render: (x) => <span className="tabular">{faNumber(1405 - x.birthYear)}</span> },
          { key: 'classes', label: 'کلاس فعال', render: (x) => { const e = s.enrollments.filter((en) => en.studentId === x.id && en.status === 'confirmed').map((en) => s.classes.find((c) => c.id === en.classId)?.code); return <span className="text-[13px]">{e.join('، ') || '—'}</span>; } },
          { key: 'mock', label: 'آخرین ماک', render: (x) => { const b = s.bookings.filter((bk) => bk.studentId === x.id && bk.status === 'released').sort((a, c) => (c.releasedAt ?? '').localeCompare(a.releasedAt ?? ''))[0]; return b ? <BandBadge band={bookingScores(b, s.mockSessions.find((m) => m.id === b.sessionId)).overall} /> : <span className="text-muted">—</span>; } },
          { key: 'source', label: 'ثبت', render: (x) => <span className="text-xs text-muted">{x.source === 'reception' ? 'حضوری' : 'آنلاین'} · {formatDay(x.createdAt)}</span> },
        ]} />
      <FormDialog isOpen={open} onOpenChange={setOpen} title="زبان‌آموز جدید" footer={<><Button variant="tertiary" slot="close">انصراف</Button><Button isDisabled={Boolean(err)} onPress={() => { const id = register({ name: form.name.trim(), mobile: onlyDigits(form.mobile), birthYear: Number(form.birthYear), parentMobile: minor ? onlyDigits(form.parentMobile) : undefined }); useApp.getState().updateStudent(id, { source: 'reception' }); setOpen(false); toast.success('زبان‌آموز ثبت شد'); navigate(`/admin/students/${id}`); }}>ثبت</Button></>}>
        <div className="grid gap-4">
          <TextInput label="نام و نام خانوادگی" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <TextInput label="موبایل" value={form.mobile} onChange={(v) => setForm({ ...form, mobile: v })} inputMode="tel" maxLength={11} error={form.mobile ? mobileError(form.mobile) : ''} />
          <SelectField label="سال تولد" value={form.birthYear} onChange={(v) => setForm({ ...form, birthYear: v })} options={Array.from({ length: 50 }, (_, i) => String(1400 - i)).map((y) => ({ id: y, label: faNumber(Number(y)) }))} />
          {minor ? <TextInput label="موبایل ولی" value={form.parentMobile} onChange={(v) => setForm({ ...form, parentMobile: v })} inputMode="tel" maxLength={11} description="برای زبان‌آموز زیر ۱۸ سال، حساب والدین ساخته می‌شود." /> : null}
        </div>
      </FormDialog>
    </Page>
  );
}

export function AdminStudentPage() {
  const { id } = useParams();
  const s = useApp();
  const me = useStaff();
  const cancelEnrollment = useApp((st) => st.cancelEnrollment);
  const navigate = useNavigate();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const student = s.students.find((x) => x.id === id);
  if (!student) return <Navigate to="/admin/students" replace />;
  const parent = s.parents.find((p) => p.id === student.parentId);
  const enrollments = s.enrollments.filter((e) => e.studentId === student.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const bookings = s.bookings.filter((b) => b.studentId === student.id);
  const invoices = s.invoices.filter((i) => i.studentId === student.id);
  return (
    <Page width="wide">
      <PageHeader title={student.name} description={`${student.mobile} · متولد ${faNumber(student.birthYear)}${student.levelId ? ` · سطح ${levelTitle(student.levelId)}` : ''}${parent ? ` · ولی: ${parent.name} (${parent.mobile})` : ''}`} crumbs={[{ label: 'زبان‌آموزان', href: '/admin/students' }, { label: student.name }]} />
      <div className="grid gap-4">
        <Section title="ثبت‌نام‌ها" flush>
          <DataTable flat label="ثبت‌نام‌ها" rows={enrollments} getId={(e) => e.id} minWidth={760} empty={<div className="py-6 text-center text-[13px] text-muted">ثبت‌نامی ندارد.</div>}
            columns={[
              { key: 'cls', label: 'کلاس', render: (e) => { const c = s.classes.find((x) => x.id === e.classId)!; return <button type="button" className="text-start" onClick={() => navigate(`/admin/classes/${c.id}`)}><div className="font-semibold text-link">{c.code}</div><div className="text-xs text-muted">{levelTitle(c.levelId)}</div></button>; } },
              { key: 'term', label: 'ترم', render: (e) => s.terms.find((t) => t.id === s.classes.find((c) => c.id === e.classId)?.termId)?.title },
              { key: 'status', label: 'وضعیت', render: (e) => <MetaChip meta={ENROLLMENT_META[enrollmentStatus(e)]} /> },
              { key: 'grade', label: 'نمره', render: (e) => (gradeTotal(e.grade) != null ? faNumber(gradeTotal(e.grade)!) : '—') },
              { key: 'act', label: '', render: (e) => (['held', 'confirmed', 'waitlisted'].includes(enrollmentStatus(e)) ? <Button size="sm" variant="ghost" className="text-danger" onPress={() => setCancelId(e.id)}>انصراف</Button> : null) },
            ]} />
        </Section>
        <Section title="آزمون‌های ماک" flush>
          <DataTable flat label="آزمون‌ها" rows={bookings} getId={(b) => b.id} href={(b) => `/admin/bookings/${b.id}`} empty={<div className="py-6 text-center text-[13px] text-muted">آزمونی ندارد.</div>}
            columns={[
              { key: 'code', label: 'کد', render: (b) => <span className="tabular">{b.code}</span> },
              { key: 'session', label: 'جلسه', render: (b) => s.mockSessions.find((m) => m.id === b.sessionId)?.title },
              { key: 'status', label: 'وضعیت', render: (b) => <MetaChip meta={BOOKING_META[bookingStatus(b)]} /> },
              { key: 'overall', label: 'نمره کل', render: (b) => <BandBadge band={bookingScores(b, s.mockSessions.find((m) => m.id === b.sessionId)).overall} /> },
            ]} />
        </Section>
        <div>
          <h2 className="mb-3 text-[15px] font-bold">فاکتورها</h2>
          <InvoiceList invoices={invoices} staff />
        </div>
      </div>
      <ConfirmDialog isOpen={Boolean(cancelId)} onOpenChange={(o) => !o && setCancelId(null)} title="ثبت انصراف؟" description="صندلی آزاد می‌شود و اگر کسی در لیست انتظار باشد، به او پیشنهاد می‌شود. بازپرداخت از صندوق تأییدها انجام می‌شود." confirmLabel="ثبت انصراف" onConfirm={() => { cancelEnrollment(cancelId!, 'انصراف از طریق پذیرش', me.id); setCancelId(null); toast.success('انصراف ثبت شد'); }} />
    </Page>
  );
}

const ENROLLMENT_FILTERS: (EffectiveEnrollment | 'all')[] = ['all', 'held', 'expired', 'confirmed', 'waitlisted', 'cancelled', 'transferred', 'completed'];

export function AdminEnrollmentsPage() {
  const s = useApp();
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') ?? 'all') as EffectiveEnrollment | 'all';
  const rows = s.enrollments.filter((e) => status === 'all' || enrollmentStatus(e) === status).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 200);
  return (
    <Page width="wide">
      <PageHeader title="ثبت‌نام‌ها" description="همه ثبت‌نام‌ها، رزروهای در انتظار پرداخت و لیست‌های انتظار." />
      <DataTable label="ثبت‌نام‌ها" rows={rows} getId={(e) => e.id} href={(e) => `/admin/students/${e.studentId}`} minWidth={880}
        header={<SelectField label="وضعیت" hideLabel value={status} onChange={(v) => setParams(v === 'all' ? {} : { status: v })} options={ENROLLMENT_FILTERS.map((x) => ({ id: x, label: x === 'all' ? 'همه وضعیت‌ها' : ENROLLMENT_META[x].label }))} className="w-52" />}
        columns={[
          { key: 'name', label: 'زبان‌آموز', render: (e) => s.students.find((x) => x.id === e.studentId)?.name },
          { key: 'cls', label: 'کلاس', render: (e) => { const c = s.classes.find((x) => x.id === e.classId)!; return <span>{c.code} <span className="text-xs text-muted">· {levelTitle(c.levelId)}</span></span>; } },
          { key: 'term', label: 'ترم', render: (e) => s.terms.find((t) => t.id === s.classes.find((c) => c.id === e.classId)?.termId)?.title },
          { key: 'by', label: 'روش', render: (e) => ({ student: 'آنلاین', parent: 'والدین', reception: 'حضوری' })[e.by] },
          { key: 'status', label: 'وضعیت', render: (e) => <MetaChip meta={ENROLLMENT_META[enrollmentStatus(e)]} /> },
          { key: 'at', label: 'زمان', render: (e) => <span className="text-xs text-muted">{relativeTime(e.createdAt)}</span> },
        ]} />
    </Page>
  );
}

export function AdminTeachersPage() {
  const s = useApp();
  const SKILL = { kids: 'کودکان', general: 'عمومی', ielts: 'آیلتس', examiner: 'ممتحن', ttc: 'TTC' };
  const monthAgo = Date.now() - 30 * 86_400_000;
  const rows = s.teachers.map((t) => {
    const sheets = s.attendance.filter((a) => s.classes.find((c) => c.id === a.classId)?.teacherId === t.id && new Date(a.date).getTime() > monthAgo);
    return { t, classes: s.classes.filter((c) => c.teacherId === t.id && termState(s.terms.find((x) => x.id === c.termId)!) !== 'finished' && !c.cancelled), sessions: sheets.length, grading: s.bookings.filter((b) => b.writingExaminerId === t.id && !b.writing && b.status === 'awaiting_grading').length + s.corrections.filter((c) => c.examinerId === t.id && c.status === 'in_review').length };
  });
  return (
    <Page width="wide">
      <PageHeader title="استادها" description="بار کاری، مهارت‌ها و نرخ حق‌التدریس. حق‌التدریس ماهانه در بخش مالی محاسبه می‌شود." />
      <DataTable label="استادها" rows={rows} getId={(r) => r.t.id} minWidth={900}
        columns={[
          { key: 'name', label: 'استاد', render: (r) => <PersonCell name={r.t.name} sub={<bdi className="tabular">{r.t.mobile}</bdi>} /> },
          { key: 'skills', label: 'مهارت‌ها', render: (r) => <div className="flex flex-wrap gap-1">{r.t.skills.map((k) => <Chip key={k} size="sm" variant="soft">{SKILL[k]}</Chip>)}</div> },
          { key: 'classes', label: 'کلاس‌های فعال', render: (r) => <span className="text-[13px]">{r.classes.map((c) => c.code).join('، ') || '—'}</span> },
          { key: 'sessions', label: 'جلسه در ۳۰ روز', render: (r) => <span className="tabular">{faNumber(r.sessions)}</span> },
          { key: 'grading', label: 'در صف تصحیح', render: (r) => (r.grading ? <Chip size="sm" variant="soft" color="warning">{faNumber(r.grading)}</Chip> : <span className="text-muted">—</span>) },
          { key: 'rate', label: 'نرخ هر جلسه', render: (r) => <span className="tabular text-[13px]">{toman(r.t.ratePerSession)}</span> },
        ]} />
    </Page>
  );
}
