import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PointsCategory } from "@prisma/client";

// Types
export interface PointsRule {
  id: string;
  name: string;
  description: string | null;
  category: PointsCategory;
  trigger: string;
  points: number;
  threshold: number | null;
  multiplier: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PointsRulesData {
  rules: PointsRule[];
  groupedRules: Record<string, PointsRule[]>;
  total: number;
}

export interface CreateRuleInput {
  name: string;
  description?: string;
  category: PointsCategory;
  trigger: string;
  points: number;
  threshold?: number;
  multiplier?: number;
  isActive?: boolean;
}

export interface UpdateRuleInput extends Partial<CreateRuleInput> {
  id: string;
}

// API functions
async function fetchPointsRules(): Promise<PointsRulesData> {
  const response = await fetch("/api/admin/points-rules");
  if (!response.ok) {
    throw new Error("Failed to fetch points rules");
  }
  return response.json();
}

async function createRule(data: CreateRuleInput): Promise<PointsRule> {
  const response = await fetch("/api/admin/points-rules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create rule");
  }
  return response.json();
}

async function updateRule(data: UpdateRuleInput): Promise<PointsRule> {
  const response = await fetch("/api/admin/points-rules", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update rule");
  }
  return response.json();
}

async function deleteRule(id: string): Promise<void> {
  const response = await fetch(`/api/admin/points-rules?id=${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete rule");
  }
}

async function seedDefaultRules(): Promise<void> {
  const response = await fetch("/api/admin/points-rules", {
    method: "PATCH",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to seed default rules");
  }
}

// Hooks
export function usePointsRules() {
  return useQuery({
    queryKey: ["pointsRules"],
    queryFn: fetchPointsRules,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pointsRules"] });
    },
  });
}

export function useUpdateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pointsRules"] });
    },
  });
}

export function useDeleteRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pointsRules"] });
    },
  });
}

export function useSeedDefaultRules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: seedDefaultRules,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pointsRules"] });
    },
  });
}

// Category labels and colors
export const categoryConfig: Record<PointsCategory, { label: string; color: string; description: string }> = {
  TEACHING: {
    label: "Teaching",
    color: "bg-info-light text-info-dark",
    description: "Points for lessons taught and hours worked",
  },
  QUALITY: {
    label: "Quality",
    color: "bg-success-light text-success-dark",
    description: "Points for 5-star reviews, client retention, trial conversions",
  },
  LEARNING: {
    label: "Learning",
    color: "bg-primary-100 text-primary-700",
    description: "Points for course completion, quiz passes, certifications",
  },
  ENGAGEMENT: {
    label: "Engagement",
    color: "bg-warning-light text-warning-dark",
    description: "Points for login streaks and live session attendance",
  },
  BUSINESS: {
    label: "Business",
    color: "bg-accent-pink-light text-accent-pink",
    description: "Points for referrals and new client conversions",
  },
};
