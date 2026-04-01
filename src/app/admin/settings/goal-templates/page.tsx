"use client";

import {
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  CubeIcon,
  FlagIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { GoalCategory } from "@prisma/client";

interface GoalTemplate {
  id: string;
  name: string;
  description: string | null;
  category: GoalCategory;
  metricType: string;
  defaultTarget: number;
  isActive: boolean;
  createdAt: string;
}

interface TemplateFormData {
  name: string;
  description: string;
  category: GoalCategory;
  metricType: string;
  defaultTarget: number;
  isActive: boolean;
}

const categoryOptions: { value: GoalCategory; label: string; icon: typeof FlagIcon }[] = [
  { value: "TEACHING", label: "Teaching", icon: FlagIcon },
  { value: "LEARNING", label: "Learning", icon: ArrowTrendingUpIcon },
  { value: "ENGAGEMENT", label: "Engagement", icon: CheckCircleIcon },
  { value: "PERFORMANCE", label: "Performance", icon: ArrowTrendingUpIcon },
];

const categoryColors: Record<GoalCategory, string> = {
  TEACHING: "bg-info-light text-info-dark",
  LEARNING: "bg-primary-100 text-primary-700",
  ENGAGEMENT: "bg-success-light text-success-dark",
  PERFORMANCE: "bg-warning-light text-warning-dark",
};

async function fetchTemplates(): Promise<GoalTemplate[]> {
  const response = await fetch("/api/admin/goals/templates");
  if (!response.ok) throw new Error("Failed to fetch templates");
  return response.json();
}

async function createTemplate(data: TemplateFormData): Promise<GoalTemplate> {
  const response = await fetch("/api/admin/goals/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create template");
  return response.json();
}

async function updateTemplate(
  id: string,
  data: Partial<TemplateFormData>
): Promise<GoalTemplate> {
  const response = await fetch(`/api/admin/goals/templates/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update template");
  return response.json();
}

async function deleteTemplate(id: string): Promise<void> {
  const response = await fetch(`/api/admin/goals/templates/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete template");
}

export default function GoalTemplatesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<GoalTemplate | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>({
    name: "",
    description: "",
    category: "TEACHING",
    metricType: "count",
    defaultTarget: 10,
    isActive: true,
  });

  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ["adminGoalTemplates"],
    queryFn: fetchTemplates,
  });

  const createMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminGoalTemplates"] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TemplateFormData> }) =>
      updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminGoalTemplates"] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminGoalTemplates"] });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingTemplate(null);
    setFormData({
      name: "",
      description: "",
      category: "TEACHING",
      metricType: "count",
      defaultTarget: 10,
      isActive: true,
    });
  };

  const handleEdit = (template: GoalTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      category: template.category,
      metricType: template.metricType,
      defaultTarget: template.defaultTarget,
      isActive: template.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTemplate) {
      await updateMutation.mutateAsync({ id: editingTemplate.id, data: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    setDeleteTemplateId(null);
  };

  const handleToggleActive = async (template: GoalTemplate) => {
    await updateMutation.mutateAsync({
      id: template.id,
      data: { isActive: !template.isActive },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ArrowPathIcon className="h-8 w-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  // Group templates by category
  const groupedTemplates = (templates || []).reduce(
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <FlagIcon className="h-7 w-7 text-primary-500" />
            Goal Templates
          </h1>
          <p className="text-neutral-600 mt-1">
            Manage goal templates that tutors can use to create goals
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Template
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-modal w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              {editingTemplate ? "Edit Template" : "Create Template"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Complete 10 lessons"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="Describe what this goal helps achieve..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as GoalCategory })
                  }
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Metric Type
                  </label>
                  <select
                    value={formData.metricType}
                    onChange={(e) => setFormData({ ...formData, metricType: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="count">Count</option>
                    <option value="hours">Hours</option>
                    <option value="percentage">Percentage</option>
                    <option value="rating">Rating</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Default FlagIcon
                  </label>
                  <input
                    type="number"
                    value={formData.defaultTarget}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultTarget: parseInt(e.target.value, 10) })
                    }
                    min={1}
                    required
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">Active (visible to tutors)</span>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : editingTemplate ? (
                    "Update"
                  ) : (
                    "Create"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Templates List by Category */}
      {Object.entries(groupedTemplates).length > 0 ? (
        <div className="space-y-6">
          {categoryOptions.map((cat) => {
            const catTemplates = groupedTemplates[cat.value];
            if (!catTemplates?.length) return null;

            return (
              <div key={cat.value}>
                <h2 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                  <cat.icon className="h-5 w-5" />
                  {cat.label}
                </h2>
                <div className="bg-white border border-neutral-200 rounded-lg divide-y divide-neutral-100">
                  {catTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-4 flex items-center justify-between gap-4 ${
                        !template.isActive ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-neutral-900">
                            {template.name}
                          </h3>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-lg ${categoryColors[template.category]}`}
                          >
                            {template.category.toLowerCase()}
                          </span>
                          {!template.isActive && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-lg bg-neutral-100 text-neutral-500">
                              Inactive
                            </span>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-sm text-neutral-500 mt-0.5 truncate">
                            {template.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-1 text-xs text-neutral-400">
                          <span>FlagIcon: {template.defaultTarget}</span>
                          <span>Type: {template.metricType}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(template)}
                          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                          title={template.isActive ? "Deactivate" : "Activate"}
                        >
                          {template.isActive ? (
                            <CubeIcon className="h-5 w-5 text-success" />
                          ) : (
                            <CubeIcon className="h-5 w-5 text-neutral-400" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(template)}
                          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                          <PencilSquareIcon className="h-4 w-4 text-neutral-400" />
                        </button>
                        <button
                          onClick={() => setDeleteTemplateId(template.id)}
                          disabled={deleteMutation.isPending}
                          className="p-2 hover:bg-error-light rounded-lg transition-colors text-error"
                        >
                          {deleteMutation.isPending ? (
                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                          ) : (
                            <TrashIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center">
          <FlagIcon className="h-12 w-12 text-neutral-200 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-neutral-900 mb-1">
            No templates yet
          </h3>
          <p className="text-neutral-500 mb-4">
            Create goal templates for tutors to use
          </p>
          <Button onClick={() => setShowForm(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create First Template
          </Button>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteTemplateId !== null}
        onClose={() => setDeleteTemplateId(null)}
        onConfirm={() => deleteTemplateId && handleDelete(deleteTemplateId)}
        title="Delete Template"
        message="Are you sure you want to delete this template?"
        variant="danger"
        confirmLabel="Delete"
      />
    </div>
  );
}
