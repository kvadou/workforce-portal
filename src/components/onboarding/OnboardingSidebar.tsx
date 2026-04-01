"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  PlayCircleIcon,
  UserIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  EyeIcon,
  CheckCircleIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import type { OnboardingNavProgress } from "@/app/onboarding/layout";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  // Function to check if this item is unlocked based on progress
  isUnlocked: (progress: OnboardingNavProgress) => boolean;
  // Function to check if this item is completed
  isCompleted?: (progress: OnboardingNavProgress) => boolean;
}

const navItems: NavItem[] = [
  {
    href: "/onboarding",
    label: "Dashboard",
    icon: HomeIcon,
    exact: true,
    isUnlocked: () => true,
  },
  {
    href: "/onboarding/videos",
    label: "Videos & Quizzes",
    icon: PlayCircleIcon,
    isUnlocked: (p) => !!p.welcomeCompletedAt,
    isCompleted: (p) => !!p.videosCompletedAt,
  },
  {
    href: "/onboarding/profile",
    label: "Profile & Documents",
    icon: UserIcon,
    isUnlocked: (p) => !!p.videosCompletedAt,
    isCompleted: (p) => !!p.profileCompletedAt && !!p.w9CompletedAt,
  },
  {
    href: "/onboarding/orientation",
    label: "Orientation Debrief",
    icon: CalendarDaysIcon,
    isUnlocked: (p) => !!p.profileCompletedAt && !!p.w9CompletedAt,
    isCompleted: (p) => !!p.orientationAttendedAt,
  },
  {
    href: "/onboarding/training",
    label: "Training",
    icon: AcademicCapIcon,
    isUnlocked: (p) => !!p.orientationAttendedAt,
    isCompleted: () => false, // Will be computed from admin milestones later
  },
  {
    href: "/onboarding/shadows",
    label: "Shadow Lessons",
    icon: EyeIcon,
    isUnlocked: (p) => !!p.orientationAttendedAt, // Unlocked same time as training
    isCompleted: () => false, // Will be computed from admin milestones later
  },
  {
    href: "/onboarding/status",
    label: "Progress",
    icon: CheckCircleIcon,
    isUnlocked: () => true,
  },
];

interface OnboardingSidebarProps {
  userName: string;
  progress: OnboardingNavProgress;
  isAdminViewer?: boolean;
}

export function OnboardingSidebar({ userName, progress, isAdminViewer }: OnboardingSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-72 bg-white border-r border-neutral-200 flex flex-col shadow-sm">
      {/* Welcome Message */}
      <div className="px-5 py-4 border-b border-neutral-200">
        <p className="text-xs text-neutral-400 font-medium">Welcome,</p>
        <p className="text-base font-semibold text-neutral-900">{userName}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            const unlocked = isAdminViewer || item.isUnlocked(progress);
            const completed = item.isCompleted?.(progress) ?? false;

            // Locked items are not clickable
            if (!unlocked) {
              return (
                <li key={item.href}>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-400 cursor-not-allowed">
                    <LockClosedIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                </li>
              );
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 h-11 rounded-[10px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 ${
                    active
                      ? "bg-primary-50 text-primary-500 font-medium border-l-[3px] border-primary-500 pl-[9px] px-4 py-3"
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 px-4 py-3"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  {completed && (
                    <CheckCircleIcon className="h-5 w-5 text-success" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Help Section */}
      <div className="p-4 border-t border-neutral-200">
        <div className="bg-neutral-50 rounded-xl p-4">
          <p className="text-sm text-neutral-500 mb-1">Need help?</p>
          <a
            href="mailto:admin@workforceportal.com"
            className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
          >
            Contact Admin
          </a>
        </div>
      </div>
    </aside>
  );
}
