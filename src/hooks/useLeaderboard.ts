import { useQuery } from "@tanstack/react-query";

// Types
export interface LeaderboardEntry {
  rank: number;
  tutorProfileId: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  points: number;
  team?: string | null;
}

export interface PointsBreakdown {
  courses: number;
  lessons: number;
  streaks: number;
  achievements: number;
  quality: number;
  engagement: number;
}

export interface CurrentUserPoints {
  rank: number;
  tutorProfileId: string;
  points: number;
  monthlyPoints: number;
  weeklyPoints: number;
  breakdown: PointsBreakdown | null;
}

export interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  currentUser: CurrentUserPoints | null;
  period: "all" | "monthly" | "weekly";
}

export interface LeaderboardOptions {
  period?: "all" | "monthly" | "weekly";
  limit?: number;
  team?: string;
}

// API function
async function fetchLeaderboard(
  options: LeaderboardOptions = {}
): Promise<LeaderboardData> {
  const { period = "monthly", limit = 10, team } = options;
  const params = new URLSearchParams({
    period,
    limit: limit.toString(),
  });
  if (team) {
    params.set("team", team);
  }

  const response = await fetch(`/api/leaderboards?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch leaderboard");
  }
  return response.json();
}

// Hook
export function useLeaderboard(options: LeaderboardOptions = {}) {
  const { period = "monthly", limit = 10, team } = options;
  return useQuery({
    queryKey: ["leaderboard", period, limit, team],
    queryFn: () => fetchLeaderboard(options),
    staleTime: 1000 * 60 * 10, // Consider fresh for 10 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook for just the top tutors (dashboard widget)
export function useTopTutors(limit: number = 10) {
  return useQuery({
    queryKey: ["topTutors", limit],
    queryFn: () => fetchLeaderboard({ period: "monthly", limit }),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    select: (data) => data.leaderboard,
  });
}
