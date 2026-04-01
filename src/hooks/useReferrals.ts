import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Types ──────────────────────────────────────────────────────

export interface Referral {
  id: number;
  contractor_id: number;
  referred_name: string;
  referred_email: string | null;
  referred_phone: string | null;
  referral_type: string;
  referring_client_id: string | null;
  referring_client_name: string | null;
  notes: string | null;
  status: "submitted" | "pending_review" | "tracking" | "converted" | "rejected";
  matched_client_id: string | null;
  matched_client_name: string | null;
  points_earned: number;
  points_threshold: number;
  submitted_at: string;
  matched_at: string | null;
  converted_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  tutor_first_name: string | null;
  tutor_last_name: string | null;
}

export interface ReferralStats {
  total_submitted: number;
  total_converted: number;
  currently_tracking: number;
  pending: number;
  pending_review: number;
  pay_tier: number;
  rate_bonus: number;
  conversions_to_next_tier: number;
  progress_to_next_tier: number;
}

export interface SubmitReferralInput {
  referred_name: string;
  referred_email?: string;
  referred_phone?: string;
  referral_type: string;
  referring_client_id?: string;
  referring_client_name?: string;
  notes?: string;
}

// ─── API Functions ──────────────────────────────────────────────

async function fetchReferrals(status?: string): Promise<Referral[]> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);

  const url = `/api/referrals${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch referrals");
  }
  const data = await response.json();
  return data.referrals;
}

async function fetchReferralStats(contractorId: number): Promise<ReferralStats> {
  const response = await fetch(`/api/referrals/stats/${contractorId}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch referral stats");
  }
  const data = await response.json();
  return data.stats;
}

async function submitReferral(input: SubmitReferralInput): Promise<Referral> {
  const response = await fetch("/api/referrals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to submit referral");
  }
  const data = await response.json();
  return data.referral;
}

// ─── Hooks ──────────────────────────────────────────────────────

export function useReferrals(status?: string) {
  return useQuery({
    queryKey: ["referrals", status],
    queryFn: () => fetchReferrals(status),
  });
}

export function useReferralStats(contractorId: number | null) {
  return useQuery({
    queryKey: ["referralStats", contractorId],
    queryFn: () => fetchReferralStats(contractorId!),
    enabled: !!contractorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSubmitReferral() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitReferral,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
      queryClient.invalidateQueries({ queryKey: ["referralStats"] });
    },
  });
}
