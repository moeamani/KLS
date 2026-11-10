import { ChevronDown, CircleCheckFill, CircleXmarkFill, Flag } from '@gravity-ui/icons';
import { cn } from '@heroui/react';
import type { ChartSpec, Question, QuestionGroup } from '@/types';

// Exam content is English and left-to-right, laid out like a computer-delivered test.
// The same renderers draw the live exam and the read-only answer key on the result report.

export function BarChart({ spec }: { spec: ChartSpec }) {
  const W = 560, H = 300, padL = 40, padB = 46, padT = 30;
  const max = Math.ceil(Math.max(...spec.series.flatMap((s) => s.values)) / 10) * 10;
  const plotW = W - padL - 10, plotH = H - padT - padB;
  const groupW = plotW / spec.categories.length;
  const barW = (groupW * 0.7) / spec.series.length;
  const colors = ['var(--kl-blue-600)', 'var(--kl-stone-400)', 'var(--kl-saffron-500)'];
  const y = (v: number) => padT + plotH - (v / max) * plotH;
  const ticks = Array.from({ length: max / 10 + 1 }, (_, i) => i * 10);
  return (
    <figure className="exam-text rounded-xl border border-border bg-surface p-3">
      <figcaption className="mb-1 text-center text-[13px] font-semibold">{spec.title}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={spec.title} direction="ltr">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - 10} y1={y(t)} y2={y(t)} stroke="var(--kl-stone-100)" />
            <text x={padL - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--kl-stone-500)">{t}</text>
          </g>
        ))}
        {spec.categories.map((cat, ci) => (
          <g key={cat}>
            {spec.series.map((series, si) => {
              const v = series.values[ci];
              const x = padL + ci * groupW + groupW * 0.15 + si * barW;
              return (
                <g key={series.name}>
                  <rect x={x} y={y(v)} width={barW - 3} height={padT + plotH - y(v)} rx="2" fill={colors[si]} />
                  <text x={x + (barW - 3) / 2} y={y(v) - 4} textAnchor="middle" fontSize="10" fill="var(--kl-stone-700)">{v}</text>
                </g>
              );
            })}
            <text x={padL + ci * groupW + groupW / 2} y={H - padB + 16} textAnchor="middle" fontSize="11" fill="var(--kl-stone-700)">{cat}</text>
          </g>
        ))}
        {spec.series.map((series, si) => (
          <g key={series.name} transform={`translate(${W / 2 - 60 + si * 70}, ${H - 14})`}>
            <rect width="10" height="10" y="-9" fill={colors[si]} rx="2" />
            <text x="14" fontSize="11" fill="var(--kl-stone-700)">{series.name}</text>
          </g>
        ))}
      </svg>
    </figure>
  );
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
/** Value stored for a matching option: its first token (A, B, iii …). */
export const matchValue = (option: string) => option.trim().split(/\s+/)[0];

type Review = { correct: boolean; answer: string };

/** Question number: outlined while open, filled once answered. */
export function NumberBadge({ n, answered, className }: { n: number; answered?: boolean; className?: string }) {
  return (
    <span className={cn('inline-grid h-7 min-w-7 shrink-0 place-items-center rounded-lg px-1 text-[13px] font-semibold tabular transition-colors duration-200', answered ? 'bg-accent text-white' : 'bg-surface text-ink-2 ring-1 ring-line-strong ring-inset', className)}>
      {n}
    </span>
  );
}

function ReviewNote({ review }: { review?: Review }) {
  if (!review) return null;
  return (
    <div className={cn('mt-1.5 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold', review.correct ? 'bg-success-soft text-success-soft-foreground' : 'bg-danger-soft text-danger')}>
      {review.correct ? <CircleCheckFill className="size-3.5" /> : <CircleXmarkFill className="size-3.5" />}
      {review.correct ? 'Correct' : `Answer: ${review.answer}`}
    </div>
  );
}

function FlagButton({ n, flagged, onFlag }: { n: number; flagged?: boolean; onFlag?: () => void }) {
  if (!onFlag) return null;
  return (
    <button
      type="button"
      onClick={onFlag}
      aria-pressed={flagged}
      aria-label={`Flag question ${n} for review`}
      title={flagged ? 'Flagged for review' : 'Flag for review'}
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus',
        flagged ? 'bg-warning-soft text-warning-soft-foreground ring-1 ring-[var(--kl-saffron-200)] ring-inset' : 'text-ink-3 opacity-60 hover:bg-default hover:opacity-100 group-hover/q:opacity-100',
      )}
    >
      <Flag className="size-3.5" />
    </button>
  );
}

export function QuestionView({ q, group, value, onChange, flagged, onFlag, readOnly, review }: {
  q: Question;
  group: QuestionGroup;
  value: string;
  onChange: (value: string) => void;
  flagged?: boolean;
  onFlag?: () => void;
  readOnly?: boolean;
  review?: Review;
}) {
  const answered = Boolean(value.trim());
  const row = cn(
    'group/q relative -mx-2 flex gap-3 rounded-xl px-2 py-2 scroll-mt-28 transition-colors duration-200',
    flagged && 'bg-[var(--kl-saffron-50)] shadow-[inset_3px_0_0_var(--kl-saffron-500)]',
  );

  if (q.type === 'gap') {
    const [before, after = ''] = q.prompt.split('________');
    return (
      <div id={`q-${q.id}`} className={cn(row, 'items-start')}>
        <NumberBadge n={q.n} answered={answered} className="mt-0.5" />
        <div className="min-w-0 flex-1 text-[15px] leading-9">
          {before}
          <input
            aria-label={`Question ${q.n}`}
            className={cn('gap-input', answered && 'is-filled', review && (review.correct ? 'is-correct' : 'is-wrong'))}
            value={value}
            readOnly={readOnly}
            placeholder={readOnly ? '' : String(q.n)}
            onChange={(e) => onChange(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          {after}
          <div><ReviewNote review={review} /></div>
        </div>
        <FlagButton n={q.n} flagged={flagged} onFlag={onFlag} />
      </div>
    );
  }

  if (q.type === 'match') {
    return (
      <div id={`q-${q.id}`} className={cn(row, 'items-center')}>
        <NumberBadge n={q.n} answered={answered} />
        <div className="min-w-0 flex-1 text-[15px] leading-7">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="min-w-0">{q.prompt}</span>
            <span className="relative inline-flex">
              <select
                aria-label={`Question ${q.n}`}
                value={value}
                disabled={readOnly}
                onChange={(e) => onChange(e.target.value)}
                className={cn(
                  'h-9 min-w-[5.5rem] appearance-none rounded-lg border bg-surface ps-3 pe-8 text-[14px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-100',
                  answered ? 'border-accent bg-[var(--kl-blue-50)] text-accent' : 'border-line-strong text-ink-2 hover:border-accent/60',
                  review && (review.correct ? 'border-success bg-success-soft text-success-soft-foreground' : 'border-danger bg-danger-soft text-danger'),
                )}
              >
                <option value="">Choose</option>
                {(group.matchOptions ?? []).map((option) => <option key={option} value={matchValue(option)}>{matchValue(option)}</option>)}
              </select>
              <ChevronDown aria-hidden className="pointer-events-none absolute end-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-3" />
            </span>
          </div>
          <ReviewNote review={review} />
        </div>
        <FlagButton n={q.n} flagged={flagged} onFlag={onFlag} />
      </div>
    );
  }

  const options = q.options ?? [];
  const lettered = q.type === 'mcq';
  const optionState = (v: string) => {
    const checked = value === v;
    if (review) {
      if (review.answer === v || (!lettered && review.answer.toLowerCase() === v.toLowerCase())) return 'correct';
      if (checked) return 'wrong';
      return 'idle';
    }
    return checked ? 'checked' : 'idle';
  };

  return (
    <div id={`q-${q.id}`} role="radiogroup" aria-labelledby={`q-${q.id}-label`} className={cn(row, 'items-start')}>
      <NumberBadge n={q.n} answered={answered} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <p id={`q-${q.id}-label`} className="mb-2.5 text-[15px] leading-7"><span className="sr-only">Question {q.n}. </span>{q.prompt}</p>
        {lettered ? (
          <div className="grid gap-2">
            {options.map((option, i) => {
              const v = LETTERS[i];
              const st = optionState(v);
              return (
                <label
                  key={option}
                  className={cn(
                    'group/opt flex items-start gap-3 rounded-xl border px-3.5 py-2.5 text-[14.5px] leading-6 transition-[border-color,background-color,box-shadow] duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus',
                    readOnly ? 'cursor-default' : 'cursor-pointer',
                    st === 'checked' && 'border-accent bg-[var(--kl-blue-50)] shadow-[0_0_0_1px_var(--accent)]',
                    st === 'correct' && 'border-success bg-success-soft',
                    st === 'wrong' && 'border-danger bg-danger-soft',
                    st === 'idle' && 'border-border bg-surface hover:border-line-strong hover:bg-surface-secondary',
                  )}
                >
                  <input type="radio" name={q.id} value={v} checked={value === v} disabled={readOnly} onChange={() => onChange(v)} className="sr-only" />
                  <span
                    aria-hidden
                    className={cn(
                      'mt-px grid size-6 shrink-0 place-items-center rounded-full border text-[12px] font-bold transition-colors duration-200',
                      st === 'checked' ? 'border-accent bg-accent text-white' : st === 'correct' ? 'border-success bg-success text-white' : st === 'wrong' ? 'border-danger bg-danger text-white' : 'border-line-strong text-ink-2 group-hover/opt:border-accent/60',
                    )}
                  >
                    {v}
                  </span>
                  <span className="min-w-0 flex-1">{option}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="inline-flex max-w-full flex-wrap gap-1 rounded-xl bg-surface-secondary p-1 ring-1 ring-border ring-inset">
            {options.map((option) => {
              const st = optionState(option);
              return (
                <label
                  key={option}
                  className={cn(
                    'rounded-lg px-3.5 py-1.5 text-[12.5px] font-bold tracking-wide transition-[background-color,color,box-shadow] duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus',
                    readOnly ? 'cursor-default' : 'cursor-pointer',
                    st === 'checked' && 'bg-accent text-white shadow-[0_1px_2px_rgb(37_39_122/0.3)]',
                    st === 'correct' && 'bg-success text-white',
                    st === 'wrong' && 'bg-danger text-white',
                    st === 'idle' && 'text-ink-2 hover:bg-surface hover:text-foreground',
                  )}
                >
                  <input type="radio" name={q.id} value={option} checked={value === option} disabled={readOnly} onChange={() => onChange(option)} className="sr-only" />
                  {option}
                </label>
              );
            })}
          </div>
        )}
        <div><ReviewNote review={review} /></div>
      </div>
      <FlagButton n={q.n} flagged={flagged} onFlag={onFlag} />
    </div>
  );
}

export function GroupView({ group, answers, onAnswer, flags, onFlag, readOnly, review }: {
  group: QuestionGroup;
  answers: Record<string, string>;
  onAnswer: (id: string, value: string) => void;
  flags?: string[];
  onFlag?: (id: string) => void;
  readOnly?: boolean;
  review?: (q: Question) => Review;
}) {
  const first = group.questions[0]?.n;
  const last = group.questions[group.questions.length - 1]?.n;
  const answered = group.questions.filter((q) => answers[q.id]?.trim()).length;
  const longOptions = group.matchOptions && group.matchOptions[0].length > 2;
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface">
      <header className="border-b border-separator bg-surface-secondary/60 px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-bold tracking-wide text-accent">Questions {first}{last !== first ? `–${last}` : ''}</span>
          {!readOnly ? <span className="text-[12px] text-muted tabular">{answered}/{group.questions.length} answered</span> : null}
        </div>
        <p className="mt-0.5 text-[14px] leading-6 text-ink-2">{group.instructions}</p>
      </header>
      {longOptions ? (
        <div className="mx-4 mt-4 grid gap-1 rounded-xl border border-dashed border-line-strong px-3.5 py-2.5 text-[14px] leading-7 sm:mx-5">
          {group.matchOptions!.map((option) => {
            const [key, ...rest] = option.trim().split(/\s+/);
            return <div key={option}><b className="me-2 inline-block min-w-6 text-accent">{key}</b>{rest.join(' ')}</div>;
          })}
        </div>
      ) : null}
      <div className="grid gap-1.5 px-4 py-3 sm:px-5 sm:py-4">
        {group.questions.map((q) => (
          <QuestionView key={q.id} q={q} group={group} value={answers[q.id] ?? ''} onChange={(v) => onAnswer(q.id, v)} flagged={flags?.includes(q.id)} onFlag={onFlag ? () => onFlag(q.id) : undefined} readOnly={readOnly} review={review?.(q)} />
        ))}
      </div>
    </section>
  );
}

/** Passage text; paragraphs that start with a capital letter label (A, B …) get it set apart. */
export function Paragraphs({ text }: { text: string }) {
  const paragraphs = text.split(/\n\n+/);
  const labelled = paragraphs.length > 1 && paragraphs.every((p) => /^[A-H]\s/.test(p));
  return (
    <>
      {paragraphs.map((p, i) => labelled ? (
        <p key={i} className="flex gap-3 whitespace-pre-line">
          <b className="mt-1 grid size-6 shrink-0 place-items-center rounded-md bg-accent-soft text-[12px] text-accent">{p[0]}</b>
          <span className="min-w-0">{p.slice(2)}</span>
        </p>
      ) : <p key={i} className="whitespace-pre-line">{p}</p>)}
    </>
  );
}
