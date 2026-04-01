"use client";

import { PageStatus } from "@/lib/validations/page";
import {
  ClockIcon,
  CheckIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";

interface PageStatusBadgeProps {
  status: PageStatus;
  size?: "sm" | "md";
  showIcon?: boolean;
}

const statusConfig: Record<
  PageStatus,
  {
    label: string;
    className: string;
    icon: typeof ClockIcon;
  }
> = {
  DRAFT: {
    label: "Draft",
    className: "bg-neutral-100 text-neutral-700 border-neutral-300",
    icon: DocumentTextIcon,
  },
  PUBLISHED: {
    label: "Published",
    className: "bg-success-light text-success-dark border-success",
    icon: CheckIcon,
  },
  SCHEDULED: {
    label: "Scheduled",
    className: "bg-info-light text-info-dark border-info",
    icon: ClockIcon,
  },
  ARCHIVED: {
    label: "Archived",
    className: "bg-warning-light text-warning-dark border-warning",
    icon: ArchiveBoxIcon,
  },
};

export function PageStatusBadge({
  status,
  size = "sm",
  showIcon = false,
}: PageStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg font-medium border ${config.className} ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      }`}
    >
      {showIcon && <Icon className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />}
      {config.label}
    </span>
  );
}

export default PageStatusBadge;
