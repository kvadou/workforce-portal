"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AcademicCapIcon,
  BookOpenIcon,
  ChevronRightIcon,
  DocumentCheckIcon,
  DocumentTextIcon,
  PlayIcon,
  Square3Stack3DIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { CMSWrapper } from "@/components/cms/CMSWrapper";
import { CMSPageRenderer } from "@/components/cms/CMSPageRenderer";
import { PageHeader } from "@/components/shared/PageHeader";

interface Lesson {
  id: string;
  title: string;
  subtitle: string | null;
  number: number;
  videoUrl: string | null;
  story: {
    content: unknown;
  } | null;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  status: string;
  modules: Module[];
}

interface CurriculumPageContentProps {
  courses: Course[];
}

// Color rotation for modules
const MODULE_COLORS = [
  { bg: "from-primary-500 to-primary-700", light: "bg-primary-50 border-primary-100", text: "text-primary-600", badge: "bg-primary-100 text-primary-700" },
  { bg: "from-success-light to-success", light: "bg-success-light border-success", text: "text-success", badge: "bg-success-light text-success-dark" },
  { bg: "from-warning-light to-accent-orange", light: "bg-warning-light border-warning", text: "text-warning", badge: "bg-warning-light text-warning-dark" },
  { bg: "from-error to-accent-pink", light: "bg-error-light border-error", text: "text-error", badge: "bg-error-light text-error-dark" },
  { bg: "from-accent-cyan to-info", light: "bg-accent-cyan-light border-accent-cyan-light", text: "text-accent-cyan", badge: "bg-accent-cyan-light text-accent-cyan" },
  { bg: "from-primary-500 to-primary-600", light: "bg-primary-50 border-primary-100", text: "text-primary-600", badge: "bg-primary-100 text-primary-700" },
];

export function CurriculumPageContent({ courses }: CurriculumPageContentProps) {
  const pageType = "curriculum";
  const pageId = "main";

  // Calculate totals
  const totalModules = courses.reduce((sum, c) => sum + c.modules.length, 0);
  const totalLessons = courses.reduce(
    (sum, c) =>
      sum + c.modules.reduce((mSum, m) => mSum + m.lessons.length, 0),
    0
  );

  return (
    <CMSWrapper pageType={pageType} pageId={pageId}>
      {/* Page Header */}
      <PageHeader
        icon={AcademicCapIcon}
        title="Curriculum"
        description="Browse all courses, modules, and lessons"
        gradient="from-primary-500 to-primary-700"
      />

      {/* CMS Editable Content Area */}
      <CMSPageRenderer
        pageType={pageType}
        pageId={pageId}
        className="mb-8"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <Card className="overflow-hidden border-neutral-200 hover:shadow-sm hover:border-primary-200 transition-all duration-300 group">
          <CardContent className="py-5 px-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm shadow-primary-200/50 group-hover:scale-110 transition-transform duration-300">
                <BookOpenIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-neutral-900">
                  {courses.length}
                </p>
                <p className="text-sm text-neutral-500 font-medium">Courses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-neutral-200 hover:shadow-sm hover:border-warning transition-all duration-300 group">
          <CardContent className="py-5 px-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-warning to-accent-orange flex items-center justify-center shadow-sm shadow-warning-light/50 group-hover:scale-110 transition-transform duration-300">
                <Square3Stack3DIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-neutral-900">
                  {totalModules}
                </p>
                <p className="text-sm text-neutral-500 font-medium">Modules</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-neutral-200 hover:shadow-sm hover:border-success transition-all duration-300 group">
          <CardContent className="py-5 px-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-success to-success-light flex items-center justify-center shadow-sm shadow-success-light/50 group-hover:scale-110 transition-transform duration-300">
                <DocumentTextIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-neutral-900">
                  {totalLessons}
                </p>
                <p className="text-sm text-neutral-500 font-medium">Lessons</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses */}
      <div className="space-y-6">
        {courses.map((course) => (
          <Card key={course.id} className="overflow-hidden border-neutral-200 hover:shadow-sm transition-all duration-300">
            {/* Course Header */}
            <div className="bg-gradient-to-r from-neutral-50 to-white px-6 py-5 border-b border-neutral-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm flex-shrink-0">
                    <AcademicCapIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900">
                      {course.title}
                    </h2>
                    {course.description && (
                      <p className="text-neutral-600 text-sm mt-1">
                        {course.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:flex-shrink-0">
                  <span className="text-sm text-neutral-500">
                    {course.modules.length} modules • {course.modules.reduce((sum, m) => sum + m.lessons.length, 0)} lessons
                  </span>
                  <Badge
                    status={
                      course.status === "PUBLISHED"
                        ? "completed"
                        : "not_started"
                    }
                  />
                </div>
              </div>
            </div>

            {/* Modules */}
            <CardContent className="p-0">
              <div className="divide-y divide-neutral-100">
                {course.modules.map((module, moduleIndex) => {
                  const colors = MODULE_COLORS[moduleIndex % MODULE_COLORS.length];

                  return (
                    <div key={module.id} className="group/module">
                      {/* Module Header */}
                      <div className={`px-6 py-4 ${colors.light} border-l-4 border-l-transparent group-hover/module:border-l-current ${colors.text} transition-all`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors.bg} flex items-center justify-center shadow-sm`}>
                              <Square3Stack3DIcon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-neutral-800">
                                {module.title}
                              </h3>
                              <p className="text-sm text-neutral-500">
                                {module.lessons.length} lessons
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Lessons */}
                      <div className="bg-white">
                        {module.lessons.map((lesson, lessonIndex) => {
                          const hasCanva = !!(
                            lesson.story?.content &&
                            typeof lesson.story.content === "object" &&
                            (lesson.story.content as Record<string, unknown>)
                              .type === "canva_embed"
                          );

                          return (
                            <Link
                              key={lesson.id}
                              href={`/lessons/${lesson.id}`}
                              className="flex items-center justify-between px-6 py-4 hover:bg-neutral-50 transition-colors group/lesson border-b border-neutral-50 last:border-b-0"
                            >
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <span className={`w-10 h-10 rounded-xl ${colors.light} ${colors.text} flex items-center justify-center text-sm font-bold shadow-sm group-hover/lesson:shadow-sm transition-shadow flex-shrink-0`}>
                                  {lesson.number}
                                </span>
                                <div className="min-w-0">
                                  <p className="font-medium text-neutral-900 group-hover/lesson:text-primary-600 transition-colors truncate">
                                    {lesson.title}
                                  </p>
                                  {lesson.subtitle && (
                                    <p className="text-sm text-neutral-500">
                                      {lesson.subtitle}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {hasCanva && (
                                  <span className={`text-xs ${colors.badge} px-2.5 py-1 rounded-full font-medium flex items-center gap-1`}>
                                    <DocumentCheckIcon className="w-3 h-3" />
                                    Story
                                  </span>
                                )}
                                {lesson.videoUrl && (
                                  <span className="text-xs bg-primary-100 text-primary-700 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                                    <PlayIcon className="w-3 h-3" />
                                    Video
                                  </span>
                                )}
                                <ChevronRightIcon className="w-5 h-5 text-neutral-300 group-hover/lesson:text-primary-500 group-hover/lesson:translate-x-1 transition-all" />
                              </div>
                            </Link>
                          );
                        })}
                        {module.lessons.length === 0 && (
                          <div className="px-6 py-8 text-center">
                            <p className="text-neutral-400 italic">
                              No lessons in this module yet
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {course.modules.length === 0 && (
                  <div className="px-6 py-12 text-center">
                    <Square3Stack3DIcon className="w-12 h-12 mx-auto mb-3 text-neutral-200" />
                    <p className="text-neutral-500">
                      No modules in this course yet
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </CMSWrapper>
  );
}
