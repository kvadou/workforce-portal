import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrientationPage } from "@/components/onboarding/OrientationPage";

// Force dynamic rendering - database not available at build time
export const dynamic = "force-dynamic";

export default async function OnboardingOrientationPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const isAdminViewer = hasMinRole(session.user.role, "ADMIN") && !session.user.isOnboarding;

  // Get onboarding progress
  const progress = await prisma.onboardingProgress.findUnique({
    where: { userId: session.user.id },
    include: {
      orientationSession: true,
    },
  });

  if (!progress && !isAdminViewer) {
    redirect("/onboarding");
  }

  // Check if W-9 is complete (skip for admin viewers)
  if (!isAdminViewer && !progress?.w9CompletedAt) {
    redirect("/onboarding/documents");
  }

  // Get available orientation sessions (future sessions with available spots)
  const now = new Date();
  const sessions = await prisma.orientationSession.findMany({
    where: {
      isActive: true,
      scheduledAt: { gt: now },
    },
    include: {
      _count: {
        select: { participants: true },
      },
    },
    orderBy: { scheduledAt: "asc" },
  });

  // Transform to include availability info
  const availableSessions = sessions.map((s) => ({
    ...s,
    participantCount: s._count.participants,
    spotsAvailable: s.maxParticipants - s._count.participants,
  }));

  // For admin viewers without progress, provide a mock progress object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const displayProgress = progress || ({
    id: "",
    userId: session.user.id,
    status: "WELCOME",
    videoProgress: [],
    welcomeCompletedAt: null,
    videosCompletedAt: null,
    quizScore: null,
    quizAttempts: 0,
    quizPassedAt: null,
    profileCompletedAt: null,
    w9CompletedAt: null,
    orientationSessionId: null,
    orientationAttendedAt: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    orientationSession: null,
  } as any);

  return (
    <OrientationPage
      progress={displayProgress}
      registeredSession={displayProgress.orientationSession}
      availableSessions={availableSessions}
      progressId={displayProgress.id}
      hasAttended={!!displayProgress.orientationAttendedAt}
    />
  );
}
