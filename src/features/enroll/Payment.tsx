import { CircleCheck, CircleXmark, CreditCard, Hourglass } from '@gravity-ui/icons';
import { Alert, Button, cn, Separator, Spinner, toast } from '@heroui/react';
import { useEffect, useState } from 'react';
import { FormDialog } from '@/components/ui/Dialog';
import { TextInput } from '@/components/ui/Fields';
import { Segmented } from '@/components/ui/Segmented';
import { balanceOf, dueInstallments, METHOD_LABEL } from '@/data/status';
import { formatDay } from '@/lib/dates';
import { clock, toman } from '@/lib/format';
import { useApp } from '@/store/app';
import type { PaymentMethod } from '@/types';

/** Seconds left on a seat hold, live. */
export function useCountdown(until?: string) {
  const [left, setLeft] = useState(() => (until ? Math.max(0, Math.round((new Date(until).getTime() - Date.now()) / 1000)) : 0));
  useEffect(() => {
    if (!until) return;
    const t = setInterval(() => setLeft(Math.max(0, Math.round((new Date(until).getTime() - Date.now()) / 1000))), 1000);
    return () => clearInterval(t);
  }, [until]);
  return left;
}

export function HoldTimer({ until, label = 'صندلی برای شما نگه داشته شده است' }: { until?: string; label?: string }) {
  const left = useCountdown(until);
  if (!until) return null;
  return (
    <div className={cn('flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold', left > 120 ? 'bg-accent-soft text-accent-soft-foreground' : left > 0 ? 'bg-warning-soft text-warning-soft-foreground' : 'bg-default text-muted')}>
      <Hourglass className="size-4" />
      {left > 0 ? <>{label}: <span className="tabular">{clock(left)}</span></> : 'مهلت پرداخت تمام شد'}
    </div>
  );
}

/**
 * Pays an invoice. Students go through the (simulated) bank gateway; staff at the desk record
 * a card-reader, cash or transfer payment. Discount codes and a two-part plan apply before paying.
 */
export function PaymentDialog({ invoiceId, isOpen, onOpenChange, onPaid, heldUntil, staff = false, allowInstallments = true }: {
  invoiceId: string | undefined;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPaid?: () => void;
  heldUntil?: string;
  staff?: boolean;
  allowInstallments?: boolean;
}) {
  const invoice = useApp((s) => s.invoices.find((i) => i.id === invoiceId));
  const settings = useApp((s) => s.settings);
  const session = useApp((s) => s.session);
  const staffName = useApp((s) => s.staff.find((u) => u.id === s.session?.userId)?.name);
  const payInvoice = useApp((s) => s.payInvoice);
  const applyDiscount = useApp((s) => s.applyDiscount);
  const setInstallments = useApp((s) => s.setInstallments);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [stage, setStage] = useState<'review' | 'gateway' | 'success' | 'failed'>('review');
  const [method, setMethod] = useState<PaymentMethod>(staff ? 'pos' : 'online');
  const left = useCountdown(heldUntil);

  useEffect(() => { if (isOpen) { setStage('review'); setCode(''); setCodeError(''); } }, [isOpen]);
  if (!invoice) return null;
  const balance = balanceOf(invoice);
  const next = dueInstallments(invoice)[0];
  const payNow = Math.min(balance, next?.amount ?? balance);
  const canSplit = allowInstallments && invoice.ref.kind === 'enrollment' && invoice.payments.length === 0 && invoice.total >= settings.installmentMin;
  const parts = invoice.installments.length;
  const expired = Boolean(heldUntil) && left <= 0;

  const finish = () => {
    const result = payInvoice(invoice.id, payNow, method, session?.panel === 'admin' ? staffName : undefined);
    if (!result.ok) { setStage('review'); toast.danger(result.error); return; }
    setStage('success');
    onPaid?.();
  };

  return (
    <FormDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      icon={<CreditCard />}
      title={stage === 'gateway' ? 'درگاه پرداخت بانکی' : stage === 'success' ? 'پرداخت موفق' : 'پرداخت'}
      description={stage === 'review' ? invoice.title : undefined}
      isDismissable={stage !== 'gateway'}
      footer={
        stage === 'review' ? (
          <>
            <Button variant="tertiary" slot="close">انصراف</Button>
            <Button isDisabled={expired || payNow <= 0} onPress={() => (method === 'online' ? setStage('gateway') : finish())}>{method === 'online' ? `پرداخت ${toman(payNow)}` : `ثبت دریافت ${toman(payNow)}`}</Button>
          </>
        ) : stage === 'success' || stage === 'failed' ? (
          <Button slot="close">{stage === 'success' ? 'تمام' : 'بستن'}</Button>
        ) : null
      }
    >
      {stage === 'review' ? (
        <div className="grid gap-4">
          {heldUntil ? <HoldTimer until={heldUntil} /> : null}
          <dl className="grid gap-2 text-[13.5px]">
            {invoice.items.map((item) => <div key={item.label} className="flex justify-between gap-3"><dt className="text-ink-2">{item.label}</dt><dd className="font-semibold tabular">{toman(item.amount)}</dd></div>)}
            {invoice.discount ? <div className="flex justify-between gap-3 text-success-soft-foreground"><dt>تخفیف ({invoice.discount.code})</dt><dd className="font-semibold tabular">−{toman(invoice.discount.amount)}</dd></div> : null}
            {invoice.payments.length ? <div className="flex justify-between gap-3"><dt className="text-ink-2">پرداخت‌شده</dt><dd className="font-semibold tabular">{toman(invoice.total - balance)}</dd></div> : null}
            <Separator />
            <div className="flex justify-between gap-3 text-[15px]"><dt className="font-bold">قابل پرداخت اکنون</dt><dd className="font-extrabold tabular">{toman(payNow)}</dd></div>
          </dl>
          {canSplit ? (
            <div className="grid gap-2">
              <Segmented label="نحوه پرداخت" value={String(parts) as '1' | '2'} onChange={(v) => setInstallments(invoice.id, Number(v) as 1 | 2)} options={[{ id: '1', label: 'یک‌جا' }, { id: '2', label: 'دو قسط' }]} />
              {parts > 1 ? <p className="text-xs text-muted">قسط دوم {toman(invoice.installments[1].amount)} در {formatDay(invoice.installments[1].due)}.</p> : null}
            </div>
          ) : null}
          {!invoice.discount && invoice.payments.length === 0 ? (
            <div className="flex items-end gap-2">
              <TextInput label="کد تخفیف" value={code} onChange={(v) => { setCode(v); setCodeError(''); }} ltr placeholder="مثلاً MOCK10" error={codeError} className="flex-1" />
              <Button variant="secondary" isDisabled={!code.trim()} onPress={() => { const r = applyDiscount(invoice.id, code); if (r.ok) { toast.success('کد تخفیف اعمال شد', { description: toman(r.id) }); setCode(''); } else setCodeError(r.error); }}>اعمال</Button>
            </div>
          ) : null}
          {staff ? (
            <Segmented label="روش دریافت" value={method} onChange={setMethod} options={(['pos', 'cash', 'transfer', 'online'] as PaymentMethod[]).map((m) => ({ id: m, label: METHOD_LABEL[m] }))} />
          ) : null}
          {expired ? <Alert status="danger"><Alert.Content><Alert.Description>مهلت نگه‌داشتن صندلی تمام شد. برای ادامه دوباره رزرو کنید.</Alert.Description></Alert.Content></Alert> : null}
        </div>
      ) : stage === 'gateway' ? (
        <div className="grid gap-4">
          <div className="rounded-xl border border-dashed border-line-strong bg-surface-secondary p-4 text-center">
            <div className="text-xs text-muted">شبیه‌سازی درگاه بانکی · در نسخه واقعی، زبان‌آموز به صفحه بانک می‌رود</div>
            <div className="mt-2 text-2xl font-extrabold tabular">{toman(payNow)}</div>
            <div className="text-xs text-muted">پذیرنده: خانه زبان کرمانشاه</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button onPress={finish}><CircleCheck />پرداخت موفق</Button>
            <Button variant="danger-soft" onPress={() => setStage('failed')}><CircleXmark />پرداخت ناموفق</Button>
          </div>
          <Button variant="ghost" onPress={() => setStage('review')}>انصراف و بازگشت</Button>
        </div>
      ) : stage === 'success' ? (
        <div className="grid justify-items-center gap-2 py-4 text-center">
          <CircleCheck className="size-10 text-success" />
          <div className="text-base font-bold">پرداخت با موفقیت ثبت شد</div>
          <p className="text-[13px] text-muted">رسید در بخش پرداخت‌ها ذخیره شد و پیامک تأیید ارسال شد.</p>
        </div>
      ) : (
        <div className="grid justify-items-center gap-2 py-4 text-center">
          <CircleXmark className="size-10 text-danger" />
          <div className="text-base font-bold">پرداخت انجام نشد</div>
          <p className="text-[13px] text-muted">مبلغی از حساب شما کسر نشد. تا پایان مهلت رزرو می‌توانید دوباره پرداخت کنید.</p>
          <Button variant="secondary" onPress={() => setStage('review')}>تلاش دوباره</Button>
        </div>
      )}
      {stage === 'gateway' ? <div className="sr-only"><Spinner /></div> : null}
    </FormDialog>
  );
}
