import { cn } from '@heroui/react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { EASE } from '@/components/motion';

export interface TimelineEntry {
  id: string;
  title: ReactNode;
  detail?: ReactNode;
  meta?: ReactNode;
  state?: 'done' | 'current' | 'warning' | 'muted';
}

const DOT = {
  done: 'bg-accent border-accent',
  current: 'bg-surface border-accent ring-4 ring-accent-soft',
  warning: 'bg-surface border-warning ring-4 ring-warning-soft',
  muted: 'bg-surface border-line-strong',
};

export function Timeline({ items }: { items: TimelineEntry[] }) {
  return (
    <ol className="relative">
      {items.map((item, index) => (
        <motion.li
          key={item.id}
          className="relative ps-7 pb-5 last:pb-0"
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: EASE, delay: index * 0.03 }}
        >
          {index < items.length - 1 ? <span aria-hidden className="absolute start-[5px] top-4 bottom-0 w-px bg-border" /> : null}
          <span aria-hidden className={cn('absolute start-0 top-1.5 size-[11px] rounded-full border-2', DOT[item.state ?? 'done'])} />
          <div className="text-sm leading-6 font-semibold">{item.title}</div>
          {item.detail ? <div className="text-[13px] leading-6 text-ink-2">{item.detail}</div> : null}
          {item.meta ? <div className="text-xs leading-5 text-muted">{item.meta}</div> : null}
        </motion.li>
      ))}
    </ol>
  );
}
