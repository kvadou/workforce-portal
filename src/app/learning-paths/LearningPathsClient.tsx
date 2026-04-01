"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLearningPaths, LearningPathWithProgress, LearningPathCourse } from "@/hooks/useLearningPaths";
import {
  ArrowPathIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  ExclamationCircleIcon,
  FlagIcon,
  LockClosedIcon,
  MapIcon,
  PlayIcon,
  SparklesIcon,
  StopCircleIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
// Difficulty badge colors
const difficultyColors: Record<string, { bg: string; text: string }> = {
  BEGINNER: { bg: "bg-success-light", text: "text-success-dark" },
  INTERMEDIATE: { bg: "bg-warning-light", text: "text-warning-dark" },
  ADVANCED: { bg: "bg-error-light", text: "text-error-dark" },
};

// Course card within a learning path
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

  const difficultyStyle = difficultyColors[course.difficulty] || difficultyColors.BEGINNER;

  return (
    <div className="relative">
      {/* Connector line */}
      {!isFirst && (
        <div className="absolute left-6 -top-4 w-0.5 h-4 bg-neutral-200" />
      )}

      <div
        className={`flex items-start gap-4 p-4 rounded-[var(--radius-lg)] border-2 transition-all ${
          isCompleted
            ? "bg-success-light border-success"
            : isInProgress
            ? "bg-primary-50 border-primary-200"
            : isUnlocked
            ? "bg-white border-neutral-200 hover:border-primary-300 hover:shadow-sm"
            : "bg-neutral-50 border-neutral-200 opacity-60"
        }`}
      >
        {/* Status icon */}
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
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

        {/* Course info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-neutral-900">{course.title}</h4>
              {course.description && (
                <p className="text-body-sm text-neutral-500 line-clamp-2 mt-1">
                  {course.description}
                </p>
              )}
            </div>
            {isRequired && (
              <span className="px-2 py-0.5 text-xs font-medium bg-warning-light text-warning-dark rounded-full flex-shrink-0">
                Required
              </span>
            )}
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-4 mt-2">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${difficultyStyle.bg} ${difficultyStyle.text}`}>
              {course.difficulty}
            </span>
            {course.duration && (
              <span className="flex items-center gap-1 text-xs text-neutral-500">
                <ClockIcon className="w-3 h-3" />
                {course.duration} min
              </span>
            )}
            {course.grantsCertification && (
              <span className="flex items-center gap-1 text-xs text-warning">
                <TrophyIcon className="w-3 h-3" />
                Certificate
              </span>
            )}
          </div>

          {/* Progress bar (if in progress) */}
          {isInProgress && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-accent-navy-light rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action */}
        {isUnlocked && !isCompleted && (
          <Link href={`/training/${course.slug}`}>
            <Button size="sm" variant={isInProgress ? "primary" : "outline"}>
              {isInProgress ? "Continue" : "Start"}
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        )}
        {isCompleted && (
          <Link href={`/training/${course.slug}`}>
            <Button size="sm" variant="ghost">
              Review
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

// Learning path card
function LearningPathCard({ path }: { path: LearningPathWithProgress }) {
  const { progress, courses, isRequired } = path;

  // Determine which courses are unlocked (sequential - all previous required courses must be completed)
  const unlockedCourses = new Set<string>();
  let canUnlock = true;

  courses.forEach((pc) => {
    if (canUnlock) {
      unlockedCourses.add(pc.courseId);
      // If this is a required course and not completed, subsequent courses are locked
      if (pc.isRequired && pc.enrollment?.status !== "COMPLETED") {
        canUnlock = false;
      }
    }
  });

  return (
    <Card className="overflow-hidden">
      {/* Header with gradient */}
      <div
        className={`p-6 ${
          progress.isComplete
            ? "bg-gradient-to-r from-success-light to-success-light"
            : isRequired
            ? "bg-gradient-to-r from-warning-light to-accent-orange"
            : "bg-gradient-to-r from-primary-500 to-accent-navy-light"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-white/20 backdrop-blur flex items-center justify-center">
              {progress.isComplete ? (
                <CheckCircleIcon className="w-6 h-6 text-white" />
              ) : (
                <MapIcon className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{path.title}</h3>
              {path.description && (
                <p className="text-white/80 text-sm mt-1 line-clamp-2">{path.description}</p>
              )}
            </div>
          </div>
          {isRequired && (
            <span className="px-3 py-1 text-xs font-medium bg-white/20 text-white rounded-full">
              Required
            </span>
          )}
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-white/90 text-sm mb-2">
            <span>{progress.completedCourses} of {progress.totalCourses} courses completed</span>
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

      {/* Course list */}
      <CardContent className="p-6">
        <div className="space-y-4">
          {courses.map((pc, index) => (
            <PathCourseCard
              key={pc.id}
              pathCourse={pc}
              index={index}
              isUnlocked={unlockedCourses.has(pc.courseId)}
              isFirst={index === 0}
            />
          ))}
        </div>

        {/* Completion message */}
        {progress.isComplete && (
          <div className="mt-6 p-4 bg-success-light rounded-[var(--radius-lg)] border border-success">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success-light rounded-lg flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="font-medium text-success-dark">Path Completed!</p>
                <p className="text-sm text-success-dark">
                  You&apos;ve finished all required courses in this learning path.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function LearningPathsClient() {
  const { data: paths, isLoading, error } = useLearningPaths();

  if (isLoading) {
    return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-20">
          <ArrowPathIcon className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      </main>
    );
  }

  if (error || !paths) {
    return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-error bg-error-light">
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4 text-error-dark">
              <ExclamationCircleIcon className="w-12 h-12" />
              <p className="text-lg font-medium">Failed to load learning paths</p>
              <p className="text-sm text-error">Please try refreshing the page.</p>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Separate required and optional paths
  const requiredPaths = paths.filter(p => p.isRequired);
  const optionalPaths = paths.filter(p => !p.isRequired);

  // Calculate overall stats
  const totalPaths = paths.length;
  const completedPaths = paths.filter(p => p.progress.isComplete).length;
  const totalCourses = paths.reduce((sum, p) => sum + p.progress.totalCourses, 0);
  const completedCourses = paths.reduce((sum, p) => sum + p.progress.completedCourses, 0);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-accent-navy-light flex items-center justify-center">
            <MapIcon className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-neutral-900">Learning Paths</h1>
            <p className="text-sm text-neutral-500">
              Follow guided paths to develop your tutoring skills
            </p>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="py-3.5 text-center">
            <MapIcon className="w-5 h-5 text-primary-600 mx-auto mb-1.5" />
            <p className="text-2xl font-bold text-neutral-900">{totalPaths}</p>
            <p className="text-xs text-neutral-500">Total Paths</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3.5 text-center">
            <CheckCircleIcon className="w-5 h-5 text-success mx-auto mb-1.5" />
            <p className="text-2xl font-bold text-neutral-900">{completedPaths}</p>
            <p className="text-xs text-neutral-500">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3.5 text-center">
            <BookOpenIcon className="w-5 h-5 text-warning mx-auto mb-1.5" />
            <p className="text-2xl font-bold text-neutral-900">{completedCourses}/{totalCourses}</p>
            <p className="text-xs text-neutral-500">Courses Done</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3.5 text-center">
            <FlagIcon className="w-5 h-5 text-accent-navy mx-auto mb-1.5" />
            <p className="text-2xl font-bold text-neutral-900">
              {totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0}%
            </p>
            <p className="text-xs text-neutral-500">Overall Progress</p>
          </CardContent>
        </Card>
      </div>

      {/* No paths message */}
      {paths.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <MapIcon className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No Learning Paths Available</h3>
            <p className="text-neutral-500 mb-4">
              Check back soon for guided training paths tailored to your role.
            </p>
            <Link href="/training">
              <Button>Browse All Courses</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Required Paths */}
      {requiredPaths.length > 0 && (
        <div className="mb-8">
          <h2 className="text-heading-sm text-neutral-900 mb-4 flex items-center gap-2">
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

      {/* Optional Paths */}
      {optionalPaths.length > 0 && (
        <div>
          <h2 className="text-heading-sm text-neutral-900 mb-4 flex items-center gap-2">
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
    </main>
  );
}
