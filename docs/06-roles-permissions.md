# Roles and permissions

There are four panels and three staff roles. In the prototype, the admin menu is filtered by role
(`roles` in `src/components/shell/nav.ts`). In production the server enforces every rule with one
`can(actor, action, resource)` function, as in the operations core; the UI only hides what the
server would refuse anyway.

| Panel | Who | Signs in with |
| --- | --- | --- |
| پنل زبان‌آموز `/portal` | Students and IELTS candidates | Mobile + one-time code. New students register on the spot. |
| پنل والدین `/parent` | Parents of students under 18 | Mobile + one-time code |
| پنل استاد `/teacher` | Teachers and examiners | Mobile + one-time code |
| پنل مدیریت `/admin` | مدیر, پذیرش و آموزش, امور مالی | Mobile + one-time code. Production adds a password and two-step verification for staff. |

## Staff roles

| Area | مدیر (manager) | پذیرش و آموزش (reception) | امور مالی (finance) |
| --- | :---: | :---: | :---: |
| Dashboard | ✓ | ✓ | ✓ |
| Mock sessions: create, cancel | ✓ | view | |
| Bookings and results: view | ✓ | ✓ | ✓ |
| Release results, mark no-show, reassign examiner | ✓ | ✓ | |
| Test bank | ✓ | | |
| Correction queue: assign | ✓ | ✓ | |
| Terms and classes: create, cancel | ✓ | view | |
| Desk enrollment, transfer, cancellation | ✓ | ✓ | |
| Approve and publish report cards | ✓ | | |
| Students | ✓ | ✓ | ✓ |
| Teachers (load, rates) | ✓ | view | |
| Invoices and desk payments | ✓ | ✓ | ✓ |
| Ledger, discount codes, teacher pay | ✓ | | ✓ |
| Approvals: refund, discount | ✓ | raise | ✓ |
| Approvals: transfer, leave, re-mark | ✓ | raise | |
| Website requests | ✓ | ✓ | |
| Reports | ✓ | | ✓ |
| Audit log, users and roles, settings | ✓ | | |

## Teacher

- Their own classes only: roster, attendance, grades (until sent), homework.
- Their own marking: Writing assigned to them, Speaking slots that are theirs, re-marks assigned to
  them, corrections they took or the shared pool.
- Candidates are anonymous in Writing marking; Speaking shows the name, since it is face to face.
- Their own leave requests.

## Student

- Only their own records: classes, attendance, grades (final mark after release), bookings,
  results (Writing and Speaking after release), corrections, invoices and profile.
- Can book, pay, cancel within the rules, request one re-mark per result, take the placement test
  and buy books.

## Parent

- Read-only view of their children: classes, attendance, homework, released report cards.
- Can enroll their children and pay their invoices.

## Data rules

- Teacher pay rates and payroll amounts are visible to finance and the manager only.
- Audit entries are visible to the manager only.
- A student's mobile is shown to staff; to teachers only on the class roster.
- Nobody approves their own request (checked by name in the prototype, by user id in production).
