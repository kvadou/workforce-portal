import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail, sendNewHireNotification } from "@/lib/email/onboarding-emails";
import { createOnboardingGoal } from "@/lib/onboarding-gamification";

// ATS Webhook secret for signature verification
const ATS_WEBHOOK_SECRET = process.env.ATS_WEBHOOK_SECRET || "";

// Expected ATS webhook payload structure
interface ATSHireEvent {
  event: "candidate.hired" | "candidate.status_changed";
  timestamp: string;
  data: {
    candidate: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
    };
    application: {
      id: string;
      jobTitle?: string;
      hiredDate?: string;
    };
  };
}

/**
 * Verify ATS webhook signature
 */
function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!ATS_WEBHOOK_SECRET) {
    console.warn("ATS_WEBHOOK_SECRET not set, skipping signature verification");
    return true; // Allow in development
  }

  const expectedSignature = crypto
    .createHmac("sha256", ATS_WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    receivedBuffer,
    expectedBuffer
  );
}

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
 * POST /api/webhooks/ats
 * Receives hire events from ATS and creates User + OnboardingProgress records
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-ats-signature") || "";

    // Verify signature (skip in development if not configured)
    if (ATS_WEBHOOK_SECRET && !verifyWebhookSignature(rawBody, signature)) {
      console.error("Invalid ATS webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const payload: ATSHireEvent = JSON.parse(rawBody);

    // Only process hire events
    if (payload.event !== "candidate.hired") {
      return NextResponse.json({ message: "Event ignored" }, { status: 200 });
    }

    const { candidate, application } = payload.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: candidate.email.toLowerCase() },
    });

    if (existingUser) {
      // User already exists - update ATS IDs if needed
      if (!existingUser.atsCandidateId || !existingUser.atsApplicationId) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            atsCandidateId: candidate.id,
            atsApplicationId: application.id,
          },
        });
      }

      // Check if onboarding progress exists
      const existingProgress = await prisma.onboardingProgress.findUnique({
        where: { userId: existingUser.id },
      });

      if (!existingProgress) {
        // Create onboarding progress for existing user
        await prisma.onboardingProgress.create({
          data: {
            userId: existingUser.id,
            status: "PENDING",
          },
        });

        // Create onboarding goal
        await createOnboardingGoal(existingUser.id);
      }

      return NextResponse.json({
        message: "User already exists, updated ATS IDs",
        userId: existingUser.id,
      });
    }

    // Get the HQ organization for new users
    const hqOrg = await prisma.organization.findFirst({
      where: { isHQ: true },
    });

    // Generate reset token for password setup
    const { token: resetToken, expires: resetExpires } = generateResetToken();

    // Create new user with ONBOARDING_TUTOR role
    const user = await prisma.user.create({
      data: {
        email: candidate.email.toLowerCase(),
        name: `${candidate.firstName} ${candidate.lastName}`,
        phone: candidate.phone || null,
        passwordHash: await hashTempPassword(generateTempPassword()),
        role: "ONBOARDING_TUTOR",
        isOnboarding: true,
        organizationId: hqOrg?.id || null,
        atsCandidateId: candidate.id,
        atsApplicationId: application.id,
        hireDate: application.hiredDate
          ? new Date(application.hiredDate)
          : new Date(),
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    // Create onboarding progress
    await prisma.onboardingProgress.create({
      data: {
        userId: user.id,
        status: "PENDING",
        currentStep: 1,
      },
    });

    // Create onboarding goal for the new tutor
    await createOnboardingGoal(user.id);

    console.log(
      `Created new onboarding user: ${user.email} (ID: ${user.id})`
    );

    // Send welcome email with password setup link
    const userName = `${candidate.firstName} ${candidate.lastName}`;
    await sendWelcomeEmail(user.email, userName, resetToken);

    // Notify admin of new hire
    const adminEmails = process.env.ADMIN_NOTIFICATION_EMAILS?.split(",") || [];
    for (const adminEmail of adminEmails) {
      await sendNewHireNotification(adminEmail.trim(), userName, user.email);
    }

    return NextResponse.json({
      message: "User created successfully",
      userId: user.id,
      emailSent: true,
    });
  } catch (error) {
    console.error("ATS webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Hash a temporary password using bcrypt
 */
async function hashTempPassword(password: string): Promise<string> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.hash(password, 10);
}

/**
 * GET /api/webhooks/ats
 * Health check endpoint for ATS to verify webhook is active
 */
export async function GET() {
  return NextResponse.json({
    status: "active",
    service: "WorkforcePortal ATS Webhook",
    version: "1.0.0",
  });
}
