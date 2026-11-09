import { cn } from '@heroui/react';

/** KLS mark: a house that is also a speech bubble, with three soundwave bars inside. */
export function LogoMark({ className, tone = 'ink' }: { className?: string; tone?: 'ink' | 'cream' }) {
  const fill = tone === 'ink' ? 'var(--brand)' : 'var(--kl-cream)';
  const inner = tone === 'ink' ? 'var(--kl-cream)' : 'var(--kl-ink)';
  return (
    <svg viewBox="0 0 40 40" className={cn('size-8 shrink-0', className)} role="img" aria-label="KLS School">
      <path fill={fill} d="M20 3 37 16.5V31a3 3 0 0 1-3 3H15l-7 5v-5H6a3 3 0 0 1-3-3V16.5L20 3Z" />
      <rect x="12.5" y="21" width="3" height="7" rx="1.5" fill={inner} />
      <rect x="18.5" y="17.5" width="3" height="12" rx="1.5" fill="var(--kl-peri-300)" />
      <rect x="24.5" y="20" width="3" height="8" rx="1.5" fill={inner} />
    </svg>
  );
}

export function Logo({ caption, className, compact = false, tone = 'ink' }: { caption?: string; className?: string; compact?: boolean; tone?: 'ink' | 'cream' }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark tone={tone} />
      {compact ? null : (
        <div className="leading-none">
          <div className={cn('ltr display text-[22px] leading-6 tracking-wide', tone === 'cream' && 'text-cream')}>KLS <span className="serif text-[19px] font-normal">School</span></div>
          <div className={cn('serif mt-0.5 text-[15px] leading-5', tone === 'cream' ? 'text-cream/80' : 'text-ink-2')}>{caption ?? 'خانه زبان کرمانشاه'}</div>
        </div>
      )}
    </div>
  );
}
