"use client";

import Link from "next/link";
import { PlayIcon, CheckCircleIcon, ClockIcon } from "@heroicons/react/24/outline";
import { Badge, BadgeStatus } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LessonCardProps {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  duration: string;
  status: BadgeStatus;
  isActive?: boolean;
}

const statusIcons: Record<BadgeStatus, React.ReactNode> = {
  completed: <CheckCircleIcon className="h-5 w-5 text-success" />,
  in_progress: <ClockIcon className="h-5 w-5 text-warning" />,
  started: <PlayIcon className="h-5 w-5 text-primary-500" />,
  not_started: <CheckCircleIcon className="h-5 w-5 text-neutral-300" />,
};

export function LessonCard({
  id,
  number,
  title,
  subtitle,
  duration,
  status,
  isActive,
}: LessonCardProps) {
  return (
    <Link
      href={`/lessons/${id}`}
      className={cn(
        "flex items-center gap-4 p-4 rounded-[var(--radius-lg)] transition-all duration-200 border-2",
        isActive
          ? "bg-white shadow-[var(--shadow-card)] border-primary-500"
          : "border-transparent hover:bg-white hover:shadow-[var(--shadow-card)] hover:border-neutral-200"
      )}
    >
      {/* Lesson Thumbnail/Icon */}
      <div className="relative flex-shrink-0">
        <div
          className={cn(
            "h-14 w-14 rounded-[var(--radius-md)] flex items-center justify-center",
            status === "completed"
              ? "bg-success-light"
              : status === "in_progress"
              ? "bg-warning-light"
              : status === "started"
              ? "bg-primary-100"
              : "bg-neutral-100"
          )}
        >
          {number === 0 ? (
            <span className="text-2xl">👋</span>
          ) : (
            <span className="text-xl font-bold text-neutral-700">{number}</span>
          )}
        </div>
        <div className="absolute -bottom-1 -right-1">
          {statusIcons[status]}
        </div>
      </div>

      {/* Lesson Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-overline text-neutral-500">
            {number === 0 ? "Introduction" : `Lesson ${number}`}
          </span>
          <Badge status={status} />
        </div>
        <h3 className="font-semibold text-neutral-900 truncate">{title}</h3>
        <p className="text-body-sm text-neutral-500 truncate">{subtitle}</p>
      </div>

      {/* Duration */}
      <div className="flex-shrink-0 text-right">
        <span className="text-body-sm text-neutral-500">{duration}</span>
      </div>
    </Link>
  );
}
