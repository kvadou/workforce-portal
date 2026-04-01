"use client";

import { useState } from "react";
import {
  PlusIcon,
  Bars3Icon,
  PencilSquareIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CheckIcon,
  XMarkIcon,
  LanguageIcon,
  HeartIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  useDropdownOptions,
  useCreateDropdownOption,
  useDeleteDropdownOption,
  useUpdateDropdownOptions,
} from "@/hooks/useOnboardingConfig";
import type { OnboardingDropdownOption } from "@prisma/client";

type CategoryConfig = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
};

const CATEGORIES: CategoryConfig[] = [
  {
    key: "language",
    label: "Languages",
    icon: LanguageIcon,
    description: "Languages tutors can speak",
  },
  {
    key: "relationship",
    label: "Emergency Contact Relationships",
    icon: HeartIcon,
    description: "Relationship types for emergency contacts",
  },
  {
    key: "business_type",
    label: "Business Types (W-9)",
    icon: BuildingOfficeIcon,
    description: "Federal tax classifications for W-9 form",
  },
];

export function DropdownOptionsEditor() {
  const [activeCategory, setActiveCategory] = useState<string>("language");
  const { data, isLoading } = useDropdownOptions();
  const createOption = useCreateDropdownOption();
  const deleteOption = useDeleteDropdownOption();
  const updateOptions = useUpdateDropdownOptions();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ value: "", label: "" });
  const [isAdding, setIsAdding] = useState(false);
  const [newForm, setNewForm] = useState({ value: "", label: "" });
  const [deleteOptionId, setDeleteOptionId] = useState<string | null>(null);

  const currentOptions = data?.grouped?.[activeCategory] || [];
  const fullOptions =
    data?.options?.filter((opt) => opt.fieldKey === activeCategory) || [];

  const handleStartEdit = (option: OnboardingDropdownOption) => {
    setEditingId(option.id);
    setEditForm({ value: option.value, label: option.label });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    const updatedOptions = fullOptions.map((opt, index) =>
      opt.id === editingId
        ? { id: opt.id, value: editForm.value, label: editForm.label, order: index }
        : { id: opt.id, value: opt.value, label: opt.label, order: index }
    );

    await updateOptions.mutateAsync({
      fieldKey: activeCategory,
      options: updatedOptions,
    });

    setEditingId(null);
  };

  const handleAdd = async () => {
    if (!newForm.value.trim() || !newForm.label.trim()) return;

    await createOption.mutateAsync({
      fieldKey: activeCategory,
      value: newForm.value.toLowerCase().replace(/\s+/g, "_"),
      label: newForm.label,
      order: fullOptions.length,
    });

    setNewForm({ value: "", label: "" });
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    await deleteOption.mutateAsync(id);
    setDeleteOptionId(null);
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;

    const newOrder = [...fullOptions];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;

    await updateOptions.mutateAsync({
      fieldKey: activeCategory,
      options: newOrder.map((opt, i) => ({
        id: opt.id,
        value: opt.value,
        label: opt.label,
        order: i,
      })),
    });
  };

  const handleMoveDown = async (index: number) => {
    if (index === fullOptions.length - 1) return;

    const newOrder = [...fullOptions];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;

    await updateOptions.mutateAsync({
      fieldKey: activeCategory,
      options: newOrder.map((opt, i) => ({
        id: opt.id,
        value: opt.value,
        label: opt.label,
        order: i,
      })),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 border-2 border-primary-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  const activeCategoryConfig = CATEGORIES.find((c) => c.key === activeCategory);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Dropdown Options</h2>
        <p className="text-sm text-neutral-500">
          Manage the options available in form dropdowns throughout onboarding
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 border-b border-neutral-200">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.key;
          const count = data?.grouped?.[category.key]?.length || 0;

          return (
            <button
              key={category.key}
              onClick={() => setActiveCategory(category.key)}
              className={`flex items-center gap-2 px-4 py-2 -mb-px border-b-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {category.label}
              <span
                className={`px-1.5 py-0.5 rounded text-xs ${
                  isActive
                    ? "bg-primary-100 text-primary-600"
                    : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Options List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">{activeCategoryConfig?.description}</p>
          <button
            onClick={() => setIsAdding(true)}
            disabled={isAdding}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Option
          </button>
        </div>

        <div className="space-y-2">
          {fullOptions.map((option, index) => {
            const isEditing = editingId === option.id;

            return (
              <div
                key={option.id}
                className={`border rounded-lg transition-all ${
                  isEditing
                    ? "border-primary-300 bg-primary-50"
                    : "border-neutral-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-3 p-3">
                  {/* Reorder Controls */}
                  <div className="flex flex-col items-center gap-0.5">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0 || updateOptions.isPending}
                      className="p-0.5 text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
                    >
                      <ChevronUpIcon className="h-3 w-3" />
                    </button>
                    <Bars3Icon className="h-3 w-3 text-neutral-300" />
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={
                        index === fullOptions.length - 1 || updateOptions.isPending
                      }
                      className="p-0.5 text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
                    >
                      <ChevronDownIcon className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Content */}
                  {isEditing ? (
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">
                          Value (internal)
                        </label>
                        <input
                          type="text"
                          value={editForm.value}
                          onChange={(e) =>
                            setEditForm({ ...editForm, value: e.target.value })
                          }
                          className="w-full px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">
                          Label (displayed)
                        </label>
                        <input
                          type="text"
                          value={editForm.label}
                          onChange={(e) =>
                            setEditForm({ ...editForm, label: e.target.value })
                          }
                          className="w-full px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center gap-4">
                      <div>
                        <p className="font-medium text-neutral-900">{option.label}</p>
                        <p className="text-xs text-neutral-500 font-mono">
                          {option.value}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 text-neutral-400 hover:text-neutral-600"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          disabled={updateOptions.isPending}
                          className="p-1.5 text-success hover:text-success-dark"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartEdit(option)}
                          className="p-1.5 text-neutral-400 hover:text-neutral-600"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteOptionId(option.id)}
                          disabled={deleteOption.isPending}
                          className="p-1.5 text-neutral-400 hover:text-error"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add New Option */}
          {isAdding && (
            <div className="border border-primary-300 bg-primary-50 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">
                    Value (internal, lowercase, no spaces)
                  </label>
                  <input
                    type="text"
                    value={newForm.value}
                    onChange={(e) =>
                      setNewForm({
                        ...newForm,
                        value: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                      })
                    }
                    className="w-full px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500 font-mono"
                    placeholder="e.g., new_option"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">
                    Label (displayed to users)
                  </label>
                  <input
                    type="text"
                    value={newForm.label}
                    onChange={(e) =>
                      setNewForm({ ...newForm, label: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                    placeholder="e.g., New Option"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewForm({ value: "", label: "" });
                  }}
                  className="px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-800"
                >
                  Cancel
                </button>
                <Button
                  onClick={handleAdd}
                  disabled={
                    !newForm.value.trim() ||
                    !newForm.label.trim() ||
                    createOption.isPending
                  }
                  size="sm"
                >
                  {createOption.isPending ? "Adding..." : "Add Option"}
                </Button>
              </div>
            </div>
          )}

          {fullOptions.length === 0 && !isAdding && (
            <div className="text-center py-8 text-neutral-500">
              <p>No options yet. Click "Add Option" to create one.</p>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-warning-light border border-warning rounded-lg p-4">
        <p className="text-sm text-warning-dark">
          <strong>Note:</strong> The "value" is stored in the database and should not
          be changed after tutors have selected it. Only edit labels to fix typos or
          improve clarity.
        </p>
      </div>

      <ConfirmDialog
        isOpen={deleteOptionId !== null}
        onClose={() => setDeleteOptionId(null)}
        onConfirm={() => deleteOptionId && handleDelete(deleteOptionId)}
        title="Delete Option"
        message="Are you sure you want to delete this option?"
        variant="danger"
        confirmLabel="Delete"
      />
    </div>
  );
}
