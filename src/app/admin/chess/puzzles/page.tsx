"use client";

import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PuzzlePieceIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface PuzzleRow {
  id: string;
  lichessId: string;
  fen: string;
  rating: number;
  themes: string[];
  isActive: boolean;
  attemptCount: number;
}

interface PuzzlesResponse {
  puzzles: PuzzleRow[];
  total: number;
  page: number;
  totalPages: number;
}

const COMMON_THEMES = [
  "mate",
  "mateIn1",
  "mateIn2",
  "fork",
  "pin",
  "skewer",
  "discoveredAttack",
  "sacrifice",
  "deflection",
  "decoy",
  "clearance",
  "backRankMate",
  "hangingPiece",
  "trappedPiece",
  "endgame",
  "opening",
  "middlegame",
  "pawnEndgame",
  "rookEndgame",
  "queenEndgame",
  "short",
  "long",
  "veryLong",
  "crushing",
  "advantage",
  "equality",
];

export default function PuzzleManagementPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [searchId, setSearchId] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("");
  const [ratingMin, setRatingMin] = useState("");
  const [ratingMax, setRatingMax] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('columnWidths_puzzles');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [resizing, setResizing] = useState<string | null>(null);

  const handleResizeStart = (e: React.MouseEvent, colKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidths[colKey] || 120;
    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(80, startWidth + (moveEvent.clientX - startX));
      setColumnWidths(prev => {
        const updated = { ...prev, [colKey]: newWidth };
        localStorage.setItem('columnWidths_puzzles', JSON.stringify(updated));
        return updated;
      });
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      setResizing(null);
    };
    setResizing(colKey);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchId(value);
      const timeout = setTimeout(() => {
        setDebouncedSearch(value);
        setPage(1);
      }, 400);
      return () => clearTimeout(timeout);
    },
    []
  );

  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (debouncedSearch) params.set("lichessId", debouncedSearch);
    if (selectedTheme) params.set("theme", selectedTheme);
    if (ratingMin) params.set("ratingMin", ratingMin);
    if (ratingMax) params.set("ratingMax", ratingMax);
    if (activeFilter !== "all") params.set("active", activeFilter === "active" ? "true" : "false");
    return params.toString();
  }, [page, debouncedSearch, selectedTheme, ratingMin, ratingMax, activeFilter]);

  const { data, isLoading, error, refetch } = useQuery<PuzzlesResponse>({
    queryKey: ["adminPuzzles", page, debouncedSearch, selectedTheme, ratingMin, ratingMax, activeFilter],
    queryFn: async () => {
      const res = await fetch(`/api/admin/chess/puzzles?${buildQueryParams()}`);
      if (!res.ok) throw new Error("Failed to fetch puzzles");
      return res.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/admin/chess/puzzles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed to update puzzle");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPuzzles"] });
      toast.success("PuzzlePieceIcon updated");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const clearFilters = () => {
    setSelectedTheme("");
    setRatingMin("");
    setRatingMax("");
    setActiveFilter("all");
    setSearchId("");
    setDebouncedSearch("");
    setPage(1);
  };

  const hasFilters = selectedTheme || ratingMin || ratingMax || activeFilter !== "all" || debouncedSearch;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/chess"
          className="inline-flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 mb-3"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Chess Management
        </Link>
        <h1 className="text-heading-lg text-neutral-900 flex items-center gap-2">
          <PuzzlePieceIcon className="h-8 w-8 text-primary-500" />
          PuzzlePieceIcon Management
        </h1>
        <p className="text-body text-neutral-500 mt-1">
          MagnifyingGlassIcon, filter, and manage chess puzzles
        </p>
      </div>

      {/* MagnifyingGlassIcon and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchId}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="MagnifyingGlassIcon by Lichess ID..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
            <Button
              variant={showFilters ? "primary" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FunnelIcon className="h-4 w-4 mr-1" />
              Filters
              {hasFilters && (
                <span className="ml-1 h-2 w-2 rounded-full bg-primary-500 inline-block" />
              )}
            </Button>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <XMarkIcon className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Theme filter */}
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Theme
                </label>
                <select
                  value={selectedTheme}
                  onChange={(e) => {
                    setSelectedTheme(e.target.value);
                    setPage(1);
                  }}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Themes</option>
                  {COMMON_THEMES.map((theme) => (
                    <option key={theme} value={theme}>
                      {theme}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating min */}
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Min Rating
                </label>
                <input
                  type="number"
                  value={ratingMin}
                  onChange={(e) => {
                    setRatingMin(e.target.value);
                    setPage(1);
                  }}
                  placeholder="e.g. 800"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Rating max */}
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Max Rating
                </label>
                <input
                  type="number"
                  value={ratingMax}
                  onChange={(e) => {
                    setRatingMax(e.target.value);
                    setPage(1);
                  }}
                  placeholder="e.g. 1500"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Active/Inactive toggle */}
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Status
                </label>
                <div className="flex rounded-lg border overflow-hidden">
                  {(["all", "active", "inactive"] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setActiveFilter(option);
                        setPage(1);
                      }}
                      className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                        activeFilter === option
                          ? "bg-primary-500 text-white"
                          : "bg-white text-neutral-600 hover:bg-neutral-50"
                      }`}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner fullPage />
      ) : error ? (
        <div className="text-center py-20">
          <ExclamationCircleIcon className="h-16 w-16 text-error mx-auto mb-4" />
          <h3 className="text-heading-sm text-neutral-900 mb-2">
            Failed to load puzzles
          </h3>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed">
                <thead>
                  <tr className="border-t border-b border-neutral-200 bg-neutral-50/50">
                    {[
                      { key: 'lichessId', label: 'Lichess ID', width: 130, align: 'text-left' },
                      { key: 'fen', label: 'FEN', width: 200, align: 'text-left' },
                      { key: 'rating', label: 'Rating', width: 100, align: 'text-right' },
                      { key: 'themes', label: 'Themes', width: 220, align: 'text-left' },
                      { key: 'active', label: 'Active', width: 100, align: 'text-center' },
                      { key: 'attempts', label: 'Attempts', width: 100, align: 'text-right' },
                      { key: 'actions', label: 'Actions', width: 120, align: 'text-center' },
                    ].map((col) => (
                      <th
                        key={col.key}
                        className={`relative py-2.5 px-3 text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap select-none ${col.align}`}
                        style={{ width: columnWidths[col.key] || col.width }}
                      >
                        {col.label}
                        <div
                          className="absolute -right-1.5 top-0 bottom-0 w-3 cursor-col-resize hover:bg-primary-500/20 group z-10"
                          onMouseDown={(e) => handleResizeStart(e, col.key)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="mx-auto w-px h-full bg-neutral-200 group-hover:bg-primary-500/40" />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.puzzles && data.puzzles.length > 0 ? (
                    data.puzzles.map((puzzle) => (
                      <tr
                        key={puzzle.id}
                        className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                      >
                        <td className="px-3 py-2.5 text-sm text-neutral-700 font-mono">
                          {puzzle.lichessId}
                        </td>
                        <td className="px-3 py-2.5 text-sm text-neutral-700 font-mono text-xs truncate">
                          {puzzle.fen}
                        </td>
                        <td className="px-3 py-2.5 text-sm text-right tabular-nums">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-info-light text-info-dark">
                            {puzzle.rating}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-sm text-neutral-700">
                          <div className="flex flex-wrap gap-1">
                            {puzzle.themes.slice(0, 3).map((theme) => (
                              <span
                                key={theme}
                                className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs bg-neutral-100 text-neutral-600"
                              >
                                {theme}
                              </span>
                            ))}
                            {puzzle.themes.length > 3 && (
                              <span className="text-xs text-neutral-400">
                                +{puzzle.themes.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-sm text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium ${
                              puzzle.isActive
                                ? "bg-success-light text-success-dark"
                                : "bg-neutral-100 text-neutral-500"
                            }`}
                          >
                            {puzzle.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-sm text-neutral-700 text-right tabular-nums">
                          {puzzle.attemptCount}
                        </td>
                        <td className="px-3 py-2.5 text-sm text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toggleMutation.mutate({
                                id: puzzle.id,
                                isActive: !puzzle.isActive,
                              })
                            }
                            disabled={toggleMutation.isPending}
                          >
                            {puzzle.isActive ? (
                              <>
                                <EyeSlashIcon className="h-4 w-4 mr-1" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <EyeIcon className="h-4 w-4 mr-1" />
                                Activate
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-3 py-12 text-center">
                        <PuzzlePieceIcon className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                        <p className="text-neutral-500">No puzzles found</p>
                        {hasFilters && (
                          <p className="text-sm text-neutral-400 mt-1">
                            Try adjusting your filters
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between px-4 py-3 border-t border-neutral-200">
              <span className="text-sm text-neutral-500">
                Showing {(data.page - 1) * 20 + 1}&ndash;{Math.min(data.page * 20, data.total)} of {data.total.toLocaleString()}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeftIcon className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (data.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= data.totalPages - 2) {
                      pageNum = data.totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                          page === pageNum
                            ? "bg-primary-500 text-white"
                            : "text-neutral-600 hover:bg-neutral-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                >
                  Next
                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
