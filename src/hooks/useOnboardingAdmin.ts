"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";

// ──────────────── Types ────────────────

export interface OnboardingDetail {
  id: string;
  userId: string;
  status: string;
  currentStep: number;

  // Self-service progress
  welcomeCompletedAt: string | null;
  videosCompletedAt: string | null;
  quizPassedAt: string | null;
  quizScore: number | null;
  quizAttempts: number;
  profileCompletedAt: string | null;
  w9CompletedAt: string | null;
  orientationAttendedAt: string | null;
  trainingCompletedAt: string | null;
  trainingSessions: unknown;
  shadowCompletedAt: string | null;
  shadowLessons: unknown;
  videoProgress: unknown;
  puzzlesSolved: number;
  puzzlesAttempted: number;
  puzzleBestStreak: number;
  puzzleCurrentRating: number;

  // Admin checklist: Emails
  certDateEmailSent: boolean;
  certDateEmailSentAt: string | null;
  nextStepsShadowEmailSent: boolean;
  nextStepsShadowEmailSentAt: string | null;
  onlineCertEmailSent: boolean;
  onlineCertEmailSentAt: string | null;
  welcomeEmailSent: boolean;
  welcomeEmailSentAt: string | null;

  // Admin checklist: Milestones
  certificationComplete: boolean;
  certificationCompletedAt: string | null;
  payoutsSetup: boolean;
  payoutsSetupAt: string | null;
  orientationDebriefComplete: boolean;
  orientationDebriefAt: string | null;
  demoMagicComplete: boolean;
  demoMagicCompletedAt: string | null;
  chessConfidenceComplete: boolean;
  chessConfidenceCompletedAt: string | null;
  teachingInSchoolsComplete: boolean;
  teachingInSchoolsCompletedAt: string | null;
  chessableComplete: boolean;
  chessableCompletedAt: string | null;

  // Admin checklist: Calls & Observations
  initialCallComplete: boolean;
  initialCallAt: string | null;
  initialCallNotes: string | null;
  shadow1Complete: boolean;
  shadow1At: string | null;
  shadow2Complete: boolean;
  shadow2At: string | null;
  shadow3Complete: boolean;
  shadow3At: string | null;
  mentorSignUp: boolean;

  // Admin notes
  shadowFeedback: string | null;
  longTermGoals: string | null;
  location: string | null;
  firstImpressions: string | null;
  availabilityScheduling: string | null;
  chessLevelNotes: string | null;
  month1MentorNotes: string | null;
  adminNotes: string | null;

  // Activation tracking
  googleGroupAdded: boolean;
  googleGroupAddedAt: string | null;
  googleGroupName: string | null;
  tutorCruncherCreated: boolean;
  tutorCruncherCreatedAt: string | null;
  welcomeEmailSent: boolean;
  welcomeEmailSentAt: string | null;
  branchIdGenerated: boolean;
  branchIdGeneratedAt: string | null;

  // Admin tracking
  activatedAt: string | null;
  activatedBy: string | null;
  returnedAt: string | null;
  returnReason: string | null;
  backgroundCheckStatus: string | null;

  // Relations
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    headshotUrl: string | null;
    role: string;
  };
  orientationSession: {
    id: string;
    title: string;
    scheduledAt: string;
  } | null;
  cohortMembership: {
    cohortId: string;
    cohortName: string;
  } | null;
}

// ──────────────── Query Hooks ────────────────

/**
 * Fetch full onboarding detail for admin profile page
 */
export function useOnboardingDetail(id: string | null) {
  return useQuery<OnboardingDetail>({
    queryKey: ["onboarding-admin", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/onboarding/${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch onboarding detail");
      }
      return res.json();
    },
    enabled: !!id,
  });
}

// ──────────────── Mutation Hooks ────────────────

/**
 * Toggle a boolean checklist field
 */
export function useToggleChecklist(progressId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      field,
      value,
    }: {
      field: string;
      value: boolean;
    }) => {
      const res = await fetch(
        `/api/admin/onboarding/${progressId}/checklist`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ field, value }),
        }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update checklist");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["onboarding-admin", progressId],
      });
    },
  });
}

/**
 * Save notes fields with debouncing
 */
export function useUpdateNotes(progressId: string) {
  const queryClient = useQueryClient();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const mutation = useMutation({
    mutationFn: async (data: Record<string, string | null>) => {
      const res = await fetch(
        `/api/admin/onboarding/${progressId}/notes`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update notes");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["onboarding-admin", progressId],
      });
    },
  });

  const debouncedSave = useCallback(
    (data: Record<string, string | null>) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        mutation.mutate(data);
      }, 1000);
    },
    [mutation]
  );

  return { ...mutation, debouncedSave };
}

/**
 * Execute an activation step
 */
export function useActivationStep(progressId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      step,
      groupKey,
    }: {
      step: string;
      groupKey?: string;
    }) => {
      const res = await fetch(
        `/api/admin/onboarding/${progressId}/activate-step`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step, groupKey }),
        }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to execute activation step");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["onboarding-admin", progressId],
      });
    },
  });
}

/**
 * Fetch available Google Groups
 */
export function useGoogleGroups(progressId: string) {
  return useQuery<{ groups: Record<string, string> }>({
    queryKey: ["google-groups", progressId],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/onboarding/${progressId}/google-groups`
      );
      if (!res.ok) {
        throw new Error("Failed to fetch Google Groups");
      }
      return res.json();
    },
    enabled: !!progressId,
  });
}
