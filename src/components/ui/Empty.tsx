import { cn } from '@heroui/react';
import type { ComponentType, ReactNode, SVGProps } from 'react';

/** One calm block that says what will appear here and how to make it appear. */
export function Empty({ icon: Icon, title, description, action, className }: { icon?: ComponentType<SVGProps<SVGSVGElement>>; title: string; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-2 px-6 py-10 text-center', className)}>
      {Icon ? (
        <span className="mb-1 grid size-11 place-items-center rounded-full bg-default text-ink-3">
          <Icon className="size-5" />
        </span>
      ) : null}
      <div className="text-sm font-bold text-foreground">{title}</div>
      {description ? <p className="max-w-sm text-[13px] leading-6 text-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/** Marks copy the school still has to supply. */
export function Placeholder({ children }: { children: ReactNode }) {
  return <span className="rounded-md border border-dashed border-warning/60 bg-warning-soft px-1.5 text-warning-soft-foreground">{children}</span>;
}
