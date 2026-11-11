import type { Course, CourseCategory, Level } from '@/types';

const levels = (prefix: string, titles: [string, string?][]): Level[] => titles.map(([title, cefr], index) => ({ id: `${prefix}${index + 1}`, title, cefr, order: index + 1 }));

// Prices are placeholders the school edits in the admin panel (docs/03-academics.md).
export const COURSES: Course[] = [
  {
    id: 'kids', category: 'kids', title: 'انگلیسی کودکان', ageHint: '۷ تا ۱۱ سال', sessions: 20, minutes: 75, price: 3_800_000, priceUnit: 'term', needsPlacement: false,
    levels: levels('k', [['کودکان ۱', 'Pre-A1'], ['کودکان ۲', 'Pre-A1'], ['کودکان ۳', 'A1'], ['کودکان ۴', 'A1'], ['کودکان ۵', 'A2'], ['کودکان ۶', 'A2']]),
  },
  {
    id: 'teens', category: 'teens', title: 'انگلیسی نوجوانان', ageHint: '۱۲ تا ۱۸ سال', sessions: 20, minutes: 90, price: 4_200_000, priceUnit: 'term', needsPlacement: true,
    levels: levels('t', [['نوجوانان ۱', 'A1'], ['نوجوانان ۲', 'A1'], ['نوجوانان ۳', 'A2'], ['نوجوانان ۴', 'A2'], ['نوجوانان ۵', 'B1'], ['نوجوانان ۶', 'B1'], ['نوجوانان ۷', 'B2'], ['نوجوانان ۸', 'B2']]),
  },
  {
    id: 'adults', category: 'adults', title: 'انگلیسی بزرگسالان', ageHint: '۲۰ سال به بالا', sessions: 20, minutes: 90, price: 4_800_000, priceUnit: 'term', needsPlacement: true,
    levels: levels('a', [['Elementary', 'A1'], ['Pre-Intermediate', 'A2'], ['Intermediate', 'B1'], ['Upper-Intermediate', 'B2'], ['Advanced', 'C1']]),
  },
  {
    id: 'private', category: 'private', title: 'کلاس خصوصی', ageHint: 'همه سنین', sessions: 10, minutes: 60, price: 950_000, priceUnit: 'session', needsPlacement: true,
    levels: levels('p', [['خصوصی · همه سطوح']]),
  },
  {
    id: 'ielts', category: 'ielts', title: 'دوره آیلتس', ageHint: '۱۶ سال به بالا', sessions: 24, minutes: 120, price: 9_500_000, priceUnit: 'term', needsPlacement: true,
    levels: levels('i', [['IELTS Foundation', 'B1'], ['IELTS Advanced', 'B2']]),
  },
  {
    id: 'ielts_skills', category: 'ielts_skills', title: 'کلاس‌های تکمیلی مهارت‌ها', ageHint: 'داوطلبان آیلتس', sessions: 8, minutes: 90, price: 4_500_000, priceUnit: 'term', needsPlacement: false,
    levels: levels('s', [['Writing Workshop'], ['Speaking Clinic'], ['Listening & Reading Strategies']]),
  },
  {
    id: 'ttc', category: 'ttc', title: 'تربیت مدرس زبان (TTC)', ageHint: 'سطح B2 به بالا', sessions: 16, minutes: 120, price: 14_000_000, priceUnit: 'term', needsPlacement: false,
    levels: levels('c', [['TTC · دوره کامل', 'B2+']]),
  },
  {
    id: 'corporate', category: 'corporate', title: 'دوره‌های سازمانی', ageHint: 'کارکنان شرکت‌ها', sessions: 16, minutes: 90, price: 0, priceUnit: 'term', needsPlacement: true,
    levels: levels('o', [['طبق نیاز سازمان']]),
  },
];

export const courseById = (id: string) => COURSES.find((course) => course.id === id);
export const courseOf = (category: CourseCategory) => COURSES.find((course) => course.category === category)!;
export const levelById = (levelId: string | undefined) => {
  for (const course of COURSES) {
    const level = course.levels.find((item) => item.id === levelId);
    if (level) return { course, level };
  }
  return undefined;
};
export const levelTitle = (levelId: string | undefined) => levelById(levelId)?.level.title ?? '—';

export const FORMAT_LABEL = { in_person: 'حضوری', online: 'آنلاین', private: 'خصوصی', semi_private: 'نیمه‌خصوصی' } as const;
