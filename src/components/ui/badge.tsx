"use client";

import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

type BadgeStatus = "completed" | "in_progress" | "started" | "not_started";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status?: BadgeStatus;
  variant?: "default" | "outline";
}

const statusStyles: Record<BadgeStatus, string> = {
  completed: "badge-completed",
  in_progress: "badge-in-progress",
  started: "badge-started",
  not_started: "badge-not-started",
};

const statusLabels: Record<BadgeStatus, string> = {
  completed: "Completed",
  in_progress: "In Progress",
  started: "Started",
  not_started: "Not Started",
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, status, variant = "default", children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold tracking-wide",
          status ? statusStyles[status] : "bg-neutral-100 text-neutral-600",
          variant === "outline" && "bg-transparent border-2",
          className
        )}
        {...props}
      >
        {status ? statusLabels[status] : children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
export type { BadgeStatus };
