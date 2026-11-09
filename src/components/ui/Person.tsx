import { Avatar, cn } from '@heroui/react';
import { initials } from '@/lib/format';

export function PersonAvatar({ name, size = 'sm', className }: { name: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return (
    <Avatar size={size} variant="soft" className={className}>
      <Avatar.Fallback className="text-[11px] font-bold">{initials(name)}</Avatar.Fallback>
    </Avatar>
  );
}

export function PersonCell({ name, sub, className }: { name: string; sub?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      <PersonAvatar name={name} />
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-foreground">{name}</div>
        {sub ? <div className="truncate text-xs text-muted">{sub}</div> : null}
      </div>
    </div>
  );
}
