import { ArrowLeft, Pencil } from '@gravity-ui/icons';
import { Button, Card, Switch } from '@heroui/react';
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { BandBadge } from '@/components/ui/Band';
import { Empty } from '@/components/ui/Empty';
import { SelectField, TextAreaField } from '@/components/ui/Fields';
import { Page, PageHeader, Section } from '@/components/ui/Page';
import { MetaChip } from '@/components/ui/StatusChip';
import { Timeline } from '@/components/ui/Timeline';
import { PaymentDialog } from '@/features/enroll/Payment';
import { MOCK_TESTS } from '@/data/mockTests';
import { CORRECTION_META, TASK_LABEL } from '@/data/status';
import { formatDateTime, formatDay } from '@/lib/dates';
import { faNumber, toman } from '@/lib/format';
import { criteriaBand, MIN_WORDS, WRITING_CRITERIA, wordCount } from '@/lib/ielts';
import { useShallow } from 'zustand/react/shallow';
import { useApp, useSessionUser } from '@/store/app';
import type { CorrectionTask, Student } from '@/types';

const PROMPTS: Record<CorrectionTask, string> = { t1_academic: MOCK_TESTS[0].writing.t1.prompt, t1_general: MOCK_TESTS[1].writing.t1.prompt, t2: MOCK_TESTS[0].writing.t2.prompt };

export function StudentCorrectionsPage() {
  const me = useSessionUser() as Student;
  const corrections = useApp(useShallow((s) => s.corrections.filter((c) => c.studentId === me?.id)));
  const navigate = useNavigate();
  return (
    <Page>
      <PageHeader title="تصحیح رایتینگ" description="متن خود را بفرستید؛ ممتحن آیلتس آن را با چهار معیار رسمی نمره می‌دهد." actions={<Button onPress={() => navigate('/portal/corrections/new')}><Pencil />ارسال متن جدید</Button>} />
      {corrections.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {corrections.map((c) => (
            <Card key={c.id} className="gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div><div className="font-bold">{TASK_LABEL[c.task]}</div><div className="text-[13px] text-muted">کد {c.code} · {formatDay(c.createdAt)}{c.express ? ' · فوری' : ''}</div></div>
                <MetaChip meta={CORRECTION_META[c.status]} />
              </div>
              <p className="exam-text line-clamp-2 text-[13.5px] text-ink-2">{c.text}</p>
              <div className="flex items-center justify-between border-t border-separator pt-3">
                {c.grade ? <BandBadge band={criteriaBand(c.grade.scores)} /> : <span className="text-xs text-muted">{faNumber(wordCount(c.text))} کلمه</span>}
                <Button size="sm" variant="ghost" onPress={() => navigate(`/portal/corrections/${c.id}`)}>{c.status === 'held' ? 'پرداخت' : 'مشاهده'}<ArrowLeft /></Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card><Empty icon={Pencil} title="هنوز متنی نفرستاده‌اید" description="یک Task 1 یا Task 2 بنویسید و برای تصحیح بفرستید." action={<Button size="sm" onPress={() => navigate('/portal/corrections/new')}>ارسال متن</Button>} /></Card>
      )}
    </Page>
  );
}

export function StudentCorrectionNewPage() {
  const me = useSessionUser() as Student;
  const settings = useApp((s) => s.settings.mock);
  const holdCorrection = useApp((s) => s.holdCorrection);
  const navigate = useNavigate();
  const [task, setTask] = useState<CorrectionTask>('t2');
  const [prompt, setPrompt] = useState(PROMPTS.t2);
  const [text, setText] = useState('');
  const [express, setExpress] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const correction = useApp((s) => s.corrections.find((c) => c.id === id));
  const words = wordCount(text);
  const min = task === 't2' ? MIN_WORDS.t2 : MIN_WORDS.t1;
  const tooShort = words < 50;
  return (
    <Page width="narrow">
      <PageHeader title="ارسال متن برای تصحیح" crumbs={[{ label: 'تصحیح رایتینگ', href: '/portal/corrections' }, { label: 'متن جدید' }]} />
      <div className="grid gap-4">
        <Section title="نوع Task و صورت سؤال">
          <div className="grid gap-4">
            <SelectField label="نوع Task" value={task} onChange={(v) => { setTask(v as CorrectionTask); setPrompt(PROMPTS[v as CorrectionTask]); }} options={(Object.keys(TASK_LABEL) as CorrectionTask[]).map((k) => ({ id: k, label: TASK_LABEL[k] }))} />
            <TextAreaField label="صورت سؤال" value={prompt} onChange={setPrompt} rows={4} ltr description="می‌توانید صورت سؤال خودتان را جایگزین کنید." />
          </div>
        </Section>
        <Section title="متن شما" actions={<span className={words >= min ? 'text-xs font-semibold text-success-soft-foreground' : 'text-xs text-muted'}>{faNumber(words)} کلمه (حداقل {faNumber(min)})</span>}>
          <TextAreaField label="پاسخ" value={text} onChange={setText} rows={12} ltr error={text && tooShort ? 'متن کوتاه‌تر از آن است که بتوان نمره داد (حداقل ۵۰ کلمه).' : ''} />
        </Section>
        <Section>
          <div className="grid gap-4">
            <Switch isSelected={express} onChange={setExpress}>
              <Switch.Content className="flex w-full items-center justify-between gap-3"><span className="text-sm">تصحیح فوری (تا ۲۴ ساعت کاری)</span><Switch.Control><Switch.Thumb /></Switch.Control></Switch.Content>
            </Switch>
            <div className="flex items-center justify-between"><span className="text-sm text-ink-2">هزینه</span><span className="text-lg font-extrabold tabular">{toman(express ? settings.correctionExpressPrice : settings.correctionPrice)}</span></div>
            <Button size="lg" isDisabled={tooShort || prompt.trim().length < 10} onPress={() => setId(holdCorrection({ studentId: me.id, task, prompt, text, express }))}>پرداخت و ارسال</Button>
          </div>
        </Section>
      </div>
      <PaymentDialog invoiceId={correction?.invoiceId} isOpen={Boolean(correction && correction.status === 'held')} onOpenChange={(open) => !open && navigate('/portal/corrections')} onPaid={() => setTimeout(() => navigate(`/portal/corrections/${id}`), 900)} allowInstallments={false} />
    </Page>
  );
}

export function StudentCorrectionPage() {
  const { id } = useParams();
  const me = useSessionUser() as Student;
  const correction = useApp((s) => s.corrections.find((c) => c.id === id && c.studentId === me?.id));
  const examiner = useApp((s) => s.teachers.find((t) => t.id === correction?.examinerId));
  const [pay, setPay] = useState(false);
  if (!correction) return <Navigate to="/portal/corrections" replace />;
  return (
    <Page width="narrow">
      <PageHeader title={TASK_LABEL[correction.task]} badge={<MetaChip meta={CORRECTION_META[correction.status]} />} crumbs={[{ label: 'تصحیح رایتینگ', href: '/portal/corrections' }, { label: correction.code }]} actions={correction.status === 'held' ? <Button onPress={() => setPay(true)}>پرداخت</Button> : null} />
      <div className="grid gap-4">
        {correction.grade ? (
          <Section title="نمره و بازخورد" actions={<BandBadge band={criteriaBand(correction.grade.scores)} />}>
            <dl className="grid gap-2 sm:grid-cols-4">
              {WRITING_CRITERIA.map((c) => <div key={c.id} className="rounded-lg bg-surface-secondary p-3 text-[13px]"><dt className="text-ink-2">{c.label}</dt><dd className="mt-1 text-lg font-extrabold tabular">{faNumber(correction.grade!.scores[c.id])}</dd></div>)}
            </dl>
            <p className="exam-text mt-4 text-[14px] leading-7">{correction.grade.comment}</p>
            <p className="mt-2 text-xs text-muted">ممتحن: {examiner?.name} · {formatDateTime(correction.grade.at)}</p>
          </Section>
        ) : null}
        <Section title="متن ارسالی"><div className="exam-text whitespace-pre-line text-[14.5px] leading-8">{correction.text}</div></Section>
        <Section title="روند"><Timeline items={correction.events.map((e) => ({ id: e.id, title: e.title, detail: e.detail, meta: formatDateTime(e.at), state: 'done' }))} /></Section>
      </div>
      <PaymentDialog invoiceId={correction.invoiceId} isOpen={pay} onOpenChange={setPay} allowInstallments={false} />
    </Page>
  );
}
