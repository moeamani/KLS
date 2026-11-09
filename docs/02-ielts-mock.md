# IELTS mock exam

The mock exam is the school's most important product. It has three parts that share one
scoring engine:

1. **Mock exam** (آزمون ماک): a full four-skill test on a scheduled date.
2. **Correction service** (خدمات تصحیح و بازخورد): a student sends one Writing task and an
   examiner returns band scores and feedback.
3. **Re-mark** (بازبینی نمره): a second examiner re-scores Writing or Speaking after a released result.

Code: `src/features/mock/*`, `src/pages/student/Mock.tsx`, `src/pages/teacher/Grading.tsx`,
`src/pages/admin/Mock.tsx`, `src/lib/ielts.ts`, `src/data/mockTests.ts`.

> The mock is practice. Every result page and the footer say it is not an official IELTS result.
> "IELTS" is used descriptively, and no official IELTS branding or report layout is copied.

---

## 1. Sessions (جلسه آزمون)

A session is one date of the written test.

| Field | Meaning |
| --- | --- |
| `title`, `at` | Name and start time of the written test |
| `modules` | `academic`, `general` or both |
| `deliveries` | `center` (computer room at the school) and/or `online` (from home) |
| `testIds` | The published test form used for each module |
| `capacity`, `price` | Seats and price in toman |
| `regClose` | Booking closes at this time (default: 2 days before) |
| `slots[]` | Speaking slots: `{ at, examinerId, bookingId? }`, 15 minutes each, starting 4 hours after the written test |
| `cancelled`, `note` | Set when the school cancels the session |

### Session states (derived, never stored)

| State | Rule | Shown as |
| --- | --- | --- |
| `cancelled` | `cancelled = true` | لغو شد |
| `done` | now > start + 8 h | برگزار شد |
| `today` | start ≤ now ≤ start + 8 h | در حال برگزاری |
| `closed` | now > `regClose` | ثبت‌نام بسته |
| `full` | seats taken ≥ capacity | تکمیل ظرفیت |
| `open` | otherwise | ثبت‌نام باز |

A seat is taken by every booking that is not cancelled, expired or a no-show
(`bookingTakesSeat`). An unpaid hold therefore takes a seat until it expires.

### Creating a session (manager)

Admin → جلسات آزمون ماک → جلسه جدید: title, date, start time, capacity, price, modules,
deliveries, number of speaking slots and the examiners who take them. Slots are spread round-robin
across the chosen examiners. Bookings open immediately.

### Cancelling a session (manager, before it starts)

All held and confirmed bookings become `cancelled`. Every paid invoice gets a 100% refund line in
the ledger, and every student gets a notification. A reason is required, and it is shown on the
public session card.

---

## 2. Booking (رزرو)

### Booking flow (student)

1. Choose a session that is `open`, then a module and a delivery.
2. **Hold.** `holdBooking` checks, in this order:
   - the session is not cancelled
   - booking has not closed
   - a seat is free
   - the student has no live booking for this session

   It then creates the booking as `held`, with `heldUntil = now + seatHoldMin` (default 15 min), and
   an unpaid invoice.
3. **Pay** in the payment dialog (§ Finance). The first successful payment confirms the booking,
   assigns the first free speaking slot and notifies the student.
4. If the hold expires unpaid, the booking reads as `expired`, its seat is free again and the
   invoice is voided by the next sweep. Paying an expired hold is refused with "book again".

### Booking states

See [07-states.md](07-states.md#mock-booking). Summary:

```
held ──pay──▶ confirmed ──start──▶ in_progress ──submit──▶ awaiting_grading ──W+S scored──▶ graded ──release──▶ released
  │               │                                                                                          (auto-release optional)
  │               ├──cancel──▶ cancelled (refund request if ≥ cancelHours before)
  │               └──absent──▶ no_show
  └──time out──▶ expired (derived)
```

### Changing the Speaking slot

A confirmed student can switch to any free slot of the same session until 24 hours before their
current slot.

### Cancelling (student or reception)

- **Unpaid hold:** cancelled, and the invoice is voided.
- **Paid, at least `cancelHours` (48 h) before the test:** cancelled, and a refund request for
  `refundPercent` (80%) of the price goes to the approvals inbox. Finance or the manager approves it.
- **Paid, less than 48 h before:** cancelled with no refund. The dialog says so before confirming.

### No-show

After the session starts, reception can mark a confirmed booking as absent (`no_show`). A Speaking
no-show is separate (§ 5).

---

## 3. The exam engine (موتور آزمون)

`useMockExam` (in `src/features/mock/useMockExam.ts`) runs the written test: Listening, then
Reading, then Writing.

### When the test is available

- **Online delivery:** from the session start for 8 hours (`examWindow`).
- **Center delivery:** the same window. Staff seat the candidate at a school computer.
- Before the window opens, the exam page shows when it opens. After it closes, it says the time has
  passed. A booking that is not `confirmed` or `in_progress` cannot open the exam.

### Sections and timing

| Section | Default time | Setting |
| --- | --- | --- |
| Listening | 30 min | `mock.listeningMin` |
| Reading | 60 min | `mock.readingMin` |
| Writing | 60 min | `mock.writingMin` |
| Speaking | 11–14 min, separately | Speaking slot |

- Each section has its own countdown. The timer turns amber at 5 minutes and red at 1 minute.
- When a section's time ends, its answers are saved and the candidate sees a "next section" screen.
  The next section's time starts when they open it.
- "پایان بخش" ends a section early, after a confirmation that shows how many questions are
  unanswered. Ending Writing shows a warning if either task is under its word minimum.
- A finished section can never be reopened.
- Ending Writing, or Writing's time running out, submits the test (`submitAttempt`).

### Layout (computer-delivered style)

- Top bar: candidate name, booking code, the three sections, connection state, timer and the end
  button. Part tabs sit below it: Part 1–4 for Listening, Passage 1–3 for Reading, Task 1/2 for
  Writing.
- **Listening:** play button, part context, then the questions. In the prototype the recording is
  read by the browser's English text-to-speech, and each part plays once.
- **Reading:** passage on one side, questions on the other, each scrolling on its own.
- **Writing:** prompt on one side (the Academic Task 1 chart is drawn as an SVG), editor on the other
  with a live word count against the minimum (150 / 250).
- **Navigator** (Listening and Reading): one numbered button per question, filled when answered,
  with a dot when flagged. Clicking one jumps to that question and part.
- Every question can be flagged for review.
- The exam is English and left-to-right; the surrounding chrome stays Persian.

### Question types

| Type | UI | Correct when |
| --- | --- | --- |
| `gap` | Inline text field | The trimmed, lower-cased answer, with any trailing punctuation removed, equals one of `answer[]` (several spellings or forms can be accepted) |
| `mcq` | A/B/C radio list | The chosen letter equals `answer[0]` |
| `tfng` / `ynng` | TRUE/FALSE/NOT GIVEN or YES/NO/NOT GIVEN | The text matches exactly |
| `match` | Select from the group's options (letters A–E or headings i–vi) | The first token of the chosen option matches |

### Saving, reloads and connection loss

The live exam state is stored under its own key (`kls.mockExam`), as the server would hold it in
production. It contains the section, time left per section, answers, writing, flags, the parts
already played, an event log, the owning tab and `lastTick`.

| Situation | Behaviour |
| --- | --- |
| Every answer or keystroke | Saved at once |
| Network lost (`offline` event, or the prototype switch) | A red bar shows the grace countdown (`graceMin`, default 10 min). The timer keeps running (`timerOnDisconnect = run`, like the real test) or pauses (`pause`). |
| Back online within the grace | A "connected" toast; the test continues where it was, and the event is logged |
| Grace runs out | The test is submitted with the answers so far (`endReason = connection`) |
| Reload or closed tab | On return, the time away is deducted (when the timer runs). If away longer than the grace, the test is submitted. Otherwise a resume screen appears. |
| Resume | Uses one of `maxResumes` (default 2). With none left, the test is submitted. |
| Second window (`singleSession`) | Opening the test elsewhere locks the first window ("opened in another window"). Continuing there counts as a resume. |
| Leaving the page | The browser asks for confirmation (`beforeunload`) |

Every event (start, section start/submit/timeout, disconnect, resume, completed) goes into
`attempt.log`, which staff see on the booking page.

### After submission

- Listening and Reading are marked at once (§ 4).
- If `instantLR` is on (the default), the candidate sees both bands straight away.
- Writing goes to the examiner with the fewest unmarked scripts.
- The booking becomes `awaiting_grading`.

---

## 4. Scoring (امتیازدهی)

All rules live in `src/lib/ielts.ts`.

### Listening and Reading

1. Count correct answers (raw score).
2. A short form is scaled to 40: `round(raw × 40 / total)`. The demo form has 20 questions per
   section; a real form has 40, so no scaling happens.
3. Convert with the published approximate tables:

| Band | Listening (raw/40) | Academic Reading | General Training Reading |
| --- | --- | --- | --- |
| 9 | 39–40 | 39–40 | 40 |
| 8.5 | 37–38 | 37–38 | 39 |
| 8 | 35–36 | 35–36 | 37–38 |
| 7.5 | 32–34 | 33–34 | 36 |
| 7 | 30–31 | 30–32 | 34–35 |
| 6.5 | 26–29 | 27–29 | 32–33 |
| 6 | 23–25 | 23–26 | 30–31 |
| 5.5 | 18–22 | 19–22 | 27–29 |
| 5 | 16–17 | 15–18 | 23–26 |
| 4.5 | 13–15 | 13–14 | 19–22 |
| 4 | 10–12 | 10–12 | 15–18 |
| 3.5 | 8–9 | 8–9 | 12–14 |
| 3 | 6–7 | 6–7 | 9–11 |
| 2.5 | 4–5 | 4–5 | 6–8 |

### Writing and Speaking

- Each criterion gets a whole band from 0 to 9.
  - Writing: Task Achievement (Task 1) or Task Response (Task 2), Coherence & Cohesion, Lexical
    Resource, Grammatical Range & Accuracy.
  - Speaking: Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, Pronunciation.
- **Task band** = mean of its four criteria, rounded **down** to the half band.
- **Writing band** = (Task 1 + 2 × Task 2) / 3, rounded to the nearest half band (overall rule).
- **Speaking band** = mean of the four criteria, rounded down to the half band.
- IELTS does not publish its exact Writing formula. This is KLS's documented rule and can be changed
  in one place.

### Overall band

Mean of the four skills, rounded so that .25 goes up to .5 and .75 goes up to the next whole band
(`roundOverall`).

Example: 7.5, 6, 6.5, 6.5 → 6.625 → **6.5**.

A Speaking no-show counts as 0.

The CEFR indication is: C2 ≥ 8.5, C1 ≥ 7, B2 ≥ 5.5, B1 ≥ 4, A2 ≥ 3, otherwise A1.

---

## 5. Examiner workflow (teacher panel → صف تصحیح)

| Queue | Contains | Rules |
| --- | --- | --- |
| رایتینگ ماک | Submitted tests where `writingExaminerId` = me and no Writing grade yet | Assigned automatically to the examiner with the lightest load; the manager or reception can reassign from the booking page |
| اسپیکینگ | Bookings whose Speaking slot belongs to me and that have no Speaking grade | Sorted by slot time. Open from the teacher home or the queue. |
| بازبینی | Approved re-marks assigned to me | The first examiner's grade is not shown |
| خدمات تصحیح | Texts I took, plus the shared pool | The pool lists express first, then oldest. Taking one assigns it to me. |

**Writing screen.**
- Shows both prompts (with the chart) and both responses, with word counts. Under-length is
  highlighted.
- The candidate's name is hidden (blind marking).
- 0–9 pickers for each criterion of each task, with a live task band and Writing band.
- An English comment per task is required; an overall Persian summary is optional.

**Speaking screen.**
- Shows the three parts' questions from the form, the four criterion pickers and a required comment.
- "زبان‌آموز حاضر نشد" records a Speaking no-show (band 0).
- If the slot is more than 15 minutes away, a notice asks the examiner to mark after the interview.

When both Writing and Speaking are in (or Speaking is a no-show), the booking becomes `graded`. If
`autoRelease` is on, it becomes `released` straight away.

---

## 6. Release and the result report

- The manager or reception releases from the session page (all `graded` bookings at once) or from
  one booking. Each student gets a notification.
- Before release the student sees Listening and Reading only (if `instantLR`); Writing and Speaking
  show "در حال تصحیح".
- The **result report** (`ResultReport`, used by the student, and by staff before release) contains:
  - overall band, CEFR level, band descriptor, booking code, date and test form
  - four band tiles; Listening and Reading also show raw scores
  - a suggestion: the weakest skill and the matching skills class
  - **Feedback tab:** Writing criteria and comments per task with word counts, and Speaking criteria
    and comment
  - **Question-type analysis tab:** accuracy per question type across Listening and Reading
  - **Answer key tab:** every question with the candidate's answer and the correct one
  - print (print stylesheet), a re-mark request, and "book the next mock"

---

## 7. Re-mark (بازبینی نمره)

1. On a released result without an earlier re-mark, the student picks Writing or Speaking, writes a
   reason of at least 10 characters and pays `remarkFee` (default 600,000 toman).
2. A `remark` request goes to the approvals inbox (`requested`).
3. **Manager rejects:** the re-mark becomes `rejected` and the student sees the reason.
   **Manager approves:** it becomes `approved` and goes to a different examiner (never the original
   one) without the first grade.
4. The second examiner's grade replaces the first. `before` and `after` are stored, and the re-mark
   becomes `done`.
5. If the band changed, finance gets a notification to refund the fee.

---

## 8. Correction service (خدمات تصحیح)

| Step | State | Notes |
| --- | --- | --- |
| Student writes text, chooses task type, normal or express | `held` + invoice | Prompts are prefilled from the test forms and can be edited. At least 50 words. |
| Payment | `submitted` | Appears in the shared pool and the admin queue |
| Examiner takes it, or admin assigns it | `in_review` | |
| Examiner returns 4 criteria and feedback | `returned` | Student notified; band = criteria mean rounded down |

Prices: `correctionPrice` (normal, 3 working days) and `correctionExpressPrice` (24 h). An unpaid
hold older than 24 hours is voided by the sweep.

---

## 9. Test bank (بانک آزمون)

A form has 4 Listening parts, 3 Reading passages (Academic or General Training), Writing Task 1
(chart or letter) and Task 2, and Speaking Parts 1–3. Only `published` forms can be picked for a
session.

The demo contains:

- **Form A** (Academic and General Training): shares Listening, Task 2 and Speaking, as the real test
  does. 20 Listening and 20 Reading questions.
- **Form B**: an empty draft.

All demo content was written for KLS, so no copyright applies. The form editor is a later phase;
the admin page lists forms and previews their structure.

---

## 10. Edge cases covered

- Two people trying for the last seat: the second hold is refused with "full".
- Paying after the hold expired: refused with "book again".
- A discount code that is expired, used up, for another product, or a second code on the same
  invoice: each is refused with its own message.
- A booking for a past or cancelled session: the exam page refuses to open.
- Reload in the middle of a section: time away is deducted and a resume is counted.
- Exam open in two windows: the older one is locked.
- Long disconnect: auto-submit with the answers so far.
- Empty Writing: allowed, with a warning before submit; the examiner sees "No response".
- Speaking no-show: band 0, and the overall is still computed.
- School cancels a session: full refunds and notifications.
- Re-mark: never to the same examiner, and only once per booking.

## 11. Settings (Admin → تنظیمات → آزمون ماک)

Section times, connection grace, timer on disconnect, maximum resumes, one window at a time,
instant Listening and Reading, auto-release, cancellation window and refund percentage, re-mark fee,
and correction prices.
