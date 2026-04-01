import { useQuery } from "@tanstack/react-query";

// Types
export interface DashboardStats {
  classCount: number;
  studentCount: number;
  sessionCount: number;
  totalLessons: number;
  totalHours: number;
  averageRating: number | null;
  fiveStarCount: number;
}

export interface PointsBreakdown {
  courses: number;
  lessons: number;
  streaks: number;
  achievements: number;
  quality: number;
  engagement: number;
}

export interface PointsData {
  totalPoints: number;
  monthlyPoints: number;
  weeklyPoints: number;
  breakdown: PointsBreakdown;
}

export interface TopTutor {
  rank: number;
  name: string;
  avatarUrl: string | null;
  points: number;
}

export interface CareerStats {
  lessonsTotal: number;
  lessonsThisMonth: number;
  hoursTotal: number;
  averageRating: number | null;
  fiveStarCount: number;
}

export interface InProgressCourse {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  progress: number;
  timeRemaining?: string;
  pointsAvailable: number;
}

export interface UpcomingSession {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  duration: number;
  category: string;
  hostName: string;
  isRegistered: boolean;
  participantCount: number;
  maxParticipants: number;
  zoomJoinUrl: string | null;
}

export interface RecentClass {
  id: string;
  name: string;
  color: string | null;
  studentCount: number;
  sessionCount: number;
  currentLesson: {
    id: string;
    title: string;
    number: number;
  } | null;
}

export interface Badge {
  id: string;
  badgeKey: string;
  title: string;
  description: string;
  icon: string;
  colorScheme: string;
  earnedAt: string;
}

export interface StreakData {
  current: number;
  longest: number;
  lastActivity: string | null;
}

export interface TrainingCourse {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  difficulty: string;
  moduleCount: number;
  progress: number;
  status: string;
}

export interface Milestone {
  id: string;
  type: string;
  value: number;
  achievedAt: string;
}

export interface DashboardData {
  stats: DashboardStats;

  // Points & Leaderboard
  points: PointsData;
  leaderboardRank: number;
  topTutors: TopTutor[];

  // Career Stats from Acme
  careerStats: CareerStats;

  // Continue Learning
  inProgressCourses: InProgressCourse[];

  // Live Sessions
  upcomingSessions: UpcomingSession[];

  // Classes
  recentClasses: RecentClass[];

  // Badges
  badges: {
    total: number;
    recent: Badge[];
  };

  // Streaks
  streaks: {
    login: StreakData;
    lesson: StreakData;
  };

  // Training progress
  training: {
    enrolled: number;
    inProgress: number;
    completed: number;
    overallProgress: number;
    courses: TrainingCourse[];
  };

  // Milestones
  milestones: Milestone[];
}

// API function
async function fetchDashboard(): Promise<DashboardData> {
  const response = await fetch("/api/dashboard");
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard");
  }
  return response.json();
}

// Hook
export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
    refetchOnWindowFocus: true,
  });
}
