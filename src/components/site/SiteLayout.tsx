import { Bars, ChevronDown, Handset, LogoTelegram, MapPin, PaperPlane, Xmark } from '@gravity-ui/icons';
import { Button, cn, Drawer, Link, Popover } from '@heroui/react';
import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { Logo } from '@/components/Logo';
import { PrototypeMenu } from '@/components/shell/PrototypeMenu';
import { HOME } from '@/components/shell/nav';
import { CONTACT, ONLINE_MENU, SERVICES_MENU } from '@/data/site';

const FOOTER_COURSES: [string, string][] = [
  ['رده سنی کودکان', '/courses/kids'], ['رده سنی نوجوانان', '/courses/teens'], ['رده سنی بزرگسالان', '/courses/adults'],
  ['کلاس‌های آیلتس', '/ielts/course'], ['آزمون آزمایشی آیلتس (ماک)', '/ielts/mock'], ['دوره تربیت مدرس (TTC)', '/specialized/ttc'],
  ['کلاس‌های خصوصی', '/courses/private'], ['کارگاه‌ها', '/workshops'],
];
const FOOTER_QUICK: [string, string][] = [
  ['چرا خانه زبان؟', '/why'], ['تقویم آموزشی', '/calendar'], ['گالری', '/gallery'], ['تیم خانه زبان', '/team'], ['درباره ما', '/about'], ['تماس با ما', '/contact'],
];
import { useApp } from '@/store/app';

function TopLink({ to, children, end }: { to: string; children: ReactNode; end?: boolean }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => cn('rounded-lg px-3 py-2 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus', isActive ? 'text-accent' : 'text-ink-2 hover:text-foreground')}>
      {children}
    </NavLink>
  );
}

function MenuButton({ label, children, wide }: { label: string; children: (close: () => void) => ReactNode; wide?: boolean }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  return (
    <Popover isOpen={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="sm" className="h-9 gap-1 px-3 text-sm font-semibold text-ink-2 data-[pressed=true]:text-foreground">
        {label}
        <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
      </Button>
      <Popover.Content placement="bottom" className={cn(wide ? 'w-[min(920px,94vw)]' : 'w-72')}>
        <Popover.Dialog className="p-0">{children(() => setOpen(false))}</Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

function MenuLink({ to, label, hint, onClick }: { to: string; label: string; hint?: string; onClick: () => void }) {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => { onClick(); navigate(to); }} className="block w-full rounded-lg px-3 py-2 text-start outline-none transition-colors hover:bg-default focus-visible:bg-default">
      <span className="block text-[13.5px] font-semibold text-foreground">{label}</span>
      {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
    </button>
  );
}

function AccountButton() {
  const session = useApp((s) => s.session);
  const navigate = useNavigate();
  return session ? (
    <Button size="sm" variant="secondary" onPress={() => navigate(HOME[session.panel])}>پنل من</Button>
  ) : (
    <Button size="sm" variant="secondary" onPress={() => navigate('/login/student')}>ورود / ثبت‌نام</Button>
  );
}

function MobileMenu() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => setOpen(false), [pathname]);
  const go = (to: string) => { setOpen(false); navigate(to); };
  return (
    <>
      <Button isIconOnly variant="ghost" aria-label="منو" onPress={() => setOpen(true)} className="lg:hidden"><Bars /></Button>
      <Drawer.Backdrop isOpen={open} onOpenChange={setOpen}>
        <Drawer.Content placement="right" className="w-[320px] max-w-[88vw]">
          <Drawer.Dialog aria-label="منوی سایت">
            <Drawer.Body className="p-0">
              <div className="flex items-center justify-between border-b border-separator px-4 py-3">
                <Logo />
                <Button isIconOnly variant="ghost" aria-label="بستن" onPress={() => setOpen(false)}><Xmark /></Button>
              </div>
              <nav className="grid gap-5 px-4 py-5 text-sm">
                <button type="button" className="text-start font-bold" onClick={() => go('/')}>خانه</button>
                {SERVICES_MENU.map((group) => (
                  <div key={group.title}>
                    <div className="mb-1.5 text-xs font-bold text-muted">{group.title}</div>
                    <div className="grid gap-1">
                      {group.links.map((link) => <button key={link.to} type="button" className="py-1 text-start font-semibold" onClick={() => go(link.to)}>{link.label}</button>)}
                    </div>
                  </div>
                ))}
                <button type="button" className="text-start font-bold" onClick={() => go('/team')}>تیم خانه زبان</button>
                <div>
                  <div className="mb-1.5 text-xs font-bold text-muted">خدمات آنلاین</div>
                  <div className="grid gap-1">{ONLINE_MENU.map((link) => <button key={link.to} type="button" className="py-1 text-start font-semibold" onClick={() => go(link.to)}>{link.label}</button>)}</div>
                </div>
                <button type="button" className="text-start font-bold" onClick={() => go('/contact')}>تماس با ما</button>
                <button type="button" className="text-start font-bold" onClick={() => go('/about')}>درباره ما</button>
              </nav>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </>
  );
}

export function SiteHeader() {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur print:hidden">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-1">
          <MobileMenu />
          <NavLink to="/" aria-label="صفحه اصلی KLS School" className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-focus">
            <Logo />
          </NavLink>
        </div>
        <nav aria-label="منوی سایت" className="hidden items-center gap-0.5 lg:flex">
          <TopLink to="/" end>خانه</TopLink>
          <MenuButton label="خدمات آموزشی" wide>
            {(close) => (
              <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-4">
                {SERVICES_MENU.map((group) => (
                  <div key={group.title}>
                    <div className="px-3 pt-1 pb-1.5 text-xs font-bold text-accent">{group.title}</div>
                    {group.links.map((link) => <MenuLink key={link.to} {...link} onClick={close} />)}
                  </div>
                ))}
              </div>
            )}
          </MenuButton>
          <TopLink to="/team">تیم خانه زبان</TopLink>
          <MenuButton label="خدمات آنلاین">
            {(close) => <div className="p-2">{ONLINE_MENU.map((link) => <MenuLink key={link.to} {...link} onClick={close} />)}</div>}
          </MenuButton>
          <TopLink to="/contact">تماس با ما</TopLink>
          <TopLink to="/about">درباره ما</TopLink>
        </nav>
        <div className="flex items-center gap-2">
          <AccountButton />
          <Button size="sm" className="hidden sm:inline-flex" onPress={() => navigate('/ielts/mock')}>رزرو آزمون ماک</Button>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface print:hidden">
      <div className="mx-auto grid max-w-[1240px] gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div className="grid content-start gap-3">
          <Logo />
          <p className="max-w-xs text-[13px] leading-7 text-muted">آموزش زبان انگلیسی برای کودکان، نوجوانان و بزرگسالان، و آمادگی آیلتس در کرمانشاه؛ بیش از ۲۴ سال.</p>
        </div>
        {[['دوره‌ها', FOOTER_COURSES], ['دسترسی سریع', FOOTER_QUICK]].map(([title, links]) => (
          <div key={title as string}>
            <div className="mb-3 text-sm font-bold">{title as string}</div>
            <ul className="grid gap-2 text-[13px]">
              {(links as [string, string][]).map(([label, to]) => <li key={to}><Link href={to} className="text-ink-2 no-underline hover:text-foreground">{label}</Link></li>)}
            </ul>
          </div>
        ))}
        <div>
          <div className="mb-3 text-sm font-bold">تماس</div>
          <ul className="grid gap-2.5 text-[13px] text-ink-2">
            <li className="flex items-center gap-2"><Handset className="size-4 text-ink-3" /><bdi className="tabular">{CONTACT.phone}</bdi></li>
            <li className="flex items-start gap-2"><MapPin className="mt-1 size-4 shrink-0 text-ink-3" />{CONTACT.address}</li>
            <li className="flex items-center gap-2"><PaperPlane className="size-4 text-ink-3" /><bdi className="ltr">{CONTACT.instagram}</bdi> (اینستاگرام)</li>
            <li className="flex items-center gap-2"><LogoTelegram className="size-4 text-ink-3" /><bdi className="ltr">{CONTACT.telegram}</bdi> (تلگرام)</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-separator">
        <div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-2 px-4 py-4 text-xs text-muted sm:px-6">
          <span>© ۱۴۰۵ KLS School · خانه زبان کرمانشاه</span>
          <span>آزمون‌های ماک آموزشگاه، آزمون رسمی IELTS نیستند و مدرک رسمی صادر نمی‌کنند.</span>
          <div className="w-full sm:w-52"><PrototypeMenu inline /></div>
        </div>
      </div>
    </footer>
  );
}

export function SiteLayout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0 }); }, [pathname]);
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <SiteHeader />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
