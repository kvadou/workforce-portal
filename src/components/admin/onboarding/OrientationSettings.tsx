"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
  PlusIcon,
  Bars3Icon,
  PencilSquareIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  useAdminConfigs,
  useUpdateAdminConfigs,
  useOrientationAgenda,
  useUpdateOrientationAgendaItem,
  useCreateOrientationAgendaItem,
  useDeleteOrientationAgendaItem,
  useReorderOrientationAgenda,
} from "@/hooks/useOnboardingConfig";

export function OrientationSettings() {
  const { data: configs, isLoading: configsLoading } = useAdminConfigs("orientation");
  const { data: agendaItems, isLoading: agendaLoading } = useOrientationAgenda();
  const updateConfigs = useUpdateAdminConfigs();
  const updateAgendaItem = useUpdateOrientationAgendaItem();
  const createAgendaItem = useCreateOrientationAgendaItem();
  const deleteAgendaItem = useDeleteOrientationAgendaItem();
  const reorderAgenda = useReorderOrientationAgenda();

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [editingAgendaId, setEditingAgendaId] = useState<string | null>(null);
  const [editAgendaForm, setEditAgendaForm] = useState({ title: "", description: "" });
  const [isAddingAgenda, setIsAddingAgenda] = useState(false);
  const [newAgendaForm, setNewAgendaForm] = useState({ title: "", description: "" });
  const [deleteAgendaId, setDeleteAgendaId] = useState<string | null>(null);

  useEffect(() => {
    if (configs) {
      const initial = configs.reduce((acc, config) => {
        acc[config.key] = config.value;
        return acc;
      }, {} as Record<string, string>);
      setFormData(initial);
    }
  }, [configs]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const updates = Object.entries(formData).map(([key, value]) => ({
      key,
      value,
    }));

    await updateConfigs.mutateAsync(updates);
    setHasChanges(false);
  };

  // Agenda handlers
  const handleStartEditAgenda = (item: NonNullable<typeof agendaItems>[number]) => {
    setEditingAgendaId(item.id);
    setEditAgendaForm({ title: item.title, description: item.description || "" });
  };

  const handleSaveAgendaEdit = async () => {
    if (!editingAgendaId) return;
    await updateAgendaItem.mutateAsync({
      id: editingAgendaId,
      title: editAgendaForm.title,
      description: editAgendaForm.description,
    });
    setEditingAgendaId(null);
  };

  const handleAddAgenda = async () => {
    if (!newAgendaForm.title.trim()) return;
    await createAgendaItem.mutateAsync({
      title: newAgendaForm.title,
      description: newAgendaForm.description,
      order: (agendaItems?.length || 0) + 1,
    });
    setNewAgendaForm({ title: "", description: "" });
    setIsAddingAgenda(false);
  };

  const handleDeleteAgenda = async (id: string) => {
    await deleteAgendaItem.mutateAsync(id);
    setDeleteAgendaId(null);
  };

  const handleMoveAgendaUp = async (index: number) => {
    if (!agendaItems || index === 0) return;
    const newOrder = [...agendaItems];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;
    await reorderAgenda.mutateAsync(
      newOrder.map((item, i) => ({ id: item.id, order: i + 1 }))
    );
  };

  const handleMoveAgendaDown = async (index: number) => {
    if (!agendaItems || index === agendaItems.length - 1) return;
    const newOrder = [...agendaItems];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;
    await reorderAgenda.mutateAsync(
      newOrder.map((item, i) => ({ id: item.id, order: i + 1 }))
    );
  };

  const isLoading = configsLoading || agendaLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 border-2 border-primary-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Settings Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              Orientation Settings
            </h2>
            <p className="text-sm text-neutral-500">
              Configure orientation session details and agenda
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={!hasChanges || updateConfigs.isPending}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              hasChanges
                ? "bg-primary-600 text-white hover:bg-primary-700"
                : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
            }`}
          >
            <CheckIcon className="h-4 w-4" />
            {updateConfigs.isPending ? "Saving..." : "Save Settings"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Duration */}
          <div className="bg-neutral-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <ClockIcon className="h-5 w-5 text-info" />
              <h3 className="font-medium text-neutral-900">Duration</h3>
            </div>
            <div className="relative">
              <input
                type="number"
                value={formData["orientation_duration_minutes"] || ""}
                onChange={(e) =>
                  handleChange("orientation_duration_minutes", e.target.value)
                }
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                placeholder="90"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">
                min
              </span>
            </div>
          </div>

          {/* Pay Rate */}
          <div className="bg-neutral-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <CurrencyDollarIcon className="h-5 w-5 text-success" />
              <h3 className="font-medium text-neutral-900">Pay Rate</h3>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                $
              </span>
              <input
                type="number"
                value={formData["orientation_pay_rate"] || ""}
                onChange={(e) =>
                  handleChange("orientation_pay_rate", e.target.value)
                }
                className="w-full pl-7 pr-12 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                placeholder="25"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">
                /hr
              </span>
            </div>
          </div>

          {/* Default Trainer */}
          <div className="bg-neutral-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <UserIcon className="h-5 w-5 text-primary-600" />
              <h3 className="font-medium text-neutral-900">Default Trainer</h3>
            </div>
            <input
              type="text"
              value={formData["orientation_trainer_name"] || ""}
              onChange={(e) =>
                handleChange("orientation_trainer_name", e.target.value)
              }
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
              placeholder="Jessica"
            />
          </div>
        </div>
      </div>

      {/* Agenda Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900">
            Orientation Agenda
          </h3>
          <button
            onClick={() => setIsAddingAgenda(true)}
            disabled={isAddingAgenda}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Item
          </button>
        </div>

        <div className="space-y-3">
          {agendaItems?.map((item, index) => {
            const isEditing = editingAgendaId === item.id;

            return (
              <div
                key={item.id}
                className={`border rounded-lg transition-all ${
                  isEditing ? "border-primary-300 bg-primary-50" : "border-neutral-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-3 p-3">
                  {/* Reorder Controls */}
                  <div className="flex flex-col items-center gap-0.5">
                    <button
                      onClick={() => handleMoveAgendaUp(index)}
                      disabled={index === 0 || reorderAgenda.isPending}
                      className="p-0.5 text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
                    >
                      <ChevronUpIcon className="h-3 w-3" />
                    </button>
                    <Bars3Icon className="h-3 w-3 text-neutral-300" />
                    <button
                      onClick={() => handleMoveAgendaDown(index)}
                      disabled={
                        index === (agendaItems?.length || 0) - 1 ||
                        reorderAgenda.isPending
                      }
                      className="p-0.5 text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
                    >
                      <ChevronDownIcon className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Number */}
                  <div className="h-6 w-6 bg-accent-pink-light text-accent-pink rounded-lg flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>

                  {/* Content */}
                  {isEditing ? (
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={editAgendaForm.title}
                        onChange={(e) =>
                          setEditAgendaForm({
                            ...editAgendaForm,
                            title: e.target.value,
                          })
                        }
                        className="w-full px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                        placeholder="Agenda item title"
                      />
                      <input
                        type="text"
                        value={editAgendaForm.description}
                        onChange={(e) =>
                          setEditAgendaForm({
                            ...editAgendaForm,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                        placeholder="Optional description"
                      />
                    </div>
                  ) : (
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900">{item.title}</p>
                      {item.description && (
                        <p className="text-sm text-neutral-500">{item.description}</p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => setEditingAgendaId(null)}
                          className="p-1.5 text-neutral-400 hover:text-neutral-600"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleSaveAgendaEdit}
                          disabled={updateAgendaItem.isPending}
                          className="p-1.5 text-success hover:text-success-dark"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartEditAgenda(item)}
                          className="p-1.5 text-neutral-400 hover:text-neutral-600"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteAgendaId(item.id)}
                          disabled={deleteAgendaItem.isPending}
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

          {/* Add New Agenda Item */}
          {isAddingAgenda && (
            <div className="border border-primary-300 bg-primary-50 rounded-lg p-3">
              <div className="space-y-2">
                <input
                  type="text"
                  value={newAgendaForm.title}
                  onChange={(e) =>
                    setNewAgendaForm({ ...newAgendaForm, title: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  placeholder="Agenda item title"
                  autoFocus
                />
                <input
                  type="text"
                  value={newAgendaForm.description}
                  onChange={(e) =>
                    setNewAgendaForm({
                      ...newAgendaForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  placeholder="Optional description"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setIsAddingAgenda(false);
                      setNewAgendaForm({ title: "", description: "" });
                    }}
                    className="px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-800"
                  >
                    Cancel
                  </button>
                  <Button
                    onClick={handleAddAgenda}
                    disabled={!newAgendaForm.title.trim() || createAgendaItem.isPending}
                    size="sm"
                  >
                    {createAgendaItem.isPending ? "Adding..." : "Add Item"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-info-light border border-info rounded-lg p-4">
        <p className="text-sm text-info-dark">
          The agenda items are shown to tutors before and during orientation sessions.
          Individual sessions with specific dates and Zoom links are managed in the{" "}
          <Link href="/admin/onboarding" className="underline hover:no-underline">
            Onboarding Content
          </Link>{" "}
          section.
        </p>
      </div>

      <ConfirmDialog
        isOpen={deleteAgendaId !== null}
        onClose={() => setDeleteAgendaId(null)}
        onConfirm={() => deleteAgendaId && handleDeleteAgenda(deleteAgendaId)}
        title="Delete Agenda Item"
        message="Are you sure you want to delete this agenda item?"
        variant="danger"
        confirmLabel="Delete"
      />
    </div>
  );
}
