import {
  UtensilsCrossed,
  Car,
  ShoppingBag,
  ReceiptText,
  Film,
  HeartPulse,
  Home,
  GraduationCap,
  Wallet,
  Gift,
  Briefcase,
  TrendingUp,
  PiggyBank,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';

/** Allowed category icons (name -> component). Categories store the name. */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Car,
  ShoppingBag,
  ReceiptText,
  Film,
  HeartPulse,
  Home,
  GraduationCap,
  Wallet,
  Gift,
  Briefcase,
  TrendingUp,
  PiggyBank,
  MoreHorizontal,
};

export const ICON_NAMES = Object.keys(CATEGORY_ICONS);

export const DEFAULT_ICON = 'MoreHorizontal';

export function getCategoryIcon(name?: string | null): LucideIcon {
  return (name && CATEGORY_ICONS[name]) || MoreHorizontal;
}
