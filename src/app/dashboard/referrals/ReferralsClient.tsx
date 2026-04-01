"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useReferrals,
  useReferralStats,
  useSubmitReferral,
} from "@/hooks/useReferrals";
import type { Referral, SubmitReferralInput } from "@/hooks/useReferrals";
import {
  UserPlusIcon,
  PaperAirplaneIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

// ─── Constants ──────────────────────────────────────────────────

const REFERRAL_TYPES = [
  { value: "friend_neighbor", label: "Friend / Neighbor" },
  { value: "sibling", label: "Sibling" },
  { value: "school_lead", label: "School Lead" },
  { value: "auction", label: "Auction / Fundraiser" },
  { value: "other", label: "Other" },
] as const;

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  submitted: {
    label: "Submitted",
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200",
  },
  pending_review: {
    label: "Pending Review",
    color: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-200",
  },
  tracking: {
    label: "Tracking",
    color: "text-purple-700",
    bgColor: "bg-purple-50 border-purple-200",
  },
  converted: {
    label: "Converted",
    color: "text-green-700",
    bgColor: "bg-green-50 border-green-200",
  },
  rejected: {
    label: "Rejected",
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-200",
  },
};

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "pending_review", label: "Pending Review" },
  { value: "tracking", label: "Tracking" },
  { value: "converted", label: "Converted" },
  { value: "rejected", label: "Rejected" },
] as const;

// ─── Props ──────────────────────────────────────────────────────

interface ReferralsClientProps {
  contractorId: number | null;
}

// ─── Component ──────────────────────────────────────────────────

export function ReferralsClient({ contractorId }: ReferralsClientProps) {
  const [statusFilter, setStatusFilter] = useState("");
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  const {
    data: referrals,
    isLoading: referralsLoading,
    error: referralsError,
  } = useReferrals(statusFilter || undefined);

  const {
    data: stats,
    isLoading: statsLoading,
  } = useReferralStats(contractorId);

  if (!contractorId) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-neutral-100">
            <h1 className="text-2xl font-semibold text-neutral-900">Referrals</h1>
            <p className="text-sm text-neutral-500 mt-0.5">Your TutorCruncher profile is not linked yet</p>
          </div>
          <div className="px-5 sm:px-6 py-10 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-warning mx-auto mb-3" />
            <p className="text-neutral-600">
              Your account needs to be linked to TutorCruncher before you can submit referrals.
              Please contact your manager for assistance.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
      {/* Page Title */}
      <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-neutral-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Referrals</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Submit and track your referrals</p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowSubmitForm(true)}
        >
          <PaperAirplaneIcon className="h-4 w-4 mr-1.5" />
          Submit Referral
        </Button>
      </div>

      <div className="px-5 sm:px-6 py-5 sm:py-6">
      {/* Stats Banner */}
      <StatsBanner stats={stats} isLoading={statsLoading} />

      {/* Submit Referral Modal */}
      <SubmitReferralModal
        isOpen={showSubmitForm}
        onClose={() => setShowSubmitForm(false)}
      />

      {/* Filter Bar */}
      <div className="flex items-center gap-2 mb-4">
        <FunnelIcon className="h-4 w-4 text-neutral-400" />
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                statusFilter === filter.value
                  ? "bg-primary-100 text-primary-700 border border-primary-300"
                  : "bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Referrals List */}
      <ReferralsList
        referrals={referrals}
        isLoading={referralsLoading}
        error={referralsError}
      />
      </div>
      </div>
    </DashboardLayout>
  );
}

// ─── Stats Banner ───────────────────────────────────────────────

function StatsBanner({
  stats,
  isLoading,
}: {
  stats: ReturnType<typeof useReferralStats>["data"];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="py-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const tierProgress = stats.progress_to_next_tier;
  const progressPercent = (tierProgress / 5) * 100;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {/* Total Submitted */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
            <PaperAirplaneIcon className="h-4 w-4" />
            Submitted
          </div>
          <p className="text-2xl font-bold text-neutral-900">
            {stats.total_submitted}
          </p>
        </CardContent>
      </Card>

      {/* Converted */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
            <CheckCircleIcon className="h-4 w-4" />
            Converted
          </div>
          <p className="text-2xl font-bold text-green-600">
            {stats.total_converted}
          </p>
        </CardContent>
      </Card>

      {/* Pay Bonus */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
            <TrophyIcon className="h-4 w-4" />
            Pay Bonus
          </div>
          <p className="text-2xl font-bold text-primary-600">
            {stats.rate_bonus > 0 ? `+$${stats.rate_bonus}/hr` : "$0"}
          </p>
        </CardContent>
      </Card>

      {/* Progress to Next Tier */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
            <ArrowTrendingUpIcon className="h-4 w-4" />
            Next Tier
          </div>
          <p className="text-sm font-semibold text-neutral-700 mb-2">
            {tierProgress}/5 conversions
          </p>
          <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            {stats.conversions_to_next_tier} more for +${(stats.pay_tier + 1) * 5}/hr
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Submit Referral Modal ──────────────────────────────────────

function SubmitReferralModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<SubmitReferralInput>({
    referred_name: "",
    referred_email: "",
    referred_phone: "",
    referral_type: "friend_neighbor",
    referring_client_name: "",
    notes: "",
  });
  const [formError, setFormError] = useState("");

  const submitMutation = useSubmitReferral();

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!formData.referred_name.trim()) {
      setFormError("Name is required");
      return;
    }
    if (!formData.referred_email?.trim() && !formData.referred_phone?.trim()) {
      setFormError("Either email or phone is required");
      return;
    }

    try {
      await submitMutation.mutateAsync({
        ...formData,
        referred_name: formData.referred_name.trim(),
        referred_email: formData.referred_email?.trim() || undefined,
        referred_phone: formData.referred_phone?.trim() || undefined,
        referring_client_name:
          formData.referring_client_name?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
      });

      // Reset and close
      setFormData({
        referred_name: "",
        referred_email: "",
        referred_phone: "",
        referral_type: "friend_neighbor",
        referring_client_name: "",
        notes: "",
      });
      onClose();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to submit referral"
      );
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit a Referral" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Referred Name */}
        <div>
          <label
            htmlFor="referred_name"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Referred Person&apos;s Name <span className="text-red-500">*</span>
          </label>
          <input
            id="referred_name"
            name="referred_name"
            type="text"
            value={formData.referred_name}
            onChange={handleChange}
            placeholder="First and last name"
            className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
          />
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="referred_email"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Email{" "}
            <span className="text-neutral-400 font-normal">
              (required if no phone)
            </span>
          </label>
          <input
            id="referred_email"
            name="referred_email"
            type="email"
            value={formData.referred_email}
            onChange={handleChange}
            placeholder="parent@email.com"
            className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
          />
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="referred_phone"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Phone{" "}
            <span className="text-neutral-400 font-normal">
              (required if no email)
            </span>
          </label>
          <input
            id="referred_phone"
            name="referred_phone"
            type="tel"
            value={formData.referred_phone}
            onChange={handleChange}
            placeholder="(555) 123-4567"
            className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
          />
        </div>

        {/* Referral Type */}
        <div>
          <label
            htmlFor="referral_type"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Referral Type
          </label>
          <select
            id="referral_type"
            name="referral_type"
            value={formData.referral_type}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors bg-white"
          >
            {REFERRAL_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Referring Client Name */}
        <div>
          <label
            htmlFor="referring_client_name"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Which client referred them?{" "}
            <span className="text-neutral-400 font-normal">(optional)</span>
          </label>
          <input
            id="referring_client_name"
            name="referring_client_name"
            type="text"
            value={formData.referring_client_name}
            onChange={handleChange}
            placeholder="Client name"
            className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
          />
        </div>

        {/* Notes */}
        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Notes{" "}
            <span className="text-neutral-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Any additional context..."
            className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors resize-none"
          />
        </div>

        {/* Error */}
        {formError && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
            {formError}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={submitMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <>
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <PaperAirplaneIcon className="h-4 w-4" />
                Submit Referral
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Referrals List ─────────────────────────────────────────────

function ReferralsList({
  referrals,
  isLoading,
  error,
}: {
  referrals: Referral[] | undefined;
  isLoading: boolean;
  error: Error | null;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="py-4">
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <XCircleIcon className="h-10 w-10 text-red-400 mx-auto mb-2" />
          <p className="text-neutral-600">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!referrals || referrals.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ChartBarIcon className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500 font-medium">No referrals yet</p>
          <p className="text-neutral-400 text-sm mt-1">
            Submit your first referral to start earning pay bonuses!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {referrals.map((referral) => (
        <ReferralCard key={referral.id} referral={referral} />
      ))}
    </div>
  );
}

// ─── Referral Card ──────────────────────────────────────────────

function ReferralCard({ referral }: { referral: Referral }) {
  const statusCfg = STATUS_CONFIG[referral.status] || STATUS_CONFIG.submitted;
  const showPoints =
    referral.status === "tracking" || referral.status === "converted";
  const pointsPercent = showPoints
    ? Math.min(
        100,
        (Number(referral.points_earned) / Number(referral.points_threshold)) *
          100
      )
    : 0;

  const typeLabel =
    REFERRAL_TYPES.find((t) => t.value === referral.referral_type)?.label ||
    referral.referral_type;

  return (
    <Card hover>
      <CardContent className="py-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-neutral-900">
              {referral.referred_name}
            </h3>
            <p className="text-sm text-neutral-500">{typeLabel}</p>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${statusCfg.bgColor} ${statusCfg.color}`}
          >
            {statusCfg.label}
          </span>
        </div>

        {/* Contact info */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-400 mb-2">
          {referral.referred_email && <span>{referral.referred_email}</span>}
          {referral.referred_phone && <span>{referral.referred_phone}</span>}
          {referral.referring_client_name && (
            <span>via {referral.referring_client_name}</span>
          )}
        </div>

        {/* Points progress bar */}
        {showPoints && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
              <span>
                {Number(referral.points_earned).toFixed(0)} /{" "}
                {Number(referral.points_threshold).toFixed(0)} points
              </span>
              {referral.status === "converted" && (
                <span className="text-green-600 font-semibold flex items-center gap-1">
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  Converted
                </span>
              )}
            </div>
            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  referral.status === "converted"
                    ? "bg-gradient-to-r from-green-400 to-green-600"
                    : "bg-gradient-to-r from-primary-400 to-primary-600"
                }`}
                style={{ width: `${pointsPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Date + rejection reason */}
        <div className="flex items-center gap-1.5 mt-3 text-xs text-neutral-400">
          <ClockIcon className="h-3.5 w-3.5" />
          <span>
            Submitted{" "}
            {new Date(referral.submitted_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        {referral.status === "rejected" && referral.rejection_reason && (
          <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {referral.rejection_reason}
          </div>
        )}

        {referral.notes && (
          <div className="mt-2 text-xs text-neutral-500 italic">
            {referral.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
