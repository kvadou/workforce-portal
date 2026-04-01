"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { LevelGoalType } from "@prisma/client";

export interface LessonCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
  order: number;
  lessons: LessonSummary[];
  totalLessons: number;
  completedLessons: number;
}

export interface LessonSummary {
  id: string;
  title: string;
  subtitle: string | null;
  iconEmoji: string | null;
  order: number;
  totalLevels: number;
  completedLevels: number;
  isComplete: boolean;
}

export interface LessonLevel {
  id: string;
  order: number;
  fen: string;
  goal: string;
  goalType: LevelGoalType;
  targetSquares: string[];
  playerColor: string;
  hintText: string | null;
}

export interface LessonDetail {
  id: string;
  title: string;
  subtitle: string | null;
  iconEmoji: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
    color: string;
  };
  levels: LessonLevel[];
  progress: {
    completedLevels: number;
    totalLevels: number;
    isComplete: boolean;
  };
}

export interface LearnProgress {
  totalLessons: number;
  completedLessons: number;
  totalLevels: number;
  completedLevels: number;
  percentage: number;
}

export function useChessCategories() {
  return useQuery({
    queryKey: ["chess", "categories"],
    queryFn: async () => {
      const res = await fetch("/api/learn/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json() as Promise<{ categories: LessonCategory[] }>;
    },
  });
}

export function useChessLesson(id: string) {
  return useQuery({
    queryKey: ["chess", "lesson", id],
    queryFn: async () => {
      const res = await fetch(`/api/learn/lessons/${id}`);
      if (!res.ok) throw new Error("Failed to fetch lesson");
      return res.json() as Promise<LessonDetail>;
    },
    enabled: !!id,
  });
}

export function useChessLessonProgress() {
  return useQuery({
    queryKey: ["chess", "progress"],
    queryFn: async () => {
      const res = await fetch("/api/learn/progress");
      if (!res.ok) throw new Error("Failed to fetch progress");
      return res.json() as Promise<LearnProgress>;
    },
  });
}

export function useCompleteLessonLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lessonId,
      levelIndex,
    }: {
      lessonId: string;
      levelIndex: number;
    }) => {
      const res = await fetch(`/api/learn/lessons/${lessonId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ levelIndex }),
      });
      if (!res.ok) throw new Error("Failed to update progress");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chess", "categories"] });
      queryClient.invalidateQueries({
        queryKey: ["chess", "lesson", variables.lessonId],
      });
      queryClient.invalidateQueries({ queryKey: ["chess", "progress"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
