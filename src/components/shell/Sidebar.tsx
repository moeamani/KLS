import { ArrowRightFromSquare, Bell, ChevronsExpandVertical } from '@gravity-ui/icons';
import { Button, cn, Dropdown, Label, Popover, toast } from '@heroui/react';
import { LayoutGroup, motion } from 'motion/react';
import { Fragment, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { Logo } from '@/components/Logo';
import { PersonAvatar } from '@/components/ui/Person';
import { balanceOf, invoiceState, PANEL_LABEL, STAFF_ROLE_LABEL } from '@/data/status';
import { relativeTime } from '@/lib/dates';
import { faNumber } from '@/lib/format';
import { useApp, useSessionUser } from '@/store/app';
import type { Panel, Staff } from '@/types';
import { canSee, NAV, type BadgeKey } from './nav';
import { PrototypeMenu } from './PrototypeMenu';

function useBadges(): Record<BadgeKey, number> {
  const s = useApp();
  const session = s.session;
  return useMemo(() => {
    const userId = session?.userId ?? '';
    const familyIds = session?.panel === 'parent' ? s.parents.find((p) => p.id === userId)?.childIds ?? [] : [userId];
    return {
      unpaid: s.invoices.filter((inv) => familyIds.includes(inv.studentId) && balanceOf(inv) > 0 && ['unpaid', 'partial', 'overdue'].includes(invoiceState(inv)) && inv.ref.kind !== 'remark').length,
      grading:
        s.bookings.filter((b) => b.writingExaminerId === userId && !b.writing && b.status === 'awaiting_grading').length +
        s.bookings.filter((b) => b.remark?.status === 'approved' && b.remark.examinerId === userId).length +
        s.corrections.filter((c) => c.examinerId === userId && c.status === 'in_review').length,
      approvals: s.approvals.filter((a) => a.status === 'pending').length,
      leads: s.leads.filter((l) => l.status === 'new').length,
      toRelease: s.bookings.filter((b) => b.status === 'graded').length,
      corrections: s.corrections.filter((c) => c.status === 'submitted').length,
    };
  }, [s, session]);
}

export function SidebarNav({ panel, onNavigate }: { panel: Panel; onNavigate?: () => void }) {
  const badges = useBadges();
  const user = useSessionUser();
  const role = panel === 'admin' ? (user as Staff | undefined)?.role : undefined;
  const items = NAV[panel].filter((item) => canSee(item, role));
  return (
    <LayoutGroup id={`nav-${panel}`}>
      <nav aria-label="منوی اصلی" className="grid gap-0.5">
        {items.map((item, index) => {
          const count = item.badge ? badges[item.badge] : 0;
          const showGroup = item.group && item.group !== items[index - 1]?.group;
          return (
            <Fragment key={item.to}>
              {showGroup ? <div className="px-3 pt-4 pb-1 text-[11px] font-bold text-ink-3">{item.group}</div> : null}
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) => cn('relative flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus', isActive ? 'text-foreground' : 'text-ink-2 hover:bg-black/[0.04] hover:text-foreground')}
              >
                {({ isActive }) => (
                  <>
                    {isActive ? <motion.span layoutId="nav-active" className="absolute inset-0 rounded-[10px] border border-border bg-surface shadow-[0_1px_2px_rgb(12_17_23/0.05)]" transition={{ type: 'spring', stiffness: 520, damping: 40 }} /> : null}
                    <item.icon className={cn('relative size-4 shrink-0', isActive ? 'text-accent' : 'text-ink-3')} />
                    <span className="relative flex-1 truncate">{item.label}</span>
                    {count ? <span className="relative min-w-5 rounded-full bg-warning-soft px-1.5 text-center text-[11px] leading-5 font-bold text-warning-soft-foreground tabular" aria-label={`${faNumber(count)} مورد`}>{faNumber(count)}</span> : null}
                  </>
                )}
              </NavLink>
            </Fragment>
          );
        })}
      </nav>
    </LayoutGroup>
  );
}

export function Notifications() {
  const session = useApp((s) => s.session);
  const allNotices = useApp((s) => s.notices);
  const markRead = useApp((s) => s.markRead);
  const navigate = useNavigate();
  const notices = allNotices.filter((n) => n.to === session?.userId).slice(0, 12);
  const unread = notices.filter((n) => !n.read).length;
  return (
    <Popover onOpenChange={(open) => !open && session && markRead(session.userId)}>
      <Button isIconOnly variant="ghost" aria-label={unread ? `اعلان‌ها، ${faNumber(unread)} خوانده‌نشده` : 'اعلان‌ها'} className="relative">
        <Bell />
        {unread ? <span className="absolute top-1.5 end-1.5 size-2 rounded-full bg-danger ring-2 ring-surface" /> : null}
      </Button>
      <Popover.Content placement="bottom end" className="w-[340px] max-w-[92vw]">
        <Popover.Dialog className="p-0">
          <div className="border-b border-separator px-4 py-3 text-sm font-bold">اعلان‌ها</div>
          {notices.length ? (
            <ul className="max-h-[380px] overflow-y-auto">
              {notices.map((n) => (
                <li key={n.id}>
                  <button type="button" onClick={() => n.href && navigate(n.href)} className="flex w-full gap-3 px-4 py-3 text-start outline-none hover:bg-default focus-visible:bg-default">
                    <span className={cn('mt-2 size-1.5 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-accent')} />
                    <span className="min-w-0">
                      <span className="block text-[13px] leading-6 font-semibold">{n.title}</span>
                      {n.body ? <span className="block text-xs leading-5 text-muted">{n.body}</span> : null}
                      <span className="block text-[11px] text-ink-3">{relativeTime(n.at)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-8 text-center text-[13px] text-muted">اعلان تازه‌ای ندارید.</div>
          )}
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

export function UserMenu({ panel, compact = false }: { panel: Panel; compact?: boolean }) {
  const user = useSessionUser();
  const logout = useApp((s) => s.logout);
  const navigate = useNavigate();
  if (!user) return null;
  const subtitle = panel === 'admin' ? STAFF_ROLE_LABEL[(user as Staff).role] : PANEL_LABEL[panel];
  const signOut = () => {
    logout();
    navigate('/');
    toast('از حساب کاربری خارج شدید');
  };
  return (
    <Dropdown>
      <Dropdown.Trigger aria-label="حساب کاربری" className={cn('flex w-full items-center gap-2.5 rounded-[10px] text-start outline-none transition-colors hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-focus', compact ? 'p-1' : 'p-2')}>
        <PersonAvatar name={user.name} />
        {compact ? null : (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{user.name}</span>
              <span className="block truncate text-xs text-muted">{subtitle}</span>
            </span>
            <ChevronsExpandVertical className="size-3.5 shrink-0 text-ink-3" />
          </>
        )}
      </Dropdown.Trigger>
      <Dropdown.Popover placement={compact ? 'bottom end' : 'top'} className="min-w-56">
        <div className="px-3 pt-2.5 pb-1.5">
          <div className="text-sm font-semibold">{user.name}</div>
          <div className="text-xs text-muted">{PANEL_LABEL[panel]}</div>
        </div>
        <Dropdown.Menu aria-label="حساب کاربری" onAction={(key) => key === 'logout' && signOut()}>
          <Dropdown.Item id="logout" textValue="خروج از حساب" variant="danger">
            <ArrowRightFromSquare className="size-4" />
            <Label>خروج از حساب</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

export function Sidebar({ panel }: { panel: Panel }) {
  return (
    <div className="flex h-full flex-col gap-4 px-3 py-5">
      <div className="flex items-center justify-between gap-2 px-2">
        <Logo caption={PANEL_LABEL[panel]} />
        <Notifications />
      </div>
      <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
        <SidebarNav panel={panel} />
      </div>
      <div className="grid gap-3 border-t border-border pt-3">
        <PrototypeMenu inline />
        <UserMenu panel={panel} />
      </div>
    </div>
  );
}
