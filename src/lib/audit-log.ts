import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

interface AuditLogEntry {
  tutorProfileId: string;
  action: string;
  field?: string;
  previousValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
  performedBy: string;
  performedByName?: string;
}

/**
 * Record an audit log entry for a tutor profile change
 */
export async function recordAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.tutorAuditLog.create({
      data: {
        tutorProfileId: entry.tutorProfileId,
        action: entry.action,
        field: entry.field,
        previousValue: entry.previousValue,
        newValue: entry.newValue,
        metadata: (entry.metadata as Prisma.InputJsonValue) ?? undefined,
        performedBy: entry.performedBy,
        performedByName: entry.performedByName,
      },
    });
  } catch (error) {
    console.error("Failed to record audit log:", error);
    // Don't throw - audit logging should not break the main operation
  }
}

/**
 * Record a status change
 */
export async function recordStatusChange(
  tutorProfileId: string,
  previousStatus: string,
  newStatus: string,
  performedBy: string,
  performedByName?: string
): Promise<void> {
  await recordAuditLog({
    tutorProfileId,
    action: "STATUS_CHANGE",
    field: "status",
    previousValue: previousStatus,
    newValue: newStatus,
    performedBy,
    performedByName,
  });
}

/**
 * Record a team change
 */
export async function recordTeamChange(
  tutorProfileId: string,
  previousTeam: string | null,
  newTeam: string,
  performedBy: string,
  performedByName?: string
): Promise<void> {
  await recordAuditLog({
    tutorProfileId,
    action: "TEAM_CHANGE",
    field: "team",
    previousValue: previousTeam || "Unassigned",
    newValue: newTeam,
    performedBy,
    performedByName,
  });
}

/**
 * Record a label added
 */
export async function recordLabelAdded(
  tutorProfileId: string,
  labelName: string,
  performedBy: string,
  performedByName?: string
): Promise<void> {
  await recordAuditLog({
    tutorProfileId,
    action: "LABEL_ADDED",
    newValue: labelName,
    performedBy,
    performedByName,
  });
}

/**
 * Record a label removed
 */
export async function recordLabelRemoved(
  tutorProfileId: string,
  labelName: string,
  performedBy: string,
  performedByName?: string
): Promise<void> {
  await recordAuditLog({
    tutorProfileId,
    action: "LABEL_REMOVED",
    previousValue: labelName,
    performedBy,
    performedByName,
  });
}

/**
 * Record a certification change
 */
export async function recordCertificationChange(
  tutorProfileId: string,
  field: string,
  previousValue: boolean,
  newValue: boolean,
  performedBy: string,
  performedByName?: string
): Promise<void> {
  await recordAuditLog({
    tutorProfileId,
    action: newValue ? "CERTIFICATION_GRANTED" : "CERTIFICATION_REVOKED",
    field,
    previousValue: previousValue ? "Yes" : "No",
    newValue: newValue ? "Yes" : "No",
    performedBy,
    performedByName,
  });
}

/**
 * Record a general field update
 */
export async function recordFieldUpdate(
  tutorProfileId: string,
  field: string,
  previousValue: string | null | undefined,
  newValue: string | null | undefined,
  performedBy: string,
  performedByName?: string
): Promise<void> {
  await recordAuditLog({
    tutorProfileId,
    action: "FIELD_UPDATE",
    field,
    previousValue: previousValue ?? undefined,
    newValue: newValue ?? undefined,
    performedBy,
    performedByName,
  });
}
