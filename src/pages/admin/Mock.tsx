import { Plus, Ticket } from '@gravity-ui/icons';
import { Alert, Button, Checkbox, Chip, Label, SearchField, toast } from '@heroui/react';
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
import { Timeline } from '@/components/ui/Timeline';
import { ResultReport } from '@/features/mock/Results';
import { MOCK_TESTS } from '@/data/mockTests';
import { BOOKING_META, bookingStatus, CORRECTION_META, DELIVERY_LABEL, MODULE_LABEL, TASK_LABEL, type EffectiveBooking } from '@/data/status';
import { addDays, formatDate, formatDateTime, formatDay, formatTime, iso, relativeTime } from '@/lib/dates';
import { faNumber, toman } from '@/lib/format';
import { questionsOf } from '@/lib/ielts';
import { useApp, useSessionUser } from '@/store/app';
import { bookingScores, MOCK_SESSION_META, mockSessionState, sessionSeats } from '@/store/selectors';
import type { MockBooking, MockDelivery, MockModule, Staff } from '@/types';

function useStaff() { return useSessionUser() as Staff; }

export function AdminMockSessionsPage() {
  const s = useApp();
  const me = useStaff();
  const save = useApp((st) => st.saveMockSession);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const examiners = s.teachers.filter((t) => t.skills.includes('examiner'));
  const [form, setForm] = useState({ title: 'آزمون ماک', days: '14', time: '09:00', capacity: 24, price: 1_900_000, academic: true, general: true, center: true, online: false, slotCount: 16, examiners: examiners.map((e) => e.id) });
  const rows = [...s.mockSessions].sort((a, b) => b.at.localeCompare(a.at));
  const create = () => {
    const at = addDays(new Date(), Number(form.days));
    const [h, m] = form.time.split(':').map(Number);
    at.setHours(h, m, 0, 0);
    const modules = [form.academic && 'academic', form.general && 'general'].filter(Boolean) as MockModule[];
    const deliveries = [form.center && 'center', form.online && 'online'].filter(Boolean) as MockDelivery[];
    const id = save({ title: form.title.trim(), at: iso(at), modules, deliveries, testIds: { academic: 'test-a-ac', general: 'test-a-gt' }, capacity: form.capacity, price: form.price, regClose: iso(addDays(at, -2)), slotCount: form.slotCount, examiners: form.examiners }, me.id);
    setOpen(false);
    toast.success('جلسه آزمون ایجاد شد', { description: 'در سایت و پنل زبان‌آموزان قابل رزرو است.' });
    navigate(`/admin/mock/${id}`);
  };
  const valid = form.title.trim().length > 2 && (form.academic || form.general) && (form.center || form.online) && form.examiners.length > 0;
  return (
    <Page width="wide">
      <PageHeader title="جلسات آزمون ماک" description="هر جلسه یک تاریخ آزمون کتبی با ظرفیت، قیمت و زمان‌های اسپیکینگ است." actions={me.role === 'manager' ? <Button onPress={() => setOpen(true)}><Plus />جلسه جدید</Button> : null} />
      <DataTable label="جلسات" rows={rows} getId={(m) => m.id} href={(m) => `/admin/mock/${m.id}`} minWidth={900}
        columns={[
          { key: 'title', label: 'جلسه', render: (m) => <div><div className="font-semibold">{m.title}</div><div className="text-xs text-muted">{m.modules.map((x) => MODULE_LABEL[x]).join('، ')} · {m.deliveries.map((d) => DELIVERY_LABEL[d]).join('، ')}</div></div> },
          { key: 'at', label: 'تاریخ', render: (m) => <span className="text-[13px]">{formatDate(m.at)} · {formatTime(m.at)}</span> },
          { key: 'seats', label: 'ظرفیت', render: (m) => { const seats = sessionSeats(s, m); return <span className="tabular">{faNumber(seats.taken)} / {faNumber(m.capacity)}</span>; } },
          { key: 'price', label: 'قیمت', render: (m) => <span className="tabular text-[13px]">{toman(m.price)}</span> },
          { key: 'pending', label: 'تصحیح / انتشار', render: (m) => { const bs = s.bookings.filter((b) => b.sessionId === m.id); const a = bs.filter((b) => b.status === 'awaiting_grading').length; const g = bs.filter((b) => b.status === 'graded').length; return a || g ? <span className="text-[13px]">{a ? `${faNumber(a)} در تصحیح` : ''}{a && g ? ' · ' : ''}{g ? <b className="text-warning-soft-foreground">{faNumber(g)} آماده انتشار</b> : ''}</span> : <span className="text-muted">—</span>; } },
          { key: 'state', label: 'وضعیت', render: (m) => <MetaChip meta={MOCK_SESSION_META[mockSessionState(s, m)]} /> },
        ]} />
      <FormDialog isOpen={open} onOpenChange={setOpen} size="lg" title="جلسه آزمون جدید" footer={<><Button variant="tertiary" slot="close">انصراف</Button><Button isDisabled={!valid} onPress={create}>ایجاد جلسه</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="عنوان" value={form.title} onChange={(v) => setForm({ ...form, title: v })} className="sm:col-span-2" />
          <SelectField label="تاریخ" value={form.days} onChange={(v) => setForm({ ...form, days: v })} options={[7, 10, 14, 21, 28, 35].map((d) => ({ id: String(d), label: formatDate(addDays(new Date(), d)) }))} />
          <SelectField label="ساعت شروع" value={form.time} onChange={(v) => setForm({ ...form, time: v })} options={['08:30', '09:00', '14:00', '16:00'].map((t) => ({ id: t, label: t }))} />
          <NumberInput label="ظرفیت" value={form.capacity} onChange={(v) => setForm({ ...form, capacity: v })} min={4} max={60} />
          <NumberInput label="قیمت (تومان)" value={form.price} onChange={(v) => setForm({ ...form, price: v })} min={0} step={100_000} />
          <div className="grid gap-2"><Label>ماژول</Label><div className="flex gap-4"><Checkbox isSelected={form.academic} onChange={(v) => setForm({ ...form, academic: v })}><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control><Checkbox.Content>آکادمیک</Checkbox.Content></Checkbox><Checkbox isSelected={form.general} onChange={(v) => setForm({ ...form, general: v })}><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control><Checkbox.Content>جنرال</Checkbox.Content></Checkbox></div></div>
          <div className="grid gap-2"><Label>برگزاری</Label><div className="flex gap-4"><Checkbox isSelected={form.center} onChange={(v) => setForm({ ...form, center: v })}><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control><Checkbox.Content>در آموزشگاه</Checkbox.Content></Checkbox><Checkbox isSelected={form.online} onChange={(v) => setForm({ ...form, online: v })}><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control><Checkbox.Content>آنلاین</Checkbox.Content></Checkbox></div></div>
          <NumberInput label="تعداد زمان اسپیکینگ" value={form.slotCount} onChange={(v) => setForm({ ...form, slotCount: v })} min={1} max={60} description="هر زمان ۱۵ دقیقه؛ از ۴ ساعت پس از شروع آزمون کتبی." />
          <div className="grid content-start gap-2"><Label>ممتحن‌ها</Label>{examiners.map((e) => <Checkbox key={e.id} isSelected={form.examiners.includes(e.id)} onChange={(v) => setForm({ ...form, examiners: v ? [...form.examiners, e.id] : form.examiners.filter((x) => x !== e.id) })}><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control><Checkbox.Content>{e.name}</Checkbox.Content></Checkbox>)}</div>
        </div>
      </FormDialog>
    </Page>
  );
}

function ScoreCells({ b }: { b: MockBooking }) {
  const session = useApp((s) => s.mockSessions.find((m) => m.id === b.sessionId));
  const sc = bookingScores(b, session);
  return <span className="ltr flex items-center gap-1"><BandBadge band={sc.listening?.band} /><BandBadge band={sc.reading?.band} /><BandBadge band={sc.writing} /><BandBadge band={sc.speaking} /></span>;
}

export function AdminMockSessionPage() {
  const { id } = useParams();
  const s = useApp();
  const me = useStaff();
  const release = useApp((st) => st.releaseResults);
  const markNoShow = useApp((st) => st.markNoShow);
  const cancelSession = useApp((st) => st.cancelMockSession);
  const navigate = useNavigate();
  const [cancel, setCancel] = useState(false);
  const [reason, setReason] = useState('');
  const session = s.mockSessions.find((m) => m.id === id);
  if (!session) return <Navigate to="/admin/mock" replace />;
  const state = mockSessionState(s, session);
  const bookings = s.bookings.filter((b) => b.sessionId === session.id).sort((a, b) => a.code.localeCompare(b.code));
  const graded = bookings.filter((b) => b.status === 'graded');
  const started = Date.now() >= new Date(session.at).getTime();
  const name = (sid: string) => s.students.find((x) => x.id === sid)?.name ?? '';
  return (
    <Page width="wide">
      <PageHeader title={session.title} badge={<MetaChip meta={MOCK_SESSION_META[state]} />} description={`${formatDateTime(session.at)} · ${faNumber(sessionSeats(s, session).taken)} از ${faNumber(session.capacity)} صندلی · ${toman(session.price)}`} crumbs={[{ label: 'جلسات آزمون', href: '/admin/mock' }, { label: session.title }]}
        actions={<div className="flex flex-wrap gap-2">
          {graded.length ? <Button onPress={() => { release(graded.map((b) => b.id), me.id); toast.success(`نتیجه ${faNumber(graded.length)} نفر منتشر شد`, { description: 'پیامک برای زبان‌آموزان ارسال شد.' }); }}>انتشار {faNumber(graded.length)} نتیجه آماده</Button> : null}
          {!session.cancelled && !started && me.role === 'manager' ? <Button variant="ghost" className="text-danger" onPress={() => setCancel(true)}>لغو جلسه</Button> : null}
        </div>} />
      {session.cancelled ? <Alert status="danger" className="mb-4"><Alert.Content><Alert.Description>{session.note}</Alert.Description></Alert.Content></Alert> : null}
      <div className="grid gap-4">
        <DataTable label="رزروها" rows={bookings} getId={(b) => b.id} href={(b) => `/admin/bookings/${b.id}`} minWidth={1000} empty={<Empty icon={Ticket} title="هنوز رزروی ثبت نشده است" />}
          columns={[
            { key: 'code', label: 'کد', render: (b) => <span className="font-semibold tabular">{b.code}</span> },
            { key: 'name', label: 'زبان‌آموز', render: (b) => <PersonCell name={name(b.studentId)} sub={`${MODULE_LABEL[b.module]} · ${b.delivery === 'online' ? 'آنلاین' : 'حضوری'}`} /> },
            { key: 'status', label: 'وضعیت', render: (b) => <MetaChip meta={BOOKING_META[bookingStatus(b)]} /> },
            { key: 'scores', label: 'L · R · W · S', render: (b) => <ScoreCells b={b} /> },
            { key: 'overall', label: 'کل', render: (b) => <BandBadge band={bookingScores(b, session).overall} /> },
            { key: 'examiner', label: 'ممتحن رایتینگ', render: (b) => <span className="text-[13px]">{s.teachers.find((t) => t.id === b.writingExaminerId)?.name ?? '—'}</span> },
            { key: 'act', label: '', render: (b) => (bookingStatus(b) === 'confirmed' && started ? <Button size="sm" variant="ghost" className="text-danger" onPress={() => { markNoShow(b.id, me.id); toast('غیبت ثبت شد'); }}>غایب</Button> : null) },
          ]} />
        <Section title="زمان‌های اسپیکینگ رزروشده" description={`${faNumber(session.slots.filter((x) => !x.bookingId).length)} زمان آزاد از ${faNumber(session.slots.length)}`} flush>
          <DataTable flat label="زمان‌های اسپیکینگ" rows={session.slots.filter((x) => x.bookingId)} getId={(x) => x.id} minWidth={560} empty={<div className="py-6 text-center text-[13px] text-muted">زمانی تعریف نشده است.</div>}
            columns={[
              { key: 'at', label: 'زمان', render: (x) => formatDateTime(x.at) },
              { key: 'ex', label: 'ممتحن', render: (x) => s.teachers.find((t) => t.id === x.examinerId)?.name },
              { key: 'who', label: 'زبان‌آموز', render: (x) => { const b = s.bookings.find((bk) => bk.id === x.bookingId); return b ? <button type="button" className="text-link hover:underline" onClick={() => navigate(`/admin/bookings/${b.id}`)}>{name(b.studentId)}</button> : <span className="text-muted">آزاد</span>; } },
            ]} />
        </Section>
      </div>
      <ConfirmDialog isOpen={cancel} onOpenChange={setCancel} title="لغو جلسه آزمون؟" description="همه رزروهای این جلسه لغو و مبلغ آن‌ها کامل بازگردانده می‌شود. زبان‌آموزان پیامک می‌گیرند." confirmLabel="لغو جلسه" isConfirmDisabled={reason.trim().length < 5}
        onConfirm={() => { cancelSession(session.id, reason.trim(), me.id); setCancel(false); toast.success('جلسه لغو شد'); }}>
        <TextAreaField label="دلیل (به زبان‌آموزان نمایش داده می‌شود)" value={reason} onChange={setReason} rows={2} />
      </ConfirmDialog>
    </Page>
  );
}

const STATUS_FILTERS: (EffectiveBooking | 'all')[] = ['all', 'held', 'confirmed', 'in_progress', 'awaiting_grading', 'graded', 'released', 'cancelled', 'expired', 'no_show'];

export function AdminBookingsPage() {
  const s = useApp();
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') ?? 'all') as EffectiveBooking | 'all';
  const [q, setQ] = useState('');
  const rows = useMemo(() => s.bookings.filter((b) => (status === 'all' || bookingStatus(b) === status) && (!q || b.code.includes(q.toUpperCase()) || s.students.find((x) => x.id === b.studentId)?.name.includes(q))).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [s, status, q]);
  return (
    <Page width="wide">
      <PageHeader title="رزروها و نتایج" description={`${faNumber(rows.length)} رزرو`} />
      <DataTable label="رزروها" rows={rows} getId={(b) => b.id} href={(b) => `/admin/bookings/${b.id}`} minWidth={960}
        header={<>
          <SearchField value={q} onChange={setQ} aria-label="جست‌وجو" className="min-w-[220px] flex-1"><SearchField.Group><SearchField.SearchIcon /><SearchField.Input placeholder="نام یا کد رزرو" /><SearchField.ClearButton /></SearchField.Group></SearchField>
          <SelectField label="وضعیت" hideLabel value={status} onChange={(v) => setParams(v === 'all' ? {} : { status: v })} options={STATUS_FILTERS.map((x) => ({ id: x, label: x === 'all' ? 'همه وضعیت‌ها' : BOOKING_META[x].label }))} className="w-52" />
        </>}
        columns={[
          { key: 'code', label: 'کد', render: (b) => <span className="font-semibold tabular">{b.code}</span> },
          { key: 'name', label: 'زبان‌آموز', render: (b) => s.students.find((x) => x.id === b.studentId)?.name },
          { key: 'session', label: 'جلسه', render: (b) => <span className="text-[13px]">{s.mockSessions.find((m) => m.id === b.sessionId)?.title}</span> },
          { key: 'module', label: 'ماژول', render: (b) => MODULE_LABEL[b.module] },
          { key: 'status', label: 'وضعیت', render: (b) => <MetaChip meta={BOOKING_META[bookingStatus(b)]} /> },
          { key: 'overall', label: 'نمره کل', render: (b) => <BandBadge band={bookingScores(b, s.mockSessions.find((m) => m.id === b.sessionId)).overall} /> },
          { key: 'remark', label: 'بازبینی', render: (b) => (b.remark ? <Chip size="sm" variant="soft" color="warning">{({ requested: 'درخواست', approved: 'در جریان', rejected: 'رد', done: 'انجام شد' } as const)[b.remark.status]}</Chip> : null) },
          { key: 'at', label: 'ثبت', render: (b) => <span className="text-xs text-muted">{relativeTime(b.createdAt)}</span> },
        ]} />
    </Page>
  );
}

export function AdminBookingPage() {
  const { id } = useParams();
  const s = useApp();
  const me = useStaff();
  const release = useApp((st) => st.releaseResults);
  const assign = useApp((st) => st.assignWriting);
  const cancelBooking = useApp((st) => st.cancelBooking);
  const [cancel, setCancel] = useState(false);
  const booking = s.bookings.find((b) => b.id === id);
  if (!booking) return <Navigate to="/admin/bookings" replace />;
  const session = s.mockSessions.find((m) => m.id === booking.sessionId);
  const student = s.students.find((x) => x.id === booking.studentId)!;
  const status = bookingStatus(booking);
  return (
    <Page width="wide">
      <PageHeader title={`${student.name} · ${booking.code}`} badge={<MetaChip meta={BOOKING_META[status]} />} crumbs={[{ label: 'رزروها', href: '/admin/bookings' }, { label: booking.code }]}
        actions={<div className="flex flex-wrap gap-2">
          {status === 'graded' ? <Button onPress={() => { release([booking.id], me.id); toast.success('نتیجه منتشر شد'); }}>انتشار نتیجه</Button> : null}
          {status === 'awaiting_grading' && !booking.writing ? <SelectField label="ممتحن رایتینگ" hideLabel value={booking.writingExaminerId ?? null} onChange={(v) => { assign(booking.id, v, me.id); toast.success('ممتحن تغییر کرد'); }} options={s.teachers.filter((t) => t.skills.includes('examiner')).map((t) => ({ id: t.id, label: t.name }))} className="w-48" /> : null}
          {status === 'confirmed' || status === 'held' ? <Button variant="ghost" className="text-danger" onPress={() => setCancel(true)}>لغو رزرو</Button> : null}
        </div>} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        {booking.attempt ? <ResultReport booking={booking} session={session} student={student} staffView /> : <Section><Empty icon={Ticket} title="هنوز آزمونی ثبت نشده است" description={session ? `آزمون ${formatDateTime(session.at)}` : undefined} /></Section>}
        <div className="grid content-start gap-4">
          <Section title="مشخصات">
            <dl className="grid gap-2 text-[13px]">
              <div className="flex justify-between"><dt className="text-muted">جلسه</dt><dd className="font-semibold">{session?.title}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">ماژول</dt><dd className="font-semibold">{MODULE_LABEL[booking.module]}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">برگزاری</dt><dd className="font-semibold">{DELIVERY_LABEL[booking.delivery]}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">موبایل</dt><dd className="font-semibold tabular">{student.mobile}</dd></div>
            </dl>
          </Section>
          {booking.attempt?.log.length ? (
            <Section title="رویدادهای آزمون">
              <ul className="grid gap-1 text-[12.5px]">{booking.attempt.log.map((l, i) => <li key={i} className="flex justify-between gap-2"><span className="ltr">{l.type}{l.detail ? ` · ${l.detail}` : ''}</span><span className="text-muted">{formatTime(l.at)}</span></li>)}</ul>
            </Section>
          ) : null}
          <Section title="روند"><Timeline items={booking.events.map((e) => ({ id: e.id, title: e.title, detail: e.detail, meta: `${formatDateTime(e.at)}${e.by ? ` · ${e.by}` : ''}`, state: e.tone === 'danger' ? 'warning' : 'done' }))} /></Section>
        </div>
      </div>
      <ConfirmDialog isOpen={cancel} onOpenChange={setCancel} title="لغو رزرو؟" description="اگر رزرو پرداخت شده و هنوز به مهلت لغو نرسیده باشد، درخواست بازپرداخت در صندوق تأییدها ثبت می‌شود." confirmLabel="لغو رزرو" onConfirm={() => { cancelBooking(booking.id, 'لغو توسط پذیرش', me.id); setCancel(false); toast.success('رزرو لغو شد'); }} />
    </Page>
  );
}

export function AdminTestsPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const test = MOCK_TESTS.find((t) => t.id === openId);
  return (
    <Page width="wide">
      <PageHeader title="بانک آزمون" description="فرم‌های آزمون ماک. هر جلسه برای هر ماژول یک فرم منتشرشده را استفاده می‌کند. فرم پیش‌نویس تا کامل نشود قابل انتخاب نیست." actions={<Button variant="secondary" onPress={() => toast('ویرایشگر فرم آزمون در فاز بعد (docs/02-ielts-mock.md)')}><Plus />فرم جدید</Button>} />
      <DataTable label="فرم‌ها" rows={MOCK_TESTS} getId={(t) => t.id} onAction={(t) => setOpenId(t.id)}
        columns={[
          { key: 'title', label: 'فرم', render: (t) => <span className="ltr font-semibold">{t.title}</span> },
          { key: 'module', label: 'ماژول', render: (t) => MODULE_LABEL[t.module] },
          { key: 'l', label: 'Listening', render: (t) => `${faNumber(questionsOf(t, 'listening').length)} سؤال · ${faNumber(t.listening.length)} بخش` },
          { key: 'r', label: 'Reading', render: (t) => `${faNumber(questionsOf(t, 'reading').length)} سؤال · ${faNumber(t.reading.length)} متن` },
          { key: 'w', label: 'Writing', render: (t) => (t.writing.t1.prompt ? (t.writing.t1.chart ? 'نمودار + مقاله' : 'نامه + مقاله') : '—') },
          { key: 'status', label: 'وضعیت', render: (t) => <ToneChip tone={t.status === 'published' ? 'success' : 'default'}>{t.status === 'published' ? 'منتشرشده' : 'پیش‌نویس'}</ToneChip> },
          { key: 'at', label: 'آخرین تغییر', render: (t) => formatDay(t.updatedAt) },
        ]} />
      <FormDialog isOpen={Boolean(test)} onOpenChange={(o) => !o && setOpenId(null)} size="lg" title={<span className="ltr">{test?.title}</span>} footer={<Button slot="close">بستن</Button>}>
        {test && test.listening.length ? (
          <div className="exam-text grid gap-3 text-[13.5px]">
            {test.listening.map((p) => <div key={p.id}><b>Listening {p.title}</b> — {p.context} ({p.groups.flatMap((g) => g.questions).length} questions)</div>)}
            {test.reading.map((p) => <div key={p.id}><b>Reading:</b> {p.title} ({p.groups.flatMap((g) => g.questions).length} questions)</div>)}
            <div><b>Writing Task 1:</b> {test.writing.t1.prompt.split('\n')[0]}</div>
            <div><b>Speaking Part 2:</b> {test.speaking.p2.topic}</div>
          </div>
        ) : <p className="text-sm text-muted">این فرم هنوز محتوا ندارد.</p>}
      </FormDialog>
    </Page>
  );
}

export function AdminCorrectionsPage() {
  const s = useApp();
  const claim = useApp((st) => st.claimCorrection);
  const [openId, setOpenId] = useState<string | null>(null);
  const rows = [...s.corrections].sort((a, b) => Number(b.status === 'submitted') - Number(a.status === 'submitted') || Number(b.express) - Number(a.express) || b.createdAt.localeCompare(a.createdAt));
  const open = s.corrections.find((c) => c.id === openId);
  return (
    <Page width="wide">
      <PageHeader title="خدمات تصحیح" description="متن‌های پرداخت‌شده تا وقتی ممتحنی برندارد یا به ممتحن سپرده نشوند در صف می‌مانند. فوری‌ها اول." />
      <DataTable label="متن‌ها" rows={rows} getId={(c) => c.id} onAction={(c) => setOpenId(c.id)} minWidth={900}
        columns={[
          { key: 'code', label: 'کد', render: (c) => <span className="font-semibold tabular">{c.code}</span> },
          { key: 'name', label: 'زبان‌آموز', render: (c) => s.students.find((x) => x.id === c.studentId)?.name },
          { key: 'task', label: 'نوع', render: (c) => <span className="text-[13px]">{TASK_LABEL[c.task]}</span> },
          { key: 'express', label: 'سرعت', render: (c) => (c.express ? <Chip size="sm" variant="soft" color="warning">فوری</Chip> : 'عادی') },
          { key: 'examiner', label: 'ممتحن', render: (c) => (c.status === 'submitted' ? <SelectField label="سپردن به" hideLabel value={null} placeholder="سپردن به…" onChange={(v) => { claim(c.id, v); toast.success('به ممتحن سپرده شد'); }} options={s.teachers.filter((t) => t.skills.includes('examiner')).map((t) => ({ id: t.id, label: t.name }))} className="w-40" /> : <span className="text-[13px]">{s.teachers.find((t) => t.id === c.examinerId)?.name ?? '—'}</span>) },
          { key: 'status', label: 'وضعیت', render: (c) => <MetaChip meta={CORRECTION_META[c.status]} /> },
          { key: 'at', label: 'ارسال', render: (c) => <span className="text-xs text-muted">{relativeTime(c.createdAt)}</span> },
        ]} />
      <FormDialog isOpen={Boolean(open)} onOpenChange={(o) => !o && setOpenId(null)} size="lg" title={open ? `${open.code} · ${TASK_LABEL[open.task]}` : ''} footer={<Button slot="close">بستن</Button>}>
        <div className="exam-text max-h-[60vh] overflow-y-auto whitespace-pre-line text-[14px] leading-7">{open?.text}</div>
      </FormDialog>
    </Page>
  );
}
