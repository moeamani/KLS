import { Bars } from '@gravity-ui/icons';
import { Button, Drawer } from '@heroui/react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Navigate, useLocation, useOutlet } from 'react-router';
import { EASE } from '@/components/motion';
import { Logo } from '@/components/Logo';
import { PANEL_LABEL } from '@/data/status';
import { useApp } from '@/store/app';
import { useUi } from '@/store/ui';
import type { Panel } from '@/types';
import { PrototypeMenu } from './PrototypeMenu';
import { Notifications, Sidebar, SidebarNav, UserMenu } from './Sidebar';

function MobileBar({ panel }: { panel: Panel }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  return (
    <div className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-surface/90 px-3 backdrop-blur lg:hidden print:hidden">
      <div className="flex items-center gap-1">
        <Button isIconOnly variant="ghost" aria-label="باز کردن منو" onPress={() => setOpen(true)}>
          <Bars />
        </Button>
        <Logo compact />
      </div>
      <div className="flex items-center gap-1">
        <Notifications />
        <UserMenu panel={panel} compact />
      </div>
      <Drawer.Backdrop isOpen={open} onOpenChange={setOpen}>
        <Drawer.Content placement="right" className="w-[290px] max-w-[85vw]">
          <Drawer.Dialog aria-label="منوی اصلی" className="bg-canvas">
            <Drawer.Body className="p-0">
              <div className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-5">
                <Logo caption={PANEL_LABEL[panel]} className="px-2" />
                <SidebarNav panel={panel} onNavigate={() => setOpen(false)} />
                <div className="mt-auto"><PrototypeMenu inline /></div>
              </div>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </div>
  );
}

/** Signed-in layout for one panel: sidebar on the canvas, page on an inset surface. */
export function AppShell({ panel }: { panel: Panel }) {
  const session = useApp((s) => s.session);
  const focusMode = useUi((s) => s.focusMode);
  const location = useLocation();
  const outlet = useOutlet();
  useEffect(() => { window.scrollTo({ top: 0 }); }, [location.pathname]);
  if (!session || session.panel !== panel) return <Navigate to={`/login/${panel}`} replace state={{ from: location.pathname }} />;
  if (focusMode) return <>{outlet}</>;
  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[264px_minmax(0,1fr)] print:block print:bg-surface">
      <aside className="sticky top-0 hidden h-dvh lg:block print:hidden">
        <Sidebar panel={panel} />
      </aside>
      <div className="min-w-0 lg:py-2 lg:pe-2 print:p-0">
        <MobileBar panel={panel} />
        <main id="main" className="min-h-[calc(100dvh-3.5rem)] bg-surface lg:min-h-[calc(100dvh-1rem)] lg:rounded-2xl lg:border lg:border-border lg:shadow-[0_1px_2px_rgb(12_17_23/0.04)] print:border-0 print:shadow-none">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: EASE }}>
            {outlet}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
