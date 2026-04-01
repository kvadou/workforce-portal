"use client";

import {
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  GiftIcon,
  PaperAirplaneIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  useReferrals,
  useReferralStats,
} from "@/hooks/useReferrals";
import type { Referral, ReferralStats } from "@/hooks/useReferrals";
import Link from "next/link";

// ─── Constants ──────────────────────────────────────────────────

const REFERRAL_TYPES: Record<string, string> = {
  friend_neighbor: "Friend / Neighbor",
  sibling: "Sibling",
  school_lead: "School Lead",
  auction: "Auction / Fundraiser",
  other: "Other",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  submitted: {
    label: "Submitted",
    color: "text-neutral-700",
    bgColor: "bg-neutral-50 border-neutral-200",
  },
  pending_review: {
    label: "Pending Review",
    color: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-200",
  },
  tracking: {
    label: "Tracking",
    color: "text-cyan-700",
    bgColor: "bg-cyan-50 border-cyan-200",
  },
  converted: {
    label: "Converted",
    color: "text-green-700",
    bgColor: "bg-green-50 border-green-200",
  },
  rejected: {
    label: "Rejected",
    color: "text-pink-700",
    bgColor: "bg-pink-50 border-pink-200",
  },
};

// ─── Props ──────────────────────────────────────────────────────

interface ProfileReferralsTabProps {
  contractorId: number | null;
}

// ─── Component ──────────────────────────────────────────────────

export function ProfileReferralsTab({ contractorId }: ProfileReferralsTabProps) {
  const {
    data: referrals,
    isLoading: referralsLoading,
    error: referralsError,
  } = useReferrals();

  const {
    data: stats,
    isLoading: statsLoading,
  } = useReferralStats(contractorId);

  if (!contractorId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ExclamationTriangleIcon className="w-12 h-12 text-amber-400 mb-3" />
        <p className="text-neutral-600 font-medium">Account not linked</p>
        <p className="text-neutral-400 text-sm mt-1">
          Your account needs to be linked to TutorCruncher before referral tracking is available.
          Contact your manager for assistance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Section */}
      <StatsSection stats={stats} isLoading={statsLoading} />

      {/* Referrals List */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <GiftIcon className="w-5 h-5 text-primary-500" />
          Your Referrals
        </h3>
        <ReferralsList
          referrals={referrals}
          isLoading={referralsLoading}
          error={referralsError}
        />
      </div>

      {/* Footer Link */}
      <div className="text-center">
        <Link
          href="/dashboard/referrals"
          className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 transition-colors"
        >
          Go to Full Referrals Page
          <PaperAirplaneIcon className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

// ─── Stats Section ──────────────────────────────────────────────

function StatsSection({
  stats,
  isLoading,
}: {
  stats: ReferralStats | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border p-4 text-center animate-pulse">
            <div className="w-6 h-6 bg-neutral-100 rounded mx-auto mb-2" />
            <div className="h-7 w-12 bg-neutral-100 rounded mx-auto mb-1" />
            <div className="h-3 w-16 bg-neutral-100 rounded mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const tierProgress = stats.progress_to_next_tier;
  const progressPercent = (tierProgress / 5) * 100;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Submitted */}
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <PaperAirplaneIcon className="w-6 h-6 text-primary-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-neutral-900">
            {stats.total_submitted}
          </p>
          <p className="text-xs text-neutral-500">Submitted</p>
        </div>

        {/* Total Converted */}
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <CheckCircleIcon className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-600">
            {stats.total_converted}
          </p>
          <p className="text-xs text-neutral-500">Converted</p>
        </div>

        {/* Pay Tier Bonus */}
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <TrophyIcon className="w-6 h-6 text-primary-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-primary-600">
            {stats.rate_bonus > 0 ? `+$${stats.rate_bonus}/hr` : "$0"}
          </p>
          <p className="text-xs text-neutral-500">Pay Bonus</p>
        </div>

        {/* Progress to Next Tier */}
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <ArrowTrendingUpIcon className="w-6 h-6 text-accent-navy mx-auto mb-2" />
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
        </div>
      </div>
    </div>
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
          <div key={i} className="bg-white rounded-xl shadow-sm border p-4 animate-pulse">
            <div className="h-5 w-40 bg-neutral-100 rounded mb-2" />
            <div className="h-4 w-24 bg-neutral-100 rounded mb-3" />
            <div className="h-2 w-full bg-neutral-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-error gap-3">
        <ExclamationCircleIcon className="w-10 h-10" />
        <p className="text-sm font-medium">{error.message}</p>
      </div>
    );
  }

  if (!referrals || referrals.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-400">
        <GiftIcon className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
        <p className="text-sm font-medium text-neutral-500">No referrals yet</p>
        <p className="text-sm mt-1">
          Submit your first referral to start earning pay bonuses!
        </p>
      </div>
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

  const typeLabel = REFERRAL_TYPES[referral.referral_type] || referral.referral_type;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-semibold text-neutral-900">
            {referral.referred_name}
          </h4>
          <p className="text-sm text-neutral-500">{typeLabel}</p>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${statusCfg.bgColor} ${statusCfg.color}`}
        >
          {statusCfg.label}
        </span>
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

      {/* Date */}
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

      {/* Rejection reason */}
      {referral.status === "rejected" && referral.rejection_reason && (
        <div className="mt-2 text-xs text-pink-600 bg-pink-50 border border-pink-100 rounded-md px-3 py-2">
          {referral.rejection_reason}
        </div>
      )}
    </div>
  );
}
