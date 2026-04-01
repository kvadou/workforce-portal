"use client";

import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CalendarDaysIcon,
  CheckIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  UserPlusIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useCohort,
  useUpdateCohort,
  useDeleteCohort,
  useRemoveCohortMember,
  type CohortMemberDetail,
  type CohortDetail,
} from "@/hooks/useCohorts";
import { AddCohortMembersModal } from "@/components/admin/AddCohortMembersModal";
import type { CohortStatus } from "@prisma/client";

// ──────────────── Constants ────────────────

const STATUS_BADGE: Record<CohortStatus, string> = {
  UPCOMING: "bg-info-light text-info-dark",
  ACTIVE: "bg-success-light text-success-dark",
  COMPLETED: "bg-neutral-100 text-neutral-700",
};

const STATUS_LABELS: Record<CohortStatus, string> = {
  UPCOMING: "Upcoming",
  ACTIVE: "Active",
  COMPLETED: "Completed",
};

const TUTOR_STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-warning-light text-warning-dark",
  ACTIVE: "bg-success-light text-success-dark",
  INACTIVE: "bg-neutral-100 text-neutral-600",
  QUIT: "bg-accent-orange-light text-accent-orange",
  TERMINATED: "bg-error-light text-error-dark",
};


// ──────────────── Helpers ────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getMemberStatus(member: CohortMemberDetail): string {
  return member.tutorProfile.status;
}

// ──────────────── Avatar ────────────────

function Avatar({
  name,
  avatarUrl,
  headshotUrl,
  size = "sm",
}: {
  name: string | null;
  avatarUrl: string | null;
  headshotUrl: string | null;
  size?: "sm" | "md";
}) {
  const src = headshotUrl || avatarUrl;
  const sizeClass = size === "md" ? "h-10 w-10 text-sm" : "h-8 w-8 text-xs";

  if (src) {
    return (
      <img
        src={src}
        alt={name || "Avatar"}
        className={`${sizeClass} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-lg bg-primary-100 text-primary-700 font-medium flex items-center justify-center`}
    >
      {getInitials(name)}
    </div>
  );
}

// ──────────────── Confirm Panel ────────────────

function ConfirmPanel({
  message,
  onConfirm,
  onCancel,
  isLoading,
  destructive,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
  destructive?: boolean;
}) {
  return (
    <div className="p-4 bg-error-light border border-error rounded-lg">
      <p className="text-body-sm text-error-dark mb-3">{message}</p>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={`px-3 py-1.5 text-body-sm font-medium rounded-lg text-white ${
            destructive
              ? "bg-error hover:bg-error-dark"
              : "bg-primary-600 hover:bg-primary-700"
          } disabled:opacity-50`}
        >
          {isLoading ? (
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
          ) : (
            "Confirm"
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="px-3 py-1.5 text-body-sm font-medium rounded-lg border border-neutral-300 hover:bg-neutral-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ──────────────── Members Table ────────────────

function getOnboardingStatus(m: CohortMemberDetail) {
  const progress = m.tutorProfile.user.onboardingProgress;
  if (!progress) return null;
  return progress;
}

function countTrainingSessions(progress: ReturnType<typeof getOnboardingStatus>) {
  if (!progress?.trainingSessions) return 0;
  try {
    const sessions = progress.trainingSessions as Array<Record<string, unknown>>;
    return Array.isArray(sessions) ? sessions.filter((s) => s.completedAt).length : 0;
  } catch {
    return 0;
  }
}

function countShadowLessons(progress: ReturnType<typeof getOnboardingStatus>) {
  if (!progress?.shadowLessons) return 0;
  try {
    const lessons = progress.shadowLessons as Array<Record<string, unknown>>;
    return Array.isArray(lessons) ? lessons.filter((s) => s.completedAt).length : 0;
  } catch {
    return 0;
  }
}

function CertPill({ certified, label }: { certified: boolean; label: string }) {
  return (
    <span
      className={`px-1.5 py-0.5 rounded text-body-xs ${
        certified
          ? "bg-success-light text-success-dark"
          : "bg-neutral-100 text-neutral-400"
      }`}
    >
      {label}
    </span>
  );
}

function ProgressDots({ completed, total }: { completed: number; total: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-3 w-3 rounded-full ${
            i < completed ? "bg-success" : "bg-neutral-200"
          }`}
          title={`${i + 1} of ${total}`}
        />
      ))}
    </div>
  );
}

const MEMBERS_STORAGE_KEY = 'columnWidths_cohortMembers';

function MembersTable({
  cohort,
}: {
  cohort: CohortDetail;
}) {
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const removeMember = useRemoveCohortMember();
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(MEMBERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [resizing, setResizing] = useState<string | null>(null);

  const handleResizeStart = (e: React.MouseEvent, colKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidths[colKey] || 120;
    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(80, startWidth + (moveEvent.clientX - startX));
      setColumnWidths(prev => {
        const updated = { ...prev, [colKey]: newWidth };
        localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      setResizing(null);
    };
    setResizing(colKey);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const members = useMemo(() => {
    return cohort.members.filter((m) => {
      const status = getMemberStatus(m);
      if (statusFilter && status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = m.tutorProfile.user.name?.toLowerCase() || "";
        const email = m.tutorProfile.user.email.toLowerCase();
        if (!name.includes(q) && !email.includes(q)) return false;
      }
      return true;
    });
  }, [cohort.members, statusFilter, search]);

  const handleRemove = async (tutorProfileId: string) => {
    try {
      await removeMember.mutateAsync({
        cohortId: cohort.id,
        tutorProfileId,
      });
      setRemovingId(null);
    } catch {
      // error handled by mutation
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-neutral-300 rounded-lg text-body-sm bg-white"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending</option>
          <option value="INACTIVE">Inactive</option>
          <option value="QUIT">Quit</option>
          <option value="TERMINATED">Terminated</option>
        </select>
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="MagnifyingGlassIcon members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-lg text-body-sm"
          />
        </div>
      </div>

      {/* Members Table */}
      {members.length === 0 ? (
        <div className="text-center py-10 text-neutral-500">
          <UsersIcon className="h-10 w-10 mx-auto mb-2 text-neutral-300" />
          <p className="text-body-sm">No members match your filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="border-t border-b border-neutral-200 bg-neutral-50/50">
                  {[
                    { key: 'tutor', label: 'Tutor', width: 220, align: 'text-left', hide: '' },
                    { key: 'status', label: 'Status', width: 100, align: 'text-left', hide: '' },
                    { key: 'onboarding', label: 'Onboarding', width: 150, align: 'text-left', hide: '' },
                    { key: 'training', label: 'Training', width: 100, align: 'text-center', hide: '' },
                    { key: 'shadow', label: 'Shadow', width: 100, align: 'text-center', hide: '' },
                    { key: 'certs', label: 'Certs', width: 140, align: 'text-center', hide: 'hidden md:table-cell' },
                    { key: 'lessons', label: 'Lessons', width: 90, align: 'text-right', hide: 'hidden lg:table-cell' },
                    { key: 'hours', label: 'Hours', width: 90, align: 'text-right', hide: 'hidden lg:table-cell' },
                    { key: 'memberActions', label: '', width: 80, align: 'text-right', hide: '' },
                  ].map((col) => (
                    <th
                      key={col.key}
                      className={`relative py-2.5 px-3 text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap select-none ${col.align} ${col.hide}`}
                      style={{ width: columnWidths[col.key] || col.width }}
                    >
                      {col.label}
                      <div
                        className="absolute -right-1.5 top-0 bottom-0 w-3 cursor-col-resize hover:bg-primary-500/20 group z-10"
                        onMouseDown={(e) => handleResizeStart(e, col.key)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="mx-auto w-px h-full bg-neutral-200 group-hover:bg-primary-500/40" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const status = getMemberStatus(m);
                  const progress = getOnboardingStatus(m);
                  const trainingSessions = countTrainingSessions(progress);
                  const shadowLessons = countShadowLessons(progress);

                  return (
                    <tr key={m.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                      <td className="px-3 py-2.5 text-sm text-neutral-700">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={m.tutorProfile.user.name}
                            avatarUrl={m.tutorProfile.user.avatarUrl}
                            headshotUrl={m.tutorProfile.user.headshotUrl}
                          />
                          <div className="min-w-0">
                            <Link
                              href={
                                m.tutorProfile.user.onboardingProgress?.id
                                  ? `/admin/onboarding/${m.tutorProfile.user.onboardingProgress.id}`
                                  : `/admin/tutors/${m.tutorProfileId}`
                              }
                              className="text-sm font-medium text-neutral-900 hover:text-primary-600 truncate block"
                            >
                              {m.tutorProfile.user.name || "Unknown"}
                            </Link>
                            <p className="text-xs text-neutral-500 truncate">
                              {m.tutorProfile.user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-sm text-neutral-700">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                            TUTOR_STATUS_BADGE[status] || "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-sm text-neutral-700">
                        {progress ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                progress.activatedAt
                                  ? "bg-success"
                                  : progress.orientationAttendedAt
                                    ? "bg-info"
                                    : "bg-warning"
                              }`}
                            />
                            <span className="text-xs text-neutral-600">
                              {progress.activatedAt
                                ? "Completed"
                                : progress.shadowCompletedAt
                                  ? "Shadowing done"
                                  : progress.trainingCompletedAt
                                    ? "Training done"
                                    : progress.orientationAttendedAt
                                      ? "Orientation done"
                                      : progress.quizPassedAt
                                        ? "Quiz passed"
                                        : "In progress"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-400">
                            No data
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-neutral-700">
                        <div className="flex justify-center">
                          <ProgressDots
                            completed={trainingSessions}
                            total={3}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-sm text-neutral-700">
                        <div className="flex justify-center">
                          <ProgressDots
                            completed={shadowLessons}
                            total={3}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-sm text-neutral-700 hidden md:table-cell">
                        <div className="flex justify-center gap-1">
                          <CertPill
                            certified={m.tutorProfile.isSchoolCertified}
                            label="School"
                          />
                          <CertPill
                            certified={m.tutorProfile.isBqCertified}
                            label="BQ"
                          />
                          <CertPill
                            certified={m.tutorProfile.isPlaygroupCertified}
                            label="PG"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-sm text-neutral-700 hidden lg:table-cell text-right tabular-nums">
                        {m.tutorProfile.totalLessons}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-neutral-700 hidden lg:table-cell text-right tabular-nums">
                        {Number(m.tutorProfile.totalHours).toFixed(1)}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-right">
                        {removingId === m.tutorProfileId ? (
                          <ConfirmPanel
                            message={`Remove ${m.tutorProfile.user.name || "this tutor"} from the cohort?`}
                            onConfirm={() => handleRemove(m.tutorProfileId)}
                            onCancel={() => setRemovingId(null)}
                            isLoading={removeMember.isPending}
                            destructive
                          />
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/admin/tutors/${m.tutorProfileId}`}
                              className="p-1.5 text-neutral-400 hover:text-primary-600 rounded"
                              title="View profile"
                            >
                              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => setRemovingId(m.tutorProfileId)}
                              className="p-1.5 text-neutral-400 hover:text-error rounded"
                              title="Remove from cohort"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────── Main Page ────────────────

export default function CohortDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: cohort, isLoading, error } = useCohort(id);
  const updateCohort = useUpdateCohort();
  const deleteCohort = useDeleteCohort();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState<CohortStatus>("UPCOMING");
  const [editDescription, setEditDescription] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Start editing
  const startEdit = () => {
    if (!cohort) return;
    setEditName(cohort.name);
    setEditStatus(cohort.status);
    setEditDescription(cohort.description || "");
    setEditNotes(cohort.notes || "");
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  const saveEdit = async () => {
    if (!cohort) return;
    try {
      await updateCohort.mutateAsync({
        id: cohort.id,
        data: {
          name: editName,
          status: editStatus,
          description: editDescription || undefined,
          notes: editNotes || undefined,
        },
      });
      setIsEditing(false);
    } catch {
      // error in mutation
    }
  };

  const handleDelete = async () => {
    if (!cohort) return;
    try {
      await deleteCohort.mutateAsync(cohort.id);
      router.push("/admin/onboarding/cohorts");
    } catch {
      // error in mutation
    }
  };

  // Compute stats
  const stats = useMemo(() => {
    if (!cohort) return null;
    const members = cohort.members;
    const counts = { active: 0, pending: 0, quit: 0, terminated: 0, inactive: 0 };
    for (const m of members) {
      const s = getMemberStatus(m) as keyof typeof counts;
      if (s in counts) counts[s]++;
    }
    return { ...counts, total: members.length };
  }, [cohort]);

  const existingMemberIds = useMemo(() => {
    return cohort?.members.map((m) => m.tutorProfileId) ?? [];
  }, [cohort]);

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <ArrowPathIcon className="h-8 w-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  // Error
  if (error || !cohort) {
    return (
      <div className="p-6">
        <Link
          href="/admin/onboarding/cohorts"
          className="inline-flex items-center gap-1.5 text-body-sm text-neutral-500 hover:text-neutral-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Cohorts
        </Link>
        <div className="flex items-center justify-center py-20">
          <ExclamationCircleIcon className="h-8 w-8 text-error mr-2" />
          <span className="text-neutral-600">
            {error instanceof Error ? error.message : "Cohort not found"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Back Link */}
      <Link
        href="/admin/onboarding/cohorts"
        className="inline-flex items-center gap-1.5 text-body-sm text-neutral-500 hover:text-neutral-700 transition-colors mb-4"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Cohorts
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-heading-lg text-neutral-900 bg-transparent border-b-2 border-primary-500 focus:outline-none w-full max-w-md"
              />
              <div className="flex items-center gap-3">
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as CohortStatus)}
                  className="px-3 py-1.5 border border-neutral-300 rounded-lg text-body-sm"
                >
                  <option value="UPCOMING">Upcoming</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description..."
                rows={2}
                className="w-full max-w-lg px-3 py-2 border border-neutral-300 rounded-lg text-body-sm"
              />
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Notes..."
                rows={2}
                className="w-full max-w-lg px-3 py-2 border border-neutral-300 rounded-lg text-body-sm"
              />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-heading-lg text-neutral-900">
                  {cohort.name}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-body-sm font-medium ${STATUS_BADGE[cohort.status]}`}
                >
                  {STATUS_LABELS[cohort.status]}
                </span>
              </div>
              <div className="flex items-center gap-3 text-body-sm text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <CalendarDaysIcon className="h-4 w-4" />
                  {cohort.orientationSession.title} —{" "}
                  {formatDate(cohort.orientationSession.scheduledAt)}
                </span>
              </div>
              {cohort.description && (
                <p className="text-body-sm text-neutral-600 mt-2">
                  {cohort.description}
                </p>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-4 shrink-0">
          {isEditing ? (
            <>
              <button
                onClick={saveEdit}
                disabled={updateCohort.isPending}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-body-sm font-medium disabled:opacity-50"
              >
                {updateCohort.isPending ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckIcon className="h-4 w-4" />
                )}
                CheckIcon
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1.5 px-3 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 text-body-sm"
              >
                <XMarkIcon className="h-4 w-4" />
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowAddMembers(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-body-sm font-medium"
              >
                <UserPlusIcon className="h-4 w-4" />
                Add Members
              </button>
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 px-3 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 text-body-sm"
              >
                <PencilSquareIcon className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-neutral-400 hover:text-error rounded-lg hover:bg-error-light transition-colors"
                title="Delete cohort"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="mb-6">
          <ConfirmPanel
            message={`Are you sure you want to delete "${cohort.name}"? This will remove all member associations but will NOT delete the tutor profiles themselves.`}
            onConfirm={handleDelete}
            onCancel={() => setShowDeleteConfirm(false)}
            isLoading={deleteCohort.isPending}
            destructive
          />
        </div>
      )}

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: "Total", value: stats.total, color: "text-neutral-900" },
            { label: "Active", value: stats.active, color: "text-success" },
            { label: "Pending", value: stats.pending, color: "text-warning" },
            { label: "Inactive", value: stats.inactive, color: "text-neutral-500" },
            { label: "Quit", value: stats.quit, color: "text-accent-orange" },
            { label: "Terminated", value: stats.terminated, color: "text-error" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl shadow-sm border border-neutral-200 p-3 text-center"
            >
              <p className="text-body-xs text-neutral-500">{s.label}</p>
              <p className={`text-xl font-semibold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Members */}
      <MembersTable cohort={cohort} />

      {/* Add Members Modal */}
      <AddCohortMembersModal
        isOpen={showAddMembers}
        onClose={() => setShowAddMembers(false)}
        cohortId={id}
        existingMemberIds={existingMemberIds}
        onSuccess={() => setShowAddMembers(false)}
      />
    </div>
  );
}
