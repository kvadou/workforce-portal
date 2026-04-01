"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  XMarkIcon,
  UserPlusIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { useAddCohortMembers } from "@/hooks/useCohorts";

interface AddCohortMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  cohortId: string;
  existingMemberIds: string[];
  onSuccess: () => void;
}

interface TutorSearchResult {
  id: string;
  status: string;
  team: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
    headshotUrl: string | null;
  };
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-success-light text-success-dark",
  INACTIVE: "bg-neutral-100 text-neutral-600",
  ONBOARDING: "bg-info-light text-info-dark",
  PENDING: "bg-warning-light text-warning-dark",
  TERMINATED: "bg-error-light text-error-dark",
  QUIT: "bg-accent-orange-light text-accent-orange",
};

export function AddCohortMembersModal({
  isOpen,
  onClose,
  cohortId,
  existingMemberIds,
  onSuccess,
}: AddCohortMembersModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<TutorSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const addMembers = useAddCohortMembers();

  // Debounce search input
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Fetch search results
  const fetchResults = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        search: query,
        limit: "20",
      });
      const res = await fetch(`/api/admin/tutors?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to search tutors");
      const data = await res.json();
      setResults(data.tutors ?? []);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    fetchResults(debouncedQuery);
  }, [debouncedQuery, fetchResults]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setDebouncedQuery("");
      setResults([]);
      setSelectedIds(new Set());
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter out existing members
  const filteredResults = results.filter(
    (t) => !existingMemberIds.includes(t.id)
  );

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return;
    setError(null);

    try {
      await addMembers.mutateAsync({
        cohortId,
        tutorProfileIds: Array.from(selectedIds),
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add members");
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarUrl = (tutor: TutorSearchResult) => {
    return tutor.user.headshotUrl || tutor.user.avatarUrl || null;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-modal w-full max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <UserPlusIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-heading-md text-neutral-900">
                  Add Members
                </h2>
                <p className="text-body-sm text-neutral-500">
                  Search and add tutors to this cohort
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-neutral-500" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            {error && (
              <div className="p-3 bg-error-light border border-error rounded-lg text-error-dark text-body-sm">
                {error}
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Search by name or email..."
                autoFocus
              />
              {isSearching && (
                <ArrowPathIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 animate-spin" />
              )}
            </div>

            {/* Results */}
            <div className="max-h-72 overflow-y-auto border border-neutral-200 rounded-lg divide-y divide-neutral-100">
              {!debouncedQuery.trim() ? (
                <div className="p-8 text-center text-body-sm text-neutral-500">
                  Type a name or email to search tutors
                </div>
              ) : isSearching ? (
                <div className="p-8 text-center">
                  <ArrowPathIcon className="h-5 w-5 animate-spin text-neutral-400 mx-auto" />
                  <p className="text-body-sm text-neutral-500 mt-2">
                    Searching...
                  </p>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="p-8 text-center text-body-sm text-neutral-500">
                  {results.length > 0 && filteredResults.length === 0
                    ? "All matching tutors are already in this cohort"
                    : "No tutors found"}
                </div>
              ) : (
                filteredResults.map((tutor) => {
                  const isSelected = selectedIds.has(tutor.id);
                  const avatarUrl = getAvatarUrl(tutor);

                  return (
                    <button
                      key={tutor.id}
                      type="button"
                      onClick={() => toggleSelection(tutor.id)}
                      className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                        isSelected
                          ? "bg-primary-50"
                          : "hover:bg-neutral-50"
                      }`}
                    >
                      {/* Checkbox */}
                      <div
                        className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected
                            ? "bg-primary-600 border-primary-600"
                            : "border-neutral-300"
                        }`}
                      >
                        {isSelected && (
                          <CheckIcon className="h-3 w-3 text-white" />
                        )}
                      </div>

                      {/* Avatar */}
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={tutor.user.name || ""}
                          className="h-9 w-9 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-primary-700">
                            {getInitials(tutor.user.name)}
                          </span>
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-body-sm font-medium text-neutral-900 truncate">
                            {tutor.user.name || "Unnamed"}
                          </span>
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${
                              STATUS_COLORS[tutor.status] ||
                              "bg-neutral-100 text-neutral-600"
                            }`}
                          >
                            {tutor.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <span className="truncate">{tutor.user.email}</span>
                          {tutor.team && (
                            <>
                              <span className="text-neutral-300">|</span>
                              <span>{tutor.team}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Selected count */}
            {selectedIds.size > 0 && (
              <div className="text-body-sm text-primary-700 font-medium">
                {selectedIds.size} tutor{selectedIds.size !== 1 ? "s" : ""}{" "}
                selected
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-body-sm text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              disabled={addMembers.isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={selectedIds.size === 0 || addMembers.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-body-sm font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {addMembers.isPending ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlusIcon className="h-4 w-4" />
                  Add Selected ({selectedIds.size})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
