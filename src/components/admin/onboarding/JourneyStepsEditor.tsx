"use client";

import { useState } from "react";
import {
  Bars3Icon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PencilSquareIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import * as LucideIcons from "lucide-react";
import type { OnboardingJourneyStep } from "@prisma/client";
import {
  useJourneySteps,
  useUpdateJourneyStep,
  useReorderJourneySteps,
} from "@/hooks/useOnboardingConfig";
import { IconPicker } from "./IconPicker";
import { StepColorPicker } from "./ColorSchemePicker";

export function JourneyStepsEditor() {
  const { data: steps, isLoading } = useJourneySteps();
  const updateStep = useUpdateJourneyStep();
  const reorderSteps = useReorderJourneySteps();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleStartEdit = (step: OnboardingJourneyStep) => {
    setEditingId(step.id);
    setEditForm({
      title: step.title,
      description: step.description,
      shortDescription: step.shortDescription || "",
      icon: step.icon,
      href: step.href,
      color: step.color,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    await updateStep.mutateAsync({
      id: editingId,
      title: editForm.title,
      description: editForm.description,
      shortDescription: editForm.shortDescription,
      icon: editForm.icon,
      href: editForm.href,
      color: editForm.color,
    });

    setEditingId(null);
    setEditForm({});
  };

  const handleMoveUp = async (index: number) => {
    if (!steps || index === 0) return;

    const newOrder = [...steps];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;

    await reorderSteps.mutateAsync(
      newOrder.map((step, i) => ({ id: step.id, order: i + 1 }))
    );
  };

  const handleMoveDown = async (index: number) => {
    if (!steps || index === steps.length - 1) return;

    const newOrder = [...steps];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;

    await reorderSteps.mutateAsync(
      newOrder.map((step, i) => ({ id: step.id, order: i + 1 }))
    );
  };

  const renderIcon = (iconName: string) => {
    const Icon = LucideIcons[iconName as keyof typeof LucideIcons] as React.ComponentType<{
      className?: string;
    }>;
    if (!Icon) return null;
    return <Icon className="h-5 w-5" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 border-2 border-primary-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Journey Steps</h2>
        <p className="text-sm text-neutral-500">
          Configure the 6 onboarding journey steps shown on the dashboard
        </p>
      </div>

      <div className="space-y-3">
        {steps?.map((step, index) => {
          const isEditing = editingId === step.id;
          const isExpanded = expandedId === step.id;

          return (
            <div
              key={step.id}
              className={`border rounded-lg transition-all ${
                isEditing
                  ? "border-primary-300 bg-primary-50"
                  : "border-neutral-200 bg-white"
              }`}
            >
              {/* Step Header */}
              <div className="flex items-center gap-3 p-4">
                {/* Drag Handle & Order Controls */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0 || reorderSteps.isPending}
                    className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
                  >
                    <ChevronUpIcon className="h-4 w-4" />
                  </button>
                  <Bars3Icon className="h-4 w-4 text-neutral-300" />
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === (steps?.length || 0) - 1 || reorderSteps.isPending}
                    className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
                  >
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Step Number */}
                <div className={`h-8 w-8 rounded-lg bg-${step.color}-100 text-${step.color}-600 flex items-center justify-center text-sm font-bold`}>
                  {index + 1}
                </div>

                {/* Icon Preview */}
                <div className={`h-10 w-10 rounded-lg bg-${step.color}-50 flex items-center justify-center text-${step.color}-600`}>
                  {renderIcon(step.icon)}
                </div>

                {/* Step Info */}
                <div className="flex-1">
                  <h3 className="font-medium text-neutral-900">{step.title}</h3>
                  <p className="text-sm text-neutral-500">{step.description}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleCancelEdit}
                        className="p-2 text-neutral-400 hover:text-neutral-600"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={updateStep.isPending}
                        className="p-2 text-success hover:text-success-dark"
                      >
                        {updateStep.isPending ? (
                          <div className="h-4 w-4 border-2 border-success border-t-green-600 rounded-full animate-spin" />
                        ) : (
                          <CheckIcon className="h-4 w-4" />
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : step.id)}
                        className="p-2 text-neutral-400 hover:text-neutral-600"
                      >
                        {isExpanded ? (
                          <ChevronUpIcon className="h-4 w-4" />
                        ) : (
                          <ChevronDownIcon className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleStartEdit(step)}
                        className="p-2 text-neutral-400 hover:text-neutral-600"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Expanded View / Edit Form */}
              {(isExpanded || isEditing) && (
                <div className="border-t border-neutral-200 p-4 bg-neutral-50">
                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) =>
                            setEditForm({ ...editForm, title: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Short Description
                        </label>
                        <input
                          type="text"
                          value={editForm.shortDescription}
                          onChange={(e) =>
                            setEditForm({ ...editForm, shortDescription: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                          placeholder="e.g., 6 videos • 2.5 hours"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm({ ...editForm, description: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                        />
                      </div>

                      <IconPicker
                        label="Icon"
                        value={editForm.icon}
                        onChange={(icon) => setEditForm({ ...editForm, icon })}
                      />

                      <StepColorPicker
                        label="Color"
                        value={editForm.color}
                        onChange={(color) => setEditForm({ ...editForm, color })}
                      />

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Link (href)
                        </label>
                        <input
                          type="text"
                          value={editForm.href}
                          onChange={(e) =>
                            setEditForm({ ...editForm, href: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                          placeholder="/onboarding/videos"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-neutral-500">Short Desc:</span>
                        <p className="font-medium">{step.shortDescription || "—"}</p>
                      </div>
                      <div>
                        <span className="text-neutral-500">Link:</span>
                        <p className="font-medium text-primary-600">{step.href}</p>
                      </div>
                      <div>
                        <span className="text-neutral-500">Required Status:</span>
                        <p className="font-medium">{step.requiredStatus}</p>
                      </div>
                      <div>
                        <span className="text-neutral-500">Completion Field:</span>
                        <p className="font-medium">{step.completionField}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-warning-light border border-warning rounded-lg p-4">
        <p className="text-sm text-warning-dark">
          <strong>Note:</strong> The Required Status and Completion Field are tied to the
          onboarding system logic and cannot be changed through this interface.
        </p>
      </div>
    </div>
  );
}
