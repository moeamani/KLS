# KLS School · خانه زبان کرمانشاه

The platform of KLS School, a language school in Kermanshah. This repository holds an interactive
prototype of the whole system and its full documentation.

- **Public website**, built from the school's site map: general courses (kids, teens, adults,
  private), IELTS (course, skills classes, **mock exam**, correction service), specialized courses
  (TTC, corporate), the term calendar, education system, class formats, resources, contact and about.
- **Student panel:** online enrollment with seat holds, installments and the waitlist; placement
  test; the IELTS mock exam end to end (booking, the timed Listening, Reading and Writing test,
  Speaking slot, results with examiner feedback, re-mark); Writing correction; classes and
  attendance; report cards; payments; books.
- **Parent panel:** each child's attendance, homework, report cards and payments; enrolling
  children.
- **Teacher panel:** attendance, grades, homework, the marking queue (mock Writing, Speaking,
  re-marks, correction service) and leave.
- **Admin panel** (manager, reception, finance):
  - dashboard
  - mock sessions, bookings and result release; test bank; correction queue
  - terms and classes with clash checks; students; enrollments; teachers
  - finance: invoices, ledger, discount codes, teacher pay
  - approvals inbox; website requests; reports; audit log; users and roles; settings

## Run

```bash
npm install
npm run dev        # http://localhost:4173 — use «ابزار نمونه اولیه» to switch roles; the code is 123456
```

`npm run build` writes a static build to `dist/`.

## Documentation

Start at **[docs/README.md](docs/README.md)**. The most important document is
[docs/02-ielts-mock.md](docs/02-ielts-mock.md). Walkthroughs for every role are in
[docs/09-prototype.md](docs/09-prototype.md).

## Where the parts come from (internal)

| Part | Source |
| --- | --- |
| Design language: tokens, type, components, mobile OTP sign-in, exam engine rules | [sakoo](https://github.com/moeamani/sakoo) |
| Staff tools: roles and `can()`, audit log, approvals, leave, finance ledger, payroll, notifications, reports; the recommended production backend | [nexus](https://github.com/moeamani/nexus) |
| Learning-platform patterns: courses, classes, exams, store, packages, discount codes, wallets, support | Greenoly admin panel |
| IELTS mock content, scoring, terms, classes, placement, attendance, report cards, parent accounts | New for KLS |
