"use client";

import { useState } from "react";
import {
  AcademicCapIcon,
  BookOpenIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  MinusIcon,
  PlayIcon,
  PlusIcon,
  SparklesIcon,
  Square3Stack3DIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
  description: string | null;
  order: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  status: string;
  modules: Module[];
}

interface CoursePageContentProps {
  course: Course;
}

// Parse module description to extract learning outcomes
function parseLearningOutcomes(description: string | null): { note: string | null; outcomes: string[] } {
  if (!description) return { note: null, outcomes: [] };

  const lines = description.split(/[\n\r]+/).map(line => line.trim()).filter(line => line.length > 0);

  // Check if first line is a note (starts with * or **)
  let note: string | null = null;
  let startIndex = 0;

  if (lines[0]?.startsWith('*')) {
    note = lines[0];
    startIndex = 1;
  }

  const outcomes = lines.slice(startIndex).map(line =>
    line.replace(/^[\s\-\*•]+/, '').trim()
  ).filter(line => line.length > 0);

  return { note, outcomes };
}

export function CoursePageContent({ course }: CoursePageContentProps) {
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

  const toggleLessons = (moduleId: string) => {
    setExpandedLessons(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const totalLessons = course.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0
  );

  const totalModules = course.modules.length;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm shadow-primary-200">
            <AcademicCapIcon className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900">
            {course.title}
          </h1>
        </div>
        <p className="text-neutral-500 ml-13">
          Browse all modules and lessons
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Course Card */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 flex items-center gap-4 hover:shadow-sm hover:border-primary-200 transition-all duration-200 group">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm shadow-primary-200/50 group-hover:scale-105 transition-transform">
            <BookOpenIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900">1</p>
            <p className="text-sm text-neutral-500">Course</p>
          </div>
        </div>

        {/* Modules Card */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 flex items-center gap-4 hover:shadow-sm hover:border-warning transition-all duration-200 group">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning to-accent-orange flex items-center justify-center shadow-sm shadow-warning-light/50 group-hover:scale-105 transition-transform">
            <Square3Stack3DIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900">{totalModules}</p>
            <p className="text-sm text-neutral-500">Modules</p>
          </div>
        </div>

        {/* Lessons Card */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 flex items-center gap-4 hover:shadow-sm hover:border-success transition-all duration-200 group">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success to-success-light flex items-center justify-center shadow-sm shadow-success-light/50 group-hover:scale-105 transition-transform">
            <DocumentTextIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900">{totalLessons}</p>
            <p className="text-sm text-neutral-500">Lessons</p>
          </div>
        </div>
      </div>

      {/* Course Overview Card */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold text-neutral-900">
            {course.title}
          </h2>
          <span className={`
            px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap
            ${course.status === "PUBLISHED"
              ? "bg-success/20 text-success"
              : "bg-neutral-100 text-neutral-600"
            }
          `}>
            {course.status === "PUBLISHED" ? "Published" : "Draft"}
          </span>
        </div>

        {/* Course Description */}
        {course.description && (
          <p className="text-neutral-600 leading-relaxed mb-6">
            {course.description}
          </p>
        )}

        {/* Lesson Structure Info */}
        <div className="bg-neutral-50 rounded-lg p-4">
          <p className="text-neutral-700 mb-3 font-medium">
            Each lesson follows a simple three-part structure:
          </p>
          <ul className="space-y-2 text-sm text-neutral-600">
            <li className="flex items-start gap-2">
              <span className="text-primary-500 mt-0.5">•</span>
              <span>
                <strong className="text-neutral-800">Story</strong> – Tell a silly story that leads the child to a moment of discovery on the board.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500 mt-0.5">•</span>
              <span>
                <strong className="text-neutral-800">Chessercises</strong> – Reinforce what they're learning with fun, movement-based activities.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500 mt-0.5">•</span>
              <span>
                <strong className="text-neutral-800">Gameplay</strong> – Help students apply their new skills on the board.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-6">
        {course.modules.map((module, moduleIndex) => {
          const { note, outcomes } = parseLearningOutcomes(module.description);
          const isLessonsExpanded = expandedLessons.has(module.id);

          // Rotate through accent colors for visual variety
          const accentColors = [
            { border: "hover:border-primary-200", bg: "bg-primary-50", text: "text-primary-600", dot: "bg-primary-500" },
            { border: "hover:border-info", bg: "bg-info-light", text: "text-info", dot: "bg-info" },
            { border: "hover:border-success", bg: "bg-success-light", text: "text-success", dot: "bg-success" },
            { border: "hover:border-warning", bg: "bg-warning-light", text: "text-warning", dot: "bg-warning" },
            { border: "hover:border-accent-pink", bg: "bg-accent-pink-light", text: "text-accent-pink", dot: "bg-accent-pink" },
            { border: "hover:border-accent-cyan-light", bg: "bg-accent-cyan-light", text: "text-accent-cyan", dot: "bg-accent-cyan" },
          ];
          const accent = accentColors[moduleIndex % accentColors.length];

          return (
            <div key={module.id} className={`bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-sm ${accent.border} transition-all duration-200`}>
              {/* Module Header */}
              <div className="p-6 border-b border-neutral-100">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full ${accent.dot} mt-2.5 flex-shrink-0`} />
                  <div className="flex-1">
                    <h3 className={`text-lg font-bold ${accent.text} uppercase tracking-wide mb-1`}>
                      {module.title}
                    </h3>
                    {note && (
                      <p className="text-sm italic text-neutral-500 mb-3">
                        {note}
                      </p>
                    )}

                    {/* What Will We Learn? */}
                    {outcomes.length > 0 && (
                      <div className="mt-3">
                        <h4 className="font-semibold text-neutral-900 mb-2 text-sm">
                          What Will We Learn?
                        </h4>
                        <ul className="space-y-1">
                          {outcomes.map((outcome, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-neutral-600">
                              <span className={`${accent.text} mt-0.5`}>•</span>
                              <span className="italic">{outcome}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Expandable Lessons Toggle */}
              <button
                onClick={() => toggleLessons(module.id)}
                className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors ${isLessonsExpanded ? accent.bg : "hover:bg-neutral-50"}`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${isLessonsExpanded ? accent.dot + " text-white" : "bg-neutral-100 text-neutral-500"}`}>
                  {isLessonsExpanded ? (
                    <MinusIcon className="w-3.5 h-3.5" />
                  ) : (
                    <PlusIcon className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className="font-medium text-neutral-700">
                  List of lessons
                </span>
                <span className={`text-sm px-2 py-0.5 rounded-full ${isLessonsExpanded ? "bg-white/80 text-neutral-600" : "bg-neutral-100 text-neutral-500"}`}>
                  {module.lessons.length} lessons
                </span>
              </button>

              {/* Lessons List */}
              {isLessonsExpanded && (
                <div className="border-t border-neutral-100">
                  {module.lessons.map((lesson) => (
                    <Link
                      key={lesson.id}
                      href={`/lessons/${lesson.id}`}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-primary-50/50 transition-colors border-b border-neutral-100 last:border-b-0 group"
                    >
                      {/* Lesson Number */}
                      <span className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {lesson.number}
                      </span>

                      {/* Lesson Title */}
                      <span className="flex-1 font-medium text-neutral-900 group-hover:text-primary-600 transition-colors">
                        {lesson.title}
                        {lesson.subtitle && (
                          <span className="font-normal text-neutral-500">
                            : {lesson.subtitle}
                          </span>
                        )}
                      </span>

                      <ChevronRightIcon className="w-5 h-5 text-neutral-300 group-hover:text-primary-500 transition-colors" />
                    </Link>
                  ))}

                  {module.lessons.length === 0 && (
                    <div className="px-6 py-4 text-sm text-neutral-500 italic">
                      No lessons in this module yet
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {course.modules.length === 0 && (
          <div className="bg-white rounded-xl border border-neutral-200 px-6 py-12 text-center text-neutral-500">
            No modules in this course yet
          </div>
        )}
      </div>

      {/* Start Course Button */}
      {course.modules.length > 0 && course.modules[0].lessons.length > 0 && (
        <div className="mt-10 text-center">
          <Link
            href={`/lessons/${course.modules[0].lessons[0].id}`}
            className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl transition-all text-lg shadow-sm shadow-primary-300/50 hover:shadow-card-hover hover:shadow-primary-300/60 hover:-translate-y-0.5 group"
          >
            <PlayIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Start Your Adventure
            <SparklesIcon className="w-5 h-5 text-warning group-hover:rotate-12 transition-transform" />
          </Link>
        </div>
      )}
    </div>
  );
}
