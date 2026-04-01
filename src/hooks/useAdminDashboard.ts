import { useQuery } from "@tanstack/react-query";

export interface AdminDashboardData {
  pipeline: {
    preOrientation: number;
    inTraining: number;
    pendingActivation: number;
    total: number;
  };
  tutors: {
    active: number;
    new30d: number;
    byStatus: Record<string, number>;
  };
  training: {
    activeEnrollments: number;
    completionRate: number;
    completedRecently: number;
  };
  engagement: {
    activeAlerts: number;
    badgesAwarded: number;
  };
  content: {
    publishedPages: number;
    activeResources: number;
    activeAnnouncements: number;
  };
  actionItems: {
    pendingW9: number;
    pendingProfiles: number;
    pendingActivations: number;
  };
  recentActivity: {
    id: string;
    action: string;
    field: string | null;
    newValue: string | null;
    performedBy: string;
    tutorName: string;
    createdAt: string;
  }[];
}

async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  const res = await fetch("/api/admin/dashboard");
  if (!res.ok) throw new Error("Failed to fetch dashboard data");
  return res.json();
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: fetchAdminDashboard,
    staleTime: 60_000, // 1 minute
  });
}
