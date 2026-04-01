import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import {
  onW9Complete,
  updateOnboardingGoalProgress,
  calculateCompletedSteps,
} from "@/lib/onboarding-gamification";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      progressId,
      businessName,
      businessType,
      taxId,
      address,
      city,
      state,
      zip,
    } = body;

    // Get current progress
    const progress = await prisma.onboardingProgress.findUnique({
      where: { id: progressId },
    });

    if (!progress || progress.userId !== session.user.id) {
      return NextResponse.json({ error: "Progress not found" }, { status: 404 });
    }

    // Validate required fields
    if (!businessName || !taxId || !address || !city || !state || !zip) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate tax ID format
    const taxIdDigits = taxId.replace(/\D/g, "");
    if (taxIdDigits.length !== 9) {
      return NextResponse.json(
        { error: "Tax ID must be 9 digits" },
        { status: 400 }
      );
    }

    // Encrypt the tax ID before storing
    let encryptedTaxId: string;
    try {
      encryptedTaxId = encrypt(taxIdDigits);
    } catch (err) {
      console.error("Encryption error:", err);
      return NextResponse.json(
        { error: "Failed to secure tax information" },
        { status: 500 }
      );
    }

    // Update user with W-9 data
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        w9BusinessName: businessName.trim(),
        w9BusinessType: businessType,
        w9TaxId: encryptedTaxId,
        w9Address: address.trim(),
        w9City: city.trim(),
        w9State: state,
        w9Zip: zip.trim(),
        w9SignedAt: new Date(),
      },
    });

    // Update onboarding progress
    const updatedProgress = await prisma.onboardingProgress.update({
      where: { id: progressId },
      data: {
        w9CompletedAt: new Date(),
        status: "AWAITING_ORIENTATION",
      },
    });

    // Award points and send notifications
    await onW9Complete(session.user.id, progressId);

    // Update onboarding goal progress
    const stepsCompleted = calculateCompletedSteps(updatedProgress);
    await updateOnboardingGoalProgress(session.user.id, stepsCompleted);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error saving W-9:", error);
    return NextResponse.json(
      { error: "Failed to save W-9" },
      { status: 500 }
    );
  }
}
