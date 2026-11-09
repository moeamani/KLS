import { cn } from '@heroui/react';
import { bandLabel, formatBand } from '@/lib/ielts';

const tone = (band: number) => (band >= 7 ? 'bg-success-soft text-success-soft-foreground' : band >= 5.5 ? 'bg-accent-soft text-accent-soft-foreground' : 'bg-warning-soft text-warning-soft-foreground');

export function BandBadge({ band, className }: { band: number | undefined; className?: string }) {
  if (band == null) return <span className="text-muted">—</span>;
  return <span className={cn('inline-flex min-w-10 justify-center rounded-lg px-2 py-0.5 text-sm font-extrabold tabular', tone(band), className)}>{formatBand(band)}</span>;
}

/** One skill's band: big figure, label and an optional raw score. */
export function BandTile({ label, band, sub, pending }: { label: string; band?: number; sub?: string; pending?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-[13px] text-muted">{label}</div>
      {band != null ? (
        <>
          <div className="mt-1 text-[32px] leading-10 font-extrabold tabular">{formatBand(band)}</div>
          <div className="text-xs text-muted">{sub ?? bandLabel(band)}</div>
        </>
      ) : (
        <>
          <div className="mt-1 text-[32px] leading-10 font-extrabold text-line-strong">—</div>
          <div className="text-xs text-warning-soft-foreground">{pending ?? 'در حال تصحیح'}</div>
        </>
      )}
    </div>
  );
}
