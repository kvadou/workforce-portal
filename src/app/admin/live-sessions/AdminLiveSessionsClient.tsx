"use client";

import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ClockIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  StarIcon,
  TrashIcon,
  UsersIcon,
  VideoCameraIcon,
  WrenchIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  useAdminLiveSessions,
  useCreateLiveSession,
  useUpdateLiveSession,
  useDeleteLiveSession,
  type LiveSession,
} from "@/hooks/useLiveSessions";
import type { LiveSessionCategory } from "@prisma/client";

const CATEGORY_OPTIONS: {
  value: LiveSessionCategory;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "TRAINING", label: "Training", icon: <BookOpenIcon className="h-4 w-4" /> },
  { value: "Q_AND_A", label: "Q&A", icon: <QuestionMarkCircleIcon className="h-4 w-4" /> },
  { value: "WORKSHOP", label: "Workshop", icon: <WrenchIcon className="h-4 w-4" /> },
  { value: "OFFICE_HOURS", label: "Office Hours", icon: <CubeIcon className="h-4 w-4" /> },
  { value: "SPECIAL_EVENT", label: "Special Event", icon: <StarIcon className="h-4 w-4" /> },
];

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function toLocalDateTimeValue(dateString: string): string {
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

interface SessionFormData {
  title: string;
  description: string;
  scheduledAt: string;
  duration: number;
  maxParticipants: number;
  category: LiveSessionCategory;
  hostName: string;
  createZoomMeeting: boolean;
}

const initialFormData: SessionFormData = {
  title: "",
  description: "",
  scheduledAt: "",
  duration: 60,
  maxParticipants: 100,
  category: "TRAINING",
  hostName: "",
  createZoomMeeting: true,
};

export default function AdminLiveSessionsClient() {
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState<LiveSession | null>(null);
  const [formData, setFormData] = useState<SessionFormData>(initialFormData);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('columnWidths_liveSessions');
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
        localStorage.setItem('columnWidths_liveSessions', JSON.stringify(updated));
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

  const { data, isLoading, error } = useAdminLiveSessions({ includePast: showPast });
  const createSession = useCreateLiveSession();
  const updateSession = useUpdateLiveSession();
  const deleteSession = useDeleteLiveSession();

  const sessions = data?.sessions ?? [];
  const upcomingSessions = sessions.filter(
    (s) => new Date(s.scheduledAt) >= new Date()
  );
  const pastSessions = sessions.filter(
    (s) => new Date(s.scheduledAt) < new Date()
  );

  const openCreateModal = () => {
    setEditingSession(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const openEditModal = (session: LiveSession) => {
    setEditingSession(session);
    setFormData({
      title: session.title,
      description: session.description || "",
      scheduledAt: toLocalDateTimeValue(session.scheduledAt),
      duration: session.duration,
      maxParticipants: session.maxParticipants,
      category: session.category,
      hostName: session.hostName,
      createZoomMeeting: false,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSession(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSession) {
        await updateSession.mutateAsync({
          id: editingSession.id,
          data: {
            title: formData.title,
            description: formData.description,
            scheduledAt: new Date(formData.scheduledAt).toISOString(),
            duration: formData.duration,
            maxParticipants: formData.maxParticipants,
            category: formData.category,
            hostName: formData.hostName,
          },
        });
      } else {
        await createSession.mutateAsync({
          title: formData.title,
          description: formData.description || undefined,
          scheduledAt: new Date(formData.scheduledAt).toISOString(),
          duration: formData.duration,
          maxParticipants: formData.maxParticipants,
          category: formData.category,
          hostName: formData.hostName || undefined,
          createZoomMeeting: formData.createZoomMeeting,
        });
      }
      closeModal();
    } catch (error) {
      console.error("Failed to save session:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSession.mutateAsync(id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  const isSubmitting =
    createSession.isPending || updateSession.isPending || deleteSession.isPending;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 mb-4"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Back to Admin
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                Live Sessions
              </h1>
              <p className="text-neutral-600">
                Schedule and manage live training sessions, Q&As, and workshops.
              </p>
            </div>
            <Button
              onClick={openCreateModal}
              size="sm"
            >
              <PlusIcon className="h-5 w-5" />
              New Session
            </Button>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showPast}
              onChange={(e) => setShowPast(e.target.checked)}
              className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            Show past sessions
          </label>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-error-light border border-error rounded-lg p-6 text-center">
            <p className="text-error-dark">Failed to load sessions</p>
          </div>
        )}

        {/* Sessions Table */}
        {!isLoading && !error && (
          <>
            {/* Upcoming */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Upcoming Sessions ({upcomingSessions.length})
              </h2>
              {upcomingSessions.length > 0 ? (
                <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm table-fixed min-w-[640px]">
                      <thead>
                        <tr className="border-t border-b border-neutral-200 bg-neutral-50/50">
                          {[
                            { key: 'session', label: 'Session', width: 260, align: 'text-left' },
                            { key: 'dateTime', label: 'Date & Time', width: 180, align: 'text-left' },
                            { key: 'registrations', label: 'Registrations', width: 140, align: 'text-left' },
                            { key: 'zoom', label: 'Zoom', width: 100, align: 'text-left' },
                            { key: 'actions', label: 'Actions', width: 100, align: 'text-right' },
                          ].map((col) => (
                            <th
                              key={col.key}
                              className={`relative py-2.5 px-3 text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap select-none ${col.align}`}
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
                        {upcomingSessions.map((session) => (
                          <tr key={session.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                            <td className="px-3 py-2.5 text-sm text-neutral-700">
                              <div className="flex items-start gap-3">
                                <div
                                  className={`p-2 rounded-lg flex-shrink-0 ${
                                    CATEGORY_OPTIONS.find(
                                      (c) => c.value === session.category
                                    )
                                      ? "bg-primary-100 text-primary-600"
                                      : "bg-neutral-100 text-neutral-600"
                                  }`}
                                >
                                  {CATEGORY_OPTIONS.find(
                                    (c) => c.value === session.category
                                  )?.icon || <VideoCameraIcon className="h-4 w-4" />}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-medium text-neutral-900 truncate">
                                    {session.title}
                                  </div>
                                  <div className="text-sm text-neutral-500 truncate">
                                    {CATEGORY_OPTIONS.find(
                                      (c) => c.value === session.category
                                    )?.label || session.category}{" "}
                                    &middot; {session.duration} min &middot; {session.hostName}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-sm text-neutral-700">
                              {formatDateTime(session.scheduledAt)}
                            </td>
                            <td className="px-3 py-2.5 text-sm text-neutral-700">
                              <div className="flex items-center gap-2">
                                <UsersIcon className="h-4 w-4 text-neutral-400" />
                                <span>
                                  {session.participantCount} /{" "}
                                  {session.maxParticipants}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-sm text-neutral-700">
                              {session.zoomStartUrl ? (
                                <a
                                  href={session.zoomStartUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sm text-info hover:text-info-dark"
                                >
                                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                                  Start
                                </a>
                              ) : (
                                <span className="text-sm text-neutral-400">
                                  No Zoom
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-sm text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openEditModal(session)}
                                  className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                >
                                  <PencilSquareIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(session.id)}
                                  className="p-2 text-neutral-500 hover:text-error hover:bg-error-light rounded-lg transition-colors"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
                  <VideoCameraIcon className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-600">No upcoming sessions scheduled</p>
                </div>
              )}
            </div>

            {/* Past */}
            {showPast && pastSessions.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                  Past Sessions ({pastSessions.length})
                </h2>
                <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden opacity-75">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm table-fixed min-w-[480px]">
                      <thead>
                        <tr className="border-t border-b border-neutral-200 bg-neutral-50/50">
                          {[
                            { key: 'pastSession', label: 'Session', width: 280, align: 'text-left' },
                            { key: 'pastDateTime', label: 'Date & Time', width: 180, align: 'text-left' },
                            { key: 'pastAttendance', label: 'Attendance', width: 140, align: 'text-left' },
                          ].map((col) => (
                            <th
                              key={col.key}
                              className={`relative py-2.5 px-3 text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap select-none ${col.align}`}
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
                        {pastSessions.map((session) => (
                          <tr key={session.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                            <td className="px-3 py-2.5 text-sm text-neutral-700">
                              <div className="font-medium text-neutral-700">
                                {session.title}
                              </div>
                              <div className="text-sm text-neutral-500">
                                {session.category} &middot; {session.hostName}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-sm text-neutral-700">
                              {formatDateTime(session.scheduledAt)}
                            </td>
                            <td className="px-3 py-2.5 text-sm text-neutral-700">
                              {session.participantCount} attended
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-modal max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
                <h2 className="text-lg font-semibold text-neutral-900">
                  {editingSession ? "Edit Session" : "New Session"}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Teaching 3-4 Year Olds"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="What will be covered in this session?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as LiveSessionCategory,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.scheduledAt}
                      onChange={(e) =>
                        setFormData({ ...formData, scheduledAt: e.target.value })
                      }
                      required
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Duration (min)
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration: parseInt(e.target.value) || 60,
                        })
                      }
                      min={15}
                      max={480}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Max Participants
                    </label>
                    <input
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxParticipants: parseInt(e.target.value) || 100,
                        })
                      }
                      min={1}
                      max={1000}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Host Name
                    </label>
                    <input
                      type="text"
                      value={formData.hostName}
                      onChange={(e) =>
                        setFormData({ ...formData, hostName: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Leave blank to use your name"
                    />
                  </div>
                </div>

                {!editingSession && (
                  <div>
                    <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.createZoomMeeting}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            createZoomMeeting: e.target.checked,
                          })
                        }
                        className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                      Create Zoom meeting automatically
                    </label>
                    <p className="text-xs text-neutral-500 mt-1 ml-6">
                      Requires Zoom API configuration
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : editingSession ? (
                      "Save Changes"
                    ) : (
                      "Create Session"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-modal max-w-md w-full p-6">
              <div className="flex items-center gap-3 text-error mb-4">
                <ExclamationTriangleIcon className="h-6 w-6" />
                <h3 className="text-lg font-semibold">Delete Session</h3>
              </div>
              <p className="text-neutral-600 mb-6">
                Are you sure you want to delete this session? This will also
                remove all registrations and attendance records. This action
                cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={deleteSession.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-error rounded-lg hover:bg-error-dark transition-colors disabled:opacity-50"
                >
                  {deleteSession.isPending ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
