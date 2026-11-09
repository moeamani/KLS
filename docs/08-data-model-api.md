# Data model and backend plan

The prototype keeps everything in the browser: a persisted zustand store (`kls.app`) plus the live
exam state (`kls.mockExam`). This document describes the same model for the production backend and
the API the frontend will call. Types are in `src/types.ts`.

## Entities

| Entity | Key fields | Notes |
| --- | --- | --- |
| `Student` | name, mobile (unique), nationalId?, birthYear, parentId?, levelId?, email?, source | National ID is checked with the mod-11 checksum when given |
| `Parent` | name, mobile (unique), childIds[] | Created automatically for students under 18 |
| `Teacher` | name, mobile, nationalId, skills[] (kids, general, ielts, examiner, ttc), ratePerSession, status | `examiner` lets them mark mocks |
| `Staff` | name, mobile, nationalId, role (manager, reception, finance), status | In production, a user of the operations core with a school role |
| `Course` / `Level` | category, title, levels[] {title, cefr}, sessions, minutes, price, priceUnit, needsPlacement | Catalog |
| `Term` | title, regOpen, regClose, start, end | State is derived |
| `Holiday` | date, title | From the official calendar |
| `Room` | name, capacity | |
| `ClassGroup` | code, termId, courseId, levelId, teacherId, roomId? / onlineUrl?, format, days[], start, minutes, capacity, price, sessions, cancelled? | Unique constraints: teacher and room have no overlap in a term |
| `Enrollment` | studentId, classId, status, heldUntil?, invoiceId?, by, grade?, events[] | Status vocabulary in [07-states.md](07-states.md) |
| `GradeSheet` | activity, homework, midterm, final (nullable), comment, status | One per enrollment |
| `AttendanceSheet` | classId, session, date, marks {studentId: mark}, by, at | Unique (classId, session) |
| `Homework` | classId, title, due, detail | |
| `MockTest` | title, module, status, listening[] {parts → groups → questions}, reading[] {passages → groups}, writing {t1 {prompt, chart?, letter?}, t2}, speaking {p1[], p2 {topic, bullets, closing}, p3[]} | Answer keys must never reach the candidate's browser in production |
| `MockSession` | title, at, modules[], deliveries[], testIds, capacity, price, regClose, slots[], cancelled?, note? | |
| `SpeakingSlot` | at, examinerId, bookingId? | Unique bookingId |
| `MockBooking` | code, studentId, sessionId, module, delivery, slotId?, status, heldUntil?, invoiceId?, attempt?, writingExaminerId?, writing?, speaking?, speakingNoShow?, releasedAt?, remark?, events[] | |
| `MockAttempt` | answers {questionId: text}, writing {t1, t2}, startedAt, submittedAt, log[], endReason | Write-once after submit |
| `WritingGrade` | t1 {ta, cc, lr, gra}, t2 {…}, comments {t1, t2, overall}, examinerId, at | Whole bands 0–9 |
| `SpeakingGrade` | scores {fc, lr, gra, p}, comment, examinerId, at | |
| `Remark` | skill, reason, status, before?, after?, examinerId? | |
| `Correction` | code, studentId, task, prompt, text, express, status, examinerId?, grade?, invoiceId? | |
| `Invoice` | code, studentId, title, items[], discount?, total, installments[], payments[], status, ref {kind, id} | Payments are append-only; refunds are negative lines |
| `DiscountCode` | code, kind, value, scope, expires, maxUses, used, active | |
| `Lead` | kind, name, mobile, company?, message, data, status, notes[] | |
| `Approval` | kind, title, detail, amount?, requester, status, decidedBy?, decidedAt?, note?, ref | |
| `LeaveRequest` | teacherId, from, to, reason, status | |
| `Notice` | to, title, body?, href?, at, read | Delivered in-app and by SMS |
| `AuditEntry` | at, actor, action, target | Append-only |
| `Resource` | title, kind, audience, description, price?, stock? | Books and files |
| `Settings` | seatHoldMin, mock {…}, grades {…}, installmentMin, absenceAlert | One row per school |

## Recommended backend

Reuse the operations core already built for the company: a Django REST API with Channels for
realtime and Celery workers, PostgreSQL, an audit store, Redis, a PDF service, and Docker
deployment with backups and monitoring. It already provides sign-in, roles and `can()`, the audit
log, the Jalali calendar with official holidays, invoices and the ledger, payroll, the approvals
inbox, chat, meetings, notifications and the report builder.

KLS adds four Django apps: `academics` (terms, classes, enrollment, attendance, grades, homework,
placement), `mock` (tests, sessions, bookings, attempts, grading, re-marks, corrections), `catalog`
and `site` (content, leads).

### API sketch (REST, JSON, `/api/v1`)

| Method and path | Who | Does |
| --- | --- | --- |
| `POST /auth/otp` → `POST /auth/verify` | Anyone | Mobile OTP sign-in. Rate-limited, a 2-minute resend, 5 tries. |
| `POST /students` | Anyone (registration), reception | Create a student, and a parent if under 18 |
| `GET /catalog/courses`, `GET /terms?state=registration`, `GET /classes?term=&course=` | Public | Catalog and live seats |
| `POST /enrollments` `{classId}` | Student, parent, reception | Hold a seat (409 `full`, `conflict`, `duplicate`, `closed`) |
| `POST /enrollments/{id}/waitlist`, `POST /enrollments/{id}/cancel`, `POST /enrollments/{id}/transfer` | By rule | |
| `GET /invoices?student=`, `POST /invoices/{id}/discount`, `POST /invoices/{id}/installments` | Owner, staff | |
| `POST /invoices/{id}/pay` → returns the gateway URL; `POST /payments/callback/{gateway}` | Student; bank | Verify with the bank server-side; idempotent per bank reference; confirms the referenced item |
| `POST /invoices/{id}/payments` | Reception, finance | Desk payment (card reader, cash, transfer) |
| `GET/POST /classes/{id}/attendance/{session}` | Teacher of the class | Absence notifications go through the job queue |
| `PATCH /enrollments/{id}/grade`, `POST /classes/{id}/grades/submit`, `POST /classes/{id}/grades/release` | Teacher; manager | |
| `GET /mock/sessions`, `POST /mock/sessions`, `POST /mock/sessions/{id}/cancel` | Public; manager | |
| `POST /mock/bookings`, `POST /mock/bookings/{id}/slot`, `POST /mock/bookings/{id}/cancel`, `POST /mock/bookings/{id}/no-show` | By rule | |
| `POST /mock/bookings/{id}/attempt` → `GET /mock/attempts/current` | Candidate in the window | Returns the test **without answer keys**; claims the single-session lock |
| `PATCH /mock/attempts/current` `{answers?, writing?, flags?, section?}` | Candidate | Autosave; the server keeps time per section and rejects edits to closed sections |
| `POST /mock/attempts/current/submit` | Candidate (or the server on timeout or grace expiry) | Server-side scoring of Listening and Reading |
| `WS /ws/mock/{attemptId}` | Candidate | Heartbeat: connection state, the grace timer, a takeover by another window |
| `GET /mock/queue`, `POST /mock/bookings/{id}/writing-grade`, `POST /mock/bookings/{id}/speaking-grade` | Examiner | Blind Writing (no name) |
| `POST /mock/release` `{bookingIds}` | Manager, reception | Notifies students |
| `POST /mock/bookings/{id}/remark` | Student | Charges the fee and raises an approval |
| `POST /corrections`, `POST /corrections/{id}/claim`, `POST /corrections/{id}/return` | Student; examiner | |
| `GET/POST /approvals`, `POST /approvals/{id}/decide` | By role | Side effects as in [05-operations.md](05-operations.md) |
| `POST /leads`, `PATCH /leads/{id}` | Public; reception | |
| `GET /reports/*`, `GET /audit`, `GET/PATCH /settings`, `GET/POST /staff` | By role | |

### External services

All of them sit behind one adapter layer, so the school's internal work continues when the internet
or a provider is down, and a provider can be swapped in one place.

| Service | Use |
| --- | --- |
| Bank payment gateway | Cash and installment payments; verified server-side |
| SMS panel | OTP, confirmations, reminders (24 h before a class or mock, installment due), absences, results |
| Live-class service | Online group classes and online Speaking. Alternatively, the operations core's own meetings (LiveKit with TURN). |
| Video hosting | Recorded content, if added later |

### Security notes

- The mock's answer keys and the scoring stay on the server. The candidate's browser receives
  questions only.
- Time is kept by the server: client timers are display only. Section deadlines are enforced on
  every save.
- One active attempt per booking; a new window takes over and locks the old one.
- OTP: 6 digits, 2-minute validity, 5 attempts, rate-limited per mobile and IP. Staff add a password
  and two-step verification.
- Every change to money, grades, results, roles and settings is written to the audit log.
- Personal data (mobile, national ID) is visible only to the roles that need it.
