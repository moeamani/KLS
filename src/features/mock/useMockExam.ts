import { toast } from '@heroui/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { questionsOf } from '@/lib/ielts';
import { faNumber } from '@/lib/format';
import { MOCK_SESSION_KEY, useApp } from '@/store/app';
import type { ExamLog, MockAttempt, MockBooking, MockTest } from '@/types';
import { wordCount } from '@/lib/ielts';

// One candidate's written test (Listening → Reading → Writing). The live state is kept on
// its own storage key, as the server would hold it, so a reload, a closed tab or a second
// window behave like in production (docs/02-ielts-mock.md «موتور آزمون»).

export type Section = 'listening' | 'reading' | 'writing';
export const SECTIONS: Section[] = ['listening', 'reading', 'writing'];
export const SECTION_LABEL: Record<Section, string> = { listening: 'Listening', reading: 'Reading', writing: 'Writing' };

export interface ExamState {
  bookingId: string;
  section: Section;
  /** Waiting on the candidate to open the next section. */
  between: boolean;
  remaining: Record<Section, number>;
  answers: Record<string, string>;
  writing: { t1: string; t2: string };
  flags: string[];
  part: number;
  played: string[];
  log: ExamLog[];
  owner: string;
  lastTick: number;
  resumesUsed: number;
  startedAt: number;
}

const TAB = Math.random().toString(36).slice(2);
const load = (bookingId: string): ExamState | null => {
  try {
    const raw = localStorage.getItem(MOCK_SESSION_KEY);
    const parsed = raw ? (JSON.parse(raw) as ExamState) : null;
    return parsed?.bookingId === bookingId ? parsed : null;
  } catch { return null; }
};
const save = (state: ExamState | null) => {
  try {
    if (state) localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(state));
    else localStorage.removeItem(MOCK_SESSION_KEY);
  } catch { /* private mode: still works in this tab */ }
};

export type Phase = 'intro' | 'resume' | 'running' | 'locked' | 'done';

/** What the finish screen shows once the live state has been handed to the server. */
export interface ExamSummary {
  endReason: MockAttempt['endReason'];
  answered: Record<'listening' | 'reading', number>;
  words: { t1: number; t2: number };
  resumesUsed: number;
  spent: number;
  log: ExamLog[];
}
export type Connection = 'online' | 'offline' | 'reconnecting';

export function useMockExam(booking: MockBooking, test: MockTest) {
  const settings = useApp((s) => s.settings.mock);
  const startAttempt = useApp((s) => s.startAttempt);
  const submitAttempt = useApp((s) => s.submitAttempt);
  const DURATION: Record<Section, number> = { listening: settings.listeningMin * 60, reading: settings.readingMin * 60, writing: settings.writingMin * 60 };
  const GRACE = settings.graceMin * 60;

  const [exam, setExam] = useState<ExamState | null>(() => load(booking.id));
  const ref = useRef(exam);
  const commit = useCallback((next: ExamState | null) => { ref.current = next; save(next); setExam(next); }, []);
  const patch = useCallback((fn: (e: ExamState) => ExamState) => { if (ref.current) commit(fn(ref.current)); }, [commit]);
  const addLog = (type: string, detail?: string) => patch((e) => ({ ...e, log: [...e.log, { type, detail, at: new Date().toISOString() }] }));

  const [running, setRunningState] = useState(false);
  const runningRef = useRef(false);
  const setRunning = (on: boolean) => { runningRef.current = on; setRunningState(on); };
  const [locked, setLocked] = useState(false);
  const [finished, setFinished] = useState(booking.status !== 'confirmed' && booking.status !== 'in_progress');
  const [connection, setConnection] = useState<Connection>('online');
  const [graceLeft, setGraceLeft] = useState(GRACE);
  const offlineSince = useRef<number | null>(null);
  const graceRef = useRef(GRACE);
  const simulated = useRef(false);
  const [simulatedOffline, setSimulatedOfflineState] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [summary, setSummary] = useState<ExamSummary | null>(null);
  const isOnline = () => navigator.onLine && !simulated.current;

  const questions = useMemo(() => ({ listening: questionsOf(test, 'listening'), reading: questionsOf(test, 'reading') }), [test]);

  // ---------- finishing ----------
  const finish = (reason: MockAttempt['endReason']) => {
    const e = ref.current;
    if (!e) return;
    setRunning(false);
    offlineSince.current = null;
    const answeredIn = (section: 'listening' | 'reading') => questions[section].filter((q) => e.answers[q.id]?.trim()).length;
    const total = DURATION.listening + DURATION.reading + DURATION.writing;
    const left = e.remaining.listening + e.remaining.reading + e.remaining.writing;
    setSummary({ endReason: reason, answered: { listening: answeredIn('listening'), reading: answeredIn('reading') }, words: { t1: wordCount(e.writing.t1), t2: wordCount(e.writing.t2) }, resumesUsed: e.resumesUsed, spent: Math.max(0, total - left), log: e.log });
    submitAttempt(booking.id, { answers: e.answers, writing: e.writing, startedAt: new Date(e.startedAt).toISOString(), log: [...e.log, { type: reason ?? 'completed', at: new Date().toISOString() }], endReason: reason });
    commit(null);
    setFinished(true);
  };

  const nextSection = (reason: 'time' | 'early') => {
    const e = ref.current;
    if (!e) return;
    const index = SECTIONS.indexOf(e.section);
    addLog(reason === 'time' ? `${e.section}_timeout` : `${e.section}_submitted`);
    if (index === SECTIONS.length - 1) return finish(reason === 'time' ? 'timeout' : 'completed');
    if (reason === 'time') toast.warning(`زمان ${SECTION_LABEL[e.section]} تمام شد`, { description: 'پاسخ‌های این بخش ثبت شد.' });
    patch((x) => ({ ...x, section: SECTIONS[index + 1], between: true, part: 0 }));
  };

  // ---------- connection ----------
  const goOffline = () => {
    if (!runningRef.current || offlineSince.current) return;
    offlineSince.current = Date.now();
    graceRef.current = GRACE;
    setGraceLeft(GRACE);
    setConnection('offline');
  };
  const goOnline = () => {
    if (!runningRef.current || !offlineSince.current) return;
    const away = Math.round((Date.now() - offlineSince.current) / 1000);
    offlineSince.current = null;
    addLog('disconnect', `${faNumber(away)} ثانیه`);
    setConnection('reconnecting');
    setTimeout(() => { setConnection('online'); toast.success('اتصال برقرار شد', { description: 'آزمون از همان جا ادامه یافت؛ پاسخ‌ها محفوظ است.' }); }, 900);
  };

  // ---------- clock ----------
  const tick = () => {
    const e = ref.current;
    if (!runningRef.current || !e || e.between) return;
    const online = isOnline();
    if (!online && !offlineSince.current) goOffline();
    if (online && offlineSince.current) goOnline();
    if (offlineSince.current) {
      graceRef.current -= 1;
      setGraceLeft(graceRef.current);
      if (graceRef.current <= 0) return finish('connection');
      if (settings.timerOnDisconnect === 'pause') return patch((x) => ({ ...x, lastTick: Date.now() }));
    }
    patch((x) => ({ ...x, remaining: { ...x.remaining, [x.section]: x.remaining[x.section] - 1 }, lastTick: Date.now() }));
    if ((ref.current?.remaining[ref.current.section] ?? 1) <= 0) nextSection('time');
  };
  const tickRef = useRef(tick);
  tickRef.current = tick;
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => tickRef.current(), 1000);
    return () => clearInterval(t);
  }, [running]);

  const handlers = useRef({ goOffline, goOnline });
  handlers.current = { goOffline, goOnline };
  useEffect(() => {
    const off = () => handlers.current.goOffline();
    const on = () => { if (!simulated.current) handlers.current.goOnline(); };
    window.addEventListener('offline', off);
    window.addEventListener('online', on);
    return () => { window.removeEventListener('offline', off); window.removeEventListener('online', on); };
  }, []);

  // ---------- one window at a time ----------
  const channel = useRef<BroadcastChannel | null>(null);
  useEffect(() => {
    const lockOut = () => {
      if (!runningRef.current || !settings.singleSession) return;
      setRunning(false);
      offlineSince.current = null;
      setLocked(true);
    };
    const ch = 'BroadcastChannel' in window ? new BroadcastChannel('kls-mock') : null;
    channel.current = ch;
    ch?.addEventListener('message', (event) => { if (event.data?.type === 'claim' && event.data.tab !== TAB && event.data.bookingId === booking.id) lockOut(); });
    return () => ch?.close();
  }, [booking.id, settings.singleSession]);
  const claim = () => { patch((e) => ({ ...e, owner: TAB })); channel.current?.postMessage({ type: 'claim', tab: TAB, bookingId: booking.id }); };

  // ---------- boot: a reload mid-exam counts as a resume ----------
  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const e = ref.current;
    if (!e) return;
    const away = (Date.now() - e.lastTick) / 1000;
    if (settings.timerOnDisconnect === 'run' && !e.between) patch((x) => ({ ...x, remaining: { ...x.remaining, [x.section]: Math.max(0, x.remaining[x.section] - away) } }));
    if (away > GRACE) finish('connection');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- actions ----------
  const start = () => {
    startAttempt(booking.id);
    commit({
      bookingId: booking.id, section: 'listening', between: false, remaining: DURATION, answers: {}, writing: { t1: '', t2: '' }, flags: [], part: 0, played: [],
      log: [{ type: 'start', at: new Date().toISOString() }], owner: TAB, lastTick: Date.now(), resumesUsed: 0, startedAt: Date.now(),
    });
    channel.current?.postMessage({ type: 'claim', tab: TAB, bookingId: booking.id });
    setRunning(true);
  };
  const resume = () => {
    // Another window may have written newer answers; continue from what was saved last.
    const saved = load(booking.id);
    if (saved) ref.current = saved;
    const e = ref.current;
    if (!e) return start();
    if (e.resumesUsed >= settings.maxResumes) return finish('connection');
    patch((x) => ({ ...x, resumesUsed: x.resumesUsed + 1, lastTick: Date.now(), log: [...x.log, { type: 'resume', detail: `${faNumber(x.resumesUsed + 1)} از ${faNumber(settings.maxResumes)}`, at: new Date().toISOString() }] }));
    claim();
    setLocked(false);
    setRunning(true);
    const left = settings.maxResumes - (e.resumesUsed + 1);
    toast[left > 0 ? 'success' : 'warning']('آزمون از همان جا ادامه یافت', { description: left > 0 ? `${faNumber(left)} فرصت بازگشت دیگر دارید.` : 'این آخرین فرصت بازگشت بود.' });
  };
  const openSection = () => patch((e) => ({ ...e, between: false, lastTick: Date.now(), log: [...e.log, { type: `${e.section}_start`, at: new Date().toISOString() }] }));
  const setAnswer = (questionId: string, value: string) => { patch((e) => ({ ...e, answers: { ...e.answers, [questionId]: value } })); setLastSaved(Date.now()); };
  const setWriting = (task: 't1' | 't2', value: string) => { patch((e) => ({ ...e, writing: { ...e.writing, [task]: value } })); setLastSaved(Date.now()); };
  const toggleFlag = (questionId: string) => patch((e) => ({ ...e, flags: e.flags.includes(questionId) ? e.flags.filter((f) => f !== questionId) : [...e.flags, questionId] }));
  const setPart = (part: number) => patch((e) => ({ ...e, part }));
  const markPlayed = (partId: string) => patch((e) => ({ ...e, played: e.played.includes(partId) ? e.played : [...e.played, partId] }));
  const leave = () => { setRunning(false); offlineSince.current = null; };

  // prototype tools
  const setSimulatedOffline = (on: boolean) => {
    simulated.current = on;
    setSimulatedOfflineState(on);
    if (on) goOffline(); else if (navigator.onLine) goOnline();
  };
  const fastForward = () => patch((e) => ({ ...e, remaining: { ...e.remaining, [e.section]: Math.min(e.remaining[e.section], 5) } }));
  const autoFill = (writing: { t1: string; t2: string }) =>
    patch((e) => {
      const answers = { ...e.answers };
      // Every fourth answer is wrong (but still a valid choice) so the result report has something to show.
      const wrong = (q: (typeof questions)['listening'][number]) => {
        if (q.type === 'gap') return 'wrong';
        if (q.type === 'mcq') return ['A', 'B', 'C', 'D'].find((l) => !q.answer.includes(l)) ?? 'A';
        if (q.type === 'match') return q.answer[0];
        return q.options?.find((o) => !q.answer.some((a) => a.toLowerCase() === o.toLowerCase())) ?? q.answer[0];
      };
      if (e.section === 'listening' || e.section === 'reading') questions[e.section].forEach((q, i) => { answers[q.id] = i % 4 === 3 ? wrong(q) : q.answer[0]; });
      return { ...e, answers, writing: e.section === 'writing' ? writing : e.writing };
    });

  const phase: Phase = finished ? 'done' : locked ? 'locked' : running ? 'running' : exam ? 'resume' : 'intro';

  return {
    phase, exam, questions, connection, graceLeft, GRACE, DURATION, settings, simulatedOffline, lastSaved, summary,
    start, resume, openSection, nextSection: () => nextSection('early'), setAnswer, setWriting, toggleFlag, setPart, markPlayed, leave, setSimulatedOffline, fastForward, autoFill,
  };
}
export type MockExam = ReturnType<typeof useMockExam>;
