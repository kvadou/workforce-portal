"use client";

import { useState } from "react";
import {
  CheckIcon,
  PlusIcon,
  XMarkIcon,
  TrophyIcon,
  TagIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowTopRightOnSquareIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import type {
  TutorStatus,
  TutorTeam,
  TutorCertType,
  TutorCertStatus,
} from "@prisma/client";
import type { AdminTutorOverview } from "@/hooks/useTutorProfiles";

/* ─── Props ─── */

interface AdminTabProps {
  tutor: AdminTutorOverview;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  savePending: boolean;
  onAddCert: (data: { type: TutorCertType; status: TutorCertStatus }) => Promise<void>;
  addCertPending: boolean;
  onAddLabel: (data: { name: string; color: string }) => Promise<void>;
  addLabelPending: boolean;
  onRemoveLabel: (labelId: string) => Promise<void>;
  removeLabelPending: boolean;
}

/* ─── Config Maps ─── */

const statusConfig: Record<
  TutorStatus,
  { label: string; color: string; bgColor: string }
> = {
  PENDING: { label: "Pending", color: "text-warning", bgColor: "bg-warning-light" },
  ACTIVE: { label: "Active", color: "text-success", bgColor: "bg-success-light" },
  INACTIVE: { label: "Inactive", color: "text-neutral-500", bgColor: "bg-neutral-100" },
  QUIT: { label: "Quit", color: "text-accent-orange", bgColor: "bg-accent-orange-light" },
  TERMINATED: { label: "Terminated", color: "text-error", bgColor: "bg-error-light" },
};

const teamOptions: { value: TutorTeam; label: string }[] = [
  { value: "LA", label: "Los Angeles" },
  { value: "NYC", label: "New York" },
  { value: "SF", label: "San Francisco" },
  { value: "ONLINE", label: "Online" },
  { value: "WESTSIDE", label: "Westside" },
  { value: "EASTSIDE", label: "Eastside" },
];

const certTypeLabels: Record<TutorCertType, string> = {
  SCHOOL_CERTIFIED: "School Certified",
  BQ_CERTIFIED: "BQ Certified",
  PLAYGROUP_CERTIFIED: "Playgroup Certified",
  CHESSABLE_COMPLETED: "Chessable Completed",
  BACKGROUND_CHECK: "Background Check",
  ADVANCED_CHESS: "Advanced Chess",
  LEAD_TUTOR: "Lead Tutor",
};

const certStatusOptions: { value: TutorCertStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "EXPIRED", label: "Expired" },
  { value: "REVOKED", label: "Revoked" },
];

const LABEL_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
];

/* ─── Component ─── */

export default function AdminTab({
  tutor,
  onSave,
  savePending,
  onAddCert,
  addCertPending,
  onAddLabel,
  addLabelPending,
  onRemoveLabel,
  removeLabelPending,
}: AdminTabProps) {
  // Status & Team form state
  const [statusValue, setStatusValue] = useState<TutorStatus>(tutor.status);
  const [teamValue, setTeamValue] = useState<string>(tutor.team || "");

  // Payment form state
  const [hourlyRate, setHourlyRate] = useState<string>(
    tutor.baseHourlyRate ? String(Number(tutor.baseHourlyRate)) : ""
  );

  // Danger zone confirmation state
  const [confirmAction, setConfirmAction] = useState<"TERMINATED" | "QUIT" | null>(null);

  // Certification form state
  const [showAddCert, setShowAddCert] = useState(false);
  const [newCertType, setNewCertType] = useState<TutorCertType | "">("");
  const [newCertStatus, setNewCertStatus] = useState<TutorCertStatus>("COMPLETED");

  // Label form state
  const [showAddLabel, setShowAddLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#6366f1");

  // Saving states for individual sections
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingRate, setSavingRate] = useState(false);

  const currentStatus = statusConfig[tutor.status];

  /* ─── Handlers ─── */

  const handleSaveStatusTeam = async () => {
    setSavingStatus(true);
    try {
      await onSave({ status: statusValue, team: teamValue || null });
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSaveRate = async () => {
    setSavingRate(true);
    try {
      await onSave({
        baseHourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
      });
    } finally {
      setSavingRate(false);
    }
  };

  const handleDangerAction = async (status: "TERMINATED" | "QUIT") => {
    await onSave({ status });
    setConfirmAction(null);
  };

  const handleAddCert = async () => {
    if (!newCertType) return;
    await onAddCert({ type: newCertType, status: newCertStatus });
    setNewCertType("");
    setNewCertStatus("COMPLETED");
    setShowAddCert(false);
  };

  const handleAddLabel = async () => {
    if (!newLabelName.trim()) return;
    await onAddLabel({ name: newLabelName.trim(), color: newLabelColor });
    setNewLabelName("");
    setNewLabelColor("#6366f1");
    setShowAddLabel(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* ═══════════════ Left Column ═══════════════ */}
      <div className="space-y-4">
        {/* ── Status & Team Card ── */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
          <div className="p-4 pb-0">
            <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5 text-neutral-500" />
              Status & Team
            </h3>
          </div>
          <div className="p-4 space-y-4">
            {/* Current status pill */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-500">Current Status:</span>
              <span
                className={`px-3 py-1 rounded-lg text-sm font-medium ${currentStatus.bgColor} ${currentStatus.color}`}
              >
                {currentStatus.label}
              </span>
            </div>

            {/* Status dropdown */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Status
              </label>
              <select
                value={statusValue}
                onChange={(e) => setStatusValue(e.target.value as TutorStatus)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {(Object.keys(statusConfig) as TutorStatus[]).map((key) => (
                  <option key={key} value={key}>
                    {statusConfig[key].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Team dropdown */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Team
              </label>
              <select
                value={teamValue}
                onChange={(e) => setTeamValue(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select Team</option>
                {teamOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Save button */}
            <button
              onClick={handleSaveStatusTeam}
              disabled={savingStatus || savePending}
              className="flex items-center gap-2 bg-primary-600 text-white rounded-lg px-4 py-2 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              {savingStatus ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <CheckIcon className="h-4 w-4" />
              )}
              Save Status & Team
            </button>
          </div>
        </div>

        {/* ── Payment Information Card ── */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
          <div className="p-4 pb-0">
            <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
              <CurrencyDollarIcon className="h-5 w-5 text-neutral-500" />
              Payment Information
            </h3>
          </div>
          <div className="p-4 space-y-4">
            {/* Hourly Rate */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Hourly Rate
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-12 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">
                  /hr
                </span>
              </div>
            </div>

            {/* Branch ID */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Branch ID
              </label>
              <p className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-700">
                {tutor.branchId || "Not connected"}
              </p>
            </div>

            {/* TutorCruncher ID */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                TutorCruncher ID
              </label>
              {tutor.tutorCruncherId ? (
                <a
                  href={`https://account.acmeworkforce.com/contractors/${tutor.tutorCruncherId}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 transition-colors"
                >
                  #{tutor.tutorCruncherId}
                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                </a>
              ) : (
                <p className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-700">
                  Not connected
                </p>
              )}
            </div>

            {/* Save button */}
            <button
              onClick={handleSaveRate}
              disabled={savingRate || savePending}
              className="flex items-center gap-2 bg-primary-600 text-white rounded-lg px-4 py-2 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              {savingRate ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <CheckIcon className="h-4 w-4" />
              )}
              Save Rate
            </button>
          </div>
        </div>

        {/* ── Danger Zone Card ── */}
        <div className="bg-white rounded-xl shadow-sm border border-error">
          <div className="p-4 pb-0">
            <h3 className="text-sm font-semibold text-error-dark flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5" />
              Danger Zone
            </h3>
          </div>
          <div className="p-4 space-y-4">
            {/* Terminate */}
            {confirmAction !== "TERMINATED" ? (
              <button
                onClick={() => setConfirmAction("TERMINATED")}
                disabled={tutor.status === "TERMINATED" || savePending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-error text-error-dark rounded-lg text-sm font-medium hover:bg-error-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <XCircleIcon className="h-4 w-4" />
                Terminate Tutor
              </button>
            ) : (
              <div className="bg-error-light border border-error rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-error-dark">
                      Confirm Termination
                    </p>
                    <p className="text-sm text-error mt-1">
                      This will mark {tutor.user.name} as terminated. This action
                      will be logged in the audit trail.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="px-3 py-1.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDangerAction("TERMINATED")}
                    disabled={savePending}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-error rounded-lg hover:bg-error-dark disabled:opacity-50 transition-colors"
                  >
                    {savePending ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      "Confirm Termination"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Mark as Quit */}
            {confirmAction !== "QUIT" ? (
              <button
                onClick={() => setConfirmAction("QUIT")}
                disabled={tutor.status === "QUIT" || savePending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-accent-orange text-accent-orange rounded-lg text-sm font-medium hover:bg-accent-orange-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ExclamationTriangleIcon className="h-4 w-4" />
                Mark as Quit
              </button>
            ) : (
              <div className="bg-error-light border border-error rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-accent-orange flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-error-dark">
                      Confirm Quit Status
                    </p>
                    <p className="text-sm text-error mt-1">
                      This will mark {tutor.user.name} as having quit. This action
                      will be logged in the audit trail.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="px-3 py-1.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDangerAction("QUIT")}
                    disabled={savePending}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-accent-orange rounded-lg hover:bg-accent-orange disabled:opacity-50 transition-colors"
                  >
                    {savePending ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      "Confirm Quit"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════ Right Column ═══════════════ */}
      <div className="space-y-4">
        {/* ── Certifications Card ── */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
          <div className="p-4 pb-0 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
              <TrophyIcon className="h-5 w-5 text-neutral-500" />
              Certifications
            </h3>
            {!showAddCert && (
              <button
                onClick={() => setShowAddCert(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                Add
              </button>
            )}
          </div>
          <div className="p-4">
            {/* Quick cert badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {tutor.isSchoolCertified && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-info-light text-info-dark rounded-lg text-sm font-medium">
                  <TrophyIcon className="h-3.5 w-3.5" />
                  School
                </span>
              )}
              {tutor.isBqCertified && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium">
                  <TrophyIcon className="h-3.5 w-3.5" />
                  BQ
                </span>
              )}
              {tutor.isPlaygroupCertified && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-success-light text-success-dark rounded-lg text-sm font-medium">
                  <TrophyIcon className="h-3.5 w-3.5" />
                  Playgroup
                </span>
              )}
              {!tutor.isSchoolCertified &&
                !tutor.isBqCertified &&
                !tutor.isPlaygroupCertified &&
                tutor.certifications.length === 0 && (
                  <span className="text-sm text-neutral-400">No quick certifications</span>
                )}
            </div>

            {/* Detailed cert list */}
            {tutor.certifications.length > 0 && (
              <div className="space-y-2 mb-4">
                {tutor.certifications.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-100 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {certTypeLabels[cert.type]}
                      </p>
                      {cert.earnedAt && (
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {new Date(cert.earnedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {cert.status === "COMPLETED" ? (
                      <CheckCircleIcon className="h-5 w-5 text-success" />
                    ) : cert.status === "IN_PROGRESS" || cert.status === "PENDING" ? (
                      <ClockIcon className="h-5 w-5 text-warning" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-neutral-400" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add certification inline form */}
            {showAddCert && (
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                <p className="text-sm font-medium text-neutral-700 mb-3">
                  Add Certification
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">
                      Type
                    </label>
                    <select
                      value={newCertType}
                      onChange={(e) =>
                        setNewCertType(e.target.value as TutorCertType)
                      }
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select Type</option>
                      {(Object.keys(certTypeLabels) as TutorCertType[]).map(
                        (key) => (
                          <option key={key} value={key}>
                            {certTypeLabels[key]}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">
                      Status
                    </label>
                    <select
                      value={newCertStatus}
                      onChange={(e) =>
                        setNewCertStatus(e.target.value as TutorCertStatus)
                      }
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {certStatusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => {
                        setShowAddCert(false);
                        setNewCertType("");
                        setNewCertStatus("COMPLETED");
                      }}
                      className="px-3 py-1.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddCert}
                      disabled={addCertPending || !newCertType}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {addCertPending ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        <PlusIcon className="h-4 w-4" />
                      )}
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Labels Card ── */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
          <div className="p-4 pb-0 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
              <TagIcon className="h-5 w-5 text-neutral-500" />
              Labels
            </h3>
            {!showAddLabel && (
              <button
                onClick={() => setShowAddLabel(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                Add
              </button>
            )}
          </div>
          <div className="p-4">
            {/* Existing labels */}
            {tutor.labels.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {tutor.labels.map((label) => (
                  <span
                    key={label.id}
                    className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: label.color
                        ? `${label.color}20`
                        : "#e5e5e5",
                      color: label.color || "#666",
                    }}
                  >
                    {label.name}
                    <button
                      onClick={() => onRemoveLabel(label.id)}
                      disabled={removeLabelPending}
                      className="opacity-0 group-hover:opacity-100 ml-0.5 p-0.5 rounded-full hover:bg-black/10 transition-all"
                      aria-label={`Remove ${label.name} label`}
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : !showAddLabel ? (
              <div className="text-center py-6">
                <TagIcon className="h-10 w-10 mx-auto mb-2 text-neutral-200" />
                <p className="text-sm text-neutral-500">No labels assigned</p>
              </div>
            ) : null}

            {/* Add label inline form */}
            {showAddLabel && (
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                <p className="text-sm font-medium text-neutral-700 mb-3">
                  Add Label
                </p>
                <div className="space-y-3">
                  {/* Name input */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      placeholder="Label name"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  {/* Color picker */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">
                      Color
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        {LABEL_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setNewLabelColor(color)}
                            className={`h-6 w-6 rounded-full border-2 transition-transform ${
                              newLabelColor === color
                                ? "border-neutral-800 scale-110"
                                : "border-transparent hover:scale-105"
                            }`}
                            style={{ backgroundColor: color }}
                            aria-label={`Select color ${color}`}
                          />
                        ))}
                      </div>
                      <input
                        type="color"
                        value={newLabelColor}
                        onChange={(e) => setNewLabelColor(e.target.value)}
                        className="h-7 w-7 rounded cursor-pointer border-0 p-0"
                        title="Custom color"
                      />
                    </div>
                  </div>

                  {/* Preview pill */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">
                      Preview
                    </label>
                    <span
                      className="inline-flex px-3 py-1 rounded-lg text-sm font-medium"
                      style={{
                        backgroundColor: `${newLabelColor}20`,
                        color: newLabelColor,
                      }}
                    >
                      {newLabelName || "Preview"}
                    </span>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => {
                        setShowAddLabel(false);
                        setNewLabelName("");
                        setNewLabelColor("#6366f1");
                      }}
                      className="px-3 py-1.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddLabel}
                      disabled={addLabelPending || !newLabelName.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {addLabelPending ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        <PlusIcon className="h-4 w-4" />
                      )}
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
