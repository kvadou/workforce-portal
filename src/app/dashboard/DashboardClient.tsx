"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/hooks/useDashboard";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CourseProgressCard } from "@/components/dashboard/CourseProgressCard";
import {
  BookOpenIcon,
  ChevronRightIcon,
  ExclamationCircleIcon,
  PlayIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/outline";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  type: string;
  isPinned?: boolean;
  publishDate?: string;
}

function timeAgo(date?: string): string {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const TYPE_STYLES: Record<string, string> = {
  IMPORTANT_DATE: "bg-warning-light text-warning-dark",
  ANNOUNCEMENT: "bg-info-light text-info-dark",
  STORY_SPOTLIGHT: "bg-primary-50 text-primary-700",
  TUTOR_REVIEW: "bg-success-light text-success",
};
const TYPE_FALLBACK = "bg-neutral-100 text-neutral-600";

export function DashboardClient() {
  const { data: dashboard, isLoading, error } = useDashboard();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);

  useEffect(() => {
    fetch("/api/announcements?isActive=true")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        const list: AnnouncementItem[] = Array.isArray(d) ? d : d.announcements || [];
        const sorted = [...list].sort((a, b) => {
          if (!!b.isPinned !== !!a.isPinned) return b.isPinned ? 1 : -1;
          return new Date(b.publishDate || 0).getTime() - new Date(a.publishDate || 0).getTime();
        });
        setAnnouncements(sorted.slice(0, 4));
      })
      .catch(() => {});
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6">
            <Skeleton className="h-7 w-56 mb-1" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="px-5 sm:px-6 pb-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SkeletonCard className="h-24" />
              <SkeletonCard className="h-24" />
              <SkeletonCard className="h-24" />
            </div>
            <SkeletonCard className="h-48" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !dashboard) {
    return (
      <DashboardLayout>
        <Card className="border-error bg-error-light">
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4 text-error-dark">
              <ExclamationCircleIcon className="w-12 h-12" />
              <p className="text-lg font-medium">Failed to load dashboard</p>
              <p className="text-sm text-error">Please try refreshing the page.</p>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const { training, inProgressCourses, stats } = dashboard;
  const isNewUser = stats.classCount === 0 && stats.totalLessons === 0;
  const completionPercent = training.enrolled > 0
    ? Math.round((training.completed / training.enrolled) * 100)
    : 0;

  return (
    <DashboardLayout>
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Page Title */}
        <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-neutral-100">
          <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {isNewUser
              ? "Welcome! Let's get you started on your tutoring journey."
              : `You have ${inProgressCourses.length} course${inProgressCourses.length !== 1 ? "s" : ""} in progress.`}
          </p>
        </div>

        <div className="px-5 sm:px-6 py-5 sm:py-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 transition-all duration-200 hover:border-primary-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <BookOpenIcon className="h-5 w-5 text-primary-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-neutral-900 tabular-nums">{inProgressCourses.length}</p>
                  <p className="text-xs text-neutral-500 font-medium">In Progress</p>
                </div>
              </div>
            </div>

            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 transition-all duration-200 hover:border-success">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-success-light flex items-center justify-center">
                  <CheckCircleIcon className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-neutral-900 tabular-nums">{training.completed}</p>
                  <p className="text-xs text-neutral-500 font-medium">Completed</p>
                </div>
              </div>
            </div>

            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 transition-all duration-200 hover:border-info">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-info-light flex items-center justify-center">
                  <AcademicCapIcon className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-neutral-900 tabular-nums">{completionPercent}%</p>
                  <p className="text-xs text-neutral-500 font-medium">Training Complete</p>
                </div>
              </div>
            </div>
          </div>

          {/* Continue Training or Get Started */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">
                {isNewUser ? "Get Started" : "Continue Training"}
              </h2>
              <Link
                href="/training"
                className="text-sm text-primary-500 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors"
              >
                View all
                <ChevronRightIcon className="w-4 h-4" />
              </Link>
            </div>

            {isNewUser ? (
              <div className="space-y-3">
                <Link href="/training" className="group block">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200">
                    <div className="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <PlayIcon className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 text-sm">Start Training</p>
                      <p className="text-xs text-neutral-500">Complete your required courses to get started</p>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-neutral-300 group-hover:text-primary-400 transition-colors" />
                  </div>
                </Link>
                <Link href="/profile" className="group block">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200">
                    <div className="h-10 w-10 rounded-xl bg-success-light flex items-center justify-center group-hover:scale-105 transition-transform">
                      <BookOpenIcon className="h-5 w-5 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 text-sm">Complete Your Profile</p>
                      <p className="text-xs text-neutral-500">Add your contact info and teaching experience</p>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-neutral-300 group-hover:text-primary-400 transition-colors" />
                  </div>
                </Link>
              </div>
            ) : inProgressCourses.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-neutral-100 flex items-center justify-center">
                  <CheckCircleIcon className="w-7 h-7 text-success" />
                </div>
                <p className="text-sm font-medium text-neutral-900 mb-1">All caught up!</p>
                <p className="text-xs text-neutral-500 mb-4">You have no courses in progress.</p>
                <Link href="/training">
                  <Button size="sm" className="gap-2">
                    <PlayIcon className="w-4 h-4" />
                    Browse Courses
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {inProgressCourses.slice(0, 4).map((course) => (
                  <CourseProgressCard key={course.id} {...course} compact />
                ))}
              </div>
            )}
          </div>

          {/* Latest Updates */}
          {announcements.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                  <MegaphoneIcon className="h-5 w-5 text-primary-500" />
                  Latest Updates
                </h2>
              </div>
              <div className="space-y-2">
                {announcements.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start gap-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-primary-200 transition-all duration-200"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {a.isPinned && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-primary-600">Pinned</span>
                        )}
                        <p className="font-medium text-neutral-900 text-sm truncate">{a.title}</p>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TYPE_STYLES[a.type] || TYPE_FALLBACK}`}>
                          {a.type?.replace(/_/g, " ").toLowerCase()}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{a.content}</p>
                    </div>
                    <span className="text-xs text-neutral-400 whitespace-nowrap pt-0.5">{timeAgo(a.publishDate)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
