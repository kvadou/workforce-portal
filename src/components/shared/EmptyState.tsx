import { WrenchIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  gradient?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({
  icon: Icon = WrenchIcon,
  title,
  description,
  gradient = "from-neutral-200 to-neutral-300",
  action,
}: EmptyStateProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-8 sm:p-12">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-br from-primary-100/50 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 h-32 w-32 bg-gradient-to-br from-warning-light/50 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative text-center">
        <div className={`h-16 w-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2">
          {title}
        </h2>
        <p className="text-neutral-500 max-w-md mx-auto">
          {description}
        </p>
        {action && (
          <div className="mt-6">
            <Button onClick={action.onClick}>{action.label}</Button>
          </div>
        )}
      </div>
    </div>
  );
}
