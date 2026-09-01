import {
  LayoutDashboard,
  Target,
  BarChart3,
  Trophy,
  BookOpen,
  Compass,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trainieren", label: "Trainieren", icon: Target },
  { href: "/fortschritt", label: "Fortschritt", icon: BarChart3 },
  { href: "/rangliste", label: "Rangliste", icon: Trophy },
  { href: "/einwaende", label: "Einwand-Bibliothek", icon: BookOpen },
  { href: "/leitfaden", label: "Leitfaden", icon: Compass },
  { href: "/community", label: "Community", icon: Users },
  { href: "/einstellungen", label: "Einstellungen", icon: Settings },
];

// Subset shown in the mobile bottom nav — keep it short.
export const MOBILE_NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/trainieren", label: "Training", icon: Target },
  { href: "/fortschritt", label: "Fortschritt", icon: BarChart3 },
  { href: "/einwaende", label: "Bibliothek", icon: BookOpen },
  { href: "/einstellungen", label: "Mehr", icon: Settings },
];
