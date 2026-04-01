"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CohortStatus } from "@prisma/client";

// ──────────────── Types ────────────────

export interface CohortMemberStats {
  active: number;
  inactive: number;
  quit: number;
  terminated: number;
  pending: number;
  total: number;
}

export interface CohortSummary {
  id: string;
  name: string;
  status: CohortStatus;
  description: string | null;
  notes: string | null;
  orientationSessionId: string;
  orientationSession: {
    id: string;
    title: string;
    scheduledAt: string;
    duration: number | null;
    zoomLink: string | null;
    hostName: string | null;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  memberStats: CohortMemberStats;
}

export interface CohortMemberDetail {
  id: string;
  cohortId: string;
  tutorProfileId: string;
  joinedAt: string;
  notes: string | null;
  tutorProfile: {
    id: string;
    status: string; // TutorStatus
    team: string | null;
    totalLessons: number;
    totalHours: number;
    averageRating: number | null;
    isSchoolCertified: boolean;
    isBqCertified: boolean;
    isPlaygroupCertified: boolean;
    hireDate: string | null;
    activatedAt: string | null;
    terminatedAt: string | null;
    user: {
      id: string;
      name: string | null;
      email: string;
      avatarUrl: string | null;
      headshotUrl: string | null;
      hireDate: string | null;
      onboardingProgress: {
        id: string;
        status: string;
        currentStep: number;
        welcomeCompletedAt: string | null;
        videosCompletedAt: string | null;
        quizPassedAt: string | null;
        quizScore: number | null;
        profileCompletedAt: string | null;
        w9CompletedAt: string | null;
        orientationAttendedAt: string | null;
        trainingCompletedAt: string | null;
        trainingSessions: unknown;
        shadowCompletedAt: string | null;
        shadowLessons: unknown;
        activatedAt: string | null;
      } | null;
    };
    labels: Array<{ id: string; name: string; color: string }>;
    certifications: Array<{
      id: string;
      type: string;
      status: string;
      issuedAt: string | null;
      expiresAt: string | null;
    }>;
  };
}

export interface CohortDetail {
  id: string;
  name: string;
  status: CohortStatus;
  description: string | null;
  notes: string | null;
  orientationSessionId: string;
  orientationSession: {
    id: string;
    title: string;
    scheduledAt: string;
    duration: number | null;
    zoomLink: string | null;
    hostName: string | null;
    maxParticipants: number | null;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _count: { members: number };
  members: CohortMemberDetail[];
}

interface CohortFilters {
  status?: CohortStatus;
  search?: string;
}

// ──────────────── Query Hooks ────────────────

/**
 * Fetch all hiring cohorts with member stats
 */
export function useCohorts(filters: CohortFilters = {}) {
  return useQuery<{ cohorts: CohortSummary[] }>({
    queryKey: ["cohorts", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.search) params.append("search", filters.search);
      const res = await fetch(`/api/admin/cohorts?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch cohorts");
      }
      return res.json();
    },
  });
}

/**
 * Fetch a single cohort with full member details
 */
export function useCohort(id: string | null) {
  return useQuery<CohortDetail>({
    queryKey: ["cohort", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/cohorts/${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch cohort");
      }
      return res.json();
    },
    enabled: !!id,
  });
}

// ──────────────── Mutation Hooks ────────────────

/**
 * Create a new hiring cohort
 */
export function useCreateCohort() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      status?: CohortStatus;
      description?: string;
      orientationSessionId: string;
    }) => {
      const res = await fetch("/api/admin/cohorts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create cohort");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cohorts"] });
    },
  });
}

/**
 * Update an existing cohort
 */
export function useUpdateCohort() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        status?: CohortStatus;
        description?: string;
        notes?: string;
        orientationSessionId?: string;
      };
    }) => {
      const res = await fetch(`/api/admin/cohorts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update cohort");
      }
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["cohorts"] });
      queryClient.invalidateQueries({ queryKey: ["cohort", id] });
    },
  });
}

/**
 * Delete a cohort
 */
export function useDeleteCohort() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/cohorts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete cohort");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cohorts"] });
    },
  });
}

/**
 * Add members to a cohort (bulk)
 */
export function useAddCohortMembers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cohortId,
      tutorProfileIds,
    }: {
      cohortId: string;
      tutorProfileIds: string[];
    }) => {
      const res = await fetch(`/api/admin/cohorts/${cohortId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorProfileIds }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add cohort members");
      }
      return res.json();
    },
    onSuccess: (_, { cohortId }) => {
      queryClient.invalidateQueries({ queryKey: ["cohort", cohortId] });
      queryClient.invalidateQueries({ queryKey: ["cohorts"] });
    },
  });
}

/**
 * Remove a single member from a cohort
 */
export function useRemoveCohortMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cohortId,
      tutorProfileId,
    }: {
      cohortId: string;
      tutorProfileId: string;
    }) => {
      const res = await fetch(`/api/admin/cohorts/${cohortId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorProfileId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to remove cohort member");
      }
      return res.json();
    },
    onSuccess: (_, { cohortId }) => {
      queryClient.invalidateQueries({ queryKey: ["cohort", cohortId] });
      queryClient.invalidateQueries({ queryKey: ["cohorts"] });
    },
  });
}
