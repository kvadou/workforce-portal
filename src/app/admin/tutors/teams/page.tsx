"use client";

import {
  ArrowLeftIcon,
  ArrowTrendingUpIcon,
  BookOpenIcon,
  ChevronRightIcon,
  ClockIcon,
  ExclamationCircleIcon,
  MapPinIcon,
  StarIcon,
  TrophyIcon,
  UserPlusIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TutorTeam } from "@prisma/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface TeamData {
  team: TutorTeam | "UNASSIGNED";
  totalTutors: number;
  activeTutors: number;
  pendingTutors: number;
  avgRating: string | null;
  avgLessons: number;
  totalLessons: number;
  totalHours: string;
  recentHires: number;
  certifiedCount: number;
}

interface TeamsResponse {
  teams: TeamData[];
  totals: {
    tutors: number;
    active: number;
    lessons: number;
    recentHires: number;
  };
}

const teamConfig: Record<
  TutorTeam | "UNASSIGNED",
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  LA: { label: "Los Angeles", color: "text-info-dark", bgColor: "bg-info-light", borderColor: "border-info" },
  NYC: { label: "New York", color: "text-primary-700", bgColor: "bg-primary-50", borderColor: "border-primary-200" },
  SF: { label: "San Francisco", color: "text-success-dark", bgColor: "bg-success-light", borderColor: "border-success" },
  ONLINE: { label: "Online", color: "text-accent-navy", bgColor: "bg-accent-navy-light", borderColor: "border-accent-navy" },
  WESTSIDE: { label: "Westside", color: "text-warning-dark", bgColor: "bg-warning-light", borderColor: "border-warning" },
  EASTSIDE: { label: "Eastside", color: "text-accent-pink", bgColor: "bg-accent-pink-light", borderColor: "border-accent-pink" },
  UNASSIGNED: { label: "Unassigned", color: "text-neutral-700", bgColor: "bg-neutral-50", borderColor: "border-neutral-200" },
};

export default function TeamDashboardPage() {
  const { data, isLoading, error } = useQuery<TeamsResponse>({
    queryKey: ["teamStats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/tutors/teams");
      if (!res.ok) throw new Error("Failed to fetch team stats");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingSpinner fullPage />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <ExclamationCircleIcon className="h-16 w-16 text-error mx-auto mb-4" />
        <h3 className="text-heading-sm text-neutral-900 mb-2">Error loading team data</h3>
        <p className="text-body text-neutral-500">Please try refreshing the page</p>
      </div>
    );
  }

  const teams = data?.teams || [];
  const totals = data?.totals;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/tutors"
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-neutral-600" />
        </Link>
        <div>
          <h1 className="text-heading-lg text-neutral-900">Team Dashboard</h1>
          <p className="text-body text-neutral-500">
            Overview of tutor performance by team
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total Tutors",
            value: totals?.tutors || 0,
            icon: UsersIcon,
            color: "bg-neutral-100 text-neutral-600",
          },
          {
            label: "Active Tutors",
            value: totals?.active || 0,
            icon: ArrowTrendingUpIcon,
            color: "bg-success-light text-success",
          },
          {
            label: "Total Lessons",
            value: totals?.lessons?.toLocaleString() || 0,
            icon: BookOpenIcon,
            color: "bg-info-light text-info",
          },
          {
            label: "New Hires (30d)",
            value: totals?.recentHires || 0,
            icon: UserPlusIcon,
            color: "bg-warning-light text-warning",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                  <p className="text-body-sm text-neutral-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Team Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => {
          const config = teamConfig[team.team];
          return (
            <Card
              key={team.team}
              className={`${config.bgColor} ${config.borderColor} border-2 hover:shadow-card-hover transition-shadow`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPinIcon className={`h-5 w-5 ${config.color}`} />
                    <h2 className={`text-heading-sm ${config.color}`}>
                      {config.label}
                    </h2>
                  </div>
                  <Link href={`/admin/tutors?team=${team.team}`}>
                    <Button variant="ghost" size="sm" className={config.color}>
                      View <ChevronRightIcon className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-neutral-900">
                      {team.activeTutors}
                    </div>
                    <div className="text-xs text-neutral-500">Active</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-neutral-900">
                      {team.pendingTutors}
                    </div>
                    <div className="text-xs text-neutral-500">Pending</div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-neutral-600">
                      <StarIcon className="h-4 w-4 text-warning" />
                      Avg Rating
                    </span>
                    <span className="font-medium">
                      {team.avgRating ? team.avgRating : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-neutral-600">
                      <BookOpenIcon className="h-4 w-4 text-info" />
                      Total Lessons
                    </span>
                    <span className="font-medium">
                      {team.totalLessons.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-neutral-600">
                      <ClockIcon className="h-4 w-4 text-success" />
                      Avg Lessons/Tutor
                    </span>
                    <span className="font-medium">{team.avgLessons}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-neutral-600">
                      <TrophyIcon className="h-4 w-4 text-primary-500" />
                      Certified
                    </span>
                    <span className="font-medium">{team.certifiedCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-neutral-600">
                      <UserPlusIcon className="h-4 w-4 text-warning" />
                      New Hires (30d)
                    </span>
                    <span className="font-medium">{team.recentHires}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
