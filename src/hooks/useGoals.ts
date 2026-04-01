import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { GoalCategory, GoalStatus } from "@prisma/client";

export interface GoalTemplate {
  id: string;
  name: string;
  description: string | null;
  category: GoalCategory;
  metricType: string;
  defaultTarget: number;
  isActive: boolean;
}

export interface TutorGoal {
  id: string;
  userId: string;
  templateId: string | null;
  name: string;
  description: string | null;
  category: GoalCategory;
  targetValue: number;
  currentValue: number;
  startDate: string;
  endDate: string;
  status: GoalStatus;
  completedAt: string | null;
  createdAt: string;
  template?: GoalTemplate | null;
}

export interface CreateGoalInput {
  templateId?: string;
  name: string;
  description?: string;
  category: GoalCategory;
  targetValue: number;
  startDate: string;
  endDate: string;
}

export interface UpdateGoalInput {
  id: string;
  name?: string;
  description?: string;
  targetValue?: number;
  currentValue?: number;
  endDate?: string;
  status?: GoalStatus;
}

// API functions
async function fetchGoals(): Promise<TutorGoal[]> {
  const response = await fetch("/api/goals");
  if (!response.ok) throw new Error("Failed to fetch goals");
  return response.json();
}

async function fetchGoalTemplates(): Promise<GoalTemplate[]> {
  const response = await fetch("/api/goals/templates");
  if (!response.ok) throw new Error("Failed to fetch templates");
  return response.json();
}

async function createGoal(data: CreateGoalInput): Promise<TutorGoal> {
  const response = await fetch("/api/goals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create goal");
  }
  return response.json();
}

async function updateGoal(data: UpdateGoalInput): Promise<TutorGoal> {
  const response = await fetch(`/api/goals/${data.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update goal");
  }
  return response.json();
}

async function deleteGoal(id: string): Promise<void> {
  const response = await fetch(`/api/goals/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete goal");
  }
}

// Hooks
export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: fetchGoals,
  });
}

export function useGoalTemplates() {
  return useQuery({
    queryKey: ["goalTemplates"],
    queryFn: fetchGoalTemplates,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}
