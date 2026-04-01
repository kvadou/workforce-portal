"use client";

import {
  GiftIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { useAdminTutorReferrals } from "@/hooks/useTutorProfiles";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

/* ─── Constants ─── */

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  submitted: { label: "Submitted", color: "text-neutral-600", bgColor: "bg-neutral-100" },
  pending_review: { label: "Pending Review", color: "text-warning-dark", bgColor: "bg-warning-light" },
  tracking: { label: "Tracking", color: "text-info-dark", bgColor: "bg-info-light" },
  converted: { label: "Converted", color: "text-success-dark", bgColor: "bg-success-light" },
  rejected: { label: "Rejected", color: "text-error-dark", bgColor: "bg-error-light" },
};

/* ─── Props ─── */

interface ReferralsTabProps {
  tutorProfileId: string;
  tutorCruncherId: number | null;
}

/* ─── Main Component ─── */

export default function ReferralsTab({ tutorProfileId, tutorCruncherId }: ReferralsTabProps) {
  const { data, isLoading } = useAdminTutorReferrals(tutorCruncherId ? tutorProfileId : null);

  if (!tutorCruncherId) {
    return (
      <div className="flex flex-col items-center py-12">
        <GiftIcon className="h-12 w-12 text-neutral-300" />
        <h3 className="text-sm font-semibold text-neutral-700 mt-3">No TutorCruncher Link</h3>
        <p className="text-xs text-neutral-400 mt-1">Referral tracking requires a TutorCruncher connection.</p>
      </div>
    );
  }

  if (isLoading) return <LoadingSpinner fullPage />;

  const referrals = data?.referrals || [];
  const stats = data?.stats;

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatsCard
            icon={<GiftIcon className="h-5 w-5 text-primary-500" />}
            value={String(stats.total_submitted)}
            label="Total Submitted"
          />
          <StatsCard
            icon={<CheckCircleIcon className="h-5 w-5 text-success" />}
            value={String(stats.total_converted)}
            label="Converted"
            valueColor="text-success"
          />
          <StatsCard
            icon={<CurrencyDollarIcon className="h-5 w-5 text-success" />}
            value={stats.rate_bonus ? `+$${stats.rate_bonus.toFixed(2)}/hr` : "$0.00"}
            label="Pay Bonus"
          />
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4">
            <div className="flex justify-center mb-1.5">
              <ArrowTrendingUpIcon className="h-5 w-5 text-primary-500" />
            </div>
            <p className="text-center text-xl font-bold text-neutral-900">
              {stats.total_converted}/{stats.total_converted + stats.conversions_to_next_tier}
            </p>
            <p className="text-center text-xs text-neutral-500">Next Tier Progress</p>
            <div className="mt-2 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${Math.min(stats.progress_to_next_tier * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Referrals Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 pb-0">
          <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
            <GiftIcon className="h-5 w-5 text-primary-500" />
            Referrals
            <span className="text-xs text-neutral-400 font-normal">({referrals.length})</span>
          </h3>
        </div>
        <div className="p-4">
          {referrals.length === 0 ? (
            <div className="flex flex-col items-center py-6">
              <GiftIcon className="h-10 w-10 text-neutral-300" />
              <p className="text-xs text-neutral-400 mt-1.5">No referrals submitted yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="text-left py-2 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Referred Person</th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Type</th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Status</th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Points</th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((ref) => {
                    const st = statusConfig[ref.status] || statusConfig.submitted;
                    return (
                      <tr key={ref.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                        <td className="py-2 px-4">
                          <p className="text-sm font-medium text-neutral-900">{ref.referred_name}</p>
                          {ref.referred_email && (
                            <p className="text-xs text-neutral-500">{ref.referred_email}</p>
                          )}
                        </td>
                        <td className="py-2 px-4 text-sm text-neutral-700 capitalize">{ref.referral_type}</td>
                        <td className="py-2 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.bgColor} ${st.color}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-neutral-700">{ref.points_earned}</span>
                            {ref.points_threshold > 0 && (
                              <div className="w-12 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary-500 rounded-full"
                                  style={{ width: `${Math.min((ref.points_earned / ref.points_threshold) * 100, 100)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-4 text-sm text-neutral-500">
                          {new Date(ref.submitted_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function StatsCard({
  icon,
  value,
  label,
  valueColor = "text-neutral-900",
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4 text-center">
      <div className="flex justify-center mb-1.5">{icon}</div>
      <p className={`text-xl font-bold ${valueColor}`}>{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}
