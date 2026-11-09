import { cn } from '@heroui/react';

/**
 * KLS mark: a speech bubble drawn as a Persian pointed arch — a nod to the arches of
 * Taq-e Bostan in Kermanshah — with a saffron keystone and two lines of speech.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn('size-8 shrink-0', className)} role="img" aria-label="KLS School">
      <path fill="var(--brand)" d="M6 34V18Q6 8.5 20 3.5 34 8.5 34 18v13a3 3 0 0 1-3 3H15.5L9 39v-5H6Z" />
      <circle cx="20" cy="11" r="2.4" fill="var(--saffron)" />
      <path fill="#fff" d="M12 19.5h16v3H12zM17 25.5h11v3H17z" />
    </svg>
  );
}

export function Logo({ caption, className, compact = false }: { caption?: string; className?: string; compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      {compact ? null : (
        <div className="leading-tight">
          <div className="text-[16px] font-bold tracking-tight">
            <span className="ltr inline-block">KLS <span className="font-medium text-ink-2">School</span></span>
          </div>
          <div className="text-xs text-muted">{caption ?? 'خانه زبان کرمانشاه'}</div>
        </div>
      )}
    </div>
  );
}
