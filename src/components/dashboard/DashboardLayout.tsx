"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Squares2X2Icon,
  AcademicCapIcon,
  UserIcon,
  Cog6ToothIcon,
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";

// Sidebar navigation items — streamlined for tutor daily use
const sidebarItems = [
  { label: "Dashboard", href: "/dashboard", icon: Squares2X2Icon },
  { label: "My Profile", href: "/profile", icon: UserIcon },
  { label: "My Classes", href: "/classes", icon: AcademicCapIcon },
  { label: "Training", href: "/training", icon: BookOpenIcon },
  { label: "Referrals", href: "/dashboard/referrals", icon: UserPlusIcon },
  { label: "Settings", href: "/settings", icon: Cog6ToothIcon },
];

// Sidebar component
function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0">
      <div className="sticky top-20">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <nav className="space-y-1">
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-3 h-11 rounded-[10px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 ${
                      isActive
                        ? "bg-primary-50 text-primary-500 font-medium border-l-[3px] border-primary-500 pl-[9px] px-4 py-3"
                        : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 px-4 py-3"
                    }`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-primary-500" : "text-neutral-400"}`} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}

// Mobile navigation with scroll indicators and improved UX
function MobileNav() {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Check scroll position to show/hide arrows
  const updateArrows = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Scroll to active item on mount
  useEffect(() => {
    if (!scrollRef.current) return;
    const activeItem = scrollRef.current.querySelector('[data-active="true"]');
    if (activeItem) {
      activeItem.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
    updateArrows();
  }, [pathname]);

  const scrollTo = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="lg:hidden mb-6 -mx-4 relative">
      {/* Left scroll indicator */}
      {showLeftArrow && (
        <button
          onClick={() => scrollTo("left")}
          className="absolute left-0 top-0 bottom-2 z-10 w-10 flex items-center justify-start pl-1 bg-gradient-to-r from-accent-light via-accent-light/80 to-transparent"
          aria-label="Scroll left"
        >
          <ChevronLeftIcon className="h-5 w-5 text-neutral-600" />
        </button>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        onScroll={updateArrows}
        className="flex gap-2 px-4 pb-2 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              data-active={isActive}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-2 px-4 py-3 rounded-[10px] whitespace-nowrap transition-all duration-200 snap-start min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 ${
                isActive
                  ? "bg-primary-50 text-primary-500 font-medium border-l-[3px] border-primary-500 pl-[9px]"
                  : "bg-white text-neutral-600 hover:bg-neutral-50 active:bg-neutral-100 border border-neutral-200"
              }`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-primary-500" : "text-neutral-400"}`} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Right scroll indicator */}
      {showRightArrow && (
        <button
          onClick={() => scrollTo("right")}
          className="absolute right-0 top-0 bottom-2 z-10 w-10 flex items-center justify-end pr-1 bg-gradient-to-l from-accent-light via-accent-light/80 to-transparent"
          aria-label="Scroll right"
        >
          <ChevronRightIcon className="h-5 w-5 text-neutral-600" />
        </button>
      )}
    </div>
  );
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <DashboardSidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Mobile Navigation */}
          <MobileNav />

          {children}
        </div>
      </div>
    </div>
  );
}
