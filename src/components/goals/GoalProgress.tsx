"use client";

interface GoalProgressProps {
  current: number;
  target: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  color?: "primary" | "success" | "warning" | "danger";
}

export function GoalProgress({
  current,
  target,
  size = "md",
  showLabel = true,
  color = "primary",
}: GoalProgressProps) {
  const percentage = Math.min(Math.round((current / target) * 100), 100);

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  const colorClasses = {
    primary: "bg-primary-500",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-error",
  };

  // Determine color based on percentage if not explicitly set
  const effectiveColor =
    color === "primary"
      ? percentage >= 100
        ? "success"
        : percentage >= 75
          ? "primary"
          : percentage >= 50
            ? "warning"
            : "danger"
      : color;

  return (
    <div className="w-full">
      <div
        className={`w-full bg-neutral-100 rounded-full overflow-hidden ${sizeClasses[size]}`}
      >
        <div
          className={`${sizeClasses[size]} ${colorClasses[effectiveColor]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-neutral-500">
            {current} / {target}
          </span>
          <span className="text-xs font-medium text-neutral-700">
            {percentage}%
          </span>
        </div>
      )}
    </div>
  );
}
