"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  XMarkIcon,
  UsersIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { useCreateCohort } from "@/hooks/useCohorts";
import type { CohortStatus } from "@prisma/client";

interface CreateCohortModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface OrientationSessionOption {
  id: string;
  title: string;
  scheduledAt: string;
  duration: number | null;
}

const STATUS_OPTIONS: { value: CohortStatus; label: string }[] = [
  { value: "UPCOMING", label: "Upcoming" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
];

export function CreateCohortModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateCohortModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    status: "UPCOMING" as CohortStatus,
    orientationSessionId: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);

  const createCohort = useCreateCohort();

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery<{
    sessions: OrientationSessionOption[];
  }>({
    queryKey: ["orientationSessions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/cohorts/sessions");
      if (!res.ok) throw new Error("Failed to fetch sessions");
      return res.json();
    },
    enabled: isOpen,
  });

  if (!isOpen) return null;

  const sessions = sessionsData?.sessions ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Cohort name is required");
      return;
    }

    if (!formData.orientationSessionId) {
      setError("Please select an orientation session");
      return;
    }

    try {
      await createCohort.mutateAsync({
        name: formData.name.trim(),
        status: formData.status,
        orientationSessionId: formData.orientationSessionId,
        description: formData.description.trim() || undefined,
      });

      // Reset form
      setFormData({
        name: "",
        status: "UPCOMING",
        orientationSessionId: "",
        description: "",
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create cohort");
    }
  };

  const formatSessionDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-modal w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <UsersIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-heading-md text-neutral-900">
                  Create Cohort
                </h2>
                <p className="text-body-sm text-neutral-500">
                  Set up a new hiring cohort
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-neutral-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {error && (
              <div className="p-3 bg-error-light border border-error rounded-lg text-error-dark text-body-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-body-sm font-medium text-neutral-700 mb-1">
                Cohort Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., Spring 2026 Cohort"
                required
              />
            </div>

            <div>
              <label className="block text-body-sm font-medium text-neutral-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as CohortStatus,
                  })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-body-sm font-medium text-neutral-700 mb-1">
                Orientation Session *
              </label>
              {sessionsLoading ? (
                <div className="flex items-center gap-2 px-3 py-2 text-body-sm text-neutral-500">
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Loading sessions...
                </div>
              ) : sessions.length === 0 ? (
                <div className="flex items-center gap-2 px-3 py-2 text-body-sm text-neutral-500">
                  <CalendarDaysIcon className="h-4 w-4" />
                  No active orientation sessions found
                </div>
              ) : (
                <select
                  value={formData.orientationSessionId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      orientationSessionId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Select a session...</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} — {formatSessionDate(s.scheduledAt)}
                      {s.duration ? ` (${s.duration}min)` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-body-sm font-medium text-neutral-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                placeholder="Optional notes about this cohort..."
                rows={3}
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-body-sm text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                disabled={createCohort.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createCohort.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-body-sm font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {createCohort.isPending ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UsersIcon className="h-4 w-4" />
                    Create Cohort
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
