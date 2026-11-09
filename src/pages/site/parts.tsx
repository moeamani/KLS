import { CircleCheck, Clock, MapPin, Persons } from '@gravity-ui/icons';
import { Alert, Button, Card, cn } from '@heroui/react';
import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { TextAreaField, TextInput } from '@/components/ui/Fields';
import { MetaChip } from '@/components/ui/StatusChip';
import { courseOf, FORMAT_LABEL } from '@/data/catalog';
import { CLASS_META, DELIVERY_LABEL, LEAD_KIND, MODULE_LABEL } from '@/data/status';
import { formatDate, formatTime, relativeDay } from '@/lib/dates';
import { faNumber, onlyDigits, toman } from '@/lib/format';
import { daysLabel, timeRange } from '@/lib/schedule';
import { mobileError } from '@/lib/validation';
import { useApp } from '@/store/app';
import { classInfo, MOCK_SESSION_META, mockSessionState, openTerm, sessionSeats } from '@/store/selectors';
import type { CourseCategory, LeadKind, MockSession } from '@/types';

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-[1240px] px-4 sm:px-6', className)}>{children}</div>;
}

export function PageHero({ eyebrow, title, lead, children, aside }: { eyebrow?: string; title: string; lead?: string; children?: ReactNode; aside?: ReactNode }) {
  return (
    <section className="ground">
      <Container className={cn('grid gap-8 py-12 sm:py-16', aside && 'lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center')}>
        <div className="min-w-0">
          {eyebrow ? <div className="serif mb-1 text-[24px] leading-8 text-ink-2">{eyebrow}</div> : null}
          <h1 className="display text-[44px] leading-[1.15] text-balance sm:text-[64px]">{title}</h1>
          {lead ? <p className="mt-5 max-w-[60ch] text-[16px] leading-8 text-ink-2">{lead}</p> : null}
          {children ? <div className="mt-6">{children}</div> : null}
        </div>
        {aside ? <div className="min-w-0">{aside}</div> : null}
      </Container>
    </section>
  );
}

export function SiteSection({ title, lead, children, className, id }: { title?: string; lead?: string; children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn('py-12', className)}>
      <Container>
        {title ? (
          <div className="mb-7 max-w-2xl">
            {lead ? <p className="serif text-[21px] leading-8 text-ink-2">{lead}</p> : null}
            <h2 className="display text-[34px] leading-[1.2] text-balance sm:text-[42px]">{title}</h2>
          </div>
        ) : null}
        {children}
      </Container>
    </section>
  );
}

export function FactList({ facts }: { facts: [string, string][] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
      {facts.map(([label, value]) => (
        <div key={label} className="min-w-0 rounded-2xl bg-cream/70 px-4 py-3">
          <dt className="kicker" data-dot>{label}</dt>
          <dd className="mt-1 text-[15px] font-bold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Classes of one course that are open for registration in the open term. */
export function ClassesForCategory({ category }: { category: CourseCategory }) {
  const state = useApp();
  const navigate = useNavigate();
  const term = openTerm(state);
  const course = courseOf(category);
  const rows = useMemo(() => state.classes.filter((c) => c.termId === term?.id && c.courseId === course.id && !c.cancelled).map((c) => classInfo(state, c)), [state, term, course]);
  if (category === 'corporate') return null;
  if (!term) return <Alert status="accent"><Alert.Content><Alert.Description>ثبت‌نام ترم بعد هنوز باز نشده است. تاریخ‌ها در تقویم آموزشی اعلام می‌شود.</Alert.Description></Alert.Content></Alert>;
  if (!rows.length) return <p className="text-sm text-muted">کلاس گروهی این دوره برای {term.title} هنوز اعلام نشده است. برای کلاس خصوصی درخواست ثبت کنید.</p>;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {rows.map((row) => (
        <Card key={row.cls.id} className="gap-3 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-[15px] font-bold">{row.level}</div>
              <div className="text-xs text-muted">کلاس {row.cls.code} · {FORMAT_LABEL[row.cls.format]}</div>
            </div>
            <MetaChip meta={CLASS_META[row.state]} />
          </div>
          <div className="grid gap-1.5 text-[13px] text-ink-2">
            <div className="flex items-center gap-2"><Clock className="size-4 text-ink-3" />{daysLabel(row.cls.days)} · {timeRange(row.cls.start, row.cls.minutes)}</div>
            <div className="flex items-center gap-2"><Persons className="size-4 text-ink-3" />استاد {row.teacher?.name} · {row.free ? `${faNumber(row.free)} صندلی خالی` : 'تکمیل'}</div>
            <div className="flex items-center gap-2"><MapPin className="size-4 text-ink-3" />{row.room?.name ?? 'کلاس آنلاین'}</div>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-separator pt-3">
            <span className="text-sm font-bold tabular">{toman(row.cls.price)}</span>
            <Button size="sm" variant={row.state === 'full' ? 'secondary' : 'primary'} onPress={() => navigate(category === 'kids' ? '/parent/enroll' : `/portal/enroll?class=${row.cls.id}`)}>
              {row.state === 'full' ? 'لیست انتظار' : 'ثبت‌نام'}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function MockSessionCard({ session, compact }: { session: MockSession; compact?: boolean }) {
  const state = useApp();
  const navigate = useNavigate();
  const status = mockSessionState(state, session);
  const seats = sessionSeats(state, session);
  const bookable = status === 'open';
  return (
    <Card className={cn('gap-3', compact ? 'p-4' : 'p-5')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="display text-[28px] leading-9">{formatDate(session.at)}</div>
          <div className="text-xs text-muted">{relativeDay(session.at)} · ساعت {formatTime(session.at)}</div>
        </div>
        <MetaChip meta={MOCK_SESSION_META[status]} />
      </div>
      <div className="flex flex-wrap gap-1.5 text-xs">
        {session.modules.map((m) => <span key={m} className="rounded-md bg-default px-2 py-0.5 font-semibold text-ink-2">{MODULE_LABEL[m]}</span>)}
        {session.deliveries.map((d) => <span key={d} className="rounded-md bg-accent-soft px-2 py-0.5 font-semibold text-accent-soft-foreground">{DELIVERY_LABEL[d]}</span>)}
      </div>
      {session.cancelled ? <p className="text-[13px] text-danger">{session.note}</p> : null}
      <div className="flex items-center justify-between gap-2 border-t border-separator pt-3">
        <div className="text-[13px]">
          <span className="font-bold tabular">{toman(session.price)}</span>
          {bookable ? <span className={cn('ms-2', seats.free <= 3 ? 'font-semibold text-warning-soft-foreground' : 'text-muted')}>{seats.free <= 3 ? `فقط ${faNumber(seats.free)} صندلی` : `${faNumber(seats.free)} صندلی خالی`}</span> : null}
        </div>
        <Button size="sm" isDisabled={!bookable} onPress={() => navigate(`/portal/mock/book?session=${session.id}`)}>رزرو</Button>
      </div>
    </Card>
  );
}

const EXTRA_FIELDS: Partial<Record<LeadKind, { key: string; label: string; placeholder: string }[]>> = {
  corporate: [{ key: 'نفرات', label: 'تعداد شرکت‌کنندگان', placeholder: 'مثلاً ۱۵' }, { key: 'محل', label: 'محل برگزاری', placeholder: 'در شرکت، آموزشگاه یا آنلاین' }],
  ttc: [{ key: 'سطح', label: 'سطح زبان یا مدرک', placeholder: 'مثلاً B2 یا آیلتس ۶٫۵' }, { key: 'سابقه', label: 'سابقه تدریس', placeholder: 'اگر دارید' }],
  private: [{ key: 'هدف', label: 'هدف از کلاس', placeholder: 'مثلاً آیلتس جنرال، مکالمه سفر' }, { key: 'روزها', label: 'روزها و ساعت‌های مناسب', placeholder: 'مثلاً یکشنبه و سه‌شنبه عصر' }],
};

export function LeadForm({ kind, title }: { kind: LeadKind; title?: string }) {
  const addLead = useApp((s) => s.addLead);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);
  const errors = { name: name.trim().length < 3 ? 'نام را وارد کنید.' : '', mobile: mobileError(mobile), company: kind === 'corporate' && !company.trim() ? 'نام سازمان را وارد کنید.' : '' };
  const submit = () => {
    setTouched(true);
    if (Object.values(errors).some(Boolean)) return;
    addLead({ kind, name: name.trim(), mobile: onlyDigits(mobile), company: company.trim() || undefined, message: message.trim() || '—', data: Object.keys(extra).length ? extra : undefined });
    setSent(true);
  };
  if (sent)
    return (
      <Card className="items-center gap-2 p-8 text-center">
        <CircleCheck className="size-8 text-success" />
        <div className="text-base font-bold">درخواست شما ثبت شد</div>
        <p className="max-w-sm text-[13px] leading-6 text-muted">همکاران پذیرش در ساعات کاری با شماره <bdi className="tabular">{mobile}</bdi> تماس می‌گیرند.</p>
      </Card>
    );
  return (
    <Card className="gap-4 p-5 sm:p-6">
      <div>
        <h3 className="text-base font-bold">{title ?? `فرم ${LEAD_KIND[kind]}`}</h3>
        <p className="text-[13px] text-muted">پس از ثبت، همکاران ما با شما تماس می‌گیرند.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="نام و نام خانوادگی" value={name} onChange={setName} error={touched ? errors.name : ''} />
        <TextInput label="شماره موبایل" value={mobile} onChange={setMobile} inputMode="tel" maxLength={11} placeholder="۰۹۱۸…" error={touched ? errors.mobile : ''} />
        {kind === 'corporate' ? <TextInput label="نام سازمان" value={company} onChange={setCompany} error={touched ? errors.company : ''} /> : null}
        {(EXTRA_FIELDS[kind] ?? []).map((field) => (
          <TextInput key={field.key} label={field.label} placeholder={field.placeholder} value={extra[field.key] ?? ''} onChange={(value) => setExtra((current) => ({ ...current, [field.key]: value }))} />
        ))}
      </div>
      <TextAreaField label="توضیحات" value={message} onChange={setMessage} rows={3} placeholder="هر نکته‌ای که لازم است بدانیم" />
      <div><Button onPress={submit}>ثبت درخواست</Button></div>
    </Card>
  );
}
