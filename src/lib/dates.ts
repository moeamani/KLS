// Dates are stored as ISO strings and always rendered in the Persian (Solar Hijri)
// calendar. Seed data is generated relative to "now" so the prototype never shows
// a deadline that is already in the past by accident.

const DAY = 24 * 60 * 60 * 1000;

export const now = () => new Date();
export const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
export const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY);
export const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60_000);
export const iso = (date: Date) => date.toISOString();
export const daysFromNow = (days: number, hour = 10, minute = 0) => {
  const date = addDays(startOfDay(now()), days);
  date.setHours(hour, minute, 0, 0);
  return iso(date);
};

const fmt = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('fa-IR-u-ca-persian', options);
const fullDate = fmt({ day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = fmt({ day: 'numeric', month: 'long' });
const monthYear = fmt({ month: 'long', year: 'numeric' });
const monthOnly = fmt({ month: 'long' });
const time = fmt({ hour: '2-digit', minute: '2-digit', hour12: false });
const timeWithSeconds = fmt({ hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const persianParts = new Intl.DateTimeFormat('en-US-u-ca-persian', { year: 'numeric', month: 'numeric', day: 'numeric' });

/** ۲۵ مهر ۱۴۰۵ */
export const formatDate = (value: string | Date) => fullDate.format(new Date(value));
/** ۲۵ مهر — omits the year when it is the current Persian year */
export const formatDay = (value: string | Date) => {
  const date = new Date(value);
  return persianYear(date) === persianYear(now()) ? shortDate.format(date) : fullDate.format(date);
};
/** مهر ۱۴۰۵ — composed from parts because the CLDR Persian pattern puts the year first. */
export const formatMonthYear = (value: string | Date) => {
  const parts = Object.fromEntries(monthYear.formatToParts(new Date(value)).map((part) => [part.type, part.value]));
  return `${parts.month} ${parts.year}`;
};
/** مهر */
export const formatMonth = (value: string | Date) => monthOnly.format(new Date(value));
/** ۱۰:۳۵ */
export const formatTime = (value: string | Date | number) => time.format(new Date(value));
export const formatTimeSeconds = (value: string | Date | number) => timeWithSeconds.format(new Date(value));
/** ۲۵ مهر · ۱۰:۳۵ */
export const formatDateTime = (value: string | Date) => `${formatDay(value)} · ${formatTime(value)}`;

const parts = (date: Date) => {
  const values = Object.fromEntries(persianParts.formatToParts(date).map((p) => [p.type, p.value]));
  return { year: Number(values.year), month: Number(values.month), day: Number(values.day) };
};
export const persianYear = (date: Date) => parts(date).year;
/** Sortable key for the Persian month a date falls in, e.g. 1405-07 */
export const persianMonthKey = (value: string | Date) => {
  const { year, month } = parts(new Date(value));
  return `${year}-${String(month).padStart(2, '0')}`;
};

/** Whole calendar days from today to the given date (negative = in the past). */
export const daysUntil = (value: string | Date) =>
  Math.round((startOfDay(new Date(value)).getTime() - startOfDay(now()).getTime()) / DAY);

const rtf = new Intl.RelativeTimeFormat('fa-IR', { numeric: 'auto' });
/** «امروز»، «فردا»، «۳ روز دیگر»، «۲ روز پیش» */
export const relativeDay = (value: string | Date) => rtf.format(daysUntil(value), 'day');

/** «۵ دقیقه پیش»، «۲ ساعت پیش»، «دیروز» … for activity feeds */
export const relativeTime = (value: string | Date) => {
  const diff = (new Date(value).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return 'همین حالا';
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < DAY / 1000) return rtf.format(Math.round(diff / 3600), 'hour');
  return relativeDay(value);
};
