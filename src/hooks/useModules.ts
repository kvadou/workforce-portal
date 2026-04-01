import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Module, Lesson, Curriculum } from "@prisma/client";
import { ModuleCreateInput, ModuleUpdateInput } from "@/lib/validations/module";

type ModuleWithDetails = Module & {
  curriculum?: Curriculum;
  lessons?: Lesson[];
  _count?: { lessons: number };
};

// Fetch modules (optionally filtered by courseId)
async function fetchModules(params?: {
  courseId?: string;
  status?: string;
  includeLessons?: boolean;
}): Promise<ModuleWithDetails[]> {
  const searchParams = new URLSearchParams();
  if (params?.courseId) searchParams.set("courseId", params.courseId);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.includeLessons) searchParams.set("includeLessons", "true");

  const response = await fetch(`/api/modules?${searchParams}`);
  if (!response.ok) throw new Error("Failed to fetch modules");
  return response.json();
}

// Fetch single module
async function fetchModule(
  id: string,
  params?: { includeLessons?: boolean }
): Promise<ModuleWithDetails> {
  const searchParams = new URLSearchParams();
  if (params?.includeLessons) searchParams.set("includeLessons", "true");

  const response = await fetch(`/api/modules/${id}?${searchParams}`);
  if (!response.ok) throw new Error("Failed to fetch module");
  return response.json();
}

// Create module
async function createModule(data: ModuleCreateInput): Promise<Module> {
  const response = await fetch("/api/modules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create module");
  return response.json();
}

// Update module
async function updateModule(id: string, data: ModuleUpdateInput): Promise<Module> {
  const response = await fetch(`/api/modules/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update module");
  return response.json();
}

// Delete module
async function deleteModule(id: string): Promise<void> {
  const response = await fetch(`/api/modules/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete module");
}

// Reorder modules
async function reorderModules(modules: { id: string; order: number }[]): Promise<void> {
  const response = await fetch("/api/modules/reorder", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ modules }),
  });
  if (!response.ok) throw new Error("Failed to reorder modules");
}

// Hooks
export function useModules(params?: {
  courseId?: string;
  status?: string;
  includeLessons?: boolean;
}) {
  return useQuery({
    queryKey: ["modules", params],
    queryFn: () => fetchModules(params),
  });
}

export function useModule(id: string, params?: { includeLessons?: boolean }) {
  return useQuery({
    queryKey: ["modules", id, params],
    queryFn: () => fetchModule(id, params),
    enabled: !!id,
  });
}

export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createModule,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      queryClient.invalidateQueries({ queryKey: ["courses", data.curriculumId] });
    },
  });
}

export function useUpdateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ModuleUpdateInput }) =>
      updateModule(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      queryClient.invalidateQueries({ queryKey: ["modules", id] });
    },
  });
}

export function useDeleteModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

export function useReorderModules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderModules,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
  });
}
