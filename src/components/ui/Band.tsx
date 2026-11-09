import { cn } from '@heroui/react';
import { bandLabel, formatBand } from '@/lib/ielts';

const tone = (band: number) => (band >= 7 ? 'bg-ink text-cream' : band >= 5.5 ? 'bg-peri-soft text-peri-deep' : 'bg-warning-soft text-warning-soft-foreground');

export function BandBadge({ band, className }: { band: number | undefined; className?: string }) {
  if (band == null) return <span className="text-muted">—</span>;
  return <span className={cn('inline-flex min-w-10 justify-center rounded-full px-2.5 py-0.5 text-sm font-bold tabular', tone(band), className)}>{formatBand(band)}</span>;
}

/** One skill's band: big figure, label and an optional raw score. */
export function BandTile({ label, band, sub, pending }: { label: string; band?: number; sub?: string; pending?: string }) {
  return (
    <div className="rounded-3xl border border-border bg-surface p-5">
      <div className="kicker mono ltr">{label}</div>
      {band != null ? (
        <>
          <div className="display mt-1 text-[48px] leading-[60px] tabular">{formatBand(band)}</div>
          <div className="text-xs text-muted">{sub ?? bandLabel(band)}</div>
        </>
      ) : (
        <>
          <div className="display mt-1 text-[48px] leading-[60px] text-line-strong">—</div>
          <div className="text-xs text-warning-soft-foreground">{pending ?? 'در حال تصحیح'}</div>
        </>
      )}
    </div>
  );
}
