import { CircleCheck, Pencil } from '@gravity-ui/icons';
import { Alert, Button, Card, Chip, Tabs, toast } from '@heroui/react';
import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { DataTable } from '@/components/ui/DataTable';
import { Empty } from '@/components/ui/Empty';
import { Page, PageHeader, Section } from '@/components/ui/Page';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { CriterionPicker, ResponseView, SpeakingGradeForm, WritingGradeForm } from '@/features/mock/Grading';
import { TextAreaField } from '@/components/ui/Fields';
import { MODULE_LABEL, TASK_LABEL } from '@/data/status';
import { formatDateTime, formatDay, relativeTime } from '@/lib/dates';
import { faNumber } from '@/lib/format';
import { criteriaBand, formatBand, MIN_WORDS, WRITING_CRITERIA } from '@/lib/ielts';
import { useApp, useSessionUser } from '@/store/app';
import { testFor } from '@/store/selectors';
import type { Teacher, WritingCriterion } from '@/types';

export function TeacherGradingPage() {
  const s = useApp();
  const me = useSessionUser() as Teacher;
  const navigate = useNavigate();
  const claim = useApp((st) => st.claimCorrection);
  const [tab, setTab] = useState('writing');
  const name = (id: string) => s.students.find((x) => x.id === id)?.name ?? '';
  const sessionOf = (id: string) => s.mockSessions.find((m) => m.id === id);

  const writing = useMemo(() => s.bookings.filter((b) => b.status === 'awaiting_grading' && b.writingExaminerId === me.id && !b.writing), [s.bookings, me.id]);
  const remarks = useMemo(() => s.bookings.filter((b) => b.remark?.status === 'approved' && b.remark.examinerId === me.id), [s.bookings, me.id]);
  const speaking = useMemo(() => s.bookings.filter((b) => ['awaiting_grading', 'confirmed', 'in_progress'].includes(b.status) && !b.speaking && !b.speakingNoShow && sessionOf(b.sessionId)?.slots.find((x) => x.id === b.slotId)?.examinerId === me.id).sort((a, b) => (sessionOf(a.sessionId)?.slots.find((x) => x.id === a.slotId)?.at ?? '').localeCompare(sessionOf(b.sessionId)?.slots.find((x) => x.id === b.slotId)?.at ?? '')), [s, me.id]);
  const mine = s.corrections.filter((c) => c.examinerId === me.id && c.status === 'in_review');
  const pool = s.corrections.filter((c) => c.status === 'submitted').sort((a, b) => Number(b.express) - Number(a.express) || a.createdAt.localeCompare(b.createdAt));

  return (
    <Page>
      <PageHeader title="صف تصحیح" description="رایتینگ و اسپیکینگ آزمون‌های ماک، بازبینی‌ها و متن‌های خدمات تصحیح." />
      <Tabs selectedKey={tab} onSelectionChange={(k) => setTab(String(k))} variant="secondary">
        <Tabs.ListContainer>
          <Tabs.List aria-label="صف‌ها" className="mb-4">
            <Tabs.Tab id="writing">رایتینگ ماک {writing.length ? <Chip size="sm" variant="soft" color="warning">{faNumber(writing.length)}</Chip> : null}<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="speaking">اسپیکینگ {speaking.length ? <Chip size="sm" variant="soft">{faNumber(speaking.length)}</Chip> : null}<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="remark">بازبینی {remarks.length ? <Chip size="sm" variant="soft" color="warning">{faNumber(remarks.length)}</Chip> : null}<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="service">خدمات تصحیح {mine.length + pool.length ? <Chip size="sm" variant="soft">{faNumber(mine.length + pool.length)}</Chip> : null}<Tabs.Indicator /></Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel id="writing">
          <DataTable label="رایتینگ‌های در انتظار" rows={writing} getId={(b) => b.id} href={(b) => `/teacher/grading/writing/${b.id}`}
            empty={<Empty icon={CircleCheck} title="رایتینگی در صف شما نیست" description="رایتینگ‌ها پس از ثبت آزمون کتبی، به ممتحنی که کار کمتری دارد سپرده می‌شوند." />}
            columns={[
              { key: 'code', label: 'کد', render: (b) => <span className="font-semibold tabular">{b.code}</span> },
              { key: 'student', label: 'زبان‌آموز', render: (b) => name(b.studentId) },
              { key: 'module', label: 'ماژول', render: (b) => MODULE_LABEL[b.module] },
              { key: 'session', label: 'آزمون', render: (b) => sessionOf(b.sessionId)?.title },
              { key: 'at', label: 'ثبت آزمون', render: (b) => relativeTime(b.attempt?.submittedAt ?? b.createdAt) },
              { key: 'go', label: '', render: () => <Button size="sm">تصحیح</Button> },
            ]} />
        </Tabs.Panel>
        <Tabs.Panel id="speaking">
          <DataTable label="اسپیکینگ‌های پیش رو" rows={speaking} getId={(b) => b.id} href={(b) => `/teacher/grading/speaking/${b.id}`}
            empty={<Empty icon={CircleCheck} title="اسپیکینگی برای شما برنامه‌ریزی نشده است" />}
            columns={[
              { key: 'time', label: 'زمان', render: (b) => formatDateTime(sessionOf(b.sessionId)?.slots.find((x) => x.id === b.slotId)?.at ?? '') },
              { key: 'student', label: 'زبان‌آموز', render: (b) => name(b.studentId) },
              { key: 'code', label: 'کد', render: (b) => <span className="tabular">{b.code}</span> },
              { key: 'delivery', label: 'برگزاری', render: (b) => (b.delivery === 'online' ? 'آنلاین (تماس تصویری)' : 'حضوری') },
              { key: 'go', label: '', render: () => <Button size="sm" variant="secondary">ثبت نمره</Button> },
            ]} />
        </Tabs.Panel>
        <Tabs.Panel id="remark">
          <DataTable label="بازبینی‌ها" rows={remarks} getId={(b) => b.id} href={(b) => `/teacher/grading/${b.remark!.skill}/${b.id}`}
            empty={<Empty icon={CircleCheck} title="بازبینی‌ای به شما سپرده نشده است" description="وقتی آموزش درخواست بازبینی را تأیید کند، برگه بدون دیدن نمره قبلی به ممتحن دوم می‌رسد." />}
            columns={[
              { key: 'code', label: 'کد', render: (b) => <span className="tabular">{b.code}</span> },
              { key: 'skill', label: 'مهارت', render: (b) => (b.remark!.skill === 'writing' ? 'Writing' : 'Speaking') },
              { key: 'reason', label: 'دلیل زبان‌آموز', render: (b) => <span className="line-clamp-1 text-[13px] text-ink-2">{b.remark!.reason}</span> },
              { key: 'go', label: '', render: () => <Button size="sm">بازبینی</Button> },
            ]} />
        </Tabs.Panel>
        <Tabs.Panel id="service" className="grid gap-4">
          <Section title="در دست شما" flush>
            <DataTable flat label="در دست شما" rows={mine} getId={(c) => c.id} href={(c) => `/teacher/grading/correction/${c.id}`} empty={<div className="py-8 text-center text-[13px] text-muted">موردی در دست شما نیست.</div>}
              columns={[
                { key: 'code', label: 'کد', render: (c) => <span className="tabular">{c.code}</span> },
                { key: 'task', label: 'نوع', render: (c) => TASK_LABEL[c.task] },
                { key: 'express', label: 'سرعت', render: (c) => (c.express ? <Chip size="sm" color="warning" variant="soft">فوری</Chip> : 'عادی') },
                { key: 'at', label: 'ارسال', render: (c) => relativeTime(c.createdAt) },
              ]} />
          </Section>
          <Section title="صف عمومی" description="فوری‌ها اول؛ با برداشتن هر مورد، آن مورد به نام شما ثبت می‌شود." flush>
            <DataTable flat label="صف عمومی" rows={pool} getId={(c) => c.id} empty={<div className="py-8 text-center text-[13px] text-muted">صف عمومی خالی است.</div>}
              columns={[
                { key: 'code', label: 'کد', render: (c) => <span className="tabular">{c.code}</span> },
                { key: 'task', label: 'نوع', render: (c) => TASK_LABEL[c.task] },
                { key: 'express', label: 'سرعت', render: (c) => (c.express ? <Chip size="sm" color="warning" variant="soft">فوری</Chip> : 'عادی') },
                { key: 'at', label: 'ارسال', render: (c) => formatDay(c.createdAt) },
                { key: 'go', label: '', render: (c) => <Button size="sm" variant="secondary" onPress={() => { claim(c.id, me.id); navigate(`/teacher/grading/correction/${c.id}`); }}>برداشتن</Button> },
              ]} />
          </Section>
        </Tabs.Panel>
      </Tabs>
    </Page>
  );
}

export function TeacherWritingPage() {
  const { id } = useParams();
  const s = useApp();
  const me = useSessionUser() as Teacher;
  const navigate = useNavigate();
  const save = useApp((st) => st.saveWritingGrade);
  const booking = s.bookings.find((b) => b.id === id);
  if (!booking?.attempt) return <Navigate to="/teacher/grading" replace />;
  const session = s.mockSessions.find((m) => m.id === booking.sessionId);
  const isRemark = booking.remark?.status === 'approved' && booking.remark.skill === 'writing';
  return (
    <Page width="wide">
      <PageHeader title={`رایتینگ ${booking.code}`} description={`${MODULE_LABEL[booking.module]} · ${session?.title}. نام زبان‌آموز برای تصحیح بی‌طرفانه نمایش داده نمی‌شود.`} crumbs={[{ label: 'صف تصحیح', href: '/teacher/grading' }, { label: booking.code }]} badge={isRemark ? <Chip color="warning" variant="soft">بازبینی</Chip> : null} />
      {isRemark ? <Alert status="warning" className="mb-4"><Alert.Content><Alert.Description>این برگه برای بازبینی به شما سپرده شده است. نمره ممتحن اول نمایش داده نمی‌شود تا داوری مستقل باشد.</Alert.Description></Alert.Content></Alert> : null}
      <WritingGradeForm test={testFor(booking, session)} response={booking.attempt.writing} submitLabel={isRemark ? 'ثبت نمره بازبینی' : 'ثبت نمره رایتینگ'}
        onSubmit={(g) => { save(booking.id, { ...g, examinerId: me.id, at: new Date().toISOString() }); toast.success('نمره رایتینگ ثبت شد'); navigate('/teacher/grading'); }} />
    </Page>
  );
}

export function TeacherSpeakingPage() {
  const { id } = useParams();
  const s = useApp();
  const me = useSessionUser() as Teacher;
  const navigate = useNavigate();
  const save = useApp((st) => st.saveSpeakingGrade);
  const noShow = useApp((st) => st.speakingNoShow);
  const [confirmNoShow, setConfirmNoShow] = useState(false);
  const booking = s.bookings.find((b) => b.id === id);
  if (!booking) return <Navigate to="/teacher/grading" replace />;
  const session = s.mockSessions.find((m) => m.id === booking.sessionId);
  const slot = session?.slots.find((x) => x.id === booking.slotId);
  const test = testFor(booking, session);
  const student = s.students.find((x) => x.id === booking.studentId);
  const isRemark = booking.remark?.status === 'approved' && booking.remark.skill === 'speaking';
  const early = slot && new Date(slot.at).getTime() > Date.now() + 15 * 60_000;
  return (
    <Page width="wide">
      <PageHeader title={`اسپیکینگ ${student?.name ?? ''}`} description={`${booking.code} · ${slot ? formatDateTime(slot.at) : ''} · ${booking.delivery === 'online' ? 'تماس تصویری' : 'حضوری'}`} crumbs={[{ label: 'صف تصحیح', href: '/teacher/grading' }, { label: booking.code }]}
        actions={!isRemark ? <Button variant="ghost" className="text-danger" onPress={() => setConfirmNoShow(true)}>زبان‌آموز حاضر نشد</Button> : null} />
      {early ? <Alert status="accent" className="mb-4"><Alert.Content><Alert.Description>زمان این اسپیکینگ هنوز نرسیده است. فرم را پس از پایان گفت‌وگو کامل کنید.</Alert.Description></Alert.Content></Alert> : null}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-4">
          <Section title={<span className="ltr">Part 1 · Introduction (4–5 min)</span>}><ul className="exam-text list-disc ps-5 text-[14px] leading-8">{test.speaking.p1.map((q) => <li key={q}>{q}</li>)}</ul></Section>
          <Section title={<span className="ltr">Part 2 · Cue card (3–4 min)</span>}>
            <div className="exam-text rounded-lg border border-border p-4 text-[14px] leading-8"><b>{test.speaking.p2.topic}</b><div>You should say:</div><ul className="list-disc ps-5">{test.speaking.p2.bullets.map((b) => <li key={b}>{b}</li>)}</ul><div>{test.speaking.p2.closing}</div></div>
          </Section>
          <Section title={<span className="ltr">Part 3 · Discussion (4–5 min)</span>}><ul className="exam-text list-disc ps-5 text-[14px] leading-8">{test.speaking.p3.map((q) => <li key={q}>{q}</li>)}</ul></Section>
        </div>
        <div className="xl:sticky xl:top-4 xl:self-start">
          <SpeakingGradeForm submitLabel={isRemark ? 'ثبت نمره بازبینی' : 'ثبت نمره اسپیکینگ'} onSubmit={(g) => { save(booking.id, { ...g, examinerId: me.id, at: new Date().toISOString() }); toast.success('نمره اسپیکینگ ثبت شد'); navigate('/teacher/grading'); }} />
        </div>
      </div>
      <ConfirmDialog isOpen={confirmNoShow} onOpenChange={setConfirmNoShow} title="ثبت غیبت در اسپیکینگ؟" description="نمره اسپیکینگ صفر ثبت می‌شود و نمره کل با همین نمره محاسبه می‌شود." confirmLabel="ثبت غیبت" onConfirm={() => { noShow(booking.id, me.id); setConfirmNoShow(false); navigate('/teacher/grading'); }} />
    </Page>
  );
}

export function TeacherCorrectionPage() {
  const { id } = useParams();
  const correction = useApp((s) => s.corrections.find((c) => c.id === id));
  const returnCorrection = useApp((s) => s.returnCorrection);
  const navigate = useNavigate();
  if (!correction) return <Navigate to="/teacher/grading" replace />;
  if (correction.status === 'returned')
    return <Page width="narrow"><Card><Empty icon={CircleCheck} title="این متن تصحیح و ارسال شده است" action={<Button size="sm" onPress={() => navigate('/teacher/grading')}>بازگشت به صف</Button>} /></Card></Page>;
  return (
    <Page width="wide">
      <PageHeader title={`تصحیح ${correction.code}`} description={`${TASK_LABEL[correction.task]}${correction.express ? ' · فوری' : ''}`} crumbs={[{ label: 'صف تصحیح', href: '/teacher/grading' }, { label: correction.code }]} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <ResponseView title={correction.task === 't2' ? 'Task 2' : 'Task 1'} prompt={correction.prompt} text={correction.text} min={correction.task === 't2' ? MIN_WORDS.t2 : MIN_WORDS.t1} />
        <SingleTaskForm onSubmit={(scores, comment) => { returnCorrection(correction.id, scores, comment); toast.success('بازخورد برای زبان‌آموز ارسال شد'); navigate('/teacher/grading'); }} />
      </div>
    </Page>
  );
}

function SingleTaskForm({ onSubmit }: { onSubmit: (scores: Record<WritingCriterion, number>, comment: string) => void }) {
  const [scores, setScores] = useState<Record<WritingCriterion, number | null>>({ ta: null, cc: null, lr: null, gra: null });
  const [comment, setComment] = useState('');
  const ready = Object.values(scores).every((v) => v != null) && comment.trim().length > 0;
  return (
    <Section title="نمره و بازخورد" actions={<span className="text-xl font-extrabold tabular">{Object.values(scores).every((v) => v != null) ? formatBand(criteriaBand(scores as Record<WritingCriterion, number>)) : '—'}</span>}>
      <div className="grid gap-4">
        {WRITING_CRITERIA.map((c) => <CriterionPicker key={c.id} label={c.label} en={c.en} value={scores[c.id]} onChange={(v) => setScores({ ...scores, [c.id]: v })} />)}
        <TextAreaField label="بازخورد و پیشنهاد اصلاح (به انگلیسی)" value={comment} onChange={setComment} rows={5} ltr />
        <Button isDisabled={!ready} onPress={() => onSubmit(scores as Record<WritingCriterion, number>, comment.trim())}><Pencil />ارسال بازخورد</Button>
      </div>
    </Section>
  );
}
