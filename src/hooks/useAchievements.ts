import { useQuery } from "@tanstack/react-query";

// Types
export interface EarnedBadge {
  id: string;
  badgeKey: string;
  title: string;
  description: string;
  icon: string;
  colorScheme: string;
  unlockType: string;
  earnedAt: string;
  metadata: Record<string, unknown> | null;
}

export interface AvailableBadge {
  id: string;
  badgeKey: string;
  title: string;
  description: string;
  icon: string;
  colorScheme: string;
  unlockType: string;
  unlockCondition: string | null;
}

export interface Streak {
  type: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}

export interface Milestone {
  id: string;
  type: string;
  value: number;
  achievedAt: string;
}

export interface MilestoneProgress {
  type: string;
  label: string;
  current: number;
  thresholds: number[];
  achieved: number[];
}

export interface AchievementStats {
  totalLessons: number;
  totalHours: number;
  fiveStarCount: number;
  trialConversions: number;
}

export interface AchievementsData {
  badges: {
    earned: EarnedBadge[];
    available: AvailableBadge[];
    totalEarned: number;
    totalAvailable: number;
  };
  streaks: Streak[];
  milestones: {
    achieved: Milestone[];
    progress: MilestoneProgress[];
  };
  stats: AchievementStats;
}

// API function
async function fetchAchievements(): Promise<AchievementsData> {
  const response = await fetch("/api/achievements");
  if (!response.ok) {
    throw new Error("Failed to fetch achievements");
  }
  return response.json();
}

// Hook
export function useAchievements() {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: fetchAchievements,
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
    refetchOnWindowFocus: true,
  });
}
