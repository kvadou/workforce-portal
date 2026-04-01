"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircleIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import type { OnboardingStatus } from "@prisma/client";

interface TrainingSession {
  sessionNumber: number;
  completedAt: string;
  notes?: string;
}

interface ShadowLesson {
  lessonNumber: number;
  completedAt: string;
  verifiedBy?: string;
  notes?: string;
}

interface OnboardingAdminActionsProps {
  progressId: string;
  userId: string;
  currentStatus: OnboardingStatus;
  orientationSessionId: string | null;
  trainingSessions: TrainingSession[];
  shadowLessons: ShadowLesson[];
}

const ACTION_SUCCESS_MESSAGES: Record<string, string> = {
  resetWelcome: "User reset to welcome video",
  markOrientationAttended: "Orientation marked as attended",
  completeTraining: "Training session marked complete",
  completeShadow: "Shadow lesson verified",
  activate: "User activated successfully",
  return: "Returned for corrections",
  updateNotes: "Notes saved",
};

export function OnboardingAdminActions({
  progressId,
  userId,
  currentStatus,
  orientationSessionId,
  trainingSessions,
  shadowLessons,
}: OnboardingAdminActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAction = useCallback(
    async (action: string, data?: Record<string, unknown>) => {
      setIsLoading(true);
      setSuccessMessage(null);
      try {
        const response = await fetch("/api/admin/onboarding/actions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ progressId, userId, action, ...data }),
        });

        const result = await response.json();

        if (result.success) {
          // Show success message
          const message = ACTION_SUCCESS_MESSAGES[action] || "Action completed";
          setSuccessMessage(message);
          setTimeout(() => setSuccessMessage(null), 3000);
          router.refresh();
        } else {
          toast.error(result.error || "Action failed");
        }
      } catch (error) {
        console.error("Action failed:", error);
        toast.error("An error occurred");
      } finally {
        setIsLoading(false);
      }
    },
    [progressId, userId, router]
  );

  const handleReturn = useCallback(() => {
    if (!returnReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    handleAction("return", { returnReason: returnReason.trim() });
    setShowReturnModal(false);
    setReturnReason("");
  }, [returnReason, handleAction]);

  const handleMarkTrainingComplete = useCallback(
    (sessionNumber: number) => {
      handleAction("completeTraining", { sessionNumber });
    },
    [handleAction]
  );

  const handleMarkShadowComplete = useCallback(
    (lessonNumber: number) => {
      handleAction("completeShadow", { lessonNumber });
    },
    [handleAction]
  );

  const handleDelete = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/onboarding/candidates?userId=${userId}`,
        { method: "DELETE" }
      );
      const result = await response.json();
      if (response.ok) {
        router.push("/admin/onboarding");
      } else {
        toast.error(result.error || "Failed to delete candidate");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
    }
  }, [userId, router]);

  const canMarkOrientationAttended =
    orientationSessionId && currentStatus === "ORIENTATION_SCHEDULED";

  const canActivate =
    currentStatus === "COMPLETED" ||
    (trainingSessions.length >= 3 && shadowLessons.length >= 3);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-heading-sm text-neutral-900 mb-4">Admin Actions</h2>

      {/* Success Toast */}
      {successMessage && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-success-light border border-success text-success-dark animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircleIcon className="h-5 w-5 text-success flex-shrink-0" />
          <span className="text-body-sm font-medium">{successMessage}</span>
        </div>
      )}

      <div className="space-y-3">
        {/* Mark Orientation Attended */}
        {canMarkOrientationAttended && (
          <button
            onClick={() => handleAction("markOrientationAttended")}
            disabled={isLoading}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-primary-200 bg-primary-50 hover:bg-primary-100 transition-colors disabled:opacity-50"
          >
            <CalendarDaysIcon className="h-5 w-5 text-primary-600" />
            <span className="text-body-sm font-medium text-primary-700">
              Mark Orientation Attended
            </span>
          </button>
        )}

        {/* Training Sessions */}
        {currentStatus === "POST_ORIENTATION_TRAINING" ||
        currentStatus === "SHADOW_LESSONS" ? (
          <div className="border border-neutral-200 rounded-lg p-3">
            <h3 className="text-body-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
              <AcademicCapIcon className="h-4 w-4" />
              Training Sessions
            </h3>
            <div className="space-y-2">
              {[1, 2, 3].map((num) => {
                const isComplete = trainingSessions.some(
                  (t) => t.sessionNumber === num
                );
                return (
                  <div
                    key={num}
                    className="flex items-center justify-between text-body-sm"
                  >
                    <span className="text-neutral-600">Session {num}</span>
                    {isComplete ? (
                      <CheckCircleIcon className="h-4 w-4 text-success" />
                    ) : (
                      <button
                        onClick={() => handleMarkTrainingComplete(num)}
                        disabled={isLoading}
                        className="text-primary-600 hover:text-primary-700 text-body-xs font-medium"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Shadow Lessons */}
        {currentStatus === "SHADOW_LESSONS" ||
        (currentStatus === "POST_ORIENTATION_TRAINING" &&
          trainingSessions.length >= 3) ? (
          <div className="border border-neutral-200 rounded-lg p-3">
            <h3 className="text-body-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              Shadow Lessons
            </h3>
            <div className="space-y-2">
              {[1, 2, 3].map((num) => {
                const isComplete = shadowLessons.some(
                  (s) => s.lessonNumber === num
                );
                return (
                  <div
                    key={num}
                    className="flex items-center justify-between text-body-sm"
                  >
                    <span className="text-neutral-600">Lesson {num}</span>
                    {isComplete ? (
                      <CheckCircleIcon className="h-4 w-4 text-success" />
                    ) : (
                      <button
                        onClick={() => handleMarkShadowComplete(num)}
                        disabled={isLoading}
                        className="text-primary-600 hover:text-primary-700 text-body-xs font-medium"
                      >
                        Verify
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Activate User */}
        {canActivate && currentStatus !== "ACTIVATED" && (
          <button
            onClick={() => handleAction("activate")}
            disabled={isLoading}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-success hover:bg-success-dark transition-colors disabled:opacity-50"
          >
            <CheckBadgeIcon className="h-5 w-5 text-white" />
            <span className="text-body-sm font-medium text-white">
              Activate User
            </span>
          </button>
        )}

        {/* Reset to Welcome Video */}
        {currentStatus !== "PENDING" && currentStatus !== "ACTIVATED" && (
          <button
            onClick={() => handleAction("resetWelcome")}
            disabled={isLoading}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-info bg-info-light hover:bg-info-light transition-colors disabled:opacity-50"
          >
            <PlayIcon className="h-5 w-5 text-info" />
            <span className="text-body-sm font-medium text-info-dark">
              Reset to Welcome Video
            </span>
          </button>
        )}

        {/* Return for Corrections */}
        {currentStatus !== "ACTIVATED" && currentStatus !== "RETURNED" && (
          <button
            onClick={() => setShowReturnModal(true)}
            disabled={isLoading}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-error bg-error-light hover:bg-error-light transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className="h-5 w-5 text-error" />
            <span className="text-body-sm font-medium text-error-dark">
              Return for Corrections
            </span>
          </button>
        )}

        {/* Delete from Pipeline */}
        {currentStatus !== "ACTIVATED" && (
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={isLoading}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-neutral-300 bg-neutral-50 hover:bg-neutral-100 transition-colors disabled:opacity-50"
          >
            <TrashIcon className="h-5 w-5 text-neutral-600" />
            <span className="text-body-sm font-medium text-neutral-700">
              Delete from Pipeline
            </span>
          </button>
        )}

        {/* Admin Notes */}
        <div className="border-t border-neutral-200 pt-3 mt-3">
          <label className="block text-body-sm font-medium text-neutral-700 mb-2">
            Admin Notes
          </label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-body-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
            placeholder="Add notes about this user..."
          />
          <button
            onClick={() => handleAction("updateNotes", { adminNotes })}
            disabled={isLoading || !adminNotes.trim()}
            className="mt-2 text-body-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
          >
            Save Notes
          </button>
        </div>
      </div>

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-warning" />
              <h3 className="text-heading-md text-neutral-900">
                Return for Corrections
              </h3>
            </div>
            <p className="text-body-sm text-neutral-600 mb-4">
              The user will be notified to correct issues before continuing.
            </p>
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-body-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
              placeholder="Explain what needs to be corrected..."
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2 text-body-sm text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>
              <button
                onClick={handleReturn}
                disabled={isLoading || !returnReason.trim()}
                className="px-4 py-2 bg-error text-white rounded-lg text-body-sm font-medium hover:bg-error-dark disabled:opacity-50"
              >
                Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <TrashIcon className="h-6 w-6 text-error" />
              <h3 className="text-heading-md text-neutral-900">
                Delete from Pipeline
              </h3>
            </div>
            <p className="text-body-sm text-neutral-600 mb-4">
              This will permanently delete the user and their onboarding progress.
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-body-sm text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="px-4 py-2 bg-error text-white rounded-lg text-body-sm font-medium hover:bg-error-dark disabled:opacity-50"
              >
                {isLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
