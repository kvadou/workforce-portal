"use client";

import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useCohorts, type CohortSummary } from "@/hooks/useCohorts";
import { CreateCohortModal } from "@/components/admin/CreateCohortModal";
import type { CohortStatus } from "@prisma/client";

// ──────────────── Constants ────────────────

const STATUS_BADGE_COLORS: Record<CohortStatus, string> = {
  UPCOMING: "bg-info-light text-info-dark",
  ACTIVE: "bg-success-light text-success-dark",
  COMPLETED: "bg-neutral-100 text-neutral-700",
};

const STATUS_LABELS: Record<CohortStatus, string> = {
  UPCOMING: "Upcoming",
  ACTIVE: "Active",
  COMPLETED: "Completed",
};

const FILTER_OPTIONS: { value: CohortStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Statuses" },
  { value: "UPCOMING", label: "Upcoming" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
];

// ──────────────── Sub-components ────────────────

function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
      <div className="flex items-center gap-3">
        <div
          className={`h-10 w-10 rounded-lg ${iconBg} flex items-center justify-center`}
        >
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-body-xs text-neutral-500">{label}</p>
          <p className="text-heading-md text-neutral-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function MemberStatusBar({ stats }: { stats: CohortSummary["memberStats"] }) {
  const { total } = stats;
  if (total === 0) return null;

  const segments: { count: number; color: string; label: string }[] = [
    { count: stats.active, color: "bg-success", label: "Active" },
    { count: stats.pending, color: "bg-warning", label: "Pending" },
    { count: stats.quit, color: "bg-accent-orange", label: "Quit" },
    { count: stats.terminated, color: "bg-error", label: "Terminated" },
  ];

  const visible = segments.filter((s) => s.count > 0);

  return (
    <div className="flex items-center gap-3 mt-2">
      <div className="flex h-1.5 rounded-full overflow-hidden bg-neutral-100 w-32 shrink-0">
        {visible.map((s) => (
          <div
            key={s.label}
            className={`${s.color} transition-all`}
            style={{ width: `${(s.count / total) * 100}%` }}
            title={`${s.label}: ${s.count}`}
          />
        ))}
      </div>
      <div className="flex gap-2.5 flex-wrap">
        {visible.map((s) => (
          <span
            key={s.label}
            className="text-xs text-neutral-400 flex items-center gap-1"
          >
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${s.color}`} />
            {s.count}
          </span>
        ))}
      </div>
    </div>
  );
}

function CohortCard({ cohort }: { cohort: CohortSummary }) {
  return (
    <Link
      href={`/admin/onboarding/cohorts/${cohort.id}`}
      className="block bg-white rounded-xl shadow-sm border border-neutral-200 px-4 py-3 hover:shadow-card-hover hover:border-neutral-300 transition-all cursor-pointer group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-body-sm font-semibold text-neutral-900 truncate">
              {cohort.name}
            </h3>
            <span
              className={`px-1.5 py-0.5 rounded-lg text-xs font-medium whitespace-nowrap ${STATUS_BADGE_COLORS[cohort.status]}`}
            >
              {STATUS_LABELS[cohort.status]}
            </span>
          </div>

          <span className="text-neutral-300 hidden sm:inline">|</span>

          <span className="hidden sm:flex items-center gap-1 text-body-xs text-neutral-500">
            <UsersIcon className="h-3 w-3" />
            {cohort.memberCount}{" "}
            {cohort.memberCount === 1 ? "member" : "members"}
          </span>

          {cohort.memberCount > 0 && (
            <MemberStatusBar stats={cohort.memberStats} />
          )}
        </div>

        <ChevronRightIcon className="h-4 w-4 text-neutral-400 group-hover:text-neutral-600 transition-colors shrink-0 ml-2" />
      </div>
    </Link>
  );
}

function CohortSection({
  title,
  cohorts,
}: {
  title: string;
  cohorts: CohortSummary[];
}) {
  if (cohorts.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-body-md font-semibold text-neutral-700 mb-2">{title}</h2>
      <div className="space-y-2">
        {cohorts.map((cohort) => (
          <CohortCard key={cohort.id} cohort={cohort} />
        ))}
      </div>
    </div>
  );
}

// ──────────────── Main Page ────────────────

export default function CohortsListPage() {
  const [statusFilter, setStatusFilter] = useState<CohortStatus | "ALL">(
    "ALL"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch with server-side status filter (if not ALL)
  const apiFilters: { status?: CohortStatus; search?: string } = {};
  if (statusFilter !== "ALL") apiFilters.status = statusFilter;
  if (searchQuery.trim()) apiFilters.search = searchQuery.trim();

  const { data, isLoading, isError, error } = useCohorts(apiFilters);

  const cohorts = data?.cohorts ?? [];

  // Compute stats from all cohorts (unfiltered fetch when ALL)
  const stats = useMemo(() => {
    return {
      total: cohorts.length,
      upcoming: cohorts.filter((c) => c.status === "UPCOMING").length,
      active: cohorts.filter((c) => c.status === "ACTIVE").length,
      completed: cohorts.filter((c) => c.status === "COMPLETED").length,
    };
  }, [cohorts]);

  // Group cohorts by status for sections
  const grouped = useMemo(() => {
    return {
      upcoming: cohorts.filter((c) => c.status === "UPCOMING"),
      active: cohorts.filter((c) => c.status === "ACTIVE"),
      past: cohorts.filter((c) => c.status === "COMPLETED"),
    };
  }, [cohorts]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/admin/onboarding"
            className="flex items-center gap-1.5 text-body-sm text-neutral-500 hover:text-neutral-700 transition-colors mb-1"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Onboarding
          </Link>
          <h1 className="text-heading-lg text-neutral-900">Hiring Cohorts</h1>
          <p className="text-body-md text-neutral-600">
            Organize and track groups of new hires through onboarding
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          <span className="text-body-sm font-medium">Create Cohort</span>
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={UsersIcon}
          iconBg="bg-info-light"
          iconColor="text-info"
          label="Total Cohorts"
          value={stats.total}
        />
        <StatCard
          icon={ClockIcon}
          iconBg="bg-warning-light"
          iconColor="text-warning"
          label="Upcoming"
          value={stats.upcoming}
        />
        <StatCard
          icon={UsersIcon}
          iconBg="bg-success-light"
          iconColor="text-success"
          label="Active"
          value={stats.active}
        />
        <StatCard
          icon={CheckCircleIcon}
          iconBg="bg-neutral-100"
          iconColor="text-neutral-600"
          label="Completed"
          value={stats.completed}
        />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as CohortStatus | "ALL")
          }
          className="px-3 py-2 border border-neutral-300 rounded-lg text-body-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
        >
          {FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="MagnifyingGlassIcon cohorts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-lg text-body-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <ArrowPathIcon className="h-6 w-6 text-primary-600 animate-spin" />
          <span className="ml-2 text-body-md text-neutral-500">
            Loading cohorts...
          </span>
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <ExclamationCircleIcon className="h-10 w-10 text-error mx-auto mb-3" />
            <p className="text-body-md text-neutral-700 mb-1">
              Failed to load cohorts
            </p>
            <p className="text-body-sm text-neutral-500">
              {error instanceof Error
                ? error.message
                : "An unexpected error occurred"}
            </p>
          </div>
        </div>
      ) : cohorts.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <UsersIcon className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-body-md text-neutral-600 mb-1">
              {statusFilter !== "ALL" || searchQuery
                ? "No cohorts match your filters"
                : "No cohorts yet"}
            </p>
            <p className="text-body-sm text-neutral-500">
              {statusFilter !== "ALL" || searchQuery
                ? "Try changing the filters or search term"
                : "Create your first hiring cohort to get started"}
            </p>
            {!statusFilter && !searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-body-sm font-medium"
              >
                <PlusIcon className="h-4 w-4" />
                Create Cohort
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <CohortSection title="Upcoming Cohorts" cohorts={grouped.upcoming} />
          <CohortSection title="Active Cohorts" cohorts={grouped.active} />
          <CohortSection title="Past Cohorts" cohorts={grouped.past} />
        </>
      )}

      {/* Create Modal */}
      <CreateCohortModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => setShowCreateModal(false)}
      />
    </div>
  );
}
