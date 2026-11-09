# Staff tools: approvals, requests, notifications, audit, reports, settings

These are the school's internal operations: the "Nexus side" of the platform. Code:
`src/pages/admin/Office.tsx`, `src/pages/teacher/Teacher.tsx` (leave) and
`src/components/shell/Sidebar.tsx` (notifications).

## Approvals inbox (صندوق تأییدها)

One inbox for everything that needs a second person. Nobody can approve their own request.

| Kind | Raised by | Who decides | Effect when approved | Effect when rejected |
| --- | --- | --- | --- | --- |
| `refund` (بازپرداخت) | Mock cancellation within the window; reception | Finance or manager | Negative ledger line; invoice `refunded`; student notified with the amount | Nothing changes; the reason is stored |
| `discount` (تخفیف ویژه) | Reception (e.g. a staff child) | Finance or manager | Recorded; reception applies it at the desk | Reason stored |
| `transfer` (انتقال کلاس) | Reception | Manager | Recorded; reception moves the student | Reason stored |
| `leave` (مرخصی استاد) | Teacher → مرخصی | Manager | Leave `approved`; teacher notified | Leave `rejected`; teacher notified with the reason |
| `remark` (بازبینی نمره) | Student, on a released result | Manager | Assigned to a second examiner, who cannot see the first grade | Re-mark `rejected`; student notified with the reason |

Rejecting needs a reason. Every decision stores who decided, when, and the note, and appears in the
audit log.

## Website requests (درخواست‌های سایت)

Every website form creates a lead:

| Form | Kind | Extra fields |
| --- | --- | --- |
| تماس با ما | `contact` | — |
| دوره‌های سازمانی | `corporate` | Company (required), number of people, location |
| TTC | `ttc` | Language level or certificate, teaching experience |
| کلاس خصوصی | `private` | Goal, preferred days and times |
| تعیین سطح حضوری (kids) | `placement` | — |

- Reception gets a notification for each new request.
- Each request has a status (`new` → `contacted` → `converted` or `lost`) and a timeline of
  follow-up notes with author and time.
- New requests are listed first and counted on the sidebar badge and the dashboard.

## Notifications

A bell icon in every panel shows the newest notifications. A dot marks unread ones; closing the
list marks them read; clicking one opens the related page. In production each one also goes out by
SMS, through the job queue. Events and who receives them:

| Event | Student | Parent | Teacher | Reception | Finance | Manager |
| --- | --- | --- | --- | --- | --- | --- |
| Enrollment confirmed | ✓ | ✓ | | | | |
| Seat offered from the waitlist | ✓ | | | | | |
| Joined the waitlist | ✓ | | | | | |
| Class cancelled / transferred | ✓ | | | | | |
| Absence recorded | | ✓ | | at the alert limit | | |
| New homework | ✓ | | | | | |
| Report card published | ✓ | ✓ | | | | |
| Grades sent for approval | | | | | | ✓ |
| Mock booking confirmed | ✓ | | | | | |
| Mock session cancelled | ✓ | | | | | |
| New Writing to mark / re-mark assigned | | | ✓ | | | |
| Mock result released / re-mark done | ✓ | | | | | |
| Correction feedback ready | ✓ | | | | | |
| Refund requested | | | | | ✓ | |
| Re-mark changed the band (refund fee) | | | | | ✓ | |
| Leave decided | | | ✓ | | | |
| Leave requested / re-mark requested | | | | | | ✓ |
| New website request | | | | ✓ | | |

## Audit log (لاگ ممیزی, manager only)

Append-only: time, user, action and target. It records enrollments and cancellations at the desk,
transfers, desk payments, grade submission and release, mock result release, session and class
creation and cancellation, discount codes, approval decisions, user and role changes, settings
changes and examiner grades. In production it lives in the audit store and cannot be edited.

## Reports (manager, finance)

- average band per skill and overall across released mocks
- participants per mock session
- fill rate of next term's classes against capacity
- students with the most absences

Export to Excel or PDF uses the report builder of the operations core.

## Users and roles (manager)

- Invite by name, mobile and role. The user is `invited` until their first sign-in.
- Change a role inline; disable or re-enable an account. A manager cannot change their own role.
- Roles are explained in [06-roles-permissions.md](06-roles-permissions.md).

## Leave (teacher → مرخصی)

The teacher chooses a start date, length and reason. The request becomes an approval of kind
`leave`. The teacher sees the status of their requests. The manager arranges makeup sessions; in
production these come from the class calendar.

## Settings (manager)

- **Mock exam:** see [02-ielts-mock.md § 11](02-ielts-mock.md#11-settings-admin--تنظیمات--آزمون-ماک).
- **Class grading:** component weights (they must total 100 before saving) and the pass mark.
- **Enrollment and payment:** seat-hold minutes, minimum amount for installments, absence alert
  threshold.

## Dashboard (all staff roles)

- **Figures:** money received in 30 days, active students this term, upcoming mocks with confirmed
  bookings, next-term enrollments.
- **Waiting for action:** results ready to release, approvals, unassigned corrections, new requests,
  overdue invoices, classes whose grades await approval.
- **Charts:** money received by source, distribution of overall bands, next-term enrollments by
  course.
