import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { activateTutor, ActivationOptions } from "@/lib/tutor-activation";
import type { UserRole, TutorTeam } from "@prisma/client";

/**
 * POST /api/admin/onboarding/activate
 * Activates a tutor who has completed onboarding
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, team, baseHourlyRate, skipExternalIntegrations } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const activationOptions: ActivationOptions = {
      userId,
      activatedBy: session.user.id,
      team: team as TutorTeam | undefined,
      baseHourlyRate: baseHourlyRate ? parseFloat(baseHourlyRate) : undefined,
      skipExternalIntegrations: skipExternalIntegrations === true,
    };

    const result = await activateTutor(activationOptions);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Activation failed",
          details: result.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      tutorProfileId: result.tutorProfileId,
      tutorCruncherId: result.tutorCruncherId,
      branchId: result.branchId,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error("Error activating tutor:", error);
    return NextResponse.json(
      { error: "Failed to activate tutor" },
      { status: 500 }
    );
  }
}
