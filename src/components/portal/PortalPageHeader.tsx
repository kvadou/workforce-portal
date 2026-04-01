
import type { ReactNode } from "react";

const colorSchemeClasses = {
  purple: "bg-gradient-to-br from-primary-900 via-primary-600 to-primary-500",
  indigo: "bg-gradient-to-br from-accent-navy via-primary-600 to-primary-500",
  emerald: "bg-gradient-to-br from-success-dark via-success to-accent-green",
  amber: "bg-gradient-to-br from-warning-dark via-accent-orange to-warning",
  teal: "bg-gradient-to-br from-info-dark via-info to-accent-cyan",
  rose: "bg-gradient-to-br from-error-dark via-error to-accent-pink",
  sky: "bg-gradient-to-br from-info-dark via-info to-accent-cyan",
  violet: "bg-gradient-to-br from-primary-900 via-primary-600 to-primary-500",
  slate: "bg-gradient-to-br from-neutral-800 via-neutral-600 to-neutral-500",
} as const;

export type ColorScheme = keyof typeof colorSchemeClasses;

interface PortalPageHeaderProps {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  description?: string;
  colorScheme?: ColorScheme;
  actions?: ReactNode;
  children?: ReactNode;
  /** When true, removes rounded corners and bottom margin (for use inside a card container) */
  flush?: boolean;
}

export function PortalPageHeader({
  icon: Icon,
  title,
  description,
  colorScheme = "purple",
  actions,
  children,
  flush = false,
}: PortalPageHeaderProps) {
  return (
    <div
      className={`relative overflow-hidden p-4 md:p-5 text-white ${flush ? "" : "rounded-xl mb-6"} ${colorSchemeClasses[colorScheme]}`}
    >
      <div className="absolute top-0 right-0 h-48 w-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 h-36 w-36 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      <div className="relative z-10">
        {children || (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
              )}
              <div>
                {title && (
                  <h1 className="text-xl md:text-2xl font-bold">{title}</h1>
                )}
                {description && (
                  <p className="text-white/80 text-sm">{description}</p>
                )}
              </div>
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
