import {
  ArrowLeft, BookOpen, ChevronDown, ChevronLeft, ChevronRight, CircleCheck, CircleCheckFill, CircleInfo, Clock, Headphones, Lock, Microphone,
  Pencil, PlayFill, PlugConnection, PlugWire, Sliders, Stop, TriangleExclamation,
} from '@gravity-ui/icons';
import { Alert, Button, Card, Checkbox, Chip, cn, Spinner, Switch } from '@heroui/react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState, type ComponentType, type SVGProps } from 'react';
import { useBlocker, useNavigate } from 'react-router';
import { LogoMark } from '@/components/Logo';
import { EASE, Stagger, StaggerItem } from '@/components/motion';
import { BandTile } from '@/components/ui/Band';
import { ConfirmDialog, FormDialog } from '@/components/ui/Dialog';
import { Fact, Page, PageHeader, Section } from '@/components/ui/Page';
import { Timeline } from '@/components/ui/Timeline';
import { SAMPLE_WRITING } from '@/data/mockTests';
import { DELIVERY_LABEL, MODULE_LABEL } from '@/data/status';
import { formatDateTime, formatTimeSeconds } from '@/lib/dates';
import { clock, faNumber } from '@/lib/format';
import { MIN_WORDS, scoreSection, wordCount } from '@/lib/ielts';
import { useApp } from '@/store/app';
import { useUi } from '@/store/ui';
import type { MockBooking, MockTest, Settings, Student } from '@/types';
import { BarChart, GroupView, Paragraphs } from './ExamParts';
import { SECTION_LABEL, SECTIONS, useMockExam, type ExamSummary, type MockExam, type Section as ExamSection } from './useMockExam';

// The candidate's side of the written test: rules and sound check, the exam itself, the
// pause between sections and the finish page. Exam content is English (left-to-right);
// everything around it is Persian.

type Icon = ComponentType<SVGProps<SVGSVGElement>>;
const SECTION_ICON: Record<ExamSection, Icon> = { listening: Headphones, reading: BookOpen, writing: Pencil };

// ---------- audio ----------

const speechAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;

/** Reads a script aloud with an English voice and reports rough progress (0–1). Returns a stop function. */
function speak(text: string, { onEnd, onProgress }: { onEnd: () => void; onProgress?: (ratio: number) => void }) {
  if (!speechAvailable) {
    onEnd();
    return () => undefined;
  }
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-GB';
  utterance.rate = 0.95;
  const voices = synth.getVoices();
  const voice = voices.find((v) => v.lang.startsWith('en-GB')) ?? voices.find((v) => v.lang.startsWith('en'));
  if (voice) utterance.voice = voice;
  const estimate = (text.split(/\s+/).length / 2.5) * 1000;
  const started = Date.now();
  let spoken = 0;
  let ended = false;
  const timer = setInterval(() => onProgress?.(Math.min(0.98, Math.max(spoken, (Date.now() - started) / estimate))), 250);
  // Some browsers never fire `end` without an installed voice; never leave the player stuck.
  const safety = setTimeout(() => done(), estimate * 1.6 + 2000);
  function done() {
    if (ended) return;
    ended = true;
    clearInterval(timer);
    clearTimeout(safety);
    onProgress?.(1);
    onEnd();
  }
  utterance.onboundary = (event) => { spoken = event.charIndex / text.length; };
  utterance.onend = done;
  utterance.onerror = done;
  synth.cancel();
  synth.speak(utterance);
  return () => { ended = true; clearInterval(timer); clearTimeout(safety); };
}

function EqBars({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn('flex h-3.5 items-end gap-[3px]', className)}>
      {[0, 1, 2, 3].map((i) => <span key={i} className="eq-bar" />)}
    </span>
  );
}

// ---------- shared copy ----------

const disconnectRules = (s: Settings['mock']) => [
  'پاسخ هر سؤال همان لحظه ذخیره می‌شود و با قطع اتصال از بین نمی‌رود.',
  s.timerOnDisconnect === 'pause'
    ? `زمان آزمون هنگام قطع اتصال متوقف می‌شود و تا ${faNumber(s.graceMin)} دقیقه برای اتصال دوباره فرصت دارید.`
    : `زمان آزمون هنگام قطع اتصال ادامه پیدا می‌کند و تا ${faNumber(s.graceMin)} دقیقه برای اتصال دوباره فرصت دارید.`,
  `حداکثر ${faNumber(s.maxResumes)} بار می‌توانید پس از بسته شدن صفحه یا قطع اتصال به آزمون برگردید.`,
  'اگر مهلت اتصال یا فرصت‌های بازگشت تمام شود، آزمون با پاسخ‌های ثبت‌شده پایان می‌یابد.',
  ...(s.singleSession ? ['آزمون فقط در یک پنجره باز می‌ماند؛ باز کردن آن در پنجره دیگر، این پنجره را غیرفعال می‌کند.'] : []),
];

const LOG_LABEL: Record<string, string> = {
  start: 'شروع آزمون و Listening',
  listening_submitted: 'پایان Listening',
  listening_timeout: 'پایان زمان Listening',
  reading_start: 'شروع Reading',
  reading_submitted: 'پایان Reading',
  reading_timeout: 'پایان زمان Reading',
  writing_start: 'شروع Writing',
  writing_submitted: 'پایان Writing',
  writing_timeout: 'پایان زمان Writing',
  disconnect: 'قطع اتصال',
  resume: 'بازگشت به آزمون',
  completed: 'ثبت نهایی آزمون',
  timeout: 'ثبت خودکار با پایان زمان',
  connection: 'پایان به دلیل قطع اتصال',
};

function useSpeakingSlot(booking: MockBooking) {
  const session = useApp((s) => s.mockSessions.find((m) => m.id === booking.sessionId));
  const slot = session?.slots.find((x) => x.id === booking.slotId);
  const examiner = useApp((s) => s.teachers.find((t) => t.id === slot?.examinerId));
  return { session, slot, examiner };
}

// ---------- runner ----------

export function MockRunner({ booking, test, student }: { booking: MockBooking; test: MockTest; student: Student }) {
  const exam = useMockExam(booking, test);
  const setFocusMode = useUi((s) => s.setFocusMode);
  const onStage = exam.phase === 'running' || exam.phase === 'locked';
  useEffect(() => {
    setFocusMode(onStage);
    return () => setFocusMode(false);
  }, [onStage, setFocusMode]);
  useEffect(() => () => { if (speechAvailable) window.speechSynthesis.cancel(); }, []);

  if (exam.phase === 'intro') return <ExamIntro exam={exam} booking={booking} test={test} student={student} />;
  if (exam.phase === 'resume') return <ExamResume exam={exam} booking={booking} />;
  if (exam.phase === 'done') return <ExamDone booking={booking} test={test} summary={exam.summary} />;
  return <ExamStage exam={exam} booking={booking} test={test} student={student} />;
}

// ---------- before the exam ----------

function ExamIntro({ exam, booking, test, student }: { exam: MockExam; booking: MockBooking; test: MockTest; student: Student }) {
  const navigate = useNavigate();
  const s = exam.settings;
  const { slot, examiner } = useSpeakingSlot(booking);
  const [ready, setReady] = useState(false);
  const [heard, setHeard] = useState(false);
  const total = s.listeningMin + s.readingMin + s.writingMin;
  const minutes: Record<ExamSection, number> = { listening: s.listeningMin, reading: s.readingMin, writing: s.writingMin };
  const notes: Record<ExamSection, string> = {
    listening: `${faNumber(test.listening.length)} بخش · ${faNumber(exam.questions.listening.length)} سؤال`,
    reading: `${faNumber(test.reading.length)} متن · ${faNumber(exam.questions.reading.length)} سؤال`,
    writing: 'دو Task',
  };
  const en = (text: string) => <bdi className="font-semibold whitespace-nowrap text-foreground">{text}</bdi>;
  const rules = [
    <>بخش‌ها به ترتیب {en('Listening')}، {en('Reading')} و {en('Writing')} برگزار می‌شوند و هر کدام زمان جداگانه دارد. پس از پایان یک بخش، بازگشت به آن ممکن نیست.</>,
    <>فایل صوتی هر {en('Part')} فقط یک بار پخش می‌شود؛ پیش از پخش، سؤال‌های همان بخش را مرور کنید.</>,
    'در هر بخش می‌توانید بین سؤال‌ها جابه‌جا شوید و سؤال‌ها را با پرچم برای مرور علامت بزنید.',
    <>با پایان زمان هر بخش، پاسخ‌ها خودکار ثبت می‌شود. در رایتینگ، برای {en('Task 1')} دست‌کم {faNumber(MIN_WORDS.t1)} کلمه و برای {en('Task 2')} دست‌کم {faNumber(MIN_WORDS.t2)} کلمه بنویسید.</>,
    booking.delivery === 'online'
      ? `هدفون، اینترنت پایدار و حدود ${faNumber(total)} دقیقه زمان آرام و بدون وقفه آماده کنید.`
      : 'تلفن همراه را خاموش و به مراقب سالن تحویل دهید؛ هدفون روی هر میز آماده است.',
  ];

  return (
    <Page width="narrow">
      <PageHeader
        crumbs={[{ label: 'آزمون ماک', href: '/portal/mock' }, { label: booking.code, href: `/portal/mock/${booking.id}` }, { label: 'آزمون' }]}
        title="آماده شروع آزمون هستید؟"
        description="پیش از شروع، بخش‌ها و قواعد آزمون را مرور کنید. زمان Listening از لحظه زدن «شروع» محاسبه می‌شود."
      />
      <Stagger className="grid gap-4">
        <StaggerItem>
          <div className="relative overflow-hidden rounded-2xl bg-[var(--kl-blue-600)] p-5 text-white shadow-[0_12px_32px_rgb(47_49_148/0.25)] sm:p-6">
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="latin w-fit text-[11.5px] font-semibold tracking-[0.18em] text-white/65">IELTS MOCK TEST</div>
                <div className="mt-1.5 text-xl font-extrabold">آزمون {MODULE_LABEL[booking.module]}</div>
                <div className="mt-1 text-[13px] text-white/75">{student.name} · {DELIVERY_LABEL[booking.delivery]} · کد <bdi className="tabular">{booking.code}</bdi></div>
              </div>
              <div className="text-end">
                <div className="text-[12px] text-white/65">آزمون کتبی</div>
                <div className="text-[28px] leading-9 font-extrabold tabular">{faNumber(total)}<span className="ms-1 text-sm font-semibold">دقیقه</span></div>
              </div>
            </div>
            <ol className="relative mt-5 grid gap-2 sm:grid-cols-3">
              {SECTIONS.map((section) => {
                const SectionIcon = SECTION_ICON[section];
                return (
                  <li key={section} className="flex items-center gap-3 rounded-xl bg-white/[0.09] p-3.5 ring-1 ring-white/15 ring-inset sm:block">
                    <div className="flex shrink-0 items-center gap-2.5">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-[var(--kl-blue-600)]"><SectionIcon className="size-[18px]" /></span>
                      <span className="latin hidden text-sm font-bold sm:block">{SECTION_LABEL[section]}</span>
                    </div>
                    <div className="min-w-0 leading-tight sm:mt-3">
                      <div className="latin w-fit text-sm font-bold sm:hidden">{SECTION_LABEL[section]}</div>
                      <div className="text-[13px] font-semibold">{faNumber(minutes[section])} دقیقه</div>
                      <div className="mt-0.5 text-[12px] text-white/70">{notes[section]}</div>
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="relative mt-3 flex items-center gap-2 text-[13px] text-white/85">
              <Microphone className="size-4 shrink-0 text-[var(--kl-saffron-200)]" />
              <span><span className="ltr">Speaking</span> جداگانه: {slot ? `${formatDateTime(slot.at)}${examiner ? ` با ${examiner.name}` : ''}` : 'زمان آن در رزرو شما تعیین می‌شود.'}</span>
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <Section title="قواعد آزمون">
            <ol className="grid gap-3">
              {rules.map((rule, index) => (
                <li key={index} className="flex gap-3 text-sm leading-7 text-ink-2">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent-soft-foreground tabular">{faNumber(index + 1)}</span>
                  <span className="min-w-0">{rule}</span>
                </li>
              ))}
            </ol>
          </Section>
        </StaggerItem>

        <StaggerItem>
          <Alert status="accent">
            <Alert.Indicator><PlugConnection /></Alert.Indicator>
            <Alert.Content>
              <Alert.Title>اگر اتصال قطع شد</Alert.Title>
              <ul className="mt-1 grid list-disc gap-1.5 ps-4 text-[13px] leading-7 text-ink-2 marker:text-accent/50">
                {disconnectRules(s).map((rule) => <li key={rule}>{rule}</li>)}
              </ul>
            </Alert.Content>
          </Alert>
        </StaggerItem>

        <StaggerItem>
          <SoundCheck heard={heard} onHeard={() => setHeard(true)} />
        </StaggerItem>

        <StaggerItem>
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-secondary p-4 sm:flex-row sm:items-center sm:justify-between">
            <Checkbox isSelected={ready} onChange={setReady}>
              <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
              <Checkbox.Content className="text-sm leading-7">قواعد آزمون را خواندم و برای شروع آماده‌ام.</Checkbox.Content>
            </Checkbox>
            <div className="flex gap-2">
              <Button variant="secondary" onPress={() => navigate(`/portal/mock/${booking.id}`)}>بعداً</Button>
              <Button isDisabled={!ready} onPress={exam.start}>شروع Listening<ArrowLeft /></Button>
            </div>
          </div>
        </StaggerItem>
      </Stagger>
    </Page>
  );
}

function SoundCheck({ heard, onHeard }: { heard: boolean; onHeard: () => void }) {
  const [playing, setPlaying] = useState(false);
  const stop = useRef<() => void>(() => undefined);
  useEffect(() => () => stop.current(), []);
  const play = () => {
    setPlaying(true);
    stop.current = speak('This is a sound check for your listening test. Adjust the volume until you can hear this clearly.', { onEnd: () => { setPlaying(false); onHeard(); } });
  };
  return (
    <Card className="flex-row flex-wrap items-center gap-4 p-4">
      <span className={cn('grid size-11 shrink-0 place-items-center rounded-xl transition-colors', heard ? 'bg-success-soft text-success' : 'bg-accent-soft text-accent')}>
        {playing ? <EqBars className="h-4" /> : heard ? <CircleCheck className="size-5" /> : <Headphones className="size-5" />}
      </span>
      <div className="min-w-[180px] flex-1">
        <div className="text-sm font-semibold">بررسی صدا</div>
        <div className="text-[13px] leading-6 text-muted">{heard ? 'صدا شنیده شد. اگر لازم است، بلندی صدا را تنظیم کنید.' : 'هدفون را وصل کنید و صدای نمونه را پخش کنید.'}</div>
      </div>
      <Button size="sm" variant="secondary" isDisabled={playing} onPress={play}>
        <PlayFill />
        {playing ? 'در حال پخش…' : heard ? 'پخش دوباره' : 'پخش صدای نمونه'}
      </Button>
      {!speechAvailable ? <p className="w-full text-xs text-muted">مرورگر شما پخش صدا را پشتیبانی نمی‌کند؛ در این نمونه اولیه متن فایل صوتی نمایش داده می‌شود.</p> : null}
    </Card>
  );
}

function ExamResume({ exam, booking }: { exam: MockExam; booking: MockBooking }) {
  const navigate = useNavigate();
  const state = exam.exam!;
  const s = exam.settings;
  const left = s.maxResumes - state.resumesUsed;
  const answered = Object.values(state.answers).filter((v) => v.trim()).length;
  return (
    <Page width="narrow">
      <PageHeader
        crumbs={[{ label: 'آزمون ماک', href: '/portal/mock' }, { label: booking.code, href: `/portal/mock/${booking.id}` }, { label: 'آزمون' }]}
        title="آزمون شما نیمه‌تمام مانده است"
        badge={<Chip color="warning" variant="soft" size="sm">نیمه‌تمام</Chip>}
      />
      <Stagger className="grid gap-4">
        <StaggerItem>
          <Section>
            <p className="text-sm leading-7 text-ink-2">
              صفحه آزمون بسته یا دوباره بارگذاری شده است. پاسخ‌ها ذخیره شده‌اند و از <span className="ltr font-semibold">{SECTION_LABEL[state.section]}</span> ادامه می‌دهید.{' '}
              {s.timerOnDisconnect === 'run' ? 'زمان آزمون در این مدت متوقف نبوده است.' : 'زمان آزمون در این مدت متوقف بوده است.'} با ادامه، یکی از فرصت‌های بازگشت استفاده می‌شود.
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-separator pt-5 sm:grid-cols-4">
              <Fact label="بخش فعلی"><span className="ltr">{SECTION_LABEL[state.section]}</span>{state.between ? <span className="block text-xs font-normal text-muted">هنوز شروع نشده</span> : null}</Fact>
              <Fact label="زمان باقی‌مانده"><bdi className="tabular">{clock(state.remaining[state.section])}</bdi></Fact>
              <Fact label="پاسخ‌داده">{faNumber(answered)} سؤال</Fact>
              <Fact label="فرصت بازگشت">{faNumber(Math.max(0, left))} از {faNumber(s.maxResumes)}</Fact>
            </dl>
            {left <= 0 ? (
              <Alert status="warning" className="mt-5">
                <Alert.Indicator><TriangleExclamation /></Alert.Indicator>
                <Alert.Content><Alert.Description>فرصت بازگشت شما تمام شده است؛ با ادامه، آزمون با پاسخ‌های ثبت‌شده پایان می‌یابد.</Alert.Description></Alert.Content>
              </Alert>
            ) : null}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onPress={() => navigate(`/portal/mock/${booking.id}`)}>بازگشت به رزرو</Button>
              <Button onPress={exam.resume}>ادامه آزمون</Button>
            </div>
          </Section>
        </StaggerItem>
      </Stagger>
    </Page>
  );
}

// ---------- the exam ----------

function ExamStage({ exam, booking, test, student }: { exam: MockExam; booking: MockBooking; test: MockTest; student: Student }) {
  const navigate = useNavigate();
  const state = exam.exam!;
  const section = state.section;
  const running = exam.phase === 'running';
  const [dialog, setDialog] = useState<null | 'end' | 'guide'>(null);
  const [transcript, setTranscript] = useState(false);
  const [pane, setPane] = useState<'text' | 'questions'>('text');
  const seconds = state.remaining[section];
  const level = state.between ? null : seconds <= 60 ? 'danger' : seconds <= 300 ? 'warning' : null;
  const parts = section === 'listening' ? test.listening : section === 'reading' ? test.reading : [];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Leaving mid-exam behaves like closing the tab: coming back uses up a resume.
  const blocker = useBlocker(running);
  useEffect(() => {
    if (!running) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [running]);

  const sectionQuestions = section === 'writing' ? [] : exam.questions[section];
  const answered = sectionQuestions.filter((q) => state.answers[q.id]?.trim()).length;
  const flagged = sectionQuestions.filter((q) => state.flags.includes(q.id)).length;
  const words = { t1: wordCount(state.writing.t1), t2: wordCount(state.writing.t2) };

  const goTo = (questionId: string, part: number) => {
    if (part !== state.part) exam.setPart(part);
    setPane('questions');
    setTimeout(() => {
      const el = document.getElementById(`q-${questionId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.querySelector<HTMLElement>('input:not([type=radio]), select, input[type=radio]')?.focus({ preventScroll: true });
    }, part !== state.part ? 320 : 60);
  };

  return (
    <section aria-label="آزمون در حال انجام" className="fixed inset-0 z-50 flex flex-col bg-canvas">
      <header className="relative z-10 shrink-0 border-b border-border bg-surface/95 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-3 sm:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <LogoMark className="size-8 shrink-0" />
            <div className="hidden min-w-0 leading-tight sm:block">
              <div className="truncate text-sm font-bold">{student.name}</div>
              <div className="truncate text-xs text-muted">آزمون ماک {MODULE_LABEL[booking.module]} · <bdi className="tabular">{booking.code}</bdi></div>
            </div>
          </div>
          <div className="flex flex-col items-center leading-none" role="timer" aria-live="off" aria-label={`زمان باقی‌مانده ${SECTION_LABEL[section]}`}>
            <span dir="ltr" className={cn('text-[26px] font-bold tracking-tight tabular transition-colors', level === 'warning' && 'text-warning-soft-foreground', level === 'danger' && 'animate-pulse text-danger')}>{clock(seconds)}</span>
            <span className="mt-1 text-[11px] text-muted">{state.between ? 'زمان بخش بعد' : 'زمان باقی‌مانده'}</span>
          </div>
          <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2">
            <SavedNote lastSaved={exam.lastSaved} />
            <ConnectionBadge state={exam.connection} />
            <Button isIconOnly size="sm" variant="ghost" aria-label="راهنمای آزمون" onPress={() => setDialog('guide')}><CircleInfo /></Button>
            {!state.between ? <Button size="sm" variant="secondary" onPress={() => setDialog('end')}>پایان {SECTION_LABEL[section]}</Button> : null}
          </div>
        </div>
        <SectionSteps exam={exam} words={words} />
      </header>

      <AnimatePresence initial={false}>
        {level ? (
          <motion.div key={level} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: EASE }} className="shrink-0 overflow-hidden">
            <div role="status" className={cn('flex items-center justify-center gap-2 px-4 py-2 text-center text-[13px] font-semibold', level === 'danger' ? 'bg-danger text-white' : 'bg-warning-soft text-warning-soft-foreground')}>
              <Clock className="size-4 shrink-0" />
              {level === 'danger' ? 'کمتر از یک دقیقه باقی مانده است' : 'کمتر از ۵ دقیقه باقی مانده است'}
              <span className="hidden font-normal sm:inline">· با پایان زمان، پاسخ‌های این بخش خودکار ثبت می‌شود.</span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {state.between ? (
        <BetweenSections exam={exam} test={test} />
      ) : (
        <>
          {parts.length > 1 ? (
            <div role="tablist" aria-label={section === 'listening' ? 'Parts' : 'Passages'} className="exam-text flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-border bg-surface px-3 py-2 sm:px-5">
              {parts.map((part, i) => {
                const qs = part.groups.flatMap((g) => g.questions);
                const done = qs.filter((q) => state.answers[q.id]?.trim()).length;
                const active = state.part === i;
                return (
                  <button key={part.id} type="button" role="tab" aria-selected={active} onClick={() => { exam.setPart(i); setPane('text'); }}
                    className={cn('flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus', active ? 'bg-accent text-white' : 'text-ink-2 hover:bg-default')}>
                    {section === 'listening' ? 'Part' : 'Passage'} {i + 1}
                    <span aria-hidden className={cn('rounded-md px-1.5 text-[11px] tabular', active ? 'bg-white/20' : done === qs.length ? 'bg-success-soft text-success-soft-foreground' : 'bg-default text-ink-3')}>{done}/{qs.length}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
          <div className="relative min-h-0 flex-1">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={`${section}-${section === 'writing' ? 0 : state.part}`} className="absolute inset-0" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: EASE }}>
                {section === 'listening' ? <ListeningBody exam={exam} test={test} transcript={transcript} />
                  : section === 'reading' ? <ReadingBody exam={exam} test={test} pane={pane} onPane={setPane} />
                    : <WritingBody exam={exam} test={test} />}
              </motion.div>
            </AnimatePresence>
          </div>
          {section !== 'writing' ? <Navigator exam={exam} test={test} section={section} onGo={goTo} /> : null}
        </>
      )}

      <PrototypeTools exam={exam} section={section} transcript={transcript} onTranscript={setTranscript} />

      {/* Offline: the exam waits until the connection is back or the grace period runs out. */}
      <FormDialog
        isOpen={exam.connection !== 'online' && running}
        onOpenChange={() => undefined}
        isDismissable={false}
        size="sm"
        icon={exam.connection === 'reconnecting' ? <Spinner size="sm" /> : <PlugWire className="text-warning" />}
        title={exam.connection === 'reconnecting' ? 'در حال اتصال دوباره…' : 'اتصال اینترنت شما قطع شد'}
        description={exam.connection === 'reconnecting' ? 'پاسخ‌ها در حال همگام‌سازی است.' : 'پاسخ‌های ثبت‌شده محفوظ است. با برقراری اتصال، آزمون از همین‌جا ادامه پیدا می‌کند.'}
      >
        <div className="rounded-xl border border-[var(--kl-saffron-200)] bg-warning-soft px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-warning-soft-foreground">مهلت اتصال دوباره</span>
            <span dir="ltr" className="text-xl font-bold text-warning-soft-foreground tabular">{clock(exam.graceLeft)}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--kl-saffron-200)]/50" aria-hidden>
            <div className="h-full rounded-full bg-warning transition-[width] duration-1000 ease-linear" style={{ width: `${(exam.graceLeft / exam.GRACE) * 100}%` }} />
          </div>
        </div>
        <ul className="mt-3 grid list-disc gap-1 ps-4 text-[13px] leading-7 text-ink-2">
          <li>{exam.settings.timerOnDisconnect === 'pause' ? 'زمان آزمون تا برقراری اتصال متوقف است.' : 'زمان آزمون در این مدت همچنان می‌گذرد.'}</li>
          <li>این قطعی با زمان دقیق در گزارش آزمون ثبت می‌شود.</li>
        </ul>
        {exam.simulatedOffline && exam.connection === 'offline' ? (
          <Button variant="secondary" size="sm" className="mt-4 w-full border-dashed" onPress={() => exam.setSimulatedOffline(false)}>برقراری دوباره اتصال (نمونه اولیه)</Button>
        ) : null}
      </FormDialog>

      {/* Single window: this one was taken over by another window. */}
      <FormDialog
        isOpen={exam.phase === 'locked'}
        onOpenChange={() => undefined}
        isDismissable={false}
        size="sm"
        icon={<Lock className="text-warning" />}
        title="آزمون در پنجره دیگری باز شد"
        description="در هر لحظه فقط یک پنجره می‌تواند آزمون را ادامه دهد و این پنجره غیرفعال شد."
        footer={<><Button variant="tertiary" onPress={() => navigate(`/portal/mock/${booking.id}`)}>بازگشت به رزرو</Button><Button onPress={exam.resume}>ادامه در این پنجره</Button></>}
      >
        <p className="text-[13px] leading-6 text-ink-2">اگر آن پنجره را بسته‌اید، از همین‌جا ادامه دهید. این کار یک فرصت بازگشت حساب می‌شود ({faNumber(Math.max(0, exam.settings.maxResumes - state.resumesUsed))} فرصت باقی است).</p>
      </FormDialog>

      <ConfirmDialog
        isOpen={dialog === 'end'}
        onOpenChange={(open) => !open && setDialog(null)}
        tone={section === 'writing' ? 'accent' : 'warning'}
        title={section === 'writing' ? 'ثبت نهایی آزمون کتبی؟' : `پایان ${SECTION_LABEL[section]}؟`}
        description={section === 'writing' ? 'با پایان Writing، آزمون کتبی ثبت و برای تصحیح ارسال می‌شود و دیگر قابل تغییر نیست.' : 'پس از پایان این بخش نمی‌توانید به آن برگردید. زمان باقی‌مانده به بخش بعد منتقل نمی‌شود.'}
        confirmLabel={section === 'writing' ? 'ثبت نهایی آزمون' : 'پایان بخش'}
        cancelLabel="ادامه پاسخ‌گویی"
        onConfirm={() => { setDialog(null); exam.nextSection(); }}
      >
        <dl className="grid grid-cols-3 gap-2 rounded-xl bg-surface-secondary p-3 text-center">
          {section === 'writing' ? (
            <>
              <Fact label="Task 1"><span className={cn(words.t1 < MIN_WORDS.t1 && 'text-warning-soft-foreground')}>{faNumber(words.t1)} کلمه</span></Fact>
              <Fact label="Task 2"><span className={cn(words.t2 < MIN_WORDS.t2 && 'text-warning-soft-foreground')}>{faNumber(words.t2)} کلمه</span></Fact>
              <Fact label="زمان مانده"><bdi className="tabular">{clock(seconds)}</bdi></Fact>
            </>
          ) : (
            <>
              <Fact label="پاسخ‌داده">{faNumber(answered)} از {faNumber(sectionQuestions.length)}</Fact>
              <Fact label="بی‌پاسخ"><span className={cn(answered < sectionQuestions.length && 'text-warning-soft-foreground')}>{faNumber(sectionQuestions.length - answered)}</span></Fact>
              <Fact label="علامت‌خورده">{faNumber(flagged)}</Fact>
            </>
          )}
        </dl>
        {section === 'writing' && (words.t1 < MIN_WORDS.t1 || words.t2 < MIN_WORDS.t2) ? <p className="mt-2 text-[13px] leading-6 text-warning-soft-foreground">تعداد کلمه‌های یکی از Taskها کمتر از حداقل است؛ این روی نمره Task Achievement اثر دارد.</p> : null}
      </ConfirmDialog>

      <FormDialog isOpen={dialog === 'guide'} onOpenChange={(open) => !open && setDialog(null)} title="راهنمای آزمون" footer={<Button slot="close">متوجه شدم</Button>}>
        <ul className="grid list-disc gap-2 ps-4 text-sm leading-7 text-ink-2">
          <li>زمان بالای صفحه، زمان باقی‌مانده همین بخش است. پنج دقیقه و یک دقیقه مانده به پایان، هشدار می‌بینید.</li>
          <li>با زبانه‌های Part / Passage یا نوار پایین صفحه بین سؤال‌ها جابه‌جا شوید. شماره سؤال‌های پاسخ‌داده پررنگ است.</li>
          <li>با پرچم کنار هر سؤال، آن را برای مرور علامت بزنید؛ در نوار پایین با نقطه نارنجی دیده می‌شود.</li>
          <li>فایل صوتی هر Part فقط یک بار پخش می‌شود.</li>
          <li>پاسخ‌ها همان لحظه ذخیره می‌شوند. با «پایان بخش» می‌توانید زودتر به بخش بعد بروید.</li>
          {disconnectRules(exam.settings).slice(1, 3).map((rule) => <li key={rule}>{rule}</li>)}
        </ul>
      </FormDialog>

      <ConfirmDialog
        isOpen={blocker.state === 'blocked'}
        onOpenChange={(open) => !open && blocker.reset?.()}
        tone="warning"
        title="از آزمون خارج می‌شوید؟"
        description={`خروج مثل قطع اتصال حساب می‌شود: برای ادامه، یکی از ${faNumber(exam.settings.maxResumes)} فرصت بازگشت شما مصرف می‌شود و باید ظرف ${faNumber(exam.settings.graceMin)} دقیقه برگردید.`}
        confirmLabel="خروج از آزمون"
        cancelLabel="ادامه آزمون"
        onConfirm={() => { exam.leave(); blocker.proceed?.(); }}
      />
    </section>
  );
}

function SavedNote({ lastSaved }: { lastSaved: number | null }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!lastSaved) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(timer);
  }, [lastSaved]);
  return (
    <AnimatePresence>
      {visible ? (
        <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="hidden items-center gap-1 text-xs text-success-soft-foreground md:flex">
          <CircleCheck className="size-3.5" />
          ذخیره شد
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}

function ConnectionBadge({ state }: { state: MockExam['connection'] }) {
  const meta = {
    online: { tone: 'success', label: 'متصل', icon: <span className="size-1.5 animate-pulse rounded-full bg-success" /> },
    offline: { tone: 'danger', label: 'قطع اتصال', icon: <PlugWire className="size-3.5" /> },
    reconnecting: { tone: 'warning', label: 'در حال اتصال', icon: <Spinner size="sm" className="size-3" /> },
  } as const;
  const m = meta[state];
  return (
    <Chip color={m.tone} variant="soft" size="sm" className="hidden gap-1.5 sm:inline-flex" role="status" aria-live="polite">
      {m.icon}
      <Chip.Label>{m.label}</Chip.Label>
    </Chip>
  );
}

function SectionSteps({ exam, words }: { exam: MockExam; words: { t1: number; t2: number } }) {
  const state = exam.exam!;
  const current = SECTIONS.indexOf(state.section);
  return (
    <ol aria-label="بخش‌های آزمون" className="flex gap-2 px-3 pb-2.5 sm:gap-4 sm:px-5">
      {SECTIONS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        let ratio = done ? 1 : 0;
        let text = done ? 'ثبت شد' : `${faNumber(Math.round(exam.DURATION[s] / 60))} دقیقه`;
        if (active && s !== 'writing') {
          const qs = exam.questions[s];
          const n = qs.filter((q) => state.answers[q.id]?.trim()).length;
          ratio = qs.length ? n / qs.length : 0;
          text = `${faNumber(n)} از ${faNumber(qs.length)}`;
        } else if (active) {
          ratio = (Math.min(1, words.t1 / MIN_WORDS.t1) + Math.min(1, words.t2 / MIN_WORDS.t2)) / 2;
          text = `${faNumber(words.t1 + words.t2)} کلمه`;
        }
        if (active && state.between) { ratio = 0; text = 'آماده شروع'; }
        return (
          <li key={s} className="min-w-0 flex-1" aria-current={active ? 'step' : undefined}>
            <div className="mb-1 flex items-center justify-between gap-2 text-[11.5px]">
              <span className={cn('ltr flex items-center gap-1 font-bold', active ? 'text-foreground' : done ? 'text-accent' : 'text-ink-3')}>
                {done ? <CircleCheckFill className="size-3" /> : null}
                {SECTION_LABEL[s]}
              </span>
              <span className="truncate text-muted tabular">{text}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-default">
              <motion.div className="h-full rounded-full bg-accent" initial={false} animate={{ width: `${ratio * 100}%` }} transition={{ duration: 0.4, ease: EASE }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

const NEXT_INTRO: Record<ExamSection, string> = {
  listening: 'چهار Part با فایل صوتی که هر کدام فقط یک بار پخش می‌شود.',
  reading: 'سه متن با سؤال‌های چندگزینه‌ای، True / False / Not Given، تطبیق و جای خالی. متن و سؤال‌ها کنار هم نمایش داده می‌شوند.',
  writing: 'دو Task: Task 1 گزارش نمودار یا نامه با دست‌کم ۱۵۰ کلمه، و Task 2 یک مقاله با دست‌کم ۲۵۰ کلمه. Task 2 دو برابر Task 1 در نمره اثر دارد.',
};

function BetweenSections({ exam, test }: { exam: MockExam; test: MockTest }) {
  const state = exam.exam!;
  const section = state.section;
  const index = SECTIONS.indexOf(section);
  const prev = SECTIONS[index - 1];
  const prevQs = prev && prev !== 'writing' ? exam.questions[prev] : [];
  const prevAnswered = prevQs.filter((q) => state.answers[q.id]?.trim()).length;
  const NextIcon = SECTION_ICON[section];
  const content = section === 'reading' ? `${faNumber(test.reading.length)} متن · ${faNumber(exam.questions.reading.length)} سؤال` : section === 'writing' ? 'Task 1 و Task 2' : `${faNumber(test.listening.length)} Part`;
  return (
    <div className="grid flex-1 place-items-center overflow-y-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }} className="w-full max-w-[520px]">
        <Card className="gap-0 overflow-hidden p-0">
          {prev ? (
            <div className="flex items-center gap-2 border-b border-separator bg-success-soft px-5 py-3 text-[13px] font-semibold text-success-soft-foreground">
              <CircleCheckFill className="size-4 shrink-0" />
              <span><span className="ltr">{SECTION_LABEL[prev]}</span> ثبت شد · {faNumber(prevAnswered)} از {faNumber(prevQs.length)} سؤال پاسخ داده شد</span>
            </div>
          ) : null}
          <div className="grid justify-items-center gap-3 px-6 py-8 text-center">
            <motion.span initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4, ease: EASE, delay: 0.1 }} className="grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent">
              <NextIcon className="size-7" />
            </motion.span>
            <div className="latin text-[11.5px] font-bold tracking-[0.16em] text-accent" dir="ltr">SECTION {index + 1} OF {SECTIONS.length}</div>
            <h2 className="text-xl font-extrabold">آماده شروع <span className="ltr">{SECTION_LABEL[section]}</span> هستید؟</h2>
            <p className="max-w-sm text-sm leading-7 text-ink-2">{NEXT_INTRO[section]}</p>
            <dl className="mt-1 grid w-full grid-cols-2 gap-3 rounded-xl bg-surface-secondary p-4 text-start">
              <Fact label="زمان">{faNumber(Math.round(exam.DURATION[section] / 60))} دقیقه</Fact>
              <Fact label="محتوا">{content}</Fact>
            </dl>
            <Button size="lg" className="mt-2 w-full sm:w-auto" onPress={exam.openSection}>شروع {SECTION_LABEL[section]}<ArrowLeft /></Button>
            <p className="text-xs text-muted">زمان این بخش با زدن دکمه آغاز می‌شود.</p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

function ListeningBody({ exam, test, transcript }: { exam: MockExam; test: MockTest; transcript: boolean }) {
  const state = exam.exam!;
  const part = test.listening[state.part];
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const stop = useRef<() => void>(() => undefined);
  const played = state.played.includes(part.id);
  useEffect(() => () => { stop.current(); if (speechAvailable) window.speechSynthesis.cancel(); }, []);
  const play = () => {
    setPlaying(true);
    setProgress(0);
    exam.markPlayed(part.id);
    stop.current = speak(part.script, { onEnd: () => setPlaying(false), onProgress: setProgress });
  };
  const halt = () => { stop.current(); if (speechAvailable) window.speechSynthesis.cancel(); setPlaying(false); };
  const qs = part.groups.flatMap((g) => g.questions);
  const range = `${qs[0]?.n}–${qs[qs.length - 1]?.n}`;
  const locked = played && !playing && !transcript;
  const shown = played && !playing ? 1 : progress;
  return (
    <div className="h-full overflow-y-auto">
      <div className="exam-text mx-auto grid max-w-[880px] gap-5 px-4 py-6 sm:px-8 sm:py-8">
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-[0_1px_2px_rgb(12_17_23/0.04)] sm:p-5">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={playing ? halt : play}
              disabled={locked}
              aria-label={playing ? 'Stop recording' : played ? 'Recording played' : `Play recording for Part ${state.part + 1}`}
              className={cn(
                'grid size-14 shrink-0 place-items-center rounded-full outline-none transition-[background-color,box-shadow,transform] duration-200 focus-visible:ring-4 focus-visible:ring-[var(--kl-blue-100)] active:scale-95',
                locked ? 'cursor-default bg-success-soft text-success' : 'bg-accent text-white shadow-[0_8px_20px_rgb(47_49_148/0.32)] hover:bg-[var(--kl-blue-700)]',
              )}
            >
              {playing ? <Stop className="size-5" /> : locked ? <CircleCheck className="size-6" /> : <PlayFill className="size-6" />}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[11.5px] font-bold tracking-[0.14em] text-accent">PART {state.part + 1} · QUESTIONS {range}</span>
                {playing ? <EqBars className="text-accent" /> : null}
              </div>
              <div className="mt-0.5 text-[16px] leading-7 font-semibold">{part.context}</div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-default" aria-hidden>
              <div className={cn('h-full rounded-full transition-[width] duration-300', locked ? 'bg-success' : 'bg-accent')} style={{ width: `${shown * 100}%` }} />
            </div>
            <span className="shrink-0 text-[12px] text-muted" aria-live="polite">{playing ? 'Playing…' : played ? 'Recording finished' : 'You will hear the recording ONCE only'}</span>
          </div>
        </div>
        {transcript ? (
          <div className="rounded-2xl border border-dashed border-line-strong bg-surface-secondary p-4 text-[14px] leading-7 text-ink-2">
            <div className="mb-1 text-[11px] font-bold tracking-wider text-muted">TRANSCRIPT · PROTOTYPE</div>
            {part.script}
          </div>
        ) : null}
        {part.groups.map((group, i) => <GroupView key={i} group={group} answers={state.answers} onAnswer={exam.setAnswer} flags={state.flags} onFlag={exam.toggleFlag} />)}
      </div>
    </div>
  );
}

function ReadingBody({ exam, test, pane, onPane }: { exam: MockExam; test: MockTest; pane: 'text' | 'questions'; onPane: (pane: 'text' | 'questions') => void }) {
  const state = exam.exam!;
  const passage = test.reading[state.part];
  const qs = passage.groups.flatMap((g) => g.questions);
  const range = `${qs[0]?.n}–${qs[qs.length - 1]?.n}`;
  return (
    <div className="exam-text flex h-full flex-col lg:grid lg:grid-cols-2">
      <div role="tablist" aria-label="View" className="flex shrink-0 gap-1 border-b border-border bg-surface p-2 lg:hidden">
        {([['text', `Passage ${state.part + 1}`], ['questions', `Questions ${range}`]] as const).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={pane === id} onClick={() => onPane(id)} className={cn('flex-1 rounded-lg px-3 py-1.5 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-focus', pane === id ? 'bg-accent-soft text-accent' : 'text-ink-2')}>
            {label}
          </button>
        ))}
      </div>
      <article className={cn('min-h-0 flex-1 overflow-y-auto bg-surface px-5 py-6 text-[15.5px] leading-8 sm:px-8 lg:block lg:border-r lg:border-border', pane !== 'text' && 'hidden')}>
        <div className="mx-auto max-w-[640px]">
          <div className="text-[11.5px] font-bold tracking-[0.14em] text-accent">READING PASSAGE {state.part + 1}</div>
          <h2 className="mt-1 text-xl leading-8 font-bold">{passage.title}</h2>
          <p className="mb-5 text-[13px] leading-6 text-muted">You should spend about 20 minutes on Questions {range}, which are based on Reading Passage {state.part + 1}.</p>
          <Paragraphs text={passage.text} />
        </div>
      </article>
      <div className={cn('min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:block', pane !== 'questions' && 'hidden')}>
        <div className="mx-auto grid max-w-[640px] gap-5">
          {passage.groups.map((group, i) => <GroupView key={i} group={group} answers={state.answers} onAnswer={exam.setAnswer} flags={state.flags} onFlag={exam.toggleFlag} />)}
        </div>
      </div>
    </div>
  );
}

function WritingBody({ exam, test }: { exam: MockExam; test: MockTest }) {
  const state = exam.exam!;
  const [task, setTask] = useState<'t1' | 't2'>('t1');
  const prompt = task === 't1' ? test.writing.t1 : test.writing.t2;
  const words = wordCount(state.writing[task]);
  const min = MIN_WORDS[task];
  const n = task === 't1' ? 1 : 2;
  return (
    <div className="exam-text flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-3 py-2 sm:px-5">
        <div role="tablist" aria-label="Writing tasks" className="inline-flex gap-1 rounded-xl bg-surface-secondary p-1 ring-1 ring-border ring-inset">
          {(['t1', 't2'] as const).map((t) => {
            const w = wordCount(state.writing[t]);
            const ok = w >= MIN_WORDS[t];
            return (
              <button key={t} type="button" role="tab" aria-selected={task === t} onClick={() => setTask(t)}
                className={cn('flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-semibold outline-none transition-[background-color,color,box-shadow] focus-visible:ring-2 focus-visible:ring-focus', task === t ? 'bg-surface text-foreground shadow-[0_1px_3px_rgb(12_17_23/0.12)]' : 'text-ink-2 hover:text-foreground')}>
                Task {t === 't1' ? 1 : 2}
                <span className={cn('flex items-center gap-1 rounded-md px-1.5 text-[11px] tabular', ok ? 'bg-success-soft text-success-soft-foreground' : 'bg-default text-ink-3')}>{ok ? <CircleCheckFill className="size-3" /> : null}{w}</span>
              </button>
            );
          })}
        </div>
        <span className="ms-auto hidden text-[12px] text-muted sm:block">Task 2 contributes twice as much as Task 1 to the Writing score.</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto lg:grid lg:grid-cols-2 lg:overflow-hidden">
        <div className="border-b border-border bg-surface px-5 py-6 sm:px-8 lg:overflow-y-auto lg:border-r lg:border-b-0">
          <div className="mx-auto grid max-w-[620px] gap-4">
            <div>
              <div className="text-[11.5px] font-bold tracking-[0.14em] text-accent">WRITING TASK {n}</div>
              <div className="mt-1 text-[13px] text-muted">You should spend about {task === 't1' ? 20 : 40} minutes on this task. Write at least {min} words.</div>
            </div>
            <div className="whitespace-pre-line rounded-xl border border-border bg-surface-secondary/60 p-4 text-[15px] leading-8">{prompt.prompt}</div>
            {task === 't1' && test.writing.t1.chart ? <BarChart spec={test.writing.t1.chart} /> : null}
          </div>
        </div>
        <div className="flex flex-col px-4 py-5 sm:px-6 lg:min-h-0">
          <div className="flex min-h-[380px] flex-1 flex-col overflow-hidden rounded-2xl border border-line-strong bg-surface transition-[border-color,box-shadow] focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--kl-blue-100)] lg:min-h-0">
            <textarea
              key={task}
              aria-label={`Task ${n} answer`}
              value={state.writing[task]}
              onChange={(e) => exam.setWriting(task, e.target.value)}
              spellCheck={false}
              autoCorrect="off"
              className="min-h-0 flex-1 resize-none bg-transparent p-4 text-[15.5px] leading-8 outline-none sm:p-5"
              placeholder={`Write your answer to Task ${n} here…`}
            />
            <div className="flex items-center gap-3 border-t border-separator px-4 py-2.5">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-default" aria-hidden>
                <div className={cn('h-full rounded-full transition-[width] duration-300', words >= min ? 'bg-success' : 'bg-accent')} style={{ width: `${Math.min(1, words / min) * 100}%` }} />
              </div>
              <span className={cn('flex shrink-0 items-center gap-1.5 text-[12.5px] font-semibold tabular', words >= min ? 'text-success-soft-foreground' : 'text-ink-2')} aria-live="polite">
                {words >= min ? <CircleCheck className="size-3.5" /> : null}
                {words} / {min} words
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Navigator({ exam, test, section, onGo }: { exam: MockExam; test: MockTest; section: 'listening' | 'reading'; onGo: (id: string, part: number) => void }) {
  const state = exam.exam!;
  const parts = section === 'listening' ? test.listening : test.reading;
  const groups = useMemo(() => parts.map((part) => part.groups.flatMap((g) => g.questions)), [parts]);
  const total = groups.reduce((sum, qs) => sum + qs.length, 0);
  const answered = groups.flat().filter((q) => state.answers[q.id]?.trim()).length;
  const active = useRef<HTMLDivElement>(null);
  useEffect(() => { active.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }); }, [state.part]);
  return (
    <nav aria-label="Question navigator" className="exam-text flex shrink-0 items-center gap-2 border-t border-border bg-surface px-2 py-2 sm:gap-3 sm:px-4">
      <Button isIconOnly size="sm" variant="secondary" aria-label="Previous part" isDisabled={state.part === 0} onPress={() => exam.setPart(state.part - 1)}><ChevronLeft /></Button>
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-0.5 [scrollbar-width:thin]">
        {groups.map((qs, pi) => (
          <div key={parts[pi].id} ref={pi === state.part ? active : undefined} className={cn('flex shrink-0 items-center gap-1 rounded-xl px-1.5 py-1 transition-colors', pi === state.part ? 'bg-accent-soft' : '')}>
            <span className={cn('me-1 text-[11px] font-bold', pi === state.part ? 'text-accent' : 'text-muted')}>{section === 'listening' ? 'Part' : 'Passage'} {pi + 1}</span>
            {qs.map((q) => {
              const done = Boolean(state.answers[q.id]?.trim());
              const flag = state.flags.includes(q.id);
              return (
                <button key={q.id} type="button" onClick={() => onGo(q.id, pi)} aria-label={`Question ${q.n}${done ? ', answered' : ''}${flag ? ', flagged' : ''}`}
                  className={cn('relative grid size-8 shrink-0 place-items-center rounded-lg text-[12px] font-bold tabular outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-focus', done ? 'bg-accent text-white' : 'bg-surface text-ink-2 ring-1 ring-line-strong ring-inset hover:ring-accent')}>
                  {q.n}
                  {flag ? <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-warning ring-2 ring-surface" /> : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <span className="hidden shrink-0 text-[12px] text-muted tabular sm:block">{answered}/{total}</span>
      <Button isIconOnly size="sm" variant="secondary" aria-label="Next part" isDisabled={state.part === parts.length - 1} onPress={() => exam.setPart(state.part + 1)}><ChevronRight /></Button>
    </nav>
  );
}

function PrototypeTools({ exam, section, transcript, onTranscript }: { exam: MockExam; section: ExamSection; transcript: boolean; onTranscript: (on: boolean) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <aside aria-label="ابزار نمونه اولیه" className="fixed bottom-[4.25rem] left-3 z-20 rounded-2xl border border-dashed border-line-strong bg-surface/95 shadow-[0_8px_24px_rgb(12_17_23/0.1)] backdrop-blur">
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 rounded-2xl px-3.5 py-2.5 text-[12px] font-semibold text-muted outline-none focus-visible:ring-2 focus-visible:ring-focus">
        <Sliders className="size-3.5" />
        ابزار نمونه اولیه
        <ChevronDown className={cn('ms-auto size-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: EASE }} className="overflow-hidden">
            <div className="grid w-64 gap-3 px-3.5 pb-3.5">
              <Switch isSelected={exam.simulatedOffline} onChange={exam.setSimulatedOffline} size="sm">
                <Switch.Content className="flex w-full items-center justify-between gap-3"><span className="text-[13px]">شبیه‌سازی قطع اتصال</span><Switch.Control><Switch.Thumb /></Switch.Control></Switch.Content>
              </Switch>
              {section === 'listening' ? (
                <Switch isSelected={transcript} onChange={onTranscript} size="sm">
                  <Switch.Content className="flex w-full items-center justify-between gap-3"><span className="text-[13px]">متن فایل صوتی و پخش دوباره</span><Switch.Control><Switch.Thumb /></Switch.Control></Switch.Content>
                </Switch>
              ) : null}
              <Button size="sm" variant="secondary" className="w-full" onPress={() => exam.autoFill(SAMPLE_WRITING)}>پر کردن خودکار این بخش</Button>
              <Button size="sm" variant="secondary" className="w-full" onPress={exam.fastForward}>رساندن زمان بخش به ۵ ثانیه</Button>
              <Button size="sm" variant="tertiary" className="w-full" onPress={() => window.open(window.location.href, '_blank', 'noopener')}>باز کردن در زبانه دوم</Button>
              <p className="text-[11px] leading-5 text-muted">زبانه دوم، قفل یک‌پنجره‌ای آزمون را نشان می‌دهد.</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </aside>
  );
}

// ---------- after the exam ----------

const OUTCOME = {
  completed: { tone: 'success', icon: CircleCheck, title: 'آزمون کتبی شما ثبت شد', copy: 'پاسخ‌ها ثبت و رایتینگ برای ممتحن ارسال شد. کارنامه کامل پس از اسپیکینگ و تصحیح رایتینگ منتشر می‌شود و پیامک دریافت می‌کنید.' },
  timeout: { tone: 'warning', icon: Clock, title: 'زمان آزمون به پایان رسید', copy: 'پاسخ‌های ثبت‌شده تا این لحظه خودکار ارسال شد و رایتینگ برای ممتحن فرستاده شد.' },
  connection: { tone: 'danger', icon: PlugConnection, title: 'آزمون به دلیل قطع اتصال پایان یافت', copy: 'مهلت اتصال دوباره یا فرصت‌های بازگشت تمام شد و آزمون با پاسخ‌های ثبت‌شده پایان یافت. اگر مشکل فنی داشتید، با پذیرش آموزشگاه تماس بگیرید.' },
} as const;
const TONE_RING = { success: 'bg-success-soft text-success', warning: 'bg-warning-soft text-warning-soft-foreground', danger: 'bg-danger-soft text-danger' };

function ExamDone({ booking, test, summary }: { booking: MockBooking; test: MockTest; summary: ExamSummary | null }) {
  const navigate = useNavigate();
  const settings = useApp((s) => s.settings.mock);
  const live = useApp((s) => s.bookings.find((b) => b.id === booking.id)) ?? booking;
  const writingExaminer = useApp((s) => s.teachers.find((t) => t.id === live.writingExaminerId));
  const { slot, examiner } = useSpeakingSlot(live);
  const attempt = live.attempt;
  const meta = OUTCOME[attempt?.endReason ?? summary?.endReason ?? 'completed'];
  const answers = attempt?.answers ?? {};
  const listening = scoreSection(test, 'listening', answers);
  const reading = scoreSection(test, 'reading', answers);
  const answeredIn = (section: 'listening' | 'reading') => (section === 'listening' ? test.listening.flatMap((p) => p.groups) : test.reading.flatMap((p) => p.groups)).flatMap((g) => g.questions).filter((q) => answers[q.id]?.trim()).length;
  const words = { t1: wordCount(attempt?.writing.t1 ?? ''), t2: wordCount(attempt?.writing.t2 ?? '') };
  const log = attempt?.log ?? summary?.log ?? [];
  const resumes = summary?.resumesUsed ?? log.filter((e) => e.type === 'resume').length;
  const spent = summary?.spent ?? (attempt?.submittedAt ? (new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000 : 0);
  const spentMin = Math.max(1, Math.round(spent / 60));

  const steps = [
    { id: 'written', title: 'آزمون کتبی ثبت شد', detail: attempt?.submittedAt ? formatDateTime(attempt.submittedAt) : undefined, state: 'done' as const },
    { id: 'writing', title: 'تصحیح رایتینگ', detail: live.writing ? 'نمره ثبت شد' : writingExaminer ? `به ${writingExaminer.name} سپرده شد` : 'در صف تصحیح', state: live.writing ? ('done' as const) : ('current' as const) },
    { id: 'speaking', title: 'آزمون اسپیکینگ', detail: slot ? `${formatDateTime(slot.at)}${examiner ? ` · ${examiner.name}` : ''}` : 'زمان آن در رزرو شما تعیین می‌شود', meta: live.delivery === 'online' ? 'لینک جلسه آنلاین پیش از شروع پیامک می‌شود.' : 'در آموزشگاه؛ ۱۵ دقیقه زودتر حاضر باشید.', state: live.speaking ? ('done' as const) : ('muted' as const) },
    { id: 'release', title: 'انتشار کارنامه کامل', detail: settings.autoRelease ? 'خودکار، پس از ثبت هر دو نمره' : 'پس از بازبینی آموزش؛ پیامک دریافت می‌کنید', state: 'muted' as const },
  ];

  return (
    <Page width="narrow">
      <Stagger className="grid gap-4">
        <StaggerItem>
          <div className="flex flex-col items-center px-4 pt-6 pb-2 text-center">
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.45, ease: EASE }} className={cn('grid size-16 place-items-center rounded-full', TONE_RING[meta.tone])}>
              <meta.icon className="size-8" />
            </motion.div>
            <h1 className="mt-5 text-[22px] font-bold">{meta.title}</h1>
            <p className="mt-2 max-w-lg text-sm leading-7 text-ink-2">{meta.copy}</p>
          </div>
        </StaggerItem>

        {settings.instantLR && attempt ? (
          <StaggerItem>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <BandTile label="Listening" band={listening.band} sub={`${faNumber(listening.raw)} از ${faNumber(listening.total)} پاسخ درست`} />
              <BandTile label="Reading" band={reading.band} sub={`${faNumber(reading.raw)} از ${faNumber(reading.total)} پاسخ درست`} />
              <BandTile label="Writing" pending="در صف تصحیح ممتحن" />
              <BandTile label="Speaking" pending={slot ? `اسپیکینگ ${formatDateTime(slot.at)}` : 'پس از آزمون اسپیکینگ'} />
            </div>
          </StaggerItem>
        ) : null}

        <StaggerItem>
          <Section>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Fact label="Listening">{faNumber(answeredIn('listening'))} از {faNumber(listening.total)} پاسخ</Fact>
              <Fact label="Reading">{faNumber(answeredIn('reading'))} از {faNumber(reading.total)} پاسخ</Fact>
              <Fact label="Writing">{faNumber(words.t1)} + {faNumber(words.t2)} کلمه<span className="block text-xs font-normal text-muted">Task 1 + Task 2</span></Fact>
              <Fact label="زمان صرف‌شده">{faNumber(spentMin)} دقیقه<span className="block text-xs font-normal text-muted">{faNumber(resumes)} بار بازگشت</span></Fact>
            </dl>
          </Section>
        </StaggerItem>

        <StaggerItem>
          <Section title="مراحل بعد"><Timeline items={steps} /></Section>
        </StaggerItem>

        {log.length ? (
          <StaggerItem>
            <Section title="رویدادهای ثبت‌شده در گزارش آزمون" flush>
              <ol className="divide-y divide-separator border-t border-separator">
                {log.map((entry, i) => (
                  <li key={`${entry.type}-${entry.at}-${i}`} className="flex items-center justify-between gap-4 px-5 py-3 text-[13px]">
                    <span className="font-semibold">{LOG_LABEL[entry.type] ?? entry.type}</span>
                    <span className="text-muted">{entry.detail ? `${entry.detail} · ` : ''}<bdi className="tabular">{formatTimeSeconds(entry.at)}</bdi></span>
                  </li>
                ))}
              </ol>
            </Section>
          </StaggerItem>
        ) : null}

        <StaggerItem>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Button variant="secondary" onPress={() => navigate(`/portal/mock/${booking.id}`)}>جزئیات رزرو و اسپیکینگ</Button>
            {settings.instantLR && attempt ? <Button onPress={() => navigate(`/portal/mock/${booking.id}/result`)}>پاسخ‌نامه لیسنینگ و ریدینگ<ArrowLeft /></Button> : <Button onPress={() => navigate('/portal/mock')}>آزمون‌های من</Button>}
          </div>
          <div className="mt-3 flex justify-center">
            <Button size="sm" variant="ghost" className="border border-dashed border-line-strong text-ink-2" onPress={() => navigate('/try-mock')}>یک آزمون نمونه دیگر (نمونه اولیه)</Button>
          </div>
        </StaggerItem>
      </Stagger>
    </Page>
  );
}
