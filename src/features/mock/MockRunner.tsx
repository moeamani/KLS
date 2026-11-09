import { ChevronDown, CircleCheck, CircleInfo, Clock, Headphones, Lock, PlayFill, PlugWire, Sliders, Stop, TriangleExclamation } from '@gravity-ui/icons';
import { Alert, Button, Card, Chip, cn, Spinner, Switch } from '@heroui/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { LogoMark } from '@/components/Logo';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { SAMPLE_WRITING } from '@/data/mockTests';
import { MODULE_LABEL } from '@/data/status';
import { clock, faNumber } from '@/lib/format';
import { formatBand, MIN_WORDS, scoreSection, wordCount } from '@/lib/ielts';
import { useApp } from '@/store/app';
import { useUi } from '@/store/ui';
import type { MockBooking, MockTest, Student } from '@/types';
import { BarChart, GroupView, Paragraphs } from './ExamParts';
import { SECTION_LABEL, SECTIONS, useMockExam, type MockExam, type Section } from './useMockExam';

const speechAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;

function speak(text: string, onEnd: () => void) {
  if (!speechAvailable) return onEnd();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-GB';
  utterance.rate = 0.95;
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith('en-GB')) ?? window.speechSynthesis.getVoices().find((v) => v.lang.startsWith('en'));
  if (voice) utterance.voice = voice;
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function MockRunner({ booking, test, student }: { booking: MockBooking; test: MockTest; student: Student }) {
  const exam = useMockExam(booking, test);
  const setFocusMode = useUi((s) => s.setFocusMode);
  const running = exam.phase === 'running';
  useEffect(() => {
    setFocusMode(running);
    return () => setFocusMode(false);
  }, [running, setFocusMode]);
  useEffect(() => () => { if (speechAvailable) window.speechSynthesis.cancel(); }, []);

  if (exam.phase === 'intro' || exam.phase === 'resume') return <ExamIntro exam={exam} booking={booking} test={test} />;
  if (exam.phase === 'locked') return <LockedScreen exam={exam} />;
  if (exam.phase === 'done') return <DoneScreen booking={booking} test={test} />;
  return <ExamStage exam={exam} booking={booking} test={test} student={student} />;
}

function ExamIntro({ exam, booking, test }: { exam: MockExam; booking: MockBooking; test: MockTest }) {
  const s = exam.settings;
  const [checked, setChecked] = useState(false);
  const [testing, setTesting] = useState(false);
  const resume = exam.phase === 'resume';
  const rows = [
    ['Listening', `${faNumber(s.listeningMin)} دقیقه`, 'فایل صوتی هر بخش فقط یک بار پخش می‌شود.'],
    ['Reading', `${faNumber(s.readingMin)} دقیقه`, `${faNumber(exam.questions.reading.length)} سؤال در ${faNumber(test.reading.length)} متن.`],
    ['Writing', `${faNumber(s.writingMin)} دقیقه`, 'Task 1 حداقل ۱۵۰ و Task 2 حداقل ۲۵۰ کلمه.'],
  ];
  return (
    <div className="mx-auto grid max-w-[760px] gap-5 px-4 py-8 sm:px-8">
      <div>
        <div className="text-[13px] font-semibold text-accent">آزمون ماک · {MODULE_LABEL[booking.module]} · کد {booking.code}</div>
        <h1 className="mt-1 text-[24px] font-extrabold">{resume ? 'ادامه آزمون' : 'پیش از شروع آزمون'}</h1>
      </div>
      {resume ? (
        <Alert status="warning">
          <Alert.Indicator><TriangleExclamation /></Alert.Indicator>
          <Alert.Content>
            <Alert.Title>آزمون نیمه‌تمام است</Alert.Title>
            <Alert.Description>
              صفحه بسته یا بارگذاری شده است. پاسخ‌ها ذخیره شده‌اند و از همان بخش ادامه می‌دهید. {s.timerOnDisconnect === 'run' ? 'زمان در این مدت متوقف نشده است.' : 'زمان در این مدت متوقف بوده است.'} فرصت بازگشت: {faNumber(Math.max(0, s.maxResumes - (exam.exam?.resumesUsed ?? 0)))} از {faNumber(s.maxResumes)}.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
      <Card className="gap-0 p-0">
        {rows.map(([name, time, note]) => (
          <div key={name} className="flex items-center gap-4 border-b border-separator px-5 py-3.5 last:border-0">
            <span className="ltr w-24 text-start text-sm font-bold">{name}</span>
            <span className="w-20 text-[13px] font-semibold text-ink-2">{time}</span>
            <span className="text-[13px] text-muted">{note}</span>
          </div>
        ))}
        <div className="flex items-center gap-4 bg-surface-secondary px-5 py-3.5 text-[13px] text-muted">
          <span className="ltr w-24 text-start font-bold text-foreground">Speaking</span>
          جداگانه، در زمانی که در رزرو شما تعیین شده است.
        </div>
      </Card>
      <ul className="grid gap-2 text-[13.5px] leading-7 text-ink-2">
        <li>• بخش‌ها به ترتیب برگزار می‌شوند و پس از پایان هر بخش نمی‌توانید به آن برگردید.</li>
        <li>• با پایان زمان هر بخش، پاسخ‌ها خودکار ثبت می‌شود و بخش بعد آماده شروع است.</li>
        <li>• آزمون فقط در یک پنجره مرورگر باز می‌ماند. اگر اتصال قطع شود، تا {faNumber(s.graceMin)} دقیقه فرصت اتصال دوباره دارید.</li>
      </ul>
      {!resume ? (
        <Card className="flex-row flex-wrap items-center gap-4 p-4">
          <Headphones className="size-5 text-accent" />
          <div className="min-w-0 flex-1 text-[13.5px]">
            <div className="font-semibold">بررسی صدا</div>
            <div className="text-muted">هدفون را وصل کنید و صدای آزمایشی را پخش کنید.</div>
          </div>
          <Button size="sm" variant="secondary" isPending={testing} onPress={() => { setTesting(true); speak('This is a sound check for your listening test.', () => { setTesting(false); setChecked(true); }); }}>
            <PlayFill />پخش صدای آزمایشی
          </Button>
          {checked ? <Chip size="sm" color="success" variant="soft">صدا شنیده شد</Chip> : null}
        </Card>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button size="lg" onPress={resume ? exam.resume : exam.start}>{resume ? 'ادامه آزمون' : 'شروع Listening'}</Button>
      </div>
      {!speechAvailable ? <p className="text-xs text-muted">مرورگر شما پخش صدا را پشتیبانی نمی‌کند؛ در نمونه اولیه متن فایل صوتی نمایش داده می‌شود.</p> : null}
    </div>
  );
}

function LockedScreen({ exam }: { exam: MockExam }) {
  return (
    <div className="mx-auto grid max-w-md justify-items-center gap-3 px-6 py-20 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-warning-soft text-warning-soft-foreground"><Lock className="size-6" /></span>
      <h1 className="text-xl font-bold">آزمون در پنجره دیگری باز شد</h1>
      <p className="text-sm leading-7 text-muted">در هر لحظه فقط یک پنجره می‌تواند آزمون را ادامه دهد. اگر آن پنجره را بسته‌اید، از اینجا ادامه دهید؛ این کار یک فرصت بازگشت حساب می‌شود.</p>
      <Button onPress={exam.resume}>ادامه در این پنجره</Button>
    </div>
  );
}

function DoneScreen({ booking, test }: { booking: MockBooking; test: MockTest }) {
  const navigate = useNavigate();
  const instant = useApp((s) => s.settings.mock.instantLR);
  const live = useApp((s) => s.bookings.find((b) => b.id === booking.id)) ?? booking;
  const answers = live.attempt?.answers ?? {};
  const listening = scoreSection(test, 'listening', answers);
  const reading = scoreSection(test, 'reading', answers);
  return (
    <div className="mx-auto grid max-w-[640px] justify-items-center gap-4 px-6 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-success-soft text-success"><CircleCheck className="size-7" /></span>
      <h1 className="text-[22px] font-extrabold">آزمون کتبی ثبت شد</h1>
      <p className="max-w-md text-sm leading-7 text-muted">رایتینگ شما برای ممتحن ارسال شد. نمره کامل پس از آزمون اسپیکینگ و تصحیح رایتینگ منتشر می‌شود و پیامک دریافت می‌کنید.</p>
      {instant && live.attempt ? (
        <div className="grid w-full max-w-sm grid-cols-2 gap-3">
          {[['Listening', listening], ['Reading', reading]].map(([name, score]) => {
            const sc = score as typeof listening;
            return (
              <div key={name as string} className="rounded-xl border border-border p-4">
                <div className="ltr text-[13px] text-muted">{name as string}</div>
                <div className="text-[30px] font-extrabold tabular">{formatBand(sc.band)}</div>
                <div className="text-xs text-muted">{faNumber(sc.raw)} از {faNumber(sc.total)} پاسخ درست</div>
              </div>
            );
          })}
        </div>
      ) : null}
      <Button onPress={() => navigate(`/portal/mock/${booking.id}`)}>مشاهده رزرو و زمان اسپیکینگ</Button>
    </div>
  );
}

function Timer({ seconds }: { seconds: number }) {
  const level = seconds <= 60 ? 'danger' : seconds <= 300 ? 'warning' : null;
  return (
    <div role="timer" aria-label={`زمان باقی‌مانده ${clock(seconds)}`} className={cn('flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[15px] font-bold tabular', level === 'danger' ? 'bg-danger-soft text-danger' : level === 'warning' ? 'bg-warning-soft text-warning-soft-foreground' : 'bg-default text-foreground')}>
      <Clock className="size-4" />
      {clock(seconds)}
    </div>
  );
}

function ExamStage({ exam, booking, test, student }: { exam: MockExam; booking: MockBooking; test: MockTest; student: Student }) {
  const state = exam.exam!;
  const section = state.section;
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [transcript, setTranscript] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const parts = section === 'listening' ? test.listening : section === 'reading' ? test.reading : [];
  const sectionQuestions = section === 'writing' ? [] : exam.questions[section];
  const unanswered = sectionQuestions.filter((q) => !state.answers[q.id]?.trim()).length;
  const writingShort = section === 'writing' && (wordCount(state.writing.t1) < MIN_WORDS.t1 || wordCount(state.writing.t2) < MIN_WORDS.t2);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const goTo = (questionId: string, part: number) => {
    if (part !== state.part) exam.setPart(part);
    setTimeout(() => document.getElementById(`q-${questionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  };

  return (
    <div className="flex h-dvh flex-col bg-canvas">
      <header className="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-3 py-2 sm:px-5">
        <LogoMark className="size-7" />
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[13px] font-bold">{student.name}</div>
          <div className="text-[11px] text-muted">کد {booking.code} · {MODULE_LABEL[booking.module]}</div>
        </div>
        <nav aria-label="بخش‌های آزمون" className="mx-auto flex items-center gap-1">
          {SECTIONS.map((s) => (
            <span key={s} className={cn('ltr rounded-full px-3 py-1 text-xs font-bold', s === section ? 'bg-accent text-white' : SECTIONS.indexOf(s) < SECTIONS.indexOf(section) ? 'bg-success-soft text-success-soft-foreground' : 'bg-default text-ink-3')}>{SECTION_LABEL[s]}</span>
          ))}
        </nav>
        <ConnectionChip state={exam.connection} />
        <Timer seconds={state.remaining[section]} />
        {!state.between ? <Button size="sm" variant="secondary" onPress={() => setConfirmEnd(true)}>پایان {SECTION_LABEL[section]}</Button> : null}
      </header>

      {exam.connection === 'offline' ? (
        <div className="flex items-center justify-center gap-2 bg-danger px-4 py-2 text-[13px] font-semibold text-white" role="alert">
          <PlugWire className="size-4" />
          اتصال قطع شد. پاسخ‌ها ذخیره است؛ {clock(exam.graceLeft)} برای اتصال دوباره فرصت دارید.
        </div>
      ) : null}

      {state.between ? (
        <BetweenSections section={section} onOpen={exam.openSection} minutes={Math.round(state.remaining[section] / 60)} />
      ) : (
        <>
          {parts.length > 1 ? (
            <div className="exam-text flex gap-1 border-b border-border bg-surface px-3 sm:px-5" role="tablist">
              {parts.map((part, i) => (
                <button key={part.id} type="button" role="tab" aria-selected={state.part === i} onClick={() => exam.setPart(i)} className={cn('border-b-2 px-3 py-2 text-[13px] font-semibold outline-none focus-visible:bg-default', state.part === i ? 'border-accent text-foreground' : 'border-transparent text-muted hover:text-foreground')}>
                  {section === 'listening' ? `Part ${i + 1}` : `Passage ${i + 1}`}
                </button>
              ))}
            </div>
          ) : null}
          <div ref={bodyRef} className="min-h-0 flex-1 overflow-hidden">
            {section === 'listening' ? <ListeningBody exam={exam} test={test} transcript={transcript} /> : section === 'reading' ? <ReadingBody exam={exam} test={test} /> : <WritingBody exam={exam} test={test} />}
          </div>
          {section !== 'writing' ? <Navigator exam={exam} test={test} section={section} onGo={goTo} /> : null}
        </>
      )}

      <div className="fixed bottom-20 left-3 z-40 sm:bottom-24">
        {showTools ? (
          <Card className="w-72 gap-3 p-4 shadow-[0_8px_30px_rgb(12_17_23/0.16)]">
            <div className="flex items-center justify-between text-xs font-bold text-muted">ابزار نمونه اولیه<button type="button" onClick={() => setShowTools(false)} aria-label="بستن"><ChevronDown className="size-4" /></button></div>
            <Switch isSelected={exam.simulatedOffline} onChange={exam.setSimulatedOffline} size="sm">
              <Switch.Content className="flex w-full items-center justify-between gap-3"><span className="text-[13px]">شبیه‌سازی قطع اتصال</span><Switch.Control><Switch.Thumb /></Switch.Control></Switch.Content>
            </Switch>
            {section === 'listening' ? (
              <Switch isSelected={transcript} onChange={setTranscript} size="sm">
                <Switch.Content className="flex w-full items-center justify-between gap-3"><span className="text-[13px]">نمایش متن فایل صوتی</span><Switch.Control><Switch.Thumb /></Switch.Control></Switch.Content>
              </Switch>
            ) : null}
            <Button size="sm" variant="secondary" onPress={() => exam.autoFill(SAMPLE_WRITING)}>پر کردن خودکار این بخش</Button>
            <Button size="sm" variant="secondary" onPress={exam.fastForward}>رساندن زمان بخش به ۵ ثانیه</Button>
            <p className="text-[11px] leading-5 text-muted">برای آزمودن قفل یک‌پنجره‌ای، همین آزمون را در زبانه دیگری باز کنید.</p>
          </Card>
        ) : (
          <Button size="sm" variant="secondary" className="shadow-[0_6px_20px_rgb(12_17_23/0.12)]" onPress={() => setShowTools(true)}><Sliders />ابزار نمونه اولیه</Button>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmEnd}
        onOpenChange={setConfirmEnd}
        title={`پایان ${SECTION_LABEL[section]}؟`}
        description={section === 'writing' ? 'با پایان Writing، آزمون کتبی ثبت می‌شود و دیگر قابل تغییر نیست.' : 'پس از پایان این بخش نمی‌توانید به آن برگردید.'}
        confirmLabel={section === 'writing' ? 'ثبت نهایی آزمون' : 'پایان بخش'}
        tone="warning"
        onConfirm={() => { setConfirmEnd(false); exam.nextSection(); }}
      >
        {unanswered ? <p className="text-[13px] text-warning-soft-foreground">{faNumber(unanswered)} سؤال بی‌پاسخ مانده است.</p> : null}
        {writingShort ? <p className="text-[13px] text-warning-soft-foreground">تعداد کلمه‌های یکی از Taskها کمتر از حداقل است؛ این روی نمره اثر دارد.</p> : null}
      </ConfirmDialog>
    </div>
  );
}

function ConnectionChip({ state }: { state: MockExam['connection'] }) {
  const meta = { online: { tone: 'success', label: 'متصل', icon: <span className="size-1.5 animate-pulse rounded-full bg-success" /> }, offline: { tone: 'danger', label: 'قطع', icon: <PlugWire className="size-3.5" /> }, reconnecting: { tone: 'warning', label: 'اتصال…', icon: <Spinner size="sm" className="size-3" /> } }[state];
  return <Chip color={meta.tone as 'success'} variant="soft" size="sm" className="hidden gap-1.5 sm:inline-flex" role="status" aria-live="polite">{meta.icon}<Chip.Label>{meta.label}</Chip.Label></Chip>;
}

function BetweenSections({ section, onOpen, minutes }: { section: Section; onOpen: () => void; minutes: number }) {
  return (
    <div className="grid flex-1 place-items-center px-6">
      <div className="grid max-w-md justify-items-center gap-3 text-center">
        <span className="ltr text-[13px] font-bold text-accent">{SECTION_LABEL[section]}</span>
        <h2 className="text-xl font-extrabold">بخش بعد آماده است</h2>
        <p className="text-sm leading-7 text-muted">بخش قبل ثبت شد. زمان {SECTION_LABEL[section]} ({faNumber(minutes)} دقیقه) با شروع این بخش آغاز می‌شود.</p>
        <Button size="lg" onPress={onOpen}>شروع {SECTION_LABEL[section]}</Button>
      </div>
    </div>
  );
}

function ListeningBody({ exam, test, transcript }: { exam: MockExam; test: MockTest; transcript: boolean }) {
  const state = exam.exam!;
  const part = test.listening[state.part];
  const [playing, setPlaying] = useState(false);
  const played = state.played.includes(part.id);
  useEffect(() => () => { if (speechAvailable) window.speechSynthesis.cancel(); setPlaying(false); }, [part.id]);
  const play = () => {
    setPlaying(true);
    exam.markPlayed(part.id);
    speak(part.script, () => setPlaying(false));
  };
  return (
    <div className="h-full overflow-y-auto">
      <div className="exam-text mx-auto grid max-w-[860px] gap-6 px-4 py-6 sm:px-8">
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-4">
          <Button isIconOnly size="lg" aria-label={playing ? 'Stop' : 'Play recording'} isDisabled={played && !playing && !transcript} onPress={playing ? () => { window.speechSynthesis?.cancel(); setPlaying(false); } : play}>
            {playing ? <Stop /> : <PlayFill />}
          </Button>
          <div className="min-w-[180px] flex-1">
            <div className="text-[15px] font-bold">{part.title}</div>
            <div className="text-[13px] text-ink-2">{part.context}</div>
          </div>
          <span className="w-full text-xs text-muted sm:w-auto">{playing ? 'Playing…' : played ? 'Recording played' : 'You will hear the recording once.'}</span>
        </div>
        {transcript ? <div className="rounded-xl border border-dashed border-line-strong bg-surface-secondary p-4 text-[14px] leading-7 text-ink-2">{part.script}</div> : null}
        {part.groups.map((group, i) => <GroupView key={i} group={group} answers={state.answers} onAnswer={exam.setAnswer} flags={state.flags} onFlag={exam.toggleFlag} />)}
      </div>
    </div>
  );
}

function ReadingBody({ exam, test }: { exam: MockExam; test: MockTest }) {
  const state = exam.exam!;
  const passage = test.reading[state.part];
  return (
    <div className="exam-text grid h-full lg:grid-cols-2">
      <article className="overflow-y-auto border-b border-border bg-surface px-5 py-6 text-[15px] leading-8 sm:px-8 lg:border-r lg:border-b-0">
        <h2 className="mb-4 text-lg font-bold">{passage.title}</h2>
        <Paragraphs text={passage.text} />
      </article>
      <div className="grid content-start gap-8 overflow-y-auto px-5 py-6 sm:px-8">
        {passage.groups.map((group, i) => <GroupView key={i} group={group} answers={state.answers} onAnswer={exam.setAnswer} flags={state.flags} onFlag={exam.toggleFlag} />)}
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
  return (
    <div className="exam-text grid h-full grid-rows-[auto_1fr]">
      <div className="flex gap-1 border-b border-border bg-surface px-3 sm:px-5" role="tablist">
        {(['t1', 't2'] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={task === t} onClick={() => setTask(t)} className={cn('flex items-center gap-2 border-b-2 px-3 py-2 text-[13px] font-semibold outline-none', task === t ? 'border-accent' : 'border-transparent text-muted')}>
            Task {t === 't1' ? 1 : 2}
            <span className={cn('rounded px-1.5 text-[11px] tabular', wordCount(state.writing[t]) >= MIN_WORDS[t] ? 'bg-success-soft text-success-soft-foreground' : 'bg-default text-ink-3')}>{wordCount(state.writing[t])}</span>
          </button>
        ))}
      </div>
      <div className="grid min-h-0 lg:grid-cols-2">
        <div className="grid content-start gap-4 overflow-y-auto border-b border-border bg-surface px-5 py-6 sm:px-8 lg:border-r lg:border-b-0">
          <div className="text-[13px] text-muted">You should spend about {task === 't1' ? 20 : 40} minutes on this task.</div>
          <div className="whitespace-pre-line text-[15px] leading-8">{prompt.prompt}</div>
          {task === 't1' && test.writing.t1.chart ? <BarChart spec={test.writing.t1.chart} /> : null}
        </div>
        <div className="flex min-h-[300px] flex-col gap-2 px-5 py-6 sm:px-8">
          <textarea
            aria-label={`Task ${task === 't1' ? 1 : 2} answer`}
            value={state.writing[task]}
            onChange={(e) => exam.setWriting(task, e.target.value)}
            spellCheck={false}
            className="min-h-0 flex-1 resize-none rounded-xl border border-line-strong bg-surface p-4 text-[15px] leading-8 outline-none focus:border-focus"
            placeholder="Type your answer here…"
          />
          <div className={cn('flex items-center gap-2 text-[13px]', words >= min ? 'text-success-soft-foreground' : 'text-muted')}>
            {words >= min ? <CircleCheck className="size-4" /> : <CircleInfo className="size-4" />}
            Word count: {words} (minimum {min})
          </div>
        </div>
      </div>
    </div>
  );
}

function Navigator({ exam, test, section, onGo }: { exam: MockExam; test: MockTest; section: 'listening' | 'reading'; onGo: (id: string, part: number) => void }) {
  const state = exam.exam!;
  const parts = section === 'listening' ? test.listening : test.reading;
  const items = useMemo(() => parts.flatMap((part, partIndex) => part.groups.flatMap((g) => g.questions.map((q) => ({ q, partIndex })))), [parts]);
  const answered = items.filter(({ q }) => state.answers[q.id]?.trim()).length;
  return (
    <nav aria-label="فهرست سؤال‌ها" className="exam-text flex items-center gap-3 overflow-x-auto border-t border-border bg-surface px-3 py-2 sm:px-5">
      <span className="shrink-0 text-xs text-muted">{answered}/{items.length}</span>
      <div className="flex gap-1">
        {items.map(({ q, partIndex }) => {
          const done = Boolean(state.answers[q.id]?.trim());
          const flagged = state.flags.includes(q.id);
          return (
            <button key={q.id} type="button" onClick={() => onGo(q.id, partIndex)} aria-label={`Question ${q.n}${done ? ', answered' : ''}${flagged ? ', flagged' : ''}`}
              className={cn('relative grid size-8 shrink-0 place-items-center rounded-md border text-[12px] font-bold outline-none focus-visible:ring-2 focus-visible:ring-focus', done ? 'border-accent bg-accent-soft text-accent-soft-foreground' : 'border-border bg-surface text-ink-2', partIndex === state.part && 'ring-1 ring-accent/40')}>
              {q.n}
              {flagged ? <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-warning ring-2 ring-surface" /> : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
