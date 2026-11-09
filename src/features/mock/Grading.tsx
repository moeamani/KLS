import { CircleInfo, TriangleExclamation } from '@gravity-ui/icons';
import { Button, cn } from '@heroui/react';
import { useState } from 'react';
import { TextAreaField } from '@/components/ui/Fields';
import { Section } from '@/components/ui/Page';
import { faNumber } from '@/lib/format';
import { criteriaBand, formatBand, MIN_WORDS, SPEAKING_CRITERIA, speakingBand, WRITING_CRITERIA, wordCount, writingBand } from '@/lib/ielts';
import type { SpeakingCriterion, WritingCriterion } from '@/types';
import { BarChart } from './ExamParts';
import type { MockTest } from '@/types';

const SCALE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/** A 0–9 whole-band picker for one criterion. */
export function CriterionPicker({ label, en, value, onChange }: { label: string; en: string; value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-semibold">{label}</span>
        <span className="ltr text-[11px] text-muted">{en}</span>
      </div>
      <div className="ltr flex gap-1" role="radiogroup" aria-label={label}>
        {SCALE.map((n) => (
          <button key={n} type="button" role="radio" aria-checked={value === n} onClick={() => onChange(n)}
            className={cn('h-8 flex-1 rounded-md border text-[13px] font-bold tabular outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus', value === n ? 'border-accent bg-accent text-accent-foreground' : 'border-border bg-surface text-ink-2 hover:bg-default', n < 4 && value !== n && 'text-ink-3')}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

type Scores<K extends string> = Record<K, number | null>;
const empty = <K extends string>(keys: K[]): Scores<K> => Object.fromEntries(keys.map((k) => [k, null])) as Scores<K>;
const complete = <K extends string>(s: Scores<K>): s is Record<K, number> => Object.values(s).every((v) => v != null);

export function ResponseView({ title, prompt, text, min, chart }: { title: string; prompt: string; text: string; min: number; chart?: MockTest['writing']['t1']['chart'] }) {
  const words = wordCount(text);
  return (
    <Section title={<span className="ltr">{title}</span>} actions={<span className={cn('text-xs font-semibold tabular', words < min ? 'text-warning-soft-foreground' : 'text-muted')}>{faNumber(words)} کلمه</span>}>
      <details className="mb-3 rounded-lg bg-surface-secondary px-3 py-2 text-[13px]">
        <summary className="cursor-pointer font-semibold text-ink-2">صورت سؤال</summary>
        <div className="exam-text mt-2 whitespace-pre-line leading-7">{prompt}</div>
        {chart ? <div className="mt-2"><BarChart spec={chart} /></div> : null}
      </details>
      {words < min ? <div className="mb-2 flex items-center gap-2 text-[12.5px] text-warning-soft-foreground"><TriangleExclamation className="size-4" />کمتر از حداقل {faNumber(min)} کلمه؛ طبق معیارها در Task Achievement/Response لحاظ شود.</div> : null}
      <div className="exam-text max-h-[420px] overflow-y-auto whitespace-pre-line rounded-lg border border-border p-4 text-[14.5px] leading-8">{text || <span className="text-muted">No response.</span>}</div>
    </Section>
  );
}

export function WritingGradeForm({ test, response, onSubmit, submitLabel = 'ثبت نمره رایتینگ', initial }: {
  test: MockTest;
  response: { t1: string; t2: string };
  onSubmit: (grade: { t1: Record<WritingCriterion, number>; t2: Record<WritingCriterion, number>; comments: { t1: string; t2: string; overall: string } }) => void;
  submitLabel?: string;
  initial?: { t1: Record<WritingCriterion, number>; t2: Record<WritingCriterion, number> };
}) {
  const keys = WRITING_CRITERIA.map((c) => c.id);
  const [t1, setT1] = useState<Scores<WritingCriterion>>(initial?.t1 ?? empty(keys));
  const [t2, setT2] = useState<Scores<WritingCriterion>>(initial?.t2 ?? empty(keys));
  const [comments, setComments] = useState({ t1: '', t2: '', overall: '' });
  const [touched, setTouched] = useState(false);
  const ready = complete(t1) && complete(t2);
  const missingComment = !comments.t1.trim() || !comments.t2.trim();
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="grid content-start gap-4">
        <ResponseView title="Task 1" prompt={test.writing.t1.prompt} text={response.t1} min={MIN_WORDS.t1} chart={test.writing.t1.chart} />
        <ResponseView title="Task 2" prompt={test.writing.t2.prompt} text={response.t2} min={MIN_WORDS.t2} />
      </div>
      <div className="grid content-start gap-4 xl:sticky xl:top-4">
        {([['t1', t1, setT1], ['t2', t2, setT2]] as const).map(([task, scores, setScores]) => (
          <Section key={task} title={<span className="ltr">Task {task === 't1' ? 1 : 2}</span>} actions={<span className="text-sm font-extrabold tabular">{complete(scores) ? formatBand(criteriaBand(scores)) : '—'}</span>}>
            <div className="grid gap-3">
              {WRITING_CRITERIA.map((c) => <CriterionPicker key={c.id} label={c.id === 'ta' && task === 't2' ? 'پاسخ به سؤال (Task Response)' : c.label} en={c.en} value={scores[c.id]} onChange={(v) => setScores({ ...scores, [c.id]: v })} />)}
              <TextAreaField label="بازخورد (به انگلیسی)" value={comments[task]} onChange={(v) => setComments({ ...comments, [task]: v })} rows={3} ltr error={touched && !comments[task].trim() ? 'برای زبان‌آموز بازخورد بنویسید.' : ''} />
            </div>
          </Section>
        ))}
        <Section>
          <div className="grid gap-3">
            <TextAreaField label="جمع‌بندی برای زبان‌آموز (اختیاری)" value={comments.overall} onChange={(v) => setComments({ ...comments, overall: v })} rows={2} />
            <div className="flex items-center justify-between rounded-lg bg-surface-secondary px-4 py-3">
              <span className="text-[13px] text-ink-2">نمره رایتینگ</span>
              <span className="text-2xl font-extrabold tabular">{ready ? formatBand(writingBand(t1, t2)) : '—'}</span>
            </div>
            <p className="flex items-start gap-2 text-xs leading-5 text-muted"><CircleInfo className="mt-0.5 size-3.5 shrink-0" />نمره هر Task میانگین چهار معیار (رو به پایین تا نیم‌نمره) است و Task 2 دو برابر وزن دارد.</p>
            <Button isDisabled={!ready} onPress={() => { setTouched(true); if (ready && !missingComment) onSubmit({ t1, t2, comments }); }}>{submitLabel}</Button>
          </div>
        </Section>
      </div>
    </div>
  );
}

export function SpeakingGradeForm({ onSubmit, initial, submitLabel = 'ثبت نمره اسپیکینگ' }: { onSubmit: (grade: { scores: Record<SpeakingCriterion, number>; comment: string }) => void; initial?: Record<SpeakingCriterion, number>; submitLabel?: string }) {
  const [scores, setScores] = useState<Scores<SpeakingCriterion>>(initial ?? empty(SPEAKING_CRITERIA.map((c) => c.id)));
  const [comment, setComment] = useState('');
  const [touched, setTouched] = useState(false);
  const ready = complete(scores);
  return (
    <Section title="نمره اسپیکینگ" actions={<span className="text-xl font-extrabold tabular">{ready ? formatBand(speakingBand(scores)) : '—'}</span>}>
      <div className="grid gap-4">
        {SPEAKING_CRITERIA.map((c) => <CriterionPicker key={c.id} label={c.label} en={c.en} value={scores[c.id]} onChange={(v) => setScores({ ...scores, [c.id]: v })} />)}
        <TextAreaField label="بازخورد (به انگلیسی)" value={comment} onChange={setComment} rows={3} ltr error={touched && !comment.trim() ? 'برای زبان‌آموز بازخورد بنویسید.' : ''} />
        <Button isDisabled={!ready} onPress={() => { setTouched(true); if (ready && comment.trim()) onSubmit({ scores, comment }); }}>{submitLabel}</Button>
      </div>
    </Section>
  );
}
