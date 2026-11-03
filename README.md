# KLS

The system plan for KLS, an educational institute's platform with two parts:

1. **Management side** (پنل اداری): for staff to run terms, courses, class scheduling,
   enrollment, tuition, payroll and daily teamwork.
2. **Student side** (سایت و پورتال دانش‌آموز): the public site and the student and parent
   portal for online registration and payment, live classes, recorded courses, resources,
   exams, report cards and the book shop.

**[docs/system-map.html](docs/system-map.html)** is the full map, in Persian. It is meant to be
shown outside the team, so it names no internal project. Each module is tagged ready (آماده),
ready with changes (با تغییر) or new (ساخت تازه).

## Where the ready parts come from (internal)

| Part of the map                                                                                                                                                                                                        | Source                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Online learning and sales: recorded courses, live classes, exams and question bank, book store, packages, discount codes, cash and installment payments, teacher wallets, homepage and blog, comments, support tickets | Greenoly admin panel (Figma: Greenoly Admin Panel) |
| Institute operations: staff, roles, audit log, attendance, leave, payroll, finance ledger, expenses, approvals, chat, meetings, docs, tasks, reports                                                                   | [nexus](https://github.com/moeamani/nexus)         |
| Look and feel, mobile + OTP sign-in, exam engine rules                                                                                                                                                                 | [sakoo](https://github.com/moeamani/sakoo)         |
| Terms, levels, rooms, in-person enrollment, class attendance, assignments, report cards, parent accounts                                                                                                               | New                                                |
