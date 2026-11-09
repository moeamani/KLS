import { onlyDigits } from './format';

/** Iranian national code: 10 digits with a mod-11 check digit. */
export const isValidNationalId = (raw: string) => {
  const code = onlyDigits(raw);
  if (!/^\d{10}$/.test(code) || /^(\d)\1{9}$/.test(code)) return false;
  const digits = code.split('').map(Number);
  const sum = digits.slice(0, 9).reduce((total, digit, index) => total + digit * (10 - index), 0);
  const remainder = sum % 11;
  const check = digits[9];
  return remainder < 2 ? check === remainder : check === 11 - remainder;
};

/** Builds a valid national code from a 9-digit body (used by the seed data). */
export const withNationalIdCheck = (body: string) => {
  const digits = body.padStart(9, '0').slice(0, 9).split('').map(Number);
  const sum = digits.reduce((total, digit, index) => total + digit * (10 - index), 0);
  const remainder = sum % 11;
  return `${digits.join('')}${remainder < 2 ? remainder : 11 - remainder}`;
};

export const nationalIdError = (raw: string) => {
  const code = onlyDigits(raw);
  if (!code) return 'کد ملی را وارد کنید.';
  if (code.length !== 10) return 'کد ملی باید ۱۰ رقم باشد.';
  if (!isValidNationalId(code)) return 'این کد ملی معتبر نیست. ارقام را دوباره بررسی کنید.';
  return '';
};

export const mobileError = (raw: string) => {
  const mobile = onlyDigits(raw);
  if (!mobile) return 'شماره موبایل را وارد کنید.';
  if (!mobile.startsWith('09')) return 'شماره موبایل باید با ۰۹ شروع شود.';
  if (mobile.length !== 11) return 'شماره موبایل باید ۱۱ رقم باشد.';
  return '';
};
