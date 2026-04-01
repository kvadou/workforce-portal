"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { sectionConfigs } from "./sectionConfigs";
import { useAdminLayout } from "./AdminLayoutProvider";

interface AdminTopNavProps {
  userName?: string | null;
  userImage?: string | null;
  userEmail?: string | null;
  onMenuClick: () => void;
}

export default function AdminTopNav({ userName, userImage, userEmail, onMenuClick }: AdminTopNavProps) {
  const { currentSection } = useAdminLayout();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setUserMenuOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const displayName = userName || userEmail?.split("@")[0] || "User";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 shadow-sm">
      {/* Main nav bar */}
      <div className="h-14 flex items-center px-4 lg:px-6">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 -ml-1.5 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          aria-label="Open sidebar"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>

        {/* Logo / Branding */}
        <Link
          href="/admin"
          className="flex items-center gap-2.5 mr-2 flex-shrink-0"
        >
          <Image
            src="/logo.svg"
            alt="Acme Workforce"
            width={28}
            height={28}
            className="rounded-lg"
          />
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-semibold text-neutral-900 leading-tight">
              Acme Workforce
            </span>
            <span className="text-xs text-neutral-500 leading-tight -mt-0.5">
              Admin Portal
            </span>
          </div>
        </Link>

        {/* Divider */}
        <div className="hidden lg:block w-px h-6 bg-neutral-200 ml-2" />

        {/* Desktop section tabs */}
        <nav className="hidden lg:flex items-center gap-0.5 ml-4" aria-label="Main navigation">
          {sectionConfigs.map((section) => {
            const Icon = section.icon;
            const active = currentSection === section.id;
            return (
              <Link
                key={section.id}
                href={section.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[13px] font-medium transition-all duration-200 ${
                  active
                    ? "bg-primary-50 text-primary-500"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-primary-500" : "text-neutral-400"}`} />
                <span>{section.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side: search + back to portal + user */}
        <div className="flex items-center gap-1 ml-auto">
          {/* Search trigger */}
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("open-admin-search"));
            }}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-400 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            <MagnifyingGlassIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline text-xs font-mono bg-white/80 px-1.5 py-0.5 rounded border border-neutral-200 text-neutral-400">
              {"\u2318"}K
            </kbd>
          </button>

          {/* Back to Portal */}
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-sm text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors ml-2"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
            Portal
          </Link>

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-neutral-200 mx-1" />

          {/* User avatar + dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center p-1 rounded-lg hover:bg-neutral-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              {userImage ? (
                <img
                  src={userImage}
                  alt={displayName}
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium text-sm">
                  {initials}
                </div>
              )}
            </button>

            {/* Dropdown menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-dropdown border border-neutral-200 py-2 z-50">
                {/* User info */}
                <div className="px-4 py-3 border-b border-neutral-100">
                  <p className="font-semibold text-neutral-900 truncate">{displayName}</p>
                  {userEmail && (
                    <p className="text-sm text-neutral-500 truncate">{userEmail}</p>
                  )}
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <Link
                    href="/admin/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    <Cog6ToothIcon className="h-5 w-5 text-neutral-400" />
                    Settings
                  </Link>
                </div>

                {/* Sign out */}
                <div className="border-t border-neutral-100 pt-1">
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    <ArrowRightStartOnRectangleIcon className="h-5 w-5 text-neutral-400" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile section tabs — horizontal scroll */}
      <div className="lg:hidden overflow-x-auto scrollbar-hide border-t border-neutral-100 bg-neutral-50/50">
        <nav className="flex items-center gap-1 px-4 py-2 min-w-max" aria-label="Mobile navigation">
          {sectionConfigs.map((section) => {
            const Icon = section.icon;
            const active = currentSection === section.id;
            return (
              <Link
                key={section.id}
                href={section.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  active
                    ? "bg-primary-50 text-primary-500"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? "text-primary-500" : "text-neutral-400"}`} />
                <span>{section.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
