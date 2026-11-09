import { cn } from '@heroui/react';

// The periwinkle soundwave from the reference: rounded bars with a lighter halo and a darker core.
const SHAPE = [0.34, 0.5, 0.62, 0.8, 0.7, 0.92, 1, 0.86, 0.95, 0.74, 0.88, 0.6, 0.66, 0.46, 0.38];

export function Wave({ live = false, height = 120, bars = SHAPE.length, barWidth = 12, gap = 7, className, label }: {
  live?: boolean;
  height?: number;
  bars?: number;
  barWidth?: number;
  gap?: number;
  className?: string;
  label?: string;
}) {
  const shape = Array.from({ length: bars }, (_, i) => SHAPE[i % SHAPE.length]);
  return (
    <div
      className={cn('wave', live && 'wave--live', className)}
      style={{ height, ['--wave-w' as string]: `${barWidth}px`, ['--wave-gap' as string]: `${gap}px` }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {shape.map((h, i) => (
        <span key={i} className="wave__bar" style={{ height: `${Math.round(h * 100)}%`, animationDelay: `${(i % 7) * -0.13}s` }} />
      ))}
    </div>
  );
}
