import { AlertDialog, Button, Modal } from '@heroui/react';
import type { ReactNode } from 'react';

// Two dialog shapes are used everywhere. Footers always read [cancel] [primary],
// so the primary action sits at the visual end (left in RTL) on every screen.

interface BaseProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
}

export function FormDialog({ isOpen, onOpenChange, title, description, icon, children, footer, size = 'md', isDismissable = true }: BaseProps & {
  icon?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isDismissable?: boolean;
}) {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={isDismissable} isKeyboardDismissDisabled={!isDismissable}>
      <Modal.Container size={size} placement="center">
        <Modal.Dialog>
          {isDismissable ? <Modal.CloseTrigger /> : null}
          <Modal.Header>
            {icon ? <Modal.Icon>{icon}</Modal.Icon> : null}
            <Modal.Heading>{title}</Modal.Heading>
            {description ? <p className="text-[13px] leading-6 text-muted">{description}</p> : null}
          </Modal.Header>
          {children ? <Modal.Body>{children}</Modal.Body> : null}
          {footer ? <Modal.Footer>{footer}</Modal.Footer> : null}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

export function ConfirmDialog({ isOpen, onOpenChange, title, description, children, confirmLabel, cancelLabel = 'انصراف', tone = 'danger', onConfirm, isConfirmDisabled }: BaseProps & {
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'danger' | 'accent' | 'warning' | 'success';
  onConfirm: () => void;
  isConfirmDisabled?: boolean;
}) {
  return (
    <AlertDialog.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <AlertDialog.Container size="sm">
        <AlertDialog.Dialog>
          <AlertDialog.Header>
            <AlertDialog.Icon status={tone} />
            <AlertDialog.Heading>{title}</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body>
            {description ? <p className="text-sm leading-7 text-ink-2">{description}</p> : null}
            {children}
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button variant="tertiary" slot="close">{cancelLabel}</Button>
            <Button variant={tone === 'danger' ? 'danger' : 'primary'} isDisabled={isConfirmDisabled} onPress={onConfirm}>
              {confirmLabel}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}
