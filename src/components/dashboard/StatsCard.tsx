"use client";



interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: "indigo" | "emerald" | "amber" | "sky" | "purple" | "rose";
  trend?: {
    value: number;
    isPositive: boolean;
  };
  suffix?: string;
}

const colorClasses = {
  indigo: {
    bg: "bg-gradient-to-br from-primary-50 to-white",
    iconBg: "bg-primary-100",
    iconColor: "text-primary-600",
    trendPositive: "text-primary-600 bg-primary-50",
    trendNegative: "text-error bg-error-light",
  },
  emerald: {
    bg: "bg-gradient-to-br from-success-light to-white",
    iconBg: "bg-success-light",
    iconColor: "text-success",
    trendPositive: "text-success bg-success-light",
    trendNegative: "text-error bg-error-light",
  },
  amber: {
    bg: "bg-gradient-to-br from-warning-light to-white",
    iconBg: "bg-warning-light",
    iconColor: "text-warning",
    trendPositive: "text-warning bg-warning-light",
    trendNegative: "text-error bg-error-light",
  },
  sky: {
    bg: "bg-gradient-to-br from-info-light to-white",
    iconBg: "bg-info-light",
    iconColor: "text-info",
    trendPositive: "text-info bg-info-light",
    trendNegative: "text-error bg-error-light",
  },
  purple: {
    bg: "bg-gradient-to-br from-primary-50 to-white",
    iconBg: "bg-primary-100",
    iconColor: "text-primary-600",
    trendPositive: "text-primary-600 bg-primary-50",
    trendNegative: "text-error bg-error-light",
  },
  rose: {
    bg: "bg-gradient-to-br from-error-light to-white",
    iconBg: "bg-error-light",
    iconColor: "text-error",
    trendPositive: "text-error bg-error-light",
    trendNegative: "text-error bg-error-light",
  },
};

export function StatsCard({ label, value, icon: Icon, color, trend, suffix }: StatsCardProps) {
  const colors = colorClasses[color];

  return (
    <div className={`relative overflow-hidden rounded-xl border-0 shadow-sm ${colors.bg} p-3.5`}>
      {/* Decorative circle */}
      <div className="absolute -top-3 -right-3 h-14 w-14 rounded-full bg-white/50 opacity-50" />

      <div className="relative flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl ${colors.iconBg} flex items-center justify-center shadow-inner`}>
          <Icon className={`h-5 w-5 ${colors.iconColor}`} />
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-bold text-neutral-900">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            {suffix && <span className="text-xs text-neutral-500">{suffix}</span>}
          </div>
          <p className="text-xs text-neutral-500">{label}</p>
          {trend && (
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium mt-0.5 ${
                trend.isPositive ? colors.trendPositive : colors.trendNegative
              }`}
            >
              {trend.isPositive ? "+" : ""}{trend.value}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
