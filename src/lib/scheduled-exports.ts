import { prisma } from "@/lib/prisma";
import type { ExportType, Prisma } from "@prisma/client";

interface ExportResult {
  data: Record<string, unknown>[];
  columns: string[];
  rowCount: number;
}

/**
 * Generate export data based on type and filters
 */
export async function generateExportData(
  type: ExportType,
  filters?: Record<string, unknown>,
  columns?: string[]
): Promise<ExportResult> {
  switch (type) {
    case "TUTORS":
      return generateTutorExport(filters, columns);
    case "LESSONS":
      return generateLessonExport(filters);
    case "ENROLLMENTS":
      return generateEnrollmentExport(filters);
    case "BADGES":
      return generateBadgeExport(filters);
    case "ANALYTICS":
      return generateAnalyticsExport(filters);
    default:
      throw new Error(`Unknown export type: ${type}`);
  }
}

async function generateTutorExport(
  filters?: Record<string, unknown>,
  columns?: string[]
): Promise<ExportResult> {
  const where: Prisma.TutorProfileWhereInput = {};

  if (filters?.status) {
    where.status = filters.status as never;
  }
  if (filters?.team) {
    where.team = filters.team as never;
  }

  const tutors = await prisma.tutorProfile.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          createdAt: true,
        },
      },
      certifications: {
        where: { status: "COMPLETED" },
        select: { type: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const allColumns = [
    "name",
    "email",
    "phone",
    "role",
    "status",
    "team",
    "hireDate",
    "totalLessons",
    "totalHours",
    "averageRating",
    "certifications",
    "createdAt",
  ];

  const selectedColumns = columns?.filter((c) => allColumns.includes(c)) || allColumns;

  const data = tutors.map((t) => {
    const row: Record<string, unknown> = {};
    if (selectedColumns.includes("name")) row.name = t.user.name || "";
    if (selectedColumns.includes("email")) row.email = t.user.email;
    if (selectedColumns.includes("phone")) row.phone = t.user.phone || "";
    if (selectedColumns.includes("role")) row.role = t.user.role;
    if (selectedColumns.includes("status")) row.status = t.status;
    if (selectedColumns.includes("team")) row.team = t.team || "";
    if (selectedColumns.includes("hireDate"))
      row.hireDate = t.hireDate?.toISOString().split("T")[0] || "";
    if (selectedColumns.includes("totalLessons")) row.totalLessons = t.totalLessons;
    if (selectedColumns.includes("totalHours"))
      row.totalHours = t.totalHours?.toNumber() || 0;
    if (selectedColumns.includes("averageRating"))
      row.averageRating = t.averageRating?.toNumber() || "";
    if (selectedColumns.includes("certifications"))
      row.certifications = t.certifications.map((c) => c.type).join(", ");
    if (selectedColumns.includes("createdAt"))
      row.createdAt = t.createdAt.toISOString().split("T")[0];
    return row;
  });

  return { data, columns: selectedColumns, rowCount: data.length };
}

async function generateLessonExport(
  filters?: Record<string, unknown>
): Promise<ExportResult> {
  // For now, return tutor lesson stats since we don't have a lessons table
  const tutors = await prisma.tutorProfile.findMany({
    where: {
      totalLessons: { gt: 0 },
    },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
    orderBy: { totalLessons: "desc" },
  });

  const columns = ["tutorName", "email", "totalLessons", "totalHours", "averageRating", "lastLessonDate"];

  const data = tutors.map((t) => ({
    tutorName: t.user.name || t.user.email,
    email: t.user.email,
    totalLessons: t.totalLessons,
    totalHours: t.totalHours?.toNumber() || 0,
    averageRating: t.averageRating?.toNumber() || "",
    lastLessonDate: t.lastLessonDate?.toISOString().split("T")[0] || "",
  }));

  return { data, columns, rowCount: data.length };
}

async function generateEnrollmentExport(
  filters?: Record<string, unknown>
): Promise<ExportResult> {
  const where: Prisma.CourseEnrollmentWhereInput = {};

  if (filters?.status) {
    where.status = filters.status as never;
  }

  const enrollments = await prisma.courseEnrollment.findMany({
    where,
    include: {
      user: {
        select: { name: true, email: true },
      },
      course: {
        select: { title: true, category: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const columns = ["userName", "email", "courseTitle", "category", "status", "progress", "startedAt", "completedAt"];

  const data = enrollments.map((e) => ({
    userName: e.user.name || e.user.email,
    email: e.user.email,
    courseTitle: e.course.title,
    category: e.course.category,
    status: e.status,
    progress: e.progress,
    startedAt: e.startedAt?.toISOString().split("T")[0] || "",
    completedAt: e.completedAt?.toISOString().split("T")[0] || "",
  }));

  return { data, columns, rowCount: data.length };
}

async function generateBadgeExport(
  filters?: Record<string, unknown>
): Promise<ExportResult> {
  const badges = await prisma.userBadge.findMany({
    include: {
      user: {
        select: { name: true, email: true },
      },
      badge: {
        select: { title: true, badgeKey: true },
      },
    },
    orderBy: { earnedAt: "desc" },
  });

  const columns = ["userName", "email", "badgeTitle", "badgeKey", "earnedAt"];

  const data = badges.map((b) => ({
    userName: b.user.name || b.user.email,
    email: b.user.email,
    badgeTitle: b.badge.title,
    badgeKey: b.badge.badgeKey,
    earnedAt: b.earnedAt.toISOString().split("T")[0],
  }));

  return { data, columns, rowCount: data.length };
}

async function generateAnalyticsExport(
  filters?: Record<string, unknown>
): Promise<ExportResult> {
  const [totalUsers, tutorCount, lessonStats, badgeCount, enrollmentCount] = await Promise.all([
    prisma.user.count(),
    prisma.tutorProfile.count(),
    prisma.tutorProfile.aggregate({
      _sum: { totalLessons: true, totalHours: true },
      _avg: { averageRating: true },
    }),
    prisma.userBadge.count(),
    prisma.courseEnrollment.count(),
  ]);

  const columns = ["metric", "value"];

  const data = [
    { metric: "Total Users", value: totalUsers },
    { metric: "Total Tutors", value: tutorCount },
    { metric: "Total Lessons", value: lessonStats._sum.totalLessons || 0 },
    { metric: "Total Hours", value: lessonStats._sum.totalHours?.toNumber() || 0 },
    { metric: "Average Rating", value: lessonStats._avg.averageRating?.toNumber()?.toFixed(2) || "N/A" },
    { metric: "Badges Earned", value: badgeCount },
    { metric: "Course Enrollments", value: enrollmentCount },
  ];

  return { data, columns, rowCount: data.length };
}

/**
 * Convert export data to CSV string
 */
export function convertToCSV(result: ExportResult): string {
  const { data, columns } = result;

  if (data.length === 0) {
    return columns.join(",");
  }

  const header = columns.join(",");
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col];
        if (value === null || value === undefined) return "";
        const stringValue = String(value);
        // Escape quotes and wrap in quotes if contains comma or quote
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(",")
  );

  return [header, ...rows].join("\n");
}

/**
 * Calculate next run time for a scheduled export
 */
export function calculateNextRunTime(
  frequency: "DAILY" | "WEEKLY" | "MONTHLY",
  timeOfDay: string,
  dayOfWeek?: number,
  dayOfMonth?: number
): Date {
  const [hours, minutes] = timeOfDay.split(":").map(Number);
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);

  // If time has passed today, start from tomorrow
  if (next <= new Date()) {
    next.setDate(next.getDate() + 1);
  }

  switch (frequency) {
    case "DAILY":
      // Already set to next occurrence
      break;

    case "WEEKLY":
      const targetDay = dayOfWeek ?? 1; // Default to Monday
      while (next.getDay() !== targetDay) {
        next.setDate(next.getDate() + 1);
      }
      break;

    case "MONTHLY":
      const targetDate = dayOfMonth ?? 1; // Default to 1st
      next.setDate(targetDate);
      if (next <= new Date()) {
        next.setMonth(next.getMonth() + 1);
      }
      break;
  }

  return next;
}
