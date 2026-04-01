import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Lesson,
  Module,
  Curriculum,
  StoryContent,
  Exercise,
  PrintMaterial,
  DevelopmentalSkill,
} from "@prisma/client";
import {
  LessonCreateInput,
  LessonUpdateInput,
  StoryContentInput,
  ChessercisesInput,
  ExerciseCreateInput,
  ExerciseUpdateInput,
  PrintMaterialCreateInput,
  PrintMaterialUpdateInput,
  DevelopmentalSkillInput,
} from "@/lib/validations/lesson";

type LessonWithDetails = Lesson & {
  module?: Module & { curriculum?: Curriculum };
  developmentalSkills?: DevelopmentalSkill[];
  story?: StoryContent | null;
  exercises?: Exercise[];
  printMaterials?: PrintMaterial[];
  _count?: {
    developmentalSkills: number;
    exercises: number;
    printMaterials: number;
  };
};

// ===== LESSON CRUD =====

async function fetchLessons(params?: {
  moduleId?: string;
  status?: string;
  includeDetails?: boolean;
}): Promise<LessonWithDetails[]> {
  const searchParams = new URLSearchParams();
  if (params?.moduleId) searchParams.set("moduleId", params.moduleId);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.includeDetails) searchParams.set("includeDetails", "true");

  const response = await fetch(`/api/lessons?${searchParams}`);
  if (!response.ok) throw new Error("Failed to fetch lessons");
  return response.json();
}

async function fetchLesson(id: string): Promise<LessonWithDetails> {
  const response = await fetch(`/api/lessons/${id}`);
  if (!response.ok) throw new Error("Failed to fetch lesson");
  return response.json();
}

async function createLesson(data: LessonCreateInput): Promise<Lesson> {
  const response = await fetch("/api/lessons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create lesson");
  return response.json();
}

async function updateLesson(id: string, data: LessonUpdateInput): Promise<Lesson> {
  const response = await fetch(`/api/lessons/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update lesson");
  return response.json();
}

async function deleteLesson(id: string): Promise<void> {
  const response = await fetch(`/api/lessons/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to delete lesson");
}

async function reorderLessons(lessons: { id: string; order: number }[]): Promise<void> {
  const response = await fetch("/api/lessons/reorder", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lessons }),
  });
  if (!response.ok) throw new Error("Failed to reorder lessons");
}

// ===== STORY CRUD =====

async function fetchStory(lessonId: string): Promise<StoryContent> {
  const response = await fetch(`/api/lessons/${lessonId}/story`);
  if (!response.ok) throw new Error("Failed to fetch story");
  return response.json();
}

async function updateStory(lessonId: string, data: StoryContentInput): Promise<StoryContent> {
  const response = await fetch(`/api/lessons/${lessonId}/story`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update story");
  return response.json();
}

// ===== CHESSERCISES =====

async function fetchChessercises(lessonId: string): Promise<ChessercisesInput> {
  const response = await fetch(`/api/lessons/${lessonId}/chessercises`);
  if (!response.ok) throw new Error("Failed to fetch chessercises");
  return response.json();
}

async function updateChessercises(
  lessonId: string,
  data: ChessercisesInput
): Promise<ChessercisesInput> {
  const response = await fetch(`/api/lessons/${lessonId}/chessercises`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update chessercises");
  return response.json();
}

// ===== EXERCISES =====

async function fetchExercises(lessonId: string): Promise<Exercise[]> {
  const response = await fetch(`/api/lessons/${lessonId}/exercises`);
  if (!response.ok) throw new Error("Failed to fetch exercises");
  return response.json();
}

async function createExercise(lessonId: string, data: ExerciseCreateInput): Promise<Exercise> {
  const response = await fetch(`/api/lessons/${lessonId}/exercises`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create exercise");
  return response.json();
}

async function updateExercise(
  lessonId: string,
  exerciseId: string,
  data: ExerciseUpdateInput
): Promise<Exercise> {
  const response = await fetch(`/api/lessons/${lessonId}/exercises/${exerciseId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update exercise");
  return response.json();
}

async function deleteExercise(lessonId: string, exerciseId: string): Promise<void> {
  const response = await fetch(`/api/lessons/${lessonId}/exercises/${exerciseId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete exercise");
}

// ===== MATERIALS =====

async function fetchMaterials(lessonId: string): Promise<PrintMaterial[]> {
  const response = await fetch(`/api/lessons/${lessonId}/materials`);
  if (!response.ok) throw new Error("Failed to fetch materials");
  return response.json();
}

async function createMaterial(
  lessonId: string,
  data: PrintMaterialCreateInput
): Promise<PrintMaterial> {
  const response = await fetch(`/api/lessons/${lessonId}/materials`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create material");
  return response.json();
}

async function updateMaterial(
  lessonId: string,
  materialId: string,
  data: PrintMaterialUpdateInput
): Promise<PrintMaterial> {
  const response = await fetch(`/api/lessons/${lessonId}/materials/${materialId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update material");
  return response.json();
}

async function deleteMaterial(lessonId: string, materialId: string): Promise<void> {
  const response = await fetch(`/api/lessons/${lessonId}/materials/${materialId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete material");
}

// ===== SKILLS =====

async function fetchSkills(lessonId: string): Promise<DevelopmentalSkill[]> {
  const response = await fetch(`/api/lessons/${lessonId}/skills`);
  if (!response.ok) throw new Error("Failed to fetch skills");
  return response.json();
}

async function createSkill(
  lessonId: string,
  data: DevelopmentalSkillInput
): Promise<DevelopmentalSkill> {
  const response = await fetch(`/api/lessons/${lessonId}/skills`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create skill");
  return response.json();
}

async function updateSkill(
  lessonId: string,
  skillId: string,
  data: Partial<DevelopmentalSkillInput>
): Promise<DevelopmentalSkill> {
  const response = await fetch(`/api/lessons/${lessonId}/skills/${skillId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update skill");
  return response.json();
}

async function deleteSkill(lessonId: string, skillId: string): Promise<void> {
  const response = await fetch(`/api/lessons/${lessonId}/skills/${skillId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete skill");
}

// ===== HOOKS =====

// Lesson hooks
export function useLessons(params?: {
  moduleId?: string;
  status?: string;
  includeDetails?: boolean;
}) {
  return useQuery({
    queryKey: ["lessons", params],
    queryFn: () => fetchLessons(params),
  });
}

export function useLesson(id: string) {
  return useQuery({
    queryKey: ["lessons", id],
    queryFn: () => fetchLesson(id),
    enabled: !!id,
  });
}

export function useCreateLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLesson,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      queryClient.invalidateQueries({ queryKey: ["modules", data.moduleId] });
    },
  });
}

export function useUpdateLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LessonUpdateInput }) =>
      updateLesson(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      queryClient.invalidateQueries({ queryKey: ["lessons", id] });
    },
  });
}

export function useDeleteLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLesson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
  });
}

export function useReorderLessons() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderLessons,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
    },
  });
}

// Story hooks
export function useStory(lessonId: string) {
  return useQuery({
    queryKey: ["lessons", lessonId, "story"],
    queryFn: () => fetchStory(lessonId),
    enabled: !!lessonId,
  });
}

export function useUpdateStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, data }: { lessonId: string; data: StoryContentInput }) =>
      updateStory(lessonId, data),
    onSuccess: (_, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: ["lessons", lessonId] });
    },
  });
}

// Chessercises hooks
export function useChessercises(lessonId: string) {
  return useQuery({
    queryKey: ["lessons", lessonId, "chessercises"],
    queryFn: () => fetchChessercises(lessonId),
    enabled: !!lessonId,
  });
}

export function useUpdateChessercises() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, data }: { lessonId: string; data: ChessercisesInput }) =>
      updateChessercises(lessonId, data),
    onSuccess: (_, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: ["lessons", lessonId] });
    },
  });
}

// Exercise hooks
export function useExercises(lessonId: string) {
  return useQuery({
    queryKey: ["lessons", lessonId, "exercises"],
    queryFn: () => fetchExercises(lessonId),
    enabled: !!lessonId,
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, data }: { lessonId: string; data: ExerciseCreateInput }) =>
      createExercise(lessonId, data),
    onSuccess: (_, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: ["lessons", lessonId] });
    },
  });
}

export function useUpdateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      lessonId,
      exerciseId,
      data,
    }: {
      lessonId: string;
      exerciseId: string;
      data: ExerciseUpdateInput;
    }) => updateExercise(lessonId, exerciseId, data),
    onSuccess: (_, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: ["lessons", lessonId] });
    },
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, exerciseId }: { lessonId: string; exerciseId: string }) =>
      deleteExercise(lessonId, exerciseId),
    onSuccess: (_, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: ["lessons", lessonId] });
    },
  });
}

// Material hooks
export function useMaterials(lessonId: string) {
  return useQuery({
    queryKey: ["lessons", lessonId, "materials"],
    queryFn: () => fetchMaterials(lessonId),
    enabled: !!lessonId,
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, data }: { lessonId: string; data: PrintMaterialCreateInput }) =>
      createMaterial(lessonId, data),
    onSuccess: (_, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: ["lessons", lessonId] });
    },
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      lessonId,
      materialId,
      data,
    }: {
      lessonId: string;
      materialId: string;
      data: PrintMaterialUpdateInput;
    }) => updateMaterial(lessonId, materialId, data),
    onSuccess: (_, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: ["lessons", lessonId] });
    },
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, materialId }: { lessonId: string; materialId: string }) =>
      deleteMaterial(lessonId, materialId),
    onSuccess: (_, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: ["lessons", lessonId] });
    },
  });
}

// Skill hooks
export function useSkills(lessonId: string) {
  return useQuery({
    queryKey: ["lessons", lessonId, "skills"],
    queryFn: () => fetchSkills(lessonId),
    enabled: !!lessonId,
  });
}

export function useCreateSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, data }: { lessonId: string; data: DevelopmentalSkillInput }) =>
      createSkill(lessonId, data),
    onSuccess: (_, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: ["lessons", lessonId] });
    },
  });
}

export function useUpdateSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      lessonId,
      skillId,
      data,
    }: {
      lessonId: string;
      skillId: string;
      data: Partial<DevelopmentalSkillInput>;
    }) => updateSkill(lessonId, skillId, data),
    onSuccess: (_, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: ["lessons", lessonId] });
    },
  });
}

export function useDeleteSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, skillId }: { lessonId: string; skillId: string }) =>
      deleteSkill(lessonId, skillId),
    onSuccess: (_, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: ["lessons", lessonId] });
    },
  });
}
