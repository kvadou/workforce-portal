"use client";

import {
  BookOpenIcon,
  ClockIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  TrophyIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

interface CareerStatsPanelProps {
  stats: {
    lessonsTotal: number;
    lessonsThisMonth: number;
    hoursTotal: number;
    averageRating: number | null;
    fiveStarCount: number;
  };
  showTrends?: boolean;
}

export function CareerStatsPanel({ stats, showTrends = true }: CareerStatsPanelProps) {
  const statItems = [
    {
      label: "Total Lessons",
      value: stats.lessonsTotal,
      icon: BookOpenIcon,
      color: "text-info",
      bgColor: "bg-info-light",
    },
    {
      label: "This Month",
      value: stats.lessonsThisMonth,
      icon: ArrowTrendingUpIcon,
      color: "text-success",
      bgColor: "bg-success-light",
    },
    {
      label: "Hours Taught",
      value: Math.round(stats.hoursTotal),
      icon: ClockIcon,
      color: "text-primary-600",
      bgColor: "bg-primary-100",
      suffix: "hrs",
    },
    {
      label: "Avg Rating",
      value: stats.averageRating ? stats.averageRating.toFixed(1) : "—",
      icon: StarIcon,
      color: "text-warning",
      bgColor: "bg-warning-light",
      isStar: true,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white">
        <div className="flex items-center gap-2">
          <TrophyIcon className="h-5 w-5 text-primary-500" />
          <h2 className="font-semibold text-neutral-900">Career Stats</h2>
          <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full ml-auto">
            From Acme
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {statItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="relative p-4 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl ${item.bgColor} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-neutral-900">{item.value}</span>
                      {item.suffix && <span className="text-sm text-neutral-500">{item.suffix}</span>}
                      {item.isStar && stats.averageRating && (
                        <StarIcon className="h-4 w-4 text-warning fill-warning ml-0.5" />
                      )}
                    </div>
                    <p className="text-xs text-neutral-500">{item.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 5-star count highlight */}
        {stats.fiveStarCount > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-warning-light to-warning-light border border-warning">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="h-4 w-4 text-warning fill-warning" />
                  ))}
                </div>
                <span className="text-sm font-medium text-warning-dark">5-Star Reviews</span>
              </div>
              <span className="text-xl font-bold text-warning">{stats.fiveStarCount}</span>
            </div>
          </div>
        )}

        {/* No data state */}
        {stats.lessonsTotal === 0 && (
          <div className="mt-4 p-4 rounded-xl bg-neutral-50 text-center">
            <UsersIcon className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">
              Stats will appear here once you start teaching lessons
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
