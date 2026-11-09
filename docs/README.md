# KLS School documentation

KLS School (خانه زبان کرمانشاه) is a language school in Kermanshah. Its platform has two sides:

1. **Management** (بخش مدیریتی): staff run terms, classes, enrollment, attendance, grades, finance,
   approvals and daily work on one system.
2. **Students** (بخش دانش‌آموزان): the public website and the student and parent panels for online
   enrollment and payment, the **IELTS mock exam** (the school's most important product), the
   correction service, report cards and books.

| Document | Covers |
| --- | --- |
| [01-website.md](01-website.md) | Site map from the school, every page, forms, content still to be supplied |
| [02-ielts-mock.md](02-ielts-mock.md) | Sessions, booking, the exam engine, scoring, examiner workflow, results, re-mark, correction service, edge cases |
| [03-academics.md](03-academics.md) | Courses and levels, terms, classes and clashes, placement, enrollment, waitlist, attendance, grades, homework, parent accounts |
| [04-finance.md](04-finance.md) | Invoices, payment dialog, installments, discount codes, refunds, ledger, teacher pay |
| [05-operations.md](05-operations.md) | Approvals inbox, website requests, notifications matrix, audit log, reports, users, leave, settings, dashboard |
| [06-roles-permissions.md](06-roles-permissions.md) | Panels, staff roles and what each can do |
| [07-states.md](07-states.md) | Every status vocabulary and state transition |
| [08-data-model-api.md](08-data-model-api.md) | Entities, recommended backend, API sketch, external services, security |
| [09-prototype.md](09-prototype.md) | How to run it, demo accounts, walkthroughs, what is simulated, next steps |
| [system-map.html](system-map.html) | The earlier one-page system map (Persian) |

## Where things live in the code

```
src/
  types.ts              domain model
  lib/ielts.ts          band tables, rounding, scoring
  lib/schedule.ts       weekdays, session dates, clash checks
  data/                 catalog, site copy, mock test content, placement test, status vocabulary, seed
  store/app.ts          every workflow action (the stand-in for the API)
  store/selectors.ts    derived values: seats, class state, scores, exam window
  features/mock/        exam engine, runner, result report, grading forms
  features/enroll/      enrollment wizard, payment dialog, invoices, report card
  components/           shell (sidebar, notifications, prototype tools), site layout, UI pieces
  pages/site            public website
  pages/student         student panel
  pages/parent          parent panel
  pages/teacher         teacher panel
  pages/admin           admin panel
```
