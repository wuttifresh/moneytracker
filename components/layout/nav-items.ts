import type { Route } from 'next';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  TrendingUp,
  Boxes,
  BarChart3,
  Target,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  href: Route;
  label: string;
  icon: LucideIcon;
  /** Show in the mobile bottom nav (kept short for small screens). */
  primary?: boolean;
};

// Routes are placeholders for Phase 0 — pages arrive in later phases.
export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'ภาพรวม', icon: LayoutDashboard, primary: true },
  { href: '/transactions', label: 'รายรับ-รายจ่าย', icon: ArrowLeftRight, primary: true },
  { href: '/debts', label: 'หนี้สิน', icon: Landmark },
  { href: '/investments', label: 'การลงทุน', icon: TrendingUp, primary: true },
  { href: '/assets', label: 'ทรัพย์สิน', icon: Boxes },
  { href: '/reports', label: 'รายงาน', icon: BarChart3, primary: true },
  { href: '/planning', label: 'วางแผน', icon: Target },
];
