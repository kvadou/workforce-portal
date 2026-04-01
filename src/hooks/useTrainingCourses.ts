import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CourseCategory,
  CourseDifficulty,
  ModuleContentType,
  EnrollmentStatus,
  ProgressStatus,
} from "@prisma/client";

// ===== Types =====

export interface TrainingCourse {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  difficulty: CourseDifficulty;
  category: CourseCategory;
  isRequired: boolean;
  isPublished: boolean;
  order: number;
  prerequisites: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  modules?: TrainingModule[];
}

export interface TrainingModule {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  order: number;
  contentType: ModuleContentType;
  videoUrl: string | null;
  content: string | null;
  resourceUrls: string[];
  hasQuiz: boolean;
  quizQuestions: QuizQuestion[] | null;
  passingScore: number | null;
  progress?: ModuleProgressInfo | null;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
}

export interface ModuleProgressInfo {
  status: ProgressStatus;
  videoProgress: number;
  videoDuration: number | null;
  lastVideoPosition: number;
  quizScore: number | null;
  quizAttempts?: number;
  notes: string | null;
  completedAt: string | null;
}

export interface EnrollmentInfo {
  status: EnrollmentStatus;
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
}

export interface CourseWithEnrollment extends TrainingCourse {
  moduleCount: number;
  enrollment: EnrollmentInfo | null;
}

export interface CourseWithStats extends TrainingCourse {
  enrollmentStats: {
    totalEnrolled: number;
    notStarted: number;
    inProgress: number;
    completed: number;
  };
  _count?: { enrollments: number };
}

// ===== Admin Hooks =====

export function useAdminCourses(filters?: {
  category?: CourseCategory;
  isPublished?: boolean;
  search?: string;
}) {
  return useQuery<{ courses: CourseWithStats[] }>({
    queryKey: ["adminCourses", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.category) params.set("category", filters.category);
      if (filters?.isPublished !== undefined)
        params.set("isPublished", String(filters.isPublished));
      if (filters?.search) params.set("search", filters.search);

      const res = await fetch(`/api/admin/courses?${params}`);
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json();
    },
  });
}

export function useAdminCourse(id: string | null) {
  return useQuery<CourseWithStats>({
    queryKey: ["adminCourse", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/courses/${id}`);
      if (!res.ok) throw new Error("Failed to fetch course");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<TrainingCourse>) => {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create course");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCourses"] });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TrainingCourse> }) => {
      const res = await fetch(`/api/admin/courses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update course");
      }
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["adminCourses"] });
      queryClient.invalidateQueries({ queryKey: ["adminCourse", id] });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, force }: { id: string; force?: boolean }) => {
      const url = force
        ? `/api/admin/courses/${id}?force=true`
        : `/api/admin/courses/${id}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete course");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCourses"] });
    },
  });
}

// ===== Module Admin Hooks =====

export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      data,
    }: {
      courseId: string;
      data: Partial<TrainingModule>;
    }) => {
      const res = await fetch(`/api/admin/courses/${courseId}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create module");
      }
      return res.json();
    },
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ["adminCourse", courseId] });
    },
  });
}

export function useUpdateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      moduleId,
      data,
    }: {
      courseId: string;
      moduleId: string;
      data: Partial<TrainingModule>;
    }) => {
      const res = await fetch(
        `/api/admin/courses/${courseId}/modules/${moduleId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update module");
      }
      return res.json();
    },
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ["adminCourse", courseId] });
    },
  });
}

export function useDeleteModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      moduleId,
    }: {
      courseId: string;
      moduleId: string;
    }) => {
      const res = await fetch(
        `/api/admin/courses/${courseId}/modules/${moduleId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete module");
      }
      return res.json();
    },
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ["adminCourse", courseId] });
    },
  });
}

export function useReorderModules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      moduleOrder,
    }: {
      courseId: string;
      moduleOrder: { id: string; order: number }[];
    }) => {
      const res = await fetch(`/api/admin/courses/${courseId}/modules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleOrder }),
      });
      if (!res.ok) throw new Error("Failed to reorder modules");
      return res.json();
    },
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ["adminCourse", courseId] });
    },
  });
}

// ===== Public (Tutor) Hooks =====

export function useTrainingCatalog(filters?: {
  category?: CourseCategory;
  search?: string;
}) {
  return useQuery<{ courses: CourseWithEnrollment[] }>({
    queryKey: ["trainingCatalog", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.category) params.set("category", filters.category);
      if (filters?.search) params.set("search", filters.search);

      const res = await fetch(`/api/training?${params}`);
      if (!res.ok) throw new Error("Failed to fetch training catalog");
      return res.json();
    },
  });
}

export function useTrainingCourse(slug: string | null) {
  return useQuery<CourseWithEnrollment & { modules: TrainingModule[] }>({
    queryKey: ["trainingCourse", slug],
    queryFn: async () => {
      const res = await fetch(`/api/training/${slug}`);
      if (!res.ok) throw new Error("Failed to fetch course");
      return res.json();
    },
    enabled: !!slug,
  });
}

export function useEnrollInCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug: string) => {
      const res = await fetch(`/api/training/${slug}`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to enroll");
      }
      return res.json();
    },
    onSuccess: (_, slug) => {
      queryClient.invalidateQueries({ queryKey: ["trainingCatalog"] });
      queryClient.invalidateQueries({ queryKey: ["trainingCourse", slug] });
    },
  });
}

export function useTrainingModule(slug: string | null, moduleId: string | null) {
  return useQuery<TrainingModule>({
    queryKey: ["trainingModule", slug, moduleId],
    queryFn: async () => {
      const res = await fetch(`/api/training/${slug}/modules/${moduleId}`);
      if (!res.ok) throw new Error("Failed to fetch module");
      return res.json();
    },
    enabled: !!slug && !!moduleId,
  });
}

export function useUpdateModuleProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slug,
      moduleId,
      data,
    }: {
      slug: string;
      moduleId: string;
      data: {
        videoProgress?: number;
        videoDuration?: number;
        lastVideoPosition?: number;
        quizScore?: number;
        notes?: string;
        markComplete?: boolean;
      };
    }) => {
      const res = await fetch(`/api/training/${slug}/modules/${moduleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update progress");
      return res.json();
    },
    onSuccess: (_, { slug, moduleId }) => {
      queryClient.invalidateQueries({ queryKey: ["trainingCourse", slug] });
      queryClient.invalidateQueries({ queryKey: ["trainingModule", slug, moduleId] });
      queryClient.invalidateQueries({ queryKey: ["trainingCatalog"] });
    },
  });
}

export interface QuizSubmissionResult {
  score: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  passingScore: number;
  quizAttempts: number;
  pointsEarned: number;
  courseProgress: number;
  isCourseComplete: boolean;
  certificationAwarded?: boolean;
  badgesAwarded?: string[];
}

export function useSubmitQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slug,
      moduleId,
      answers,
    }: {
      slug: string;
      moduleId: string;
      answers: Record<string, string>;
    }): Promise<QuizSubmissionResult> => {
      const res = await fetch(`/api/training/${slug}/modules/${moduleId}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit quiz");
      }
      return res.json();
    },
    onSuccess: (_, { slug, moduleId }) => {
      queryClient.invalidateQueries({ queryKey: ["trainingCourse", slug] });
      queryClient.invalidateQueries({ queryKey: ["trainingModule", slug, moduleId] });
      queryClient.invalidateQueries({ queryKey: ["trainingCatalog"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
