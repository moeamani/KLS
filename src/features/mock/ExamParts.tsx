import { Flag } from '@gravity-ui/icons';
import { cn } from '@heroui/react';
import type { ChartSpec, Question, QuestionGroup } from '@/types';

// Exam content is English and left-to-right, laid out like a computer-delivered test.

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
    <figure className="exam-text rounded-lg border border-border bg-surface p-3">
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

function NumberBadge({ n, current }: { n: number; current?: boolean }) {
  return <span className={cn('inline-grid size-7 shrink-0 place-items-center rounded-md border text-[13px] font-bold', current ? 'border-accent bg-accent text-white' : 'border-line-strong bg-surface text-foreground')}>{n}</span>;
}

export function QuestionView({ q, group, value, onChange, flagged, onFlag, readOnly, review }: {
  q: Question;
  group: QuestionGroup;
  value: string;
  onChange: (value: string) => void;
  flagged?: boolean;
  onFlag?: () => void;
  readOnly?: boolean;
  review?: { correct: boolean; answer: string };
}) {
  const flagButton = onFlag ? (
    <button type="button" onClick={onFlag} aria-pressed={flagged} aria-label={`Flag question ${q.n} for review`} className={cn('ms-auto grid size-7 shrink-0 place-items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-focus', flagged ? 'bg-warning-soft text-warning-soft-foreground' : 'text-ink-3 hover:bg-default')}>
      <Flag className="size-3.5" />
    </button>
  ) : null;

  const reviewNote = review ? (
    <div className={cn('mt-1 text-xs', review.correct ? 'text-success-soft-foreground' : 'text-danger')}>
      {review.correct ? '✓ Correct' : `✗ Answer: ${review.answer}`}
    </div>
  ) : null;

  if (q.type === 'gap') {
    const [before, after = ''] = q.prompt.split('________');
    return (
      <div id={`q-${q.id}`} className="flex items-start gap-3 scroll-mt-24">
        <NumberBadge n={q.n} />
        <div className="min-w-0 flex-1 pt-0.5 text-[15px] leading-8">
          {before}
          <input aria-label={`Question ${q.n}`} className="gap-input" value={value} readOnly={readOnly} onChange={(e) => onChange(e.target.value)} autoComplete="off" spellCheck={false} />
          {after}
          {reviewNote}
        </div>
        {flagButton}
      </div>
    );
  }

  if (q.type === 'match') {
    return (
      <div id={`q-${q.id}`} className="flex items-center gap-3 scroll-mt-24">
        <NumberBadge n={q.n} />
        <div className="min-w-0 flex-1 text-[15px]">
          <div className="flex flex-wrap items-center gap-3">
            <span>{q.prompt}</span>
            <select aria-label={`Question ${q.n}`} value={value} disabled={readOnly} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-line-strong bg-surface px-2 py-1 text-[14px] outline-none focus:border-focus">
              <option value="">—</option>
              {(group.matchOptions ?? []).map((option) => <option key={option} value={matchValue(option)}>{matchValue(option)}</option>)}
            </select>
          </div>
          {reviewNote}
        </div>
        {flagButton}
      </div>
    );
  }

  const options = q.options ?? [];
  const isLettered = q.type === 'mcq';
  return (
    <fieldset id={`q-${q.id}`} className="flex items-start gap-3 scroll-mt-24">
      <NumberBadge n={q.n} />
      <div className="min-w-0 flex-1">
        <legend className="mb-2 text-[15px] leading-7">{q.prompt}</legend>
        <div className={cn('grid gap-1.5', !isLettered && 'sm:flex sm:flex-wrap sm:gap-2')}>
          {options.map((option, i) => {
            const v = isLettered ? LETTERS[i] : option;
            const checked = value === v;
            return (
              <label key={option} className={cn('flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-1.5 text-[14.5px] transition-colors', checked ? 'border-accent bg-accent-soft' : 'border-border hover:bg-default', readOnly && 'cursor-default')}>
                <input type="radio" name={q.id} value={v} checked={checked} disabled={readOnly} onChange={() => onChange(v)} className="accent-[var(--accent)]" />
                {isLettered ? <b className="w-4">{v}</b> : null}
                <span>{option}</span>
              </label>
            );
          })}
        </div>
        {reviewNote}
      </div>
      {flagButton}
    </fieldset>
  );
}

export function GroupView({ group, answers, onAnswer, flags, onFlag, readOnly, review }: {
  group: QuestionGroup;
  answers: Record<string, string>;
  onAnswer: (id: string, value: string) => void;
  flags?: string[];
  onFlag?: (id: string) => void;
  readOnly?: boolean;
  review?: (q: Question) => { correct: boolean; answer: string };
}) {
  const first = group.questions[0]?.n;
  const last = group.questions[group.questions.length - 1]?.n;
  return (
    <section className="grid gap-4">
      <div>
        <div className="text-[13px] font-bold">Questions {first}{last !== first ? `–${last}` : ''}</div>
        <p className="text-[14px] italic text-ink-2">{group.instructions}</p>
      </div>
      {group.matchOptions && group.matchOptions[0].length > 2 ? (
        <div className="rounded-lg border border-border bg-surface-secondary p-3 text-[14px] leading-7">
          {group.matchOptions.map((option) => <div key={option}>{option}</div>)}
        </div>
      ) : null}
      {group.questions.map((q) => (
        <QuestionView key={q.id} q={q} group={group} value={answers[q.id] ?? ''} onChange={(v) => onAnswer(q.id, v)} flagged={flags?.includes(q.id)} onFlag={onFlag ? () => onFlag(q.id) : undefined} readOnly={readOnly} review={review?.(q)} />
      ))}
    </section>
  );
}

export function Paragraphs({ text }: { text: string }) {
  return <>{text.split(/\n\n+/).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}</>;
}
