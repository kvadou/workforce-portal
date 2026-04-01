import {
  HomeIcon,
  UsersIcon,
  UserPlusIcon,
  BookOpenIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  TrophyIcon,
  PuzzlePieceIcon,
  Square3Stack3DIcon,
  MegaphoneIcon,
  BuildingLibraryIcon,
  PhotoIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  StarIcon,
  FlagIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";

export type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { title?: string; titleId?: string }>;

// ── Types ──────────────────────────────────────────────────────────

export type AdminSection =
  | "home"
  | "people"
  | "onboarding"
  | "curriculum"
  | "lms"
  | "content"
  | "settings";

export interface NavItem {
  name: string;
  href: string;
  icon: IconComponent;
}

export interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export type SidebarItem = NavItem | NavGroup;

export function isNavGroup(item: SidebarItem): item is NavGroup {
  return "groupName" in item;
}

export interface SectionConfig {
  id: AdminSection;
  name: string;
  href: string;
  icon: IconComponent;
  sidebarItems: SidebarItem[];
}

// ── Section Configs ────────────────────────────────────────────────

export const sectionConfigs: SectionConfig[] = [
  {
    id: "home",
    name: "Home",
    href: "/admin",
    icon: HomeIcon,
    sidebarItems: [], // Full-width dashboard, no sidebar
  },
  {
    id: "people",
    name: "People",
    href: "/admin/tutors",
    icon: UsersIcon,
    sidebarItems: [
      { name: "All Tutors", href: "/admin/tutors", icon: UsersIcon },
      { name: "Teams", href: "/admin/tutors/teams", icon: UsersIcon },
      { name: "Analytics", href: "/admin/analytics", icon: ChartBarIcon },
    ],
  },
  {
    id: "onboarding",
    name: "Onboarding",
    href: "/admin/onboarding",
    icon: UserPlusIcon,
    sidebarItems: [
      { name: "Pipeline", href: "/admin/onboarding", icon: ClipboardDocumentListIcon },
      { name: "Cohorts", href: "/admin/onboarding/cohorts", icon: UsersIcon },
      { name: "Sessions", href: "/admin/onboarding/sessions", icon: CalendarDaysIcon },
      { name: "Settings", href: "/admin/settings/onboarding", icon: Cog6ToothIcon },
    ],
  },
  {
    id: "curriculum",
    name: "Curriculum",
    href: "/admin/curriculum",
    icon: BookOpenIcon,
    sidebarItems: [
      { name: "Overview", href: "/admin/curriculum", icon: BookOpenIcon },
      { name: "Lessons", href: "/admin/lessons", icon: BookOpenIcon },
      { name: "Modules", href: "/admin/modules", icon: Square3Stack3DIcon },
    ],
  },
  {
    id: "lms",
    name: "LMS",
    href: "/admin/training",
    icon: AcademicCapIcon,
    sidebarItems: [
      { name: "Training Courses", href: "/admin/training", icon: AcademicCapIcon },
      { name: "Badges", href: "/admin/badges", icon: TrophyIcon },
      {
        groupName: "Chess",
        items: [
          { name: "Dashboard", href: "/admin/chess", icon: PuzzlePieceIcon },
          { name: "Puzzles", href: "/admin/chess/puzzles", icon: PuzzlePieceIcon },
          { name: "Lessons", href: "/admin/chess/lessons", icon: BookOpenIcon },
        ],
      },
    ],
  },
  {
    id: "content",
    name: "Content",
    href: "/admin/pages",
    icon: DocumentTextIcon,
    sidebarItems: [
      { name: "CMS Pages", href: "/admin/pages", icon: DocumentTextIcon },
      { name: "Announcements", href: "/admin/announcements", icon: MegaphoneIcon },
      { name: "Resources", href: "/admin/resources", icon: BuildingLibraryIcon },
      { name: "Media Library", href: "/admin/media", icon: PhotoIcon },
    ],
  },
  {
    id: "settings",
    name: "Settings",
    href: "/admin/settings/users",
    icon: Cog6ToothIcon,
    sidebarItems: [
      { name: "Users & Permissions", href: "/admin/settings/users", icon: UsersIcon },
      { name: "Organizations", href: "/admin/settings/organizations", icon: BuildingOfficeIcon },
      { name: "Email Templates", href: "/admin/settings/email-templates", icon: EnvelopeIcon },
      { name: "Points & Rewards", href: "/admin/settings/points-rules", icon: StarIcon },
      { name: "Goal Templates", href: "/admin/settings/goal-templates", icon: FlagIcon },
      { name: "STC Sync", href: "/admin/settings/stc-sync", icon: ArrowPathIcon },
    ],
  },
];

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Determines which section a pathname belongs to.
 * Uses most-specific-match: longer prefixes win.
 */
export function getSectionFromPath(pathname: string): AdminSection {
  // Exact match for admin home
  if (pathname === "/admin") return "home";

  // Build a flat list of prefix→section from sidebar hrefs + section hrefs
  const mappings: { prefix: string; section: AdminSection }[] = [];

  for (const config of sectionConfigs) {
    if (config.id === "home") continue;

    // Add the section's own href
    mappings.push({ prefix: config.href, section: config.id });

    // Add each sidebar item href
    for (const item of config.sidebarItems) {
      if (isNavGroup(item)) {
        for (const sub of item.items) {
          mappings.push({ prefix: sub.href, section: config.id });
        }
      } else {
        mappings.push({ prefix: item.href, section: config.id });
      }
    }
  }

  // Sort by prefix length descending — most specific wins
  mappings.sort((a, b) => b.prefix.length - a.prefix.length);

  for (const m of mappings) {
    if (pathname === m.prefix || pathname.startsWith(m.prefix + "/")) {
      return m.section;
    }
  }

  // Fallback: check broad path prefixes
  if (pathname.startsWith("/admin/tutors")) return "people";
  if (pathname.startsWith("/admin/onboarding")) return "onboarding";
  if (pathname.startsWith("/admin/curriculum") || pathname.startsWith("/admin/lessons") || pathname.startsWith("/admin/modules") || pathname.startsWith("/admin/courses")) return "curriculum";
  if (pathname.startsWith("/admin/training") || pathname.startsWith("/admin/badges") || pathname.startsWith("/admin/chess")) return "lms";
  if (pathname.startsWith("/admin/pages") || pathname.startsWith("/admin/announcements") || pathname.startsWith("/admin/resources") || pathname.startsWith("/admin/media")) return "content";
  if (pathname.startsWith("/admin/settings")) return "settings";

  return "home";
}

export function getSectionConfig(section: AdminSection): SectionConfig {
  return sectionConfigs.find((s) => s.id === section) ?? sectionConfigs[0];
}
