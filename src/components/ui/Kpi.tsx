import { Card, cn } from '@heroui/react';
import type { ReactNode } from 'react';
import { CountUp } from '@/components/motion';

export interface KpiItem {
  label: string;
  value: number;
  format?: (n: number) => string;
  hint?: ReactNode;
  tone?: 'default' | 'warning' | 'danger' | 'success';
}

const HINT_TONE = { default: 'text-muted', warning: 'text-warning-soft-foreground', danger: 'text-danger-soft-foreground', success: 'text-success-soft-foreground' };

/** A row of key numbers inside one card, separated by hairlines rather than boxed individually. */
export function KpiStrip({ items, className }: { items: KpiItem[]; className?: string }) {
  return (
    <Card className={cn('grid gap-0 p-0 sm:grid-cols-2', items.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3', className)}>
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cn(
            'px-5 py-4',
            index > 0 && 'border-t border-separator sm:border-t-0',
            index % 2 === 1 && 'sm:border-s sm:border-separator',
            index >= 2 && 'sm:border-t lg:border-t-0',
            index > 0 && 'lg:border-s lg:border-separator',
          )}
        >
          <div className="kicker text-muted">{item.label}</div>
          <div className="display mt-1 text-[40px] leading-[52px] tabular">
            <CountUp value={item.value} format={item.format} />
          </div>
          {item.hint ? <div className={cn('mt-0.5 text-xs leading-5', HINT_TONE[item.tone ?? 'default'])}>{item.hint}</div> : null}
        </div>
      ))}
    </Card>
  );
}
