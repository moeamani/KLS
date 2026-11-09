import { ArrowLeft, Calendar, CircleCheck, Clock, Microphone, Printer, Ticket } from '@gravity-ui/icons';
import { Alert, Button, Card, Chip, cn, Radio, RadioGroup, toast } from '@heroui/react';
import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { BandBadge } from '@/components/ui/Band';
import { ConfirmDialog, FormDialog } from '@/components/ui/Dialog';
import { Empty } from '@/components/ui/Empty';
import { SelectField, TextAreaField } from '@/components/ui/Fields';
import { Page, PageHeader, Section } from '@/components/ui/Page';
import { MetaChip } from '@/components/ui/StatusChip';
import { Timeline } from '@/components/ui/Timeline';
import { HoldTimer, PaymentDialog } from '@/features/enroll/Payment';
import { MockRunner } from '@/features/mock/MockRunner';
import { ResultReport } from '@/features/mock/Results';
import { BOOKING_META, bookingStatus, DELIVERY_LABEL, MODULE_LABEL } from '@/data/status';
import { formatDate, formatDateTime, formatTime, relativeDay } from '@/lib/dates';
import { faNumber, toman } from '@/lib/format';
import { useApp, useSessionUser } from '@/store/app';
import { bookingScores, examWindow, mockSessionState, sessionSeats, testFor } from '@/store/selectors';
import type { MockBooking, MockDelivery, MockModule, Student } from '@/types';
import { MockSessionCard } from '../site/parts';

function useMyBookings() {
  const state = useApp();
  const me = useSessionUser() as Student;
  return useMemo(() => state.bookings.filter((b) => b.studentId === me?.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [state.bookings, me]);
}

function BookingCard({ booking }: { booking: MockBooking }) {
  const navigate = useNavigate();
  const session = useApp((s) => s.mockSessions.find((m) => m.id === booking.sessionId))!;
  const slot = session.slots.find((x) => x.id === booking.slotId);
  const examiner = useApp((s) => s.teachers.find((t) => t.id === slot?.examinerId));
  const [pay, setPay] = useState(false);
  const status = bookingStatus(booking);
  const scores = bookingScores(booking, session);
  const win = examWindow(session);
  return (
    <Card className="gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[15px] font-bold">{session.title}</div>
          <div className="text-[13px] text-muted">{formatDate(session.at)} · ساعت {formatTime(session.at)} · {MODULE_LABEL[booking.module]} · {DELIVERY_LABEL[booking.delivery]}</div>
        </div>
        <MetaChip meta={BOOKING_META[status]} student />
      </div>
      {slot && ['confirmed', 'in_progress', 'awaiting_grading'].includes(status) ? (
        <div className="flex items-center gap-2 rounded-lg bg-surface-secondary px-3 py-2 text-[13px]">
          <Microphone className="size-4 text-accent" />
          اسپیکینگ: {formatDateTime(slot.at)} با {examiner?.name}
        </div>
      ) : null}
      {status === 'held' ? <HoldTimer until={booking.heldUntil} /> : null}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-separator pt-3">
        <span className="text-xs text-muted">کد رزرو <bdi className="font-semibold tabular text-foreground">{booking.code}</bdi></span>
        <div className="flex flex-wrap gap-2">
          {status === 'released' ? (
            <><BandBadge band={scores.overall} /><Button size="sm" onPress={() => navigate(`/portal/mock/${booking.id}/result`)}>کارنامه<ArrowLeft /></Button></>
          ) : status === 'held' ? (
            <Button size="sm" onPress={() => setPay(true)}>پرداخت و قطعی کردن</Button>
          ) : status === 'expired' ? (
            <Button size="sm" variant="secondary" onPress={() => navigate(`/portal/mock/book?session=${session.id}`)}>رزرو دوباره</Button>
          ) : status === 'in_progress' ? (
            <Button size="sm" onPress={() => navigate(`/portal/mock/${booking.id}/exam`)}>ادامه آزمون</Button>
          ) : status === 'confirmed' && win.open ? (
            <Button size="sm" onPress={() => navigate(`/portal/mock/${booking.id}/exam`)}>شروع آزمون</Button>
          ) : status === 'awaiting_grading' || status === 'graded' ? (
            <Button size="sm" variant="secondary" onPress={() => navigate(`/portal/mock/${booking.id}/result`)}>نمره لیسنینگ و ریدینگ</Button>
          ) : null}
          <Button size="sm" variant="ghost" onPress={() => navigate(`/portal/mock/${booking.id}`)}>جزئیات</Button>
        </div>
      </div>
      <PaymentDialog invoiceId={booking.invoiceId} isOpen={pay} onOpenChange={setPay} heldUntil={booking.heldUntil} allowInstallments={false} />
    </Card>
  );
}

export function StudentMockPage() {
  const bookings = useMyBookings();
  const state = useApp();
  const navigate = useNavigate();
  const active = bookings.filter((b) => ['held', 'confirmed', 'in_progress', 'awaiting_grading', 'graded'].includes(bookingStatus(b)));
  const past = bookings.filter((b) => !active.includes(b));
  const open = state.mockSessions.filter((m) => mockSessionState(state, m) === 'open').sort((a, b) => a.at.localeCompare(b.at));
  return (
    <Page>
      <PageHeader title="آزمون ماک آیلتس" description="رزرو، شرکت در آزمون و کارنامه با بازخورد ممتحن." actions={<Button onPress={() => navigate('/portal/mock/book')}><Ticket />رزرو آزمون جدید</Button>} />
      <div className="grid gap-6">
        <section className="grid gap-3">
          <h2 className="text-[15px] font-bold">رزروهای فعال</h2>
          {active.length ? <div className="grid gap-3 lg:grid-cols-2">{active.map((b) => <BookingCard key={b.id} booking={b} />)}</div> : (
            <Card><Empty icon={Ticket} title="رزرو فعالی ندارید" description="یکی از تاریخ‌های پیش رو را انتخاب کنید؛ زمان اسپیکینگ همان لحظه تعیین می‌شود." action={<Button size="sm" onPress={() => navigate('/portal/mock/book')}>رزرو آزمون</Button>} /></Card>
          )}
        </section>
        {past.length ? (
          <section className="grid gap-3">
            <h2 className="text-[15px] font-bold">سوابق</h2>
            <div className="grid gap-3 lg:grid-cols-2">{past.map((b) => <BookingCard key={b.id} booking={b} />)}</div>
          </section>
        ) : null}
        <section className="grid gap-3">
          <h2 className="text-[15px] font-bold">تاریخ‌های پیش رو</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{open.map((m) => <MockSessionCard key={m.id} session={m} compact />)}</div>
        </section>
      </div>
    </Page>
  );
}

export function StudentMockBookPage() {
  const state = useApp();
  const me = useSessionUser() as Student;
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const holdBooking = useApp((s) => s.holdBooking);
  const sessions = state.mockSessions.filter((m) => mockSessionState(state, m) === 'open').sort((a, b) => a.at.localeCompare(b.at));
  const [sessionId, setSessionId] = useState<string | null>(params.get('session') && sessions.some((s) => s.id === params.get('session')) ? params.get('session') : sessions[0]?.id ?? null);
  const session = sessions.find((s) => s.id === sessionId);
  const [module, setModule] = useState<MockModule>('academic');
  const [delivery, setDelivery] = useState<MockDelivery>('center');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const booking = state.bookings.find((b) => b.id === bookingId);

  useEffect(() => {
    if (!session) return;
    if (!session.modules.includes(module)) setModule(session.modules[0]);
    if (!session.deliveries.includes(delivery)) setDelivery(session.deliveries[0]);
  }, [session, module, delivery]);

  const reserve = () => {
    if (!session) return;
    const result = holdBooking(me.id, session.id, module, delivery);
    if (!result.ok) return setError(result.error);
    setError('');
    setBookingId(result.id);
  };

  if (booking && booking.status !== 'held') {
    const slot = state.mockSessions.find((m) => m.id === booking.sessionId)?.slots.find((x) => x.id === booking.slotId);
    return (
      <Page width="narrow">
        <Card className="items-center gap-3 p-8 text-center">
          <CircleCheck className="size-10 text-success" />
          <h1 className="text-xl font-extrabold">رزرو شما قطعی شد</h1>
          <p className="text-sm leading-7 text-muted">کد رزرو <bdi className="font-bold tabular text-foreground">{booking.code}</bdi>. {slot ? `زمان اسپیکینگ شما ${formatDateTime(slot.at)} است.` : ''} پیامک تأیید ارسال شد.</p>
          <div className="flex gap-2"><Button onPress={() => navigate(`/portal/mock/${booking.id}`)}>جزئیات رزرو</Button><Button variant="secondary" onPress={() => navigate('/portal/mock')}>آزمون‌های من</Button></div>
        </Card>
      </Page>
    );
  }

  return (
    <Page width="narrow">
      <PageHeader title="رزرو آزمون ماک" crumbs={[{ label: 'آزمون ماک', href: '/portal/mock' }, { label: 'رزرو' }]} />
      {!sessions.length ? (
        <Card><Empty icon={Calendar} title="فعلاً آزمونی برای رزرو باز نیست" description="تاریخ آزمون‌های بعدی در تقویم آموزشی اعلام می‌شود." /></Card>
      ) : (
        <div className="grid gap-4">
          <Section title="۱. تاریخ آزمون">
            <RadioGroup value={sessionId ?? ''} onChange={(v) => { setSessionId(v); setBookingId(null); }} aria-label="تاریخ آزمون">
              <div className="grid gap-2">
                {sessions.map((s) => {
                  const seats = sessionSeats(state, s);
                  return (
                    <Radio key={s.id} value={s.id} className={cn('rounded-xl border p-3', sessionId === s.id ? 'border-accent bg-accent-soft' : 'border-border')}>
                      <Radio.Control><Radio.Indicator /></Radio.Control>
                      <Radio.Content className="flex w-full flex-wrap items-center justify-between gap-2">
                        <span><span className="font-semibold">{formatDate(s.at)}</span> <span className="text-[13px] text-muted">· {relativeDay(s.at)} · ساعت {formatTime(s.at)}</span></span>
                        <span className={cn('text-xs', seats.free <= 3 ? 'font-semibold text-warning-soft-foreground' : 'text-muted')}>{faNumber(seats.free)} صندلی خالی</span>
                      </Radio.Content>
                    </Radio>
                  );
                })}
              </div>
            </RadioGroup>
          </Section>
          {session ? (
            <Section title="۲. ماژول و نوع برگزاری">
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField label="ماژول" value={module} onChange={(v) => setModule(v as MockModule)} options={session.modules.map((m) => ({ id: m, label: MODULE_LABEL[m], description: m === 'academic' ? 'برای تحصیل' : 'برای مهاجرت و کار' }))} />
                <SelectField label="نوع برگزاری" value={delivery} onChange={(v) => setDelivery(v as MockDelivery)} options={session.deliveries.map((d) => ({ id: d, label: DELIVERY_LABEL[d] }))} />
              </div>
            </Section>
          ) : null}
          {session ? (
            <Section title="۳. پرداخت">
              <div className="grid gap-3">
                <div className="flex items-center justify-between text-sm"><span className="text-ink-2">هزینه آزمون</span><span className="text-lg font-extrabold tabular">{toman(session.price)}</span></div>
                <p className="text-[13px] leading-6 text-muted">پس از رزرو، صندلی {faNumber(state.settings.seatHoldMin)} دقیقه برای پرداخت نگه داشته می‌شود. لغو تا {faNumber(state.settings.mock.cancelHours)} ساعت پیش از آزمون با {faNumber(state.settings.mock.refundPercent)}٪ بازپرداخت.</p>
                {error ? <Alert status="danger"><Alert.Content><Alert.Description>{error}</Alert.Description></Alert.Content></Alert> : null}
                {booking ? <HoldTimer until={booking.heldUntil} /> : null}
                <Button size="lg" onPress={booking ? undefined : reserve} isDisabled={Boolean(booking)}>{booking ? 'در انتظار پرداخت' : 'رزرو و پرداخت'}</Button>
              </div>
            </Section>
          ) : null}
        </div>
      )}
      <PaymentDialog invoiceId={booking?.invoiceId} isOpen={Boolean(booking && booking.status === 'held')} onOpenChange={(open) => { if (!open && booking?.status === 'held') { toast('رزرو تا پایان مهلت برای شما نگه داشته می‌شود'); navigate('/portal/mock'); } }} heldUntil={booking?.heldUntil} allowInstallments={false} />
    </Page>
  );
}

export function StudentMockBookingPage() {
  const { id } = useParams();
  const state = useApp();
  const navigate = useNavigate();
  const booking = state.bookings.find((b) => b.id === id);
  const chooseSlot = useApp((s) => s.chooseSlot);
  const cancelBooking = useApp((s) => s.cancelBooking);
  const [pay, setPay] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [slotOpen, setSlotOpen] = useState(false);
  const [slotId, setSlotId] = useState<string | null>(null);
  if (!booking) return <Navigate to="/portal/mock" replace />;
  const session = state.mockSessions.find((m) => m.id === booking.sessionId)!;
  const status = bookingStatus(booking);
  const slot = session.slots.find((x) => x.id === booking.slotId);
  const hoursLeft = (new Date(session.at).getTime() - Date.now()) / 3_600_000;
  const refund = hoursLeft >= state.settings.mock.cancelHours ? state.settings.mock.refundPercent : 0;
  const freeSlots = session.slots.filter((x) => !x.bookingId || x.bookingId === booking.id);
  const canChangeSlot = status === 'confirmed' && slot && new Date(slot.at).getTime() - Date.now() > 24 * 3_600_000;
  return (
    <Page width="narrow">
      <PageHeader title={session.title} badge={<MetaChip meta={BOOKING_META[status]} student />} crumbs={[{ label: 'آزمون ماک', href: '/portal/mock' }, { label: booking.code }]} />
      <div className="grid gap-4">
        <Section>
          <dl className="grid grid-cols-2 gap-4 text-[13.5px] sm:grid-cols-3">
            <div><dt className="text-muted">تاریخ و ساعت</dt><dd className="font-semibold">{formatDateTime(session.at)}</dd></div>
            <div><dt className="text-muted">ماژول</dt><dd className="font-semibold">{MODULE_LABEL[booking.module]}</dd></div>
            <div><dt className="text-muted">برگزاری</dt><dd className="font-semibold">{DELIVERY_LABEL[booking.delivery]}</dd></div>
            <div><dt className="text-muted">اسپیکینگ</dt><dd className="font-semibold">{slot ? formatDateTime(slot.at) : '—'}</dd></div>
            <div><dt className="text-muted">ممتحن اسپیکینگ</dt><dd className="font-semibold">{state.teachers.find((t) => t.id === slot?.examinerId)?.name ?? '—'}</dd></div>
            <div><dt className="text-muted">کد رزرو</dt><dd className="font-semibold tabular">{booking.code}</dd></div>
          </dl>
          {booking.delivery === 'center' && status === 'confirmed' ? <p className="mt-4 rounded-lg bg-surface-secondary p-3 text-[13px] leading-6 text-ink-2">۳۰ دقیقه پیش از شروع با کارت شناسایی در آموزشگاه حاضر باشید. آزمون روی کامپیوترهای سایت آموزشگاه برگزار می‌شود.</p> : null}
          {booking.delivery === 'online' && status === 'confirmed' ? <p className="mt-4 rounded-lg bg-surface-secondary p-3 text-[13px] leading-6 text-ink-2">آزمون آنلاین از {formatDateTime(session.at)} به مدت ۸ ساعت باز است. هدفون و اینترنت پایدار آماده کنید.</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {status === 'held' ? <Button onPress={() => setPay(true)}>پرداخت</Button> : null}
            {(status === 'confirmed' && examWindow(session).open) || status === 'in_progress' ? <Button onPress={() => navigate(`/portal/mock/${booking.id}/exam`)}>{status === 'in_progress' ? 'ادامه آزمون' : 'شروع آزمون'}</Button> : null}
            {status === 'confirmed' && examWindow(session).before ? <Chip variant="soft" color="accent"><Clock className="size-3.5" />آزمون {relativeDay(session.at)} باز می‌شود</Chip> : null}
            {['awaiting_grading', 'graded', 'released'].includes(status) ? <Button onPress={() => navigate(`/portal/mock/${booking.id}/result`)}>کارنامه</Button> : null}
            {canChangeSlot ? <Button variant="secondary" onPress={() => { setSlotId(booking.slotId ?? null); setSlotOpen(true); }}>تغییر زمان اسپیکینگ</Button> : null}
            {status === 'confirmed' || status === 'held' ? <Button variant="ghost" className="text-danger" onPress={() => setCancel(true)}>لغو رزرو</Button> : null}
          </div>
        </Section>
        <Section title="روند"><Timeline items={booking.events.map((e) => ({ id: e.id, title: e.title, detail: e.detail, meta: `${formatDateTime(e.at)}${e.by ? ` · ${e.by}` : ''}`, state: e.tone === 'danger' ? 'warning' : 'done' }))} /></Section>
      </div>
      <PaymentDialog invoiceId={booking.invoiceId} isOpen={pay} onOpenChange={setPay} heldUntil={booking.heldUntil} allowInstallments={false} />
      <ConfirmDialog isOpen={cancel} onOpenChange={setCancel} title="لغو رزرو آزمون؟" confirmLabel="لغو رزرو"
        description={status === 'held' ? 'رزرو پرداخت‌نشده لغو و صندلی آزاد می‌شود.' : refund ? `طبق قانون لغو، ${faNumber(refund)}٪ مبلغ (${toman(Math.round((session.price * refund) / 100))}) پس از تأیید امور مالی بازگردانده می‌شود.` : `کمتر از ${faNumber(state.settings.mock.cancelHours)} ساعت به آزمون مانده است؛ مبلغ بازگردانده نمی‌شود.`}
        onConfirm={() => { cancelBooking(booking.id, 'انصراف زبان‌آموز', booking.studentId); setCancel(false); toast.success('رزرو لغو شد'); }} />
      <FormDialog isOpen={slotOpen} onOpenChange={setSlotOpen} title="زمان اسپیکینگ" footer={<><Button variant="tertiary" slot="close">انصراف</Button><Button isDisabled={!slotId || slotId === booking.slotId} onPress={() => { chooseSlot(booking.id, slotId!); setSlotOpen(false); toast.success('زمان اسپیکینگ تغییر کرد'); }}>ذخیره</Button></>}>
        <SelectField label="زمان" value={slotId} onChange={setSlotId} options={freeSlots.map((x) => ({ id: x.id, label: formatDateTime(x.at), description: state.teachers.find((t) => t.id === x.examinerId)?.name }))} />
      </FormDialog>
    </Page>
  );
}

export function StudentMockExamPage() {
  const { id } = useParams();
  const state = useApp();
  const me = useSessionUser() as Student;
  const navigate = useNavigate();
  const booking = state.bookings.find((b) => b.id === id && b.studentId === me?.id);
  if (!booking) return <Navigate to="/portal/mock" replace />;
  const session = state.mockSessions.find((m) => m.id === booking.sessionId)!;
  const win = examWindow(session);
  const status = bookingStatus(booking);
  const blocked = status === 'confirmed' && !win.open ? (win.before ? `آزمون ${formatDateTime(session.at)} باز می‌شود.` : 'زمان برگزاری این آزمون گذشته است.') : !['confirmed', 'in_progress', 'awaiting_grading'].includes(status) ? 'این رزرو برای شرکت در آزمون فعال نیست.' : '';
  if (blocked)
    return (
      <Page width="narrow">
        <Card><Empty icon={Clock} title="آزمون در دسترس نیست" description={blocked} action={<Button size="sm" onPress={() => navigate(`/portal/mock/${booking.id}`)}>بازگشت به رزرو</Button>} /></Card>
      </Page>
    );
  return <MockRunner booking={booking} test={testFor(booking, session)} student={me} />;
}

export function StudentMockResultPage() {
  const { id } = useParams();
  const state = useApp();
  const me = useSessionUser() as Student;
  const navigate = useNavigate();
  const requestRemark = useApp((s) => s.requestRemark);
  const [remark, setRemark] = useState(false);
  const [skill, setSkill] = useState<'writing' | 'speaking'>('writing');
  const [reason, setReason] = useState('');
  const booking = state.bookings.find((b) => b.id === id && b.studentId === me?.id);
  if (!booking) return <Navigate to="/portal/mock" replace />;
  const session = state.mockSessions.find((m) => m.id === booking.sessionId);
  const canRemark = booking.status === 'released' && !booking.remark;
  const pending = booking.status !== 'released';
  return (
    <Page>
      <PageHeader
        title="کارنامه آزمون ماک"
        crumbs={[{ label: 'آزمون ماک', href: '/portal/mock' }, { label: booking.code }]}
        actions={
          <div className="no-print flex flex-wrap gap-2">
            {!pending ? <Button variant="secondary" onPress={() => window.print()}><Printer />چاپ کارنامه</Button> : null}
            {canRemark ? <Button variant="secondary" onPress={() => setRemark(true)}>درخواست بازبینی</Button> : null}
            <Button onPress={() => navigate('/portal/mock/book')}>رزرو آزمون بعدی</Button>
          </div>
        }
      />
      {pending ? (
        <Alert status="accent" className="mb-4"><Alert.Content><Alert.Title>نتیجه کامل هنوز منتشر نشده است</Alert.Title><Alert.Description>نمره لیسنینگ و ریدینگ آماده است. رایتینگ و اسپیکینگ پس از تصحیح و انتشار نتیجه نمایش داده می‌شود.</Alert.Description></Alert.Content></Alert>
      ) : null}
      <ResultReport booking={booking} session={session} student={me} />
      <FormDialog isOpen={remark} onOpenChange={setRemark} title="درخواست بازبینی نمره" description={`هزینه بازبینی ${toman(state.settings.mock.remarkFee)} است. اگر نمره تغییر کند، این هزینه بازگردانده می‌شود.`}
        footer={<><Button variant="tertiary" slot="close">انصراف</Button><Button isDisabled={reason.trim().length < 10} onPress={() => { requestRemark(booking.id, skill, reason.trim()); setRemark(false); toast.success('درخواست بازبینی ثبت شد', { description: 'پس از تأیید آموزش، برگه به ممتحن دوم سپرده می‌شود.' }); }}>پرداخت و ثبت درخواست</Button></>}>
        <div className="grid gap-4">
          <SelectField label="مهارت" value={skill} onChange={(v) => setSkill(v as 'writing' | 'speaking')} options={[{ id: 'writing', label: 'Writing' }, { id: 'speaking', label: 'Speaking' }]} />
          <TextAreaField label="دلیل درخواست" value={reason} onChange={setReason} rows={3} placeholder="مثلاً انتظار نمره بالاتری در Task 2 داشتم" description="حداقل ۱۰ نویسه" />
        </div>
      </FormDialog>
    </Page>
  );
}
