# KLS

The system plan for KLS, an educational institute's platform with two parts:

1. **Management side** (پنل اداری): for staff to run terms, courses, class scheduling,
   enrollment, tuition, payroll and daily teamwork. Built on the
   [nexus](https://github.com/moeamani/nexus) codebase (Django API, roles, finance, approvals,
   meetings, chat, docs) with new education modules added.
2. **Student side** (سایت و پورتال دانش‌آموز): the public site and the student and parent
   portal for online registration and payment, live classes, recorded courses, resources,
   assignments, report cards and the book shop.

Both parts use one API and one database. The visual design follows
[sakoo](https://github.com/moeamani/sakoo): its tokens, Persian RTL type, OTP sign-in and exam
engine.

**[docs/system-map.html](docs/system-map.html)** is the full map, in Persian: the architecture, the
modules on each side, one term from scheduling to report card, roles and access, what comes from
each repository, the key decisions and the build order.
