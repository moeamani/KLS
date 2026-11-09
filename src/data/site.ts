import type { CourseCategory, LeadKind } from '@/types';

// Public site structure (from the school's sitemap) and page copy. Items marked `placeholder`
// are waiting for the school's final text (docs/01-website.md).

export interface NavLink { label: string; to: string; hint?: string }
export interface NavGroup { title: string; links: NavLink[] }

export const SERVICES_MENU: NavGroup[] = [
  {
    title: 'دوره‌های عمومی',
    links: [
      { label: 'رده سنی کودکان', to: '/courses/kids', hint: '۵ تا ۱۱ سال' },
      { label: 'رده سنی نوجوانان', to: '/courses/teens', hint: '۱۲ تا ۱۷ سال' },
      { label: 'رده سنی بزرگسالان', to: '/courses/adults', hint: 'A1 تا C1' },
      { label: 'کلاس‌های خصوصی', to: '/courses/private', hint: 'زمان و سرعت دلخواه' },
    ],
  },
  {
    title: 'آموزش آیلتس',
    links: [
      { label: 'کلاس آموزش آیلتس', to: '/ielts/course', hint: 'آکادمیک و جنرال' },
      { label: 'کلاس‌های تکمیلی مهارت‌ها', to: '/ielts/skills', hint: 'رایتینگ، اسپیکینگ، …' },
      { label: 'آزمون آزمایشی آیلتس (ماک)', to: '/ielts/mock', hint: 'شبیه آزمون واقعی' },
      { label: 'تصحیح و بازخورد آزمون آزمایشی', to: '/ielts/correction', hint: 'با معیارهای رسمی' },
    ],
  },
  {
    title: 'دوره‌های تخصصی',
    links: [
      { label: 'دوره TTC', to: '/specialized/ttc', hint: 'تربیت مدرس زبان' },
      { label: 'دوره‌های ویژه شرکت‌ها', to: '/specialized/corporate', hint: 'در محل سازمان' },
    ],
  },
  {
    title: 'سایر خدمات آموزشی',
    links: [
      { label: 'تقویم آموزشی', to: '/calendar' },
      { label: 'سیستم آموزشی', to: '/system' },
      { label: 'الگوهای کلاسی', to: '/formats' },
      { label: 'منابع آموزشی', to: '/resources' },
    ],
  },
];

export const ONLINE_MENU: NavLink[] = [
  { label: 'ثبت‌نام آنلاین', to: '/portal/enroll', hint: 'انتخاب کلاس و پرداخت' },
  { label: 'مشاهده نمرات', to: '/portal/grades', hint: 'کارنامه هر ترم' },
  { label: 'رزرو آزمون ماک', to: '/portal/mock/book', hint: 'انتخاب تاریخ و پرداخت' },
];

export interface ServicePage {
  path: string;
  group: string;
  title: string;
  lead: string;
  category?: CourseCategory;
  highlights: { title: string; text: string }[];
  facts?: [string, string][];
  sections?: { title: string; items: string[] }[];
  faq?: { q: string; a: string }[];
  cta: { label: string; to: string };
  form?: LeadKind;
}

export const SERVICE_PAGES: ServicePage[] = [
  {
    path: '/courses/kids', group: 'دوره‌های عمومی', title: 'انگلیسی کودکان', category: 'kids',
    lead: 'کلاس‌های کوچک، بازی‌محور و پر از آهنگ و داستان برای کودکان ۵ تا ۱۱ سال؛ با گزارش منظم به والدین.',
    highlights: [
      { title: 'حداکثر ۱۰ نفر', text: 'هر کودک فرصت صحبت کردن دارد و استاد پیشرفت او را جلسه به جلسه دنبال می‌کند.' },
      { title: 'پنل والدین', text: 'حضور و غیاب، تکلیف‌ها و کارنامه را از پنل والدین می‌بینید و غیبت‌ها پیامک می‌شود.' },
      { title: 'تعیین سطح حضوری', text: 'برای کودکان، تعیین سطح با یک گفت‌وگوی کوتاه و دوستانه در آموزشگاه انجام می‌شود.' },
    ],
    facts: [['سن', '۵ تا ۱۱ سال'], ['سطح‌ها', '۶ سطح'], ['هر ترم', '۲۰ جلسه ۷۵ دقیقه‌ای'], ['روزها', 'دو روز در هفته، عصر']],
    faq: [
      { q: 'کودک من هیچ آشنایی با انگلیسی ندارد؛ از کجا شروع کند؟', a: 'سطح «کودکان ۱» برای شروع از صفر طراحی شده است.' },
      { q: 'ثبت‌نام را چه کسی انجام می‌دهد؟', a: 'والدین از پنل والدین یا در آموزشگاه ثبت‌نام می‌کنند.' },
    ],
    cta: { label: 'ثبت‌نام کودک', to: '/parent/enroll' },
  },
  {
    path: '/courses/teens', group: 'دوره‌های عمومی', title: 'انگلیسی نوجوانان', category: 'teens',
    lead: 'برنامه ۸ سطحی برای نوجوانان ۱۲ تا ۱۷ سال، با تمرکز بر صحبت کردن، مهارت‌های تحصیلی و آمادگی برای آزمون‌های بین‌المللی.',
    highlights: [
      { title: 'تعیین سطح آنلاین', text: 'یک آزمون کوتاه ۱۵ سؤالی سطح شروع را پیشنهاد می‌دهد.' },
      { title: 'پروژه‌های گروهی', text: 'ارائه، پادکست و پروژه‌های کلاسی برای استفاده واقعی از زبان.' },
      { title: 'گزارش به والدین', text: 'والدین کارنامه و حضور را از پنل خود می‌بینند.' },
    ],
    facts: [['سن', '۱۲ تا ۱۷ سال'], ['سطح‌ها', 'A1 تا B2 در ۸ سطح'], ['هر ترم', '۲۰ جلسه ۹۰ دقیقه‌ای']],
    cta: { label: 'تعیین سطح و ثبت‌نام', to: '/portal/placement' },
  },
  {
    path: '/courses/adults', group: 'دوره‌های عمومی', title: 'انگلیسی بزرگسالان', category: 'adults',
    lead: 'از Elementary تا Advanced؛ کلاس حضوری یا آنلاین در ساعت‌های عصر، مناسب دانشجویان و شاغلان.',
    highlights: [
      { title: 'حضوری یا آنلاین', text: 'هر سطح در هر ترم هم کلاس حضوری دارد و هم کلاس آنلاین عصرگاهی.' },
      { title: 'ارزشیابی شفاف', text: 'فعالیت کلاسی، تکلیف، میان‌ترم و پایان‌ترم؛ با کارنامه در پنل.' },
      { title: 'مسیر آیلتس', text: 'پس از سطح Upper-Intermediate می‌توانید مستقیم وارد دوره آیلتس شوید.' },
    ],
    facts: [['سطح‌ها', 'A1 تا C1 در ۵ سطح'], ['هر ترم', '۲۰ جلسه ۹۰ دقیقه‌ای'], ['نمره قبولی', '۷۰ از ۱۰۰']],
    cta: { label: 'تعیین سطح و ثبت‌نام', to: '/portal/placement' },
  },
  {
    path: '/courses/private', group: 'دوره‌های عمومی', title: 'کلاس‌های خصوصی', category: 'private', form: 'private',
    lead: 'برنامه شخصی، زمان دلخواه و سرعت متناسب با هدف شما؛ حضوری یا آنلاین.',
    highlights: [
      { title: 'برنامه شخصی', text: 'سرفصل بر اساس هدف شما: سفر، کار، مهاجرت یا آزمون.' },
      { title: 'زمان انعطاف‌پذیر', text: 'روز و ساعت را با استاد هماهنگ می‌کنید.' },
      { title: 'نیمه‌خصوصی', text: 'دو یا سه نفر با هم، با هزینه کمتر برای هر نفر.' },
    ],
    facts: [['هر جلسه', '۶۰ دقیقه'], ['حداقل', '۱۰ جلسه'], ['هزینه', 'به ازای هر جلسه']],
    cta: { label: 'درخواست کلاس خصوصی', to: '#form' },
  },
  {
    path: '/ielts/course', group: 'آموزش آیلتس', title: 'کلاس آموزش آیلتس', category: 'ielts',
    lead: 'دوره‌های Foundation و Advanced برای آکادمیک و جنرال؛ با آزمون ماک در پایان هر دوره.',
    highlights: [
      { title: 'دو سطح', text: 'Foundation برای رسیدن به ۵٫۵ تا ۶ و Advanced برای ۶٫۵ به بالا.' },
      { title: 'تصحیح هفتگی رایتینگ', text: 'هر هفته یک رایتینگ با معیارهای رسمی تصحیح می‌شود.' },
      { title: 'آزمون ماک رایگان', text: 'یک آزمون ماک کامل در پایان دوره، بدون هزینه اضافه.' },
    ],
    facts: [['هر ترم', '۲۴ جلسه ۱۲۰ دقیقه‌ای'], ['پیش‌نیاز', 'سطح B1 به بالا'], ['ماژول', 'آکادمیک و جنرال']],
    cta: { label: 'تعیین سطح و ثبت‌نام', to: '/portal/placement' },
  },
  {
    path: '/ielts/skills', group: 'آموزش آیلتس', title: 'کلاس‌های تکمیلی مهارت‌ها', category: 'ielts_skills',
    lead: 'کارگاه‌های کوتاه ۸ جلسه‌ای برای تقویت یک مهارت: رایتینگ، اسپیکینگ یا لیسنینگ و ریدینگ.',
    highlights: [
      { title: 'Writing Workshop', text: 'ساختار Task 1 و Task 2، با تصحیح فردی در هر جلسه.' },
      { title: 'Speaking Clinic', text: 'تمرین سه بخش اسپیکینگ با بازخورد بر اساس چهار معیار.' },
      { title: 'Listening & Reading', text: 'راهبردهای انواع سؤال و مدیریت زمان.' },
    ],
    facts: [['هر کارگاه', '۸ جلسه ۹۰ دقیقه‌ای'], ['ظرفیت', '۸ تا ۱۲ نفر']],
    cta: { label: 'ثبت‌نام کارگاه', to: '/portal/enroll' },
  },
  {
    path: '/specialized/ttc', group: 'دوره‌های تخصصی', title: 'دوره تربیت مدرس (TTC)', category: 'ttc', form: 'ttc',
    lead: 'روش‌های تدریس، مدیریت کلاس و طراحی درس برای کسانی که می‌خواهند مدرس زبان شوند؛ با تدریس عملی زیر نظر استاد.',
    highlights: [
      { title: 'تدریس عملی', text: 'هر شرکت‌کننده چند جلسه کوتاه را در کلاس واقعی تدریس می‌کند.' },
      { title: 'مصاحبه ورودی', text: 'پذیرش پس از مصاحبه و بررسی سطح زبان (B2 به بالا).' },
      { title: 'گواهی پایان دوره', text: 'گواهی آموزشگاه برای کسانی که ارزشیابی نهایی را بگذرانند.' },
    ],
    facts: [['مدت', '۱۶ جلسه ۱۲۰ دقیقه‌ای'], ['پیش‌نیاز', 'سطح B2 به بالا'], ['پذیرش', 'با مصاحبه']],
    cta: { label: 'ثبت درخواست', to: '#form' },
  },
  {
    path: '/specialized/corporate', group: 'دوره‌های تخصصی', title: 'دوره‌های ویژه شرکت‌ها', category: 'corporate', form: 'corporate',
    lead: 'دوره‌های انگلیسی عمومی و تخصصی (تجاری، فنی، پزشکی) در محل سازمان یا آنلاین، با گزارش پیشرفت به مدیران.',
    highlights: [
      { title: 'نیازسنجی', text: 'پیش از شروع، سطح کارکنان سنجیده و سرفصل بر اساس نیاز سازمان طراحی می‌شود.' },
      { title: 'در محل یا آنلاین', text: 'کلاس در محل شرکت، در آموزشگاه یا آنلاین.' },
      { title: 'گزارش به سازمان', text: 'گزارش حضور و پیشرفت هر نفر برای واحد منابع انسانی.' },
    ],
    cta: { label: 'درخواست پیشنهاد', to: '#form' },
  },
];

export const servicePage = (path: string) => SERVICE_PAGES.find((page) => page.path === path);

export const CLASS_FORMATS = [
  { title: 'حضوری گروهی', text: 'کلاس‌های ۸ تا ۱۲ نفره در آموزشگاه؛ مناسب‌ترین گزینه برای بیشتر زبان‌آموزان.', facts: ['۸ تا ۱۲ نفر', 'دو جلسه در هفته'] },
  { title: 'آنلاین گروهی', text: 'همان برنامه کلاس حضوری، در کلاس آنلاین زنده؛ مناسب کسانی که رفت‌وآمد برایشان سخت است.', facts: ['تا ۱۴ نفر', 'عصرها'] },
  { title: 'خصوصی', text: 'یک زبان‌آموز و یک استاد؛ برنامه و زمان کاملاً شخصی.', facts: ['۶۰ دقیقه', 'حضوری یا آنلاین'] },
  { title: 'نیمه‌خصوصی', text: 'دو یا سه نفر با هدف مشترک؛ با هزینه کمتر از خصوصی.', facts: ['۲ تا ۳ نفر', 'زمان توافقی'] },
  { title: 'کارگاه فشرده', text: 'دوره‌های کوتاه ۸ جلسه‌ای برای یک مهارت مشخص.', facts: ['۸ جلسه', 'پنجشنبه یا جمعه'] },
];

export const CONTACT = {
  phone: '۰۸۳ ۳۸۰۰ ۰۰۰۰',
  mobile: '۰۹۱۸ ۰۰۰ ۰۰۰۰',
  address: 'کرمانشاه، [نشانی دقیق آموزشگاه]',
  instagram: '@kls.school',
  telegram: '@kls_school',
  hours: 'شنبه تا پنجشنبه، ۹ تا ۲۰',
  placeholder: true,
};

export const ABOUT = {
  years: 24,
  founded: '۱۳۸۱',
  story: 'خانه زبان کرمانشاه بیش از ۲۴ سال است که به کودکان، نوجوانان و بزرگسالان کرمانشاه انگلیسی آموزش می‌دهد. [متن کامل تاریخچه و معرفی بنیان‌گذاران از طرف آموزشگاه]',
  founders: '[نام و معرفی بنیان‌گذاران]',
  policies: ['کلاس‌های کوچک تا هر زبان‌آموز فرصت صحبت داشته باشد.', 'ارزشیابی شفاف با معیارهای اعلام‌شده از ابتدای ترم.', 'گزارش منظم پیشرفت به زبان‌آموز و خانواده.', '[سایر بندهای خط‌مشی آموزشگاه]'],
};
