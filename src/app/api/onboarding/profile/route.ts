import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  onProfileComplete,
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
      name,
      phone,
      bio,
      headshotUrl,
      dateOfBirth,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      languages,
      teachingStylePreferences,
      availabilityNotes,
      yearsExperience,
      previousExperience,
    } = body;

    // Get current progress
    const progress = await prisma.onboardingProgress.findUnique({
      where: { id: progressId },
    });

    if (!progress || progress.userId !== session.user.id) {
      return NextResponse.json({ error: "Progress not found" }, { status: 404 });
    }

    // Validate required fields
    const requiredFields = [name, phone, emergencyContactName, emergencyContactPhone];
    const allRequiredFilled = requiredFields.every(
      (field) => field && field.toString().trim() !== ""
    );

    // Update user profile
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name?.trim() || undefined,
        phone: phone?.trim() || undefined,
        bio: bio?.trim() || undefined,
        headshotUrl: headshotUrl?.trim() || undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        emergencyContactName: emergencyContactName?.trim() || undefined,
        emergencyContactPhone: emergencyContactPhone?.trim() || undefined,
        emergencyContactRelation: emergencyContactRelation?.trim() || undefined,
        languages: languages || [],
        teachingStylePreferences: teachingStylePreferences?.trim() || undefined,
        availabilityNotes: availabilityNotes?.trim() || undefined,
        yearsExperience: yearsExperience || undefined,
        previousExperience: previousExperience?.trim() || undefined,
      },
    });

    // If all required fields are filled and profile not yet marked complete, update progress
    const profileComplete = allRequiredFilled;

    if (profileComplete && !progress.profileCompletedAt) {
      const updatedProgress = await prisma.onboardingProgress.update({
        where: { id: progressId },
        data: {
          profileCompletedAt: new Date(),
          status: "W9_PENDING",
        },
      });

      // Award points and send notifications
      await onProfileComplete(session.user.id, progressId);

      // Update onboarding goal progress
      const stepsCompleted = calculateCompletedSteps(updatedProgress);
      await updateOnboardingGoalProgress(session.user.id, stepsCompleted);
    }

    return NextResponse.json({
      success: true,
      profileComplete,
    });
  } catch (error) {
    console.error("Error saving profile:", error);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }
}
