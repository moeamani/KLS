# KLS School (خانه زبان کرمانشاه): project brief for proposal and agreement

> Purpose of this file: a single, self-contained description of the whole project, to hand to another
> assistant (or a person) who will write the **proposal and the agreement**. It covers the client,
> the goal, the full scope, what already exists, what is still to be built, the assumptions, and
> what is not yet decided. Prices, timeline and legal terms are **not** in this file: they are for
> the proposal writer and the owner to set (see §14).
>
> Sources: the system map `KLS.html` (version 2, آبان ۱۴۰۵), the school's two content documents
> (site map and content brief), and the working prototype in this repository.
> Language of the product: Persian, right-to-left. This brief is in English with the Persian terms
> that appear in the product.

---

## 1. The client and the goal

**Client:** KLS School, خانه زبان کرمانشاه ("Kermanshah Language House"), a language school in
Kermanshah, Iran. Founded in خرداد ۱۳۸۰ (about 24 years of operation), part of a lineage of
schools (معرفت, سفیر گفتمان) and now an independent local school and a national-level institute.
It teaches **English** to three age groups (children, teens, adults), runs **IELTS** preparation and
mock exams, trains teachers (TTC) and serves companies.

School facts useful for the proposal (from the school's own content):
- Licensed by the Ministry of Science, Research and Technology; certificates are verifiable
  (قابل استعلام) and translatable/attestable through the Ministry of Foreign Affairs.
- Small classes: at most 12 learners at advanced levels, at most 17 at other levels.
- Class patterns: termic, intensive (فشرده), super-intensive, one, two or three days a week; adults
  from 8:00 to 20:00.
- Closed-circuit cameras for quality control, audio-visual equipment in classes, liability and
  accident insurance for all learners.
- Online level placement, enrollment and fee payment are already part of the school's promise.

**Goal of the project:** one system with two sides.

1. **Management side (بخش مدیریتی):** staff run terms, classes, enrollment, attendance, grades,
   finance, approvals and daily work in one place.
2. **Student side (بخش دانش‌آموزان):** a public website plus student and parent panels, where people
   enroll and pay online, take a placement test, attend and study, book and take the **IELTS mock
   exam** (the school's most important product), get Writing corrections, see report cards and buy
   books.

---

## 2. Architecture in one picture (from `KLS.html`)

"One system, two doors."

- **Door 1, the admin panel** (own subdomain): each colleague sees the parts for their role.
  Password plus two-step verification. Staff only.
- **Door 2, the website and student portal** (main domain): site, student panel, parent panel.
  Sign-in with **mobile number and a one-time code**.
- Both doors reach **one integrated system**, with a role check and an **audit log** on every change.

Inside the system (three areas):

| Area | Contains | Status in the system map |
| --- | --- | --- |
| **Term and in-person classes** | terms, levels, academic calendar; rooms, layout, clash warnings; in-person enrollment, waitlist; attendance, homework; report cards, certificates, parent accounts | **New build** |
| **Online learning and sales** | recorded courses, live online classes, exams; books, packages, discount codes; cash and installment payment, wallets; home page, blog, reviews; support and tickets | Ready |
| **Running the institute** | staff, roles, audit log; attendance, leave, payroll; financial ledger, expenses, approvals; chat, meetings, documents, tasks; staff only | Ready |

Shared services: class and exam module (teaching hours), PDF generation (report cards,
certificates, invoices), files (notes, audio, images), a job queue (SMS, email, reminders),
sessions (sign-in, attempt limits), audit log, one database on the school's server.

**External services**, all through **one adapter layer** (so internal work continues when the
internet or a provider is down, and a provider can be swapped in one place): bank payment gateway
(cash and installments), live-class service, video hosting (secure playback), SMS panel (sign-in
codes, reminders, absence alerts).

### Decisions the plan is built on

1. Capacity, enrollment and payment are recorded in **one place** (the site and admin panel see the
   same seat count, so a class is never oversold).
2. The ready parts are **not rewritten**. The term and in-person class part is built next to them
   and reuses their classes, exams and payments.
3. **One look and feel** for all panels (colors, type, Persian RTL components).
4. External services go through **one layer**.
5. A payment is final **only when the bank confirms it**, not when the user returns to the site.
   Each confirmation is recorded once, even if the bank reports twice.
6. Students never reach the admin side. Salaries, ledger and team chat stay behind the staff role.
   Students and parents see only their own or their child's file.

### The staff, student and parent access matrix (summary)

Full rules live in `docs/06-roles-permissions.md`. In the system map: the manager has full access
to terms, classes, enrollment, attendance and grades and to team tools; reception and support can
enroll, move and read; finance owns the ledger, payments and payroll; the teacher sees only their
own classes, attendance, grades and resources; the student sees only their own enrollment, payments
and results; the parent sees the child's attendance, grades, resources and payments, and can pay.

---

## 3. What exists today: the working prototype

A complete **clickable prototype** is in this repository. It is the specification for the real
system, not the production system. All data is mock data in the browser (local storage), and there
is no backend.

- **Stack:** React 19, Vite 7, TypeScript, HeroUI v3, Tailwind v4, zustand, react-router 7.
  Persian RTL, brand identity from the school's logo (royal blue `#2F3194`, saffron `#E3961A`,
  font Yekan Bakh; IBM Plex Sans for English exam content).
- **Size:** about 9,900 lines of TypeScript, roughly 1,300 lines of documentation.
- **Run:** `npm install`, `npm run dev` (http://localhost:4173). Use «ابزار نمونه اولیه» (prototype
  tools) to switch role; the demo one-time code is `123456`. `npm run build` makes a static build
  that works on any static host (hash routing, relative paths).
- **Demo accounts:** student (سارا رحیمی), parent (مریم کریمی), teacher and examiner (علی نوری),
  manager (حمید رستمی), reception (لیلا اکبری), finance (بهروز کیانی).
- **Repository:** `moeamani/KLS`. Work branch: `claude/friendly-clarke-jl9x47`.

### Deliverables the prototype already demonstrates

1. **Public website** (§4).
2. **Student panel:** online enrollment with seat hold (15 minutes), installments and waitlist;
   placement test; the IELTS mock exam end to end; Writing correction service; classes and
   attendance; report cards; payments; books.
3. **Parent panel:** each child's attendance, homework, report cards and payments; enrolling
   children; overdue installment payment.
4. **Teacher panel:** classes, attendance, grades, homework, marking queue (mock Writing, Speaking,
   re-marks, corrections) and leave requests.
5. **Admin panel** (manager, reception, finance): dashboard; mock sessions, bookings and result
   release; test bank; correction queue; terms and classes with clash checks; students; enrollments;
   teachers; finance (invoices, ledger, discount codes, teacher pay); approvals inbox; website
   requests; reports; audit log; users and roles; settings.

---

## 4. The public website (from the school's site map and content brief)

Pages and routes (all built, with the school's copy where supplied):

| Menu | Pages |
| --- | --- |
| خانه | Banner carousel (four slides linking to service groups), eight entry boxes (TTC, IELTS, private, general, calendar, online services, gallery, why us), IELTS-mock hero with the next three open sessions (live seats), "registration open" band, mock steps, class formats, school figures, news, three Instagram tiles |
| خدمات آموزشی · دوره‌های عمومی | Kids (7 to 11, two days a week), teens (12 to 18, CEFR), adults (20+, termic / intensive / super-intensive), private classes (1 to 4 people, request form) |
| خدمات آموزشی · آموزش آیلتس | IELTS preparation class; skills workshops (one skill per term); IELTS mock exam (sessions, instant mock, rules, FAQ); correction and feedback service |
| خدمات آموزشی · دوره‌های تخصصی | Teacher Training Course (40 to 50 hours, application form); corporate off-site courses (request form) |
| خدمات آموزشی · سایر خدمات | Academic calendar (term calendars, terms, holidays, upcoming mocks); education system (levels, CEFR, grading weights, progression, photos); class formats; workshops (specialised and free complementary); educational resources (books, audio and image files per age group) |
| تیم خانه زبان | Five groups from the site map: management, office, education, development and research, public relations. Names and photos are placeholders |
| خدمات آنلاین | Online enrollment; view grades; online class; mock-exam booking |
| تماس با ما | Phone, mobile, Instagram, Telegram, address, hours, contact form |
| درباره ما | Founders, history (from خرداد ۱۳۸۰), policy, "why Kermanshah Language House" (20 points); also `/why` and `/gallery` pages |

- A footer ("last menu") lists courses, quick links and contact.
- The mega menu has three levels (main, sub-menu 1, sub-menu 2), as in the brief; on phones it is a
  drawer.
- **Forms** (contact, private class, TTC, corporate) validate the Iranian mobile (`09…`, 11 digits,
  Persian digits accepted) and create a **lead** for reception to follow up.

---

## 5. The IELTS mock exam (the main product)

Three parts sharing one scoring engine (`docs/02-ielts-mock.md`, 415 lines):

1. **Mock exam (آزمون ماک):** scheduled four-skill test, or an **instant mock** a student buys and
   starts at once. Sessions have capacity, price, modules (Academic / General), delivery (at the
   school's computers or online from home), Speaking slots with examiners, registration close, and
   derived states (open, full, closed, running, cancelled).
2. **Correction service (خدمات تصحیح و بازخورد):** the student sends one Writing task (normal or
   express price); an examiner returns band scores on the four criteria and feedback.
3. **Re-mark (بازبینی نمره):** one paid re-mark per result, by a **second** examiner, approved
   through the approvals inbox.

**Exam engine:** computer-delivered layout; timed Listening (audio), Reading (passages, question
groups), Writing (Task 1 and 2 with word counts); question types; flagging; autosave; reload and
resume; connection-loss dialog with a grace timer; a single active window per attempt (a second
window locks the first); server-style section deadlines; automatic move to the next section.
**Scoring:** raw score to band tables for Listening and Reading; whole-band Writing and Speaking
criteria (TA/CC/LR/GRA and FC/LR/GRA/P); overall band rounding. **Examiner workflow:** blind Writing
marking (no name), Speaking with name, no-show handling, release of results by the manager or
automatically. **Result report:** bands, criteria, written feedback, question-type analysis, answer
key, print. Every result states it is practice and **not an official IELTS result**; "IELTS" is used
descriptively and no official branding is copied.

---

## 6. Academics, finance and operations (summary)

Details in `docs/03-academics.md`, `04-finance.md`, `05-operations.md`, `07-states.md`.

**Academics:** catalog of eight course categories with levels and CEFR labels (kids 6 levels, teens
8, adults 5, IELTS 2, skills 3, private, TTC, corporate); **terms** (registration open and close,
start, end; seven terms a year, and next year's calendar published at year end); **classes** with
teacher, room or online link, days, time, capacity, price, sessions, and **clash checks** for
teacher and room; **online placement test** that suggests a level and class (kids are placed in
person); **enrollment** online (seat hold with a 15-minute countdown), at the **desk**, **waitlist**
with offers, cancellation and transfer; **attendance** per session with parent and student
notification; **grades** (activity, homework, mid-term, final; pass mark 70 of 100) and **report
cards** approved and published by the manager; **homework**; **parent accounts** created
automatically for learners under 18.

**Finance:** one invoice per purchase (enrollment, mock, correction, book, re-mark); a single
payment dialog (cash, installments, discount code, desk card reader); **installments** and overdue
tracking; **refunds** through approvals; **discount codes** (kind, scope, expiry, maximum uses);
**ledger** (receivables, expenses, profit and loss); **teacher pay** from taught sessions;
append-only payments, refunds as negative lines.

**Operations:** **approvals inbox** (refund, discount, transfer, leave, re-mark; nobody approves
their own request); **website requests** (leads with status and notes); **notifications** in the app
and by SMS (24 h reminders, absences, results, installments); **audit log** (manager only);
**reports** with Excel and PDF export; **users and roles**; **teacher leave**; **settings**
(seat-hold minutes, mock section times, grade weights, installment minimum, absence alert,
auto-release); dashboard per role.

---

## 7. What is ready, what changes, what is new (from `KLS.html`)

**Ready (built and tested, from the existing platforms):** recorded courses, live online class,
exams and question bank; book shop, packages, discount codes; cash and installment payment,
invoices, wallet and teacher settlement; home page, blog, reviews, support and tickets; staff,
attendance, leave, payroll, financial ledger, expenses; chat, meetings, documents, tasks, report
builder; sign-in, roles, two-step verification, audit log.

**Ready with changes:** course and class (add level, prerequisite, term); weekly schedule (add rooms
and clash warning); student file (add parents and term history); online enrollment (add seat hold in
a term); placement (turn the test result into a level); term fees and the school's own installment
plan; approvals inbox (special discount, refund, class move); resources of each term class.

**New build:** term and academic calendar (and the term calendar on the site); in-person enrollment
and waitlist; class attendance and absence SMS; homework; report card and certificate; parent
account.

**Note on scope:** the system map also lists items (recorded courses with video hosting, blog,
reviews, chat and meetings, payroll, wallets) that the prototype does **not** implement. The
prototype focuses on the term, class, IELTS mock and the panels. The proposal should state clearly
which of these are in or out of the first delivery.

---

## 8. Build order proposed in `KLS.html` (four phases)

1. **Integrate the ready parts:** shared sign-in and roles, one look for all panels, every sale
   recorded in the financial ledger.
2. **Term and in-person classes:** term, level, room and layout, in-person enrollment, attendance,
   term tuition.
3. **Term portal:** online enrollment in a term with seat hold, placement test, report card, parent
   account.
4. **Homework and reports:** homework, resources per class, certificate, management reports of the
   term.

The IELTS mock exam, the correction service and the public website are specified and prototyped in
this repository and should be placed in this order by the proposal writer (suggested: with phase 2
and 3, since the mock is the school's most important product).

---

## 9. Recommended production technology and integration

(`docs/08-data-model-api.md`.) Build on the company's existing operations core: **Django REST API**
with Channels (realtime) and Celery workers, **PostgreSQL**, Redis, an audit store, a PDF service,
Docker deployment with backups and monitoring. It already provides sign-in, roles and a single
`can(actor, action, resource)` permission function, audit log, Jalali calendar with official
holidays, invoices and ledger, payroll, approvals, chat, meetings, notifications and the report
builder. KLS adds four apps: `academics`, `mock`, `catalog`, `site`. The React front end becomes
the real client of a REST API under `/api/v1` (a full endpoint sketch is in `docs/08`).

Other options noted in the system map: the ready parts are either **merged into one codebase** or
**kept side by side and connected**; the choice depends on each part's technology. This is an open
decision (see §12).

**Security requirements:** answer keys and scoring stay on the server; time is kept by the server
(client timers are display only); one active attempt per booking; OTP 6 digits, valid 2 minutes,
5 attempts, rate-limited per mobile and IP; staff add password and two-step verification; every
change to money, grades, results, roles and settings is audited; personal data (mobile, national
ID) is shown only to roles that need it; payments confirmed by the bank server-side and idempotent
per bank reference.

---

## 10. External services the school will need (client-side accounts)

| Service | Use | Who provides |
| --- | --- | --- |
| Bank payment gateway (Iranian PSP) | Cash and installment payment | School (merchant account) |
| SMS panel | OTP, confirmations, reminders, absence and result alerts | School or vendor |
| Live-class service | Online classes and online Speaking (or the operations core's own meetings) | Decide |
| Video hosting | Recorded content, if added | Decide |
| Server and domain | Main domain (site and portal), admin subdomain, HTTPS | School |

---

## 11. What the prototype simulates (to be replaced in production)

| Real system | Prototype |
| --- | --- |
| Server, database, SMS | Browser local storage; notifications in the bell |
| OTP by SMS | Fixed code `123456` |
| Bank gateway | A dialog with success, failure and cancel |
| Listening audio | Browser text-to-speech (real recordings needed) |
| Answer keys on the server | Bundled with the app (prototype only) |
| Online class or Speaking call | A placeholder dialog |
| Excel and PDF export | Browser print |
| Photos and logo | Placeholders; the logo is a vector redraw of the school's image |

---

## 12. Open questions and assumptions to confirm with the school

Assumptions in the system map:
1. Some students are **under 18**, so parent accounts are required.
2. The school runs **both in-person and online** classes.
3. **One branch** for now. If there are several, a branch field must be added to terms, classes,
   rooms and staff.
4. Whether the ready parts are merged in one codebase or connected side by side.

Also to decide:
- Which items in §7's "ready" list are inside the first contract (video courses, blog, chat,
  payroll, wallets).
- Exact discrepancy: the school's text gives the founding as خرداد ۱۳۸۰ and the site map says
  "24 years"; confirm the year shown on the site.
- Age bands: the school's copy says kids 7 to 11, teens 12 to 18, adults 20+ (age 18 to 19 is not
  covered; confirm), while the legal "minor" rule in the system is under 18.

---

## 13. Content and assets the school must supply

- Final phone, mobile, address, Instagram and Telegram handles, opening hours.
- Team names, roles, photos (management, office, education, development and research, PR).
- Photos of the institute (5 to 6 for the education-system page, more for the gallery), banner
  graphics for the home page, Instagram posts and reels.
- The original vector logo, if different from the redrawn mark.
- Final prices, levels and CEFR labels per course; term dates for the year.
- Book list with prices, stock, and the **audio and image files** of each age group's books.
- Real Listening audio and the test bank content for the IELTS mock (the prototype ships sample
  tests only).
- The remaining policy text, news items, and legal text for the agreement and refund rules.
- Examiner and teacher list with pay rates; room list and capacities.

---

## 14. For the proposal and agreement (to be filled by the proposal writer)

Not decided in this brief, deliberately: **price, payment schedule, timeline, and legal terms**.
Suggested sections for the proposal:

1. Understanding of the client and goals (§1).
2. Solution overview and architecture (§2).
3. Scope: in scope and out of scope per phase (§3 to §8). State the status of every item (ready,
   with changes, new) so the client sees what is reused.
4. Deliverables and acceptance criteria per phase (e.g., the walkthroughs in
   `docs/09-prototype.md` are ready-made acceptance scenarios).
5. Technology, hosting and security (§9).
6. Client responsibilities: content and assets (§13), third-party accounts (§10), confirming open
   questions (§12), timely feedback.
7. Assumptions, risks (dependency on bank and SMS providers, internet outages, real exam content,
   data migration of existing students if any) and change-request process.
8. Commercials: price per phase, payment milestones, hosting and maintenance after launch, support
   level.
9. Agreement terms: ownership of code and content, school data and privacy, confidentiality,
   warranty and bug-fix period, termination, governing law (Iran).

Items worth stating in the agreement because they affect liability: the mock exam is practice and
not an official IELTS result; payments are confirmed only by the bank; the school owns its student
data; exam answer keys and scoring stay on the server.

---

## 15. Repository map

```
README.md                    overview and run instructions
docs/README.md               documentation index
docs/01-website.md           site map, every page, forms, content to supply
docs/02-ielts-mock.md        mock exam: sessions, booking, engine, scoring, examiners, re-mark, correction
docs/03-academics.md         courses, terms, classes, placement, enrollment, attendance, grades, parents
docs/04-finance.md           invoices, payments, installments, refunds, ledger, teacher pay
docs/05-operations.md        approvals, requests, notifications, audit, reports, settings
docs/06-roles-permissions.md panels, roles, what each can do
docs/07-states.md            every status and transition
docs/08-data-model-api.md    entities, backend plan, API sketch, services, security
docs/09-prototype.md         running it, demo accounts, walkthroughs, what is simulated
docs/system-map.html         system map (Persian); the newer copy is KLS.html (version 2, آبان ۱۴۰۵)
docs/PROJECT-BRIEF.md        this file
src/                         types, lib (IELTS bands, schedule), data (catalog, site copy, tests, seed),
                             store (all workflow actions), features (mock, enroll), components, pages
                             (site, student, parent, teacher, admin)
```

---

## 16. Internal notes (not for the client)

The README records where the building blocks come from: the component base, mobile OTP sign-in and
exam-engine rules from the vendor's `sakoo` project; staff tools (roles and `can()`, audit log,
approvals, leave, finance ledger, payroll, notifications, reports) and the recommended production
backend from the vendor's `nexus` operations core; learning-platform patterns (courses, classes,
exams, store, packages, discount codes, wallets, support) from the "Greenoly" admin panel; the IELTS
mock content, scoring, terms, classes, placement, attendance, report cards and parent accounts are
new for KLS. Reuse of these is what makes the "ready" list in §7 possible; the proposal should price
integration and adaptation work, not a from-scratch build, for those parts. Remove this section
before sharing the file with the client.
