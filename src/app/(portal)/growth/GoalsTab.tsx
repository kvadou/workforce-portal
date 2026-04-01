"use client";

import { useState, useCallback } from "react";
import {
  ArrowTrendingUpIcon,
  ExclamationCircleIcon,
  FlagIcon,
  PlusIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import { Skeleton, SkeletonStats, SkeletonCard } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GoalCard } from "@/components/goals/GoalCard";
import { CreateGoalModal } from "@/components/goals/CreateGoalModal";
import { StatsCard } from "@/components/dashboard/StatsCard";
import {
  useGoals,
  useGoalTemplates,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  type TutorGoal,
  type CreateGoalInput,
} from "@/hooks/useGoals";
import type { GoalStatus, GoalCategory } from "@prisma/client";

type FilterStatus = "all" | GoalStatus;
type FilterCategory = "all" | GoalCategory;

export function GoalsTab() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<TutorGoal | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>("all");

  const { data: goals, isLoading: goalsLoading } = useGoals();
  const { data: templates, isLoading: templatesLoading } = useGoalTemplates();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const handleCreateGoal = async (data: CreateGoalInput) => {
    try {
      await createGoal.mutateAsync(data);
      setShowCreateModal(false);
    } catch (err) {
      console.error("Failed to create goal:", err);
    }
  };

  const handleEditGoal = async (data: CreateGoalInput) => {
    if (!editingGoal) return;
    try {
      await updateGoal.mutateAsync({
        id: editingGoal.id,
        name: data.name,
        description: data.description,
        targetValue: data.targetValue,
        endDate: data.endDate,
      });
      setEditingGoal(null);
    } catch (err) {
      console.error("Failed to update goal:", err);
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeleteGoal = useCallback((id: string) => {
    setDeleteConfirmId(id);
  }, []);

  const confirmDeleteGoal = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteGoal.mutateAsync(deleteConfirmId);
    } catch (err) {
      console.error("Failed to delete goal:", err);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleUpdateProgress = async (id: string, value: number) => {
    try {
      await updateGoal.mutateAsync({ id, currentValue: value });
    } catch (err) {
      console.error("Failed to update progress:", err);
    }
  };

  // Filter goals
  const filteredGoals = (goals || []).filter((goal) => {
    if (statusFilter !== "all" && goal.status !== statusFilter) return false;
    if (categoryFilter !== "all" && goal.category !== categoryFilter) return false;
    return true;
  });

  // Calculate stats
  const stats = {
    total: goals?.length || 0,
    inProgress: goals?.filter((g) => g.status === "IN_PROGRESS").length || 0,
    completed: goals?.filter((g) => g.status === "COMPLETED").length || 0,
    failed: goals?.filter((g) => g.status === "FAILED").length || 0,
  };

  const isLoading = goalsLoading || templatesLoading;

  if (isLoading) {
    return (
      <>
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <SkeletonStats />
          <SkeletonStats />
          <SkeletonStats />
          <SkeletonStats />
        </div>

        {/* Filters Skeleton */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>

        {/* Goals Grid Skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Section header with New Goal button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">My Goals</h2>
        <Button onClick={() => setShowCreateModal(true)} size="sm" className="gap-1.5">
          <PlusIcon className="w-4 h-4" />
          New Goal
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatsCard
          label="Total Goals"
          value={stats.total}
          icon={FlagIcon}
          color="indigo"
        />
        <StatsCard
          label="In Progress"
          value={stats.inProgress}
          icon={ArrowTrendingUpIcon}
          color="sky"
        />
        <StatsCard
          label="Completed"
          value={stats.completed}
          icon={TrophyIcon}
          color="emerald"
        />
        <StatsCard
          label="Failed"
          value={stats.failed}
          icon={ExclamationCircleIcon}
          color="rose"
        />
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-2">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {(["all", "IN_PROGRESS", "COMPLETED", "FAILED", "CANCELLED"] as FilterStatus[]).map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-4 py-2.5 text-sm rounded-lg transition-all min-h-[44px] ${
                        statusFilter === status
                          ? "bg-primary-500 text-white shadow-sm"
                          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:bg-neutral-300"
                      }`}
                    >
                      {status === "all"
                        ? "All"
                        : status === "IN_PROGRESS"
                          ? "In Progress"
                          : status.charAt(0) + status.slice(1).toLowerCase()}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-2">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {(["all", "TEACHING", "LEARNING", "ENGAGEMENT", "PERFORMANCE"] as FilterCategory[]).map(
                  (cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-4 py-2.5 text-sm rounded-lg transition-all min-h-[44px] ${
                        categoryFilter === cat
                          ? "bg-primary-500 text-white shadow-sm"
                          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:bg-neutral-300"
                      }`}
                    >
                      {cat === "all"
                        ? "All"
                        : cat.charAt(0) + cat.slice(1).toLowerCase()}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals Grid */}
      {filteredGoals.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={setEditingGoal}
              onDelete={handleDeleteGoal}
              onUpdateProgress={handleUpdateProgress}
              isUpdating={updateGoal.isPending}
            />
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-success-light to-success-light flex items-center justify-center">
              <FlagIcon className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-1">
              {goals?.length === 0 ? "No goals yet" : "No matching goals"}
            </h3>
            <p className="text-neutral-500 mb-4">
              {goals?.length === 0
                ? "Create your first goal to start tracking your progress"
                : "Try adjusting your filters"}
            </p>
            {goals?.length === 0 && (
              <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                <PlusIcon className="w-4 h-4" />
                Create Your First Goal
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-white rounded-xl shadow-modal p-6 max-w-sm mx-4 w-full">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Delete Goal</h3>
            <p className="text-neutral-600 mb-6">Are you sure you want to delete this goal? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteGoal}
                className="bg-error hover:bg-error-dark text-white"
                disabled={deleteGoal.isPending}
              >
                {deleteGoal.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <CreateGoalModal
        isOpen={showCreateModal || !!editingGoal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingGoal(null);
        }}
        onSubmit={editingGoal ? handleEditGoal : handleCreateGoal}
        templates={templates || []}
        editingGoal={editingGoal}
        isSubmitting={createGoal.isPending || updateGoal.isPending}
      />
    </>
  );
}
