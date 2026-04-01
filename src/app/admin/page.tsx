"use client";

import {
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  BellIcon,
  BookOpenIcon,
  BuildingLibraryIcon,
  ChartBarIcon,
  ChevronRightIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  MegaphoneIcon,
  PlusIcon,
  ShieldCheckIcon,
  TrophyIcon,
  UserPlusIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { formatDistanceToNow } from "date-fns";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function AdminDashboard() {
  const { data, isLoading } = useAdminDashboard();

  if (isLoading) {
    return <LoadingSpinner fullPage />;
  }

  const actionItems = [
    { label: "Pending W-9s", count: data?.actionItems.pendingW9 ?? 0, href: "/admin/onboarding?status=W9_PENDING", color: "text-warning-dark bg-warning-light" },
    { label: "Pending Profiles", count: data?.actionItems.pendingProfiles ?? 0, href: "/admin/onboarding?status=PROFILE_PENDING", color: "text-accent-orange bg-accent-orange-light" },
    { label: "Pending Activations", count: data?.actionItems.pendingActivations ?? 0, href: "/admin/onboarding?status=COMPLETED", color: "text-info-dark bg-info-light" },
    { label: "Active Alerts", count: data?.engagement.activeAlerts ?? 0, href: "/admin/analytics", color: "text-error-dark bg-error-light" },
  ].filter((item) => item.count > 0);

  const quickActions = [
    { label: "Add Tutor", icon: UserPlusIcon, href: "/admin/onboarding" },
    { label: "Create Course", icon: AcademicCapIcon, href: "/admin/training/new" },
    { label: "New Page", icon: DocumentTextIcon, href: "/admin/pages/new" },
    { label: "New Resource", icon: BuildingLibraryIcon, href: "/admin/resources/new" },
    { label: "Announcement", icon: MegaphoneIcon, href: "/admin/announcements/new" },
    { label: "View Analytics", icon: ChartBarIcon, href: "/admin/analytics" },
  ];

  // Format audit action for display
  const formatAction = (action: string, field: string | null, tutorName: string) => {
    const actionMap: Record<string, string> = {
      STATUS_CHANGE: `${tutorName} status changed`,
      TEAM_CHANGE: `${tutorName} team updated`,
      LABEL_ADDED: `Label added to ${tutorName}`,
      LABEL_REMOVED: `Label removed from ${tutorName}`,
      CERTIFICATION_ADDED: `${tutorName} certified`,
      CERTIFICATION_REMOVED: `Certification removed from ${tutorName}`,
      NOTE_ADDED: `Note added to ${tutorName}`,
      PROFILE_UPDATED: `${tutorName} profile updated`,
    };
    return actionMap[action] || `${action}${field ? ` (${field})` : ""} - ${tutorName}`;
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <div className="px-6 lg:px-8 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-neutral-900">
          Admin Center
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Manage your tutoring business at a glance
        </p>
      </div>

      {/* Main content — full width */}
      <div className="px-6 lg:px-8 pb-8 pt-4">
        {/* Action Items Banner */}
        {actionItems.length > 0 && (
          <div className="mb-6 bg-warning-light border border-warning rounded-lg p-4">
            <h2 className="text-sm font-semibold text-warning-dark flex items-center gap-2 mb-3">
              <ExclamationTriangleIcon className="h-4 w-4" />
              Needs Attention
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {actionItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors ${item.color} hover:opacity-80`}
                >
                  <span className="text-xl font-bold">{item.count}</span>
                  <span className="text-xs font-medium leading-tight">{item.label}</span>
                  <ChevronRightIcon className="h-3.5 w-3.5 ml-auto opacity-50" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Pipeline Health */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-9 w-9 rounded-lg bg-primary-100 flex items-center justify-center">
                <UserPlusIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Pipeline</p>
                <p className="text-xl font-bold text-neutral-900">{data?.pipeline.total ?? 0}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Pre-Orientation</span>
                <span className="font-medium text-neutral-700">{data?.pipeline.preOrientation ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">In Training</span>
                <span className="font-medium text-neutral-700">{data?.pipeline.inTraining ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Ready to Activate</span>
                <span className="font-medium text-success">{data?.pipeline.pendingActivation ?? 0}</span>
              </div>
            </div>
            <Link href="/admin/onboarding" className="mt-3 flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 font-medium">
              View Pipeline <ChevronRightIcon className="h-3 w-3" />
            </Link>
          </div>

          {/* Active Tutors */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-9 w-9 rounded-lg bg-accent-green-light flex items-center justify-center">
                <UsersIcon className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Active Tutors</p>
                <p className="text-xl font-bold text-neutral-900">{data?.tutors.active ?? 0}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">New (30d)</span>
                <span className="font-medium text-success">+{data?.tutors.new30d ?? 0}</span>
              </div>
              {data?.tutors.byStatus && Object.entries(data.tutors.byStatus)
                .filter(([status]) => status !== "ACTIVE")
                .slice(0, 2)
                .map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500 capitalize">{status.toLowerCase()}</span>
                    <span className="font-medium text-neutral-700">{count}</span>
                  </div>
                ))
              }
            </div>
            <Link href="/admin/tutors" className="mt-3 flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 font-medium">
              Manage Tutors <ChevronRightIcon className="h-3 w-3" />
            </Link>
          </div>

          {/* Training */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-9 w-9 rounded-lg bg-primary-100 flex items-center justify-center">
                <AcademicCapIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Training</p>
                <p className="text-xl font-bold text-neutral-900">{data?.training.activeEnrollments ?? 0}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Active Enrollments</span>
                <span className="font-medium text-neutral-700">{data?.training.activeEnrollments ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Completion Rate</span>
                <span className="font-medium text-neutral-700">{data?.training.completionRate ?? 0}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Completed (30d)</span>
                <span className="font-medium text-success">{data?.training.completedRecently ?? 0}</span>
              </div>
            </div>
            <Link href="/admin/training" className="mt-3 flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 font-medium">
              View Courses <ChevronRightIcon className="h-3 w-3" />
            </Link>
          </div>

          {/* Engagement */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-9 w-9 rounded-lg bg-accent-orange-light flex items-center justify-center">
                <ArrowTrendingUpIcon className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Engagement</p>
                <p className="text-xl font-bold text-neutral-900">{data?.engagement.badgesAwarded ?? 0}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Badges (30d)</span>
                <span className="font-medium text-neutral-700">{data?.engagement.badgesAwarded ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Active Alerts</span>
                <span className={`font-medium ${(data?.engagement.activeAlerts ?? 0) > 0 ? "text-error" : "text-neutral-700"}`}>
                  {data?.engagement.activeAlerts ?? 0}
                </span>
              </div>
            </div>
            <Link href="/admin/analytics" className="mt-3 flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 font-medium">
              View Analytics <ChevronRightIcon className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Quick Actions + Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-card">
              <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-2 mb-4">
                <PlusIcon className="h-4 w-4 text-neutral-400" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-primary-50 transition-colors group"
                    >
                      <div className="h-10 w-10 rounded-lg bg-primary-50 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
                        <Icon className="h-5 w-5 text-primary-600" />
                      </div>
                      <span className="text-xs font-medium text-neutral-700 group-hover:text-primary-700">{action.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-card">
              <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-2 mb-4">
                <ClockIcon className="h-4 w-4 text-neutral-400" />
                Recent Activity
              </h2>
              {data?.recentActivity && data.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {data.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="h-7 w-7 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <ShieldCheckIcon className="h-3.5 w-3.5 text-neutral-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-700">
                          {formatAction(activity.action, activity.field, activity.tutorName)}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {activity.performedBy} &middot; {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-400 py-4 text-center">No recent activity</p>
              )}
            </div>
          </div>

          {/* Right: Content snapshot */}
          <div className="space-y-6">
            {/* Content Snapshot */}
            <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-card">
              <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-2 mb-4">
                <DocumentTextIcon className="h-4 w-4 text-neutral-400" />
                Content
              </h2>
              <div className="space-y-2">
                <Link
                  href="/admin/pages"
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-info-light flex items-center justify-center">
                      <DocumentTextIcon className="h-3.5 w-3.5 text-info" />
                    </div>
                    <span className="text-sm text-neutral-700">CMS Pages</span>
                  </div>
                  <span className="text-sm font-semibold text-neutral-900">{data?.content.publishedPages ?? 0}</span>
                </Link>
                <Link
                  href="/admin/resources"
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-accent-pink-light flex items-center justify-center">
                      <BuildingLibraryIcon className="h-3.5 w-3.5 text-accent-pink" />
                    </div>
                    <span className="text-sm text-neutral-700">Resources</span>
                  </div>
                  <span className="text-sm font-semibold text-neutral-900">{data?.content.activeResources ?? 0}</span>
                </Link>
                <Link
                  href="/admin/announcements"
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-warning-light flex items-center justify-center">
                      <MegaphoneIcon className="h-3.5 w-3.5 text-warning" />
                    </div>
                    <span className="text-sm text-neutral-700">Announcements</span>
                  </div>
                  <span className="text-sm font-semibold text-neutral-900">{data?.content.activeAnnouncements ?? 0}</span>
                </Link>
              </div>
            </div>

            {/* Training Overview */}
            <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-card">
              <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-2 mb-4">
                <AcademicCapIcon className="h-4 w-4 text-neutral-400" />
                Training Overview
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">Active Enrollments</span>
                  <span className="text-sm font-semibold text-neutral-900">{data?.training.activeEnrollments ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">Completion Rate</span>
                  <span className="text-sm font-semibold text-neutral-900">{data?.training.completionRate ?? 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">Completed (30d)</span>
                  <span className="text-sm font-semibold text-success">{data?.training.completedRecently ?? 0}</span>
                </div>
              </div>
              <Link
                href="/admin/training"
                className="mt-4 flex items-center justify-center gap-1.5 text-xs text-primary-500 hover:text-primary-600 font-medium py-2 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
              >
                Manage Courses <ChevronRightIcon className="h-3 w-3" />
              </Link>
            </div>

            {/* Engagement Snapshot */}
            <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-card">
              <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-2 mb-4">
                <TrophyIcon className="h-4 w-4 text-neutral-400" />
                Engagement
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">Badges Awarded (30d)</span>
                  <span className="text-sm font-semibold text-neutral-900">{data?.engagement.badgesAwarded ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">Active Alerts</span>
                  <span className={`text-sm font-semibold ${(data?.engagement.activeAlerts ?? 0) > 0 ? "text-error" : "text-neutral-900"}`}>
                    {data?.engagement.activeAlerts ?? 0}
                  </span>
                </div>
              </div>
              <Link
                href="/admin/badges"
                className="mt-4 flex items-center justify-center gap-1.5 text-xs text-primary-500 hover:text-primary-600 font-medium py-2 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
              >
                Manage Badges <ChevronRightIcon className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
