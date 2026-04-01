import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

/**
 * GET /api/admin/dashboard
 * Aggregated KPIs for the admin command center
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      // Pipeline
      onboardingByStatus,
      // Tutors
      totalActiveTutors,
      newTutors30d,
      tutorsByStatus,
      // Training
      activeEnrollments,
      completedEnrollments30d,
      totalEnrollments30d,
      // Engagement
      alertsActive,
      badgesAwarded30d,
      // Content
      publishedPages,
      activeResources,
      activeAnnouncements,
      // Recent Activity
      recentAuditLogs,
      // Action Items
      pendingW9,
      pendingProfiles,
      pendingActivations,
    ] = await Promise.all([
      // Pipeline: group onboarding by stage
      prisma.onboardingProgress.groupBy({
        by: ["status"],
        _count: { id: true },
      }),

      // Active tutors
      prisma.tutorProfile.count({ where: { status: "ACTIVE" } }),

      // New tutors in last 30 days
      prisma.tutorProfile.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),

      // Tutors by status
      prisma.tutorProfile.groupBy({
        by: ["status"],
        _count: { id: true },
      }),

      // Active course enrollments
      prisma.courseEnrollment.count({
        where: { status: "IN_PROGRESS" },
      }),

      // Completed enrollments in 30d
      prisma.courseEnrollment.count({
        where: {
          status: "COMPLETED",
          completedAt: { gte: thirtyDaysAgo },
        },
      }),

      // Total enrollments in 30d (for completion rate)
      prisma.courseEnrollment.count({
        where: {
          startedAt: { gte: thirtyDaysAgo },
        },
      }),

      // Active engagement alerts
      prisma.engagementAlert.count({
        where: { status: "ACTIVE" },
      }),

      // Badges awarded in 30d
      prisma.userBadge.count({
        where: { earnedAt: { gte: thirtyDaysAgo } },
      }),

      // Published pages
      prisma.page.count({ where: { status: "PUBLISHED" } }),

      // Active resources
      prisma.resource.count({ where: { isActive: true } }),

      // Active announcements
      prisma.announcement.count({ where: { isActive: true } }),

      // Recent audit logs
      prisma.tutorAuditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          action: true,
          field: true,
          newValue: true,
          performedByName: true,
          createdAt: true,
          tutorProfile: {
            select: {
              user: { select: { name: true } },
            },
          },
        },
      }),

      // Pending W-9
      prisma.onboardingProgress.count({
        where: {
          status: "W9_PENDING",
        },
      }),

      // Pending profiles
      prisma.onboardingProgress.count({
        where: {
          status: "PROFILE_PENDING",
        },
      }),

      // Pending activations (completed onboarding, not yet activated)
      prisma.onboardingProgress.count({
        where: {
          status: "COMPLETED",
        },
      }),
    ]);

    // Group pipeline into stages
    const preOrientation = onboardingByStatus
      .filter((s) =>
        ["PENDING", "WELCOME", "VIDEOS_IN_PROGRESS", "QUIZ_PENDING", "QUIZ_FAILED", "PROFILE_PENDING", "W9_PENDING", "AWAITING_ORIENTATION", "ORIENTATION_SCHEDULED"].includes(s.status)
      )
      .reduce((sum, s) => sum + s._count.id, 0);

    const inTraining = onboardingByStatus
      .filter((s) => ["POST_ORIENTATION_TRAINING", "SHADOW_LESSONS"].includes(s.status))
      .reduce((sum, s) => sum + s._count.id, 0);

    const pendingActivation = onboardingByStatus
      .filter((s) => s.status === "COMPLETED")
      .reduce((sum, s) => sum + s._count.id, 0);

    const completionRate = totalEnrollments30d > 0
      ? Math.round((completedEnrollments30d / totalEnrollments30d) * 100)
      : 0;

    // Format audit logs
    const recentActivity = recentAuditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      field: log.field,
      newValue: log.newValue,
      performedBy: log.performedByName || "System",
      tutorName: log.tutorProfile?.user?.name || "Unknown",
      createdAt: log.createdAt,
    }));

    // Status breakdown
    const statusBreakdown: Record<string, number> = {};
    for (const s of tutorsByStatus) {
      statusBreakdown[s.status] = s._count.id;
    }

    return NextResponse.json({
      pipeline: {
        preOrientation,
        inTraining,
        pendingActivation,
        total: preOrientation + inTraining + pendingActivation,
      },
      tutors: {
        active: totalActiveTutors,
        new30d: newTutors30d,
        byStatus: statusBreakdown,
      },
      training: {
        activeEnrollments,
        completionRate,
        completedRecently: completedEnrollments30d,
      },
      engagement: {
        activeAlerts: alertsActive,
        badgesAwarded: badgesAwarded30d,
      },
      content: {
        publishedPages,
        activeResources,
        activeAnnouncements,
      },
      actionItems: {
        pendingW9,
        pendingProfiles,
        pendingActivations,
      },
      recentActivity,
    });
  } catch (error) {
    console.error("[Admin Dashboard API] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
