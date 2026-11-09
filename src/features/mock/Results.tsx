import { ArrowLeft } from '@gravity-ui/icons';
import { Alert, Card, cn, Tabs } from '@heroui/react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { BandTile } from '@/components/ui/Band';
import { Section } from '@/components/ui/Page';
import { MODULE_LABEL } from '@/data/status';
import { formatDate } from '@/lib/dates';
import { faNumber, faPercent } from '@/lib/format';
import { bandLabel, byType, cefrOf, criteriaBand, formatBand, isCorrect, QUESTION_TYPE_LABEL, SPEAKING_CRITERIA, WRITING_CRITERIA, wordCount } from '@/lib/ielts';
import { bookingScores, testFor } from '@/store/selectors';
import type { MockBooking, MockSession, Student } from '@/types';
import { GroupView } from './ExamParts';

/** The result report: shown to the student once released, and to staff at any time. */
export function ResultReport({ booking, session, student, staffView = false }: { booking: MockBooking; session?: MockSession; student: Student; staffView?: boolean }) {
  const navigate = useNavigate();
  const test = testFor(booking, session);
  const scores = bookingScores(booking, session);
  const released = booking.status === 'released' || staffView;
  const [tab, setTab] = useState('feedback');
  const analysis = useMemo(() => (booking.attempt ? byType(test, booking.attempt.answers) : []), [test, booking.attempt]);
  const skills = [
    { label: 'Listening', band: scores.listening?.band },
    { label: 'Reading', band: scores.reading?.band },
    { label: 'Writing', band: scores.writing },
    { label: 'Speaking', band: scores.speaking },
  ];
  const weakest = released && scores.overall != null ? [...skills].sort((a, b) => (a.band ?? 9) - (b.band ?? 9))[0] : undefined;
  const suggestion = weakest ? ({ Writing: ['Writing Workshop', '/ielts/skills'], Speaking: ['Speaking Clinic', '/ielts/skills'], Listening: ['Listening & Reading Strategies', '/ielts/skills'], Reading: ['Listening & Reading Strategies', '/ielts/skills'] } as Record<string, [string, string]>)[weakest.label] : undefined;

  return (
    <div className="grid gap-5">
      <Card className="grid gap-5 p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:p-6">
        <div className="grid size-[124px] place-items-center rounded-2xl bg-accent text-white">
          <div className="text-center">
            <div className="text-xs opacity-80">Overall Band</div>
            <div className="text-[44px] leading-[52px] font-extrabold tabular">{scores.overall != null && released ? formatBand(scores.overall) : '—'}</div>
            {scores.overall != null && released ? <div className="text-xs opacity-90">CEFR {cefrOf(scores.overall)}</div> : null}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-[13px] text-muted">کارنامه آزمون آزمایشی آیلتس · {MODULE_LABEL[booking.module]}</div>
          <h2 className="mt-1 text-xl font-extrabold">{student.name}</h2>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-[13px] sm:grid-cols-4">
            <div><dt className="text-muted">کد رزرو</dt><dd className="font-semibold tabular">{booking.code}</dd></div>
            <div><dt className="text-muted">تاریخ آزمون</dt><dd className="font-semibold">{session ? formatDate(session.at) : '—'}</dd></div>
            <div><dt className="text-muted">سطح</dt><dd className="font-semibold">{scores.overall != null && released ? bandLabel(scores.overall) : 'در حال تصحیح'}</dd></div>
            <div><dt className="text-muted">آزمون</dt><dd className="ltr text-start font-semibold">{test.title}</dd></div>
          </dl>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <BandTile label="Listening" band={scores.listening?.band} sub={scores.listening ? `${faNumber(scores.listening.raw)} از ${faNumber(scores.listening.total)} درست` : undefined} />
        <BandTile label="Reading" band={scores.reading?.band} sub={scores.reading ? `${faNumber(scores.reading.raw)} از ${faNumber(scores.reading.total)} درست` : undefined} />
        <BandTile label="Writing" band={released ? scores.writing : undefined} pending={booking.writing && !released ? 'در انتظار انتشار' : undefined} />
        <BandTile label="Speaking" band={released ? scores.speaking : undefined} pending={booking.speakingNoShow ? 'غیبت' : booking.speaking && !released ? 'در انتظار انتشار' : undefined} />
      </div>

      {booking.remark ? (
        <Alert status={booking.remark.status === 'done' ? 'success' : booking.remark.status === 'rejected' ? 'danger' : 'accent'}>
          <Alert.Content>
            <Alert.Title>بازبینی {booking.remark.skill === 'writing' ? 'رایتینگ' : 'اسپیکینگ'}: {({ requested: 'در انتظار تأیید', approved: 'در حال بازبینی توسط ممتحن دوم', rejected: 'رد شد', done: 'انجام شد' } as const)[booking.remark.status]}</Alert.Title>
            {booking.remark.status === 'done' ? <Alert.Description>نمره پیش از بازبینی {formatBand(booking.remark.before)} و پس از بازبینی {formatBand(booking.remark.after)}.{booking.remark.before !== booking.remark.after ? ' هزینه بازبینی بازگردانده می‌شود.' : ''}</Alert.Description> : null}
          </Alert.Content>
        </Alert>
      ) : null}

      {suggestion ? (
        <Card className="flex-row flex-wrap items-center gap-3 border-accent-soft-hover bg-accent-soft p-4">
          <div className="min-w-0 flex-1 text-[13.5px] leading-6">
            <span className="font-bold">پیشنهاد برای نمره بالاتر: </span>
            کمترین نمره شما در <span className="ltr font-bold">{weakest!.label}</span> است. کلاس تکمیلی <span className="ltr font-semibold">{suggestion[0]}</span> برای همین مهارت طراحی شده است.
          </div>
          {!staffView ? <button type="button" onClick={() => navigate(suggestion[1])} className="flex items-center gap-1 text-[13px] font-semibold text-link">مشاهده کلاس<ArrowLeft className="size-3.5" /></button> : null}
        </Card>
      ) : null}

      <Tabs selectedKey={tab} onSelectionChange={(k) => setTab(String(k))} variant="secondary">
        <Tabs.ListContainer>
          <Tabs.List aria-label="بخش‌های کارنامه" className="mb-4">
            <Tabs.Tab id="feedback">بازخورد ممتحن<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="analysis">تحلیل نوع سؤال<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="review">پاسخ‌نامه<Tabs.Indicator /></Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel id="feedback" className="grid gap-4">
          {released && booking.writing ? (
            <Section title="Writing" description="هر معیار از ۰ تا ۹؛ Task 2 دو برابر Task 1 وزن دارد.">
              <div className="grid gap-4 md:grid-cols-2">
                {(['t1', 't2'] as const).map((t) => (
                  <div key={t} className="rounded-xl border border-border p-4">
                    <div className="mb-2 flex items-center justify-between"><span className="ltr text-sm font-bold">Task {t === 't1' ? 1 : 2}</span><span className="text-sm font-extrabold tabular">{formatBand(criteriaBand(booking.writing![t]))}</span></div>
                    <dl className="grid gap-1.5 text-[13px]">
                      {WRITING_CRITERIA.map((c) => <div key={c.id} className="flex justify-between gap-2"><dt className="text-ink-2">{c.label}</dt><dd className="font-bold tabular">{faNumber(booking.writing![t][c.id])}</dd></div>)}
                    </dl>
                    <p className="exam-text mt-3 border-t border-separator pt-3 text-[13.5px] leading-7 text-ink-2">{booking.writing!.comments[t]}</p>
                    <p className="mt-1 text-xs text-muted">{faNumber(wordCount(booking.attempt?.writing[t] ?? ''))} کلمه</p>
                  </div>
                ))}
              </div>
              {booking.writing.comments.overall ? <p className="mt-4 text-[13.5px] leading-7">{booking.writing.comments.overall}</p> : null}
            </Section>
          ) : (
            <Section title="Writing"><p className="text-[13.5px] text-muted">{booking.writing ? 'تصحیح انجام شده و پس از انتشار نتیجه نمایش داده می‌شود.' : 'رایتینگ در صف تصحیح ممتحن است.'}</p></Section>
          )}
          {released && booking.speaking ? (
            <Section title="Speaking">
              <dl className="grid gap-2 text-[13px] sm:grid-cols-4">
                {SPEAKING_CRITERIA.map((c) => <div key={c.id} className="rounded-lg bg-surface-secondary p-3"><dt className="text-ink-2">{c.label}</dt><dd className="mt-1 text-lg font-extrabold tabular">{faNumber(booking.speaking!.scores[c.id])}</dd></div>)}
              </dl>
              <p className="exam-text mt-3 text-[13.5px] leading-7 text-ink-2">{booking.speaking.comment}</p>
            </Section>
          ) : (
            <Section title="Speaking"><p className="text-[13.5px] text-muted">{booking.speakingNoShow ? 'در آزمون اسپیکینگ حاضر نشدید؛ نمره این مهارت صفر است.' : booking.speaking ? 'نمره ثبت شده و پس از انتشار نتیجه نمایش داده می‌شود.' : 'پس از آزمون اسپیکینگ، نمره و بازخورد اینجا می‌آید.'}</p></Section>
          )}
        </Tabs.Panel>
        <Tabs.Panel id="analysis">
          <Section title="دقت به تفکیک نوع سؤال" description="لیسنینگ و ریدینگ با هم.">
            {analysis.length ? (
              <ul className="grid gap-3">
                {analysis.map((row) => {
                  const ratio = row.correct / row.total;
                  return (
                    <li key={row.type} className="grid grid-cols-[minmax(0,180px)_1fr_auto] items-center gap-3 text-[13px]">
                      <span className="truncate">{QUESTION_TYPE_LABEL[row.type]}</span>
                      <span className="h-2.5 overflow-hidden rounded-full bg-default"><span className={cn('block h-full rounded-full', ratio >= 0.75 ? 'bg-success' : ratio >= 0.5 ? 'bg-accent' : 'bg-warning')} style={{ width: `${ratio * 100}%` }} /></span>
                      <span className="w-24 text-end tabular text-ink-2">{faNumber(row.correct)} از {faNumber(row.total)} · {faPercent(ratio)}</span>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="text-sm text-muted">پاسخی ثبت نشده است.</p>}
          </Section>
        </Tabs.Panel>
        <Tabs.Panel id="review" className="grid gap-4">
          {booking.attempt ? (
            (['listening', 'reading'] as const).map((section) => (
              <Section key={section} title={<span className="ltr">{section === 'listening' ? 'Listening' : 'Reading'}</span>}>
                <div className="exam-text grid gap-6">
                  {(section === 'listening' ? test.listening : test.reading).map((part) => (
                    <div key={part.id} className="grid gap-4">
                      <div className="text-[13px] font-bold text-muted">{part.title}</div>
                      {part.groups.map((group, i) => (
                        <GroupView key={i} group={group} answers={booking.attempt!.answers} onAnswer={() => undefined} readOnly review={(q) => ({ correct: isCorrect(q, booking.attempt!.answers[q.id]), answer: q.answer[0] })} />
                      ))}
                    </div>
                  ))}
                </div>
              </Section>
            ))
          ) : <p className="text-sm text-muted">پاسخی ثبت نشده است.</p>}
        </Tabs.Panel>
      </Tabs>
      <p className="text-xs leading-6 text-muted">این کارنامه نتیجه آزمون آزمایشی خانه زبان کرمانشاه است و مدرک رسمی IELTS محسوب نمی‌شود.</p>
    </div>
  );
}
