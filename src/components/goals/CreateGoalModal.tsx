"use client";

import { useState, useEffect } from "react";
import {
  XMarkIcon,
  FlagIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import type { GoalCategory } from "@prisma/client";
import type { GoalTemplate, TutorGoal, CreateGoalInput } from "@/hooks/useGoals";
import { format, addDays, addWeeks, addMonths } from "date-fns";

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGoalInput) => Promise<void>;
  templates: GoalTemplate[];
  editingGoal?: TutorGoal | null;
  isSubmitting?: boolean;
}

const categoryOptions: { value: GoalCategory; label: string; icon: typeof FlagIcon; color: string }[] = [
  { value: "TEACHING", label: "Teaching", icon: FlagIcon, color: "bg-info-light text-info-dark border-info" },
  { value: "LEARNING", label: "Learning", icon: ArrowTrendingUpIcon, color: "bg-primary-100 text-primary-700 border-primary-200" },
  { value: "ENGAGEMENT", label: "Engagement", icon: CheckCircleIcon, color: "bg-success-light text-success-dark border-success" },
  { value: "PERFORMANCE", label: "Performance", icon: ArrowTrendingUpIcon, color: "bg-warning-light text-warning-dark border-warning" },
];

const durationOptions = [
  { label: "1 Week", value: 7 },
  { label: "2 Weeks", value: 14 },
  { label: "1 Month", value: 30 },
  { label: "3 Months", value: 90 },
  { label: "Custom", value: -1 },
];

export function CreateGoalModal({
  isOpen,
  onClose,
  onSubmit,
  templates,
  editingGoal,
  isSubmitting,
}: CreateGoalModalProps) {
  const [step, setStep] = useState<"template" | "custom">("template");
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);
  const [category, setCategory] = useState<GoalCategory>("TEACHING");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [duration, setDuration] = useState(30);
  const [customEndDate, setCustomEndDate] = useState("");

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (editingGoal) {
        setStep("custom");
        setCategory(editingGoal.category);
        setName(editingGoal.name);
        setDescription(editingGoal.description || "");
        setTargetValue(editingGoal.targetValue.toString());
        setDuration(-1);
        setCustomEndDate(format(new Date(editingGoal.endDate), "yyyy-MM-dd"));
      } else {
        setStep("template");
        setSelectedTemplate(null);
        setCategory("TEACHING");
        setName("");
        setDescription("");
        setTargetValue("");
        setDuration(30);
        setCustomEndDate(format(addMonths(new Date(), 1), "yyyy-MM-dd"));
      }
    }
  }, [isOpen, editingGoal]);

  // Update form when template selected
  useEffect(() => {
    if (selectedTemplate) {
      setCategory(selectedTemplate.category);
      setName(selectedTemplate.name);
      setDescription(selectedTemplate.description || "");
      setTargetValue(selectedTemplate.defaultTarget.toString());
    }
  }, [selectedTemplate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const startDate = new Date();
    let endDate: Date;

    if (duration === -1) {
      endDate = new Date(customEndDate);
    } else {
      endDate = addDays(startDate, duration);
    }

    await onSubmit({
      templateId: selectedTemplate?.id,
      name,
      description: description || undefined,
      category,
      targetValue: parseInt(targetValue, 10),
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    });
  };

  if (!isOpen) return null;

  const groupedTemplates = templates.reduce(
    (acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    },
    {} as Record<GoalCategory, GoalTemplate[]>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">
            {editingGoal ? "Edit Goal" : "Create New Goal"}
          </h2>
          <IconButton
            icon={XMarkIcon}
            size="sm"
            aria-label="Close dialog"
            onClick={onClose}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {!editingGoal && step === "template" ? (
            <div className="space-y-4">
              <p className="text-sm text-neutral-600">
                Choose a template to get started, or create a custom goal.
              </p>

              {/* Template Selection */}
              {Object.entries(groupedTemplates).map(([cat, catTemplates]) => {
                const categoryOption = categoryOptions.find((c) => c.value === cat);
                if (!categoryOption) return null;

                return (
                  <div key={cat}>
                    <h3 className="text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                      <categoryOption.icon className="h-4 w-4" />
                      {categoryOption.label}
                    </h3>
                    <div className="grid gap-2">
                      {catTemplates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => {
                            setSelectedTemplate(template);
                            setStep("custom");
                          }}
                          className="w-full text-left p-3 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-neutral-900">
                              {template.name}
                            </span>
                            <span className="text-xs text-neutral-500">
                              Target: {template.defaultTarget}
                            </span>
                          </div>
                          {template.description && (
                            <p className="text-sm text-neutral-500 mt-1">
                              {template.description}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Custom Goal Option */}
              <button
                onClick={() => setStep("custom")}
                className="w-full p-4 border-2 border-dashed border-neutral-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
              >
                <SparklesIcon className="h-5 w-5 text-primary-500" />
                <span className="font-medium text-neutral-700">
                  Create Custom Goal
                </span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Back to templates (only if not editing) */}
              {!editingGoal && (
                <button
                  type="button"
                  onClick={() => {
                    setStep("template");
                    setSelectedTemplate(null);
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  ← Back to templates
                </button>
              )}

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categoryOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCategory(opt.value)}
                      className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                        category === opt.value
                          ? opt.color + " border-current"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <opt.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Goal Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g., Complete 10 lessons this month"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add more details about your goal..."
                  rows={2}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              {/* Target Value */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Target Value
                </label>
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  required
                  min={1}
                  placeholder="e.g., 10"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Duration */}
              {!editingGoal && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Duration
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {durationOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDuration(opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          duration === opt.value
                            ? "bg-primary-500 text-white"
                            : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {duration === -1 && (
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="h-4 w-4 text-neutral-400" />
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        min={format(addDays(new Date(), 1), "yyyy-MM-dd")}
                        className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Edit End Date (only when editing) */}
              {editingGoal && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    End Date
                  </label>
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="h-4 w-4 text-neutral-400" />
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      min={format(new Date(), "yyyy-MM-dd")}
                      className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !name || !targetValue}>
                  {isSubmitting ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      {editingGoal ? "Updating..." : "Creating..."}
                    </>
                  ) : editingGoal ? (
                    "Update Goal"
                  ) : (
                    "Create Goal"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
