import {
  Bell, Book, BookOpen, Briefcase, Calendar, ChartColumn, CircleDollar, ClockArrowRotateLeft, FileText, Gear, GraduationCap, House, ListCheck, Magnifier, Pencil, Persons,
  PersonsLock, Receipt, ShieldCheck, Ticket,
} from '@gravity-ui/icons';
import type { ComponentType, SVGProps } from 'react';
import type { Panel, StaffRole } from '@/types';

export type BadgeKey = 'unpaid' | 'grading' | 'approvals' | 'leads' | 'toRelease' | 'corrections';

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  end?: boolean;
  badge?: BadgeKey;
  roles?: StaffRole[];
  group?: string;
}

export const HOME: Record<Panel, string> = { student: '/portal', parent: '/parent', teacher: '/teacher', admin: '/admin' };

export const NAV: Record<Panel, NavItem[]> = {
  student: [
    { to: '/portal', label: 'خانه', icon: House, end: true },
    { to: '/portal/mock', label: 'آزمون ماک آیلتس', icon: Ticket },
    { to: '/portal/corrections', label: 'تصحیح رایتینگ', icon: Pencil },
    { to: '/portal/classes', label: 'کلاس‌های من', icon: GraduationCap },
    { to: '/portal/enroll', label: 'ثبت‌نام ترم جدید', icon: Calendar },
    { to: '/portal/grades', label: 'کارنامه‌ها', icon: FileText },
    { to: '/portal/payments', label: 'پرداخت‌ها', icon: Receipt, badge: 'unpaid' },
    { to: '/portal/resources', label: 'منابع و کتاب', icon: BookOpen },
    { to: '/portal/profile', label: 'حساب کاربری', icon: Persons },
  ],
  parent: [
    { to: '/parent', label: 'فرزندان من', icon: House, end: true },
    { to: '/parent/enroll', label: 'ثبت‌نام فرزند', icon: Calendar },
    { to: '/parent/payments', label: 'پرداخت‌ها', icon: Receipt, badge: 'unpaid' },
  ],
  teacher: [
    { to: '/teacher', label: 'خانه', icon: House, end: true },
    { to: '/teacher/classes', label: 'کلاس‌های من', icon: GraduationCap },
    { to: '/teacher/grading', label: 'صف تصحیح', icon: Pencil, badge: 'grading' },
    { to: '/teacher/leave', label: 'مرخصی', icon: Calendar },
  ],
  admin: [
    { to: '/admin', label: 'داشبورد', icon: ChartColumn, end: true },
    { to: '/admin/mock', label: 'جلسات آزمون ماک', icon: Ticket, group: 'آزمون ماک', badge: 'toRelease', roles: ['manager', 'reception'] },
    { to: '/admin/bookings', label: 'رزروها و نتایج', icon: ListCheck, group: 'آزمون ماک' },
    { to: '/admin/tests', label: 'بانک آزمون', icon: Book, group: 'آزمون ماک', roles: ['manager'] },
    { to: '/admin/corrections', label: 'خدمات تصحیح', icon: Pencil, group: 'آزمون ماک', badge: 'corrections', roles: ['manager', 'reception'] },
    { to: '/admin/classes', label: 'ترم‌ها و کلاس‌ها', icon: Calendar, group: 'آموزش', roles: ['manager', 'reception'] },
    { to: '/admin/students', label: 'زبان‌آموزان', icon: Persons, group: 'آموزش' },
    { to: '/admin/enrollments', label: 'ثبت‌نام‌ها', icon: ClockArrowRotateLeft, group: 'آموزش', roles: ['manager', 'reception'] },
    { to: '/admin/teachers', label: 'استادها', icon: GraduationCap, group: 'آموزش', roles: ['manager', 'reception'] },
    { to: '/admin/finance', label: 'مالی', icon: CircleDollar, group: 'مالی و اداری', roles: ['manager', 'finance', 'reception'] },
    { to: '/admin/approvals', label: 'صندوق تأییدها', icon: ShieldCheck, group: 'مالی و اداری', badge: 'approvals' },
    { to: '/admin/leads', label: 'درخواست‌های سایت', icon: Bell, group: 'مالی و اداری', badge: 'leads', roles: ['manager', 'reception'] },
    { to: '/admin/reports', label: 'گزارش‌ها', icon: Briefcase, group: 'مالی و اداری', roles: ['manager', 'finance'] },
    { to: '/admin/audit', label: 'لاگ ممیزی', icon: Magnifier, group: 'مالی و اداری', roles: ['manager'] },
    { to: '/admin/users', label: 'کاربران و نقش‌ها', icon: PersonsLock, group: 'مالی و اداری', roles: ['manager'] },
    { to: '/admin/settings', label: 'تنظیمات', icon: Gear, group: 'مالی و اداری', roles: ['manager'] },
  ],
};

export const canSee = (item: NavItem, role?: StaffRole) => !item.roles || !role || item.roles.includes(role);
