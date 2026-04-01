"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  PlayCircleIcon,
  UserIcon,
  CalendarDaysIcon,
  TrophyIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import type { OnboardingNavProgress } from "@/app/onboarding/layout";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  isUnlocked: (progress: OnboardingNavProgress) => boolean;
}

const navItems: NavItem[] = [
  {
    href: "/onboarding",
    label: "Home",
    icon: HomeIcon,
    exact: true,
    isUnlocked: () => true,
  },
  {
    href: "/onboarding/videos",
    label: "Videos",
    icon: PlayCircleIcon,
    isUnlocked: (p) => !!p.welcomeCompletedAt,
  },
  {
    href: "/onboarding/profile",
    label: "Profile",
    icon: UserIcon,
    isUnlocked: (p) => !!p.videosCompletedAt,
  },
  {
    href: "/onboarding/orientation",
    label: "Debrief",
    icon: CalendarDaysIcon,
    isUnlocked: (p) => !!p.profileCompletedAt && !!p.w9CompletedAt,
  },
  {
    href: "/onboarding/status",
    label: "Progress",
    icon: TrophyIcon,
    isUnlocked: () => true,
  },
];

interface OnboardingMobileNavProps {
  progress: OnboardingNavProgress;
  isAdminViewer?: boolean;
}

export function OnboardingMobileNav({ progress, isAdminViewer }: OnboardingMobileNavProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl rounded-t-2xl shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-safe md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          const unlocked = isAdminViewer || item.isUnlocked(progress);

          // Locked items are not clickable
          if (!unlocked) {
            return (
              <div
                key={item.href}
                className="flex flex-col items-center justify-center w-full h-full text-neutral-300 cursor-not-allowed"
              >
                <LockClosedIcon className="h-4 w-4" />
                <span className="text-[10px] mt-1">{item.label}</span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all ${
                active
                  ? "bg-primary-50 text-primary-500"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
              <span className={`text-[10px] mt-1 ${active ? "font-semibold" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
