import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
} as const;

interface LoadingSpinnerProps {
  size?: keyof typeof sizeMap;
  label?: string;
  fullPage?: boolean;
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  label,
  fullPage = false,
  className,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn("flex flex-col items-center justify-center gap-3", fullPage && "min-h-[200px]", className)}>
      <ArrowPathIcon className={cn("animate-spin text-primary-500", sizeMap[size])} />
      {label && (
        <p className="text-body text-neutral-500">{label}</p>
      )}
    </div>
  );

  return spinner;
}
