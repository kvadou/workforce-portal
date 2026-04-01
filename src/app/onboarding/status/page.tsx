import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProgressTimeline } from "@/components/onboarding/ProgressTimeline";

// Force dynamic rendering - database not available at build time
export const dynamic = "force-dynamic";

export default async function OnboardingStatusPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const isAdminViewer = hasMinRole(session.user.role, "ADMIN") && !session.user.isOnboarding;

  // Get onboarding progress with related data
  const progress = await prisma.onboardingProgress.findUnique({
    where: { userId: session.user.id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      orientationSession: true,
    },
  });

  if (!progress && !isAdminViewer) {
    redirect("/onboarding");
  }

  // Get videos for completion info
  const videos = await prisma.onboardingVideo.findMany({
    where: { isActive: true, isRequired: true },
    select: { id: true, title: true },
  });

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
    user: {
      name: session.user.name || "Admin Viewer",
      email: session.user.email || "",
    },
    orientationSession: null,
  } as any);

  return (
    <ProgressTimeline
      progress={displayProgress}
      userName={displayProgress.user.name || "New Team Member"}
      totalVideos={videos.length}
    />
  );
}
