"use client";

import {
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PhoneIcon,
  StarIcon,
  StopIcon,
  TagIcon,
  TrophyIcon,
  UsersIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTutorProfiles, useBulkTutorAction, useTutorLabels } from "@/hooks/useTutorProfiles";
import type { TutorStatus, TutorTeam } from "@prisma/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const statusConfig: Record<
  TutorStatus,
  { label: string; icon: typeof CheckCircleIcon; color: string; bgColor: string }
> = {
  PENDING: {
    label: "Pending",
    icon: ClockIcon,
    color: "text-warning",
    bgColor: "bg-warning-light",
  },
  ACTIVE: {
    label: "Active",
    icon: CheckCircleIcon,
    color: "text-success",
    bgColor: "bg-success-light",
  },
  INACTIVE: {
    label: "Inactive",
    icon: ExclamationCircleIcon,
    color: "text-neutral-500",
    bgColor: "bg-neutral-100",
  },
  QUIT: {
    label: "Quit",
    icon: XCircleIcon,
    color: "text-accent-orange",
    bgColor: "bg-accent-orange-light",
  },
  TERMINATED: {
    label: "Terminated",
    icon: XCircleIcon,
    color: "text-error",
    bgColor: "bg-error-light",
  },
};

const teamConfig: Record<TutorTeam, { label: string; color: string }> = {
  LA: { label: "Los Angeles", color: "bg-info-light text-info-dark" },
  NYC: { label: "New York", color: "bg-primary-100 text-primary-700" },
  SF: { label: "San Francisco", color: "bg-success-light text-success-dark" },
  ONLINE: { label: "Online", color: "bg-accent-navy-light text-accent-navy" },
  WESTSIDE: { label: "Westside", color: "bg-warning-light text-warning-dark" },
  EASTSIDE: { label: "Eastside", color: "bg-accent-pink-light text-accent-pink" },
};

interface FilterPreset {
  name: string;
  filters: {
    status?: TutorStatus;
    team?: TutorTeam;
    labels?: string[];
    certifications?: ("school" | "bq" | "playgroup")[];
    minLessons?: number;
    maxLessons?: number;
  };
}

const STORAGE_KEY = "tutorFilterPresets";

// Type for the quick filter tabs
type QuickFilter = "all" | "pending" | "approved" | "rejected" | "dormant";

export default function TutorsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<TutorStatus | "">("ACTIVE"); // Default to Active
  const [selectedTeam, setSelectedTeam] = useState<TutorTeam | "">("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("approved"); // Track which card is selected
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedCerts, setSelectedCerts] = useState<("school" | "bq" | "playgroup")[]>([]);
  const [minLessons, setMinLessons] = useState<number | undefined>();
  const [maxLessons, setMaxLessons] = useState<number | undefined>();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkLabel, setShowBulkLabel] = useState(false);
  const [bulkLabel, setBulkLabel] = useState({ name: "", color: "#6366f1" });
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Load filter presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setFilterPresets(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved presets", e);
      }
    }
  }, []);

  const { data: labelsData } = useTutorLabels();
  const availableLabels = labelsData?.labels || [];

  // Handle quick filter selection
  const handleQuickFilter = (filter: QuickFilter) => {
    setQuickFilter(filter);
    setCurrentPage(1); // Reset to first page
    // Reset other filters when using quick filters
    setSelectedLabels([]);

    switch (filter) {
      case "all":
        setSelectedStatus("");
        break;
      case "pending":
        setSelectedStatus("PENDING");
        break;
      case "approved":
        setSelectedStatus("ACTIVE");
        break;
      case "rejected":
        setSelectedStatus("INACTIVE");
        setSelectedLabels(["Rejected"]);
        break;
      case "dormant":
        setSelectedStatus("INACTIVE");
        setSelectedLabels(["Dormant"]);
        break;
    }
  };

  // Build labels for API - merge quick filter labels with manually selected labels
  const effectiveLabels = selectedLabels.length > 0 ? selectedLabels : undefined;

  const { data, isLoading, error } = useTutorProfiles({
    search: search || undefined,
    status: selectedStatus || undefined,
    team: selectedTeam || undefined,
    labels: effectiveLabels,
    certifications: selectedCerts.length > 0 ? selectedCerts : undefined,
    minLessons,
    maxLessons,
    page: currentPage,
  });

  const bulkActionMutation = useBulkTutorAction();

  const hasActiveFilters = (selectedStatus && quickFilter !== "approved") || selectedTeam ||
    (selectedLabels.length > 0 && quickFilter === "all") ||
    selectedCerts.length > 0 || minLessons !== undefined || maxLessons !== undefined;

  const clearAllFilters = () => {
    setQuickFilter("approved");
    setSelectedStatus("ACTIVE");
    setSelectedTeam("");
    setSelectedLabels([]);
    setSelectedCerts([]);
    setMinLessons(undefined);
    setMaxLessons(undefined);
    setCurrentPage(1);
  };

  const saveFilterPreset = () => {
    if (!presetName.trim()) return;
    const newPreset: FilterPreset = {
      name: presetName.trim(),
      filters: {
        status: selectedStatus || undefined,
        team: selectedTeam || undefined,
        labels: selectedLabels.length > 0 ? selectedLabels : undefined,
        certifications: selectedCerts.length > 0 ? selectedCerts : undefined,
        minLessons,
        maxLessons,
      },
    };
    const updated = [...filterPresets, newPreset];
    setFilterPresets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setPresetName("");
    setShowSavePreset(false);
  };

  const loadFilterPreset = (preset: FilterPreset) => {
    setSelectedStatus(preset.filters.status || "");
    setSelectedTeam(preset.filters.team || "");
    setSelectedLabels(preset.filters.labels || []);
    setSelectedCerts(preset.filters.certifications || []);
    setMinLessons(preset.filters.minLessons);
    setMaxLessons(preset.filters.maxLessons);
  };

  const deleteFilterPreset = (name: string) => {
    const updated = filterPresets.filter((p) => p.name !== name);
    setFilterPresets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const toggleLabel = (label: string) => {
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const toggleCert = (cert: "school" | "bq" | "playgroup") => {
    setSelectedCerts((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
  };

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawStats = data?.stats as any || {};
  const stats = {
    byStatus: rawStats.byStatus || {},
    byTeam: rawStats.byTeam || {},
    byLabel: rawStats.byLabel || { rejected: 0, dormant: 0 },
    total: rawStats.total || 0,
  };
  const tutors = data?.tutors || [];
  const pagination = data?.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 };

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

  const toggleSelectAll = () => {
    if (selectedIds.size === tutors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tutors.map((t) => t.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setShowBulkLabel(false);
    setBulkLabel({ name: "", color: "#6366f1" });
  };

  const handleBulkStatus = async (status: TutorStatus) => {
    await bulkActionMutation.mutateAsync({
      tutorIds: Array.from(selectedIds),
      action: "updateStatus",
      data: { status },
    });
    clearSelection();
  };

  const handleBulkTeam = async (team: TutorTeam) => {
    await bulkActionMutation.mutateAsync({
      tutorIds: Array.from(selectedIds),
      action: "updateTeam",
      data: { team },
    });
    clearSelection();
  };

  const handleBulkAddLabel = async () => {
    if (!bulkLabel.name.trim()) return;
    await bulkActionMutation.mutateAsync({
      tutorIds: Array.from(selectedIds),
      action: "addLabel",
      data: { name: bulkLabel.name.trim(), color: bulkLabel.color },
    });
    clearSelection();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-heading-lg text-neutral-900">Tutor Management</h1>
          <p className="text-body text-neutral-500">
            Manage tutor profiles, certifications, and performance
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/tutors/teams">
            <Button variant="outline">
              <MapPinIcon className="h-4 w-4 mr-2" />
              Team Dashboard
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => {
              const params = new URLSearchParams();
              if (search) params.append("search", search);
              if (selectedStatus) params.append("status", selectedStatus);
              if (selectedTeam) params.append("team", selectedTeam);
              if (selectedLabels.length > 0) params.append("labels", selectedLabels.join(","));
              if (selectedCerts.length > 0) params.append("certification", selectedCerts.join(","));
              if (minLessons !== undefined) params.append("minLessons", minLessons.toString());
              if (maxLessons !== undefined) params.append("maxLessons", maxLessons.toString());
              window.open(`/api/admin/tutors/export?${params.toString()}`, "_blank");
            }}
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {[
          {
            key: "all" as QuickFilter,
            label: "All",
            value: stats.total || Object.values(stats.byStatus as Record<string, number>).reduce((a, b) => a + b, 0),
            icon: UsersIcon,
            color: "bg-neutral-100 text-neutral-600",
            activeColor: "bg-neutral-200 ring-2 ring-neutral-400",
          },
          {
            key: "pending" as QuickFilter,
            label: "Pending",
            value: stats.byStatus.PENDING || 0,
            icon: ClockIcon,
            color: "bg-warning-light text-warning",
            activeColor: "bg-warning-light ring-2 ring-warning",
          },
          {
            key: "approved" as QuickFilter,
            label: "Approved",
            value: stats.byStatus.ACTIVE || 0,
            icon: CheckCircleIcon,
            color: "bg-success-light text-success",
            activeColor: "bg-success-light ring-2 ring-success",
          },
          {
            key: "rejected" as QuickFilter,
            label: "Rejected",
            value: stats.byLabel?.rejected || 0,
            icon: XCircleIcon,
            color: "bg-error-light text-error",
            activeColor: "bg-error-light ring-2 ring-error",
          },
          {
            key: "dormant" as QuickFilter,
            label: "Dormant",
            value: stats.byLabel?.dormant || 0,
            icon: ExclamationCircleIcon,
            color: "bg-neutral-100 text-neutral-500",
            activeColor: "bg-neutral-200 ring-2 ring-neutral-400",
          },
        ].map((stat) => (
          <Card
            key={stat.key}
            className={`cursor-pointer transition-all hover:shadow-card-hover ${
              quickFilter === stat.key ? stat.activeColor : ""
            }`}
            onClick={() => handleQuickFilter(stat.key)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-[var(--radius-md)] ${stat.color} flex items-center justify-center`}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">
                    {stat.value}
                  </p>
                  <p className="text-body-sm text-neutral-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="space-y-4">
            {/* Main filter row */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="MagnifyingGlassIcon by name or email..."
                  className="w-full pl-10 pr-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <FunnelIcon className="h-4 w-4 text-neutral-400" />
                <select
                  value={selectedStatus}
                  onChange={(e) =>
                    setSelectedStatus(e.target.value as TutorStatus | "")
                  }
                  className="px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Status</option>
                  {Object.entries(statusConfig).map(([key, { label }]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedTeam}
                  onChange={(e) =>
                    setSelectedTeam(e.target.value as TutorTeam | "")
                  }
                  className="px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Teams</option>
                  {Object.entries(teamConfig).map(([key, { label }]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <Button
                  variant={showAdvancedFilters ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1" />
                  Advanced
                </Button>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-neutral-500"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Advanced filters */}
            {showAdvancedFilters && (
              <div className="pt-4 border-t border-border space-y-4">
                {/* Labels filter */}
                {availableLabels.length > 0 && (
                  <div>
                    <label className="block text-body-sm font-medium text-neutral-700 mb-2">
                      FunnelIcon by Labels
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableLabels.map((label) => (
                        <button
                          key={label.name}
                          onClick={() => toggleLabel(label.name)}
                          className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1.5 transition-colors ${
                            selectedLabels.includes(label.name)
                              ? "ring-2 ring-primary-500 ring-offset-1"
                              : ""
                          }`}
                          style={{
                            backgroundColor: `${label.color}20`,
                            color: label.color,
                            borderColor: label.color,
                          }}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: label.color }}
                          />
                          {label.name}
                          <span className="text-xs opacity-60">({label.count})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certification filter */}
                <div>
                  <label className="block text-body-sm font-medium text-neutral-700 mb-2">
                    FunnelIcon by Certification
                  </label>
                  <div className="flex gap-2">
                    {[
                      { key: "school" as const, label: "School", color: "blue" },
                      { key: "bq" as const, label: "Birthday Quest", color: "purple" },
                      { key: "playgroup" as const, label: "Playgroup", color: "green" },
                    ].map((cert) => (
                      <button
                        key={cert.key}
                        onClick={() => toggleCert(cert.key)}
                        className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors border ${
                          selectedCerts.includes(cert.key)
                            ? `bg-${cert.color}-100 border-${cert.color}-300 text-${cert.color}-700`
                            : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
                        }`}
                      >
                        <TrophyIcon className="h-4 w-4" />
                        {cert.label}
                        {selectedCerts.includes(cert.key) && (
                          <CheckCircleIcon className="h-3.5 w-3.5" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lesson count filter */}
                <div>
                  <label className="block text-body-sm font-medium text-neutral-700 mb-2">
                    Lesson Count Range
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={minLessons ?? ""}
                      onChange={(e) => setMinLessons(e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="Min"
                      className="w-24 px-3 py-1.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-neutral-400">to</span>
                    <input
                      type="number"
                      value={maxLessons ?? ""}
                      onChange={(e) => setMaxLessons(e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="Max"
                      className="w-24 px-3 py-1.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-body-sm text-neutral-500">lessons</span>
                  </div>
                </div>

                {/* FunnelIcon presets */}
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-body-sm font-medium text-neutral-700">
                      Saved FunnelIcon Presets
                    </label>
                    {hasActiveFilters && !showSavePreset && (
                      <Button variant="ghost" size="sm" onClick={() => setShowSavePreset(true)}>
                        <CheckIcon className="h-4 w-4 mr-1" />
                        CheckIcon Current
                      </Button>
                    )}
                  </div>
                  {showSavePreset && (
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="text"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        placeholder="Preset name..."
                        className="flex-1 px-3 py-1.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <Button size="sm" onClick={saveFilterPreset} disabled={!presetName.trim()}>
                        CheckIcon
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowSavePreset(false)}>
                        Cancel
                      </Button>
                    </div>
                  )}
                  {filterPresets.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {filterPresets.map((preset) => (
                        <div
                          key={preset.name}
                          className="flex items-center gap-1 bg-neutral-100 rounded-lg pl-3 pr-1 py-1"
                        >
                          <button
                            onClick={() => loadFilterPreset(preset)}
                            className="text-sm text-neutral-700 hover:text-neutral-900"
                          >
                            {preset.name}
                          </button>
                          <button
                            onClick={() => deleteFilterPreset(preset.name)}
                            className="p-1 hover:bg-neutral-200 rounded"
                          >
                            <XMarkIcon className="h-3 w-3 text-neutral-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-body-sm text-neutral-500">
                      No saved presets. Apply filters and save them for quick access.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <Card className="mb-4 bg-primary-50 border-primary-200">
          <CardContent className="py-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckIcon className="h-5 w-5 text-primary-600" />
                <span className="font-medium text-primary-900">
                  {selectedIds.size} tutor{selectedIds.size > 1 ? "s" : ""} selected
                </span>
                <button
                  onClick={clearSelection}
                  className="p-1 hover:bg-primary-100 rounded"
                >
                  <XMarkIcon className="h-4 w-4 text-primary-600" />
                </button>
              </div>

              <div className="flex-1 flex items-center gap-2">
                {/* Status dropdown */}
                <select
                  onChange={(e) => e.target.value && handleBulkStatus(e.target.value as TutorStatus)}
                  className="px-3 py-1.5 text-sm border rounded bg-white"
                  disabled={bulkActionMutation.isPending}
                  defaultValue=""
                >
                  <option value="" disabled>Change Status</option>
                  {Object.entries(statusConfig).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>

                {/* Team dropdown */}
                <select
                  onChange={(e) => e.target.value && handleBulkTeam(e.target.value as TutorTeam)}
                  className="px-3 py-1.5 text-sm border rounded bg-white"
                  disabled={bulkActionMutation.isPending}
                  defaultValue=""
                >
                  <option value="" disabled>Assign Team</option>
                  {Object.entries(teamConfig).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>

                {/* Add Label */}
                {showBulkLabel ? (
                  <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border">
                    <input
                      type="text"
                      value={bulkLabel.name}
                      onChange={(e) => setBulkLabel({ ...bulkLabel, name: e.target.value })}
                      placeholder="Label name"
                      className="px-2 py-1 text-sm border-0 focus:ring-0 w-28"
                    />
                    <input
                      type="color"
                      value={bulkLabel.color}
                      onChange={(e) => setBulkLabel({ ...bulkLabel, color: e.target.value })}
                      className="h-6 w-6 rounded cursor-pointer"
                    />
                    <Button
                      size="sm"
                      onClick={handleBulkAddLabel}
                      disabled={bulkActionMutation.isPending || !bulkLabel.name.trim()}
                    >
                      {bulkActionMutation.isPending ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        "Add"
                      )}
                    </Button>
                    <button onClick={() => setShowBulkLabel(false)}>
                      <XMarkIcon className="h-4 w-4 text-neutral-500" />
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkLabel(true)}
                    disabled={bulkActionMutation.isPending}
                  >
                    <TagIcon className="h-4 w-4 mr-1" />
                    Add Label
                  </Button>
                )}

                {bulkActionMutation.isPending && (
                  <ArrowPathIcon className="h-5 w-5 animate-spin text-primary-600 ml-2" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tutors List */}
      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {tutors.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  className="p-1 hover:bg-neutral-100 rounded"
                >
                  {selectedIds.size === tutors.length ? (
                    <CheckIcon className="h-5 w-5 text-primary-600" />
                  ) : (
                    <StopIcon className="h-5 w-5 text-neutral-400" />
                  )}
                </button>
              )}
              <h2 className="text-heading-sm text-neutral-900">
                {pagination.total} Tutor{pagination.total !== 1 ? "s" : ""}
              </h2>
              {pagination.totalPages > 1 && (
                <span className="text-body-sm text-neutral-500 ml-2">
                  (showing {((currentPage - 1) * pagination.limit) + 1}-{Math.min(currentPage * pagination.limit, pagination.total)})
                </span>
              )}
            </div>
            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeftIcon className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-body-sm text-neutral-500 px-2">
                  {currentPage} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages}
                >
                  Next
                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        {isLoading ? (
          <CardContent className="py-16">
            <LoadingSpinner />
          </CardContent>
        ) : error ? (
          <CardContent className="py-16 text-center">
            <ExclamationCircleIcon className="h-16 w-16 text-error mx-auto mb-4" />
            <h3 className="text-heading-sm text-neutral-900 mb-2">
              Error loading tutors
            </h3>
            <p className="text-body text-neutral-500">
              Please try refreshing the page
            </p>
          </CardContent>
        ) : tutors.length === 0 ? (
          <CardContent className="py-16 text-center">
            <UsersIcon className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-heading-sm text-neutral-900 mb-2">
              No tutors found
            </h3>
            <p className="text-body text-neutral-500 mb-6">
              {search || selectedStatus || selectedTeam
                ? "Try adjusting your search or filters"
                : "Tutors will appear here after they complete onboarding"}
            </p>
          </CardContent>
        ) : (
          <div className="divide-y divide-border">
            {tutors.map((tutor) => {
              const status = statusConfig[tutor.status];
              const team = tutor.team ? teamConfig[tutor.team] : null;
              const StatusIcon = status.icon;
              const isSelected = selectedIds.has(tutor.id);

              return (
                <div
                  key={tutor.id}
                  onClick={() => router.push(`/admin/tutors/${tutor.id}`)}
                  className={`flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors group cursor-pointer ${
                    isSelected ? "bg-primary-50" : ""
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelection(tutor.id);
                    }}
                    className="p-1 hover:bg-neutral-100 rounded"
                  >
                    {isSelected ? (
                      <CheckIcon className="h-5 w-5 text-primary-600" />
                    ) : (
                      <StopIcon className="h-5 w-5 text-neutral-400" />
                    )}
                  </button>

                  {/* Avatar */}
                  <div className="h-12 w-12 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {tutor.user.headshotUrl || tutor.user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={tutor.user.headshotUrl || tutor.user.avatarUrl || ""}
                        alt={tutor.user.name || ""}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold">
                        {getInitials(tutor.user.name)}
                      </span>
                    )}
                  </div>

                  {/* Tutor Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-neutral-900">
                        {tutor.user.name}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-lg ${status.bgColor} ${status.color}`}
                      >
                        <StatusIcon className="h-3 w-3 inline mr-1" />
                        {status.label}
                      </span>
                      {team && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-lg ${team.color}`}
                        >
                          <MapPinIcon className="h-3 w-3 inline mr-1" />
                          {team.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-body-sm text-neutral-500">
                      <span className="flex items-center gap-1">
                        <EnvelopeIcon className="h-3 w-3" />
                        {tutor.user.email}
                      </span>
                      {tutor.user.phone && (
                        <span className="flex items-center gap-1">
                          <PhoneIcon className="h-3 w-3" />
                          {tutor.user.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Certifications */}
                  <div className="flex items-center gap-2">
                    {tutor.isSchoolCertified && (
                      <span className="p-1.5 bg-info-light text-info rounded" title="School Certified">
                        <TrophyIcon className="h-4 w-4" />
                      </span>
                    )}
                    {tutor.isBqCertified && (
                      <span className="p-1.5 bg-primary-100 text-primary-600 rounded" title="BQ Certified">
                        <TrophyIcon className="h-4 w-4" />
                      </span>
                    )}
                    {tutor.isPlaygroupCertified && (
                      <span className="p-1.5 bg-success-light text-success rounded" title="Playgroup Certified">
                        <TrophyIcon className="h-4 w-4" />
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="text-right min-w-[100px]">
                    <div className="flex items-center justify-end gap-1 text-neutral-600">
                      <span className="font-medium">{tutor.totalLessons}</span>
                      <span className="text-body-sm text-neutral-400">lessons</span>
                    </div>
                    {tutor.averageRating && (
                      <div className="flex items-center justify-end gap-1 text-warning text-body-sm">
                        <StarIcon className="h-3 w-3 fill-current" />
                        <span>{Number(tutor.averageRating).toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Arrow indicator */}
                  <ChevronRightIcon className="h-5 w-5 text-neutral-400 group-hover:text-neutral-600" />
                </div>
              );
            })}
          </div>
        )}

      </Card>
    </div>
  );
}
