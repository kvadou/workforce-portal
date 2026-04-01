/**
 * Tutor Activation Workflow
 *
 * Orchestrates the full activation process when a tutor completes onboarding:
 * 1. Upgrade role from ONBOARDING_TUTOR to TUTOR
 * 2. Create TutorProfile linked to User
 * 3. Call TutorCruncher API to create contractor profile
 * 4. Set up Branch payment profile
 * 5. Send activation email
 */

import { prisma } from "@/lib/prisma";
import { TutorStatus, TutorTeam } from "@prisma/client";
import { createTutorCruncherContractor } from "@/lib/integrations/tutorcruncher";
import { createBranchPaymentProfile } from "@/lib/integrations/branch";
import { sendActivationEmail } from "@/lib/email/onboarding-emails";

export interface ActivationResult {
  success: boolean;
  tutorProfileId?: string;
  tutorCruncherId?: number;
  branchId?: string;
  errors: string[];
  warnings: string[];
}

export interface ActivationOptions {
  userId: string;
  activatedBy: string;
  team?: TutorTeam;
  baseHourlyRate?: number;
  skipExternalIntegrations?: boolean; // For testing
}

/**
 * Activate a tutor who has completed onboarding
 */
export async function activateTutor(
  options: ActivationOptions
): Promise<ActivationResult> {
  const { userId, activatedBy, team, baseHourlyRate, skipExternalIntegrations } =
    options;

  const result: ActivationResult = {
    success: false,
    errors: [],
    warnings: [],
  };

  try {
    // Get user with onboarding progress
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        onboardingProgress: true,
        organization: true,
      },
    });

    if (!user) {
      result.errors.push("User not found");
      return result;
    }

    if (user.role !== "ONBOARDING_TUTOR") {
      result.errors.push(`User is already ${user.role}, not ONBOARDING_TUTOR`);
      return result;
    }

    if (user.onboardingProgress?.status !== "COMPLETED") {
      result.errors.push("Onboarding is not completed");
      return result;
    }

    // Step 1: Create TutorProfile
    const tutorProfile = await prisma.tutorProfile.create({
      data: {
        userId: user.id,
        status: TutorStatus.ACTIVE,
        team: team || determineTeam(user.organization?.subdomain),
        hireDate: user.hireDate || new Date(),
        activatedAt: new Date(),
        baseHourlyRate: baseHourlyRate ? baseHourlyRate : undefined,
        isSchoolCertified: false,
        isBqCertified: false,
        isPlaygroupCertified: false,
      },
    });

    result.tutorProfileId = tutorProfile.id;

    // Step 2: Create TutorCruncher contractor profile
    if (!skipExternalIntegrations) {
      try {
        const tcResult = await createTutorCruncherContractor({
          firstName: user.name?.split(" ")[0] || "",
          lastName: user.name?.split(" ").slice(1).join(" ") || "",
          email: user.email,
          phone: user.phone || undefined,
          hourlyRate: baseHourlyRate || 25, // Default rate
        });

        if (tcResult.success && tcResult.contractorId) {
          await prisma.tutorProfile.update({
            where: { id: tutorProfile.id },
            data: { tutorCruncherId: tcResult.contractorId },
          });
          result.tutorCruncherId = tcResult.contractorId;
        } else {
          result.warnings.push(
            `TutorCruncher integration failed: ${tcResult.error || "Unknown error"}`
          );
        }
      } catch (error) {
        result.warnings.push(
          `TutorCruncher integration error: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    // Step 3: Create Branch payment profile
    if (!skipExternalIntegrations) {
      try {
        const branchResult = await createBranchPaymentProfile({
          email: user.email,
          firstName: user.name?.split(" ")[0] || "",
          lastName: user.name?.split(" ").slice(1).join(" ") || "",
          phone: user.phone || undefined,
        });

        if (branchResult.success && branchResult.profileId) {
          await prisma.tutorProfile.update({
            where: { id: tutorProfile.id },
            data: { branchId: branchResult.profileId },
          });
          result.branchId = branchResult.profileId;
        } else {
          result.warnings.push(
            `Branch integration failed: ${branchResult.error || "Unknown error"}`
          );
        }
      } catch (error) {
        result.warnings.push(
          `Branch integration error: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    // Step 4: Update user role to TUTOR
    await prisma.user.update({
      where: { id: user.id },
      data: {
        role: "TUTOR",
        isOnboarding: false,
      },
    });

    // Step 5: Update onboarding progress
    await prisma.onboardingProgress.update({
      where: { userId: user.id },
      data: {
        status: "ACTIVATED",
        activatedAt: new Date(),
        activatedBy,
      },
    });

    // Step 6: Send activation email
    try {
      await sendActivationEmail(user.email, user.name || "Tutor");
    } catch (error) {
      result.warnings.push(
        `Failed to send activation email: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    result.success = true;
    return result;
  } catch (error) {
    result.errors.push(
      `Activation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    return result;
  }
}

/**
 * Determine team based on organization subdomain
 */
function determineTeam(subdomain?: string | null): TutorTeam | undefined {
  if (!subdomain) return TutorTeam.LA; // Default to LA for HQ

  const teamMap: Record<string, TutorTeam> = {
    hq: TutorTeam.LA,
    la: TutorTeam.LA,
    nyc: TutorTeam.NYC,
    sf: TutorTeam.SF,
    westside: TutorTeam.WESTSIDE,
    eastside: TutorTeam.EASTSIDE,
    online: TutorTeam.ONLINE,
  };

  return teamMap[subdomain.toLowerCase()] || TutorTeam.LA;
}

/**
 * Deactivate a tutor (quit or terminated)
 */
export async function deactivateTutor(
  userId: string,
  reason: "QUIT" | "TERMINATED",
  deactivatedBy: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId },
    });

    if (!tutorProfile) {
      return { success: false, error: "Tutor profile not found" };
    }

    // Update tutor profile status
    await prisma.tutorProfile.update({
      where: { id: tutorProfile.id },
      data: {
        status: reason === "QUIT" ? TutorStatus.QUIT : TutorStatus.TERMINATED,
        terminatedAt: new Date(),
      },
    });

    // Add a note about deactivation
    if (notes) {
      await prisma.tutorNote.create({
        data: {
          tutorProfileId: tutorProfile.id,
          type: "ADMIN",
          content: `${reason}: ${notes}`,
          createdBy: deactivatedBy,
          isInternal: true,
        },
      });
    }

    // Update user role (optional - could keep as TUTOR but inactive)
    // await prisma.user.update({
    //   where: { id: userId },
    //   data: { role: "ONBOARDING_TUTOR" },
    // });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Reactivate a previously inactive tutor
 */
export async function reactivateTutor(
  userId: string,
  reactivatedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId },
    });

    if (!tutorProfile) {
      return { success: false, error: "Tutor profile not found" };
    }

    if (tutorProfile.status === "ACTIVE") {
      return { success: false, error: "Tutor is already active" };
    }

    await prisma.tutorProfile.update({
      where: { id: tutorProfile.id },
      data: {
        status: TutorStatus.ACTIVE,
        terminatedAt: null,
      },
    });

    // Add a note about reactivation
    await prisma.tutorNote.create({
      data: {
        tutorProfileId: tutorProfile.id,
        type: "ADMIN",
        content: "Tutor reactivated",
        createdBy: reactivatedBy,
        isInternal: true,
      },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
