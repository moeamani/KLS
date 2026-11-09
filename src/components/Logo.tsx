import { cn } from '@heroui/react';

/** KLS mark: a house that is also a speech bubble — «خانه زبان». */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn('size-8 shrink-0', className)} role="img" aria-label="KLS School">
      <path fill="var(--brand)" d="M20 3 37 16.5V31a3 3 0 0 1-3 3H15l-7 5v-5H6a3 3 0 0 1-3-3V16.5L20 3Z" />
      <path fill="#fff" d="M11 19h18v3H11zM11 25h12v3H11z" />
    </svg>
  );
}

export function Logo({ caption, className, compact = false }: { caption?: string; className?: string; compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      {compact ? null : (
        <div className="leading-tight">
          <div className="text-[16px] font-extrabold tracking-tight">
            <span className="ltr inline-block">KLS <span className="font-bold text-ink-2">School</span></span>
          </div>
          <div className="text-xs text-muted">{caption ?? 'خانه زبان کرمانشاه'}</div>
        </div>
      )}
    </div>
  );
}
