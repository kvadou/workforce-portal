"use client";

import {
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrophyIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Badge {
  id: string;
  badgeKey: string;
  title: string;
  description: string;
  icon: string;
  colorScheme: string;
  unlockType: string;
  unlockCondition: string | null;
  order: number;
  isActive: boolean;
  earnedCount: number;
}

interface BadgeWithEarners extends Badge {
  earnedBy: {
    id: string;
    earnedAt: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      avatarUrl: string | null;
    };
  }[];
}

function parseColors(colorScheme: string) {
  try {
    return JSON.parse(colorScheme);
  } catch {
    return { color: "#6366f1", bgColor: "#eef2ff", borderColor: "#c7d2fe" };
  }
}

export default function BadgesAdminPage() {
  const queryClient = useQueryClient();
  const [expandedBadge, setExpandedBadge] = useState<string | null>(null);
  const [searchUser, setSearchUser] = useState("");
  const [revokeTarget, setRevokeTarget] = useState<{ badgeId: string; userId: string } | null>(null);

  const { data, isLoading, error } = useQuery<{ badges: Badge[] }>({
    queryKey: ["adminBadges"],
    queryFn: async () => {
      const res = await fetch("/api/admin/badges");
      if (!res.ok) throw new Error("Failed to fetch badges");
      return res.json();
    },
  });

  const { data: badgeDetails } = useQuery<BadgeWithEarners>({
    queryKey: ["adminBadge", expandedBadge],
    queryFn: async () => {
      const res = await fetch(`/api/admin/badges/${expandedBadge}`);
      if (!res.ok) throw new Error("Failed to fetch badge details");
      return res.json();
    },
    enabled: !!expandedBadge,
  });

  const { data: searchResults } = useQuery<{ users: { id: string; name: string; email: string }[] }>({
    queryKey: ["searchUsers", searchUser],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(searchUser)}&limit=5`);
      if (!res.ok) throw new Error("Failed to search users");
      return res.json();
    },
    enabled: searchUser.length >= 2,
  });

  const awardMutation = useMutation({
    mutationFn: async ({ badgeId, userId }: { badgeId: string; userId: string }) => {
      const res = await fetch(`/api/admin/badges/${badgeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to award badge");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBadges"] });
      queryClient.invalidateQueries({ queryKey: ["adminBadge", expandedBadge] });
      setSearchUser("");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async ({ badgeId, userId }: { badgeId: string; userId: string }) => {
      const res = await fetch(`/api/admin/badges/${badgeId}?userId=${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to revoke badge");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBadges"] });
      queryClient.invalidateQueries({ queryKey: ["adminBadge", expandedBadge] });
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
        <h3 className="text-heading-sm text-neutral-900 mb-2">Error loading badges</h3>
        <p className="text-body text-neutral-500">Please try refreshing the page</p>
      </div>
    );
  }

  const badges = data?.badges || [];

  // Group badges by type
  const badgeGroups = {
    onboarding: badges.filter((b) => b.unlockType === "step_completion"),
    milestone: badges.filter((b) => b.unlockType === "milestone"),
    streak: badges.filter((b) => b.unlockType === "streak"),
    special: badges.filter((b) => b.unlockType === "special"),
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-heading-lg text-neutral-900 flex items-center gap-2">
          <TrophyIcon className="h-8 w-8 text-primary-500" />
          Badge Management
        </h1>
        <p className="text-body text-neutral-500 mt-1">
          View badge statistics and manually award/revoke badges
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Badges", value: badges.length, color: "bg-info-light text-info" },
          { label: "Active Badges", value: badges.filter((b) => b.isActive).length, color: "bg-success-light text-success" },
          { label: "Total Earned", value: badges.reduce((sum, b) => sum + b.earnedCount, 0), color: "bg-primary-100 text-primary-600" },
          { label: "Most Earned", value: badges.sort((a, b) => b.earnedCount - a.earnedCount)[0]?.title || "—", color: "bg-warning-light text-warning" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <TrophyIcon className="h-5 w-5" />
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

      {/* Badge Groups */}
      {Object.entries(badgeGroups).map(([groupName, groupBadges]) => {
        if (groupBadges.length === 0) return null;
        const groupLabels: Record<string, string> = {
          onboarding: "Onboarding Badges",
          milestone: "Milestone Badges",
          streak: "Streak Badges",
          special: "Special Badges",
        };

        return (
          <div key={groupName} className="mb-8">
            <h2 className="text-heading-sm text-neutral-900 mb-4">{groupLabels[groupName]}</h2>
            <div className="space-y-2">
              {groupBadges.map((badge) => {
                const colors = parseColors(badge.colorScheme);
                const isExpanded = expandedBadge === badge.id;

                return (
                  <Card
                    key={badge.id}
                    className={`transition-all ${isExpanded ? "ring-2 ring-primary-500" : ""}`}
                  >
                    <CardContent className="p-4">
                      <div
                        className="flex items-center gap-4 cursor-pointer"
                        onClick={() => setExpandedBadge(isExpanded ? null : badge.id)}
                      >
                        <div
                          className="h-12 w-12 rounded-lg flex items-center justify-center text-2xl"
                          style={{ backgroundColor: colors.bgColor, border: `1px solid ${colors.borderColor}` }}
                        >
                          {badge.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-neutral-900">{badge.title}</h3>
                          <p className="text-body-sm text-neutral-500">{badge.description}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-neutral-900">{badge.earnedCount}</div>
                            <div className="text-xs text-neutral-500">earned</div>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs ${badge.isActive ? "bg-success-light text-success-dark" : "bg-neutral-100 text-neutral-500"}`}>
                            {badge.isActive ? "Active" : "Inactive"}
                          </div>
                          {isExpanded ? (
                            <ChevronUpIcon className="h-5 w-5 text-neutral-400" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5 text-neutral-400" />
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-neutral-100">
                          {/* TrophyIcon badge form */}
                          <div className="mb-4 p-3 bg-neutral-50 rounded-lg">
                            <h4 className="font-medium text-neutral-900 mb-2">TrophyIcon Badge Manually</h4>
                            <div className="flex gap-2">
                              <div className="flex-1 relative">
                                <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <input
                                  type="text"
                                  value={searchUser}
                                  onChange={(e) => setSearchUser(e.target.value)}
                                  placeholder="MagnifyingGlassIcon for user by name or email..."
                                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                              </div>
                            </div>
                            {searchResults?.users && searchResults.users.length > 0 && (
                              <div className="mt-2 border rounded-lg divide-y">
                                {searchResults.users.map((user) => (
                                  <div
                                    key={user.id}
                                    className="flex items-center justify-between p-2 hover:bg-neutral-50"
                                  >
                                    <div>
                                      <div className="font-medium text-sm">{user.name}</div>
                                      <div className="text-xs text-neutral-500">{user.email}</div>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => awardMutation.mutate({ badgeId: badge.id, userId: user.id })}
                                      disabled={awardMutation.isPending}
                                    >
                                      {awardMutation.isPending ? (
                                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <>
                                          <PlusIcon className="h-4 w-4 mr-1" /> TrophyIcon
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* UsersIcon who earned this badge */}
                          <h4 className="font-medium text-neutral-900 mb-2 flex items-center gap-2">
                            <UsersIcon className="h-4 w-4" />
                            UsersIcon with this badge ({badgeDetails?.earnedBy?.length || 0})
                          </h4>
                          {badgeDetails?.earnedBy && badgeDetails.earnedBy.length > 0 ? (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {badgeDetails.earnedBy.map((ub) => (
                                <div
                                  key={ub.id}
                                  className="flex items-center justify-between p-2 bg-white border rounded-lg"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center">
                                      {ub.user.avatarUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={ub.user.avatarUrl}
                                          alt=""
                                          className="w-full h-full rounded-full object-cover"
                                        />
                                      ) : (
                                        <span className="text-sm font-medium text-primary-600">
                                          {(ub.user.name || ub.user.email)[0].toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                    <div>
                                      <div className="font-medium text-sm">{ub.user.name || ub.user.email}</div>
                                      <div className="text-xs text-neutral-500">
                                        Earned {new Date(ub.earnedAt).toLocaleDateString()}
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => setRevokeTarget({ badgeId: badge.id, userId: ub.user.id })}
                                    className="p-1 text-error hover:bg-error-light rounded"
                                    disabled={revokeMutation.isPending}
                                  >
                                    <XMarkIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-neutral-500 text-center py-4">
                              No users have earned this badge yet
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      <ConfirmDialog
        isOpen={revokeTarget !== null}
        onClose={() => setRevokeTarget(null)}
        onConfirm={() => {
          if (revokeTarget) {
            revokeMutation.mutate(revokeTarget);
            setRevokeTarget(null);
          }
        }}
        title="Revoke Badge"
        message="Are you sure you want to revoke this badge?"
        variant="danger"
        confirmLabel="Revoke"
      />
    </div>
  );
}
