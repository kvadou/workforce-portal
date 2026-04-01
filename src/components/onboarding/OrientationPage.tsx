"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  UsersIcon,
  PlayCircleIcon,
  CheckCircleIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import type { OnboardingProgress, OrientationSession } from "@prisma/client";

interface SessionWithAvailability extends OrientationSession {
  participantCount: number;
  spotsAvailable: number;
}

interface OrientationPageProps {
  progress: OnboardingProgress;
  registeredSession: OrientationSession | null;
  availableSessions: SessionWithAvailability[];
  progressId: string;
  hasAttended: boolean;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function OrientationPage({
  registeredSession: initialRegisteredSession,
  availableSessions,
  progressId,
  hasAttended,
}: OrientationPageProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [registeredSession, setRegisteredSession] = useState(
    initialRegisteredSession
  );
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState(availableSessions);

  const handleRegister = useCallback(
    async (sessionId: string) => {
      setIsRegistering(true);
      setError(null);

      try {
        const response = await fetch("/api/onboarding/orientation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, progressId }),
        });

        const data = await response.json();

        if (data.success) {
          setRegisteredSession(data.session);
          // Update available spots
          setSessions((prev) =>
            prev.map((s) =>
              s.id === sessionId
                ? { ...s, spotsAvailable: s.spotsAvailable - 1 }
                : s
            )
          );
        } else {
          setError(data.error || "Failed to register. Please try again.");
        }
      } catch (err) {
        console.error("Failed to register:", err);
        setError("An error occurred. Please try again.");
      } finally {
        setIsRegistering(false);
      }
    },
    [progressId]
  );

  const handleCancel = useCallback(async () => {
    if (!registeredSession) return;

    setIsRegistering(true);
    setError(null);

    try {
      const response = await fetch("/api/onboarding/orientation", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progressId }),
      });

      const data = await response.json();

      if (data.success) {
        // Update available spots
        setSessions((prev) =>
          prev.map((s) =>
            s.id === registeredSession.id
              ? { ...s, spotsAvailable: s.spotsAvailable + 1 }
              : s
          )
        );
        setRegisteredSession(null);
      } else {
        setError(data.error || "Failed to cancel. Please try again.");
      }
    } catch (err) {
      console.error("Failed to cancel:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  }, [registeredSession, progressId]);

  // If already attended, show completion message
  if (hasAttended) {
    return (
      <div className="p-6">
        <Link
          href="/onboarding"
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="text-body-sm">Back to Dashboard</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-success-light border border-success rounded-xl p-8 text-center">
              <div className="h-16 w-16 rounded-lg bg-success-light flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="h-8 w-8 text-success" />
              </div>

              <h1 className="text-heading-lg text-success-dark mb-2">
                Orientation Complete!
              </h1>

              <p className="text-body-md text-neutral-600 mb-6">
                You&apos;ve completed your orientation session. Continue to your training
                progress to see your next steps.
              </p>

              <Link
                href="/onboarding/status"
                className="inline-flex items-center gap-2 px-6 py-3 bg-success text-white rounded-lg hover:bg-success-dark transition-colors text-body-md font-medium"
              >
                View Progress
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-heading-sm text-neutral-900 mb-4">
                Status
              </h3>
              <div className="flex items-center gap-3 p-3 bg-success-light rounded-lg">
                <CheckCircleIcon className="h-5 w-5 text-success" />
                <span className="text-body-sm text-success-dark font-medium">
                  Orientation attended
                </span>
              </div>
            </div>

            <div className="bg-info-light border border-info rounded-xl p-4">
              <h4 className="text-body-md font-semibold text-info-dark mb-2">
                Next Steps
              </h4>
              <p className="text-body-sm text-info-dark">
                Check your progress page for training sessions and shadow lessons.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If registered for a session, show confirmation
  if (registeredSession) {
    return (
      <div className="p-6">
        <Link
          href="/onboarding"
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="text-body-sm">Back to Dashboard</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center">
                  <CalendarDaysIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h1 className="text-heading-lg text-primary-700">
                    You&apos;re Registered!
                  </h1>
                  <p className="text-body-sm text-neutral-600">
                    See you at the orientation session
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 mb-6">
                <h2 className="text-heading-md text-neutral-900 mb-4">
                  {registeredSession.title}
                </h2>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-neutral-600">
                    <CalendarDaysIcon className="h-5 w-5" />
                    <span>{formatDate(registeredSession.scheduledAt)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-neutral-600">
                    <ClockIcon className="h-5 w-5" />
                    <span>
                      {formatTime(registeredSession.scheduledAt)} ({registeredSession.duration} min)
                    </span>
                  </div>
                  {registeredSession.hostName && (
                    <div className="flex items-center gap-3 text-neutral-600">
                      <UsersIcon className="h-5 w-5" />
                      <span>Hosted by {registeredSession.hostName}</span>
                    </div>
                  )}
                  {registeredSession.zoomLink && (
                    <div className="flex items-start gap-3 text-neutral-600">
                      <PlayCircleIcon className="h-5 w-5 mt-0.5" />
                      <div>
                        <a
                          href={registeredSession.zoomLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 underline"
                        >
                          Join Zoom Meeting
                        </a>
                        <p className="text-body-xs text-neutral-500 mt-1">
                          Link will be active at the session time
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {registeredSession.description && (
                  <p className="text-body-sm text-neutral-600 mt-4 pt-4 border-t border-neutral-200">
                    {registeredSession.description}
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={handleCancel}
                  disabled={isRegistering}
                  className="text-error hover:text-error-dark text-body-sm font-medium disabled:opacity-50"
                >
                  Cancel Registration
                </button>
                <a
                  href={registeredSession.zoomLink || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg transition-colors ${
                    registeredSession.zoomLink
                      ? "hover:bg-primary-700"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <PlayCircleIcon className="h-4 w-4" />
                  Join Meeting
                </a>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-error-light border border-error rounded-lg">
                <p className="text-body-sm text-error-dark">{error}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-6 lg:sticky lg:top-6">
              <h3 className="text-heading-sm text-neutral-900 mb-4">
                Session Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
                  <span className="text-body-sm text-neutral-600">Duration</span>
                  <span className="text-body-md font-semibold text-neutral-900">
                    {registeredSession.duration} min
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
                  <span className="text-body-sm text-neutral-600">Format</span>
                  <span className="text-body-md font-semibold text-neutral-900">
                    Zoom
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-body-sm text-neutral-600">Status</span>
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-body-sm font-medium">
                    Registered
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-warning-light border border-warning rounded-xl p-4">
              <h4 className="text-body-md font-semibold text-warning-dark mb-2">
                What to Expect
              </h4>
              <ul className="text-body-sm text-warning-dark space-y-1">
                <li>• Meet & Greet with Admin Team</li>
                <li>• Quiz Show</li>
                <li>• Q&A Time</li>
                <li>• Next Steps overview</li>
              </ul>
            </div>

            <div className="bg-success-light border border-success rounded-xl p-4">
              <h4 className="text-body-md font-semibold text-success-dark mb-2">
                Payment Info
              </h4>
              <p className="text-body-sm text-success-dark">
                Orientation sessions are paid at <strong>$25/hour</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show available sessions
  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/onboarding"
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="text-body-sm">Back to Dashboard</span>
        </Link>
        <h1 className="text-heading-lg text-neutral-900">
          Orientation Sessions
        </h1>
        <p className="text-body-md text-neutral-600">
          Register for an upcoming orientation debrief session
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-error-light border border-error rounded-lg">
          <p className="text-body-sm text-error-dark">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Sessions List */}
          {sessions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <CalendarDaysIcon className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
              <h2 className="text-heading-md text-neutral-900 mb-2">
                No Sessions Available
              </h2>
              <p className="text-body-md text-neutral-600">
                There are currently no upcoming orientation sessions. Please check
                back later or contact admin for assistance.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => {
                const isFull = session.spotsAvailable <= 0;

                return (
                  <div
                    key={session.id}
                    className={`bg-white rounded-xl shadow-sm p-6 border-2 transition-all ${
                      isFull
                        ? "border-neutral-200 opacity-60"
                        : "border-transparent hover:border-primary-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h2 className="text-heading-md text-neutral-900 mb-3">
                          {session.title}
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
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
                          {session.hostName && (
                            <div className="flex items-center gap-2 text-neutral-600">
                              <UsersIcon className="h-4 w-4" />
                              <span className="text-body-sm">
                                {session.hostName}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-neutral-600">
                            <MapPinIcon className="h-4 w-4" />
                            <span className="text-body-sm">Zoom (Online)</span>
                          </div>
                        </div>

                        {session.description && (
                          <p className="text-body-sm text-neutral-500">
                            {session.description}
                          </p>
                        )}
                      </div>

                      <div className="text-right ml-4">
                        <p
                          className={`text-body-sm mb-2 ${
                            isFull ? "text-error" : "text-success"
                          }`}
                        >
                          {isFull
                            ? "Session Full"
                            : `${session.spotsAvailable} spots left`}
                        </p>
                        <button
                          onClick={() => handleRegister(session.id)}
                          disabled={isFull || isRegistering}
                          className={`px-4 py-2 rounded-lg text-body-sm font-medium transition-colors ${
                            isFull
                              ? "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                              : "bg-primary-600 text-white hover:bg-primary-700"
                          }`}
                        >
                          {isRegistering ? "Registering..." : "Register"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-6 lg:sticky lg:top-6">
            <h3 className="text-heading-sm text-neutral-900 mb-4">
              About Orientation
            </h3>
            <p className="text-body-sm text-neutral-600 mb-4">
              Orientation sessions are 90-minute live Zoom meetings where you&apos;ll
              meet the admin team and complete your onboarding.
            </p>
            <div className="space-y-3 pt-4 border-t border-neutral-200">
              <div className="flex justify-between items-center">
                <span className="text-body-sm text-neutral-600">Duration</span>
                <span className="text-body-md font-semibold text-neutral-900">90 min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-body-sm text-neutral-600">Format</span>
                <span className="text-body-md font-semibold text-neutral-900">Zoom</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-body-sm text-neutral-600">Pay rate</span>
                <span className="text-body-md font-semibold text-success">$25/hour</span>
              </div>
            </div>
          </div>

          <div className="bg-warning-light border border-warning rounded-xl p-4">
            <h4 className="text-body-md font-semibold text-warning-dark mb-2">
              What to Expect
            </h4>
            <ul className="text-body-sm text-warning-dark space-y-1">
              <li>• Meet & Greet with Admin Team</li>
              <li>• Quiz Show to test your knowledge</li>
              <li>• Q&A Time for your questions</li>
              <li>• Certification & Next Steps</li>
            </ul>
          </div>

          <div className="bg-info-light border border-info rounded-xl p-4">
            <h4 className="text-body-md font-semibold text-info-dark mb-2">
              Available Sessions
            </h4>
            <p className="text-body-sm text-info-dark">
              {sessions.length === 0
                ? "No sessions currently available"
                : `${sessions.length} session${sessions.length > 1 ? "s" : ""} available`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
