"use client";

import {
  ArrowRightIcon,
  ArrowUpTrayIcon,
  BookOpenIcon,
  ExclamationCircleIcon,
  FlagIcon,
  FolderOpenIcon,
  PuzzlePieceIcon,
  StarIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ChessStats {
  totalPuzzles: number;
  activePuzzles: number;
  totalLessons: number;
  totalCategories: number;
  totalAttempts: number;
  averageRating: number;
}

export default function ChessAdminDashboard() {
  const { data, isLoading, error, refetch } = useQuery<ChessStats>({
    queryKey: ["adminChessStats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/chess/stats");
      if (!res.ok) throw new Error("Failed to fetch chess stats");
      return res.json();
    },
  });

  if (isLoading) {
    return <LoadingSpinner fullPage />;
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center">
        <ExclamationCircleIcon className="h-16 w-16 text-error mx-auto mb-4" />
        <h3 className="text-heading-sm text-neutral-900 mb-2">
          Failed to load chess stats
        </h3>
        <p className="text-body text-neutral-500 mb-4">
          Could not connect to the chess stats API.
        </p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Puzzles",
      value: data.totalPuzzles.toLocaleString(),
      icon: <PuzzlePieceIcon className="h-5 w-5" />,
      color: "bg-info-light text-info",
    },
    {
      label: "Active Puzzles",
      value: data.activePuzzles.toLocaleString(),
      icon: <FlagIcon className="h-5 w-5" />,
      color: "bg-success-light text-success",
    },
    {
      label: "Total Lessons",
      value: data.totalLessons.toLocaleString(),
      icon: <BookOpenIcon className="h-5 w-5" />,
      color: "bg-primary-100 text-primary-600",
    },
    {
      label: "Total Categories",
      value: data.totalCategories.toLocaleString(),
      icon: <FolderOpenIcon className="h-5 w-5" />,
      color: "bg-warning-light text-warning",
    },
    {
      label: "Total Attempts",
      value: data.totalAttempts.toLocaleString(),
      icon: <FlagIcon className="h-5 w-5" />,
      color: "bg-error-light text-error",
    },
    {
      label: "Average Rating",
      value: data.averageRating.toLocaleString(),
      icon: <StarIcon className="h-5 w-5" />,
      color: "bg-warning-light text-warning",
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-heading-lg text-neutral-900 flex items-center gap-2">
          <TrophyIcon className="h-8 w-8 text-primary-500" />
          Chess Content Management
        </h1>
        <p className="text-body text-neutral-500 mt-1">
          Manage puzzles, lessons, and categories for the chess learning platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-lg ${stat.color} flex items-center justify-center`}
                >
                  {stat.icon}
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

      {/* Quick Actions */}
      <h2 className="text-heading-sm text-neutral-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/admin/chess/puzzles">
          <Card hover className="h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-info-light text-info flex items-center justify-center">
                  <PuzzlePieceIcon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900">
                    Manage Puzzles
                  </h3>
                  <p className="text-body-sm text-neutral-500">
                    Search, filter, and toggle puzzles
                  </p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-neutral-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/chess/lessons">
          <Card hover className="h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                  <BookOpenIcon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900">
                    Manage Lessons
                  </h3>
                  <p className="text-body-sm text-neutral-500">
                    Categories, lessons, and levels
                  </p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-neutral-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/chess/puzzles?import=true">
          <Card hover className="h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-warning-light text-warning flex items-center justify-center">
                  <ArrowUpTrayIcon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900">
                    Import Puzzles
                  </h3>
                  <p className="text-body-sm text-neutral-500">
                    Import puzzles from Lichess database
                  </p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-neutral-400" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
