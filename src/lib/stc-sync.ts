import { prisma } from "@/lib/prisma";
import { stcDatabase, type STCContractor } from "@/lib/stc-database";
import crypto from "crypto";

// Generate a placeholder password hash that can't be used for login
// Users will need to use password reset flow
function generatePlaceholderPasswordHash(): string {
  return crypto.randomBytes(64).toString("hex");
}

export interface STCSyncResult {
  success: boolean;
  contractorsFound: number;
  contractorsCreated: number;
  contractorsUpdated: number;
  errors: string[];
}

/**
 * Sync approved contractors from STC to STT
 * Creates User + TutorProfile records for new contractors
 */
export async function syncContractorsFromSTC(): Promise<STCSyncResult> {
  const result: STCSyncResult = {
    success: true,
    contractorsFound: 0,
    contractorsCreated: 0,
    contractorsUpdated: 0,
    errors: [],
  };

  const logEntry = await prisma.sTCSyncLog.create({
    data: {
      syncType: "contractors",
      status: "IN_PROGRESS",
    },
  });

  try {
    // Fetch approved contractors from STC
    const stcContractors: STCContractor[] = await stcDatabase.getApprovedContractors();
    result.contractorsFound = stcContractors.length;

    // Get existing users by email for comparison
    const existingUsers = await prisma.user.findMany({
      where: {
        email: { in: stcContractors.map((c) => c.email.toLowerCase()) },
      },
      include: {
        tutorProfile: true,
      },
    });

    const existingByEmail = new Map(existingUsers.map((u) => [u.email.toLowerCase(), u]));

    // Get default organization (HQ)
    const defaultOrg = await prisma.organization.findFirst({
      where: { isHQ: true },
    });

    if (!defaultOrg) {
      throw new Error("No HQ organization found");
    }

    for (const contractor of stcContractors) {
      try {
        const email = contractor.email.toLowerCase();
        const existingUser = existingByEmail.get(email);

        if (!existingUser) {
          // Create new user and tutor profile
          // Password is a placeholder - user must use password reset
          await prisma.user.create({
            data: {
              email,
              passwordHash: generatePlaceholderPasswordHash(),
              name: `${contractor.first_name} ${contractor.last_name}`,
              role: "ONBOARDING_TUTOR",
              organizationId: defaultOrg.id,
              isOnboarding: true,
              tutorProfile: {
                create: {
                  status: "PENDING",
                  tutorCruncherId: contractor.contractor_id,
                },
              },
            },
          });
          result.contractorsCreated++;
        } else if (existingUser.tutorProfile) {
          // Update existing tutor profile with TutorCruncher ID if missing
          if (!existingUser.tutorProfile.tutorCruncherId) {
            await prisma.tutorProfile.update({
              where: { id: existingUser.tutorProfile.id },
              data: {
                tutorCruncherId: contractor.contractor_id,
              },
            });
            result.contractorsUpdated++;
          }

          // Also update user name if different
          const expectedName = `${contractor.first_name} ${contractor.last_name}`;
          if (existingUser.name !== expectedName) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { name: expectedName },
            });
            result.contractorsUpdated++;
          }
        } else {
          // User exists but no tutor profile - create one
          await prisma.tutorProfile.create({
            data: {
              userId: existingUser.id,
              status: "PENDING",
              tutorCruncherId: contractor.contractor_id,
            },
          });
          result.contractorsCreated++;
        }
      } catch (err) {
        const errorMsg = `Failed to sync contractor ${contractor.email}: ${err instanceof Error ? err.message : "Unknown error"}`;
        result.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // Update sync log
    await prisma.sTCSyncLog.update({
      where: { id: logEntry.id },
      data: {
        status: result.errors.length === 0 ? "SUCCESS" : "PARTIAL",
        contractorsFound: result.contractorsFound,
        contractorsCreated: result.contractorsCreated,
        contractorsUpdated: result.contractorsUpdated,
        errors: result.errors.length > 0 ? result.errors : undefined,
        completedAt: new Date(),
      },
    });

    return result;
  } catch (err) {
    result.success = false;
    const errorMsg = err instanceof Error ? err.message : "Unknown sync error";
    result.errors.push(errorMsg);

    // Update sync log with failure
    await prisma.sTCSyncLog.update({
      where: { id: logEntry.id },
      data: {
        status: "FAILED",
        errors: [errorMsg],
        completedAt: new Date(),
      },
    });

    return result;
  }
}

/**
 * Get recent sync logs
 */
export async function getSyncLogs(limit = 10) {
  return prisma.sTCSyncLog.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
  });
}

/**
 * Get sync statistics
 */
export async function getSyncStats() {
  const lastSync = await prisma.sTCSyncLog.findFirst({
    where: { status: "SUCCESS" },
    orderBy: { startedAt: "desc" },
  });

  const totalSyncs = await prisma.sTCSyncLog.count();
  const successfulSyncs = await prisma.sTCSyncLog.count({
    where: { status: "SUCCESS" },
  });
  const totalCreated = await prisma.sTCSyncLog.aggregate({
    _sum: { contractorsCreated: true },
  });

  return {
    lastSyncAt: lastSync?.completedAt,
    totalSyncs,
    successfulSyncs,
    totalContractorsCreated: totalCreated._sum.contractorsCreated || 0,
  };
}
