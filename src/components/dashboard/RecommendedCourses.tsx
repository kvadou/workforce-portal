"use client";

import Link from "next/link";
import {
  SparklesIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  BookOpenIcon,
  ChevronRightIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import type { CourseCategory, CourseDifficulty } from "@prisma/client";

interface CourseRecommendation {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: CourseCategory;
  difficulty: CourseDifficulty;
  thumbnailUrl: string | null;
  estimatedMinutes: number;
  moduleCount: number;
  reason: string;
  score: number;
}

interface RecommendationsResponse {
  personalized: CourseRecommendation[];
  trending: CourseRecommendation[];
}

async function fetchRecommendations(): Promise<RecommendationsResponse> {
  const response = await fetch("/api/recommendations");
  if (!response.ok) throw new Error("Failed to fetch recommendations");
  return response.json();
}

const difficultyColors: Record<CourseDifficulty, string> = {
  BEGINNER: "bg-success-light text-success-dark",
  INTERMEDIATE: "bg-warning-light text-warning-dark",
  ADVANCED: "bg-error-light text-error-dark",
};

const categoryLabels: Record<CourseCategory, string> = {
  ONBOARDING: "Onboarding",
  TEACHING_SKILLS: "Teaching Skills",
  CHESS_SKILLS: "Chess Skills",
  BUSINESS: "Business",
  LEADERSHIP: "Leadership",
  CERTIFICATION: "Certification",
};

function CourseCard({ course }: { course: CourseRecommendation }) {
  return (
    <Link
      href={`/training/${course.slug}`}
      className="group bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-sm hover:border-primary-200 transition-all"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 relative">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpenIcon className="h-12 w-12 text-primary-400" />
          </div>
        )}
        {/* Reason Badge */}
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur text-white text-xs rounded-full flex items-center gap-1">
          <SparklesIcon className="h-3 w-3" />
          {course.reason}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded-full ${difficultyColors[course.difficulty]}`}
          >
            {course.difficulty.toLowerCase()}
          </span>
          <span className="text-xs text-neutral-500">
            {categoryLabels[course.category]}
          </span>
        </div>

        <h3 className="font-medium text-neutral-900 group-hover:text-primary-600 transition-colors line-clamp-2 mb-2">
          {course.title}
        </h3>

        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <BookOpenIcon className="h-3.5 w-3.5" />
            {course.moduleCount} modules
          </span>
          <span className="flex items-center gap-1">
            <ClockIcon className="h-3.5 w-3.5" />
            {course.estimatedMinutes} min
          </span>
        </div>
      </div>
    </Link>
  );
}

export function RecommendedCourses() {
  const { data, isLoading } = useQuery({
    queryKey: ["recommendations"],
    queryFn: fetchRecommendations,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <ArrowPathIcon className="h-6 w-6 text-primary-500 animate-spin" />
      </div>
    );
  }

  const hasPersonalized = data?.personalized && data.personalized.length > 0;
  const hasTrending = data?.trending && data.trending.length > 0;

  if (!hasPersonalized && !hasTrending) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Personalized Recommendations */}
      {hasPersonalized && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-primary-500" />
              Recommended for You
            </h2>
            <Link
              href="/training"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View all
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.personalized.slice(0, 3).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      )}

      {/* Trending Courses */}
      {hasTrending && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <ArrowTrendingUpIcon className="h-5 w-5 text-success" />
              Trending Courses
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.trending.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
