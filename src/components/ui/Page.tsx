import { Breadcrumbs, Card, cn } from '@heroui/react';
import type { ReactNode } from 'react';

export interface Crumb { label: string; href?: string }

/** Consistent page width constraints: lists are wide, details narrower, forms narrowest. */
const WIDTH = { wide: 'max-w-[1240px]', default: 'max-w-[1080px]', narrow: 'max-w-[760px]' } as const;

export function Page({ children, width = 'default', className }: { children: ReactNode; width?: keyof typeof WIDTH; className?: string }) {
  return <div className={cn('mx-auto w-full px-4 pb-24 pt-6 sm:px-8 sm:pt-8', WIDTH[width], className)}>{children}</div>;
}

export function PageHeader({ title, description, crumbs, actions, badge }: { title: ReactNode; description?: ReactNode; crumbs?: Crumb[]; actions?: ReactNode; badge?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        {crumbs?.length ? (
          <Breadcrumbs className="mb-2 text-xs">
            {crumbs.map((crumb) => (
              <Breadcrumbs.Item key={crumb.label} href={crumb.href}>
                {crumb.label}
              </Breadcrumbs.Item>
            ))}
          </Breadcrumbs>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[22px] leading-9 font-bold text-foreground">{title}</h1>
          {badge}
        </div>
        {description ? <p className="mt-1 max-w-2xl text-sm leading-7 text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Section({ title, description, actions, children, className, bodyClassName, flush = false }: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Edge-to-edge body (tables, lists) */
  flush?: boolean;
}) {
  return (
    <Card className={cn('gap-0 overflow-hidden p-0', className)}>
      {title || actions ? (
        <div className={cn('flex flex-wrap justify-between gap-3 px-5 pt-4 pb-3', description ? 'items-start' : 'items-center')}>
          <div className="min-w-0">
            {title ? <h2 className="text-[15px] leading-7 font-bold">{title}</h2> : null}
            {description ? <p className="text-[13px] leading-6 text-muted">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn(flush ? '' : 'px-5 pb-5', !title && !actions && !flush && 'pt-5', bodyClassName)}>{children}</div>
    </Card>
  );
}

/** Label / value pair used in detail grids. */
export function Fact({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-sm leading-6 font-semibold text-foreground">{children}</dd>
    </div>
  );
}
