import { useQuery } from "@tanstack/react-query";

// Types
export interface ProfileOverviewBadge {
  id: string;
  badgeKey: string;
  title: string;
  description: string;
  icon: string;
  colorScheme: string;
  earnedAt: string;
}

export interface ProfileOverviewCert {
  id: string;
  type: string;
  status: string;
  earnedAt: string | null;
  expiresAt: string | null;
}

export interface ProfileOverviewCourse {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  difficulty: string;
  moduleCount: number;
  progress: number;
  status: string;
  completedAt: string | null;
}

export interface ProfileOverviewClass {
  id: string;
  name: string;
  color: string | null;
  studentCount: number;
  sessionCount: number;
}

export interface StreakInfo {
  current: number;
  longest: number;
  lastActivity: string | null;
}

export interface ProfileOverviewData {
  tutorStatus: string | null;
  totalLessons: number;
  totalHours: number;
  averageRating: number | null;
  fiveStarCount: number;
  trialConversions: number;

  points: { total: number; monthly: number; rank: number };

  badges: { total: number; recent: ProfileOverviewBadge[] };

  streaks: { login: StreakInfo; lesson: StreakInfo };

  certifications: ProfileOverviewCert[];
  isSchoolCertified: boolean;
  isBqCertified: boolean;
  isPlaygroupCertified: boolean;

  chessSkills: {
    level: string | null;
    rating: string | null;
    noctieRating: string | null;
    chessableProgress: number | null;
    chessableUsername: string | null;
  };

  chess: {
    puzzleRating: number | null;
    puzzlesSolved: number;
    puzzleStreak: number;
    lessonsCompleted: number;
    lessonsTotal: number;
  };

  training: {
    enrolled: number;
    inProgress: number;
    completed: number;
    overallProgress: number;
    courses: ProfileOverviewCourse[];
  };

  classes: {
    active: number;
    totalStudents: number;
    list: ProfileOverviewClass[];
  };
}

// API function
async function fetchProfileOverview(): Promise<ProfileOverviewData> {
  const response = await fetch("/api/profile/overview");
  if (!response.ok) {
    throw new Error("Failed to fetch profile overview");
  }
  return response.json();
}

// Hook
export function useProfileOverview() {
  return useQuery({
    queryKey: ["profile-overview"],
    queryFn: fetchProfileOverview,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });
}
