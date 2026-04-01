import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserRole } from "@prisma/client";

// ===== Types =====

export interface LearningPathCourse {
  id: string;
  courseId: string;
  order: number;
  isRequired: boolean;
  course: {
    id: string;
    title: string;
    slug: string;
    description?: string;
    thumbnailUrl?: string;
    duration?: number;
    difficulty: string;
    category?: string;
    isPublished: boolean;
    grantsCertification?: string;
  };
  enrollment?: {
    status: string;
    progress: number;
    completedAt?: string;
  } | null;
}

export interface LearningPath {
  id: string;
  title: string;
  slug: string;
  description?: string;
  targetRole?: UserRole;
  isRequired: boolean;
  isPublished: boolean;
  order: number;
  courses: LearningPathCourse[];
  createdAt: string;
  updatedAt: string;
}

export interface LearningPathWithStats extends LearningPath {
  stats: {
    totalCourses: number;
    requiredCourses: number;
    totalDuration: number;
    completedUsers: number;
    inProgressUsers: number;
  };
}

export interface LearningPathWithProgress extends LearningPath {
  progress: {
    totalCourses: number;
    completedCourses: number;
    requiredCourses: number;
    completedRequired: number;
    percentComplete: number;
    isComplete: boolean;
  };
}

// ===== Admin Hooks =====

export function useAdminLearningPaths() {
  return useQuery<LearningPathWithStats[]>({
    queryKey: ["adminLearningPaths"],
    queryFn: async () => {
      const res = await fetch("/api/admin/learning-paths");
      if (!res.ok) throw new Error("Failed to fetch learning paths");
      return res.json();
    },
  });
}

export function useAdminLearningPath(id: string) {
  return useQuery<LearningPath>({
    queryKey: ["adminLearningPath", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/learning-paths/${id}`);
      if (!res.ok) throw new Error("Failed to fetch learning path");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateLearningPath() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      slug: string;
      description?: string;
      targetRole?: UserRole;
      isRequired?: boolean;
      isPublished?: boolean;
      courseIds?: string[];
    }) => {
      const res = await fetch("/api/admin/learning-paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create learning path");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminLearningPaths"] });
    },
  });
}

export function useUpdateLearningPath() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      title?: string;
      slug?: string;
      description?: string;
      targetRole?: UserRole;
      isRequired?: boolean;
      isPublished?: boolean;
      courseIds?: string[];
    }) => {
      const res = await fetch(`/api/admin/learning-paths/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update learning path");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["adminLearningPaths"] });
      queryClient.invalidateQueries({ queryKey: ["adminLearningPath", variables.id] });
    },
  });
}

export function useDeleteLearningPath() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/learning-paths/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete learning path");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminLearningPaths"] });
    },
  });
}

// ===== Public Hooks (for tutors) =====

export function useLearningPaths() {
  return useQuery<LearningPathWithProgress[]>({
    queryKey: ["learningPaths"],
    queryFn: async () => {
      const res = await fetch("/api/learning-paths");
      if (!res.ok) throw new Error("Failed to fetch learning paths");
      return res.json();
    },
  });
}
