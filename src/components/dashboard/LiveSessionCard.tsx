"use client";

import { useState } from "react";
import {
  PlayCircleIcon,
  CalendarDaysIcon,
  ClockIcon,
  UsersIcon,
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

type SessionCategory = "TRAINING" | "Q_AND_A" | "WORKSHOP" | "OFFICE_HOURS" | "SPECIAL_EVENT";

interface LiveSessionCardProps {
  id: string;
  title: string;
  description?: string;
  scheduledAt: string;
  duration: number;
  category: SessionCategory;
  hostName: string;
  hostAvatar?: string;
  isRegistered: boolean;
  participantCount?: number;
  maxParticipants?: number;
  zoomJoinUrl?: string;
  onRegister?: (sessionId: string) => Promise<void>;
  onUnregister?: (sessionId: string) => Promise<void>;
}

const categoryConfig: Record<SessionCategory, { label: string; color: string; bgColor: string }> = {
  TRAINING: { label: "Training", color: "text-info-dark", bgColor: "bg-info-light" },
  Q_AND_A: { label: "Q&A", color: "text-primary-700", bgColor: "bg-primary-100" },
  WORKSHOP: { label: "Workshop", color: "text-success-dark", bgColor: "bg-success-light" },
  OFFICE_HOURS: { label: "Office Hours", color: "text-warning-dark", bgColor: "bg-warning-light" },
  SPECIAL_EVENT: { label: "Special Event", color: "text-error-dark", bgColor: "bg-error-light" },
};

function formatSessionDate(dateString: string): { date: string; time: string; isToday: boolean; isSoon: boolean } {
  const date = new Date(dateString);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const isSoon = diffHours > 0 && diffHours < 1; // Within the next hour

  const dateStr = isToday
    ? "Today"
    : date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return { date: dateStr, time: timeStr, isToday, isSoon };
}

export function LiveSessionCard({
  id,
  title,
  description,
  scheduledAt,
  duration,
  category,
  hostName,
  isRegistered,
  participantCount,
  maxParticipants,
  zoomJoinUrl,
  onRegister,
  onUnregister,
}: LiveSessionCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { date, time, isToday, isSoon } = formatSessionDate(scheduledAt);
  const catConfig = categoryConfig[category] || categoryConfig.TRAINING;

  const handleRegister = async () => {
    if (!onRegister) return;
    setIsLoading(true);
    try {
      await onRegister(id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnregister = async () => {
    if (!onUnregister) return;
    setIsLoading(true);
    try {
      await onUnregister(id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`relative rounded-2xl border overflow-hidden transition-all hover:shadow-sm ${
        isSoon
          ? "border-primary-300 bg-gradient-to-br from-primary-50 to-primary-100/50"
          : "border-neutral-200 bg-white"
      }`}
    >
      {/* Live indicator for sessions starting soon */}
      {isSoon && (
        <div className="absolute top-3 right-3">
          <span className="flex items-center gap-1.5 px-2 py-1 bg-error text-white text-xs font-medium rounded-full">
            <span className="h-2 w-2 bg-white rounded-full animate-pulse" />
            Starting Soon
          </span>
        </div>
      )}

      <div className="p-4">
        {/* Category badge */}
        <div className="flex items-start justify-between mb-3">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${catConfig.bgColor} ${catConfig.color}`}>
            <PlayCircleIcon className="h-3 w-3 mr-1" />
            {catConfig.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-neutral-900 mb-2 line-clamp-2">{title}</h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-neutral-500 mb-3 line-clamp-2">{description}</p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap gap-3 text-sm text-neutral-600 mb-4">
          <div className="flex items-center gap-1">
            <CalendarDaysIcon className={`h-4 w-4 ${isToday ? "text-primary-500" : "text-neutral-400"}`} />
            <span className={isToday ? "font-medium text-primary-600" : ""}>{date}</span>
          </div>
          <div className="flex items-center gap-1">
            <ClockIcon className="h-4 w-4 text-neutral-400" />
            <span>{time}</span>
            <span className="text-neutral-400">({duration} min)</span>
          </div>
          {participantCount !== undefined && (
            <div className="flex items-center gap-1">
              <UsersIcon className="h-4 w-4 text-neutral-400" />
              <span>
                {participantCount}
                {maxParticipants && `/${maxParticipants}`}
              </span>
            </div>
          )}
        </div>

        {/* Host */}
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center text-xs font-medium text-white">
            {hostName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-neutral-600">
            Hosted by <span className="font-medium text-neutral-900">{hostName}</span>
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isRegistered && zoomJoinUrl ? (
            <>
              <a
                href={zoomJoinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button className="w-full gap-2" size="sm">
                  <PlayCircleIcon className="h-4 w-4" />
                  Join Session
                  <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                </Button>
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnregister}
                disabled={isLoading}
                className="text-neutral-500"
              >
                {isLoading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : "Cancel"}
              </Button>
            </>
          ) : isRegistered ? (
            <>
              <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-success-light text-success-dark rounded-lg text-sm font-medium">
                <CheckIcon className="h-4 w-4" />
                Registered
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnregister}
                disabled={isLoading}
                className="text-neutral-500"
              >
                {isLoading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : "Cancel"}
              </Button>
            </>
          ) : (
            <Button
              className="w-full gap-2"
              size="sm"
              variant="outline"
              onClick={handleRegister}
              disabled={isLoading || (maxParticipants !== undefined && participantCount !== undefined && participantCount >= maxParticipants)}
            >
              {isLoading ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CalendarDaysIcon className="h-4 w-4" />
                  RSVP
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
