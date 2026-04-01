"use client";

import { useState } from "react";
import {
  ChatBubbleLeftIcon,
  PlusIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import type { TutorNoteType } from "@prisma/client";
import type { AdminTutorOverview } from "@/hooks/useTutorProfiles";
import {
  useAddNote,
  useTutorCharges,
  useChargeCategories,
  useCreateCharge,
} from "@/hooks/useTutorProfiles";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

/* ─── Constants ─── */

const noteTypeLabels: Record<TutorNoteType, string> = {
  GENERAL: "General",
  PERFORMANCE: "Performance",
  INCIDENT: "Incident",
  FEEDBACK: "Feedback",
  ADMIN: "Admin",
};

const noteTypeBadgeColors: Record<TutorNoteType, string> = {
  GENERAL: "bg-neutral-100 text-neutral-700",
  PERFORMANCE: "bg-info-light text-info-dark",
  INCIDENT: "bg-error-light text-error-dark",
  FEEDBACK: "bg-warning-light text-warning-dark",
  ADMIN: "bg-primary-100 text-primary-700",
};

/* ─── Props ─── */

interface CommunicationsTabProps {
  tutor: AdminTutorOverview;
}

/* ─── Main Component ─── */

export default function CommunicationsTab({ tutor }: CommunicationsTabProps) {
  // Notes state
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState<{ content: string; type: TutorNoteType }>({
    content: "",
    type: "GENERAL",
  });
  const [filterType, setFilterType] = useState<TutorNoteType | "ALL">("ALL");

  // Charge state
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [chargeForm, setChargeForm] = useState({
    category_id: "",
    description: "",
    date_occurred: new Date().toISOString().split("T")[0],
    pay_contractor: "",
  });

  const addNoteMutation = useAddNote();
  const { data: chargesData, isLoading: chargesLoading } = useTutorCharges(tutor.id);
  const { data: categoriesData } = useChargeCategories();
  const createChargeMutation = useCreateCharge();

  const charges = chargesData?.charges || [];
  const categories = categoriesData?.categories || [];

  const handleAddNote = async () => {
    if (!newNote.content.trim()) return;
    await addNoteMutation.mutateAsync({
      tutorProfileId: tutor.id,
      data: { content: newNote.content, type: newNote.type },
    });
    setNewNote({ content: "", type: "GENERAL" });
    setShowAddNote(false);
  };

  const handleAddCharge = async () => {
    if (!chargeForm.category_id || !chargeForm.description.trim() || !chargeForm.pay_contractor) return;
    await createChargeMutation.mutateAsync({
      tutorProfileId: tutor.id,
      data: {
        category_id: Number(chargeForm.category_id),
        description: chargeForm.description,
        date_occurred: chargeForm.date_occurred,
        pay_contractor: Number(chargeForm.pay_contractor),
      },
    });
    setChargeForm({
      category_id: "",
      description: "",
      date_occurred: new Date().toISOString().split("T")[0],
      pay_contractor: "",
    });
    setShowAddCharge(false);
  };

  const notes = tutor.notes || [];
  const filteredNotes = filterType === "ALL"
    ? notes
    : notes.filter((n) => n.type === filterType);

  return (
    <div className="space-y-4">
      {/* Notes Section */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm">
        <div className="flex items-center justify-between p-4 pb-0">
          <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
            <ChatBubbleLeftIcon className="h-5 w-5 text-info" />
            Notes
            <span className="text-xs text-neutral-400 font-normal">({notes.length})</span>
          </h3>
          <Button size="sm" variant="outline" onClick={() => setShowAddNote(true)}>
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Note
          </Button>
        </div>

        <div className="p-4">
          {/* Add Note Form */}
          {showAddNote && (
            <div className="mb-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="flex gap-2 mb-2">
                <select
                  value={newNote.type}
                  onChange={(e) => setNewNote({ ...newNote, type: e.target.value as TutorNoteType })}
                  className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm"
                >
                  {Object.entries(noteTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <textarea
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                placeholder="Write a note..."
                className="w-full p-3 border border-neutral-300 rounded-lg min-h-[100px] text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => setShowAddNote(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddNote} disabled={addNoteMutation.isPending}>
                  {addNoteMutation.isPending ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    "Add Note"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Filter */}
          {notes.length > 0 && (
            <div className="flex gap-1.5 mb-3 flex-wrap">
              <FilterChip label="All" active={filterType === "ALL"} onClick={() => setFilterType("ALL")} />
              {(Object.keys(noteTypeLabels) as TutorNoteType[]).map((type) => {
                const count = notes.filter((n) => n.type === type).length;
                if (count === 0) return null;
                return (
                  <FilterChip
                    key={type}
                    label={`${noteTypeLabels[type]} (${count})`}
                    active={filterType === type}
                    onClick={() => setFilterType(type)}
                  />
                );
              })}
            </div>
          )}

          {/* Note List */}
          {filteredNotes.length > 0 ? (
            <div className="space-y-2">
              {filteredNotes.map((note) => (
                <div key={note.id} className="p-3 border border-neutral-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${noteTypeBadgeColors[note.type]}`}>
                      {noteTypeLabels[note.type]}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {note.createdByName} &middot; {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-700 whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
            </div>
          ) : (
            !showAddNote && (
              <EmptyState
                icon={<ChatBubbleLeftIcon className="h-10 w-10 text-neutral-300" />}
                message={filterType === "ALL" ? "No notes yet" : `No ${noteTypeLabels[filterType as TutorNoteType].toLowerCase()} notes`}
              />
            )
          )}
        </div>
      </div>

      {/* Ad-Hoc Charges & Adjustments */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm">
        <div className="flex items-center justify-between p-4 pb-0">
          <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
            <CurrencyDollarIcon className="h-5 w-5 text-success" />
            Ad-Hoc Charges & Adjustments
            {charges.length > 0 && (
              <span className="text-xs text-neutral-400 font-normal">({charges.length})</span>
            )}
          </h3>
          {tutor.tutorCruncherId && (
            <Button size="sm" variant="outline" onClick={() => setShowAddCharge(true)}>
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Charge
            </Button>
          )}
        </div>
        <div className="p-4">
          {/* Add Charge Form */}
          {showAddCharge && (
            <div className="mb-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">Category</label>
                  <select
                    value={chargeForm.category_id}
                    onChange={(e) => setChargeForm({ ...chargeForm, category_id: e.target.value })}
                    className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">Date</label>
                  <input
                    type="date"
                    value={chargeForm.date_occurred}
                    onChange={(e) => setChargeForm({ ...chargeForm, date_occurred: e.target.value })}
                    className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">Description</label>
                  <input
                    type="text"
                    value={chargeForm.description}
                    onChange={(e) => setChargeForm({ ...chargeForm, description: e.target.value })}
                    placeholder="Charge description"
                    className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">Pay Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={chargeForm.pay_contractor}
                    onChange={(e) => setChargeForm({ ...chargeForm, pay_contractor: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => setShowAddCharge(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddCharge}
                  disabled={createChargeMutation.isPending || !chargeForm.category_id || !chargeForm.description}
                >
                  {createChargeMutation.isPending ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    "Add Charge"
                  )}
                </Button>
              </div>
            </div>
          )}

          {chargesLoading ? (
            <div className="py-6"><LoadingSpinner /></div>
          ) : charges.length === 0 && !showAddCharge ? (
            <EmptyState
              icon={<CurrencyDollarIcon className="h-10 w-10 text-neutral-300" />}
              message="No ad-hoc charges"
            />
          ) : charges.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="text-left py-2 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Date</th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Category</th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Description</th>
                    <th className="text-right py-2 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {charges.map((charge) => (
                    <tr key={charge.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                      <td className="py-2 px-4 text-sm text-neutral-700 whitespace-nowrap">
                        {new Date(charge.date_occurred).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-4">
                        <span className="text-xs px-2 py-0.5 rounded-lg font-medium bg-neutral-100 text-neutral-700">
                          {charge.category_name}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-sm text-neutral-700">{charge.description}</td>
                      <td className="py-2 px-4 text-sm font-medium text-right tabular-nums whitespace-nowrap">
                        <span className={Number(charge.pay_contractor) >= 0 ? "text-success" : "text-error"}>
                          {Number(charge.pay_contractor) >= 0 ? "+" : ""}${Number(charge.pay_contractor).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
        active ? "bg-primary-500 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
      }`}
    >
      {label}
    </button>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center py-6">
      {icon}
      <p className="text-xs text-neutral-400 mt-1.5">{message}</p>
    </div>
  );
}
