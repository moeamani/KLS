import { ArrowRotateLeft, Globe, PlayFill, Sliders } from '@gravity-ui/icons';
import { Button, cn, Popover, Separator, toast } from '@heroui/react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { useApp } from '@/store/app';
import { useUi } from '@/store/ui';

export const PERSONAS = [
  { id: 'student', label: 'زبان‌آموز', panel: 'student', userId: 'st1' },
  { id: 'parent', label: 'والد', panel: 'parent', userId: 'pa1' },
  { id: 'teacher', label: 'استاد/ممتحن', panel: 'teacher', userId: 'te1' },
  { id: 'manager', label: 'مدیر', panel: 'admin', userId: 'sf1' },
  { id: 'reception', label: 'پذیرش', panel: 'admin', userId: 'sf2' },
  { id: 'finance', label: 'مالی', panel: 'admin', userId: 'sf3' },
] as const;

/** Prototype-only controls, kept out of the product UI. */
export function PrototypeMenu({ inline = false }: { inline?: boolean }) {
  const navigate = useNavigate();
  const session = useApp((s) => s.session);
  const resetAll = useApp((s) => s.resetAll);
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <Popover>
        <Button size="sm" variant={inline ? 'ghost' : 'secondary'} className={cn(inline ? 'w-full justify-start border border-dashed border-line-strong text-ink-2' : 'shadow-[0_6px_20px_rgb(12_17_23/0.12)]')}>
          <Sliders />
          ابزار نمونه اولیه
        </Button>
        <Popover.Content placement={inline ? 'top' : 'top start'} className="w-80">
          <Popover.Dialog className="grid gap-4 p-4">
            <div>
              <div className="mb-2 text-xs font-semibold text-muted">مشاهده به‌عنوان</div>
              <div className="grid grid-cols-3 gap-1 rounded-[10px] bg-default p-1">
                {PERSONAS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => navigate(`/switch/${p.id}`)}
                    aria-pressed={session?.userId === p.userId}
                    className={cn('rounded-lg px-1 py-1.5 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus', session?.userId === p.userId ? 'bg-surface text-foreground shadow-[0_1px_2px_rgb(12_17_23/0.08)]' : 'text-ink-2 hover:text-foreground')}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <Button size="sm" variant="ghost" className="justify-start" onPress={() => navigate('/try-mock')}>
              <PlayFill />
              امتحان آزمون ماک (زبان‌آموز نمونه)
            </Button>
            <Button size="sm" variant="ghost" className="justify-start" onPress={() => navigate('/')}>
              <Globe />
              رفتن به سایت عمومی
            </Button>
            <Separator />
            <Button size="sm" variant="ghost" className="justify-start" onPress={() => setConfirm(true)}>
              <ArrowRotateLeft />
              بازنشانی همه داده‌های نمونه
            </Button>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>
      <ConfirmDialog
        isOpen={confirm}
        onOpenChange={setConfirm}
        title="بازنشانی داده‌های نمونه؟"
        description="همه تغییرات این نمونه اولیه (ثبت‌نام‌ها، رزروها، آزمون‌ها، نمره‌ها و تنظیمات) به حالت اولیه برمی‌گردد."
        confirmLabel="بازنشانی"
        tone="warning"
        onConfirm={() => { resetAll(); setConfirm(false); toast.success('داده‌های نمونه بازنشانی شد'); }}
      />
    </>
  );
}

/** Floating variant for pages without the app shell. */
export function PrototypeBar() {
  const { pathname } = useLocation();
  const focusMode = useUi((s) => s.focusMode);
  if (focusMode || /^\/(portal|parent|teacher|admin)/.test(pathname)) return null;
  return (
    <div className="fixed bottom-4 left-4 z-40 print:hidden">
      <PrototypeMenu />
    </div>
  );
}
