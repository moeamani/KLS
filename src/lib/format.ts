// Locale helpers. Everything user-facing goes through these so digits, dates and
// numbers are rendered the same way on every screen.

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** Latin digits → Persian digits. Leaves every other character untouched. */
export const faDigits = (value: string | number) =>
  String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

/** Persian / Arabic-Indic digits → Latin digits, so input typed on a Persian keyboard validates. */
export const latinDigits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));

/** Keep digits only (after normalising Persian digits). */
export const onlyDigits = (value: string) => latinDigits(value).replace(/\D/g, '');

const numberFormat = new Intl.NumberFormat('fa-IR');
export const faNumber = (value: number) => numberFormat.format(value);

export const faPercent = (ratio: number) =>
  new Intl.NumberFormat('fa-IR', { style: 'percent', maximumFractionDigits: 0 }).format(ratio);

/** «۳ سؤال», «۱۲ روز» … */
export const count = (value: number, noun: string) => `${faNumber(value)} ${noun}`;

/** mm:ss in Persian digits, for timers. */
export const clock = (seconds: number) => {
  const safe = Math.max(0, Math.ceil(seconds));
  const pad = (n: number) => String(n).padStart(2, '0');
  return faDigits(`${pad(Math.floor(safe / 60))}:${pad(safe % 60)}`);
};

/** Masks the middle of an identifier: ۰۰۲۹۴۳۱۹۰۴ → ۰۰۲•••۱۹۰۴ */
export const maskId = (value: string) => faDigits(`${value.slice(0, 3)}•••${value.slice(-4)}`);

/** 09124781903 → ۰۹۱۲ ۴۷۸ ۱۹۰۳ */
export const formatMobile = (value: string) =>
  faDigits(`${value.slice(0, 4)} ${value.slice(4, 7)} ${value.slice(7)}`);

/** First letters of the first and last name, joined with a ZWNJ so they don't connect. */
export const initials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return `${first}‌${last}`;
};

/** 4500000 → ۴٬۵۰۰٬۰۰۰ تومان */
export const toman = (value: number) => `${faNumber(Math.round(value))} تومان`;
/** Short money for KPIs: ۱۲٫۵ میلیون */
export const tomanShort = (value: number) =>
  value >= 1_000_000_000
    ? `${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 }).format(value / 1_000_000_000)} میلیارد`
    : value >= 1_000_000
      ? `${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 }).format(value / 1_000_000)} میلیون`
      : faNumber(value);
