"use client";

import { ClientHeader } from "@/components/portal/ClientHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import dynamic from "next/dynamic";

const LessonPlayer = dynamic(
  () => import("@/components/chess/LessonPlayer").then((m) => m.LessonPlayer),
  { ssr: false }
);
import { useChessLesson, useCompleteLessonLevel } from "@/hooks/useChessLessons";
import { ArrowLeftIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";

interface LessonClientProps {
  lessonId: string;
}

export default function LessonClient({ lessonId }: LessonClientProps) {
  const { data: lesson, isLoading } = useChessLesson(lessonId);
  const completeLevel = useCompleteLessonLevel();
  const router = useRouter();

  const handleLevelComplete = useCallback(
    (levelIndex: number) => {
      completeLevel.mutate({ lessonId, levelIndex });
    },
    [lessonId, completeLevel]
  );

  const handleLessonComplete = useCallback(() => {
    toast.success("Lesson complete! Great job!");
    setTimeout(() => router.push("/learn"), 1500);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-accent-light">
      <ClientHeader />
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-info" />
        </div>
      </DashboardLayout>
    </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-accent-light">
      <ClientHeader />
      <DashboardLayout>
        <div className="text-center py-20 text-neutral-500">
          Lesson not found
        </div>
      </DashboardLayout>
    </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent-light">
      <ClientHeader />
      <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <Link
          href="/learn"
          className="inline-flex items-center gap-1 text-sm text-info hover:text-info-dark mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Learn
        </Link>

        {/* Lesson header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-neutral-400 mb-1">
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${lesson.category.color}20`,
                color: lesson.category.color,
              }}
            >
              {lesson.category.name}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-800 flex items-center gap-2">
            <span className="text-3xl">{lesson.iconEmoji}</span>
            {lesson.title}
          </h1>
          {lesson.subtitle && (
            <p className="text-neutral-500 mt-1">{lesson.subtitle}</p>
          )}
        </div>

        {/* Lesson player */}
        <Card>
          <CardContent className="p-6">
            <LessonPlayer
              lessonTitle={lesson.title}
              levels={lesson.levels}
              completedLevels={lesson.progress.completedLevels}
              onLevelComplete={handleLevelComplete}
              onLessonComplete={handleLessonComplete}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
    </div>
  );
}
