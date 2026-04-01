import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ part: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { part } = await params;
    const videoPart = parseInt(part, 10);
    if (isNaN(videoPart) || videoPart < 1 || videoPart > 6) {
      return NextResponse.json({ error: "Invalid video part" }, { status: 400 });
    }

    const { percentWatched } = await req.json();
    if (typeof percentWatched !== "number" || percentWatched < 0 || percentWatched > 100) {
      return NextResponse.json({ error: "Invalid percentWatched" }, { status: 400 });
    }

    const progress = await prisma.onboardingProgress.findUnique({
      where: { userId: session.user.id },
    });

    if (!progress) {
      return NextResponse.json({ error: "No onboarding progress found" }, { status: 404 });
    }

    // Upsert video part progress — only update if new percentage is higher
    const existing = await prisma.onboardingVideoProgress.findUnique({
      where: { progressId_videoPart: { progressId: progress.id, videoPart } },
    });

    const isNewCompletion = percentWatched >= 90 && (!existing || !existing.videoCompletedAt);

    await prisma.onboardingVideoProgress.upsert({
      where: { progressId_videoPart: { progressId: progress.id, videoPart } },
      update: {
        percentWatched: existing && percentWatched > existing.percentWatched
          ? percentWatched
          : existing?.percentWatched ?? percentWatched,
        videoCompletedAt: isNewCompletion ? new Date() : existing?.videoCompletedAt ?? undefined,
      },
      create: {
        progressId: progress.id,
        videoPart,
        percentWatched,
        videoCompletedAt: percentWatched >= 90 ? new Date() : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      videoPart,
      percentWatched: Math.max(percentWatched, existing?.percentWatched ?? 0),
      videoCompleted: percentWatched >= 90 || !!existing?.videoCompletedAt,
    });
  } catch (error) {
    console.error("Error updating video part progress:", error);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
