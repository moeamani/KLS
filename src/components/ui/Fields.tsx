import { cn, Description, FieldError, Input, Label, ListBox, NumberField, Select, TextArea, TextField } from '@heroui/react';
import type { ReactNode } from 'react';

export interface Option { id: string; label: string; description?: string }

export function SelectField({ label, value, onChange, options, placeholder = 'انتخاب کنید', error, description, className, hideLabel, isDisabled }: {
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  error?: string;
  description?: ReactNode;
  className?: string;
  hideLabel?: boolean;
  isDisabled?: boolean;
}) {
  return (
    <Select aria-label={label} placeholder={placeholder} selectedKey={value} onSelectionChange={(key) => key != null && onChange(String(key))} isInvalid={Boolean(error)} className={className} isDisabled={isDisabled}>
      <Label className={cn(hideLabel && 'sr-only')}>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      {error ? <FieldError>{error}</FieldError> : description ? <Description>{description}</Description> : null}
      <Select.Popover>
        <ListBox>
          {options.map((option) => (
            <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
              <div className="min-w-0">
                <div>{option.label}</div>
                {option.description ? <div className="text-xs text-muted">{option.description}</div> : null}
              </div>
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

export function TextInput({ label, value, onChange, placeholder, error, description, type = 'text', inputMode, maxLength, className, ltr, onBlur, name, autoComplete, isRequired }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  description?: ReactNode;
  type?: string;
  inputMode?: 'text' | 'numeric' | 'tel' | 'email' | 'decimal';
  maxLength?: number;
  className?: string;
  ltr?: boolean;
  onBlur?: () => void;
  name?: string;
  autoComplete?: string;
  isRequired?: boolean;
}) {
  return (
    <TextField value={value} onChange={onChange} isInvalid={Boolean(error)} className={className} onBlur={onBlur} name={name} autoComplete={autoComplete} type={type} isRequired={isRequired}>
      <Label>{label}</Label>
      <Input placeholder={placeholder} inputMode={inputMode} maxLength={maxLength} className={cn(ltr && 'ltr text-start', inputMode === 'numeric' || inputMode === 'tel' ? 'tabular' : undefined)} />
      {error ? <FieldError>{error}</FieldError> : description ? <Description>{description}</Description> : null}
    </TextField>
  );
}

export function TextAreaField({ label, value, onChange, rows = 4, placeholder, error, description, className, ltr }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  error?: string;
  description?: ReactNode;
  className?: string;
  ltr?: boolean;
}) {
  return (
    <TextField value={value} onChange={onChange} isInvalid={Boolean(error)} className={className}>
      <Label>{label}</Label>
      <TextArea rows={rows} placeholder={placeholder} className={cn(ltr && 'ltr text-start')} />
      {error ? <FieldError>{error}</FieldError> : description ? <Description>{description}</Description> : null}
    </TextField>
  );
}

export function NumberInput({ label, value, onChange, min, max, step = 1, description, className }: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <NumberField value={value} minValue={min} maxValue={max} step={step} onChange={(next) => Number.isFinite(next) && onChange(next)} className={className} fullWidth>
      <Label>{label}</Label>
      <NumberField.Group>
        <NumberField.IncrementButton />
        <NumberField.Input className="text-center font-semibold tabular" />
        <NumberField.DecrementButton />
      </NumberField.Group>
      {description ? <Description>{description}</Description> : null}
    </NumberField>
  );
}
