# Running the prototype and walkthroughs

The prototype is a complete clickable app with every panel, built in React 19, Vite 7, TypeScript,
HeroUI v3 and Tailwind v4, in KLS School's own identity (its hexagon logo, royal blue and Yekan Bakh). All data is mock data in the browser's
local storage. There is no backend. It shows the school how the system will work, and it is the
specification for building the real one.

## Run

```bash
npm install
npm run dev        # http://localhost:4173
```

```bash
npm run typecheck
npm run build      # dist/ (relative paths and hash routing: any static host works)
npm run preview
```

## Demo accounts

Use «پر کردن با حساب نمونه» on any sign-in page; the one-time code is always `123456`. The fastest
way to switch is **ابزار نمونه اولیه** (prototype tools), bottom-left on the site or in the sidebar of
any panel.

| View as | Person | Panel |
| --- | --- | --- |
| زبان‌آموز | سارا رحیمی (IELTS candidate, adult, B2) | `/portal` |
| والد | مریم کریمی (children: آرین, 8, kids class; ترانه, 14, teens class with absences) | `/parent` |
| استاد/ممتحن | علی نوری (IELTS teacher and examiner) | `/teacher` |
| مدیر | حمید رستمی | `/admin` (everything) |
| پذیرش | لیلا اکبری | `/admin` (enrollment, mock, requests) |
| مالی | بهروز کیانی | `/admin` (finance, approvals, reports) |

Prototype tools also offer **reset all demo data**, which returns everything to the starting state.

## Walkthroughs

### 1. A full mock exam (about 5 minutes)

The quickest way in is **`/try-mock`** (also «امتحان آزمون ماک (زبان‌آموز نمونه)» in prototype tools, «امتحان یک آزمون
نمونه» on the public mock page and the link under the home page buttons). It signs in as the demo
student and opens a fresh, paid instant mock, so the exam can be taken any time and as often as you
like. As the student, the «آزمون ماک فوری» card on the mock page does the same through the payment
dialog, or for free with «شروع آزمون نمونه رایگان».

1. Read the briefing, play the sound check, tick «قواعد آزمون را خواندم» and press **شروع Listening**.
   (The seeded "today" session also works: as **زبان‌آموز** the home page shows "آزمون ماک آنلاین شما
   باز است"; it stays open for 8 hours after the data is reset.)
2. In Listening:
   - Press play on Part 1; the browser reads the recording aloud.
   - Answer a few questions and flag one.
   - Open **ابزار نمونه اولیه** → «پر کردن خودکار این بخش» to fill the section.
3. **پایان Listening** → confirm → **شروع Reading** → fill → end.
4. **Writing:** «پر کردن خودکار» writes sample essays; watch the word counts. Then **ثبت نهایی آزمون**.
5. The finish page shows the Listening and Reading bands at once, the next steps (Writing examiner,
   Speaking slot) and the event log. «یک آزمون نمونه دیگر» starts another one.

Things to try during the exam:

- Switch on «شبیه‌سازی قطع اتصال» to see the connection dialog and its grace countdown.
- Use the guide button (ⓘ) in the top bar.
- Reload the page: a resume screen appears and a resume is counted.
- Open the same exam in a second tab: the first tab is locked.
- Use «رساندن زمان بخش به ۵ ثانیه» to see the automatic move to the next section.

### 2. Marking and release

1. As **استاد/ممتحن** → صف تصحیح:
   - **رایتینگ ماک** lists M-509 and M-511. Open one, choose the criteria, write the comments and
     submit.
   - **اسپیکینگ** lists your slots. Open M-510, score it, or press «زبان‌آموز حاضر نشد».
2. As **مدیر** → جلسات آزمون ماک → «آزمون ماک آبان (۱)» → **انتشار نتیجه آماده**.
3. The student whose result you released gets a notification. Their result page shows the overall
   band, criteria, feedback, question-type analysis and the answer key.

### 3. Result and re-mark

1. As **زبان‌آموز** → آزمون ماک → سوابق → M-501 → کارنامه. Look through the tabs, then print.
2. «درخواست بازبینی» → choose Writing → write a reason → pay.
3. As **مدیر** → صندوق تأییدها → approve. The re-mark goes to a second examiner (not the first),
   who sees it in their «بازبینی» queue.

### 4. Enrollment, waitlist and the desk

1. As **زبان‌آموز** → ثبت‌نام ترم جدید → دوره آیلتس → IE-ADV-2 → «انتخاب و پرداخت».
   - Try the code `WINTER1405`, then choose «دو قسط».
   - Pay successfully, or try a failed payment first.
2. In the same wizard, choose بزرگسالان → A-B1-2. It is full, so «لیست انتظار» appears.
3. Try the placement test (تعیین سطح آنلاین); the suggested level is then marked in enrollment.
4. As **پذیرش** → ترم‌ها و کلاس‌ها → زمستان → any open class → «ثبت‌نام حضوری» → card-reader
   payment.
5. As **مدیر** → «کلاس جدید»: pick علی نوری, Saturday and Monday at 18:00 to see the clash with
   IE-FND-2. Pick کلاس ۴ as the room to see the room clash too.

### 5. Teaching

1. As **استاد/ممتحن** → کلاس‌های من → IE-ADV-1.
   - **حضور و غیاب:** mark one student absent and save. The parent and student are notified.
   - **نمره‌ها:** enter final marks and «ارسال برای تأیید».
   - **تکلیف‌ها:** add one.
2. As **مدیر** → the class → «تأیید و انتشار کارنامه».
3. As **والد**, see ترانه's absences warning, the report card and the overdue installment; pay it.

### 6. Other staff tools

- **پذیرش** → درخواست‌های سایت: open a company request, change its status and add a note. Then send
  a form from the public site (for example دوره‌های سازمانی) and see it arrive.
- **مالی** → مالی: the ledger, discount codes and teacher pay. In صندوق تأییدها, approve the refund.
- **مدیر** → تنظیمات: change the mock section times or turn on auto-release, then retake the
  workflows.
- **مدیر** → لاگ ممیزی: every action above is listed.

## What is simulated

| Real system | Prototype |
| --- | --- |
| Server, database, SMS | Browser local storage; notifications appear in the bell |
| OTP by SMS | Fixed code `123456` |
| Bank gateway | A dialog with success, failure and cancel |
| Listening audio files | The browser's English text-to-speech (with a transcript switch in the prototype tools) |
| Answer keys on the server | Bundled with the app (the prototype only) |
| Online class or Speaking call | A placeholder dialog with the room link |
| File downloads | A notice |
| Excel and PDF export | The browser's print, for report cards and results |

## Known limits and next steps

1. **Backend:** build on the operations core, following [08-data-model-api.md](08-data-model-api.md).
2. **Test bank editor:** write and preview forms, upload audio, publish workflow.
3. **Homework:** hand-in and per-assignment marking.
4. **Messaging:** in the student panel, to the teacher and to support.
5. **Recorded courses and video:** if the school wants them later.
6. **Final content:** contact details, history, founders, prices, photos and logo (see
   [01-website.md](01-website.md)).
