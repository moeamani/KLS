# Public website

The site follows the school's site map. The team section that was crossed out is left out. Code:
`src/data/site.ts` (structure and copy), `src/components/site/SiteLayout.tsx` (header, mega menu,
footer, mobile drawer), `src/pages/site/*`.

## Site map

| Menu | Page | Route | Content and data |
| --- | --- | --- | --- |
| خانه | Home | `/` | Hero focused on the IELTS mock with the next three open sessions (live seats); the four service groups; a "registration is open" band for the open term; the four steps of a mock; class formats; school figures and news |
| خدمات آموزشی · دوره‌های عمومی | رده سنی کودکان | `/courses/kids` | Service page: highlights, facts, the open term's classes for the course (live seats; enrolment goes through the parent panel), FAQ |
| | رده سنی نوجوانان | `/courses/teens` | Same template; the call to action is the placement test |
| | رده سنی بزرگسالان | `/courses/adults` | Same template |
| | کلاس‌های خصوصی | `/courses/private` | Same template + private-class request form |
| خدمات آموزشی · آموزش آیلتس | کلاس آموزش آیلتس | `/ielts/course` | Same template |
| | کلاس‌های تکمیلی مهارت‌ها | `/ielts/skills` | Same template |
| | برگزاری آزمون آزمایشی آیلتس (ماک) | `/ielts/mock` | What the report contains; every upcoming session (open, full, closed, cancelled with its reason); the four sections with timing; test-day rules; FAQ generated from the current settings (refund window, re-mark fee, instant results); disclaimer |
| | خدمات تصحیح و بازخورد | `/ielts/correction` | Normal and express prices (from settings), the four criteria, call to action to send a text |
| خدمات آموزشی · دوره‌های تخصصی | دوره TTC | `/specialized/ttc` | Service page + TTC application form |
| | دوره‌های خارج از موسسه ویژه شرکت‌ها | `/specialized/corporate` | Service page + company request form |
| خدمات آموزشی · سایر خدمات | تقویم آموزشی | `/calendar` | Terms with registration and class dates and state; holidays; upcoming mocks |
| | سیستم آموزشی | `/system` | Levels and CEFR per course; grading weights and pass mark (from settings); progression steps |
| | الگوهای کلاسی | `/formats` | In-person group, online group, private, semi-private, intensive workshop |
| | منابع آموزشی | `/resources` | Books (price, stock, "out of stock"), files, audio and video; buying happens in the student panel |
| خدمات آنلاین | ثبت‌نام آنلاین | `/portal/enroll` | Asks the visitor to sign in or register, then opens the enrollment wizard |
| | مشاهده نمرات | `/portal/grades` | Asks the visitor to sign in, then shows report cards |
| | رزرو آزمون ماک | `/portal/mock/book` | Asks the visitor to sign in, then opens the booking wizard |
| تماس با ما | Contact | `/contact` | Phone, mobile, Instagram, Telegram, address, hours, contact form |
| درباره ما | About | `/about` | Founded 1381 (24 years), history, founders, policies |

The header shows "ورود / ثبت‌نام" (or "پنل من" when signed in) and a primary "رزرو آزمون ماک"
button. On phones the menu is a drawer with the same groups.

## Content the school must supply

Placeholders are marked with a dashed amber outline on the page:

- phone, mobile, address, Instagram and Telegram handles, opening hours (`CONTACT` in `src/data/site.ts`)
- full history, founders' introduction and the remaining policy items (`ABOUT`)
- final prices, levels and CEFR labels per course (`src/data/catalog.ts`)
- the home page's special highlights. The site map says "not decided yet". The current home page
  pulls them from the rest of the site: next mocks, the open term, the mock steps and the class
  formats.
- photos (none are used yet), the real logo if it differs from the current house-and-speech-bubble
  mark, and news items

## Forms

All forms validate the mobile number (`09…`, 11 digits; Persian digits are accepted) and the
required fields. A sent form shows a confirmation and creates a lead
([05-operations.md](05-operations.md#website-requests-درخواست‌های-سایت)).

## Design

The visual language is "lilac and cream":

- **Colors:** a lavender ground (`#E2DCF8`), cream surfaces (`#FFFCF1`), beige pills and tracks
  (`#F5F1E6`), warm black ink (`#191307`), and periwinkle soundwaves (`#A9AFE3` / `#D5D6F2` /
  `#EAE7FC`), with mauve and pale-blue speaker dots.
- **Type:** extra-condensed black headlines (Anton for Latin, Noto Sans Arabic at 62.5% width for
  Persian); a Markazi serif line above the headline; IBM Plex Sans Arabic for text; IBM Plex Mono
  for Latin labels; IBM Plex Sans for the English exam content.
- **Shapes:** black pill buttons for the main action and beige pills for secondary ones; large
  rounded cream cards on the lavender ground.
- **The soundwave** is the brand motif (`src/components/Wave.tsx`). It appears in the logo, the
  practice-phone hero (`PracticeCard`), the Listening player (it moves while the recording plays)
  and the exam intro.
- **Layout:** Persian digits, right-to-left layout, logical CSS properties, and short eased motion
  that respects `prefers-reduced-motion`. The exam and other English content are left-to-right
  islands, and every page works at phone width.

Tokens are in `src/styles/globals.css`.
