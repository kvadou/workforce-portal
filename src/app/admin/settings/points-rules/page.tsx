"use client";

import {
  ArrowPathIcon,
  BoltIcon,
  BookOpenIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  FireIcon,
  FlagIcon,
  InformationCircleIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  TrophyIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  usePointsRules,
  useCreateRule,
  useUpdateRule,
  useDeleteRule,
  useSeedDefaultRules,
  categoryConfig,
  type PointsRule,
  type CreateRuleInput,
} from "@/hooks/usePointsRules";
import type { PointsCategory } from "@prisma/client";

const categoryIcons: Record<PointsCategory, typeof TrophyIcon> = {
  TEACHING: BookOpenIcon,
  QUALITY: FlagIcon,
  LEARNING: TrophyIcon,
  ENGAGEMENT: FireIcon,
  BUSINESS: BriefcaseIcon,
};

const allCategories: PointsCategory[] = [
  "TEACHING",
  "QUALITY",
  "LEARNING",
  "ENGAGEMENT",
  "BUSINESS",
];

export default function PointsRulesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<PointsRule | null>(null);
  const [seedConfirmOpen, setSeedConfirmOpen] = useState(false);

  const { data, isLoading, error } = usePointsRules();
  const createRule = useCreateRule();
  const updateRule = useUpdateRule();
  const deleteRule = useDeleteRule();
  const seedRules = useSeedDefaultRules();

  const rules = data?.rules || [];
  const groupedRules = data?.groupedRules || {};

  const handleEditClick = (rule: PointsRule) => {
    setSelectedRule(rule);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (rule: PointsRule) => {
    setSelectedRule(rule);
    setIsDeleteModalOpen(true);
  };

  const handleSeedDefaults = async () => {
    await seedRules.mutateAsync();
    setSeedConfirmOpen(false);
  };

  if (error) {
    return (
      <div className="p-6">
        <Card className="bg-error-light border-error">
          <CardContent className="py-8 text-center">
            <XCircleIcon className="h-12 w-12 text-error mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-error-dark mb-2">Error Loading Rules</h3>
            <p className="text-error-dark">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Points Rules</h1>
          <p className="text-neutral-500">Configure how tutors earn points for different activities</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setSeedConfirmOpen(true)}
            disabled={seedRules.isPending}
          >
            {seedRules.isPending ? (
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ArrowPathIcon className="h-4 w-4 mr-2" />
            )}
            Seed Defaults
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Rule
          </Button>
        </div>
      </div>

      {/* InformationCircleIcon Card */}
      <Card className="mb-6 bg-accent-navy-light border border-accent-navy">
        <CardContent className="py-4">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 bg-accent-navy-light rounded-lg flex items-center justify-center flex-shrink-0">
              <InformationCircleIcon className="h-5 w-5 text-accent-navy" />
            </div>
            <div>
              <h3 className="font-medium text-accent-navy">How Points Work</h3>
              <p className="text-sm text-accent-navy mt-1">
                Points are awarded automatically based on these rules. Each rule has a{" "}
                <strong>trigger</strong> (unique identifier), <strong>points</strong> value, and optionally a{" "}
                <strong>threshold</strong> for tiered achievements. Rules can be toggled active/inactive.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {allCategories.map((category) => {
          const config = categoryConfig[category];
          const Icon = categoryIcons[category];
          const count = groupedRules[category]?.length || 0;
          return (
            <Card key={category} className="border border-neutral-200 shadow-sm">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg ${config.color} flex items-center justify-center`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">{count}</p>
                    <p className="text-xs text-neutral-500">{config.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Rules by Category */}
      {isLoading ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ArrowPathIcon className="h-8 w-8 text-primary-500 mx-auto mb-4 animate-spin" />
            <p className="text-neutral-500">Loading rules...</p>
          </CardContent>
        </Card>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <TrophyIcon className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Rules Configured</h3>
            <p className="text-neutral-500 mb-6">
              Get started by seeding the default rules or creating your own.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={handleSeedDefaults}>
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Seed Defaults
              </Button>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {allCategories.map((category) => {
            const categoryRules = groupedRules[category] || [];
            if (categoryRules.length === 0) return null;

            const config = categoryConfig[category];
            const Icon = categoryIcons[category];

            return (
              <Card key={category} className="border border-neutral-200 shadow-sm">
                <CardHeader className="border-b border-neutral-100">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg ${config.color} flex items-center justify-center`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-neutral-900">{config.label}</h2>
                      <p className="text-sm text-neutral-500">{config.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <div className="divide-y divide-neutral-100">
                  {categoryRules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors ${
                        !rule.isActive ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-neutral-900">{rule.name}</h3>
                          {!rule.isActive && (
                            <span className="text-xs px-2 py-0.5 rounded-lg bg-neutral-100 text-neutral-500">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-sm text-neutral-500">
                            Trigger: <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-xs">{rule.trigger}</code>
                          </p>
                          {rule.threshold && (
                            <p className="text-sm text-neutral-500">
                              Threshold: <span className="font-medium">{rule.threshold}</span>
                            </p>
                          )}
                          {rule.multiplier && (
                            <p className="text-sm text-neutral-500">
                              Multiplier: <span className="font-medium">{rule.multiplier}x</span>
                            </p>
                          )}
                        </div>
                        {rule.description && (
                          <p className="text-xs text-neutral-400 mt-1">{rule.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 px-3 py-1.5 bg-warning-light border border-warning rounded-lg">
                          <BoltIcon className="h-4 w-4 text-warning" />
                          <span className="font-bold text-warning-dark">{rule.points}</span>
                          <span className="text-xs text-warning">pts</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditClick(rule)}
                          className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit rule"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(rule)}
                          className="p-2 text-neutral-400 hover:text-error hover:bg-error-light rounded-lg transition-colors"
                          title="Delete rule"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <RuleModal
          onClose={() => setIsCreateModalOpen(false)}
          onSave={async (data) => {
            await createRule.mutateAsync(data);
            setIsCreateModalOpen(false);
          }}
          isLoading={createRule.isPending}
          error={createRule.error?.message}
        />
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedRule && (
        <RuleModal
          rule={selectedRule}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedRule(null);
          }}
          onSave={async (data) => {
            await updateRule.mutateAsync({ id: selectedRule.id, ...data });
            setIsEditModalOpen(false);
            setSelectedRule(null);
          }}
          isLoading={updateRule.isPending}
          error={updateRule.error?.message}
        />
      )}

      <ConfirmDialog
        isOpen={seedConfirmOpen}
        onClose={() => setSeedConfirmOpen(false)}
        onConfirm={handleSeedDefaults}
        title="Seed Default Rules"
        message="This will add/update default points rules. Existing rules with the same triggers will be updated. Continue?"
        confirmLabel="Seed Defaults"
      />

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedRule && (
        <DeleteRuleModal
          rule={selectedRule}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedRule(null);
          }}
          onDelete={async () => {
            await deleteRule.mutateAsync(selectedRule.id);
            setIsDeleteModalOpen(false);
            setSelectedRule(null);
          }}
          isLoading={deleteRule.isPending}
          error={deleteRule.error?.message}
        />
      )}
    </div>
  );
}

// Rule Modal (Create/Edit)
function RuleModal({
  rule,
  onClose,
  onSave,
  isLoading,
  error,
}: {
  rule?: PointsRule;
  onClose: () => void;
  onSave: (data: CreateRuleInput) => Promise<void>;
  isLoading: boolean;
  error?: string;
}) {
  const [formData, setFormData] = useState<CreateRuleInput>({
    name: rule?.name || "",
    description: rule?.description || "",
    category: rule?.category || "TEACHING",
    trigger: rule?.trigger || "",
    points: rule?.points || 10,
    threshold: rule?.threshold || undefined,
    multiplier: rule?.multiplier || undefined,
    isActive: rule?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-modal w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">
            {rule ? "Edit Rule" : "Create Rule"}
          </h2>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-600">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-error-light text-error-dark rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Monthly Lessons 40+"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value as PointsCategory }))}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>{categoryConfig[cat].label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Trigger *
              </label>
              <input
                type="text"
                required
                value={formData.trigger}
                onChange={(e) => setFormData((prev) => ({ ...prev, trigger: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., lessons_monthly_40"
                disabled={!!rule} // Can't change trigger on edit
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Points *
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.points}
                onChange={(e) => setFormData((prev) => ({ ...prev, points: parseInt(e.target.value, 10) }))}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Threshold
              </label>
              <input
                type="number"
                min={1}
                value={formData.threshold || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, threshold: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., 40"
              />
              <p className="text-xs text-neutral-400 mt-1">For tiered achievements</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Multiplier
              </label>
              <input
                type="number"
                step="0.1"
                min={0.1}
                value={formData.multiplier || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, multiplier: e.target.value ? parseFloat(e.target.value) : undefined }))}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., 1.5"
              />
              <p className="text-xs text-neutral-400 mt-1">Bonus multiplier</p>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-neutral-700">Active</span>
              </label>
              <p className="text-xs text-neutral-400 mt-1">Inactive rules don't award points</p>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={2}
                placeholder="Optional description..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  {rule ? "Update Rule" : "Create Rule"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Rule Modal
function DeleteRuleModal({
  rule,
  onClose,
  onDelete,
  isLoading,
  error,
}: {
  rule: PointsRule;
  onClose: () => void;
  onDelete: () => Promise<void>;
  isLoading: boolean;
  error?: string;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-modal w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">Delete Rule</h2>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-600">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          {error && (
            <div className="p-3 mb-4 bg-error-light text-error-dark rounded-lg text-sm">
              {error}
            </div>
          )}
          <p className="text-neutral-600 mb-4">
            Are you sure you want to delete <strong>{rule.name}</strong>? This action cannot be undone.
          </p>
          <div className="p-3 bg-warning-light rounded-lg mb-4">
            <p className="text-sm text-warning-dark">
              <strong>Note:</strong> Deleting this rule won't affect points already awarded to tutors.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete Rule
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
