"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useTrainingCatalog, useEnrollInCourse } from "@/hooks/useTrainingCourses";
import { useLearningPaths, LearningPathWithProgress, LearningPathCourse } from "@/hooks/useLearningPaths";
import { toast } from "sonner";
import {
  AcademicCapIcon,
  ArrowPathIcon,
  BookOpenIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  ExclamationCircleIcon,
  FlagIcon,
  FunnelIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  MapIcon,
  PlayCircleIcon,
  PlayIcon,
  SparklesIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import type { CourseCategory, CourseDifficulty } from "@prisma/client";

// Category labels and icons
const categoryLabels: Record<CourseCategory, string> = {
  ONBOARDING: "Onboarding",
  TEACHING_SKILLS: "Teaching Skills",
  CHESS_SKILLS: "Chess Skills",
  BUSINESS: "Business",
  LEADERSHIP: "Leadership",
  CERTIFICATION: "Certification",
};

const categoryIcons: Record<CourseCategory, React.ReactNode> = {
  ONBOARDING: <SparklesIcon className="w-5 h-5" />,
  TEACHING_SKILLS: <BookOpenIcon className="w-5 h-5" />,
  CHESS_SKILLS: <TrophyIcon className="w-5 h-5" />,
  BUSINESS: <BriefcaseIcon className="w-5 h-5" />,
  LEADERSHIP: <TrophyIcon className="w-5 h-5" />,
  CERTIFICATION: <CheckCircleIcon className="w-5 h-5" />,
};

const difficultyColors: Record<CourseDifficulty, string> = {
  BEGINNER: "bg-success-light text-success-dark",
  INTERMEDIATE: "bg-warning-light text-warning-dark",
  ADVANCED: "bg-error-light text-error-dark",
};

// Path Course Card component
function PathCourseCard({
  pathCourse,
  index,
  isUnlocked,
  isFirst,
}: {
  pathCourse: LearningPathCourse;
  index: number;
  isUnlocked: boolean;
  isFirst: boolean;
}) {
  const { course, enrollment, isRequired } = pathCourse;
  const isCompleted = enrollment?.status === "COMPLETED";
  const isInProgress = enrollment?.status === "IN_PROGRESS";
  const progress = enrollment?.progress || 0;

  return (
    <div className="relative">
      {!isFirst && (
        <div className="absolute left-6 -top-3 w-0.5 h-3 bg-neutral-200" />
      )}

      <div
        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
          isCompleted
            ? "bg-success-light border-success"
            : isInProgress
            ? "bg-primary-50 border-primary-200"
            : isUnlocked
            ? "bg-white border-neutral-200 hover:border-primary-300 hover:shadow-sm"
            : "bg-neutral-50 border-neutral-100 opacity-50"
        }`}
      >
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isCompleted
              ? "bg-success-light"
              : isInProgress
              ? "bg-primary-100"
              : isUnlocked
              ? "bg-neutral-100"
              : "bg-neutral-200"
          }`}
        >
          {isCompleted ? (
            <CheckCircleIcon className="w-6 h-6 text-success" />
          ) : isInProgress ? (
            <PlayIcon className="w-6 h-6 text-primary-600" />
          ) : isUnlocked ? (
            <span className="text-lg font-bold text-neutral-600">{index + 1}</span>
          ) : (
            <LockClosedIcon className="w-5 h-5 text-neutral-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-neutral-900 truncate">{course.title}</h4>
            {isRequired && (
              <span className="px-2 py-0.5 text-xs font-medium bg-warning-light text-warning-dark rounded-full flex-shrink-0">
                Required
              </span>
            )}
          </div>
          {isInProgress && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-neutral-500">{progress}%</span>
            </div>
          )}
        </div>

        {isUnlocked && !isCompleted && (
          <Link href={`/training/${course.slug}`}>
            <Button size="sm" variant={isInProgress ? "primary" : "outline"}>
              {isInProgress ? "Continue" : "Start"}
            </Button>
          </Link>
        )}
        {isCompleted && (
          <Link href={`/training/${course.slug}`}>
            <Button size="sm" variant="ghost">
              Review
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

// Learning Path Card component
function LearningPathCard({ path }: { path: LearningPathWithProgress }) {
  const { progress, courses, isRequired } = path;

  const unlockedCourses = new Set<string>();
  let canUnlock = true;

  courses.forEach((pc) => {
    if (canUnlock) {
      unlockedCourses.add(pc.courseId);
      if (pc.isRequired && pc.enrollment?.status !== "COMPLETED") {
        canUnlock = false;
      }
    }
  });

  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      <div
        className={`p-6 ${
          progress.isComplete
            ? "bg-gradient-to-r from-success-light to-success-light"
            : isRequired
            ? "bg-gradient-to-r from-warning-light to-accent-orange"
            : "bg-gradient-to-r from-primary-500 to-primary-400"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
              {progress.isComplete ? (
                <CheckCircleIcon className="w-5 h-5 text-white" />
              ) : (
                <MapIcon className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{path.title}</h3>
              {path.description && (
                <p className="text-white/80 text-sm mt-1">{path.description}</p>
              )}
            </div>
          </div>
          {isRequired && (
            <span className="px-3 py-1 text-xs font-medium bg-white/20 text-white rounded-full">
              Required
            </span>
          )}
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-white/90 text-sm mb-2">
            <span>{progress.completedCourses} of {progress.totalCourses} courses</span>
            <span className="font-bold">{progress.percentComplete}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${progress.percentComplete}%` }}
            />
          </div>
        </div>
      </div>

      <CardContent className="p-5 space-y-3">
        {courses.map((pc, index) => (
          <PathCourseCard
            key={pc.id}
            pathCourse={pc}
            index={index}
            isUnlocked={unlockedCourses.has(pc.courseId)}
            isFirst={index === 0}
          />
        ))}

        {progress.isComplete && (
          <div className="mt-4 p-4 bg-success-light rounded-xl border border-success">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success-light rounded-xl flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="font-semibold text-success-dark">Path Completed!</p>
                <p className="text-sm text-success-dark">Great work finishing this learning path.</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TrainingCatalogClient() {
  const [activeTab, setActiveTab] = useState<"paths" | "courses">("paths");
  const [selectedCategory, setSelectedCategory] = useState<CourseCategory | undefined>();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: catalogData, isLoading: catalogLoading, error: catalogError } = useTrainingCatalog({
    category: selectedCategory,
    search: searchQuery || undefined,
  });

  const { data: pathsData, isLoading: pathsLoading, error: pathsError } = useLearningPaths();

  const enrollMutation = useEnrollInCourse();

  const handleEnroll = async (slug: string, title: string) => {
    try {
      await enrollMutation.mutateAsync(slug);
      toast.success(`Enrolled in "${title}"`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to enroll");
    }
  };

  const isLoading = catalogLoading || pathsLoading;
  const hasError = catalogError || pathsError;

  const courses = catalogData?.courses || [];
  const paths = pathsData || [];

  // Stats
  const totalCourses = courses.length;
  const enrolledCount = courses.filter((c) => c.enrollment).length;
  const completedCount = courses.filter((c) => c.enrollment?.status === "COMPLETED").length;
  const completedPaths = paths.filter(p => p.progress.isComplete).length;

  // Group courses by category
  const coursesByCategory = courses.reduce((acc, course) => {
    const cat = course.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(course);
    return acc;
  }, {} as Record<CourseCategory, typeof courses>);

  // Separate required and optional paths
  const requiredPaths = paths.filter(p => p.isRequired);
  const optionalPaths = paths.filter(p => !p.isRequired);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <ArrowPathIcon className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (hasError) {
    return (
      <DashboardLayout>
        <Card className="border-error bg-error-light">
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4 text-error-dark">
              <ExclamationCircleIcon className="w-12 h-12" />
              <p className="text-lg font-medium">Failed to load training content</p>
              <p className="text-sm text-error">Please try refreshing the page.</p>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
      {/* Page Title */}
      <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-neutral-100">
        <h1 className="text-2xl font-semibold text-neutral-900">Training Center</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Develop your skills with guided paths and courses</p>
      </div>

      <div className="px-5 sm:px-6 py-5 sm:py-6">

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("paths")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all min-h-[48px] ${
            activeTab === "paths"
              ? "bg-primary-500 text-white shadow-sm"
              : "bg-white text-neutral-600 hover:bg-neutral-50 active:bg-neutral-100 border border-neutral-200"
          }`}
        >
          <MapIcon className="w-5 h-5" />
          Learning Paths
          {paths.length > 0 && (
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              activeTab === "paths" ? "bg-white/20" : "bg-neutral-100"
            }`}>
              {completedPaths}/{paths.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("courses")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all min-h-[48px] ${
            activeTab === "courses"
              ? "bg-primary-500 text-white shadow-sm"
              : "bg-white text-neutral-600 hover:bg-neutral-50 active:bg-neutral-100 border border-neutral-200"
          }`}
        >
          <BookOpenIcon className="w-5 h-5" />
          All Courses
          {totalCourses > 0 && (
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              activeTab === "courses" ? "bg-white/20" : "bg-neutral-100"
            }`}>
              {completedCount}/{totalCourses}
            </span>
          )}
        </button>
      </div>

      {/* Learning Paths Tab */}
      {activeTab === "paths" && (
        <div className="space-y-6">
          {paths.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-lg bg-gradient-to-br from-warning-light to-accent-orange-light flex items-center justify-center">
                  <MapIcon className="w-10 h-10 text-warning" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Learning Paths Yet</h3>
                <p className="text-neutral-500 mb-4">Check back soon for guided training paths.</p>
                <Button onClick={() => setActiveTab("courses")}>
                  Browse All Courses
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {requiredPaths.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-warning rounded-full" />
                    Required Paths
                  </h2>
                  <div className="space-y-6">
                    {requiredPaths.map(path => (
                      <LearningPathCard key={path.id} path={path} />
                    ))}
                  </div>
                </div>
              )}

              {optionalPaths.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary-500 rounded-full" />
                    Optional Paths
                  </h2>
                  <div className="space-y-6">
                    {optionalPaths.map(path => (
                      <LearningPathCard key={path.id} path={path} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* All Courses Tab */}
      {activeTab === "courses" && (
        <div className="space-y-6">
          {/* Filters */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 w-full sm:min-w-[200px] relative">
                  <MagnifyingGlassIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="MagnifyingGlassIcon courses..."
                    className="w-full pl-11 pr-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <FunnelIcon className="w-4 h-4 text-neutral-400" />
                  <select
                    value={selectedCategory || ""}
                    onChange={(e) => setSelectedCategory((e.target.value as CourseCategory) || undefined)}
                    className="border border-neutral-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Categories</option>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {courses.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-lg bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                  <AcademicCapIcon className="w-10 h-10 text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Courses Found</h3>
                <p className="text-neutral-500">Try adjusting your search or filters.</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(coursesByCategory).map(([category, categoryCourses]) => (
              <div key={category}>
                <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  {categoryIcons[category as CourseCategory]}
                  {categoryLabels[category as CourseCategory]}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {categoryCourses.map((course) => {
                    const isEnrolled = !!course.enrollment;
                    const isCompleted = course.enrollment?.status === "COMPLETED";
                    const isInProgress = course.enrollment?.status === "IN_PROGRESS";

                    return (
                      <Card
                        key={course.id}
                        className={`overflow-hidden border-0 shadow-sm transition-all hover:shadow-sm ${
                          isCompleted ? "ring-2 ring-success" : ""
                        }`}
                      >
                        <div
                          className="h-28 bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center relative"
                          style={
                            course.thumbnailUrl
                              ? { backgroundImage: `url(${course.thumbnailUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                              : undefined
                          }
                        >
                          {!course.thumbnailUrl && (
                            <AcademicCapIcon className="w-12 h-12 text-white/30" />
                          )}
                          {isCompleted && (
                            <div className="absolute top-3 right-3 bg-success text-white px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                              <CheckCircleIcon className="w-3.5 h-3.5" />
                              Completed
                            </div>
                          )}
                          {isInProgress && (
                            <div className="absolute top-3 right-3 bg-warning text-white px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                              <PlayCircleIcon className="w-3.5 h-3.5" />
                              {course.enrollment?.progress}%
                            </div>
                          )}
                          {course.isRequired && !isEnrolled && (
                            <div className="absolute top-3 left-3 bg-error text-white px-2.5 py-1 rounded-lg text-xs font-medium">
                              Required
                            </div>
                          )}
                        </div>

                        <CardContent className="p-5">
                          <h3 className="font-semibold text-neutral-900 mb-2 line-clamp-1">
                            {course.title}
                          </h3>
                          <p className="text-sm text-neutral-500 line-clamp-2 mb-4">
                            {course.description || "No description available"}
                          </p>

                          <div className="flex items-center gap-3 text-xs text-neutral-400 mb-4">
                            <span className="flex items-center gap-1">
                              <BookOpenIcon className="w-3.5 h-3.5" />
                              {course.moduleCount} modules
                            </span>
                            {course.duration && (
                              <span className="flex items-center gap-1">
                                <ClockIcon className="w-3.5 h-3.5" />
                                {course.duration} min
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full ${difficultyColors[course.difficulty]}`}>
                              {course.difficulty}
                            </span>
                          </div>

                          {isEnrolled ? (
                            <Link href={`/training/${course.slug}`}>
                              <Button className="w-full" variant={isCompleted ? "outline" : "primary"}>
                                {isCompleted ? "Review Course" : "Continue Learning"}
                              </Button>
                            </Link>
                          ) : (
                            <Button
                              className="w-full"
                              onClick={() => handleEnroll(course.slug, course.title)}
                              disabled={enrollMutation.isPending}
                            >
                              {enrollMutation.isPending ? (
                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                              ) : (
                                "Enroll Now"
                              )}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      </div>
      </div>
    </DashboardLayout>
  );
}
