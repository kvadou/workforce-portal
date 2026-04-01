"use client";

import { useQuery } from "@tanstack/react-query";

interface Badge {
  id: string;
  badgeKey: string;
  title: string;
  description: string;
  icon: string;
  colorScheme: string;
}

interface EarnedBadge {
  id: string;
  earnedAt: string;
  metadata: Record<string, unknown> | null;
  badge: Badge;
}

interface BadgesResponse {
  badges: EarnedBadge[];
}

/**
 * Fetch all badges earned by the current user
 */
export function useMyBadges() {
  return useQuery<BadgesResponse>({
    queryKey: ["myBadges"],
    queryFn: async () => {
      const res = await fetch("/api/badges");
      if (!res.ok) {
        throw new Error("Failed to fetch badges");
      }
      return res.json();
    },
  });
}

/**
 * Parse the colorScheme JSON string from a badge
 */
export function parseBadgeColors(colorScheme: string): {
  color: string;
  bgColor: string;
  borderColor: string;
} {
  try {
    return JSON.parse(colorScheme);
  } catch {
    return {
      color: "#6366f1",
      bgColor: "#eef2ff",
      borderColor: "#c7d2fe",
    };
  }
}
