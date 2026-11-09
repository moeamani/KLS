import { cn, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import type { Key } from 'react-aria-components';

export interface SegmentOption<T extends string> { id: T; label: React.ReactNode }

/** Single-choice segmented control (HeroUI ToggleButtonGroup with one selection). */
export function Segmented<T extends string>({ options, value, onChange, label, size = 'sm', className, fullWidth = true }: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  size?: 'sm' | 'md';
  className?: string;
  fullWidth?: boolean;
}) {
  return (
    <ToggleButtonGroup
      aria-label={label}
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={new Set<Key>([value])}
      onSelectionChange={(keys) => {
        const next = [...keys][0];
        if (next !== undefined) onChange(String(next) as T);
      }}
      size={size}
      fullWidth={fullWidth}
      className={cn('segmented', className)}
    >
      {options.map((option) => (
        <ToggleButton key={option.id} id={option.id} className="flex-1">
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
