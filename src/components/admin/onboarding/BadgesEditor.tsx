"use client";

import { useState } from "react";
import {
  Bars3Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useBadges,
  useUpdateBadge,
  useReorderBadges,
} from "@/hooks/useOnboardingConfig";
import { IconPicker } from "./IconPicker";
import { ColorSchemePicker, type ColorScheme } from "./ColorSchemePicker";

export function BadgesEditor() {
  const { data: badges, isLoading } = useBadges();
  const updateBadge = useUpdateBadge();
  const reorderBadges = useReorderBadges();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    icon: string;
    colorScheme: ColorScheme;
  }>({
    title: "",
    description: "",
    icon: "",
    colorScheme: { color: "", bgColor: "", borderColor: "" },
  });

  const handleStartEdit = (badge: NonNullable<typeof badges>[number]) => {
    const colorScheme =
      typeof badge.colorScheme === "string"
        ? JSON.parse(badge.colorScheme)
        : badge.colorScheme;

    setEditingId(badge.id);
    setEditForm({
      title: badge.title,
      description: badge.description,
      icon: badge.icon,
      colorScheme,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    await updateBadge.mutateAsync({
      id: editingId,
      title: editForm.title,
      description: editForm.description,
      icon: editForm.icon,
      colorScheme: JSON.stringify(editForm.colorScheme),
    });

    setEditingId(null);
  };

  const handleMoveUp = async (index: number) => {
    if (!badges || index === 0) return;

    const newOrder = [...badges];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;

    await reorderBadges.mutateAsync(
      newOrder.map((badge, i) => ({ id: badge.id, order: i + 1 }))
    );
  };

  const handleMoveDown = async (index: number) => {
    if (!badges || index === badges.length - 1) return;

    const newOrder = [...badges];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;

    await reorderBadges.mutateAsync(
      newOrder.map((badge, i) => ({ id: badge.id, order: i + 1 }))
    );
  };

  const renderIcon = (iconName: string, className?: string) => {
    const Icon = LucideIcons[iconName as keyof typeof LucideIcons] as React.ComponentType<{
      className?: string;
    }>;
    if (!Icon) return null;
    return <Icon className={className || "h-5 w-5"} />;
  };

  const getColorScheme = (badge: NonNullable<typeof badges>[number]): ColorScheme => {
    return typeof badge.colorScheme === "string"
      ? JSON.parse(badge.colorScheme)
      : badge.colorScheme;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 border-2 border-primary-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Group badges by type
  const stepBadges = badges?.filter((b) => b.unlockType === "step_completion") || [];
  const streakBadges = badges?.filter((b) => b.unlockType === "streak") || [];
  const specialBadges = badges?.filter((b) => b.unlockType === "special") || [];

  const renderBadgeGroup = (
    title: string,
    groupBadges: typeof badges,
    startIndex: number
  ) => (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-neutral-700 flex items-center gap-2">
        <TrophyIcon className="h-4 w-4" />
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groupBadges?.map((badge, localIndex) => {
          const index = startIndex + localIndex;
          const isEditing = editingId === badge.id;
          const colorScheme = getColorScheme(badge);

          return (
            <div
              key={badge.id}
              className={`border rounded-lg overflow-hidden transition-all ${
                isEditing
                  ? "border-primary-300 bg-primary-50"
                  : "border-neutral-200 bg-white"
              }`}
            >
              {/* Badge Preview */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Reorder Controls */}
                  <div className="flex flex-col items-center gap-0.5">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0 || reorderBadges.isPending}
                      className="p-0.5 text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
                    >
                      <ChevronUpIcon className="h-3 w-3" />
                    </button>
                    <Bars3Icon className="h-3 w-3 text-neutral-300" />
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={
                        index === (badges?.length || 0) - 1 ||
                        reorderBadges.isPending
                      }
                      className="p-0.5 text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
                    >
                      <ChevronDownIcon className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Badge Icon */}
                  <div
                    className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${colorScheme.bgColor} border-2 ${colorScheme.borderColor}`}
                  >
                    <span className={colorScheme.color}>
                      {renderIcon(badge.icon, "h-6 w-6")}
                    </span>
                  </div>

                  {/* Badge Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-neutral-900 truncate">
                      {badge.title}
                    </h4>
                    <p className="text-xs text-neutral-500 line-clamp-2">
                      {badge.description}
                    </p>
                    <p className="text-xs text-primary-600 mt-1">
                      {badge.badgeKey}
                    </p>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() =>
                      isEditing ? handleCancelEdit() : handleStartEdit(badge)
                    }
                    className="p-1 text-neutral-400 hover:text-neutral-600 flex-shrink-0"
                  >
                    {isEditing ? <XMarkIcon className="h-4 w-4" /> : <PencilSquareIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Edit Form */}
              {isEditing && (
                <div className="border-t border-neutral-200 p-4 bg-neutral-50 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm({ ...editForm, title: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({ ...editForm, description: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                    />
                  </div>

                  <IconPicker
                    label="Icon"
                    value={editForm.icon}
                    onChange={(icon) => setEditForm({ ...editForm, icon })}
                  />

                  <ColorSchemePicker
                    label="Color Scheme"
                    value={editForm.colorScheme}
                    onChange={(colorScheme) =>
                      setEditForm({ ...editForm, colorScheme })
                    }
                  />

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-800"
                    >
                      Cancel
                    </button>
                    <Button
                      onClick={handleSaveEdit}
                      disabled={updateBadge.isPending}
                      size="sm"
                    >
                      {updateBadge.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Achievement Badges</h2>
        <p className="text-sm text-neutral-500">
          Configure the badges that tutors can earn during onboarding
        </p>
      </div>

      {renderBadgeGroup("Step Completion Badges", stepBadges, 0)}
      {renderBadgeGroup("Streak Badges", streakBadges, stepBadges.length)}
      {renderBadgeGroup(
        "Special Achievement Badges",
        specialBadges,
        stepBadges.length + streakBadges.length
      )}

      <div className="bg-warning-light border border-warning rounded-lg p-4">
        <p className="text-sm text-warning-dark">
          <strong>Note:</strong> Badge keys and unlock conditions are tied to the
          onboarding system logic and cannot be changed through this interface.
        </p>
      </div>
    </div>
  );
}
