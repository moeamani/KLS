import { ArrowRight, CircleExclamation } from '@gravity-ui/icons';
import { Alert, Button, Form, InputOTP, Link } from '@heroui/react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router';
import { EASE } from '@/components/motion';
import { Logo } from '@/components/Logo';
import { HOME } from '@/components/shell/nav';
import { TextInput } from '@/components/ui/Fields';
import { CURRENT } from '@/data/seed';
import { PANEL_LABEL } from '@/data/status';
import { clock, faDigits, formatMobile, onlyDigits } from '@/lib/format';
import { mobileError } from '@/lib/validation';
import { useApp } from '@/store/app';
import type { Panel } from '@/types';

const PANELS: Panel[] = ['student', 'parent', 'teacher', 'admin'];
const DEMO_OTP = '123456';
const RESEND = 120;
const THIS_YEAR = 1405;

const COPY: Record<Panel, { title: string; body: string }> = {
  student: { title: 'ورود زبان‌آموزان', body: 'با شماره موبایل وارد شوید. اگر اولین بار است، همین‌جا حساب می‌سازید.' },
  parent: { title: 'ورود والدین', body: 'با شماره موبایلی که هنگام ثبت‌نام فرزندتان داده‌اید وارد شوید.' },
  teacher: { title: 'ورود استادان', body: 'شماره موبایل ثبت‌شده در آموزشگاه را وارد کنید.' },
  admin: { title: 'ورود کارکنان', body: 'شماره موبایل ثبت‌شده در فهرست کاربران آموزشگاه را وارد کنید.' },
};

const slide = { initial: { opacity: 0, x: -12 }, animate: { opacity: 1, x: 0, transition: { duration: 0.28, ease: EASE } }, exit: { opacity: 0, x: 12, transition: { duration: 0.16 } } };

export function LoginPage() {
  const { panel } = useParams();
  return PANELS.includes(panel as Panel) ? <LoginForm key={panel} panel={panel as Panel} /> : <Navigate to="/" replace />;
}

function LoginForm({ panel }: { panel: Panel }) {
  const navigate = useNavigate();
  const location = useLocation();
  const state = useApp();
  const login = useApp((s) => s.login);
  const register = useApp((s) => s.registerStudent);

  const [step, setStep] = useState<'mobile' | 'register' | 'otp'>('mobile');
  const [mobile, setMobile] = useState('');
  const [mobileErr, setMobileErr] = useState('');
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);
  const [userId, setUserId] = useState('');
  const [reg, setReg] = useState({ name: '', birthYear: '', parentName: '', parentMobile: '' });
  const [regTouched, setRegTouched] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendIn, setResendIn] = useState(RESEND);

  useEffect(() => { document.title = `${COPY[panel].title} · KLS School`; }, [panel]);
  useEffect(() => {
    if (step !== 'otp' || resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [step, resendIn]);

  const lookup = (phone: string) => {
    if (panel === 'student') return state.students.find((s) => s.mobile === phone)?.id;
    if (panel === 'parent') return state.parents.find((p) => p.mobile === phone)?.id;
    if (panel === 'teacher') return state.teachers.find((t) => t.mobile === phone && t.status === 'active')?.id;
    return state.staff.find((u) => u.mobile === phone && u.status !== 'disabled')?.id;
  };

  const fillDemo = () => {
    const id = CURRENT[panel];
    const person = panel === 'student' ? state.students.find((s) => s.id === id) : panel === 'parent' ? state.parents.find((p) => p.id === id) : panel === 'teacher' ? state.teachers.find((t) => t.id === id) : state.staff.find((u) => u.id === id);
    if (person) { setMobile(faDigits(person.mobile)); setMobileErr(''); setFormError(''); }
  };

  const toOtp = (id: string) => { setUserId(id); setStep('otp'); setOtp(''); setOtpError(''); setResendIn(RESEND); };

  const submitMobile = (event: FormEvent) => {
    event.preventDefault();
    const err = mobileError(mobile);
    setMobileErr(err);
    setFormError('');
    if (err) return;
    setPending(true);
    setTimeout(() => {
      setPending(false);
      const id = lookup(onlyDigits(mobile));
      if (id) return toOtp(id);
      if (panel === 'student') return setStep('register');
      if (panel === 'parent') return setFormError('حساب والدینی با این شماره پیدا نشد. هنگام ثبت‌نام فرزند زیر ۱۸ سال، حساب والدین خودکار ساخته می‌شود؛ یا با پذیرش تماس بگیرید.');
      setFormError(panel === 'teacher' ? 'این شماره در فهرست استادان فعال نیست. با مدیر آموزشگاه تماس بگیرید.' : 'این شماره در فهرست کاربران فعال آموزشگاه نیست.');
    }, 550);
  };

  const age = THIS_YEAR - Number(onlyDigits(reg.birthYear) || 0);
  const minor = reg.birthYear.length === 4 && age < 18;
  const regErrors = {
    name: reg.name.trim().split(/\s+/).length < 2 ? 'نام و نام خانوادگی را کامل وارد کنید.' : '',
    birthYear: !/^1[34]\d\d$/.test(onlyDigits(reg.birthYear)) || age < 4 || age > 90 ? 'سال تولد را به شمسی وارد کنید (مثلاً ۱۳۸۰).' : '',
    parentMobile: minor ? mobileError(reg.parentMobile) : '',
    parentName: minor && reg.parentName.trim().length < 3 ? 'نام ولی را وارد کنید.' : '',
  };
  const submitRegister = () => {
    setRegTouched(true);
    if (Object.values(regErrors).some(Boolean)) return;
    toOtp('new');
  };

  const verify = (code = otp) => {
    if (code.length < 6) return setOtpError('کد ۶ رقمی را کامل وارد کنید.');
    setPending(true);
    setTimeout(() => {
      setPending(false);
      if (onlyDigits(code) !== DEMO_OTP) { setOtpError('کد واردشده درست نیست. دوباره تلاش کنید.'); setOtp(''); return; }
      let id = userId;
      if (id === 'new') id = register({ name: reg.name.trim(), mobile: onlyDigits(mobile), birthYear: Number(onlyDigits(reg.birthYear)), parentName: minor ? reg.parentName.trim() : undefined, parentMobile: minor ? onlyDigits(reg.parentMobile) : undefined });
      login(panel, id);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from?.startsWith(HOME[panel]) ? from : HOME[panel], { replace: true });
    }, 450);
  };

  return (
    <div className="grid min-h-dvh bg-surface lg:grid-cols-[minmax(420px,520px)_1fr]">
      <section className="flex flex-col px-6 py-8 sm:px-12">
        <button type="button" onClick={() => navigate('/')} className="self-start rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-focus" aria-label="صفحه اصلی"><Logo caption={PANEL_LABEL[panel]} /></button>
        <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center py-10">
          <AnimatePresence mode="wait" initial={false}>
            {step === 'mobile' ? (
              <motion.div key="mobile" {...slide}>
                <h1 className="text-2xl font-bold">{COPY[panel].title}</h1>
                <p className="mt-2 text-sm leading-7 text-ink-2">{COPY[panel].body}</p>
                <Form className="mt-8 grid gap-5" onSubmit={submitMobile} validationBehavior="aria">
                  <TextInput label="شماره موبایل" value={mobile} onChange={(v) => { setMobile(v); if (mobileErr) setMobileErr(mobileError(v)); }} inputMode="tel" maxLength={11} placeholder="مثلاً ۰۹۱۸۱۲۳۴۵۶۷" error={mobileErr} description="کد ورود به همین شماره پیامک می‌شود." autoComplete="tel" />
                  {formError ? (
                    <Alert status="danger"><Alert.Indicator><CircleExclamation /></Alert.Indicator><Alert.Content><Alert.Description>{formError}</Alert.Description></Alert.Content></Alert>
                  ) : null}
                  <Button type="submit" size="lg" fullWidth isPending={pending}>دریافت کد ورود</Button>
                </Form>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[13px]">
                  <button type="button" onClick={fillDemo} className="rounded font-semibold text-link underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-focus">پر کردن با حساب نمونه</button>
                  <Link href="/" className="text-[13px] text-muted"><ArrowRight className="size-3.5" />بازگشت به سایت</Link>
                </div>
                <div className="mt-10 flex flex-wrap gap-x-4 gap-y-2 border-t border-separator pt-5 text-[13px] text-muted">
                  {PANELS.filter((p) => p !== panel).map((p) => <Link key={p} href={`/login/${p}`} className="text-[13px]">{COPY[p].title}</Link>)}
                </div>
              </motion.div>
            ) : step === 'register' ? (
              <motion.div key="register" {...slide}>
                <h1 className="text-2xl font-bold">ساخت حساب زبان‌آموز</h1>
                <p className="mt-2 text-sm leading-7 text-ink-2">حسابی با شماره <bdi className="font-semibold text-foreground tabular">{formatMobile(onlyDigits(mobile))}</bdi> پیدا نشد. چند مشخصه کوتاه وارد کنید.</p>
                <div className="mt-6 grid gap-4">
                  <TextInput label="نام و نام خانوادگی زبان‌آموز" value={reg.name} onChange={(v) => setReg({ ...reg, name: v })} error={regTouched ? regErrors.name : ''} />
                  <TextInput label="سال تولد (شمسی)" value={reg.birthYear} onChange={(v) => setReg({ ...reg, birthYear: v })} inputMode="numeric" maxLength={4} placeholder="مثلاً ۱۳۸۰" error={regTouched ? regErrors.birthYear : ''} />
                  {minor ? (
                    <div className="grid gap-4 rounded-xl border border-border bg-surface-secondary p-4">
                      <p className="text-[13px] leading-6 text-ink-2">زبان‌آموز زیر ۱۸ سال است؛ برای ولی او حساب والدین ساخته می‌شود تا حضور، نمره و پرداخت‌ها را ببیند.</p>
                      <TextInput label="نام ولی" value={reg.parentName} onChange={(v) => setReg({ ...reg, parentName: v })} error={regTouched ? regErrors.parentName : ''} />
                      <TextInput label="موبایل ولی" value={reg.parentMobile} onChange={(v) => setReg({ ...reg, parentMobile: v })} inputMode="tel" maxLength={11} error={regTouched ? regErrors.parentMobile : ''} />
                    </div>
                  ) : null}
                  <Button size="lg" fullWidth onPress={submitRegister}>ادامه و دریافت کد</Button>
                  <Button variant="ghost" onPress={() => setStep('mobile')}>تغییر شماره</Button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="otp" {...slide}>
                <h1 className="text-2xl font-bold">کد ورود را وارد کنید</h1>
                <p className="mt-2 text-sm leading-7 text-ink-2">
                  کد ۶ رقمی به <bdi className="font-semibold text-foreground tabular">{formatMobile(onlyDigits(mobile))}</bdi> پیامک شد.{' '}
                  <button type="button" className="font-semibold text-link hover:underline" onClick={() => setStep('mobile')}>تغییر شماره</button>
                </p>
                <div className="mt-8 grid gap-4">
                  <div className="ltr flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={(v) => { setOtp(v); setOtpError(''); if (v.length === 6) verify(v); }} isInvalid={Boolean(otpError)} aria-label="کد ورود">
                      <InputOTP.Group>{[0, 1, 2].map((i) => <InputOTP.Slot key={i} index={i} />)}</InputOTP.Group>
                      <InputOTP.Separator />
                      <InputOTP.Group>{[3, 4, 5].map((i) => <InputOTP.Slot key={i} index={i} />)}</InputOTP.Group>
                    </InputOTP>
                  </div>
                  {otpError ? <p className="text-center text-[13px] text-danger" role="alert">{otpError}</p> : <p className="text-center text-[13px] text-muted">در نمونه اولیه، کد <bdi className="font-bold tabular">{faDigits(DEMO_OTP)}</bdi> است.</p>}
                  <Button size="lg" fullWidth isPending={pending} onPress={() => verify()}>ورود</Button>
                  <div className="text-center text-[13px] text-muted">
                    {resendIn > 0 ? <>ارسال دوباره تا <span className="tabular">{clock(resendIn)}</span></> : <button type="button" className="font-semibold text-link hover:underline" onClick={() => setResendIn(RESEND)}>ارسال دوباره کد</button>}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
      <aside className="relative hidden overflow-hidden bg-accent lg:block">
        <div className="absolute inset-0 grid place-items-center p-16 text-white">
          <div className="max-w-md">
            <div className="text-[13px] font-semibold opacity-80">KLS School · خانه زبان کرمانشاه</div>
            <p className="mt-4 text-[28px] leading-[1.6] font-extrabold">کلاس، آزمون ماک، کارنامه و پرداخت؛ همه در یک پنل.</p>
            <p className="mt-4 text-[15px] leading-8 opacity-85">زبان‌آموزان، والدین، استادان و کارکنان آموزشگاه هر کدام پنل خودشان را دارند و روی همان داده کار می‌کنند.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}

export function SwitchPage() {
  const { who } = useParams();
  const login = useApp((s) => s.login);
  const map: Record<string, [Panel, string]> = { student: ['student', 'st1'], parent: ['parent', 'pa1'], teacher: ['teacher', 'te1'], manager: ['admin', 'sf1'], reception: ['admin', 'sf2'], finance: ['admin', 'sf3'] };
  const target = map[who ?? ''];
  const [done, setDone] = useState(false);
  useEffect(() => { if (target) { login(target[0], target[1]); setDone(true); } }, [target, login]);
  if (!target) return <Navigate to="/" replace />;
  return done ? <Navigate to={HOME[target[0]]} replace /> : null;
}
