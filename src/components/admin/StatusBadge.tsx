"use client";

type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";

interface StatusBadgeProps {
  status: Status;
  size?: "sm" | "md";
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  DRAFT: {
    label: "Draft",
    className: "bg-neutral-100 text-neutral-600",
  },
  PUBLISHED: {
    label: "Published",
    className: "bg-success-light text-success",
  },
  ARCHIVED: {
    label: "Archived",
    className: "bg-neutral-200 text-neutral-500",
  },
};

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center rounded-lg font-medium ${config.className} ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      }`}
    >
      {config.label}
    </span>
  );
}

export default StatusBadge;
