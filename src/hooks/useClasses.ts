import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
export interface Student {
  id: string;
  classId: string;
  firstName: string;
  lastName: string | null;
  nickname: string | null;
  avatar: string | null;
  createdAt: string;
  progress?: StudentProgress[];
}

export interface StudentProgress {
  id: string;
  studentId: string;
  lessonId: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  completedAt: string | null;
  score: number | null;
  notes: string | null;
  lesson?: {
    id: string;
    title: string;
    number: number;
  };
}

export interface ClassSession {
  id: string;
  classId: string;
  lessonId: string;
  date: string;
  duration: number | null;
  notes: string | null;
  attendance: string[] | null;
  lesson?: {
    id: string;
    title: string;
    number: number;
  };
}

export interface Class {
  id: string;
  instructorId: string;
  name: string;
  description: string | null;
  color: string | null;
  currentLessonId: string | null;
  isActive: boolean;
  createdAt: string;
  currentLesson?: {
    id: string;
    title: string;
    number: number;
    module?: {
      id: string;
      title: string;
      course?: {
        id: string;
        title: string;
      };
    };
  };
  students?: Student[];
  sessions?: ClassSession[];
  _count?: {
    students: number;
    sessions: number;
  };
}

// API functions
async function fetchClasses(instructorId: string, includeStudents = false): Promise<Class[]> {
  const params = new URLSearchParams({ instructorId });
  if (includeStudents) params.set("includeStudents", "true");

  const response = await fetch(`/api/classes?${params}`);
  if (!response.ok) throw new Error("Failed to fetch classes");
  return response.json();
}

async function fetchMyClasses(includeStudents = false): Promise<Class[]> {
  const params = new URLSearchParams();
  if (includeStudents) params.set("includeStudents", "true");

  const response = await fetch(`/api/classes?${params}`);
  if (!response.ok) throw new Error("Failed to fetch classes");
  return response.json();
}

async function fetchClass(id: string): Promise<Class> {
  const response = await fetch(`/api/classes/${id}`);
  if (!response.ok) throw new Error("Failed to fetch class");
  return response.json();
}

async function createClass(data: {
  instructorId?: string;
  name: string;
  description?: string;
  color?: string;
}): Promise<Class> {
  const response = await fetch("/api/classes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create class");
  return response.json();
}

async function updateClass(id: string, data: {
  name?: string;
  description?: string;
  color?: string;
  currentLessonId?: string;
  isActive?: boolean;
}): Promise<Class> {
  const response = await fetch(`/api/classes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update class");
  return response.json();
}

async function deleteClass(id: string): Promise<void> {
  const response = await fetch(`/api/classes/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to delete class");
}

async function fetchStudents(classId: string): Promise<Student[]> {
  const response = await fetch(`/api/classes/${classId}/students`);
  if (!response.ok) throw new Error("Failed to fetch students");
  return response.json();
}

async function addStudent(classId: string, data: {
  firstName: string;
  lastName?: string;
  nickname?: string;
  avatar?: string;
}): Promise<Student> {
  const response = await fetch(`/api/classes/${classId}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to add student");
  return response.json();
}

async function updateStudent(id: string, data: {
  firstName?: string;
  lastName?: string;
  nickname?: string;
  avatar?: string;
}): Promise<Student> {
  const response = await fetch(`/api/students/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update student");
  return response.json();
}

async function deleteStudent(id: string): Promise<void> {
  const response = await fetch(`/api/students/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to delete student");
}

async function updateStudentProgress(studentId: string, data: {
  lessonId: string;
  status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  score?: number;
  notes?: string;
}): Promise<StudentProgress> {
  const response = await fetch(`/api/students/${studentId}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update student progress");
  return response.json();
}

// Hooks
export function useClasses(instructorId: string, includeStudents = false) {
  return useQuery({
    queryKey: ["classes", instructorId, includeStudents],
    queryFn: () => fetchClasses(instructorId, includeStudents),
    enabled: !!instructorId,
  });
}

// Fetch current user's classes (no instructorId needed - uses session)
export function useMyClasses(includeStudents = false) {
  return useQuery({
    queryKey: ["myClasses", includeStudents],
    queryFn: () => fetchMyClasses(includeStudents),
  });
}

export function useClass(id: string) {
  return useQuery({
    queryKey: ["classes", id],
    queryFn: () => fetchClass(id),
    enabled: !!id,
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClass,
    onSuccess: (_, variables) => {
      // Invalidate both specific instructor classes and current user's classes
      if (variables.instructorId) {
        queryClient.invalidateQueries({ queryKey: ["classes", variables.instructorId] });
      }
      queryClient.invalidateQueries({ queryKey: ["myClasses"] });
    },
  });
}

export function useUpdateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateClass>[1] }) =>
      updateClass(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["classes", id] });
    },
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useStudents(classId: string) {
  return useQuery({
    queryKey: ["students", classId],
    queryFn: () => fetchStudents(classId),
    enabled: !!classId,
  });
}

export function useAddStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ classId, data }: { classId: string; data: Parameters<typeof addStudent>[1] }) =>
      addStudent(classId, data),
    onSuccess: (_, { classId }) => {
      queryClient.invalidateQueries({ queryKey: ["students", classId] });
      queryClient.invalidateQueries({ queryKey: ["classes", classId] });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateStudent>[1] }) =>
      updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useUpdateStudentProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, data }: { studentId: string; data: Parameters<typeof updateStudentProgress>[1] }) =>
      updateStudentProgress(studentId, data),
    onSuccess: (_, { studentId }) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}
