"use client";

import { useState } from "react";
import {
  FlagIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  EllipsisVerticalIcon,
  PencilSquareIcon,
  TrashIcon,
  ClockIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { GoalProgress } from "./GoalProgress";
import type { TutorGoal } from "@/hooks/useGoals";
import { formatDistanceToNow, format, isPast, differenceInDays } from "date-fns";

interface GoalCardProps {
  goal: TutorGoal;
  onEdit: (goal: TutorGoal) => void;
  onDelete: (id: string) => void;
  onUpdateProgress: (id: string, value: number) => void;
  isUpdating?: boolean;
}

const categoryIcons = {
  TEACHING: FlagIcon,
  LEARNING: ArrowTrendingUpIcon,
  ENGAGEMENT: CheckCircleIcon,
  PERFORMANCE: ArrowTrendingUpIcon,
};

const categoryColors = {
  TEACHING: "bg-info-light text-info-dark",
  LEARNING: "bg-primary-100 text-primary-700",
  ENGAGEMENT: "bg-success-light text-success-dark",
  PERFORMANCE: "bg-warning-light text-warning-dark",
};

const statusColors = {
  IN_PROGRESS: "bg-info-light text-info-dark",
  COMPLETED: "bg-success-light text-success-dark",
  FAILED: "bg-error-light text-error-dark",
  CANCELLED: "bg-neutral-100 text-neutral-700",
};

const statusLabels = {
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export function GoalCard({
  goal,
  onEdit,
  onDelete,
  onUpdateProgress,
  isUpdating,
}: GoalCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showProgressInput, setShowProgressInput] = useState(false);
  const [progressValue, setProgressValue] = useState(goal.currentValue.toString());

  const CategoryIcon = categoryIcons[goal.category];
  const endDate = new Date(goal.endDate);
  const isOverdue = isPast(endDate) && goal.status === "IN_PROGRESS";
  const daysRemaining = differenceInDays(endDate, new Date());

  const handleProgressSubmit = () => {
    const value = parseInt(progressValue, 10);
    if (!isNaN(value) && value >= 0) {
      onUpdateProgress(goal.id, value);
      setShowProgressInput(false);
    }
  };

  return (
    <div
      className={`bg-white border rounded-xl p-4 transition-all hover:shadow-sm ${
        goal.status === "COMPLETED"
          ? "border-success"
          : isOverdue
            ? "border-error"
            : "border-neutral-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={`p-2 rounded-lg ${categoryColors[goal.category]} flex-shrink-0`}
          >
            <CategoryIcon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-neutral-900 truncate">
              {goal.name}
            </h3>
            {goal.description && (
              <p className="text-sm text-neutral-500 line-clamp-2 mt-0.5">
                {goal.description}
              </p>
            )}
          </div>
        </div>

        {/* Status Badge & Menu */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[goal.status]}`}
          >
            {statusLabels[goal.status]}
          </span>
          {goal.status === "IN_PROGRESS" && (
            <div className="relative">
              <IconButton
                icon={EllipsisVerticalIcon}
                size="sm"
                aria-label="Goal actions"
                onClick={() => setShowMenu(!showMenu)}
              />
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-neutral-200 rounded-lg shadow-dropdown z-20 py-1">
                    <button
                      onClick={() => {
                        onEdit(goal);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        onDelete(goal.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-error hover:bg-error-light flex items-center gap-2"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <GoalProgress
          current={goal.currentValue}
          target={goal.targetValue}
          size="md"
        />
      </div>

      {/* Update Progress (for in-progress goals) */}
      {goal.status === "IN_PROGRESS" && (
        <div className="mb-3">
          {showProgressInput ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={progressValue}
                onChange={(e) => setProgressValue(e.target.value)}
                min={0}
                max={goal.targetValue}
                className="flex-1 px-3 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter progress"
              />
              <Button
                size="sm"
                onClick={handleProgressSubmit}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowProgressInput(false);
                  setProgressValue(goal.currentValue.toString());
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowProgressInput(true)}
              className="w-full"
            >
              <ArrowTrendingUpIcon className="h-4 w-4 mr-2" />
              Update Progress
            </Button>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <div className="flex items-center gap-1">
          <CalendarDaysIcon className="h-3.5 w-3.5" />
          <span>
            {goal.status === "COMPLETED" && goal.completedAt
              ? `Completed ${formatDistanceToNow(new Date(goal.completedAt), { addSuffix: true })}`
              : `Due ${format(endDate, "MMM d, yyyy")}`}
          </span>
        </div>
        {goal.status === "IN_PROGRESS" && (
          <div
            className={`flex items-center gap-1 ${isOverdue ? "text-error" : daysRemaining <= 7 ? "text-warning" : ""}`}
          >
            <ClockIcon className="h-3.5 w-3.5" />
            <span>
              {isOverdue
                ? "Overdue"
                : daysRemaining === 0
                  ? "Due today"
                  : daysRemaining === 1
                    ? "1 day left"
                    : `${daysRemaining} days left`}
            </span>
          </div>
        )}
      </div>

      {/* Template badge */}
      {goal.template && (
        <div className="mt-2 pt-2 border-t border-neutral-100">
          <span className="text-xs text-neutral-400">
            From template: {goal.template.name}
          </span>
        </div>
      )}
    </div>
  );
}
