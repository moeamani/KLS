import { Chip, cn } from '@heroui/react';
import type { Tone } from '@/data/status';

const DOT: Record<Tone, string> = { default: 'bg-ink-3', accent: 'bg-accent', success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger' };

export function ToneChip({ tone, children, className, size = 'sm' }: { tone: Tone; children: React.ReactNode; className?: string; size?: 'sm' | 'md' }) {
  return (
    <Chip color={tone} variant="soft" size={size} className={cn('gap-1.5 ps-2', className)}>
      <span aria-hidden className={cn('size-1.5 rounded-full', DOT[tone])} />
      <Chip.Label>{children}</Chip.Label>
    </Chip>
  );
}

/** Renders a status from one of the vocabularies in data/status.ts. */
export function MetaChip({ meta, student = false, size }: { meta: { label: string; tone: Tone; student?: string }; student?: boolean; size?: 'sm' | 'md' }) {
  return <ToneChip tone={meta.tone} size={size}>{student && meta.student ? meta.student : meta.label}</ToneChip>;
}
