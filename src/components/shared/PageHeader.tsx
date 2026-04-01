

interface PageHeaderProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  gradient?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  icon: Icon,
  title,
  description,
  gradient = "from-primary-500 to-primary-700",
  children,
}: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Icon with gradient background */}
          <div className={`h-12 w-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
            <Icon className="h-6 w-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
              {title}
            </h1>
            {description && (
              <p className="text-neutral-600 mt-0.5 text-sm sm:text-base">
                {description}
              </p>
            )}
          </div>
        </div>
        {children && (
          <div className="flex items-center gap-2">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
