import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";
import { createTutorCruncherContractor } from "@/lib/integrations/tutorcruncher";
import { addToGoogleGroup, resolveGroupEmail } from "@/lib/integrations/google-groups";
import { sendActivationEmail } from "@/lib/email/onboarding-emails";
import { activateTutor } from "@/lib/tutor-activation";
import { v4 as uuidv4 } from "uuid";

type ActivationStep =
  | "generate_branch_id"
  | "create_tc_profile"
  | "add_google_group"
  | "send_welcome_email"
  | "full_activate";

/**
 * POST /api/admin/onboarding/[id]/activate-step
 * Execute an individual activation step
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { step, groupKey } = body as { step: ActivationStep; groupKey?: string };

    if (!step) {
      return NextResponse.json(
        { error: "step is required" },
        { status: 400 }
      );
    }

    // Get onboarding progress with user and tutor profile
    const progress = await prisma.onboardingProgress.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            tutorProfile: true,
          },
        },
      },
    });

    if (!progress) {
      return NextResponse.json(
        { error: "Onboarding progress not found" },
        { status: 404 }
      );
    }

    // Gate all activation steps behind orientation debrief
    if (!progress.orientationDebriefComplete) {
      return NextResponse.json(
        { error: "Orientation debrief must be completed before activation steps" },
        { status: 400 }
      );
    }

    const user = progress.user;

    switch (step) {
      case "generate_branch_id": {
        const branchId = uuidv4();

        // Save to TutorProfile if it exists, otherwise just track in onboarding
        if (user.tutorProfile) {
          await prisma.tutorProfile.update({
            where: { id: user.tutorProfile.id },
            data: { branchId },
          });
        }

        await prisma.onboardingProgress.update({
          where: { id },
          data: {
            branchIdGenerated: true,
            branchIdGeneratedAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          step: "generate_branch_id",
          branchId,
        });
      }

      case "create_tc_profile": {
        const tcResult = await createTutorCruncherContractor({
          firstName: user.name?.split(" ")[0] || "",
          lastName: user.name?.split(" ").slice(1).join(" ") || "",
          email: user.email,
          phone: user.phone || undefined,
          hourlyRate: 25, // Default rate
        });

        if (!tcResult.success) {
          return NextResponse.json(
            { error: `TutorCruncher creation failed: ${tcResult.error}` },
            { status: 500 }
          );
        }

        // Save TC ID to TutorProfile if it exists
        if (user.tutorProfile && tcResult.contractorId) {
          await prisma.tutorProfile.update({
            where: { id: user.tutorProfile.id },
            data: { tutorCruncherId: tcResult.contractorId },
          });
        }

        await prisma.onboardingProgress.update({
          where: { id },
          data: {
            tutorCruncherCreated: true,
            tutorCruncherCreatedAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          step: "create_tc_profile",
          contractorId: tcResult.contractorId,
        });
      }

      case "add_google_group": {
        if (!groupKey) {
          return NextResponse.json(
            { error: "groupKey is required for add_google_group step" },
            { status: 400 }
          );
        }

        const groupEmail = resolveGroupEmail(groupKey);
        if (!groupEmail) {
          return NextResponse.json(
            { error: `Invalid group key: ${groupKey}` },
            { status: 400 }
          );
        }

        const result = await addToGoogleGroup(user.email, groupEmail);

        if (result.success) {
          await prisma.onboardingProgress.update({
            where: { id },
            data: {
              googleGroupAdded: true,
              googleGroupAddedAt: new Date(),
              googleGroupName: groupKey,
            },
          });
        }

        return NextResponse.json({
          success: result.success,
          step: "add_google_group",
          message: result.message,
          groupKey,
        });
      }

      case "send_welcome_email": {
        // Gated by ENABLE_WELCOME_EMAIL env var
        if (process.env.ENABLE_WELCOME_EMAIL !== "true") {
          return NextResponse.json(
            { error: "Welcome email sending is not enabled (ENABLE_WELCOME_EMAIL)" },
            { status: 400 }
          );
        }

        const sent = await sendActivationEmail(
          user.email,
          user.name || "Tutor"
        );

        if (sent) {
          await prisma.onboardingProgress.update({
            where: { id },
            data: {
              welcomeEmailSent: true,
              welcomeEmailSentAt: new Date(),
            },
          });
        }

        return NextResponse.json({
          success: sent,
          step: "send_welcome_email",
        });
      }

      case "full_activate": {
        const activationResult = await activateTutor({
          userId: user.id,
          activatedBy: session.user.email || session.user.id || "admin",
        });

        return NextResponse.json({
          success: activationResult.success,
          step: "full_activate",
          tutorProfileId: activationResult.tutorProfileId,
          tutorCruncherId: activationResult.tutorCruncherId,
          branchId: activationResult.branchId,
          errors: activationResult.errors,
          warnings: activationResult.warnings,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown activation step: ${step}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Activation step error:", error);
    return NextResponse.json(
      { error: "Failed to execute activation step" },
      { status: 500 }
    );
  }
}
