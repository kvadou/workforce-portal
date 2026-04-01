"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowPathIcon,
  BellIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  EnvelopeIcon,
  InformationCircleIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useProfile } from "@/hooks/useProfile";
import { ChangePasswordModal } from "@/components/settings/ChangePasswordModal";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "Unknown";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getRoleDisplay(role: string): string {
  const roleMap: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    FRANCHISEE_OWNER: "Franchisee Owner",
    LEAD_TUTOR: "Lead Tutor",
    TUTOR: "Tutor",
    ONBOARDING_TUTOR: "Onboarding Tutor",
  };
  return roleMap[role] || role;
}

export function SettingsPageClient() {
  const { data: profile, isLoading } = useProfile();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Notification preferences (stored locally for now)
  const [notifications, setNotifications] = useState({
    announcements: true,
    lessons: true,
    digest: false,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <ArrowPathIcon className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
      {/* Page Title */}
      <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-neutral-100">
        <h1 className="text-2xl font-semibold text-neutral-900">Settings</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Manage your account settings</p>
      </div>

      <div className="px-5 sm:px-6 py-5 sm:py-6">
      <div className="space-y-6">
        {/* Account Security Section */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100 bg-neutral-50">
            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
              <ShieldCheckIcon className="w-4 h-4 text-primary-600" />
            </div>
            <h2 className="font-semibold text-neutral-900">Account Security</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Email (Read-only) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                  <EnvelopeIcon className="w-5 h-5 text-neutral-600" />
                </div>
                <div>
                  <p className="font-medium text-neutral-900">Email Address</p>
                  <p className="text-sm text-neutral-600">{profile?.email}</p>
                </div>
              </div>
              <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded">
                Cannot be changed
              </span>
            </div>

            {/* Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                  <LockClosedIcon className="w-5 h-5 text-neutral-600" />
                </div>
                <div>
                  <p className="font-medium text-neutral-900">Password</p>
                  <p className="text-sm text-neutral-600">
                    ••••••••••••
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
              >
                Change Password
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100 bg-neutral-50">
            <div className="w-8 h-8 rounded-lg bg-warning-light flex items-center justify-center">
              <BellIcon className="w-4 h-4 text-warning" />
            </div>
            <h2 className="font-semibold text-neutral-900">Notifications</h2>
            <span className="ml-auto text-xs text-warning bg-warning-light px-2 py-1 rounded-full font-medium">
              Coming Soon
            </span>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="flex items-center gap-3">
                <InformationCircleIcon className="w-5 h-5 text-neutral-400" />
                <p className="text-sm text-neutral-600">
                  Email notifications are coming soon. Your preferences will be saved.
                </p>
              </div>
            </div>

            {/* Announcement Notifications */}
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-neutral-900">New Announcements</p>
                <p className="text-sm text-neutral-600">
                  Get notified about new announcements and updates
                </p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={notifications.announcements}
                  onChange={(e) =>
                    setNotifications((n) => ({
                      ...n,
                      announcements: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 rounded-full peer peer-checked:bg-primary-600 transition-colors" />
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
              </div>
            </label>

            {/* Lesson Notifications */}
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-neutral-900">Upcoming Lessons</p>
                <p className="text-sm text-neutral-600">
                  Reminders about scheduled lessons and classes
                </p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={notifications.lessons}
                  onChange={(e) =>
                    setNotifications((n) => ({
                      ...n,
                      lessons: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 rounded-full peer peer-checked:bg-primary-600 transition-colors" />
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
              </div>
            </label>

            {/* Weekly Digest */}
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-neutral-900">Weekly Digest</p>
                <p className="text-sm text-neutral-600">
                  A weekly summary of activity and resources
                </p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={notifications.digest}
                  onChange={(e) =>
                    setNotifications((n) => ({
                      ...n,
                      digest: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 rounded-full peer peer-checked:bg-primary-600 transition-colors" />
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
              </div>
            </label>
          </div>
        </div>

        {/* Account Information Section */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100 bg-neutral-50">
            <div className="w-8 h-8 rounded-lg bg-success-light flex items-center justify-center">
              <BuildingOfficeIcon className="w-4 h-4 text-success" />
            </div>
            <h2 className="font-semibold text-neutral-900">Account Information</h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Role */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-5 h-5 text-neutral-600" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Role</p>
                  <p className="font-medium text-neutral-900">
                    {profile ? getRoleDisplay(profile.role) : "—"}
                  </p>
                </div>
              </div>

              {/* Organization */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                  <BuildingOfficeIcon className="w-5 h-5 text-neutral-600" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Organization</p>
                  <p className="font-medium text-neutral-900">
                    {profile?.organization?.name || "—"}
                  </p>
                </div>
              </div>

              {/* Member Since */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                  <CalendarDaysIcon className="w-5 h-5 text-neutral-600" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Member Since</p>
                  <p className="font-medium text-neutral-900">
                    {formatDate(profile?.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Link to Profile */}
            <div className="mt-6 pt-6 border-t border-neutral-200">
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                <UserIcon className="w-4 h-4" />
                Edit your profile information
                <ChevronRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      </div>
      </div>

      {/* Password Change Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </DashboardLayout>
  );
}
