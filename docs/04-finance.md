# Finance

Code: `src/features/enroll/Payment.tsx`, `src/features/enroll/Records.tsx`,
`src/pages/admin/Office.tsx` (`AdminFinancePage`), store actions `payInvoice`, `applyDiscount`,
`setInstallments` and `decideApproval`.

## Invoices

Every purchase creates one invoice with `ref.kind`:

| Kind | Created by | First payment does |
| --- | --- | --- |
| `enrollment` | Seat hold or a waitlist offer | Enrollment `held` → `confirmed` |
| `mock` | Mock booking hold | Booking `held` → `confirmed` + Speaking slot |
| `correction` | Correction text | Correction `held` → `submitted` |
| `book` | Buying a book | Book stock − 1 (picked up at reception) |
| `remark` | Re-mark request | Paid at once; the re-mark request goes to approvals |

Fields: number (`KLS-####`), student, title, items, optional discount, total, installments, payments
and status (`open`, `cancelled`, `refunded`). The paid, partial, unpaid and overdue states are derived
([07-states.md](07-states.md#invoice-derived-from-payments)).

## Paying

The **payment dialog** is the same everywhere:

- It shows the items, discount, amount already paid and **amount payable now**: the next due
  installment or the whole balance.
- **Discount code**, before any payment. It is refused when:
  - the code is unknown or switched off
  - it has expired
  - its usage limit is reached
  - it is for another product (`scope`: all, mock, courses, correction)
  - the invoice already has a code
- **Installments**, for enrollments at or above `installmentMin`: one payment, or two, with 55%
  now and the rest in 30 days.
- **Student:** goes to the bank gateway. In the prototype a simulated gateway offers success,
  failure and cancel. A failure charges nothing and the hold continues.
- **Staff:** record a card-reader, cash, transfer or online-link payment.
- If the related hold has expired, payment is refused with "book again".
- Production must confirm a payment only with the bank's server-side verify call. Each bank
  reference is recorded once, so a repeated callback is idempotent.

## Installments and overdue

The next uncovered installment is the "next due". When its date passes, the invoice is `overdue`:

- red on the student and parent pages
- counted on the admin dashboard and the finance header

Paying always covers the oldest installment first.

## Refunds

- **School cancels a session or class:** automatic 100% refund lines and notifications.
- **Student cancels a mock ≥ `cancelHours` before:** a refund request for `refundPercent` goes to the
  approvals inbox. Finance or the manager approves it, a negative `transfer` line is added and the
  invoice becomes `refunded`.
- **Re-mark changes the band:** finance is notified to refund the re-mark fee.

## Discount codes (finance, manager)

Code (4–16 Latin letters or digits), percent or fixed amount, scope, usage limit, expiry, and an
on/off switch. Usage is counted when a code is applied. Expired codes stay listed in red.

## Ledger

Every payment and refund line across all invoices, newest first: time, invoice, student, item,
method, bank or receipt reference, and amount (refunds in red).

## Teacher pay (حق‌التدریس)

Over the last 30 days, per teacher:

- **Teaching:** attendance sheets saved for their classes × `ratePerSession`.
- **Marking:** Writing grades, Speaking grades and returned corrections × 150,000 toman each
  (placeholder rate).

In production, the approved amount goes into the monthly payroll of the operations core, together
with staff salaries.

## Header figures

- received in the last 30 days
- refunded in the last 30 days
- outstanding balance
- number and amount of overdue invoices
