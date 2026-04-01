import { useQuery } from "@tanstack/react-query";

// ===== Types =====

export interface AnalyticsOverview {
  totalUsers: number;
  activeTutors: number;
  onboardingTutors: number;
  totalLessons: number;
  averageRating: string;
}

export interface TutorStats {
  total: number;
  byStatus: { status: string; count: number }[];
  byTeam: { team: string; count: number }[];
}

export interface BadgeStats {
  totalEarned: number;
  earnedThisWeek: number;
  recent: {
    id: string;
    userId: string;
    userName: string;
    badgeTitle: string;
    badgeIcon: string;
    earnedAt: string;
  }[];
  topEarners: {
    userId: string;
    user: { id: string; name: string | null; email: string; avatarUrl: string | null } | undefined;
    badgeCount: number;
  }[];
}

export interface TrainingStats {
  totalCourses: number;
  totalEnrollments: number;
  completions: number;
  completionRate: string;
  enrollmentsThisMonth: number;
  recentEnrollments: {
    id: string;
    userId: string;
    userName: string;
    courseTitle: string;
    status: string;
    createdAt: string;
  }[];
}

export interface OnboardingStats {
  byStatus: { status: string; count: number }[];
  total: number;
}

export interface RecentActivity {
  notes: {
    id: string;
    type: string;
    tutorName: string | null;
    createdByName: string | null;
    createdAt: string;
    content: string;
  }[];
  auditLogs: {
    id: string;
    action: string;
    tutorName: string | null;
    performedByName: string | null;
    field: string | null;
    previousValue: string | null;
    newValue: string | null;
    createdAt: string;
  }[];
}

export interface AnalyticsData {
  overview: AnalyticsOverview;
  tutors: TutorStats;
  badges: BadgeStats;
  training: TrainingStats;
  onboarding: OnboardingStats;
  recentActivity: RecentActivity;
}

export interface LeaderboardEntry {
  rank: number;
  tutorId?: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
}

export interface LessonsLeaderboardEntry extends LeaderboardEntry {
  totalLessons: number;
  team: string | null;
}

export interface RatingLeaderboardEntry extends LeaderboardEntry {
  averageRating: string;
  totalLessons: number;
}

export interface BadgeLeaderboardEntry extends LeaderboardEntry {
  badgeCount: number;
}

export interface StreakLeaderboardEntry extends LeaderboardEntry {
  currentStreak: number;
  longestStreak: number;
}

export interface TrainingLeaderboardEntry extends LeaderboardEntry {
  completedCourses: number;
}

export interface LeaderboardsData {
  topByLessons: LessonsLeaderboardEntry[];
  topByRating: RatingLeaderboardEntry[];
  topBadgeEarners: BadgeLeaderboardEntry[];
  topStreaks: StreakLeaderboardEntry[];
  topTrainingCompletions: TrainingLeaderboardEntry[];
}

// ===== Hooks =====

export function useAnalytics() {
  return useQuery<AnalyticsData>({
    queryKey: ["adminAnalytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useLeaderboards(limit = 10) {
  return useQuery<LeaderboardsData>({
    queryKey: ["adminLeaderboards", limit],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics/leaderboards?limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch leaderboards");
      return res.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
