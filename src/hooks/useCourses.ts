import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Curriculum, Module, Lesson } from "@prisma/client";
import { CurriculumCreateInput, CurriculumUpdateInput } from "@/lib/validations/curriculum";

// Support both Course (backward compat) and Curriculum types
type Course = Curriculum;
type CourseCreateInput = CurriculumCreateInput;
type CourseUpdateInput = CurriculumUpdateInput;

type CurriculumWithModules = Curriculum & {
  modules?: (Module & { _count?: { lessons: number }; lessons?: Lesson[] })[];
};

// Alias for backward compatibility
type CourseWithModules = CurriculumWithModules;

// Fetch all curriculum items
async function fetchCourses(params?: {
  status?: string;
  includeModules?: boolean;
  includeLessons?: boolean;
}): Promise<CurriculumWithModules[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.includeModules) searchParams.set("includeModules", "true");
  if (params?.includeLessons) searchParams.set("includeLessons", "true");

  const response = await fetch(`/api/courses?${searchParams}`);
  if (!response.ok) throw new Error("Failed to fetch curriculum");
  return response.json();
}

// Fetch single course
async function fetchCourse(
  id: string,
  params?: { includeModules?: boolean; includeLessons?: boolean }
): Promise<CourseWithModules> {
  const searchParams = new URLSearchParams();
  if (params?.includeModules) searchParams.set("includeModules", "true");
  if (params?.includeLessons) searchParams.set("includeLessons", "true");

  const response = await fetch(`/api/courses/${id}?${searchParams}`);
  if (!response.ok) throw new Error("Failed to fetch course");
  return response.json();
}

// Create course
async function createCourse(data: CourseCreateInput): Promise<Course> {
  const response = await fetch("/api/courses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create course");
  return response.json();
}

// Update course
async function updateCourse(id: string, data: CourseUpdateInput): Promise<Course> {
  const response = await fetch(`/api/courses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update course");
  return response.json();
}

// Delete course
async function deleteCourse(id: string): Promise<void> {
  const response = await fetch(`/api/courses/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete course");
}

// Reorder courses
async function reorderCourses(courses: { id: string; order: number }[]): Promise<void> {
  const response = await fetch("/api/courses/reorder", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ courses }),
  });
  if (!response.ok) throw new Error("Failed to reorder courses");
}

// Hooks
export function useCourses(params?: { status?: string; includeModules?: boolean; includeLessons?: boolean }) {
  return useQuery({
    queryKey: ["courses", params],
    queryFn: () => fetchCourses(params),
  });
}

export function useCourse(
  id: string,
  params?: { includeModules?: boolean; includeLessons?: boolean }
) {
  return useQuery({
    queryKey: ["courses", id, params],
    queryFn: () => fetchCourse(id, params),
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CourseUpdateInput }) =>
      updateCourse(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses", id] });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

export function useReorderCourses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderCourses,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}
