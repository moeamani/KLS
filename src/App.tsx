import { I18nProvider, RouterProvider as AriaRouterProvider, Toast } from '@heroui/react';
import { MotionConfig } from 'motion/react';
import { createHashRouter, Outlet, useHref, useNavigate } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { AppShell } from '@/components/shell/AppShell';
import { PrototypeBar } from '@/components/shell/PrototypeMenu';
import { SiteLayout } from '@/components/site/SiteLayout';
import { SERVICE_PAGES } from '@/data/site';
import { LoginPage, SwitchPage } from '@/pages/auth/Login';
import { NotFoundPage } from '@/pages/NotFound';
import { HomePage } from '@/pages/site/Home';
import { CorrectionPage, MockPage } from '@/pages/site/Ielts';
import { AboutPage, CalendarPage, ContactPage, FormatsPage, ResourcesPage, ServicePageView, SystemPage } from '@/pages/site/Pages';

function Root() {
  const navigate = useNavigate();
  return (
    <AriaRouterProvider navigate={(to) => navigate(to)} useHref={useHref}>
      <Outlet />
      <PrototypeBar />
      <Toast.Provider placement="bottom" />
    </AriaRouterProvider>
  );
}

const Soon = () => <div className="p-10 text-muted">به‌زودی</div>;

const router = createHashRouter([
  {
    element: <Root />,
    children: [
      {
        element: <SiteLayout />,
        children: [
          { index: true, element: <HomePage /> },
          ...SERVICE_PAGES.map((page) => ({ path: page.path.slice(1), element: <ServicePageView /> })),
          { path: 'ielts/mock', element: <MockPage /> },
          { path: 'ielts/correction', element: <CorrectionPage /> },
          { path: 'calendar', element: <CalendarPage /> },
          { path: 'system', element: <SystemPage /> },
          { path: 'formats', element: <FormatsPage /> },
          { path: 'resources', element: <ResourcesPage /> },
          { path: 'contact', element: <ContactPage /> },
          { path: 'about', element: <AboutPage /> },
        ],
      },
      { path: 'login/:panel', element: <LoginPage /> },
      { path: 'switch/:who', element: <SwitchPage /> },
      { path: 'portal', element: <AppShell panel="student" />, children: [{ path: '*', element: <Soon /> }, { index: true, element: <Soon /> }] },
      { path: 'parent', element: <AppShell panel="parent" />, children: [{ path: '*', element: <Soon /> }, { index: true, element: <Soon /> }] },
      { path: 'teacher', element: <AppShell panel="teacher" />, children: [{ path: '*', element: <Soon /> }, { index: true, element: <Soon /> }] },
      { path: 'admin', element: <AppShell panel="admin" />, children: [{ path: '*', element: <Soon /> }, { index: true, element: <Soon /> }] },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function App() {
  return (
    <I18nProvider locale="fa-IR">
      <MotionConfig reducedMotion="user">
        <RouterProvider router={router} />
      </MotionConfig>
    </I18nProvider>
  );
}
