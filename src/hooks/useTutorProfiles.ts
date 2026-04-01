"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  TutorProfile,
  TutorCertification,
  TutorLabel,
  TutorNote,
  TutorStatus,
  TutorTeam,
  User,
  Organization,
} from "@prisma/client";

// Extended tutor profile type with relations
export interface TutorProfileWithRelations extends TutorProfile {
  user: Pick<
    User,
    | "id"
    | "name"
    | "email"
    | "phone"
    | "avatarUrl"
    | "headshotUrl"
    | "hireDate"
    | "role"
    | "bio"
    | "dateOfBirth"
    | "emergencyContactName"
    | "emergencyContactPhone"
    | "emergencyContactRelation"
    | "languages"
  > & {
    organization?: Pick<Organization, "id" | "name" | "subdomain"> | null;
  };
  certifications: TutorCertification[];
  labels: TutorLabel[];
  notes?: TutorNote[];
  _count?: {
    notes: number;
  };
}

interface TutorsResponse {
  tutors: TutorProfileWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    byStatus: Record<string, number>;
    byTeam: Record<string, number>;
  };
}

interface TutorFilters {
  search?: string;
  status?: TutorStatus;
  team?: TutorTeam;
  labels?: string[];
  certifications?: ("school" | "bq" | "playgroup")[];
  minLessons?: number;
  maxLessons?: number;
  page?: number;
  limit?: number;
}

/**
 * Fetch tutor profiles with filtering
 */
export function useTutorProfiles(filters: TutorFilters = {}) {
  return useQuery<TutorsResponse>({
    queryKey: ["tutorProfiles", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.status) params.append("status", filters.status);
      if (filters.team) params.append("team", filters.team);
      if (filters.labels?.length) params.append("labels", filters.labels.join(","));
      if (filters.certifications?.length) params.append("certification", filters.certifications.join(","));
      if (filters.minLessons !== undefined) params.append("minLessons", filters.minLessons.toString());
      if (filters.maxLessons !== undefined) params.append("maxLessons", filters.maxLessons.toString());
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());

      const res = await fetch(`/api/admin/tutors?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch tutors");
      }
      return res.json();
    },
  });
}

interface LabelInfo {
  name: string;
  color: string;
  count: number;
}

/**
 * Fetch all unique labels for filtering
 */
export function useTutorLabels() {
  return useQuery<{ labels: LabelInfo[] }>({
    queryKey: ["tutorLabels"],
    queryFn: async () => {
      const res = await fetch("/api/admin/tutors/labels");
      if (!res.ok) {
        throw new Error("Failed to fetch labels");
      }
      return res.json();
    },
  });
}

/**
 * Fetch a single tutor profile
 */
export function useTutorProfile(id: string | null) {
  return useQuery<TutorProfileWithRelations>({
    queryKey: ["tutorProfile", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/tutors/${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch tutor");
      }
      return res.json();
    },
    enabled: !!id,
  });
}

/**
 * Update a tutor profile
 */
export function useUpdateTutorProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<TutorProfile>;
    }) => {
      const res = await fetch(`/api/admin/tutors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        throw new Error("Failed to update tutor");
      }
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["tutorProfile", id] });
      queryClient.invalidateQueries({ queryKey: ["tutorProfiles"] });
    },
  });
}

/**
 * Add a certification to a tutor
 */
export function useAddCertification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tutorProfileId,
      data,
    }: {
      tutorProfileId: string;
      data: Partial<TutorCertification>;
    }) => {
      const res = await fetch(
        `/api/admin/tutors/${tutorProfileId}/certifications`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) {
        throw new Error("Failed to add certification");
      }
      return res.json();
    },
    onSuccess: (_, { tutorProfileId }) => {
      queryClient.invalidateQueries({
        queryKey: ["tutorProfile", tutorProfileId],
      });
      queryClient.invalidateQueries({ queryKey: ["tutorProfiles"] });
    },
  });
}

/**
 * Add a note to a tutor
 */
export function useAddNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tutorProfileId,
      data,
    }: {
      tutorProfileId: string;
      data: { content: string; type?: string; isInternal?: boolean };
    }) => {
      const res = await fetch(`/api/admin/tutors/${tutorProfileId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        throw new Error("Failed to add note");
      }
      return res.json();
    },
    onSuccess: (_, { tutorProfileId }) => {
      queryClient.invalidateQueries({
        queryKey: ["tutorProfile", tutorProfileId],
      });
    },
  });
}

/**
 * Activate a tutor from onboarding
 */
export function useActivateTutor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      userId: string;
      team?: TutorTeam;
      baseHourlyRate?: number;
      skipExternalIntegrations?: boolean;
    }) => {
      const res = await fetch("/api/admin/onboarding/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details?.join(", ") || "Activation failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutorProfiles"] });
      queryClient.invalidateQueries({ queryKey: ["onboardingProgress"] });
    },
  });
}

/**
 * Add a label to a tutor
 */
export function useAddLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tutorProfileId,
      data,
    }: {
      tutorProfileId: string;
      data: { name: string; color?: string };
    }) => {
      const res = await fetch(`/api/admin/tutors/${tutorProfileId}/labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add label");
      }
      return res.json();
    },
    onSuccess: (_, { tutorProfileId }) => {
      queryClient.invalidateQueries({
        queryKey: ["tutorProfile", tutorProfileId],
      });
      queryClient.invalidateQueries({ queryKey: ["tutorProfiles"] });
    },
  });
}

/**
 * Remove a label from a tutor
 */
export function useRemoveLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tutorProfileId,
      labelId,
    }: {
      tutorProfileId: string;
      labelId: string;
    }) => {
      const res = await fetch(
        `/api/admin/tutors/${tutorProfileId}/labels?labelId=${labelId}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) {
        throw new Error("Failed to remove label");
      }
      return res.json();
    },
    onSuccess: (_, { tutorProfileId }) => {
      queryClient.invalidateQueries({
        queryKey: ["tutorProfile", tutorProfileId],
      });
      queryClient.invalidateQueries({ queryKey: ["tutorProfiles"] });
    },
  });
}

type BulkAction = "updateStatus" | "updateTeam" | "addLabel" | "removeLabel";

interface BulkActionData {
  status?: TutorStatus;
  team?: TutorTeam;
  name?: string;
  color?: string;
  labelName?: string;
}

/**
 * Perform bulk actions on multiple tutors
 */
export function useBulkTutorAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tutorIds,
      action,
      data,
    }: {
      tutorIds: string[];
      action: BulkAction;
      data: BulkActionData;
    }) => {
      const res = await fetch("/api/admin/tutors/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorIds, action, data }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Bulk action failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutorProfiles"] });
    },
  });
}

interface TutorAuditLog {
  id: string;
  tutorProfileId: string;
  action: string;
  field: string | null;
  previousValue: string | null;
  newValue: string | null;
  metadata: Record<string, unknown> | null;
  performedBy: string;
  performedByName: string | null;
  createdAt: string;
}

interface AuditLogResponse {
  logs: TutorAuditLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Fetch audit logs for a tutor
 */
export function useTutorAuditLog(tutorProfileId: string | null, limit = 20) {
  return useQuery<AuditLogResponse>({
    queryKey: ["tutorAuditLog", tutorProfileId, limit],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/tutors/${tutorProfileId}/audit-log?limit=${limit}`
      );
      if (!res.ok) {
        throw new Error("Failed to fetch audit log");
      }
      return res.json();
    },
    enabled: !!tutorProfileId,
  });
}

// Types for admin tutor overview
export interface AdminTutorOverview extends TutorProfileWithRelations {
  points: { total: number; monthly: number; rank: number };
  badges: {
    total: number;
    recent: Array<{
      id: string; badgeKey: string; title: string;
      description: string; icon: string; colorScheme: string;
      earnedAt: string;
    }>;
  };
  streaks: {
    login: { current: number; longest: number; lastActivity: string | null };
    lesson: { current: number; longest: number; lastActivity: string | null };
  };
  chess: {
    puzzleRating: number | null; puzzlesSolved: number;
    puzzleStreak: number; lessonsCompleted: number; lessonsTotal: number;
  };
  training: {
    enrolled: number; inProgress: number; completed: number;
    overallProgress: number;
    courses: Array<{
      id: string; title: string; slug: string;
      thumbnailUrl: string | null; difficulty: string;
      moduleCount: number; progress: number;
      status: string; completedAt: string | null;
    }>;
  };
  classes: {
    active: number; totalStudents: number;
    list: Array<{
      id: string; name: string; color: string | null;
      studentCount: number; sessionCount: number;
    }>;
  };
  milestones: Array<{
    id: string; type: string; value: number;
    threshold: number; achievedAt: string;
  }>;
}

export interface TCAppointment {
  id: number;
  start: string;
  finish: string;
  service: string;
  client: string;
  charge_rate: number;
  pay_rate: number;
}

export function useAdminTutorOverview(id: string | null) {
  return useQuery<AdminTutorOverview>({
    queryKey: ["adminTutorOverview", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/tutors/${id}/overview`);
      if (!res.ok) throw new Error("Failed to fetch tutor overview");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useTutorAppointments(id: string | null) {
  return useQuery<{ appointments: TCAppointment[]; total: number; hasMore: boolean }>({
    queryKey: ["tutorAppointments", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/tutors/${id}/appointments?limit=100`);
      if (!res.ok) throw new Error("Failed to fetch appointments");
      return res.json();
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useTutorAppointmentsPage(id: string | null, offset: number) {
  return useQuery<{ appointments: TCAppointment[]; total: number; hasMore: boolean }>({
    queryKey: ["tutorAppointments", id, offset],
    queryFn: async () => {
      const res = await fetch(`/api/admin/tutors/${id}/appointments?limit=100&offset=${offset}`);
      if (!res.ok) throw new Error("Failed to fetch appointments");
      return res.json();
    },
    enabled: !!id && offset > 0,
    staleTime: 1000 * 60 * 5,
  });
}

/* ─── TC Reviews ─── */

export interface TCReview {
  id: number;
  rating: number;
  comments: string;
  reviewer: string;
  reviewer_id: number | null;
  created: string;
}

export function useTutorReviews(tutorProfileId: string | null) {
  return useQuery<{ reviews: TCReview[] }>({
    queryKey: ["tutorReviews", tutorProfileId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/tutors/${tutorProfileId}/reviews`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    },
    enabled: !!tutorProfileId,
    staleTime: 1000 * 60 * 5,
  });
}

/* ─── TC Payment Orders ─── */

export interface TCPaymentOrder {
  id: number;
  date_sent: string;
  date_paid: string | null;
  amount: number;
  charges_count: number;
  status: string;
  url: string | null;
}

export function useTutorAccounting(tutorProfileId: string | null) {
  return useQuery<{ paymentOrders: TCPaymentOrder[] }>({
    queryKey: ["tutorAccounting", tutorProfileId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/tutors/${tutorProfileId}/accounting`);
      if (!res.ok) throw new Error("Failed to fetch accounting");
      return res.json();
    },
    enabled: !!tutorProfileId,
    staleTime: 1000 * 60 * 5,
  });
}

/* ─── Admin Referrals (server-side filtered) ─── */

export function useAdminTutorReferrals(tutorProfileId: string | null) {
  return useQuery<{
    referrals: Array<{
      id: number;
      contractor_id: number;
      referred_name: string;
      referred_email: string | null;
      referred_phone: string | null;
      referral_type: string;
      status: string;
      points_earned: number;
      points_threshold: number;
      submitted_at: string;
      converted_at: string | null;
      matched_client_name: string | null;
    }>;
    stats: {
      total_submitted: number;
      total_converted: number;
      currently_tracking: number;
      pending: number;
      pending_review: number;
      pay_tier: number;
      rate_bonus: number;
      conversions_to_next_tier: number;
      progress_to_next_tier: number;
    } | null;
  }>({
    queryKey: ["adminTutorReferrals", tutorProfileId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/tutors/${tutorProfileId}/referrals`);
      if (!res.ok) throw new Error("Failed to fetch referrals");
      return res.json();
    },
    enabled: !!tutorProfileId,
    staleTime: 1000 * 60 * 5,
  });
}

/* ─── Ad-Hoc Charges ─── */

export interface AdHocCharge {
  id: number;
  category_name: string;
  description: string;
  date_occurred: string;
  pay_contractor: number;
  charge_client: number;
  client_id: number | null;
  appointment_id: number | null;
  creator_first_name: string | null;
  creator_last_name: string | null;
}

export function useTutorCharges(tutorProfileId: string | null) {
  return useQuery<{ charges: AdHocCharge[] }>({
    queryKey: ["tutorCharges", tutorProfileId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/tutors/${tutorProfileId}/charges`);
      if (!res.ok) throw new Error("Failed to fetch charges");
      return res.json();
    },
    enabled: !!tutorProfileId,
    staleTime: 1000 * 60 * 5,
  });
}

export interface ChargeCategory {
  id: number;
  name: string;
}

export function useChargeCategories() {
  return useQuery<{ categories: ChargeCategory[] }>({
    queryKey: ["chargeCategories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/charges/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
    staleTime: 1000 * 60 * 30, // 30 min — categories rarely change
  });
}

export function useCreateCharge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tutorProfileId,
      data,
    }: {
      tutorProfileId: string;
      data: {
        category_id: number;
        description: string;
        date_occurred: string;
        pay_contractor: number;
      };
    }) => {
      const res = await fetch(`/api/admin/tutors/${tutorProfileId}/charges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create charge");
      }
      return res.json();
    },
    onSuccess: (_, { tutorProfileId }) => {
      queryClient.invalidateQueries({ queryKey: ["tutorCharges", tutorProfileId] });
    },
  });
}

/**
 * Fetch all badges earned by a tutor (admin view)
 */
export function useTutorBadges(id: string | null) {
  return useQuery<{
    badges: Array<{
      id: string;
      badgeKey: string;
      title: string;
      description: string;
      icon: string;
      colorScheme: string;
      earnedAt: string;
    }>;
  }>({
    queryKey: ["tutorBadges", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/tutors/${id}/badges`);
      if (!res.ok) throw new Error("Failed to fetch badges");
      return res.json();
    },
    enabled: !!id,
  });
}
