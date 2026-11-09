# Courses, classes and enrollment

Code: `src/data/catalog.ts`, `src/lib/schedule.ts`, `src/features/enroll/*`,
`src/pages/student/Portal.tsx`, `src/pages/parent/Parent.tsx`, `src/pages/teacher/Teacher.tsx`,
`src/pages/admin/Academics.tsx`.

## Catalog (from the school's site map)

| Course | Group | Levels | Sessions × minutes | Price (placeholder) |
| --- | --- | --- | --- | --- |
| انگلیسی کودکان | دوره‌های عمومی · کودکان (5–11) | Kids 1–6 (Pre-A1 → A2) | 20 × 75 | 3.8 m / term |
| انگلیسی نوجوانان | دوره‌های عمومی · نوجوانان (12–17) | Teens 1–8 (A1 → B2) | 20 × 90 | 4.2 m |
| انگلیسی بزرگسالان | دوره‌های عمومی · بزرگسالان (18+) | Elementary → Advanced (A1 → C1) | 20 × 90 | 4.8 m |
| کلاس خصوصی | دوره‌های عمومی · خصوصی | All levels | 10 × 60 | 950 k / session |
| دوره آیلتس | آموزش آیلتس | IELTS Foundation (B1), Advanced (B2) | 24 × 120 | 9.5 m |
| کلاس‌های تکمیلی مهارت‌ها | آموزش آیلتس | Writing Workshop, Speaking Clinic, Listening & Reading | 8 × 90 | 4.5 m |
| TTC | دوره‌های تخصصی | One level (B2+) | 16 × 120 | 14 m |
| دوره‌های سازمانی | دوره‌های تخصصی | By request | — | Quoted per company |

Prices, levels and CEFR labels are placeholders. The school confirms them before launch.

## Terms

A term has `regOpen`, `regClose`, `start` and `end`. The demo has three terms: summer (finished),
autumn (running) and winter (registration open). The manager creates a term from Admin → ترم‌ها و
کلاس‌ها → ترم جدید: registration opens 35 days before the start and closes 5 days after it.

Holidays (`holidays[]`) are skipped when session dates are generated. In production, the official
Iranian holiday calendar from the operations core feeds this list.

## Classes

A class is one group: term, course, level, teacher, room (or online link), format (in person,
online, private, semi-private), weekdays (Persian week: Saturday = 0), start time, length, capacity,
number of sessions and price.

**Creating a class (manager).** Before saving, `conflictsFor` checks every class in the same term
that shares a weekday and overlaps in time:

- **Teacher clash:** the same teacher is already teaching then. Saving is blocked.
- **Room clash:** the same room is already in use then. Saving is blocked.
- **Room capacity:** the class capacity is larger than the room. Saving is blocked with a warning.

**Session dates.** `sessionDates` walks from the term start, keeps the class weekdays, skips
holidays and stops at the session count. Attendance, the student schedule and the teacher's
"upcoming sessions" all use these dates.

**Cancelling a class (manager).** All held, confirmed and waitlisted enrollments are cancelled,
paid invoices get a full refund line, and students are notified with the option to choose another
class.

## Placement

- **Teens and adults:** an online placement test of 15 multiple-choice items from A1 to C1
  (`src/data/placement.ts`). The number correct maps to a suggested level:

  | Correct | Level | CEFR |
  | --- | --- | --- |
  | 0–3 | Elementary | A1 |
  | 4–6 | Pre-Intermediate | A2 |
  | 7–9 | Intermediate | B1 |
  | 10–12 | Upper-Intermediate | B2 |
  | 13–15 | Advanced | C1 |

  Under-18s get the matching Teens level. The level is saved to the profile, and matching classes
  are marked "سطح پیشنهادی شما" in enrollment. Reception can confirm the level with a short talk.
- **Kids:** placement is an in-person conversation. The website form creates a `placement` lead.
- Taking the test is optional: a student who knows their level can choose a class directly.

## Enrollment

### Online (student or parent)

1. **Course:** cards show the age range. Courses that don't suit the student's age are dimmed.
   "Private" goes to the private-class request form.
2. **Class:** the open term's classes for that course, with level, time, teacher, room, free seats
   or waitlist size, and price.
3. **Hold.** `holdEnrollment` checks, in this order:
   - the class exists and is not cancelled
   - registration is open
   - the student is not already enrolled or waitlisted in it
   - no time clash with the student's other classes in the same term
   - a seat is free

   It then creates a `held` enrollment (15 minutes) and an invoice.
4. **Pay:** in one go, or in two installments when the price is at least `installmentMin`
   (default 6 m). A discount code can be applied first.
5. **Confirmation:** the enrollment becomes `confirmed`; the student and parent are notified.

A full class shows **لیست انتظار** instead of the payment button.

### Waitlist

When a confirmed or held seat is cancelled, the first person on the waitlist (oldest first) gets a
`held` enrollment for **24 hours**, a new invoice and a notification. Reception can also move a
waitlisted student to another class of the same course (`transferEnrollment`).

### At the desk (reception)

Admin → class → «ثبت‌نام حضوری»: pick the student, the seat is held, and the payment dialog opens
in staff mode (card reader, cash, transfer or online link).

### Cancellation and transfer

- **Student:** can cancel before the term starts, from the class page. After the start, it goes
  through reception.
- **Reception:** cancels from the student page. A freed seat goes to the waitlist.
- **Transfer:** creates a `confirmed` enrollment in the target class (if it has a seat) and marks
  the old one `transferred`, keeping the invoice and grade sheet. Transfers that need approval go
  through the approvals inbox.

## Attendance (teacher)

- Teacher → class → حضور و غیاب → choose a session (defaults to the latest held one).
- Mark each student: حاضر, تأخیر, غایب or غیبت موجه, then save.
- Future sessions cannot be marked.
- Every absence notifies the parent. When a student's absences in the class reach `absenceAlert`,
  reception is warned too.
- Students and parents see the attendance for every session.

## Grades and report cards

- **Components** (configurable, must total 100): class activity 15, homework 15, midterm 30,
  final 40. The pass mark is 70.
- **Teacher:** enters marks inline (they save automatically), sees the running total, and sends the
  whole class once every final mark is in. This locks the sheet.
- **Manager:** sees "در انتظار تأیید" on the class, checks it, and publishes. Students and parents
  are notified.
- **Report card:** the four components, total with pass or fail, attendance summary and the
  teacher's comment. Printable.
- Before release, students see their running total ("نمره تا امروز"). The final mark stays hidden.

## Homework

- The teacher adds a title, details and a due date. Students and parents are notified.
- Upcoming homework shows on the student home, the class page and the parent page.
- Hand-in and marking of individual homework is a later phase. Homework marks go into the
  "homework" grade component.

## Parent accounts

- A parent account is created when a student under 18 registers online with a parent mobile, or
  when reception adds one.
- One parent can have several children; one tab per child.
- Per child, the parent sees: current classes, attendance per session (with a warning above the
  limit), upcoming homework, released report cards and money due.
- Parents can enroll any of their children and pay their invoices.
