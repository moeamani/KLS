import { ArrowLeft, Calendar } from '@gravity-ui/icons';
import { Button, Card, cn } from '@heroui/react';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Stagger, StaggerItem } from '@/components/motion';
import { PracticeCard } from '@/components/PracticeCard';
import { Wave } from '@/components/Wave';
import { CLASS_FORMATS, SERVICES_MENU } from '@/data/site';
import { termState } from '@/data/status';
import { formatDate, formatDay } from '@/lib/dates';
import { faNumber } from '@/lib/format';
import { useApp } from '@/store/app';
import { mockSessionState } from '@/store/selectors';
import { Container, MockSessionCard, SiteSection } from './parts';

const SECTIONS = [
  { name: 'Listening', time: "30'" },
  { name: 'Reading', time: "60'" },
  { name: 'Writing', time: "60'" },
  { name: 'Speaking', time: "14'" },
];

// Each service group gets its own block of the palette.
const GROUP_STYLE = [
  'bg-cream text-ink',
  'bg-ink text-cream',
  'bg-peri-mid text-ink',
  'bg-beige text-ink',
];

const MOCK_STEPS = [
  { title: 'رزرو و پرداخت', text: 'تاریخ، ماژول و نوع برگزاری را انتخاب می‌کنید و زمان اسپیکینگ همان لحظه تعیین می‌شود.' },
  { title: 'سه بخش کتبی', text: 'لیسنینگ، ریدینگ و رایتینگ، کامپیوتری و با زمان‌بندی آزمون واقعی.' },
  { title: 'اسپیکینگ با ممتحن', text: 'گفت‌وگوی ۱۱ تا ۱۴ دقیقه‌ای در سه بخش، رودررو یا آنلاین.' },
  { title: 'کارنامه با بازخورد', text: 'نمره هر مهارت با چهار معیار رسمی، تحلیل پاسخ‌ها و پیشنهاد برای نمره بالاتر.' },
];

export function HomePage() {
  const state = useApp();
  const navigate = useNavigate();
  useEffect(() => { document.title = 'KLS School · خانه زبان کرمانشاه'; }, []);
  const upcoming = useMemo(() => state.mockSessions.filter((m) => ['open', 'full'].includes(mockSessionState(state, m))).sort((a, b) => a.at.localeCompare(b.at)).slice(0, 3), [state]);
  const term = state.terms.find((t) => termState(t) === 'registration');
  const runningClasses = state.classes.filter((c) => state.terms.find((t) => t.id === c.termId && termState(t) === 'running') && !c.cancelled).length;

  return (
    <>
      <section className="ground overflow-hidden">
        <Container className="grid gap-12 pt-10 pb-16 sm:pt-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center">
          <div className="min-w-0">
            <p className="serif text-[26px] leading-9 text-ink-2 sm:text-[30px]">فراتر از تمرین معمولی</p>
            <h1 className="display mt-1 text-[56px] leading-[1.08] text-balance sm:text-[88px]">آزمون ماک آیلتس، دقیقاً مثل روز آزمون</h1>
            <p className="mt-6 max-w-[52ch] text-[16.5px] leading-8 text-ink-2">
              لیسنینگ، ریدینگ و رایتینگ با همان زمان‌بندی؛ اسپیکینگ رودررو با ممتحن؛ و کارنامه‌ای که دقیقاً می‌گوید نمره کجا از دست رفته است.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onPress={() => navigate('/ielts/mock')}>رزرو آزمون ماک<ArrowLeft /></Button>
              <Button size="lg" variant="secondary" onPress={() => navigate('/courses/adults')}>دوره‌های زبان</Button>
            </div>
            <dl className="ltr mt-10 flex flex-wrap gap-2">
              {SECTIONS.map((s) => (
                <div key={s.name} className="flex items-baseline gap-2 rounded-full bg-cream/70 px-4 py-2">
                  <dt className="mono text-[12px] text-ink-2">{s.name}</dt>
                  <dd className="display text-[20px] leading-6">{s.time}</dd>
                </div>
              ))}
            </dl>
          </div>
          <PracticeCard className="lg:-rotate-2" />
        </Container>
      </section>

      <section className="bg-cream">
        <Container className="py-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="serif text-[21px] leading-8 text-ink-2">صندلی‌ها محدود است</p>
              <h2 className="display text-[34px] leading-[1.2] sm:text-[42px]">نزدیک‌ترین آزمون‌های ماک</h2>
            </div>
            <Button variant="secondary" onPress={() => navigate('/ielts/mock')}>همه تاریخ‌ها<ArrowLeft /></Button>
          </div>
          {upcoming.length ? <div className="grid gap-4 md:grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">{upcoming.map((session) => <MockSessionCard key={session.id} session={session} />)}</div> : <Card className="p-6 text-center text-sm text-muted">تاریخ آزمون‌های بعدی به‌زودی اعلام می‌شود.</Card>}
        </Container>
      </section>

      <SiteSection title="خدمات آموزشی" lead="از اولین کلاس کودکان تا تربیت مدرس">
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES_MENU.map((group, index) => (
            <StaggerItem key={group.title}>
              <div className={cn('flex h-full flex-col gap-5 rounded-[28px] p-6', GROUP_STYLE[index])}>
                <div className={cn('kicker', index === 1 && 'text-cream/70')} data-dot={index === 1 ? 'sky' : undefined}>{faNumber(index + 1).padStart(2, '۰')}</div>
                <h3 className="display text-[30px] leading-[1.2]">{group.title}</h3>
                <ul className="mt-auto grid gap-1">
                  {group.links.map((link) => (
                    <li key={link.to}>
                      <button type="button" onClick={() => navigate(link.to)} className={cn('flex w-full items-center justify-between gap-2 rounded-full py-1.5 text-start text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-focus', index === 1 ? 'text-cream/85 hover:text-cream' : 'text-ink-2 hover:text-ink')}>
                        {link.label}
                        <ArrowLeft className="size-3.5 opacity-60" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </SiteSection>

      {term ? (
        <section className="bg-ink text-cream">
          <Container className="flex flex-wrap items-center justify-between gap-6 py-10">
            <div className="flex items-center gap-5">
              <span className="grid size-14 place-items-center rounded-full bg-cream/10"><Calendar className="size-6" /></span>
              <div>
                <p className="serif text-[20px] leading-7 text-cream/75">شروع کلاس‌ها {formatDate(term.start)}</p>
                <div className="display text-[34px] leading-[1.2] sm:text-[44px]">ثبت‌نام {term.title} باز است</div>
                <div className="mono text-[12px] text-cream/60">مهلت ثبت‌نام تا {formatDay(term.regClose)}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="bg-cream text-ink" onPress={() => navigate('/portal/enroll')}>ثبت‌نام آنلاین</Button>
              <Button variant="ghost" className="text-cream hover:bg-cream/10" onPress={() => navigate('/calendar')}>تقویم آموزشی</Button>
            </div>
          </Container>
        </section>
      ) : null}

      <SiteSection title="از رزرو تا کارنامه" lead="آزمون ماک در خانه زبان">
        <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr] lg:items-stretch">
          <div className="flex flex-col justify-between gap-6 rounded-[28px] bg-cream p-7">
            <Wave height={140} live />
            <p className="serif text-[22px] leading-9 text-ink-2">ممتحن‌های آیلتس آموزشگاه، رایتینگ و اسپیکینگ شما را با همان چهار معیار رسمی نمره می‌دهند و برای هر معیار توضیح می‌نویسند.</p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2">
            {MOCK_STEPS.map((step, index) => (
              <li key={step.title} className="rounded-[28px] bg-cream p-6">
                <div className="display text-[56px] leading-none text-peri">{faNumber(index + 1)}</div>
                <h3 className="mt-3 text-[16px] font-bold">{step.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-7 text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </SiteSection>

      <SiteSection title="الگوهای کلاسی" lead="هر کس به شیوه خودش یاد می‌گیرد" className="pt-0">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {CLASS_FORMATS.map((format) => (
            <div key={format.title} className="rounded-[24px] bg-cream/70 p-5">
              <div className="kicker" data-dot="peri">{format.facts[0]}</div>
              <div className="mt-2 text-[15px] font-bold">{format.title}</div>
              <p className="mt-1 text-[12.5px] leading-6 text-muted">{format.text}</p>
            </div>
          ))}
        </div>
      </SiteSection>

      <SiteSection className="pt-0">
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="grid grid-cols-2 gap-3">
            {[[24, 'سال آموزش زبان'], [runningClasses, 'کلاس در حال برگزاری'], [3, 'گروه سنی'], [upcoming.length, 'آزمون ماک پیش رو']].map(([value, label], i) => (
              <div key={label as string} className={cn('rounded-[24px] p-5', i === 0 ? 'bg-ink text-cream' : 'bg-cream')}>
                <div className="display text-[52px] leading-[60px] tabular">{faNumber(value as number)}</div>
                <div className={cn('kicker', i === 0 && 'text-cream/70')}>{label as string}</div>
              </div>
            ))}
          </div>
          <div className="rounded-[28px] bg-cream p-6">
            <div className="kicker mb-2" data-dot>تازه‌ها</div>
            {state.news.map((item) => (
              <div key={item.id} className="border-b border-border py-3.5 last:border-0">
                <div className="text-[15px] font-bold">{item.title}</div>
                <div className="text-[13px] leading-6 text-muted">{item.body} · {formatDay(item.at)}</div>
              </div>
            ))}
          </div>
        </div>
      </SiteSection>
    </>
  );
}
