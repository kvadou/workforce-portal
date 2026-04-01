"use client";

import {
  AcademicCapIcon,
  BookOpenIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
  TrophyIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdminCourses, useDeleteCourse } from "@/hooks/useTrainingCourses";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import type { CourseCategory, CourseDifficulty } from "@prisma/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const categoryLabels: Record<CourseCategory, string> = {
  ONBOARDING: "Onboarding",
  TEACHING_SKILLS: "Teaching Skills",
  CHESS_SKILLS: "Chess Skills",
  BUSINESS: "Business",
  LEADERSHIP: "Leadership",
  CERTIFICATION: "Certification",
};

const categoryIcons: Record<CourseCategory, React.ReactNode> = {
  ONBOARDING: <SparklesIcon className="h-5 w-5" />,
  TEACHING_SKILLS: <BookOpenIcon className="h-5 w-5" />,
  CHESS_SKILLS: <TrophyIcon className="h-5 w-5" />,
  BUSINESS: <BriefcaseIcon className="h-5 w-5" />,
  LEADERSHIP: <TrophyIcon className="h-5 w-5" />,
  CERTIFICATION: <CheckCircleIcon className="h-5 w-5" />,
};

const difficultyColors: Record<CourseDifficulty, string> = {
  BEGINNER: "bg-success-light text-success-dark",
  INTERMEDIATE: "bg-warning-light text-warning-dark",
  ADVANCED: "bg-error-light text-error-dark",
};

export default function TrainingAdminPage() {
  const [selectedCategory, setSelectedCategory] = useState<CourseCategory | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [showPublishedOnly, setShowPublishedOnly] = useState(false);
  const [deleteCourse, setDeleteCourse] = useState<{ id: string; title: string } | null>(null);

  const { data, isLoading, error } = useAdminCourses({
    category: selectedCategory,
    isPublished: showPublishedOnly || undefined,
    search: searchQuery || undefined,
  });

  const deleteMutation = useDeleteCourse();

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Course deleted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete course");
    } finally {
      setDeleteCourse(null);
    }
  };

  const courses = data?.courses || [];

  // Group by category
  const coursesByCategory = courses.reduce((acc, course) => {
    const cat = course.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(course);
    return acc;
  }, {} as Record<CourseCategory, typeof courses>);

  // Stats
  const totalCourses = courses.length;
  const publishedCourses = courses.filter((c) => c.isPublished).length;
  const totalEnrolled = courses.reduce(
    (sum, c) => sum + c.enrollmentStats.totalEnrolled,
    0
  );
  const totalCompleted = courses.reduce(
    (sum, c) => sum + c.enrollmentStats.completed,
    0
  );

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-error mb-4">Failed to load training courses</div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-heading-lg text-neutral-900 flex items-center gap-2">
            <AcademicCapIcon className="h-8 w-8 text-primary-500" />
            Training Courses
          </h1>
          <p className="text-body text-neutral-500 mt-1">
            Manage LMS courses for tutor professional development
          </p>
        </div>
        <Link href="/admin/training/new">
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Courses", value: totalCourses, color: "bg-info-light text-info" },
          { label: "Published", value: publishedCourses, color: "bg-success-light text-success" },
          { label: "Total Enrollments", value: totalEnrolled, color: "bg-primary-100 text-primary-600" },
          { label: "Completions", value: totalCompleted, color: "bg-warning-light text-warning" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <AcademicCapIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                  <p className="text-body-sm text-neutral-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="MagnifyingGlassIcon courses..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <FunnelIcon className="h-4 w-4 text-neutral-500" />
              <select
                value={selectedCategory || ""}
                onChange={(e) =>
                  setSelectedCategory(
                    (e.target.value as CourseCategory) || undefined
                  )
                }
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Categories</option>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPublishedOnly}
                onChange={(e) => setShowPublishedOnly(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300"
              />
              <span className="text-body-sm text-neutral-600">Published only</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Courses List */}
      {isLoading ? (
        <LoadingSpinner fullPage />
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AcademicCapIcon className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-heading-sm text-neutral-900 mb-2">
              No training courses yet
            </h3>
            <p className="text-body text-neutral-500 mb-6">
              Create your first training course to get started
            </p>
            <Link href="/admin/training/new">
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Course
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(coursesByCategory).map(([category, categoryCourses]) => (
            <div key={category}>
              <h2 className="text-heading-sm text-neutral-900 mb-4 flex items-center gap-2">
                {categoryIcons[category as CourseCategory]}
                {categoryLabels[category as CourseCategory]}
                <span className="text-neutral-400 font-normal">
                  ({categoryCourses.length})
                </span>
              </h2>

              <div className="space-y-3">
                {categoryCourses.map((course) => (
                  <Card
                    key={course.id}
                    className={`transition-all hover:shadow-card-hover ${
                      !course.isPublished ? "opacity-75 border-dashed" : ""
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Thumbnail */}
                        <div
                          className="h-16 w-16 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0"
                          style={
                            course.thumbnailUrl
                              ? {
                                  backgroundImage: `url(${course.thumbnailUrl})`,
                                  backgroundSize: "cover",
                                }
                              : undefined
                          }
                        >
                          {!course.thumbnailUrl && (
                            <AcademicCapIcon className="h-8 w-8 text-white" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-neutral-900 truncate">
                              {course.title}
                            </h3>
                            {course.isRequired && (
                              <span className="px-2 py-0.5 text-xs rounded bg-error-light text-error-dark">
                                Required
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 text-xs rounded ${
                                difficultyColors[course.difficulty]
                              }`}
                            >
                              {course.difficulty}
                            </span>
                          </div>
                          <p className="text-body-sm text-neutral-500 line-clamp-1">
                            {course.description || "No description"}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-neutral-400">
                            <span className="flex items-center gap-1">
                              <BookOpenIcon className="h-3 w-3" />
                              {course.modules?.length || 0} modules
                            </span>
                            {course.duration && (
                              <span className="flex items-center gap-1">
                                <ClockIcon className="h-3 w-3" />
                                {course.duration} min
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <UsersIcon className="h-3 w-3" />
                              {course.enrollmentStats.totalEnrolled} enrolled
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircleIcon className="h-3 w-3" />
                              {course.enrollmentStats.completed} completed
                            </span>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              course.isPublished
                                ? "bg-success-light text-success-dark"
                                : "bg-neutral-100 text-neutral-500"
                            }`}
                          >
                            {course.isPublished ? "Published" : "Draft"}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <Link href={`/admin/training/${course.id}`}>
                            <button className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors">
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => setDeleteCourse({ id: course.id, title: course.title })}
                            disabled={deleteMutation.isPending}
                            className="p-2 text-neutral-400 hover:text-error hover:bg-error-light rounded-lg transition-colors disabled:opacity-50"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                          <Link href={`/admin/training/${course.id}`}>
                            <ChevronRightIcon className="h-5 w-5 text-neutral-400" />
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteCourse !== null}
        onClose={() => setDeleteCourse(null)}
        onConfirm={() => deleteCourse && handleDelete(deleteCourse.id)}
        title="Delete Course"
        message={deleteCourse ? `Are you sure you want to delete "${deleteCourse.title}"? This cannot be undone.` : ""}
        variant="danger"
        confirmLabel="Delete"
      />
    </div>
  );
}
