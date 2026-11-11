import { ArrowLeft, Book, CircleCheck, FileText, Handset, LogoTelegram, MapPin, PaperPlane, Clock, Video, VolumeFill } from '@gravity-ui/icons';
import { Accordion, Button, Card, Chip } from '@heroui/react';
import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Placeholder } from '@/components/ui/Empty';
import { MetaChip } from '@/components/ui/StatusChip';
import { COURSES } from '@/data/catalog';
import { ABOUT, CALENDAR_KINDS, CLASS_FORMATS, CONTACT, servicePage, TEAM, WHY_US } from '@/data/site';
import { TERM_META, termState } from '@/data/status';
import { formatDate, formatDay } from '@/lib/dates';
import { faNumber, toman } from '@/lib/format';
import { useApp } from '@/store/app';
import { mockSessionState } from '@/store/selectors';
import { NotFoundPage } from '../NotFound';
import { ClassesForCategory, FactList, LeadForm, MockSessionCard, PageHero, SiteSection } from './parts';

export function ServicePageView() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const page = servicePage(pathname);
  useEffect(() => { if (page) document.title = `${page.title} · KLS School`; }, [page]);
  if (!page) return <NotFoundPage />;
  const goCta = () => (page.cta.to === '#form' ? document.getElementById('form')?.scrollIntoView({ behavior: 'smooth' }) : navigate(page.cta.to));
  return (
    <>
      <PageHero eyebrow={page.group} title={page.title} lead={page.lead}>
        <div className="grid gap-6">
          {page.facts ? <FactList facts={page.facts} /> : null}
          <div><Button size="lg" onPress={goCta}>{page.cta.label}<ArrowLeft /></Button></div>
        </div>
      </PageHero>
      {page.body ? (
        <SiteSection className="pb-0">
          <div className="grid max-w-3xl gap-4 text-[15px] leading-8 text-ink-2">{page.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
        </SiteSection>
      ) : null}
      <SiteSection title={page.highlightsTitle}>
        <div className="grid gap-4 md:grid-cols-3">
          {page.highlights.map((item) => (
            <Card key={item.title} className="gap-2 p-5">
              <h3 className="text-[15px] font-bold">{item.title}</h3>
              <p className="text-[13.5px] leading-7 text-muted">{item.text}</p>
            </Card>
          ))}
        </div>
      </SiteSection>
      {page.category && page.category !== 'corporate' ? (
        <SiteSection title="کلاس‌های ترم آینده" lead="ظرفیت‌ها زنده است؛ با پرداخت آنلاین، ثبت‌نام همان لحظه قطعی می‌شود." className="pt-0">
          <ClassesForCategory category={page.category} />
        </SiteSection>
      ) : null}
      {page.faq ? (
        <SiteSection title="پرسش‌های رایج" className="pt-0">
          <Accordion className="max-w-3xl rounded-2xl border border-border bg-surface">
            {page.faq.map((item) => (
              <Accordion.Item key={item.q} id={item.q}>
                <Accordion.Heading><Accordion.Trigger className="text-sm font-semibold">{item.q}<Accordion.Indicator /></Accordion.Trigger></Accordion.Heading>
                <Accordion.Panel><Accordion.Body className="text-[13.5px] leading-7 text-ink-2">{item.a}</Accordion.Body></Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </SiteSection>
      ) : null}
      {page.form ? (
        <SiteSection id="form" className="pt-0">
          <div className="max-w-3xl"><LeadForm kind={page.form} /></div>
        </SiteSection>
      ) : null}
    </>
  );
}

export function CalendarPage() {
  const state = useApp();
  useEffect(() => { document.title = 'تقویم آموزشی · KLS School'; }, []);
  const terms = [...state.terms].sort((a, b) => b.start.localeCompare(a.start));
  const mocks = state.mockSessions.filter((m) => ['open', 'full', 'closed'].includes(mockSessionState(state, m))).sort((a, b) => a.at.localeCompare(b.at));
  return (
    <>
      <PageHero eyebrow="سایر خدمات آموزشی" title="تقویم آموزشی" lead="تاریخ ثبت‌نام و برگزاری ترم‌ها، تعطیلی‌ها و آزمون‌های ماک پیش رو." />
      <SiteSection title="تقویم‌های آموزشی" lead="هر الگوی کلاسی تقویم خودش را دارد.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CALENDAR_KINDS.map((kind) => (
            <div key={kind.title} className="rounded-2xl border border-border bg-surface p-4">
              <div className="text-xs text-muted">تقویم</div>
              <div className="mt-1 text-[14.5px] font-bold leading-7">{kind.title}</div>
              <div className="text-[13px] text-ink-2">{kind.audience}</div>
            </div>
          ))}
        </div>
      </SiteSection>
      <SiteSection title="ترم‌ها" className="pt-0">
        <div className="grid gap-3 md:grid-cols-3">
          {terms.map((term) => (
            <Card key={term.id} className="gap-3 p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-bold">{term.title}</h3>
                <MetaChip meta={TERM_META[termState(term)]} />
              </div>
              <dl className="grid gap-2 text-[13px]">
                <div className="flex justify-between gap-2"><dt className="text-muted">ثبت‌نام</dt><dd className="font-semibold">{formatDay(term.regOpen)} تا {formatDay(term.regClose)}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-muted">شروع کلاس‌ها</dt><dd className="font-semibold">{formatDate(term.start)}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-muted">پایان ترم</dt><dd className="font-semibold">{formatDate(term.end)}</dd></div>
              </dl>
            </Card>
          ))}
        </div>
      </SiteSection>
      <SiteSection title="تعطیلی‌ها" lead="کلاس‌هایی که روز تعطیل دارند خودکار یک جلسه به انتهای ترم منتقل می‌شوند." className="pt-0">
        <ul className="grid max-w-xl gap-2">
          {state.holidays.map((h) => (
            <li key={h.date} className="flex justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm"><span>{h.title}</span><span className="font-semibold">{formatDate(h.date)}</span></li>
          ))}
        </ul>
      </SiteSection>
      <SiteSection title="آزمون‌های ماک پیش رو" className="pt-0">
        <div className="grid gap-3 md:grid-cols-3">{mocks.map((m) => <MockSessionCard key={m.id} session={m} compact />)}</div>
      </SiteSection>
    </>
  );
}

export function SystemPage() {
  const state = useApp();
  const g = state.settings.grades;
  useEffect(() => { document.title = 'سیستم آموزشی · KLS School'; }, []);
  return (
    <>
      <PageHero eyebrow="سایر خدمات آموزشی" title="سیستم آموزشی" lead="سطح‌ها، معادل چارچوب اروپایی (CEFR)، نحوه ارزشیابی و مسیر پیشرفت از یک سطح به سطح بعد." />
      <SiteSection>
        <div className="grid max-w-3xl gap-4 text-[15px] leading-8 text-ink-2">
          <p>کلاس‌های خانه زبان کرمانشاه با محوریت مکالمه و رویکردی متدمحور طراحی شده‌اند تا زبان‌آموزان تجربه‌ای متفاوت از یادگیری داشته باشند.</p>
          <p>دوره‌ها در سه رده سنی کودک، نوجوان و بزرگسال، از سطح پایه تا پیشرفته ارائه می‌شوند و تمرکز اصلی بر تقویت مهارت گفتگو در موقعیت‌های واقعی است. چهار مهارت اصلی زبان (Reading، Listening، Speaking و Writing) به‌طور کامل پوشش داده می‌شود.</p>
          <p>با برگزاری هفت ترم آموزشی در طول سال و ارائه تقویم آموزشی سال آینده در پایان هر سال، مسیر یادگیری زبان‌آموزان منظم، پیوسته و هدفمند خواهد بود.</p>
        </div>
        <div className="mt-6"><PhotoGrid count={6} /></div>
      </SiteSection>
      <SiteSection title="سطح‌ها و معادل CEFR" className="pt-0">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {COURSES.filter((c) => ['kids', 'teens', 'adults', 'ielts'].includes(c.category)).map((course) => (
            <Card key={course.id} className="gap-3 p-5">
              <div><h3 className="text-[15px] font-bold">{course.title}</h3><div className="text-xs text-muted">{course.ageHint}</div></div>
              <ol className="grid gap-1.5 text-[13px]">
                {course.levels.map((level) => (
                  <li key={level.id} className="flex items-center justify-between gap-2"><span>{level.title}</span>{level.cefr ? <Chip size="sm" variant="soft">{level.cefr}</Chip> : null}</li>
                ))}
              </ol>
            </Card>
          ))}
        </div>
      </SiteSection>
      <SiteSection title="ارزشیابی هر ترم" lead={`نمره کل از ۱۰۰ است و حد قبول ${faNumber(g.pass)}. کارنامه پس از تأیید آموزش در پنل زبان‌آموز و والدین منتشر می‌شود.`} className="pt-0">
        <div className="grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[['فعالیت کلاسی', g.activity], ['تکلیف', g.homework], ['میان‌ترم', g.midterm], ['پایان‌ترم', g.final]].map(([label, value]) => (
            <div key={label as string} className="rounded-2xl border border-border bg-surface p-4"><div className="text-xs text-muted">{label}</div><div className="mt-1 text-2xl font-extrabold tabular">{faNumber(value as number)}</div></div>
          ))}
        </div>
      </SiteSection>
      <SiteSection title="مسیر پیشرفت" className="pt-0">
        <ol className="grid max-w-3xl gap-3 text-[14px] leading-7 text-ink-2">
          <li><b className="text-foreground">۱. تعیین سطح:</b> آنلاین برای نوجوانان و بزرگسالان، حضوری برای کودکان.</li>
          <li><b className="text-foreground">۲. ثبت‌نام در کلاس سطح:</b> با رزرو صندلی و پرداخت آنلاین یا حضوری.</li>
          <li><b className="text-foreground">۳. ارزشیابی مستمر:</b> حضور و غیاب، تکلیف، میان‌ترم و پایان‌ترم.</li>
          <li><b className="text-foreground">۴. ارتقا:</b> با نمره {faNumber(g.pass)} به بالا، ثبت‌نام سطح بعد در ترم آینده؛ زیر حد قبول، تکرار سطح.</li>
        </ol>
      </SiteSection>
    </>
  );
}

export function FormatsPage() {
  useEffect(() => { document.title = 'الگوهای کلاسی · KLS School'; }, []);
  return (
    <>
      <PageHero eyebrow="سایر خدمات آموزشی" title="الگوهای کلاسی" lead="گروهی یا خصوصی، حضوری یا آنلاین؛ برنامه آموزشی در همه یکسان است." />
      <SiteSection>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CLASS_FORMATS.map((format) => (
            <Card key={format.title} className="gap-3 p-5">
              <h3 className="text-[15px] font-bold">{format.title}</h3>
              <p className="text-[13.5px] leading-7 text-muted">{format.text}</p>
              <div className="flex flex-wrap gap-1.5">{format.facts.map((fact) => <Chip key={fact} size="sm" variant="soft">{fact}</Chip>)}</div>
            </Card>
          ))}
        </div>
      </SiteSection>
    </>
  );
}

const KIND_ICON = { book: Book, file: FileText, audio: VolumeFill, video: Video };
const KIND_LABEL = { book: 'کتاب', file: 'فایل', audio: 'صوتی', video: 'ویدیو' };

export function ResourcesPage() {
  const resources = useApp((s) => s.resources);
  const navigate = useNavigate();
  useEffect(() => { document.title = 'منابع آموزشی · KLS School'; }, []);
  return (
    <>
      <PageHero eyebrow="سایر خدمات آموزشی" title="منابع آموزشی" lead="کتاب‌های هر سطح را آنلاین بخرید و در آموزشگاه تحویل بگیرید. فایل صوتی و تصویری کتاب‌های هر سه رده سنی در پنل زبان‌آموزان در دسترس است." />
      <SiteSection>
        <div className="grid gap-3 md:grid-cols-2">
          {resources.map((r) => {
            const Icon = KIND_ICON[r.kind];
            return (
              <Card key={r.id} className="flex-row items-start gap-4 p-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-default text-ink-2"><Icon className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-bold">{r.title}</div>
                  <div className="text-xs text-muted">{KIND_LABEL[r.kind]} · {r.audience}</div>
                  <p className="mt-1 text-[13px] leading-6 text-ink-2">{r.description}</p>
                </div>
                {r.kind === 'book' ? (
                  <div className="grid shrink-0 justify-items-end gap-1.5">
                    <span className="text-sm font-bold tabular">{toman(r.price ?? 0)}</span>
                    {r.stock ? <Button size="sm" onPress={() => navigate('/portal/resources')}>خرید</Button> : <Chip size="sm" variant="soft" color="warning">ناموجود</Chip>}
                  </div>
                ) : (
                  <Button size="sm" variant="secondary" onPress={() => navigate('/portal/resources')}>در پنل</Button>
                )}
              </Card>
            );
          })}
        </div>
      </SiteSection>
    </>
  );
}

export function ContactPage() {
  useEffect(() => { document.title = 'تماس با ما · KLS School'; }, []);
  const rows = [
    { icon: Handset, label: 'تلفن', value: <bdi className="tabular">{CONTACT.phone}</bdi> },
    { icon: Handset, label: 'موبایل و واتس‌اپ', value: <bdi className="tabular">{CONTACT.mobile}</bdi> },
    { icon: PaperPlane, label: 'اینستاگرام', value: <bdi className="ltr">{CONTACT.instagram}</bdi> },
    { icon: LogoTelegram, label: 'تلگرام', value: <bdi className="ltr">{CONTACT.telegram}</bdi> },
    { icon: MapPin, label: 'نشانی', value: CONTACT.address },
    { icon: Clock, label: 'ساعات پاسخ‌گویی', value: CONTACT.hours },
  ];
  return (
    <>
      <PageHero title="تماس با ما" lead="برای مشاوره انتخاب دوره، تعیین سطح حضوری یا هر پرسشی، تماس بگیرید یا پیام بگذارید." />
      <SiteSection>
        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <Card className="gap-1 p-5">
            {CONTACT.placeholder ? <p className="mb-2 text-xs text-muted"><Placeholder>اطلاعات تماس نمونه است؛ آموزشگاه اطلاعات نهایی را وارد می‌کند.</Placeholder></p> : null}
            {rows.map((row) => (
              <div key={row.label} className="flex items-start gap-3 border-b border-separator py-3 last:border-0">
                <row.icon className="mt-0.5 size-4 text-ink-3" />
                <div><div className="text-xs text-muted">{row.label}</div><div className="text-sm font-semibold">{row.value}</div></div>
              </div>
            ))}
          </Card>
          <LeadForm kind="contact" title="پیام به آموزشگاه" />
        </div>
      </SiteSection>
    </>
  );
}

export function PhotoGrid({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="grid aspect-[4/3] w-full place-items-center rounded-xl border border-dashed border-warning/60 bg-warning-soft text-xs text-warning-soft-foreground">تصویر محیط آموزشگاه</div>
      ))}
    </div>
  );
}

function WhyList() {
  return (
    <ul className="grid gap-x-8 gap-y-3 md:grid-cols-2">
      {WHY_US.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-[14px] leading-7 text-ink-2"><CircleCheck className="mt-1.5 size-4 shrink-0 text-accent" />{item}</li>
      ))}
    </ul>
  );
}

export function AboutPage() {
  useEffect(() => { document.title = 'درباره ما · KLS School'; }, []);
  const years = useMemo(() => faNumber(ABOUT.years), []);
  return (
    <>
      <PageHero eyebrow={`از ${ABOUT.founded}`} title="درباره خانه زبان کرمانشاه" lead={`${years} سال آموزش زبان انگلیسی به کودکان، نوجوانان و بزرگسالان کرمانشاه.`} />
      <SiteSection title="تاریخچه">
        <div className="grid max-w-3xl gap-4 text-[15px] leading-8 text-ink-2">{ABOUT.story.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      </SiteSection>
      <SiteSection title="موسسین" className="pt-0">
        <p className="max-w-3xl text-[15px] leading-8 text-ink-2">{ABOUT.founders}</p>
      </SiteSection>
      <SiteSection title="خط‌مشی" className="pt-0">
        <p className="mb-5 max-w-3xl text-[15px] leading-8 text-ink-2">{ABOUT.policyLead}</p>
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {ABOUT.policies.map((item) => <li key={item} className="flex gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-[14px] leading-7 text-ink-2"><span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" />{item}</li>)}
        </ul>
      </SiteSection>
      <SiteSection title="چرا خانه زبان کرمانشاه؟" className="pt-0">
        <WhyList />
      </SiteSection>
    </>
  );
}

export function WhyPage() {
  useEffect(() => { document.title = 'چرا خانه زبان کرمانشاه؟ · KLS School'; }, []);
  return (
    <>
      <PageHero title="چرا خانه زبان کرمانشاه؟" lead="بزرگ‌ترین و مجهزترین موسسه استان کرمانشاه، با مجوز رسمی و مدرک قابل استعلام." />
      <SiteSection><WhyList /></SiteSection>
    </>
  );
}

export function TeamPage() {
  useEffect(() => { document.title = 'تیم خانه زبان · KLS School'; }, []);
  return (
    <>
      <PageHero title="تیم خانه زبان" lead="مدیریت، کادر اداری و آموزشی، توسعه و پژوهش، و ارتباط عمومی." />
      <SiteSection>
        <div className="grid gap-8">
          {TEAM.map((group) => (
            <div key={group.id} id={group.id}>
              <h2 className="mb-3 text-lg font-extrabold">{group.title}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {group.roles.map((role) => (
                  <Card key={role.title} className="gap-3 p-4">
                    <div className="grid aspect-square w-full place-items-center rounded-xl border border-dashed border-warning/60 bg-warning-soft text-xs text-warning-soft-foreground">عکس</div>
                    <div>
                      <div className="text-[14.5px] font-bold">{role.title}</div>
                      <div className="text-[13px] text-muted"><Placeholder>[نام و معرفی کوتاه]</Placeholder></div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SiteSection>
    </>
  );
}

export function GalleryPage() {
  useEffect(() => { document.title = 'گالری · KLS School'; }, []);
  return (
    <>
      <PageHero title="گالری" lead="تصویرهایی از محیط آموزشگاه، کلاس‌ها و رویدادها." />
      <SiteSection>
        <p className="mb-4 text-xs text-muted"><Placeholder>تصویرها را آموزشگاه تحویل می‌دهد.</Placeholder></p>
        <PhotoGrid count={9} />
      </SiteSection>
    </>
  );
}
