import {
  Box,
  CalendarClock,
  CalendarDays,
  Car,
  FileText,
  Gauge,
  House,
  Newspaper,
  Puzzle,
  Settings,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group: "main" | "secondary" | "account";
  soon?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/tableau-de-bord", label: "Accueil", icon: House, group: "main" },
  { href: "/garage", label: "Mon garage", icon: Car, group: "main" },
  { href: "/vue-3d", label: "Vue 3D", icon: Box, group: "main" },
  { href: "/entretiens", label: "Entretien", icon: Wrench, group: "main" },
  { href: "/echeances", label: "Échéances", icon: CalendarClock, group: "main" },
  { href: "/depenses", label: "Dépenses", icon: Wallet, group: "main" },
  { href: "/documents", label: "Documents", icon: FileText, group: "main" },
  { href: "/catalogue", label: "Pièces", icon: Puzzle, group: "main" },
  { href: "/performances", label: "Performances", icon: Gauge, group: "secondary", soon: true },
  { href: "/communaute", label: "Communauté", icon: Users, group: "secondary", soon: true },
  { href: "/evenements", label: "Événements", icon: CalendarDays, group: "secondary", soon: true },
  { href: "/actualites", label: "Actualités", icon: Newspaper, group: "secondary", soon: true },
  { href: "/parametres", label: "Paramètres", icon: Settings, group: "account" },
];

export const MOBILE_TABS = ["/tableau-de-bord", "/garage", "/vue-3d", "/entretiens"];
