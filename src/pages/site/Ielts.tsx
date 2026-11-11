import { ArrowLeft, CircleCheck, Headphones, Microphone, Pencil, BookOpen, PlayFill, Thunderbolt } from '@gravity-ui/icons';
import { Accordion, Button, Card } from '@heroui/react';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { WRITING_CRITERIA } from '@/lib/ielts';
import { faNumber, toman } from '@/lib/format';
import { useApp } from '@/store/app';
import { mockSessionState } from '@/store/selectors';
import { MockSessionCard, PageHero, SiteSection } from './parts';

const PARTS = [
  { icon: Headphones, title: 'Listening', time: '۳۰ دقیقه', text: '۴ بخش، ۴۰ سؤال. فایل صوتی فقط یک بار پخش می‌شود.' },
  { icon: BookOpen, title: 'Reading', time: '۶۰ دقیقه', text: '۳ متن، ۴۰ سؤال. آکادمیک یا جنرال بسته به ماژول.' },
  { icon: Pencil, title: 'Writing', time: '۶۰ دقیقه', text: 'Task 1 (حداقل ۱۵۰ کلمه) و Task 2 (حداقل ۲۵۰ کلمه).' },
  { icon: Microphone, title: 'Speaking', time: '۱۱ تا ۱۴ دقیقه', text: 'سه بخش، رودررو یا آنلاین با ممتحن آموزشگاه.' },
];

const REPORT = [
  'نمره هر چهار مهارت و نمره کل، با همان قاعده گرد کردن آزمون رسمی',
  'نمره رایتینگ و اسپیکینگ به تفکیک چهار معیار، همراه یادداشت ممتحن',
  'پاسخ‌نامه لیسنینگ و ریدینگ: پاسخ شما، پاسخ درست و نوع هر سؤال',
  'تحلیل دقت به تفکیک نوع سؤال و پیشنهاد کلاس تکمیلی مناسب',
];

export function MockPage() {
  const navigate = useNavigate();
  const state = useApp();
  const m = state.settings.mock;
  useEffect(() => { document.title = 'آزمون آزمایشی آیلتس (ماک) · KLS School'; }, []);
  const sessions = useMemo(() => state.mockSessions.filter((s) => !s.onDemand && mockSessionState(state, s) !== 'done').sort((a, b) => a.at.localeCompare(b.at)), [state]);
  const faq = [
    { q: 'آزمون ماک چه تفاوتی با آزمون رسمی دارد؟', a: 'ساختار، زمان‌بندی و معیارهای نمره‌دهی همان آزمون رسمی است، اما آزمون را آموزشگاه برگزار می‌کند و مدرک رسمی IELTS صادر نمی‌شود.' },
    { q: 'نتیجه کی آماده می‌شود؟', a: m.instantLR ? 'نمره لیسنینگ و ریدینگ بلافاصله پس از ثبت آزمون نمایش داده می‌شود. کارنامه کامل با رایتینگ و اسپیکینگ معمولاً تا ۵ روز کاری منتشر می‌شود.' : 'کارنامه کامل معمولاً تا ۵ روز کاری منتشر می‌شود.' },
    { q: 'اگر نتوانم شرکت کنم؟', a: `تا ${faNumber(m.cancelHours)} ساعت پیش از آزمون می‌توانید لغو کنید و ${faNumber(m.refundPercent)}٪ مبلغ بازگردانده می‌شود. پس از آن بازپرداختی انجام نمی‌شود.` },
    { q: 'اگر به نمره رایتینگ یا اسپیکینگ اعتراض داشته باشم؟', a: `می‌توانید درخواست بازبینی بدهید (هزینه ${toman(m.remarkFee)}). برگه شما را ممتحن دیگری تصحیح می‌کند و اگر نمره تغییر کند، هزینه بازگردانده می‌شود.` },
    { q: 'اگر هیچ‌کدام از تاریخ‌ها برایم مناسب نبود؟', a: `آزمون ماک فوری را از پنل زبان‌آموز بخرید (${toman(m.onDemandPrice)}). بخش کتبی همان لحظه آنلاین باز می‌شود و تا ۸ ساعت فرصت شروع دارید؛ اسپیکینگ را از روز بعد با یکی از ممتحن‌ها رزرو می‌کنید.` },
    { q: 'آزمون آنلاین از خانه چطور برگزار می‌شود؟', a: 'آزمون از ساعت اعلام‌شده تا ۸ ساعت باز است. در طول آزمون فقط یک پنجره مرورگر مجاز است؛ اگر اتصال قطع شود، تا چند دقیقه می‌توانید از همان سؤال ادامه دهید.' },
  ];
  return (
    <>
      <PageHero
        eyebrow="آموزش آیلتس"
        title="آزمون آزمایشی آیلتس (ماک)"
        lead="آزمون کامل چهار مهارت با زمان‌بندی واقعی؛ آکادمیک یا جنرال، کامپیوتری در سایت آموزشگاه یا آنلاین از خانه. کارنامه با بازخورد ممتحن، دقیقاً نشان می‌دهد برای نمره بالاتر روی چه چیزی کار کنید."
        aside={
          <Card className="gap-3 p-5">
            <div className="text-sm font-bold">کارنامه شما شامل</div>
            <ul className="grid gap-2.5">
              {REPORT.map((item) => <li key={item} className="flex gap-2 text-[13.5px] leading-6 text-ink-2"><CircleCheck className="mt-1 size-4 shrink-0 text-success" />{item}</li>)}
            </ul>
          </Card>
        }
      >
        <div className="flex flex-wrap gap-3">
          <Button size="lg" onPress={() => document.getElementById('dates')?.scrollIntoView({ behavior: 'smooth' })}>انتخاب تاریخ آزمون<ArrowLeft /></Button>
          <Button size="lg" variant="secondary" onPress={() => navigate('/try-mock')}><PlayFill />امتحان یک آزمون نمونه</Button>
        </div>
      </PageHero>

      <SiteSection id="dates" title="تاریخ‌های پیش رو" lead="ظرفیت هر آزمون محدود است. با پرداخت آنلاین، رزرو قطعی و زمان اسپیکینگ شما تعیین می‌شود.">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{sessions.map((s) => <MockSessionCard key={s.id} session={s} />)}</div>
        <Card className="mt-4 flex-row flex-wrap items-center gap-4 p-5 ring-1 ring-[var(--kl-blue-200)]">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-white"><Thunderbolt className="size-5" /></span>
          <div className="min-w-[220px] flex-1">
            <div className="text-[15px] font-bold">تاریخ مناسب پیدا نکردید؟ آزمون ماک فوری</div>
            <p className="text-[13px] leading-6 text-muted">بخش کتبی را همین حالا آنلاین بدهید و اسپیکینگ را از فردا. هزینه {toman(m.onDemandPrice)}.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onPress={() => navigate('/try-mock')}>آزمون نمونه رایگان</Button>
            <Button onPress={() => navigate('/portal/mock')}>خرید آزمون فوری<ArrowLeft /></Button>
          </div>
        </Card>
      </SiteSection>

      <SiteSection title="بخش‌های آزمون" className="pt-0">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PARTS.map((part) => (
            <Card key={part.title} className="gap-2 p-5">
              <div className="flex items-center justify-between"><part.icon className="size-5 text-accent" /><span className="text-xs font-semibold text-muted">{part.time}</span></div>
              <h3 className="ltr text-start text-[15px] font-bold">{part.title}</h3>
              <p className="text-[13px] leading-6 text-muted">{part.text}</p>
            </Card>
          ))}
        </div>
      </SiteSection>

      <SiteSection title="قوانین روز آزمون" className="pt-0">
        <div className="grid max-w-4xl gap-x-8 gap-y-2 text-[14px] leading-7 text-ink-2 md:grid-cols-2">
          <p>• برای آزمون حضوری ۳۰ دقیقه زودتر با کارت شناسایی عکس‌دار حاضر شوید.</p>
          <p>• تلفن همراه و وسایل شخصی پیش از ورود تحویل گرفته می‌شود.</p>
          <p>• بین بخش‌ها نمی‌توانید به بخش قبل برگردید.</p>
          <p>• با پایان زمان هر بخش، پاسخ‌ها خودکار ثبت می‌شود.</p>
          <p>• غیبت در اسپیکینگ یعنی نمره صفر برای این مهارت و نمره کل محاسبه‌شده با آن.</p>
          <p>• لغو تا {faNumber(m.cancelHours)} ساعت پیش از آزمون با {faNumber(m.refundPercent)}٪ بازپرداخت.</p>
        </div>
      </SiteSection>

      <SiteSection title="پرسش‌های رایج" className="pt-0">
        <Accordion className="max-w-3xl rounded-2xl border border-border bg-surface">
          {faq.map((item) => (
            <Accordion.Item key={item.q} id={item.q}>
              <Accordion.Heading><Accordion.Trigger className="text-sm font-semibold">{item.q}<Accordion.Indicator /></Accordion.Trigger></Accordion.Heading>
              <Accordion.Panel><Accordion.Body className="text-[13.5px] leading-7 text-ink-2">{item.a}</Accordion.Body></Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
        <p className="mt-6 max-w-3xl text-xs leading-6 text-muted">IELTS نشان تجاری صاحبان رسمی آن است. آزمون‌های ماک خانه زبان کرمانشاه برای آمادگی برگزار می‌شوند و نتیجه آن‌ها رسمی نیست.</p>
      </SiteSection>
    </>
  );
}

export function CorrectionPage() {
  const state = useApp();
  const navigate = useNavigate();
  const m = state.settings.mock;
  useEffect(() => { document.title = 'تصحیح و بازخورد · KLS School'; }, []);
  return (
    <>
      <PageHero eyebrow="آموزش آیلتس" title="خدمات تصحیح و بازخورد" lead="رایتینگ خود را بفرستید؛ ممتحن آیلتس آموزشگاه آن را بر اساس چهار معیار رسمی نمره می‌دهد و می‌نویسد برای نمره بالاتر چه چیزی را تغییر دهید.">
        <Button size="lg" onPress={() => navigate('/portal/corrections/new')}>ارسال متن برای تصحیح<ArrowLeft /></Button>
      </PageHero>
      <SiteSection>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="gap-2 p-5">
            <div className="text-sm text-muted">عادی</div>
            <div className="text-2xl font-extrabold tabular">{toman(m.correctionPrice)}</div>
            <p className="text-[13px] leading-6 text-ink-2">بازخورد تا ۳ روز کاری</p>
          </Card>
          <Card className="gap-2 border-accent p-5">
            <div className="text-sm text-accent">فوری</div>
            <div className="text-2xl font-extrabold tabular">{toman(m.correctionExpressPrice)}</div>
            <p className="text-[13px] leading-6 text-ink-2">بازخورد تا ۲۴ ساعت کاری</p>
          </Card>
        </div>
      </SiteSection>
      <SiteSection title="معیارهای نمره‌دهی" lead="هر معیار از ۰ تا ۹ نمره می‌گیرد؛ نمره Task میانگین چهار معیار است." className="pt-0">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {WRITING_CRITERIA.map((c) => (
            <Card key={c.id} className="gap-1 p-4">
              <div className="text-sm font-bold">{c.label}</div>
              <div className="ltr text-start text-xs text-muted">{c.en}</div>
            </Card>
          ))}
        </div>
      </SiteSection>
    </>
  );
}
