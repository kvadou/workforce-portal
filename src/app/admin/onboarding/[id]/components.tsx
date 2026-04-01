"use client";

import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { useState, useCallback } from "react";

// ──────────────── StatusBadge ────────────────

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    COMPLETED: "bg-success-light text-success-dark",
    ACTIVATED: "bg-success-light text-success-dark",
    RETURNED: "bg-error-light text-error-dark",
    QUIZ_FAILED: "bg-error-light text-error-dark",
    PENDING: "bg-neutral-100 text-neutral-600",
  };
  const labels: Record<string, string> = {
    PENDING: "Pending",
    WELCOME: "Welcome",
    VIDEOS_IN_PROGRESS: "Watching Videos",
    QUIZ_PENDING: "Quiz Pending",
    QUIZ_FAILED: "Quiz Failed",
    PROFILE_PENDING: "Profile Pending",
    W9_PENDING: "W-9 Pending",
    AWAITING_ORIENTATION: "Awaiting Orientation",
    ORIENTATION_SCHEDULED: "Orientation Scheduled",
    POST_ORIENTATION_TRAINING: "Training",
    SHADOW_LESSONS: "Shadow Lessons",
    COMPLETED: "Completed",
    ACTIVATED: "Activated",
    RETURNED: "Returned",
  };

  return (
    <span
      className={`px-3 py-1 rounded-lg text-body-sm font-medium ${
        colors[status] || "bg-info-light text-info-dark"
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

// ──────────────── ChecklistItem ────────────────

export function ChecklistItem({
  label,
  field,
  checked,
  timestamp,
  onToggle,
  isPending,
}: {
  label: string;
  field: string;
  checked: boolean;
  timestamp: string | null;
  progressId?: string;
  onToggle: (field: string, value: boolean) => void;
  isPending: boolean;
}) {
  return (
    <label className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-neutral-50 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(field, !checked)}
        disabled={isPending}
        className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
      />
      <span className="flex-1 text-body-sm text-neutral-800">{label}</span>
      {timestamp && (
        <span className="text-body-xs text-neutral-400">
          {new Date(timestamp).toLocaleDateString()}
        </span>
      )}
    </label>
  );
}

// ──────────────── NoteField ────────────────

export function NoteField({
  label,
  field,
  value,
  onSave,
  multiline = true,
}: {
  label: string;
  field: string;
  value: string | null;
  onSave: (field: string, value: string) => void;
  multiline?: boolean;
}) {
  const [localValue, setLocalValue] = useState(value || "");

  const handleChange = useCallback(
    (val: string) => {
      setLocalValue(val);
      onSave(field, val);
    },
    [field, onSave]
  );

  if (multiline) {
    return (
      <div>
        <label className="block text-body-sm font-medium text-neutral-700 mb-1">
          {label}
        </label>
        <textarea
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-body-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
          placeholder={`Enter ${label.toLowerCase()}...`}
        />
      </div>
    );
  }

  return (
    <div>
      <label className="block text-body-sm font-medium text-neutral-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-body-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        placeholder={`Enter ${label.toLowerCase()}...`}
      />
    </div>
  );
}

// ──────────────── SelfServiceStep ────────────────

export function SelfServiceStep({
  label,
  icon: Icon,
  completed,
  completedAt,
  detail,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: boolean;
  completedAt: string | null;
  detail?: string;
}) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-neutral-50">
      <div
        className={`h-10 w-10 rounded-lg flex items-center justify-center ${
          completed ? "bg-success-light" : "bg-neutral-100"
        }`}
      >
        {completed ? (
          <CheckCircleIcon className="h-5 w-5 text-success" />
        ) : (
          <Icon className="h-5 w-5 text-neutral-400" />
        )}
      </div>
      <div className="flex-1">
        <p className="text-body-md font-medium text-neutral-900">{label}</p>
        {detail && (
          <p className="text-body-sm text-neutral-500">{detail}</p>
        )}
      </div>
      {completedAt && (
        <span className="text-body-xs text-neutral-500">
          {new Date(completedAt).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
