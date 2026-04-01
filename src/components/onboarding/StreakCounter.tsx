"use client";

import { FireIcon, CalendarDaysIcon, ArrowTrendingUpIcon } from "@heroicons/react/24/outline";

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: Date | string | null;
}

export function StreakCounter({
  currentStreak,
  longestStreak,
  lastActiveDate,
}: StreakCounterProps) {
  const isActiveToday = lastActiveDate
    ? new Date(lastActiveDate).toDateString() === new Date().toDateString()
    : false;

  // Generate last 7 days for the streak visualization
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  // Simple check - in a real app, you'd check against actual login dates
  const getStreakDay = (date: Date) => {
    const today = new Date();
    const diffDays = Math.floor(
      (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays < currentStreak;
  };

  return (
    <div className="bg-gradient-to-br from-accent-orange-light to-warning-light rounded-xl px-3 py-2.5 border border-accent-orange-light">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 bg-gradient-to-br from-accent-orange to-error rounded-lg flex items-center justify-center">
            <FireIcon className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-neutral-900">{currentStreak} Day Streak</h3>
            <p className="text-[9px] text-neutral-500">Keep the momentum going!</p>
          </div>
        </div>
        {isActiveToday && (
          <span className="px-1.5 py-0.5 bg-success-light text-success-dark text-[9px] font-medium rounded-full">
            Active
          </span>
        )}
      </div>

      {/* Streak visualization */}
      <div className="flex justify-between gap-0.5 mb-2">
        {last7Days.map((date, i) => {
          const isActive = getStreakDay(date);
          const isToday = date.toDateString() === new Date().toDateString();
          return (
            <div key={i} className="flex-1 text-center">
              <div
                className={`h-5 w-5 mx-auto rounded-lg flex items-center justify-center text-[9px] font-medium mb-0.5 ${
                  isActive
                    ? "bg-gradient-to-br from-accent-orange to-error text-white"
                    : "bg-neutral-100 text-neutral-400"
                } ${isToday ? "ring-2 ring-accent-orange ring-offset-1" : ""}`}
              >
                {date.getDate()}
              </div>
              <span className="text-[8px] text-neutral-500">
                {["S", "M", "T", "W", "T", "F", "S"][date.getDay()]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="flex gap-3 pt-1.5 border-t border-accent-orange-light">
        <div className="flex items-center gap-1">
          <ArrowTrendingUpIcon className="h-2.5 w-2.5 text-accent-orange" />
          <span className="text-[10px] text-neutral-600">
            Best: <span className="font-semibold text-neutral-900">{longestStreak}d</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <CalendarDaysIcon className="h-2.5 w-2.5 text-accent-orange" />
          <span className="text-[10px] text-neutral-600">
            Now: <span className="font-semibold text-neutral-900">{currentStreak}d</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// Compact version for mobile
export function StreakBadge({ currentStreak }: { currentStreak: number }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-accent-orange-light to-warning-light rounded-full border border-accent-orange">
      <FireIcon className="h-4 w-4 text-accent-orange" />
      <span className="text-sm font-bold text-accent-orange">{currentStreak}</span>
      <span className="text-xs text-accent-orange">day streak</span>
    </div>
  );
}
