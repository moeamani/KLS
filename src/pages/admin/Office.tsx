import { Plus, ShieldCheck } from '@gravity-ui/icons';
import { Alert, Button, Card, Chip, Switch, Tabs, toast } from '@heroui/react';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/ui/DataTable';
import { FormDialog } from '@/components/ui/Dialog';
import { Empty } from '@/components/ui/Empty';
import { NumberInput, SelectField, TextAreaField, TextInput } from '@/components/ui/Fields';
import { KpiStrip } from '@/components/ui/Kpi';
import { Page, PageHeader, Section } from '@/components/ui/Page';
import { PersonCell } from '@/components/ui/Person';
import { Segmented } from '@/components/ui/Segmented';
import { MetaChip, ToneChip } from '@/components/ui/StatusChip';
import { InvoiceList } from '@/features/enroll/Records';
import { APPROVAL_KIND, APPROVAL_META, balanceOf, invoiceState, LEAD_KIND, LEAD_META, METHOD_LABEL, STAFF_ROLE_LABEL } from '@/data/status';
import { addDays, formatDateTime, formatDay, iso, relativeTime } from '@/lib/dates';
import { faNumber, onlyDigits, toman, tomanShort } from '@/lib/format';
import { formatBand } from '@/lib/ielts';
import { mobileError } from '@/lib/validation';
import { useApp, useSessionUser } from '@/store/app';
import { bookingScores } from '@/store/selectors';
import type { DiscountCode, Lead, Staff, StaffRole } from '@/types';
import { BarList } from './Dashboard';

const useStaff = () => useSessionUser() as Staff;

export function AdminFinancePage() {
  const s = useApp();
  const me = useStaff();
  const saveDiscount = useApp((st) => st.saveDiscount);
  const [tab, setTab] = useState('invoices');
  const [filter, setFilter] = useState('open');
  const [open, setOpen] = useState(false);
  const [d, setD] = useState<DiscountCode>({ code: '', kind: 'percent', value: 10, scope: 'all', expires: iso(addDays(new Date(), 30)), maxUses: 100, used: 0, active: true });
  const monthAgo = Date.now() - 30 * 86_400_000;
  const payments = s.invoices.flatMap((i) => i.payments.map((p) => ({ p, i }))).sort((a, b) => b.p.at.localeCompare(a.p.at));
  const received = payments.filter(({ p }) => new Date(p.at).getTime() > monthAgo && p.amount > 0).reduce((sum, { p }) => sum + p.amount, 0);
  const refunded = payments.filter(({ p }) => new Date(p.at).getTime() > monthAgo && p.amount < 0).reduce((sum, { p }) => sum - p.amount, 0);
  const receivable = s.invoices.filter((i) => ['unpaid', 'partial', 'overdue'].includes(invoiceState(i))).reduce((sum, i) => sum + balanceOf(i), 0);
  const overdue = s.invoices.filter((i) => invoiceState(i) === 'overdue');
  const invoices = s.invoices.filter((i) => filter === 'all' || (filter === 'open' ? ['unpaid', 'partial', 'overdue'].includes(invoiceState(i)) : invoiceState(i) === filter));
  const payroll = s.teachers.map((t) => {
    const sessions = s.attendance.filter((a) => s.classes.find((c) => c.id === a.classId)?.teacherId === t.id && new Date(a.date).getTime() > monthAgo).length;
    const writing = s.bookings.filter((b) => b.writing?.examinerId === t.id && new Date(b.writing.at).getTime() > monthAgo).length;
    const speaking = s.bookings.filter((b) => b.speaking?.examinerId === t.id && new Date(b.speaking.at).getTime() > monthAgo).length;
    const corrections = s.corrections.filter((c) => c.examinerId === t.id && c.returnedAt && new Date(c.returnedAt).getTime() > monthAgo).length;
    const total = sessions * t.ratePerSession + (writing + speaking + corrections) * 150_000;
    return { t, sessions, writing, speaking, corrections, total };
  });
  const canEdit = me.role !== 'reception';
  return (
    <Page width="wide">
      <PageHeader title="مالی" description="فاکتورها و دریافت‌ها، کدهای تخفیف و حق‌التدریس. همه پرداخت‌ها در یک دفتر ثبت می‌شوند." />
      <div className="grid gap-4">
        <KpiStrip items={[
          { label: 'دریافتی ۳۰ روز (تومان)', value: received, format: tomanShort },
          { label: 'بازپرداخت ۳۰ روز (تومان)', value: refunded, format: tomanShort },
          { label: 'مانده دریافتنی (تومان)', value: receivable, format: tomanShort },
          { label: 'فاکتور سررسیدگذشته', value: overdue.length, tone: overdue.length ? 'danger' : 'default', hint: overdue.length ? toman(overdue.reduce((sum, i) => sum + balanceOf(i), 0)) : undefined },
        ]} />
        <Tabs selectedKey={tab} onSelectionChange={(k) => setTab(String(k))} variant="secondary">
          <Tabs.ListContainer>
            <Tabs.List aria-label="بخش‌های مالی" className="mb-4">
              <Tabs.Tab id="invoices">فاکتورها<Tabs.Indicator /></Tabs.Tab>
              <Tabs.Tab id="ledger">دفتر دریافت و پرداخت<Tabs.Indicator /></Tabs.Tab>
              {canEdit ? <Tabs.Tab id="discounts">کدهای تخفیف<Tabs.Indicator /></Tabs.Tab> : null}
              {canEdit ? <Tabs.Tab id="payroll">حق‌التدریس<Tabs.Indicator /></Tabs.Tab> : null}
            </Tabs.List>
          </Tabs.ListContainer>
          <Tabs.Panel id="invoices" className="grid gap-3">
            <Segmented label="فیلتر" value={filter} onChange={setFilter} fullWidth={false} className="self-start" options={[{ id: 'open', label: 'باز' }, { id: 'overdue', label: 'سررسیدگذشته' }, { id: 'paid', label: 'تسویه' }, { id: 'refunded', label: 'بازپرداخت' }, { id: 'all', label: 'همه' }]} />
            <InvoiceList invoices={invoices} staff showStudent />
          </Tabs.Panel>
          <Tabs.Panel id="ledger">
            <DataTable label="دفتر" rows={payments.slice(0, 150)} getId={({ p }) => p.id} minWidth={860}
              columns={[
                { key: 'at', label: 'زمان', render: ({ p }) => <span className="text-[13px]">{formatDateTime(p.at)}</span> },
                { key: 'inv', label: 'فاکتور', render: ({ i }) => <span className="tabular">{i.code}</span> },
                { key: 'who', label: 'زبان‌آموز', render: ({ i }) => s.students.find((x) => x.id === i.studentId)?.name },
                { key: 'title', label: 'شرح', render: ({ i }) => <span className="text-[13px]">{i.title}</span> },
                { key: 'method', label: 'روش', render: ({ p }) => METHOD_LABEL[p.method] },
                { key: 'ref', label: 'مرجع', render: ({ p }) => <bdi className="tabular text-xs">{p.ref}</bdi> },
                { key: 'amount', label: 'مبلغ', render: ({ p }) => <span className={p.amount < 0 ? 'font-semibold text-danger tabular' : 'font-semibold tabular'}>{p.amount < 0 ? `−${toman(-p.amount)}` : toman(p.amount)}</span> },
              ]} />
          </Tabs.Panel>
          <Tabs.Panel id="discounts">
            <DataTable label="کدهای تخفیف" rows={s.discounts} getId={(x) => x.code} header={<Button size="sm" onPress={() => setOpen(true)}><Plus />کد جدید</Button>}
              columns={[
                { key: 'code', label: 'کد', render: (x) => <span className="ltr font-bold">{x.code}</span> },
                { key: 'value', label: 'مقدار', render: (x) => (x.kind === 'percent' ? `${faNumber(x.value)}٪` : toman(x.value)) },
                { key: 'scope', label: 'برای', render: (x) => ({ all: 'همه', mock: 'آزمون ماک', courses: 'شهریه کلاس', correction: 'تصحیح' })[x.scope] },
                { key: 'used', label: 'استفاده', render: (x) => <span className="tabular">{faNumber(x.used)} / {faNumber(x.maxUses)}</span> },
                { key: 'exp', label: 'انقضا', render: (x) => <span className={new Date(x.expires).getTime() < Date.now() ? 'text-danger' : ''}>{formatDay(x.expires)}</span> },
                { key: 'active', label: 'فعال', render: (x) => <Switch size="sm" isSelected={x.active} onChange={(v) => saveDiscount({ ...x, active: v }, me.id)} aria-label={`فعال بودن ${x.code}`}><Switch.Control><Switch.Thumb /></Switch.Control></Switch> },
              ]} />
          </Tabs.Panel>
          <Tabs.Panel id="payroll">
            <DataTable label="حق‌التدریس" rows={payroll} getId={(r) => r.t.id} minWidth={860}
              footer={<p className="border-t border-separator px-5 py-3 text-xs text-muted">جلسه‌ها از حضور و غیاب ثبت‌شده ۳۰ روز گذشته؛ هر تصحیح (رایتینگ، اسپیکینگ، خدمات تصحیح) {toman(150_000)}. پس از تأیید، در لیست حقوق ماه ثبت می‌شود.</p>}
              columns={[
                { key: 'name', label: 'استاد', render: (r) => r.t.name },
                { key: 'sessions', label: 'جلسه تدریس', render: (r) => <span className="tabular">{faNumber(r.sessions)} × {toman(r.t.ratePerSession)}</span> },
                { key: 'grading', label: 'تصحیح', render: (r) => <span className="text-[13px]">{faNumber(r.writing)} رایتینگ · {faNumber(r.speaking)} اسپیکینگ · {faNumber(r.corrections)} متن</span> },
                { key: 'total', label: 'جمع', render: (r) => <span className="font-bold tabular">{toman(r.total)}</span> },
              ]} />
          </Tabs.Panel>
        </Tabs>
      </div>
      <FormDialog isOpen={open} onOpenChange={setOpen} title="کد تخفیف جدید" footer={<><Button variant="tertiary" slot="close">انصراف</Button><Button isDisabled={!/^[A-Z0-9]{4,16}$/.test(d.code) || s.discounts.some((x) => x.code === d.code)} onPress={() => { saveDiscount(d, me.id); setOpen(false); toast.success('کد تخفیف ساخته شد'); }}>ذخیره</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="کد" value={d.code} onChange={(v) => setD({ ...d, code: v.toUpperCase().replace(/[^A-Z0-9]/g, '') })} ltr description="۴ تا ۱۶ حرف لاتین یا عدد" error={s.discounts.some((x) => x.code === d.code) ? 'این کد وجود دارد.' : ''} />
          <SelectField label="نوع" value={d.kind} onChange={(v) => setD({ ...d, kind: v as DiscountCode['kind'] })} options={[{ id: 'percent', label: 'درصدی' }, { id: 'amount', label: 'مبلغ ثابت' }]} />
          <NumberInput label={d.kind === 'percent' ? 'درصد' : 'مبلغ (تومان)'} value={d.value} onChange={(v) => setD({ ...d, value: v })} min={1} max={d.kind === 'percent' ? 100 : 50_000_000} step={d.kind === 'percent' ? 5 : 100_000} />
          <SelectField label="برای" value={d.scope} onChange={(v) => setD({ ...d, scope: v as DiscountCode['scope'] })} options={[{ id: 'all', label: 'همه خریدها' }, { id: 'mock', label: 'آزمون ماک' }, { id: 'courses', label: 'شهریه کلاس' }, { id: 'correction', label: 'خدمات تصحیح' }]} />
          <NumberInput label="سقف استفاده" value={d.maxUses} onChange={(v) => setD({ ...d, maxUses: v })} min={1} max={10_000} />
          <SelectField label="انقضا" value={d.expires.slice(0, 10)} onChange={(v) => setD({ ...d, expires: iso(new Date(v)) })} options={[7, 14, 30, 60, 90].map((n) => { const date = addDays(new Date(), n); return { id: iso(date).slice(0, 10), label: formatDay(date) }; })} />
        </div>
      </FormDialog>
    </Page>
  );
}

export function AdminApprovalsPage() {
  const s = useApp();
  const me = useStaff();
  const decide = useApp((st) => st.decideApproval);
  const [tab, setTab] = useState('pending');
  const [target, setTarget] = useState<{ id: string; decision: 'approved' | 'rejected' } | null>(null);
  const [note, setNote] = useState('');
  const canDecide = (kind: string) => me.role === 'manager' || (me.role === 'finance' && (kind === 'refund' || kind === 'discount'));
  const rows = s.approvals.filter((a) => (tab === 'pending' ? a.status === 'pending' : a.status !== 'pending'));
  const current = s.approvals.find((a) => a.id === target?.id);
  return (
    <Page width="wide">
      <PageHeader title="صندوق تأییدها" description="بازپرداخت، تخفیف ویژه، انتقال کلاس، مرخصی استاد و بازبینی نمره؛ همه در یک صندوق. هیچ‌کس درخواست خودش را تأیید نمی‌کند." />
      <Tabs selectedKey={tab} onSelectionChange={(k) => setTab(String(k))} variant="secondary">
        <Tabs.ListContainer><Tabs.List aria-label="وضعیت" className="mb-4"><Tabs.Tab id="pending">در انتظار ({faNumber(s.approvals.filter((a) => a.status === 'pending').length)})<Tabs.Indicator /></Tabs.Tab><Tabs.Tab id="done">بررسی‌شده<Tabs.Indicator /></Tabs.Tab></Tabs.List></Tabs.ListContainer>
      </Tabs>
      {rows.length ? (
        <div className="grid gap-3">
          {rows.map((a) => (
            <Card key={a.id} className="gap-3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><Chip size="sm" variant="soft">{APPROVAL_KIND[a.kind]}</Chip><span className="font-bold">{a.title}</span></div>
                  <p className="mt-1.5 text-[13.5px] leading-6 text-ink-2">{a.detail}</p>
                  <div className="mt-1 text-xs text-muted">{a.requester} · {relativeTime(a.createdAt)}{a.amount ? ` · ${toman(a.amount)}` : ''}</div>
                </div>
                {a.status === 'pending' ? (
                  canDecide(a.kind) && a.requester !== me.name ? (
                    <div className="flex gap-2"><Button size="sm" variant="secondary" onPress={() => { setTarget({ id: a.id, decision: 'rejected' }); setNote(''); }}>رد</Button><Button size="sm" onPress={() => { setTarget({ id: a.id, decision: 'approved' }); setNote(''); }}>تأیید</Button></div>
                  ) : <span className="text-xs text-muted">{a.requester === me.name ? 'درخواست خودتان' : 'نیاز به تأیید مدیر'}</span>
                ) : <div className="text-end"><MetaChip meta={APPROVAL_META[a.status]} /><div className="mt-1 text-xs text-muted">{a.decidedBy} · {a.decidedAt ? formatDay(a.decidedAt) : ''}</div>{a.note ? <div className="text-xs text-ink-2">{a.note}</div> : null}</div>}
              </div>
            </Card>
          ))}
        </div>
      ) : <Card><Empty icon={ShieldCheck} title={tab === 'pending' ? 'درخواستی در انتظار نیست' : 'هنوز درخواستی بررسی نشده است'} /></Card>}
      <FormDialog isOpen={Boolean(target)} onOpenChange={(o) => !o && setTarget(null)} title={target?.decision === 'approved' ? 'تأیید درخواست' : 'رد درخواست'} description={current?.title}
        footer={<><Button variant="tertiary" slot="close">انصراف</Button><Button variant={target?.decision === 'rejected' ? 'danger' : 'primary'} isDisabled={target?.decision === 'rejected' && note.trim().length < 3} onPress={() => { decide(target!.id, target!.decision, note.trim(), me.id); setTarget(null); toast.success(target!.decision === 'approved' ? 'تأیید شد' : 'رد شد'); }}>{target?.decision === 'approved' ? 'تأیید' : 'رد درخواست'}</Button></>}>
        <TextAreaField label={target?.decision === 'rejected' ? 'دلیل (به درخواست‌دهنده نمایش داده می‌شود)' : 'یادداشت (اختیاری)'} value={note} onChange={setNote} rows={3} />
        {current?.kind === 'refund' && target?.decision === 'approved' ? <p className="mt-2 text-[13px] text-muted">مبلغ {toman(current.amount ?? 0)} در دفتر مالی به‌عنوان بازپرداخت ثبت می‌شود.</p> : null}
        {current?.kind === 'remark' && target?.decision === 'approved' ? <p className="mt-2 text-[13px] text-muted">برگه بدون نمره قبلی به ممتحن دیگری سپرده می‌شود.</p> : null}
      </FormDialog>
    </Page>
  );
}

export function AdminLeadsPage() {
  const s = useApp();
  const me = useStaff();
  const update = useApp((st) => st.updateLead);
  const [kind, setKind] = useState('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const rows = s.leads.filter((l) => kind === 'all' || l.kind === kind).sort((a, b) => Number(b.status === 'new') - Number(a.status === 'new') || b.createdAt.localeCompare(a.createdAt));
  const open = s.leads.find((l) => l.id === openId);
  return (
    <Page width="wide">
      <PageHeader title="درخواست‌های سایت" description="فرم‌های تماس، دوره سازمانی، TTC، کلاس خصوصی و تعیین سطح حضوری." />
      <DataTable label="درخواست‌ها" rows={rows} getId={(l) => l.id} onAction={(l) => { setOpenId(l.id); setNote(''); }} minWidth={860}
        header={<SelectField label="نوع" hideLabel value={kind} onChange={setKind} options={[{ id: 'all', label: 'همه انواع' }, ...Object.entries(LEAD_KIND).map(([id, label]) => ({ id, label }))]} className="w-52" />}
        columns={[
          { key: 'name', label: 'درخواست‌دهنده', render: (l) => <PersonCell name={l.name} sub={l.company ?? l.mobile} /> },
          { key: 'kind', label: 'نوع', render: (l) => <Chip size="sm" variant="soft">{LEAD_KIND[l.kind]}</Chip> },
          { key: 'msg', label: 'پیام', render: (l) => <span className="line-clamp-1 max-w-[320px] text-[13px] text-ink-2">{l.message}</span> },
          { key: 'status', label: 'وضعیت', render: (l) => <MetaChip meta={LEAD_META[l.status]} /> },
          { key: 'at', label: 'زمان', render: (l) => <span className="text-xs text-muted">{relativeTime(l.createdAt)}</span> },
        ]} />
      <FormDialog isOpen={Boolean(open)} onOpenChange={(o) => !o && setOpenId(null)} size="lg" title={open?.name ?? ''} description={open ? `${LEAD_KIND[open.kind]} · ${open.mobile}${open.company ? ` · ${open.company}` : ''}` : ''} footer={<Button slot="close">بستن</Button>}>
        {open ? (
          <div className="grid gap-4">
            <p className="text-[14px] leading-7">{open.message}</p>
            {open.data ? <dl className="grid grid-cols-2 gap-2 text-[13px]">{Object.entries(open.data).map(([k, v]) => <div key={k}><dt className="text-muted">{k}</dt><dd className="font-semibold">{v}</dd></div>)}</dl> : null}
            <Segmented label="وضعیت" value={open.status} onChange={(v) => update(open.id, { status: v as Lead['status'] }, { by: me.name, text: `وضعیت: ${LEAD_META[v as Lead['status']].label}` })} options={(Object.keys(LEAD_META) as Lead['status'][]).map((k) => ({ id: k, label: LEAD_META[k].label }))} />
            <div className="grid gap-2">
              {open.notes.map((n, i) => <div key={i} className="rounded-lg bg-surface-secondary px-3 py-2 text-[13px]"><span className="font-semibold">{n.by}</span> · <span className="text-muted">{relativeTime(n.at)}</span><div>{n.text}</div></div>)}
            </div>
            <div className="flex items-end gap-2"><TextInput label="یادداشت پیگیری" value={note} onChange={setNote} className="flex-1" /><Button variant="secondary" isDisabled={!note.trim()} onPress={() => { update(open.id, {}, { by: me.name, text: note.trim() }); setNote(''); }}>افزودن</Button></div>
          </div>
        ) : null}
      </FormDialog>
    </Page>
  );
}

export function AdminReportsPage() {
  const s = useApp();
  const data = useMemo(() => {
    const released = s.bookings.filter((b) => b.status === 'released').map((b) => bookingScores(b, s.mockSessions.find((m) => m.id === b.sessionId)));
    const avg = (key: 'listening' | 'reading' | 'writing' | 'speaking' | 'overall') => { const vals = released.map((r) => (key === 'listening' || key === 'reading' ? r[key]?.band : r[key])).filter((v): v is number => v != null); return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0; };
    const bySession = s.mockSessions.filter((m) => !m.cancelled).map((m) => ({ label: m.title, value: s.bookings.filter((b) => b.sessionId === m.id && ['confirmed', 'in_progress', 'awaiting_grading', 'graded', 'released', 'no_show'].includes(b.status)).length }));
    const fill = s.classes.filter((c) => s.terms.find((t) => t.id === c.termId)?.title.includes('زمستان')).map((c) => ({ label: c.code, value: s.enrollments.filter((e) => e.classId === c.id && ['confirmed', 'held'].includes(e.status)).length, hint: `از ${faNumber(c.capacity)}` }));
    const absences = s.students.map((st) => ({ label: st.name, value: s.attendance.filter((a) => a.marks[st.id] === 'absent').length })).filter((r) => r.value >= 2).sort((a, b) => b.value - a.value).slice(0, 8);
    return { released: released.length, skills: (['listening', 'reading', 'writing', 'speaking', 'overall'] as const).map((k) => ({ label: k === 'overall' ? 'Overall' : k[0].toUpperCase() + k.slice(1), value: Math.round(avg(k) * 10) / 10 })), bySession, fill, absences };
  }, [s]);
  return (
    <Page width="wide">
      <PageHeader title="گزارش‌ها" description="نمای کلی آزمون‌های ماک، پرشدن کلاس‌ها و غیبت‌ها. خروجی Excel و PDF در نسخه واقعی." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="میانگین نمره مهارت‌ها" description={`${faNumber(data.released)} نتیجه منتشرشده`}><BarList rows={data.skills} format={(n) => formatBand(n)} tone="success" /></Section>
        <Section title="شرکت‌کننده هر جلسه ماک"><BarList rows={data.bySession} /></Section>
        <Section title="پرشدن کلاس‌های ترم زمستان"><BarList rows={data.fill} /></Section>
        <Section title="بیشترین غیبت"><BarList rows={data.absences} tone="warning" /></Section>
      </div>
    </Page>
  );
}

export function AdminAuditPage() {
  const audit = useApp((s) => s.audit);
  return (
    <Page width="wide">
      <PageHeader title="لاگ ممیزی" description="هر تغییر مهم با زمان و نام کاربر ثبت می‌شود و قابل حذف نیست." />
      <DataTable label="لاگ" rows={audit.slice(0, 200)} getId={(a) => a.id}
        columns={[
          { key: 'at', label: 'زمان', render: (a) => <span className="text-[13px]">{formatDateTime(a.at)}</span> },
          { key: 'actor', label: 'کاربر', render: (a) => a.actor },
          { key: 'action', label: 'کار', render: (a) => a.action },
          { key: 'target', label: 'مورد', render: (a) => <span className="text-[13px] text-ink-2">{a.target ?? '—'}</span> },
        ]} />
    </Page>
  );
}

export function AdminUsersPage() {
  const s = useApp();
  const me = useStaff();
  const saveStaff = useApp((st) => st.saveStaff);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', mobile: '', nationalId: '', role: 'reception' as StaffRole });
  const err = form.name.trim().length < 3 || mobileError(form.mobile);
  return (
    <Page width="wide">
      <PageHeader title="کاربران و نقش‌ها" description="مدیر همه بخش‌ها را می‌بیند؛ پذیرش و آموزش، ثبت‌نام و آزمون؛ مالی، دفتر مالی و بازپرداخت." actions={<Button onPress={() => setOpen(true)}><Plus />دعوت کاربر</Button>} />
      <DataTable label="کاربران" rows={s.staff} getId={(u) => u.id}
        columns={[
          { key: 'name', label: 'کاربر', render: (u) => <PersonCell name={u.name} sub={<bdi className="tabular">{u.mobile}</bdi>} /> },
          { key: 'role', label: 'نقش', render: (u) => (u.id === me.id ? STAFF_ROLE_LABEL[u.role] : <SelectField label="نقش" hideLabel value={u.role} onChange={(v) => saveStaff({ ...u, role: v as StaffRole }, me.id)} options={(Object.keys(STAFF_ROLE_LABEL) as StaffRole[]).map((r) => ({ id: r, label: STAFF_ROLE_LABEL[r] }))} className="w-44" />) },
          { key: 'status', label: 'وضعیت', render: (u) => <ToneChip tone={u.status === 'active' ? 'success' : u.status === 'invited' ? 'warning' : 'default'}>{({ active: 'فعال', invited: 'دعوت‌شده', disabled: 'غیرفعال' } as const)[u.status]}</ToneChip> },
          { key: 'last', label: 'آخرین فعالیت', render: (u) => <span className="text-xs text-muted">{u.lastActiveAt ? relativeTime(u.lastActiveAt) : '—'}</span> },
          { key: 'act', label: '', render: (u) => (u.id !== me.id ? <Button size="sm" variant="ghost" onPress={() => saveStaff({ ...u, status: u.status === 'disabled' ? 'active' : 'disabled' }, me.id)}>{u.status === 'disabled' ? 'فعال‌سازی' : 'غیرفعال‌سازی'}</Button> : null) },
        ]} />
      <FormDialog isOpen={open} onOpenChange={setOpen} title="دعوت کاربر" description="پیامک دعوت با لینک ورود ارسال می‌شود." footer={<><Button variant="tertiary" slot="close">انصراف</Button><Button isDisabled={Boolean(err)} onPress={() => { saveStaff({ name: form.name.trim(), mobile: onlyDigits(form.mobile), nationalId: onlyDigits(form.nationalId), role: form.role }, me.id); setOpen(false); toast.success('دعوت ارسال شد'); }}>ارسال دعوت</Button></>}>
        <div className="grid gap-4">
          <TextInput label="نام" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <TextInput label="موبایل" value={form.mobile} onChange={(v) => setForm({ ...form, mobile: v })} inputMode="tel" maxLength={11} />
          <SelectField label="نقش" value={form.role} onChange={(v) => setForm({ ...form, role: v as StaffRole })} options={(Object.keys(STAFF_ROLE_LABEL) as StaffRole[]).map((r) => ({ id: r, label: STAFF_ROLE_LABEL[r] }))} />
        </div>
      </FormDialog>
    </Page>
  );
}

export function AdminSettingsPage() {
  const s = useApp();
  const me = useStaff();
  const update = useApp((st) => st.updateSettings);
  const [m, setM] = useState(s.settings.mock);
  const [g, setG] = useState(s.settings.grades);
  const [general, setGeneral] = useState({ seatHoldMin: s.settings.seatHoldMin, installmentMin: s.settings.installmentMin, absenceAlert: s.settings.absenceAlert });
  const weights = g.activity + g.homework + g.midterm + g.final;
  const toggle = (label: string, value: boolean, onChange: (v: boolean) => void, hint?: string) => (
    <Switch isSelected={value} onChange={onChange}>
      <Switch.Content className="flex w-full items-center justify-between gap-3"><span><span className="block text-sm">{label}</span>{hint ? <span className="block text-xs text-muted">{hint}</span> : null}</span><Switch.Control><Switch.Thumb /></Switch.Control></Switch.Content>
    </Switch>
  );
  return (
    <Page>
      <PageHeader title="تنظیمات" description="قانون‌هایی که همه بخش‌ها از آن پیروی می‌کنند." actions={<Button isDisabled={weights !== 100} onPress={() => { update({ mock: m, grades: g, ...general }, me.id); toast.success('تنظیمات ذخیره شد'); }}>ذخیره تغییرات</Button>} />
      <div className="grid gap-4">
        <Section title="آزمون ماک">
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberInput label="Listening (دقیقه)" value={m.listeningMin} onChange={(v) => setM({ ...m, listeningMin: v })} min={5} max={40} />
            <NumberInput label="Reading (دقیقه)" value={m.readingMin} onChange={(v) => setM({ ...m, readingMin: v })} min={10} max={60} />
            <NumberInput label="Writing (دقیقه)" value={m.writingMin} onChange={(v) => setM({ ...m, writingMin: v })} min={10} max={60} />
            <NumberInput label="مهلت اتصال دوباره (دقیقه)" value={m.graceMin} onChange={(v) => setM({ ...m, graceMin: v })} min={1} max={30} />
            <NumberInput label="سقف بازگشت به آزمون" value={m.maxResumes} onChange={(v) => setM({ ...m, maxResumes: v })} min={0} max={5} />
            <SelectField label="زمان در قطع اتصال" value={m.timerOnDisconnect} onChange={(v) => setM({ ...m, timerOnDisconnect: v as 'run' | 'pause' })} options={[{ id: 'run', label: 'ادامه می‌یابد (مثل آزمون واقعی)' }, { id: 'pause', label: 'متوقف می‌شود' }]} />
            <NumberInput label="مهلت لغو (ساعت پیش از آزمون)" value={m.cancelHours} onChange={(v) => setM({ ...m, cancelHours: v })} min={0} max={168} />
            <NumberInput label="درصد بازپرداخت لغو به‌موقع" value={m.refundPercent} onChange={(v) => setM({ ...m, refundPercent: v })} min={0} max={100} step={5} />
            <NumberInput label="هزینه بازبینی (تومان)" value={m.remarkFee} onChange={(v) => setM({ ...m, remarkFee: v })} min={0} step={50_000} />
            <NumberInput label="تصحیح عادی (تومان)" value={m.correctionPrice} onChange={(v) => setM({ ...m, correctionPrice: v })} min={0} step={50_000} />
            <NumberInput label="تصحیح فوری (تومان)" value={m.correctionExpressPrice} onChange={(v) => setM({ ...m, correctionExpressPrice: v })} min={0} step={50_000} />
          </div>
          <div className="mt-5 grid gap-3">
            {toggle('یک پنجره در هر زمان', m.singleSession, (v) => setM({ ...m, singleSession: v }), 'با باز شدن آزمون در پنجره دیگر، پنجره قبلی قفل می‌شود.')}
            {toggle('نمایش فوری نمره لیسنینگ و ریدینگ', m.instantLR, (v) => setM({ ...m, instantLR: v }), 'بلافاصله پس از ثبت آزمون کتبی.')}
            {toggle('انتشار خودکار نتیجه پس از تصحیح کامل', m.autoRelease, (v) => setM({ ...m, autoRelease: v }), 'خاموش: مدیر نتیجه‌ها را بازبینی و منتشر می‌کند.')}
          </div>
        </Section>
        <Section title="ارزشیابی کلاس‌ها" description={weights !== 100 ? `جمع وزن‌ها باید ۱۰۰ باشد (اکنون ${faNumber(weights)}).` : 'جمع وزن‌ها ۱۰۰ است.'}>
          <div className="grid gap-4 sm:grid-cols-5">
            <NumberInput label="فعالیت" value={g.activity} onChange={(v) => setG({ ...g, activity: v })} min={0} max={100} />
            <NumberInput label="تکلیف" value={g.homework} onChange={(v) => setG({ ...g, homework: v })} min={0} max={100} />
            <NumberInput label="میان‌ترم" value={g.midterm} onChange={(v) => setG({ ...g, midterm: v })} min={0} max={100} />
            <NumberInput label="پایان‌ترم" value={g.final} onChange={(v) => setG({ ...g, final: v })} min={0} max={100} />
            <NumberInput label="حد قبولی" value={g.pass} onChange={(v) => setG({ ...g, pass: v })} min={0} max={100} />
          </div>
          {weights !== 100 ? <Alert status="warning" className="mt-3"><Alert.Content><Alert.Description>تا جمع وزن‌ها ۱۰۰ نشود، ذخیره ممکن نیست.</Alert.Description></Alert.Content></Alert> : null}
        </Section>
        <Section title="ثبت‌نام و پرداخت">
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberInput label="نگه‌داشتن صندلی (دقیقه)" value={general.seatHoldMin} onChange={(v) => setGeneral({ ...general, seatHoldMin: v })} min={5} max={60} />
            <NumberInput label="حداقل مبلغ قسطی (تومان)" value={general.installmentMin} onChange={(v) => setGeneral({ ...general, installmentMin: v })} min={0} step={500_000} />
            <NumberInput label="هشدار غیبت (تعداد)" value={general.absenceAlert} onChange={(v) => setGeneral({ ...general, absenceAlert: v })} min={1} max={10} />
          </div>
        </Section>
      </div>
    </Page>
  );
}
