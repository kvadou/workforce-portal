"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  ArrowRightStartOnRectangleIcon,
  Cog6ToothIcon,
  Squares2X2Icon,
  AcademicCapIcon,
  BookOpenIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { signOut } from "next-auth/react";
import { NotificationBell } from "@/components/notifications/NotificationBell";

// Resource navigation — how tutors access curriculum, teaching materials, etc.
const teachingItems = [
  { label: "Video Library", href: "/teaching/video-library" },
  { label: "Mini Games", href: "/teaching/mini-games" },
  { label: "Story Illustrations", href: "/teaching/story-illustrations" },
  { label: "Printable Activities", href: "/teaching/printable-activities" },
  { label: "Songs", href: "/teaching/songs" },
  { label: "Chess Resources", href: "/teaching/chess-resources" },
  { label: "Adventures Resources", href: "/teaching/adventures-resources" },
  { label: "Online Teaching", href: "/teaching/online-teaching" },
  { label: "Behavior Management", href: "/teaching/behavior-management" },
];

const businessItems = [
  { label: "Email Templates", href: "/business/email-templates" },
  { label: "Flier Templates", href: "/business/flier-templates" },
  { label: "Referrals Strategies", href: "/business/referrals-strategies" },
  { label: "Client Communication", href: "/business/client-communication" },
  { label: "Tutor Supplies", href: "/business/tutor-supplies" },
];

const adminItems = [
  { label: "Admin Team", href: "/resources/admin-team" },
  { label: "Clubs", href: "/resources/clubs" },
  { label: "Forms", href: "/resources/forms" },
  { label: "Chesspectations", href: "/resources/chesspectations" },
  { label: "Admin Video Tutorials", href: "/resources/admin-video-tutorials" },
  { label: "DEIB Policies", href: "/resources/deib-policies" },
  { label: "Lesson Reports", href: "/resources/lesson-reports" },
  { label: "Referral Guidelines", href: "/resources/referral-guidelines" },
];

interface Course {
  id: string;
  title: string;
}

type UserRole = "SUPER_ADMIN" | "ADMIN" | "FRANCHISEE_OWNER" | "LEAD_TUTOR" | "TUTOR" | "ONBOARDING_TUTOR";

interface MainNavProps {
  courses: Course[];
  userName?: string;
  userRole?: UserRole;
}

function isAdmin(role?: UserRole): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

// Mobile sidebar nav items
const mobileNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: Squares2X2Icon },
  { label: "My Profile", href: "/profile", icon: UserIcon },
  { label: "My Classes", href: "/classes", icon: AcademicCapIcon },
  { label: "Training", href: "/training", icon: BookOpenIcon },
  { label: "Referrals", href: "/dashboard/referrals", icon: UserPlusIcon },
  { label: "Settings", href: "/settings", icon: Cog6ToothIcon },
];

// Reusable dropdown component
function NavDropdown({
  label,
  items,
  isOpen,
  onToggle,
  onClose,
}: {
  label: string;
  items: { label: string; href: string }[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-[10px] transition-colors ${
          isOpen
            ? "text-white bg-white/20"
            : "text-white/90 hover:text-white hover:bg-white/10"
        }`}
      >
        {label}
        <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-dropdown border border-neutral-200 py-1.5 animate-fade-in z-50">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-2 text-sm text-neutral-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
              onClick={onClose}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function MainNav({ courses, userName = "Tutor", userRole }: MainNavProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSubmenu, setMobileSubmenu] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const userIsAdmin = isAdmin(userRole);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const closeDropdown = () => setOpenDropdown(null);

  // Build curriculum items from courses prop
  const curriculumItems = [
    ...courses.map((c) => ({ label: c.title, href: `/courses/${c.id}` })),
    { label: "Browse All Curriculum →", href: "/curriculum" },
  ];

  return (
    <header className="bg-primary-500 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14" ref={navRef}>
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 flex-shrink-0">
            <img
              src="/logo.png"
              alt="Acme Workforce"
              className="h-9 w-auto rounded-lg"
            />
          </Link>

          {/* Desktop Nav — Resource Dropdowns */}
          <nav className="hidden lg:flex items-center gap-0.5 ml-6">
            <NavDropdown
              label="Curriculum"
              items={curriculumItems}
              isOpen={openDropdown === "curriculum"}
              onToggle={() => toggleDropdown("curriculum")}
              onClose={closeDropdown}
            />
            <NavDropdown
              label="Teaching"
              items={teachingItems}
              isOpen={openDropdown === "teaching"}
              onToggle={() => toggleDropdown("teaching")}
              onClose={closeDropdown}
            />
            <NavDropdown
              label="Business"
              items={businessItems}
              isOpen={openDropdown === "business"}
              onToggle={() => toggleDropdown("business")}
              onClose={closeDropdown}
            />
            <NavDropdown
              label="Admin"
              items={adminItems}
              isOpen={openDropdown === "admin"}
              onToggle={() => toggleDropdown("admin")}
              onClose={closeDropdown}
            />
          </nav>

          {/* Right side: Bell + User */}
          <div className="flex items-center gap-2">
            <NotificationBell />

            {/* User Menu (desktop) */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => toggleDropdown("user")}
                className="flex items-center gap-2 px-3 py-1.5 text-white/90 hover:bg-white/10 rounded-[10px] transition-all duration-200"
              >
                <div className="h-7 w-7 bg-white/20 rounded-full flex items-center justify-center">
                  <UserIcon className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-medium text-white">{userName}</span>
                <ChevronDownIcon className={`h-3.5 w-3.5 text-white/70 transition-transform duration-200 ${openDropdown === "user" ? "rotate-180" : ""}`} />
              </button>

              {openDropdown === "user" && (
                <div className="absolute top-full right-0 mt-1 w-52 bg-white rounded-xl shadow-dropdown border border-neutral-200 py-1.5 animate-fade-in z-50">
                  <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors" onClick={closeDropdown}>
                    <UserIcon className="h-4 w-4 text-neutral-400" />
                    My Profile
                  </Link>
                  <Link href="/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors" onClick={closeDropdown}>
                    <Cog6ToothIcon className="h-4 w-4 text-neutral-400" />
                    Settings
                  </Link>
                  {userIsAdmin && (
                    <>
                      <div className="border-t border-neutral-100 my-1.5" />
                      <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-primary-600 font-medium hover:bg-primary-50 transition-colors" onClick={closeDropdown}>
                        <Cog6ToothIcon className="h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    </>
                  )}
                  <div className="border-t border-neutral-100 my-1.5" />
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error-light transition-colors flex items-center gap-2"
                    onClick={() => { closeDropdown(); signOut({ callbackUrl: "/login" }); }}
                  >
                    <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-white/90 hover:bg-white/10 rounded-[10px] transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-primary-600">
          <nav className="max-w-7xl mx-auto px-4 py-3 space-y-0.5">
            {/* Sidebar nav items */}
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/90 hover:text-white hover:bg-white/10 rounded-[10px] transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="h-5 w-5 text-white/70" />
                  {item.label}
                </Link>
              );
            })}

            {/* Resource sections */}
            <div className="border-t border-white/15 pt-3 mt-3">
              {/* Curriculum */}
              <MobileSubmenu
                label="Curriculum"
                items={curriculumItems}
                isOpen={mobileSubmenu === "curriculum"}
                onToggle={() => setMobileSubmenu(mobileSubmenu === "curriculum" ? null : "curriculum")}
                onItemClick={() => setMobileMenuOpen(false)}
              />
              <MobileSubmenu
                label="Teaching"
                items={teachingItems}
                isOpen={mobileSubmenu === "teaching"}
                onToggle={() => setMobileSubmenu(mobileSubmenu === "teaching" ? null : "teaching")}
                onItemClick={() => setMobileMenuOpen(false)}
              />
              <MobileSubmenu
                label="Business"
                items={businessItems}
                isOpen={mobileSubmenu === "business"}
                onToggle={() => setMobileSubmenu(mobileSubmenu === "business" ? null : "business")}
                onItemClick={() => setMobileMenuOpen(false)}
              />
              <MobileSubmenu
                label="Admin"
                items={adminItems}
                isOpen={mobileSubmenu === "admin"}
                onToggle={() => setMobileSubmenu(mobileSubmenu === "admin" ? null : "admin")}
                onItemClick={() => setMobileMenuOpen(false)}
              />
            </div>

            {/* User section */}
            <div className="border-t border-white/15 pt-3 mt-3">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{userName}</p>
                  <p className="text-xs text-white/60">
                    {userRole === "SUPER_ADMIN" ? "Super Admin" : userRole === "ADMIN" ? "Admin" : "Tutor"}
                  </p>
                </div>
              </div>
              {userIsAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-accent-cyan hover:bg-white/10 rounded-[10px] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Cog6ToothIcon className="h-4 w-4" />
                  Admin Dashboard
                </Link>
              )}
              <button
                className="w-full text-left px-3 py-2 text-sm text-error-light hover:text-white hover:bg-white/10 rounded-[10px] transition-colors flex items-center gap-2"
                onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: "/login" }); }}
              >
                <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

// Mobile collapsible submenu
function MobileSubmenu({
  label,
  items,
  isOpen,
  onToggle,
  onItemClick,
}: {
  label: string;
  items: { label: string; href: string }[];
  isOpen: boolean;
  onToggle: () => void;
  onItemClick: () => void;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-white/90 hover:text-white hover:bg-white/10 rounded-[10px] transition-colors font-medium"
      >
        {label}
        <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="ml-4 mt-0.5 space-y-0.5">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-[10px] transition-colors"
              onClick={onItemClick}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
