"use client";

import Link from "next/link";
import { UserIcon, ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";
import { signOut } from "next-auth/react";

interface OnboardingHeaderProps {
  userName: string;
}

export function OnboardingHeader({ userName }: OnboardingHeaderProps) {
  return (
    <header className="bg-primary-500 sticky top-0 z-50 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/onboarding" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Acme Workforce"
              className="h-9 w-auto rounded-lg"
            />
            <span className="hidden sm:block text-sm font-semibold text-white tracking-tight">
              Tutor Onboarding
            </span>
          </Link>

          {/* User Info & Sign Out */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5">
              <div className="h-7 w-7 bg-white/20 rounded-full flex items-center justify-center">
                <UserIcon className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-medium text-white hidden sm:block">{userName}</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-white/90 hover:bg-white/10 rounded-[10px] transition-colors"
            >
              <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
              <span className="text-sm font-medium hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
