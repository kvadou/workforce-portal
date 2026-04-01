"use client";

import { useState, useEffect } from "react";
import { CMSBlock, useCMS } from "@/providers/CMSProvider";
import { BookOpenIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

interface LessonLinkBlockProps {
  block: CMSBlock;
  isEditing: boolean;
}

interface Lesson {
  id: string;
  title: string;
  number: number;
  thumbnail: string | null;
  module: {
    title: string;
    course: { title: string };
  };
}

export function LessonLinkBlock({ block, isEditing }: LessonLinkBlockProps) {
  const { updateBlock } = useCMS();
  const content = block.content as { lessonId: string; showThumbnail: boolean };
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch lessons for dropdown
  useEffect(() => {
    if (isEditing && lessons.length === 0) {
      setLoading(true);
      fetch("/api/lessons?detailed=true")
        .then((res) => res.json())
        .then((data) => {
          setLessons(data.lessons || []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isEditing, lessons.length]);

  // Fetch selected lesson details
  useEffect(() => {
    if (content.lessonId && !selectedLesson) {
      fetch(`/api/lessons/${content.lessonId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.lesson) setSelectedLesson(data.lesson);
        })
        .catch(console.error);
    }
  }, [content.lessonId, selectedLesson]);

  if (isEditing) {
    return (
      <div className="border border-neutral-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <BookOpenIcon className="h-5 w-5 text-primary-500" />
          <span className="font-medium">Lesson Link</span>
        </div>

        <select
          value={content.lessonId || ""}
          onChange={(e) => {
            const lesson = lessons.find((l) => l.id === e.target.value);
            updateBlock(block.id, { lessonId: e.target.value });
            setSelectedLesson(lesson || null);
          }}
          className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
        >
          <option value="">Select a lesson...</option>
          {lessons.map((lesson) => (
            <option key={lesson.id} value={lesson.id}>
              {lesson.module?.course?.title} → {lesson.module?.title} → Lesson{" "}
              {lesson.number}: {lesson.title}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={content.showThumbnail !== false}
            onChange={(e) =>
              updateBlock(block.id, { showThumbnail: e.target.checked })
            }
            className="rounded"
          />
          Show thumbnail
        </label>

        {selectedLesson && (
          <div className="p-3 bg-neutral-50 rounded-lg">
            <p className="text-sm text-neutral-500">Preview:</p>
            <div className="flex items-center gap-3 mt-2">
              {content.showThumbnail !== false && selectedLesson.thumbnail && (
                <div className="h-12 w-16 bg-neutral-200 rounded overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedLesson.thumbnail}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <p className="font-medium text-neutral-900">
                  Lesson {selectedLesson.number}: {selectedLesson.title}
                </p>
                <p className="text-xs text-neutral-500">
                  {selectedLesson.module?.course?.title} →{" "}
                  {selectedLesson.module?.title}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // View mode
  if (!content.lessonId || !selectedLesson) return null;

  return (
    <Link
      href={`/lessons/${content.lessonId}`}
      className="flex items-center gap-4 p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-primary-300 transition-colors group"
    >
      {content.showThumbnail !== false && selectedLesson.thumbnail && (
        <div className="h-14 w-20 bg-neutral-200 rounded-lg overflow-hidden flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedLesson.thumbnail}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-neutral-900 group-hover:text-primary-600 transition-colors">
          Lesson {selectedLesson.number}: {selectedLesson.title}
        </p>
        <p className="text-sm text-neutral-500 truncate">
          {selectedLesson.module?.course?.title} → {selectedLesson.module?.title}
        </p>
      </div>
      <ChevronRightIcon className="h-5 w-5 text-neutral-400 group-hover:text-primary-500 transition-colors" />
    </Link>
  );
}
