import { ArrowRotateLeft, Gear, Xmark } from '@gravity-ui/icons';
import { cn } from '@heroui/react';
import { useEffect, useState } from 'react';
import { Wave } from './Wave';

/**
 * A phone-sized practice screen in the brand style: a Speaking cue with the soundwave,
 * the examiner's line and the candidate's reply. Used as the hero object on the site and login.
 */
export function PracticeCard({ className, compact = false }: { className?: string; compact?: boolean }) {
  const [translated, setTranslated] = useState(false);
  const [step, setStep] = useState(2);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s % 4) + 1), 3200);
    return () => clearInterval(t);
  }, []);
  return (
    <div dir="ltr" className={cn('mx-auto w-full max-w-[380px] rounded-[44px] bg-ink p-2.5 shadow-[0_30px_80px_-30px_rgb(60_50_120/0.55)]', className)}>
      <div className="overflow-hidden rounded-[36px] bg-cream">
        <div className="flex items-center gap-3 px-5 pt-5">
          <span className="grid size-9 place-items-center rounded-full bg-beige text-ink-2"><Gear className="size-4" /></span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-beige" aria-hidden>
            <span className="block h-full rounded-full bg-sand transition-all duration-700" style={{ width: `${step * 25}%` }} />
          </span>
          <span className="mono ltr text-[13px] tabular text-ink-2">{step}/4</span>
          <span className="grid size-9 place-items-center rounded-full bg-beige text-ink"><Xmark className="size-4" /></span>
        </div>
        <div className="px-6 pt-6 pb-7">
          <p dir="rtl" className="serif text-center text-[23px] leading-8">از مهارتی بگویید که یاد گرفته‌اید</p>
          <Wave live className="my-5" height={compact ? 110 : 150} />
          <div><span className="kicker mono" data-dot>Examiner</span></div>
          <p className="exam-text mt-2 text-[17px] leading-7 font-medium text-ink">
            {translated ? <span dir="rtl" className="block text-right font-sans">مهارتی را توصیف کنید که یاد گرفته‌اید و به کارتان می‌آید.</span> : 'Describe a skill you learned that you find useful.'}
          </p>
          <button type="button" onClick={() => setTranslated((v) => !v)} className="mt-3 inline-flex items-center gap-2 rounded-full bg-beige px-4 py-2 text-[13px] font-semibold text-ink outline-none hover:bg-beige/70 focus-visible:ring-2 focus-visible:ring-focus">
            <ArrowRotateLeft className="size-3.5" />
            {translated ? 'English' : 'ترجمه'}
          </button>
          {compact ? null : (
            <>
              <div className="mt-6"><span className="kicker mono" data-dot="sky">your reply</span></div>
              <p className="exam-text mt-2 text-[17px] leading-7 text-ink-3/70">Last year I learned to cook properly, and honestly it changed…</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
