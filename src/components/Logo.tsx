import { cn } from '@heroui/react';

/** The KLS School hexagon mark (K, S and L around a diamond), redrawn as a vector from the school's logo. */
export const LOGO_PATH = 'M32.3 75.7 L64.4 90.4 L87.9 76 L60.4 62Z M12.8 75.5 L12.8 77.5 L48.2 97.9 L51.8 97.7 L55.1 95.2 L21.9 75.9 L52.9 58.6 L50 56.4Z M43.5 5.2 L8 25.3 L8 72.8 L44.3 55 L43.8 53 L23.6 38.9Z M50.7 1.9 L50.7 34.7 L82.2 53.7 L82.2 60.4 L50.7 42.7 L50.7 53.3 L91.9 73.3 L91.9 41 L61.2 22.3 L61.2 14.7 L91.9 33.2 L91.9 25Z';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={cn('size-9 shrink-0', className)} role="img" aria-label="KLS School">
      <path fill="var(--brand)" d={LOGO_PATH} />
    </svg>
  );
}

export function Logo({ caption, className, compact = false }: { caption?: string; className?: string; compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      {compact ? null : (
        <div className="leading-tight">
          <div className="text-[16px] font-extrabold tracking-tight text-brand">
            <span className="ltr inline-block">KLS <span className="font-semibold">School</span></span>
          </div>
          <div className="text-xs text-muted">{caption ?? 'خانه زبان کرمانشاه'}</div>
        </div>
      )}
    </div>
  );
}
