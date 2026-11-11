import { ArrowLeft, BookOpen, Briefcase, Calendar, CircleCheck, GraduationCap, Headphones, Microphone, Pencil, Persons, Ticket, Video } from '@gravity-ui/icons';
import { Button, Card } from '@heroui/react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Stagger, StaggerItem } from '@/components/motion';
import { BANNERS, CLASS_FORMATS, CONTACT, HOME_BOXES, SERVICES_MENU } from '@/data/site';
import { termState } from '@/data/status';
import { formatDate, formatDay } from '@/lib/dates';
import { faNumber } from '@/lib/format';
import { useApp } from '@/store/app';
import { mockSessionState, openTerm } from '@/store/selectors';
import { Container, MockSessionCard, SiteSection } from './parts';

const GROUP_ICON = [GraduationCap, Ticket, Briefcase, BookOpen];

const BOX_ICON = { ttc: GraduationCap, ielts: Ticket, private: Persons, general: BookOpen, calendar: Calendar, online: Video, gallery: Briefcase, why: CircleCheck };

function BannerCarousel() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % BANNERS.length), 6000);
    return () => window.clearInterval(id);
  }, [paused]);
  const banner = BANNERS[index];
  return (
    <section aria-roledescription="carousel" aria-label="بنرهای آموزشگاه" className="bg-surface pt-6" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <Container>
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-l ${banner.tone} p-8 text-white transition-colors sm:p-12`}>
          <div className="max-w-xl">
            <div className="mb-3 text-[13px] font-bold opacity-80">{banner.eyebrow}</div>
            <h2 className="text-[26px] leading-[1.5] font-extrabold text-balance sm:text-[34px]">{banner.title}</h2>
            <Button className="mt-6 bg-white text-[#2F3194]" size="lg" onPress={() => navigate(banner.to)}>{banner.cta}<ArrowLeft /></Button>
          </div>
          <div aria-hidden className="pointer-events-none absolute -start-10 -bottom-16 size-64 rounded-full bg-white/10" />
          <div className="mt-8 flex gap-2" role="group" aria-label="انتخاب بنر">
            {BANNERS.map((item, i) => (
              <button key={item.to} type="button" aria-label={`بنر ${faNumber(i + 1)}`} aria-current={i === index} onClick={() => setIndex(i)} className={`h-2 rounded-full outline-none transition-all focus-visible:ring-2 focus-visible:ring-white ${i === index ? 'w-8 bg-white' : 'w-2 bg-white/50'}`} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

const MOCK_STEPS = [
  { icon: Ticket, title: 'رزرو و پرداخت آنلاین', text: 'تاریخ، ماژول آکادمیک یا جنرال و نوع برگزاری را انتخاب می‌کنید و زمان اسپیکینگ همان لحظه تعیین می‌شود.' },
  { icon: Headphones, title: 'لیسنینگ، ریدینگ و رایتینگ', text: 'کامپیوتری و با زمان‌بندی آزمون واقعی؛ در سایت آموزشگاه یا آنلاین از خانه.' },
  { icon: Microphone, title: 'اسپیکینگ با ممتحن', text: 'گفت‌وگوی ۱۱ تا ۱۴ دقیقه‌ای در سه بخش، با ممتحن آیلتس آموزشگاه.' },
  { icon: Pencil, title: 'کارنامه با بازخورد', text: 'نمره هر مهارت و نمره کل، بازخورد رایتینگ و اسپیکینگ بر اساس چهار معیار، و تحلیل پاسخ‌ها.' },
];

export function HomePage() {
  const state = useApp();
  const navigate = useNavigate();
  useEffect(() => { document.title = 'KLS School · خانه زبان کرمانشاه'; }, []);
  const upcoming = useMemo(() => state.mockSessions.filter((m) => ['open', 'full'].includes(mockSessionState(state, m))).sort((a, b) => a.at.localeCompare(b.at)).slice(0, 3), [state]);
  const term = openTerm(state);
  const runningClasses = state.classes.filter((c) => state.terms.find((t) => t.id === c.termId && termState(t) === 'running') && !c.cancelled).length;

  return (
    <>
      <BannerCarousel />
      <section className="border-b border-border bg-surface pb-8 pt-6">
        <Container>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {HOME_BOXES.map((box) => {
              const Icon = BOX_ICON[box.icon];
              return (
                <button key={box.to + box.label} type="button" onClick={() => navigate(box.to)} className="flex items-center gap-3 rounded-2xl border border-border bg-canvas px-4 py-4 text-start outline-none transition-colors hover:border-accent focus-visible:ring-2 focus-visible:ring-focus">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent"><Icon className="size-5" /></span>
                  <span className="text-[14px] font-bold">{box.label}</span>
                </button>
              );
            })}
          </div>
        </Container>
      </section>
      <section className="border-b border-border bg-surface">
        <Container className="grid gap-10 py-10 sm:py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center">
          <div className="min-w-0">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-canvas px-3 py-1 text-[13px] font-semibold text-ink-2">
              <span className="size-1.5 rounded-full bg-success" />
              <span>خانه زبان کرمانشاه</span>
              <span aria-hidden className="text-ink-3">•</span>
              <span>{faNumber(24)} سال آموزش زبان</span>
            </div>
            <h1 className="text-[32px] leading-[1.35] font-extrabold text-balance sm:text-[44px]">آزمون آزمایشی آیلتس، با همان زمان‌بندی و سخت‌گیری روز آزمون</h1>
            <p className="mt-5 max-w-[56ch] text-[16px] leading-8 text-ink-2">
              لیسنینگ، ریدینگ و رایتینگ کامپیوتری، اسپیکینگ رودررو با ممتحن، و کارنامه‌ای که دقیقاً می‌گوید کجا نمره از دست رفته است.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" onPress={() => navigate('/ielts/mock')}>
                رزرو آزمون ماک
                <ArrowLeft />
              </Button>
              <Button size="lg" variant="secondary" onPress={() => navigate('/courses/adults')}>دوره‌های زبان</Button>
            </div>
            <button type="button" onClick={() => navigate('/try-mock')} className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-link outline-none hover:underline focus-visible:ring-2 focus-visible:ring-focus">
              همین حالا یک آزمون نمونه کامل را امتحان کنید
              <ArrowLeft className="size-3.5" />
            </button>
          </div>
          <div className="grid gap-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-bold">نزدیک‌ترین آزمون‌های ماک</h2>
              <button type="button" onClick={() => navigate('/ielts/mock')} className="text-[13px] font-semibold text-link hover:underline">همه تاریخ‌ها</button>
            </div>
            {upcoming.length ? upcoming.map((session) => <MockSessionCard key={session.id} session={session} compact />) : <Card className="p-6 text-center text-sm text-muted">تاریخ آزمون‌های بعدی به‌زودی اعلام می‌شود.</Card>}
          </div>
        </Container>
      </section>

      <SiteSection title="خدمات آموزشی" lead="از اولین کلاس کودکان تا آمادگی آیلتس و تربیت مدرس.">
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES_MENU.map((group, index) => {
            const Icon = GROUP_ICON[index];
            return (
              <StaggerItem key={group.title}>
                <Card className="h-full gap-3 p-5">
                  <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent"><Icon className="size-5" /></span>
                  <h3 className="text-base font-bold">{group.title}</h3>
                  <ul className="grid gap-1.5">
                    {group.links.map((link) => (
                      <li key={link.to}>
                        <button type="button" onClick={() => navigate(link.to)} className="flex w-full items-center justify-between gap-2 rounded-md py-1 text-start text-[13.5px] text-ink-2 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus">
                          {link.label}
                          <ArrowLeft className="size-3.5 text-ink-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </Card>
              </StaggerItem>
            );
          })}
        </Stagger>
      </SiteSection>

      {term ? (
        <section className="bg-accent text-accent-foreground">
          <Container className="flex flex-wrap items-center justify-between gap-6 py-8">
            <div className="flex items-center gap-4">
              <span className="grid size-12 place-items-center rounded-2xl bg-white/15"><Calendar className="size-6" /></span>
              <div>
                <div className="text-lg font-extrabold">ثبت‌نام {term.title} باز است</div>
                <div className="text-[14px] opacity-90">شروع کلاس‌ها {formatDate(term.start)} · مهلت ثبت‌نام تا {formatDay(term.regClose)}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onPress={() => navigate('/portal/enroll')}>ثبت‌نام آنلاین</Button>
              <Button variant="ghost" className="text-white hover:bg-white/10" onPress={() => navigate('/calendar')}>تقویم آموزشی</Button>
            </div>
          </Container>
        </section>
      ) : null}

      <SiteSection title="آزمون ماک در آموزشگاه ما" lead="چهار مرحله، از رزرو تا کارنامه.">
        <ol className="grid gap-4 md:grid-cols-4">
          {MOCK_STEPS.map((step, index) => (
            <li key={step.title} className="relative rounded-2xl border border-border bg-surface p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-foreground text-sm font-bold text-surface tabular">{faNumber(index + 1)}</span>
                <step.icon className="size-5 text-accent" />
              </div>
              <h3 className="text-[15px] font-bold">{step.title}</h3>
              <p className="mt-1.5 text-[13px] leading-6 text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </SiteSection>

      <SiteSection title="الگوهای کلاسی" lead="هر کس به شیوه‌ای بهتر یاد می‌گیرد." className="pt-0">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {CLASS_FORMATS.map((format) => (
            <div key={format.title} className="rounded-2xl border border-border bg-surface p-4">
              <div className="text-sm font-bold">{format.title}</div>
              <p className="mt-1 text-[12.5px] leading-6 text-muted">{format.text}</p>
            </div>
          ))}
        </div>
      </SiteSection>

      <SiteSection className="pt-0">
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <Card className="gap-4 p-6">
            <div className="text-sm font-bold text-muted">آموزشگاه در یک نگاه</div>
            <dl className="grid grid-cols-2 gap-5">
              <div><dt className="text-xs text-muted">سال آموزش</dt><dd className="text-[30px] font-extrabold tabular">{faNumber(24)}</dd></div>
              <div><dt className="text-xs text-muted">کلاس در حال برگزاری</dt><dd className="text-[30px] font-extrabold tabular">{faNumber(runningClasses)}</dd></div>
              <div><dt className="text-xs text-muted">گروه سنی</dt><dd className="text-[30px] font-extrabold tabular">{faNumber(3)}</dd></div>
              <div><dt className="text-xs text-muted">آزمون ماک در ماه آینده</dt><dd className="text-[30px] font-extrabold tabular">{faNumber(upcoming.length)}</dd></div>
            </dl>
          </Card>
          <Card className="gap-1 p-6">
            <div className="mb-2 text-sm font-bold text-muted">تازه‌ها</div>
            {state.news.map((item) => (
              <div key={item.id} className="border-b border-separator py-3 last:border-0">
                <div className="text-[14.5px] font-bold">{item.title}</div>
                <div className="text-[13px] leading-6 text-muted">{item.body} · {formatDay(item.at)}</div>
              </div>
            ))}
          </Card>
        </div>
      </SiteSection>

      <SiteSection title="تازه‌ترین‌ها در اینستاگرام" className="pt-0">
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <a key={n} href={`https://instagram.com/${CONTACT.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="grid aspect-square place-items-center rounded-2xl border border-dashed border-warning/60 bg-warning-soft text-sm text-warning-soft-foreground outline-none focus-visible:ring-2 focus-visible:ring-focus">
              پست یا ریلز {faNumber(n)} · لینک به اینستاگرام
            </a>
          ))}
        </div>
      </SiteSection>
    </>
  );
}
