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
import { ParentEnrollPage, ParentHome, ParentPaymentsPage } from '@/pages/parent/Parent';
import { StudentCorrectionNewPage, StudentCorrectionPage, StudentCorrectionsPage } from '@/pages/student/Corrections';
import { StudentMockBookingPage, StudentMockBookPage, StudentMockExamPage, StudentMockPage, StudentMockResultPage } from '@/pages/student/Mock';
import { StudentClassesPage, StudentClassPage, StudentEnrollPage, StudentGradesPage, StudentHome, StudentPaymentsPage, StudentPlacementPage, StudentProfilePage, StudentResourcesPage } from '@/pages/student/Portal';
import { TeacherCorrectionPage, TeacherGradingPage, TeacherSpeakingPage, TeacherWritingPage } from '@/pages/teacher/Grading';
import { TeacherClassesPage, TeacherClassPage, TeacherHome, TeacherLeavePage } from '@/pages/teacher/Teacher';

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
      {
        path: 'portal',
        element: <AppShell panel="student" />,
        children: [
          { index: true, element: <StudentHome /> },
          { path: 'mock', element: <StudentMockPage /> },
          { path: 'mock/book', element: <StudentMockBookPage /> },
          { path: 'mock/:id', element: <StudentMockBookingPage /> },
          { path: 'mock/:id/exam', element: <StudentMockExamPage /> },
          { path: 'mock/:id/result', element: <StudentMockResultPage /> },
          { path: 'corrections', element: <StudentCorrectionsPage /> },
          { path: 'corrections/new', element: <StudentCorrectionNewPage /> },
          { path: 'corrections/:id', element: <StudentCorrectionPage /> },
          { path: 'classes', element: <StudentClassesPage /> },
          { path: 'classes/:id', element: <StudentClassPage /> },
          { path: 'enroll', element: <StudentEnrollPage /> },
          { path: 'placement', element: <StudentPlacementPage /> },
          { path: 'grades', element: <StudentGradesPage /> },
          { path: 'payments', element: <StudentPaymentsPage /> },
          { path: 'resources', element: <StudentResourcesPage /> },
          { path: 'profile', element: <StudentProfilePage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      {
        path: 'parent',
        element: <AppShell panel="parent" />,
        children: [
          { index: true, element: <ParentHome /> },
          { path: 'enroll', element: <ParentEnrollPage /> },
          { path: 'payments', element: <ParentPaymentsPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      {
        path: 'teacher',
        element: <AppShell panel="teacher" />,
        children: [
          { index: true, element: <TeacherHome /> },
          { path: 'classes', element: <TeacherClassesPage /> },
          { path: 'classes/:id', element: <TeacherClassPage /> },
          { path: 'grading', element: <TeacherGradingPage /> },
          { path: 'grading/writing/:id', element: <TeacherWritingPage /> },
          { path: 'grading/speaking/:id', element: <TeacherSpeakingPage /> },
          { path: 'grading/correction/:id', element: <TeacherCorrectionPage /> },
          { path: 'leave', element: <TeacherLeavePage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
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
