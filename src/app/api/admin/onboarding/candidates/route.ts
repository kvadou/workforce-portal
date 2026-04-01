import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email/onboarding-emails";

/**
 * Generate a secure random temporary password
 */
function generateTempPassword(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generate a password reset token with expiration
 */
function generateResetToken(): { token: string; expires: Date } {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date();
  expires.setDate(expires.getDate() + 7); // 7 days expiration
  return { token, expires };
}

/**
 * Hash a temporary password using bcrypt
 */
async function hashTempPassword(password: string): Promise<string> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.hash(password, 10);
}

/**
 * POST /api/admin/onboarding/candidates
 * Manually add a candidate to onboarding
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and SUPER_ADMIN can add candidates
    if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { email, firstName, lastName, phone, team, sendEmail = true } = body;

    // Validate required fields
    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Email, first name, and last name are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { onboardingProgress: true },
    });

    if (existingUser) {
      // If user exists but has no onboarding progress, create it
      if (!existingUser.onboardingProgress) {
        const progress = await prisma.onboardingProgress.create({
          data: {
            userId: existingUser.id,
            status: "PENDING",
            currentStep: 1,
          },
        });

        // Update user to onboarding status
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            isOnboarding: true,
            role: "ONBOARDING_TUTOR",
          },
        });

        return NextResponse.json({
          message: "Onboarding progress created for existing user",
          userId: existingUser.id,
          progressId: progress.id,
          isNewUser: false,
        });
      }

      return NextResponse.json(
        { error: "User already exists and has onboarding progress" },
        { status: 409 }
      );
    }

    // Get the HQ organization for new users (or specified team org)
    let organizationId: string | null = null;

    if (team === "WESTSIDE") {
      const org = await prisma.organization.findFirst({
        where: { subdomain: "westside" },
      });
      organizationId = org?.id || null;
    } else if (team === "EASTSIDE") {
      const org = await prisma.organization.findFirst({
        where: { subdomain: "eastside" },
      });
      organizationId = org?.id || null;
    } else {
      // Default to HQ
      const hqOrg = await prisma.organization.findFirst({
        where: { isHQ: true },
      });
      organizationId = hqOrg?.id || null;
    }

    // Generate reset token for password setup
    const { token: resetToken, expires: resetExpires } = generateResetToken();

    // Create new user with ONBOARDING_TUTOR role
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: `${firstName} ${lastName}`,
        phone: phone || null,
        passwordHash: await hashTempPassword(generateTempPassword()),
        role: "ONBOARDING_TUTOR",
        isOnboarding: true,
        organizationId,
        hireDate: new Date(),
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    // Create onboarding progress
    const progress = await prisma.onboardingProgress.create({
      data: {
        userId: user.id,
        status: "PENDING",
        currentStep: 1,
      },
    });

    console.log(
      `Admin ${session.user.email} created new onboarding user: ${user.email} (ID: ${user.id})`
    );

    // Send welcome email with password setup link
    if (sendEmail) {
      try {
        await sendWelcomeEmail(user.email, user.name || "", resetToken);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      message: "Candidate added successfully",
      userId: user.id,
      progressId: progress.id,
      emailSent: sendEmail,
      isNewUser: true,
    });
  } catch (error) {
    console.error("Error adding candidate:", error);
    return NextResponse.json(
      { error: "Failed to add candidate" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/onboarding/candidates
 * Remove a candidate from onboarding (deletes user and progress)
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and SUPER_ADMIN can delete candidates
    if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");

    if (!userId && !email) {
      return NextResponse.json(
        { error: "userId or email is required" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findFirst({
      where: userId ? { id: userId } : { email: email!.toLowerCase() },
      include: { onboardingProgress: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only allow deleting ONBOARDING_TUTOR users
    if (user.role !== "ONBOARDING_TUTOR") {
      return NextResponse.json(
        { error: "Can only delete users with ONBOARDING_TUTOR role" },
        { status: 400 }
      );
    }

    // Delete onboarding progress first (if exists)
    if (user.onboardingProgress) {
      await prisma.onboardingProgress.delete({
        where: { userId: user.id },
      });
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: user.id },
    });

    console.log(
      `Admin ${session.user.email} deleted onboarding user: ${user.email} (ID: ${user.id})`
    );

    return NextResponse.json({
      message: "Candidate deleted successfully",
      deletedUserId: user.id,
      deletedEmail: user.email,
    });
  } catch (error) {
    console.error("Error deleting candidate:", error);
    return NextResponse.json(
      { error: "Failed to delete candidate" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/onboarding/candidates
 * Get list of onboarding candidates with filters
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const candidates = await prisma.onboardingProgress.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            hireDate: true,
            createdAt: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        orientationSession: {
          select: {
            id: true,
            title: true,
            scheduledAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(candidates);
  } catch (error) {
    console.error("Error fetching candidates:", error);
    return NextResponse.json(
      { error: "Failed to fetch candidates" },
      { status: 500 }
    );
  }
}
