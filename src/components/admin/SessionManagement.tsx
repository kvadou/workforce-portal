"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  CalendarDaysIcon,
  ClockIcon,
  UsersIcon,
  PlayCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import type { OrientationSession } from "@prisma/client";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface SessionWithParticipants extends OrientationSession {
  participantCount: number;
  participants: Array<{
    id: string;
    userName: string | null;
    userEmail: string;
  }>;
}

interface SessionManagementProps {
  upcomingSessions: SessionWithParticipants[];
  pastSessions: SessionWithParticipants[];
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function SessionManagement({
  upcomingSessions,
  pastSessions,
}: SessionManagementProps) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSession, setEditingSession] =
    useState<SessionWithParticipants | null>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduledAt: "",
    scheduledTime: "",
    duration: "90",
    zoomLink: "",
    hostName: "",
    maxParticipants: "20",
  });

  const resetForm = useCallback(() => {
    setFormData({
      title: "",
      description: "",
      scheduledAt: "",
      scheduledTime: "",
      duration: "90",
      zoomLink: "",
      hostName: "",
      maxParticipants: "20",
    });
    setEditingSession(null);
  }, []);

  const handleCreate = useCallback(async () => {
    setIsLoading(true);
    try {
      const scheduledAt = new Date(
        `${formData.scheduledAt}T${formData.scheduledTime}`
      );

      const response = await fetch("/api/admin/onboarding/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          scheduledAt: scheduledAt.toISOString(),
          duration: parseInt(formData.duration),
          maxParticipants: parseInt(formData.maxParticipants),
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        resetForm();
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to create session:", error);
    } finally {
      setIsLoading(false);
    }
  }, [formData, router, resetForm]);

  const handleUpdate = useCallback(async () => {
    if (!editingSession) return;
    setIsLoading(true);
    try {
      const scheduledAt = new Date(
        `${formData.scheduledAt}T${formData.scheduledTime}`
      );

      const response = await fetch("/api/admin/onboarding/sessions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingSession.id,
          ...formData,
          scheduledAt: scheduledAt.toISOString(),
          duration: parseInt(formData.duration),
          maxParticipants: parseInt(formData.maxParticipants),
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        resetForm();
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update session:", error);
    } finally {
      setIsLoading(false);
    }
  }, [editingSession, formData, router, resetForm]);

  const handleDelete = useCallback(
    async (sessionId: string) => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/admin/onboarding/sessions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: sessionId }),
        });

        if (response.ok) {
          router.refresh();
        }
      } catch (error) {
        console.error("Failed to delete session:", error);
      } finally {
        setIsLoading(false);
        setDeleteSessionId(null);
      }
    },
    [router]
  );

  const openEditModal = useCallback(
    (session: SessionWithParticipants) => {
      const date = new Date(session.scheduledAt);
      setFormData({
        title: session.title,
        description: session.description || "",
        scheduledAt: date.toISOString().split("T")[0],
        scheduledTime: date.toTimeString().slice(0, 5),
        duration: session.duration.toString(),
        zoomLink: session.zoomLink || "",
        hostName: session.hostName || "",
        maxParticipants: session.maxParticipants.toString(),
      });
      setEditingSession(session);
      setShowCreateModal(true);
    },
    []
  );

  return (
    <div>
      {/* Create Button */}
      <button
        onClick={() => {
          resetForm();
          setShowCreateModal(true);
        }}
        className="mb-6 flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        <PlusIcon className="h-4 w-4" />
        Create Session
      </button>

      {/* Upcoming Sessions */}
      <div className="mb-8">
        <h2 className="text-heading-md text-neutral-900 mb-4">
          Upcoming Sessions ({upcomingSessions.length})
        </h2>

        {upcomingSessions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <CalendarDaysIcon className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-600">No upcoming sessions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingSessions.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-heading-sm text-neutral-900">
                        {session.title}
                      </h3>
                      <div className="flex flex-wrap gap-4 mt-2">
                        <div className="flex items-center gap-2 text-neutral-600">
                          <CalendarDaysIcon className="h-4 w-4" />
                          <span className="text-body-sm">
                            {formatDate(session.scheduledAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-600">
                          <ClockIcon className="h-4 w-4" />
                          <span className="text-body-sm">
                            {formatTime(session.scheduledAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-600">
                          <UsersIcon className="h-4 w-4" />
                          <span className="text-body-sm">
                            {session.participantCount}/{session.maxParticipants}
                          </span>
                        </div>
                        {session.zoomLink && (
                          <div className="flex items-center gap-2 text-primary-600">
                            <PlayCircleIcon className="h-4 w-4" />
                            <a
                              href={session.zoomLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-body-sm hover:text-primary-700"
                            >
                              Zoom Link
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setExpandedSession(
                            expandedSession === session.id ? null : session.id
                          )
                        }
                        className="p-2 text-neutral-400 hover:text-neutral-600"
                      >
                        {expandedSession === session.id ? (
                          <ChevronUpIcon className="h-4 w-4" />
                        ) : (
                          <ChevronDownIcon className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => openEditModal(session)}
                        className="p-2 text-neutral-400 hover:text-neutral-600"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteSessionId(session.id)}
                        className="p-2 text-neutral-400 hover:text-error"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Participants */}
                {expandedSession === session.id && (
                  <div className="border-t border-neutral-200 p-4 bg-neutral-50">
                    <h4 className="text-body-sm font-medium text-neutral-700 mb-3">
                      Registered Participants ({session.participantCount})
                    </h4>
                    {session.participants.length === 0 ? (
                      <p className="text-body-sm text-neutral-500">
                        No registrations yet
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {session.participants.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between text-body-sm"
                          >
                            <span className="text-neutral-900">
                              {p.userName || "Unnamed"}
                            </span>
                            <span className="text-neutral-500">
                              {p.userEmail}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Sessions */}
      <div>
        <h2 className="text-heading-md text-neutral-900 mb-4">
          Past Sessions ({pastSessions.length})
        </h2>

        {pastSessions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <CalendarDaysIcon className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-600">No past sessions</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pastSessions.slice(0, 10).map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between opacity-75"
              >
                <div>
                  <h3 className="text-body-md font-medium text-neutral-900">
                    {session.title}
                  </h3>
                  <p className="text-body-sm text-neutral-500">
                    {formatDate(session.scheduledAt)} •{" "}
                    {session.participantCount} attended
                  </p>
                </div>
                {!session.isActive && (
                  <span className="text-body-xs text-neutral-400">
                    Cancelled
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteSessionId !== null}
        onClose={() => setDeleteSessionId(null)}
        onConfirm={() => deleteSessionId && handleDelete(deleteSessionId)}
        title="Delete Session"
        message="Are you sure you want to delete this session?"
        variant="danger"
        confirmLabel="Delete"
      />

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-heading-md text-neutral-900">
                {editingSession ? "Edit Session" : "Create Session"}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="p-2 text-neutral-400 hover:text-neutral-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-body-sm font-medium text-neutral-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  placeholder="Orientation Debrief"
                />
              </div>

              <div>
                <label className="block text-body-sm font-medium text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  placeholder="Session description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-sm font-medium text-neutral-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.scheduledAt}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        scheduledAt: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-neutral-700 mb-1">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        scheduledTime: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-sm font-medium text-neutral-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        duration: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-neutral-700 mb-1">
                    Max Participants
                  </label>
                  <input
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        maxParticipants: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-body-sm font-medium text-neutral-700 mb-1">
                  Zoom Link
                </label>
                <input
                  type="url"
                  value={formData.zoomLink}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      zoomLink: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  placeholder="https://zoom.us/j/..."
                />
              </div>

              <div>
                <label className="block text-body-sm font-medium text-neutral-700 mb-1">
                  Host Name
                </label>
                <input
                  type="text"
                  value={formData.hostName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      hostName: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  placeholder="Jessica Smith"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-body-sm text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>
              <button
                onClick={editingSession ? handleUpdate : handleCreate}
                disabled={
                  isLoading ||
                  !formData.title ||
                  !formData.scheduledAt ||
                  !formData.scheduledTime
                }
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-body-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {isLoading
                  ? "Saving..."
                  : editingSession
                  ? "Update Session"
                  : "Create Session"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
