"use client";

import { useState, useEffect } from "react";
import { CMSBlock, useCMS } from "@/providers/CMSProvider";
import { AcademicCapIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

interface CourseCardBlockProps {
  block: CMSBlock;
  isEditing: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  _count?: { modules: number };
}

export function CourseCardBlock({ block, isEditing }: CourseCardBlockProps) {
  const { updateBlock } = useCMS();
  const content = block.content as { courseId: string };
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch courses for dropdown
  useEffect(() => {
    if (isEditing && courses.length === 0) {
      setLoading(true);
      fetch("/api/courses")
        .then((res) => res.json())
        .then((data) => {
          setCourses(data.courses || []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isEditing, courses.length]);

  // Fetch selected course details
  useEffect(() => {
    if (content.courseId && !selectedCourse) {
      fetch(`/api/courses/${content.courseId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.course) setSelectedCourse(data.course);
        })
        .catch(console.error);
    }
  }, [content.courseId, selectedCourse]);

  if (isEditing) {
    return (
      <div className="border border-neutral-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <AcademicCapIcon className="h-5 w-5 text-primary-500" />
          <span className="font-medium">Course Card</span>
        </div>

        <select
          value={content.courseId || ""}
          onChange={(e) => {
            const course = courses.find((c) => c.id === e.target.value);
            updateBlock(block.id, { courseId: e.target.value });
            setSelectedCourse(course || null);
          }}
          className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
        >
          <option value="">Select a course...</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>

        {selectedCourse && (
          <div className="p-3 bg-neutral-50 rounded-lg">
            <p className="text-sm text-neutral-500 mb-2">Preview:</p>
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              {selectedCourse.thumbnail && (
                <div className="aspect-video bg-neutral-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedCourse.thumbnail}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-neutral-900">
                  {selectedCourse.title}
                </h3>
                {selectedCourse.description && (
                  <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                    {selectedCourse.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // View mode
  if (!content.courseId || !selectedCourse) return null;

  return (
    <Link
      href={`/courses/${content.courseId}`}
      className="block border border-neutral-200 rounded-xl overflow-hidden hover:shadow-card-hover hover:border-primary-300 transition-all group"
    >
      {selectedCourse.thumbnail && (
        <div className="aspect-video bg-neutral-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedCourse.thumbnail}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors flex items-center justify-between">
          {selectedCourse.title}
          <ChevronRightIcon className="h-5 w-5 text-neutral-400 group-hover:text-primary-500" />
        </h3>
        {selectedCourse.description && (
          <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
            {selectedCourse.description}
          </p>
        )}
        {selectedCourse._count && (
          <p className="text-xs text-neutral-400 mt-2">
            {selectedCourse._count.modules} modules
          </p>
        )}
      </div>
    </Link>
  );
}
