"use client";

import { ClientHeader } from "@/components/portal/ClientHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import {
  useChessCategories,
  useChessLessonProgress,
} from "@/hooks/useChessLessons";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import {
  AcademicCapIcon,
  ArrowPathIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  LockClosedIcon,
  StarIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function LearnClient() {
  const { data, isLoading } = useChessCategories();
  const { data: progress } = useChessLessonProgress();

  return (
    <div className="min-h-screen bg-accent-light">
      <ClientHeader />
      <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <PortalPageHeader
          icon={TrophyIcon}
          title="Learn Chess"
          description="Interactive lessons to master each piece and fundamental tactics"
          colorScheme="teal"
          flush
        />

        <div className="px-4 sm:px-6 py-4 sm:py-6">
        {/* Overall progress */}
        {progress && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-600">
                  Overall Progress
                </span>
                <span className="text-sm text-neutral-500">
                  {progress.completedLessons}/{progress.totalLessons} lessons
                </span>
              </div>
              <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <div className="text-xs text-neutral-400 mt-1">
                {progress.completedLevels}/{progress.totalLevels} levels completed
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <ArrowPathIcon className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        )}

        {!isLoading && data?.categories && (
          <div className="space-y-8">
            {data.categories.map((category) => {
              const catProgress =
                category.totalLessons > 0
                  ? Math.round(
                      (category.completedLessons / category.totalLessons) * 100
                    )
                  : 0;
              const isCatComplete =
                category.completedLessons === category.totalLessons &&
                category.totalLessons > 0;

              return (
                <div key={category.id}>
                  {/* Category header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <BookOpenIcon
                        className="w-5 h-5"
                        style={{ color: category.color }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-neutral-800">
                          {category.name}
                        </h2>
                        {isCatComplete && (
                          <CheckCircleIcon className="w-5 h-5 text-success" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${catProgress}%`,
                              backgroundColor: category.color,
                            }}
                          />
                        </div>
                        <span className="text-xs text-neutral-400">
                          {category.completedLessons}/{category.totalLessons}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lessons grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {category.lessons.map((lesson, idx) => {
                      const lessonProgress =
                        lesson.totalLevels > 0
                          ? Math.round(
                              (lesson.completedLevels / lesson.totalLevels) *
                                100
                            )
                          : 0;

                      // First incomplete lesson is "in progress", others after it are "locked"
                      const prevComplete =
                        idx === 0 || category.lessons[idx - 1].isComplete;
                      const isAccessible = lesson.isComplete || prevComplete;

                      return (
                        <Link
                          key={lesson.id}
                          href={
                            isAccessible ? `/learn/${lesson.id}` : "#"
                          }
                          className={
                            isAccessible
                              ? ""
                              : "pointer-events-none"
                          }
                        >
                          <Card
                            className={`transition-all ${
                              isAccessible
                                ? "hover:shadow-sm cursor-pointer"
                                : "opacity-50"
                            } ${
                              lesson.isComplete
                                ? "border-success bg-success-light/30"
                                : ""
                            }`}
                          >
                            <CardContent className="p-4 flex items-center gap-4">
                              {/* Icon */}
                              <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                                style={{
                                  backgroundColor: lesson.isComplete
                                    ? "#dcfce7"
                                    : `${category.color}15`,
                                }}
                              >
                                {!isAccessible ? (
                                  <LockClosedIcon className="w-5 h-5 text-neutral-400" />
                                ) : lesson.isComplete ? (
                                  <CheckCircleIcon className="w-6 h-6 text-success" />
                                ) : (
                                  lesson.iconEmoji || "♟"
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-neutral-800">
                                  {lesson.title}
                                </div>
                                {lesson.subtitle && (
                                  <div className="text-xs text-neutral-500 truncate">
                                    {lesson.subtitle}
                                  </div>
                                )}
                                {/* Level stars */}
                                <div className="flex gap-0.5 mt-1">
                                  {Array.from(
                                    { length: lesson.totalLevels },
                                    (_, i) => (
                                      <StarIcon
                                        key={i}
                                        className={`w-3 h-3 ${
                                          i < lesson.completedLevels
                                            ? "text-warning fill-warning"
                                            : "text-neutral-200"
                                        }`}
                                      />
                                    )
                                  )}
                                </div>
                              </div>

                              {/* Progress / Arrow */}
                              <div className="shrink-0">
                                {lesson.isComplete ? (
                                  <span className="text-xs text-success font-medium">
                                    Complete
                                  </span>
                                ) : lessonProgress > 0 ? (
                                  <span className="text-xs text-primary-600 font-medium">
                                    {lessonProgress}%
                                  </span>
                                ) : isAccessible ? (
                                  <ChevronRightIcon className="w-5 h-5 text-neutral-300" />
                                ) : null}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
        </div>
      </div>
    </DashboardLayout>
    </div>
  );
}
