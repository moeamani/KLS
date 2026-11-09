# States

Every entity has one status vocabulary, shared by all panels (`src/data/status.ts`). The colours mean
the same thing everywhere:

| Colour | Meaning |
| --- | --- |
| Gray | Waiting on the student, or nothing to do |
| Blue | In progress |
| Amber | Someone at the school has to act |
| Green / red | Final |

Some states are **derived**: they are computed from time and never stored, so they cannot drift.
For example, an expired hold or an overdue invoice.

---

## Mock booking

| State | Label (staff / student) | How it is entered | Exits |
| --- | --- | --- | --- |
| `held` | در انتظار پرداخت | `holdBooking` | `confirmed` (paid), `expired` (time), `cancelled` |
| `expired` *(derived)* | منقضی / مهلت پرداخت تمام شد | `held` and `heldUntil` < now | Book again (a new booking) |
| `confirmed` | قطعی / رزرو قطعی | First payment of the invoice | `in_progress`, `cancelled`, `no_show` |
| `in_progress` | در حال آزمون / آزمون نیمه‌تمام | Candidate starts the written test | `awaiting_grading` |
| `awaiting_grading` | در انتظار تصحیح / در حال تصحیح | Submit, timeout or connection end | `graded` |
| `graded` | آماده انتشار / در حال تصحیح | Writing and Speaking both scored (or Speaking no-show) | `released` |
| `released` | نتیجه منتشر شد / نتیجه آماده است | Manager or reception releases, or auto-release | Re-mark (does not change the status) |
| `cancelled` | لغو شده | Student, reception, or the session is cancelled | — |
| `no_show` | غایب / غیبت در آزمون | Reception marks absence after the start | — |

### Re-mark (on a released booking)

`requested` → (`approved` → `done`) or `rejected`. Only one re-mark per booking, and the second
examiner is never the original one.

### Mock session (derived)

`open` → `full` ⇄ `open` (seats free up) → `closed` (booking deadline) → `today` (start to +8 h) →
`done`. `cancelled` can happen from any state before the start.

### Exam session (in the browser, during the written test)

`intro` → `running` ⇄ `locked` (another window) → `done`. A reload leads to `resume` → `running`.

Inside `running`:

- Listening → *between* → Reading → *between* → Writing → submit.
- Connection: `online` → `offline` (grace countdown) → `reconnecting` → `online`. If the grace runs
  out, the test is submitted.

## Correction

`held` (unpaid) → `submitted` (paid, in the pool) → `in_review` (examiner) → `returned`.

## Enrollment

| State | Label | How it is entered | Exits |
| --- | --- | --- | --- |
| `held` | در انتظار پرداخت | Online, parent or desk hold (15 min), or a waitlist offer (24 h) | `confirmed`, `expired`, `cancelled` |
| `expired` *(derived)* | منقضی | Hold not paid in time | — |
| `waitlisted` | در لیست انتظار | Joined a full class | `held` (offer when a seat frees), `transferred`, `cancelled` |
| `confirmed` | ثبت‌نام قطعی | First payment | `completed`, `cancelled`, `transferred` |
| `transferred` | منتقل شد | Moved to another class (a new `confirmed` enrollment is created there) | — |
| `cancelled` | انصراف | Student before term start, reception, or the class is cancelled | — |
| `completed` | پایان دوره | Term finished | — |

## Class (derived from its term and seats)

| State | Rule |
| --- | --- |
| `cancelled` | Cancelled by the manager |
| `finished` | After the term end |
| `open` | Registration window is open and seats are free |
| `full` | Registration window is open and no seats are free |
| `running` | Term started and registration is closed |
| `upcoming` | Before the registration window |

## Term (derived)

`upcoming` → `registration` (between `regOpen` and `regClose`) → `running` (from `start`) →
`finished` (after `end`). Registration may stay open in the first days of the term.

## Grade sheet (per enrollment)

`draft` (teacher edits; saved automatically) → `submitted` (teacher sends the whole class; locked) →
`released` (manager approves; student and parent are notified).

## Attendance mark

`present`, `late`, `absent`, `excused`. Absences are counted per class. At `absenceAlert` (default 3),
reception and the parent are warned.

## Invoice (derived from payments)

| State | Rule |
| --- | --- |
| `cancelled` | Voided (an expired hold, or a cancelled unpaid enrollment or booking) |
| `refunded` | Refund line added after approval |
| `paid` | Payments ≥ total |
| `overdue` | The next unpaid installment's due date has passed |
| `partial` | Some payment made |
| `unpaid` | No payment |

## Approval

`pending` → `approved` or `rejected`, with who decided, when, and a note (a reason is required to
reject). Side effects by kind are described in [05-operations.md](05-operations.md#approvals-inbox).

## Lead (website request)

`new` → `contacted` → `converted` or `lost`. Notes keep the follow-up history.

## Staff user

`invited` → `active` (first sign-in) ⇄ `disabled`.

## Leave request

`pending` → `approved` or `rejected`. It is mirrored by an approval of kind `leave`.
