import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
export interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  startedAt: string | null;
  completedAt: string | null;
  lastViewedAt: string;
  timeSpent: number;
  notes: string | null;
  lesson?: {
    id: string;
    title: string;
    number: number;
    moduleId?: string;
    module?: {
      id: string;
      title: string;
      courseId?: string;
    };
  };
}

export interface ProgressStats {
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  notStartedLessons: number;
  completionPercentage: number;
  totalTimeSpent: number;
  streak: number;
  recentActivity: LessonProgress[];
}

// Fetch all progress for a user
async function fetchUserProgress(userId: string, moduleId?: string): Promise<LessonProgress[]> {
  const params = new URLSearchParams({ userId });
  if (moduleId) params.set("moduleId", moduleId);

  const response = await fetch(`/api/progress?${params}`);
  if (!response.ok) throw new Error("Failed to fetch progress");
  return response.json();
}

// Fetch progress for a specific lesson
async function fetchLessonProgress(userId: string, lessonId: string): Promise<LessonProgress | null> {
  const params = new URLSearchParams({ userId, lessonId });
  const response = await fetch(`/api/progress?${params}`);
  if (!response.ok) throw new Error("Failed to fetch lesson progress");
  return response.json();
}

// Fetch progress stats
async function fetchProgressStats(userId: string, courseId?: string): Promise<ProgressStats> {
  const params = new URLSearchParams({ userId });
  if (courseId) params.set("courseId", courseId);

  const response = await fetch(`/api/progress/stats?${params}`);
  if (!response.ok) throw new Error("Failed to fetch progress stats");
  return response.json();
}

// Update progress
async function updateProgress(data: {
  userId: string;
  lessonId: string;
  status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  timeSpent?: number;
  notes?: string;
}): Promise<LessonProgress> {
  const response = await fetch("/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update progress");
  return response.json();
}

// Hooks
export function useUserProgress(userId: string, moduleId?: string) {
  return useQuery({
    queryKey: ["progress", userId, moduleId],
    queryFn: () => fetchUserProgress(userId, moduleId),
    enabled: !!userId,
  });
}

export function useLessonProgress(userId: string, lessonId: string) {
  return useQuery({
    queryKey: ["progress", userId, lessonId],
    queryFn: () => fetchLessonProgress(userId, lessonId),
    enabled: !!userId && !!lessonId,
  });
}

export function useProgressStats(userId: string, courseId?: string) {
  return useQuery({
    queryKey: ["progressStats", userId, courseId],
    queryFn: () => fetchProgressStats(userId, courseId),
    enabled: !!userId,
  });
}

export function useUpdateProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProgress,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["progress", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["progressStats", variables.userId] });
    },
  });
}

// Helper hook to mark lesson as started/in progress
export function useStartLesson() {
  const updateMutation = useUpdateProgress();

  return {
    ...updateMutation,
    startLesson: (userId: string, lessonId: string) =>
      updateMutation.mutateAsync({ userId, lessonId, status: "IN_PROGRESS" }),
  };
}

// Helper hook to mark lesson as complete
export function useCompleteLesson() {
  const updateMutation = useUpdateProgress();

  return {
    ...updateMutation,
    completeLesson: (userId: string, lessonId: string) =>
      updateMutation.mutateAsync({ userId, lessonId, status: "COMPLETED" }),
  };
}

// Helper hook to track time spent
export function useTrackTime() {
  const updateMutation = useUpdateProgress();

  return {
    ...updateMutation,
    trackTime: (userId: string, lessonId: string, seconds: number) =>
      updateMutation.mutateAsync({ userId, lessonId, timeSpent: seconds }),
  };
}
