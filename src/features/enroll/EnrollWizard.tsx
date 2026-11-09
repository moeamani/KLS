import { ArrowLeft, CircleCheck, Clock, MapPin, Persons } from '@gravity-ui/icons';
import { Alert, Button, Card, Chip, cn, toast } from '@heroui/react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Empty } from '@/components/ui/Empty';
import { Section } from '@/components/ui/Page';
import { MetaChip } from '@/components/ui/StatusChip';
import { COURSES, FORMAT_LABEL } from '@/data/catalog';
import { CLASS_META } from '@/data/status';
import { formatDate, formatDay } from '@/lib/dates';
import { faNumber, toman } from '@/lib/format';
import { daysLabel, timeRange } from '@/lib/schedule';
import { useApp } from '@/store/app';
import { classInfo, openTerm } from '@/store/selectors';
import type { Course, Enrollment, Student } from '@/types';
import { PaymentDialog } from './Payment';

const ENROLLABLE = COURSES.filter((c) => c.category !== 'corporate');

/**
 * Online enrollment: course → class in the open term → seat hold → payment. Used by students
 * for themselves and by parents for a child. A full class offers the waitlist instead.
 */
export function EnrollWizard({ student, by }: { student: Student; by: Enrollment['by'] }) {
  const state = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const holdEnrollment = useApp((s) => s.holdEnrollment);
  const joinWaitlist = useApp((s) => s.joinWaitlist);
  const term = openTerm(state);
  const preset = state.classes.find((c) => c.id === params.get('class'));
  const age = 1405 - student.birthYear;
  const [courseId, setCourseId] = useState<string | null>(preset?.courseId ?? null);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const course = ENROLLABLE.find((c) => c.id === courseId);
  const enrollment = state.enrollments.find((e) => e.id === enrollmentId);

  const rows = useMemo(() => (course && term ? state.classes.filter((c) => c.termId === term.id && c.courseId === course.id && !c.cancelled).map((c) => classInfo(state, c)) : []), [state, course, term]);
  const suggested = student.levelId;

  if (!term)
    return <Card><Empty icon={Clock} title="ثبت‌نام ترم بعد هنوز باز نشده است" description="تاریخ شروع ثبت‌نام در تقویم آموزشی اعلام می‌شود و پیامک اطلاع‌رسانی دریافت می‌کنید." action={<Button size="sm" variant="secondary" onPress={() => navigate('/calendar')}>تقویم آموزشی</Button>} /></Card>;

  if (enrollment && enrollment.status === 'confirmed') {
    const cls = state.classes.find((c) => c.id === enrollment.classId)!;
    return (
      <Card className="items-center gap-3 p-8 text-center">
        <CircleCheck className="size-10 text-success" />
        <h2 className="text-xl font-extrabold">ثبت‌نام {student.name} قطعی شد</h2>
        <p className="max-w-md text-sm leading-7 text-muted">کلاس {cls.code} · {daysLabel(cls.days)} {timeRange(cls.start, cls.minutes)} · شروع {formatDate(term.start)}. برنامه کلاس در پنل آمده و پیامک تأیید ارسال شد.</p>
        <Button onPress={() => navigate(by === 'parent' ? '/parent' : '/portal/classes')}>مشاهده کلاس‌ها</Button>
      </Card>
    );
  }

  const choose = (classId: string, waitlist: boolean) => {
    setError('');
    const result = waitlist ? joinWaitlist(student.id, classId, by) : holdEnrollment(student.id, classId, by);
    if (!result.ok) {
      if (result.code === 'full') return setError(`${result.error} می‌توانید در لیست انتظار ثبت شوید.`);
      return setError(result.error);
    }
    if (waitlist) { toast.success('در لیست انتظار ثبت شدید', { description: 'اگر صندلی آزاد شود، ۲۴ ساعت فرصت پرداخت خواهید داشت.' }); navigate(by === 'parent' ? '/parent' : '/portal/classes'); return; }
    setEnrollmentId(result.id);
  };

  return (
    <div className="grid gap-4">
      <Alert status="accent">
        <Alert.Content>
          <Alert.Title>ثبت‌نام {term.title}</Alert.Title>
          <Alert.Description>شروع کلاس‌ها {formatDate(term.start)} · مهلت ثبت‌نام تا {formatDay(term.regClose)}. صندلی پس از انتخاب {faNumber(state.settings.seatHoldMin)} دقیقه برای پرداخت نگه داشته می‌شود.</Alert.Description>
        </Alert.Content>
      </Alert>
      <Section title="۱. دوره">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ENROLLABLE.map((c) => {
            const unsuitable = (c.category === 'kids' && age > 11) || (c.category === 'teens' && (age < 12 || age > 17)) || (c.category === 'adults' && age < 16);
            return (
              <button key={c.id} type="button" onClick={() => { if (c.category === 'private') return navigate('/courses/private#form'); setCourseId(c.id); setEnrollmentId(null); setError(''); }}
                className={cn('rounded-xl border p-3 text-start outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus', courseId === c.id ? 'border-accent bg-accent-soft' : 'border-border hover:bg-default', unsuitable && 'opacity-60')}>
                <div className="text-sm font-bold">{c.title}</div>
                <div className="text-xs text-muted">{c.ageHint}{c.category === 'private' ? ' · با درخواست' : ` · ${toman(c.price)}`}</div>
                {unsuitable ? <div className="mt-1 text-[11px] text-warning-soft-foreground">برای سن {faNumber(age)} سال مناسب نیست</div> : null}
              </button>
            );
          })}
        </div>
      </Section>
      {course ? <ClassStep course={course} rows={rows} suggested={suggested} onChoose={choose} error={error} needsPlacement={course.needsPlacement && !student.levelId} by={by} /> : null}
      <PaymentDialog invoiceId={enrollment?.invoiceId} isOpen={Boolean(enrollment && enrollment.status === 'held')} onOpenChange={(open) => { if (!open && enrollment?.status === 'held') toast('صندلی تا پایان مهلت برای شما نگه داشته می‌شود؛ از بخش پرداخت‌ها ادامه دهید.'); }} heldUntil={enrollment?.heldUntil} />
    </div>
  );
}

function ClassStep({ course, rows, suggested, onChoose, error, needsPlacement, by }: { course: Course; rows: ReturnType<typeof classInfo>[]; suggested?: string; onChoose: (id: string, waitlist: boolean) => void; error: string; needsPlacement: boolean; by: Enrollment['by'] }) {
  const navigate = useNavigate();
  return (
    <Section title="۲. کلاس" description={`${course.title} · ${faNumber(course.sessions)} جلسه ${faNumber(course.minutes)} دقیقه‌ای`}>
      <div className="grid gap-3">
        {needsPlacement && by === 'student' ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-secondary p-3 text-[13px]">
            <span>سطح خود را نمی‌دانید؟ آزمون تعیین سطح ۱۵ سؤالی حدود ۱۰ دقیقه طول می‌کشد.</span>
            <Button size="sm" variant="secondary" onPress={() => navigate('/portal/placement')}>تعیین سطح آنلاین</Button>
          </div>
        ) : null}
        {error ? <Alert status="danger"><Alert.Content><Alert.Description>{error}</Alert.Description></Alert.Content></Alert> : null}
        {rows.length ? rows.map((row) => {
          const full = row.state === 'full';
          return (
            <div key={row.cls.id} className={cn('grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_auto] sm:items-center', row.cls.levelId === suggested ? 'border-accent' : 'border-border')}>
              <div className="grid gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">{row.level}</span>
                  <span className="text-xs text-muted">· {row.cls.code} · {FORMAT_LABEL[row.cls.format]}</span>
                  <MetaChip meta={CLASS_META[row.state]} />
                  {row.cls.levelId === suggested ? <Chip size="sm" color="accent" variant="soft">سطح پیشنهادی شما</Chip> : null}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-2">
                  <span className="flex items-center gap-1.5"><Clock className="size-3.5 text-ink-3" />{daysLabel(row.cls.days)} · {timeRange(row.cls.start, row.cls.minutes)}</span>
                  <span className="flex items-center gap-1.5"><Persons className="size-3.5 text-ink-3" />{row.teacher?.name} · {full ? `${faNumber(row.waitlist)} نفر در انتظار` : `${faNumber(row.free)} صندلی خالی`}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="size-3.5 text-ink-3" />{row.room?.name ?? 'آنلاین'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:justify-end">
                <span className="text-sm font-bold tabular">{toman(row.cls.price)}</span>
                <Button size="sm" variant={full ? 'secondary' : 'primary'} isDisabled={row.state !== 'open' && !full} onPress={() => onChoose(row.cls.id, full)}>{full ? 'لیست انتظار' : 'انتخاب و پرداخت'}{full ? null : <ArrowLeft />}</Button>
              </div>
            </div>
          );
        }) : <p className="text-sm text-muted">برای این دوره در ترم پیش رو کلاس گروهی اعلام نشده است.</p>}
      </div>
    </Section>
  );
}
