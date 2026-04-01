"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ChessPuzzle {
  id: string;
  lichessId: string | null;
  fen: string;
  moves: string;
  rating: number;
  themes: string[];
  openingTags: string[];
  popularity: number;
  isActive: boolean;
  userAttempt?: {
    solved: boolean;
    usedHint: boolean;
    timeSpentMs: number;
  } | null;
}

export interface PuzzleStats {
  puzzleRating: number;
  puzzlesSolved: number;
  puzzlesFailed: number;
  currentStreak: number;
  bestStreak: number;
  totalTimeMs: number;
  hintsUsed: number;
  themeProgress: Record<string, { solved: number; failed: number }>;
  lastPuzzleAt: string | null;
}

export interface PuzzleTheme {
  theme: string;
  count: number;
}

export interface PuzzleAttemptData {
  solved: boolean;
  usedHint: boolean;
  moveCount: number;
  timeMs: number;
}

interface PuzzleFilters {
  theme?: string;
  ratingMin?: number;
  ratingMax?: number;
  unsolvedOnly?: boolean;
  page?: number;
  limit?: number;
}

export function usePuzzles(filters?: PuzzleFilters) {
  return useQuery({
    queryKey: ["puzzles", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.theme) params.set("theme", filters.theme);
      if (filters?.ratingMin)
        params.set("ratingMin", String(filters.ratingMin));
      if (filters?.ratingMax)
        params.set("ratingMax", String(filters.ratingMax));
      if (filters?.unsolvedOnly) params.set("unsolvedOnly", "true");
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));

      const res = await fetch(`/api/puzzles?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch puzzles");
      return res.json() as Promise<{
        puzzles: ChessPuzzle[];
        total: number;
        page: number;
        limit: number;
      }>;
    },
  });
}

export function useDailyPuzzle() {
  return useQuery({
    queryKey: ["puzzles", "daily"],
    queryFn: async () => {
      const res = await fetch("/api/puzzles/daily");
      if (!res.ok) throw new Error("Failed to fetch daily puzzle");
      return res.json() as Promise<{
        puzzle: ChessPuzzle | null;
        alreadySolved: boolean;
      }>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useNextPuzzle() {
  return useQuery({
    queryKey: ["puzzles", "next"],
    queryFn: async () => {
      const res = await fetch("/api/puzzles/next");
      if (!res.ok) throw new Error("Failed to fetch next puzzle");
      return res.json() as Promise<{ puzzle: ChessPuzzle | null }>;
    },
    staleTime: 0, // Always fresh
  });
}

export function usePuzzleStats() {
  return useQuery({
    queryKey: ["puzzles", "stats"],
    queryFn: async () => {
      const res = await fetch("/api/puzzles/stats");
      if (!res.ok) throw new Error("Failed to fetch puzzle stats");
      return res.json() as Promise<PuzzleStats>;
    },
  });
}

export function usePuzzleThemes() {
  return useQuery({
    queryKey: ["puzzles", "themes"],
    queryFn: async () => {
      const res = await fetch("/api/puzzles/themes");
      if (!res.ok) throw new Error("Failed to fetch themes");
      return res.json() as Promise<{ themes: PuzzleTheme[] }>;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useSubmitPuzzleAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      puzzleId,
      data,
    }: {
      puzzleId: string;
      data: PuzzleAttemptData;
    }) => {
      const res = await fetch(`/api/puzzles/${puzzleId}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to submit attempt");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["puzzles", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["puzzles", "daily"] });
      queryClient.invalidateQueries({ queryKey: ["puzzles", "next"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
