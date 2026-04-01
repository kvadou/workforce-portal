"use client";

import {
  AcademicCapIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  BookOpenIcon,
  ChartBarIcon,
  ChartBarSquareIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  FireIcon,
  StarIcon,
  TrophyIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAnalytics, useLeaderboards } from "@/hooks/useAnalytics";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type TabType = "overview" | "leaderboards" | "activity";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-success-light text-success-dark",
  INACTIVE: "bg-neutral-100 text-neutral-600",
  PENDING: "bg-warning-light text-warning-dark",
  QUIT: "bg-error-light text-error",
  TERMINATED: "bg-error-light text-error",
};

const onboardingStatusLabels: Record<string, string> = {
  PENDING: "Pending",
  WELCOME: "Welcome",
  VIDEOS_IN_PROGRESS: "Watching Videos",
  QUIZ_PENDING: "Quiz Ready",
  QUIZ_FAILED: "Quiz Failed",
  PROFILE_PENDING: "Profile Pending",
  W9_PENDING: "W-9 Pending",
  AWAITING_ORIENTATION: "Awaiting Orientation",
  ORIENTATION_SCHEDULED: "Orientation Scheduled",
  POST_ORIENTATION_TRAINING: "Training",
  SHADOW_LESSONS: "Shadow Lessons",
  COMPLETED: "Completed",
  ACTIVATED: "Activated",
  RETURNED: "Returned",
};

export default function AnalyticsDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const { data: analytics, isLoading, error, refetch, isFetching } = useAnalytics();
  const { data: leaderboards, isLoading: leaderboardsLoading } = useLeaderboards();

  if (isLoading) {
    return <LoadingSpinner fullPage />;
  }

  if (error || !analytics) {
    return (
      <div className="p-6 text-center">
        <ExclamationCircleIcon className="h-16 w-16 text-error mx-auto mb-4" />
        <h3 className="text-heading-sm text-neutral-900 mb-2">
          Failed to load analytics
        </h3>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-heading-lg text-neutral-900 flex items-center gap-2">
            <ChartBarIcon className="h-8 w-8 text-primary-500" />
            Analytics Dashboard
          </h1>
          <p className="text-body text-neutral-500 mt-1">
            Real-time insights into tutor engagement and performance
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <ArrowPathIcon className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {[
          { id: "overview", label: "Overview", icon: <ChartBarIcon className="h-4 w-4" /> },
          { id: "leaderboards", label: "Leaderboards", icon: <TrophyIcon className="h-4 w-4" /> },
          { id: "activity", label: "Recent ChartBarSquareIcon", icon: <ChartBarSquareIcon className="h-4 w-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-[2px] transition-colors ${
              activeTab === tab.id
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              {
                label: "Total UsersIcon",
                value: analytics.overview.totalUsers,
                icon: <UsersIcon className="h-5 w-5" />,
                color: "bg-info-light text-info",
              },
              {
                label: "Active Tutors",
                value: analytics.overview.activeTutors,
                icon: <CheckCircleIcon className="h-5 w-5" />,
                color: "bg-success-light text-success",
              },
              {
                label: "Onboarding",
                value: analytics.overview.onboardingTutors,
                icon: <ClockIcon className="h-5 w-5" />,
                color: "bg-warning-light text-warning",
              },
              {
                label: "Total Lessons",
                value: analytics.overview.totalLessons.toLocaleString(),
                icon: <BookOpenIcon className="h-5 w-5" />,
                color: "bg-primary-100 text-primary-600",
              },
              {
                label: "Avg Rating",
                value: analytics.overview.averageRating,
                icon: <StarIcon className="h-5 w-5" />,
                color: "bg-warning-light text-warning",
              },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-lg ${stat.color} flex items-center justify-center`}
                    >
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-neutral-900">
                        {stat.value}
                      </p>
                      <p className="text-body-sm text-neutral-500">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tutor Status Breakdown */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                  <UsersIcon className="h-5 w-5 text-primary-500" />
                  Tutor Status
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.tutors.byStatus.map((s) => (
                    <div key={s.status} className="flex items-center justify-between">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          statusColors[s.status] || "bg-neutral-100"
                        }`}
                      >
                        {s.status}
                      </span>
                      <span className="font-semibold text-neutral-900">{s.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Badges */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                  <TrophyIcon className="h-5 w-5 text-primary-500" />
                  Badges
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">Total Earned</span>
                    <span className="text-2xl font-bold text-neutral-900">
                      {analytics.badges.totalEarned}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">This Week</span>
                    <span className="text-lg font-semibold text-success">
                      +{analytics.badges.earnedThisWeek}
                    </span>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-xs text-neutral-500 mb-2">Recent Badges</p>
                    <div className="space-y-2">
                      {analytics.badges.recent.slice(0, 5).map((b) => (
                        <div key={b.id} className="flex items-center gap-2 text-sm">
                          <span className="text-lg">{b.badgeIcon}</span>
                          <span className="text-neutral-600">{b.userName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Training */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                  <AcademicCapIcon className="h-5 w-5 text-primary-500" />
                  Training
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">Total Enrollments</span>
                    <span className="text-2xl font-bold text-neutral-900">
                      {analytics.training.totalEnrollments}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">Completions</span>
                    <span className="text-lg font-semibold text-success">
                      {analytics.training.completions}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">Completion Rate</span>
                    <span className="text-lg font-semibold text-primary-600">
                      {analytics.training.completionRate}%
                    </span>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-xs text-neutral-500 mb-2">This Month</p>
                    <span className="text-lg font-semibold text-neutral-900">
                      {analytics.training.enrollmentsThisMonth} new enrollments
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Onboarding Pipeline */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                <ArrowTrendingUpIcon className="h-5 w-5 text-primary-500" />
                Onboarding Pipeline
              </h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {analytics.onboarding.byStatus.map((s) => (
                  <div
                    key={s.status}
                    className="bg-neutral-50 rounded-lg p-3 text-center"
                  >
                    <p className="text-2xl font-bold text-neutral-900">{s.count}</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {onboardingStatusLabels[s.status] || s.status}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Team Distribution */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-neutral-900">Team Distribution</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {analytics.tutors.byTeam.map((t) => (
                  <div
                    key={t.team}
                    className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-4 text-center"
                  >
                    <p className="text-3xl font-bold text-primary-700">{t.count}</p>
                    <p className="text-sm text-primary-600 mt-1">{t.team}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leaderboards Tab */}
      {activeTab === "leaderboards" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {leaderboardsLoading ? (
            <div className="col-span-2">
              <LoadingSpinner fullPage />
            </div>
          ) : leaderboards ? (
            <>
              {/* Top by Lessons */}
              <Card>
                <CardHeader>
                  <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                    <BookOpenIcon className="h-5 w-5 text-info" />
                    Most Lessons Taught
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leaderboards.topByLessons.map((entry) => (
                      <div
                        key={entry.tutorId}
                        className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded-lg"
                      >
                        <div
                          className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                            entry.rank === 1
                              ? "bg-warning-light text-warning-dark"
                              : entry.rank === 2
                              ? "bg-neutral-200 text-neutral-700"
                              : entry.rank === 3
                              ? "bg-accent-orange-light text-accent-orange"
                              : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {entry.rank}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-neutral-900">{entry.name}</p>
                          {entry.team && (
                            <p className="text-xs text-neutral-500">{entry.team}</p>
                          )}
                        </div>
                        <span className="font-bold text-primary-600">
                          {entry.totalLessons}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top by Rating */}
              <Card>
                <CardHeader>
                  <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                    <StarIcon className="h-5 w-5 text-warning" />
                    Highest Rated
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leaderboards.topByRating.map((entry) => (
                      <div
                        key={entry.tutorId}
                        className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded-lg"
                      >
                        <div
                          className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                            entry.rank === 1
                              ? "bg-warning-light text-warning-dark"
                              : entry.rank === 2
                              ? "bg-neutral-200 text-neutral-700"
                              : entry.rank === 3
                              ? "bg-accent-orange-light text-accent-orange"
                              : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {entry.rank}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-neutral-900">{entry.name}</p>
                          <p className="text-xs text-neutral-500">
                            {entry.totalLessons} lessons
                          </p>
                        </div>
                        <span className="font-bold text-warning">
                          {entry.averageRating} ⭐
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Badge Earners */}
              <Card>
                <CardHeader>
                  <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                    <TrophyIcon className="h-5 w-5 text-primary-500" />
                    Most Badges Earned
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leaderboards.topBadgeEarners.map((entry) => (
                      <div
                        key={entry.userId}
                        className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded-lg"
                      >
                        <div
                          className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                            entry.rank === 1
                              ? "bg-warning-light text-warning-dark"
                              : entry.rank === 2
                              ? "bg-neutral-200 text-neutral-700"
                              : entry.rank === 3
                              ? "bg-accent-orange-light text-accent-orange"
                              : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {entry.rank}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-neutral-900">{entry.name}</p>
                        </div>
                        <span className="font-bold text-primary-600">
                          {entry.badgeCount} 🏆
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Streaks */}
              <Card>
                <CardHeader>
                  <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                    <FireIcon className="h-5 w-5 text-accent-orange" />
                    Longest Streaks
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leaderboards.topStreaks.length === 0 ? (
                      <p className="text-neutral-500 text-center py-4">
                        No streaks recorded yet
                      </p>
                    ) : (
                      leaderboards.topStreaks.map((entry) => (
                        <div
                          key={entry.tutorId}
                          className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded-lg"
                        >
                          <div
                            className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                              entry.rank === 1
                                ? "bg-warning-light text-warning-dark"
                                : entry.rank === 2
                                ? "bg-neutral-200 text-neutral-700"
                                : entry.rank === 3
                                ? "bg-accent-orange-light text-accent-orange"
                                : "bg-neutral-100 text-neutral-500"
                            }`}
                          >
                            {entry.rank}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-neutral-900">{entry.name}</p>
                            <p className="text-xs text-neutral-500">
                              Best: {entry.longestStreak} days
                            </p>
                          </div>
                          <span className="font-bold text-accent-orange">
                            {entry.currentStreak} 🔥
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Training Completions */}
              <Card className="col-span-2">
                <CardHeader>
                  <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                    <AcademicCapIcon className="h-5 w-5 text-success" />
                    Most Training Completions
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {leaderboards.topTrainingCompletions.map((entry) => (
                      <div
                        key={entry.userId}
                        className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg"
                      >
                        <div
                          className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                            entry.rank === 1
                              ? "bg-warning-light text-warning-dark"
                              : entry.rank === 2
                              ? "bg-neutral-200 text-neutral-700"
                              : entry.rank === 3
                              ? "bg-accent-orange-light text-accent-orange"
                              : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {entry.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-neutral-900 truncate">
                            {entry.name}
                          </p>
                        </div>
                        <span className="font-bold text-success">
                          {entry.completedCourses}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      )}

      {/* ChartBarSquareIcon Tab */}
      {activeTab === "activity" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Notes */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5 text-primary-500" />
                Recent Notes
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.recentActivity.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 bg-neutral-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-neutral-900">
                        {note.tutorName}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600">{note.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          note.type === "PERFORMANCE"
                            ? "bg-info-light text-info-dark"
                            : note.type === "INCIDENT"
                            ? "bg-error-light text-error-dark"
                            : note.type === "FEEDBACK"
                            ? "bg-success-light text-success-dark"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {note.type}
                      </span>
                      <span className="text-xs text-neutral-400">
                        by {note.createdByName}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Audit Log */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                <ChartBarSquareIcon className="h-5 w-5 text-primary-500" />
                Audit Log
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.recentActivity.auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-neutral-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-neutral-900">
                        {log.tutorName}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600">
                      <span className="font-medium">{log.action}</span>
                      {log.field && (
                        <>
                          : {log.field} changed from{" "}
                          <span className="text-error">{log.previousValue}</span> to{" "}
                          <span className="text-success">{log.newValue}</span>
                        </>
                      )}
                    </p>
                    <span className="text-xs text-neutral-400">
                      by {log.performedByName}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
