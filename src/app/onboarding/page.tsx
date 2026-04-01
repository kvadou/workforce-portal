import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingDashboard } from "@/components/onboarding/OnboardingDashboard";
import { WelcomePage } from "@/components/onboarding/WelcomePage";
import {
  getWelcomePageConfig,
  getJourneySteps,
  getBadges,
} from "@/lib/onboarding-config";
import { getPhaseStatus, getOverallProgress, getCurrentPhase } from "@/lib/onboarding-phases";

// Admin roles that can use preview mode
const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "FRANCHISEE_OWNER"];

interface PageProps {
  searchParams: Promise<{ preview?: string }>;
}

// Force dynamic rendering - database not available at build time
export const dynamic = "force-dynamic";

export default async function OnboardingPage({ searchParams }: PageProps) {
  const { preview } = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Check if this is an admin viewer (not an onboarding tutor)
  const isAdminViewer = hasMinRole(session.user.role, "ADMIN") && !session.user.isOnboarding;

  // Get or create onboarding progress
  let progress = await prisma.onboardingProgress.findUnique({
    where: { userId: session.user.id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          headshotUrl: true,
          w9SignedAt: true,
        },
      },
      orientationSession: true,
      videoPartProgress: {
        orderBy: { videoPart: "asc" },
      },
    },
  });

  // If no progress record, create one (but NOT for admin viewers)
  if (!progress && !isAdminViewer) {
    progress = await prisma.onboardingProgress.create({
      data: {
        userId: session.user.id,
        status: "WELCOME",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            headshotUrl: true,
            w9SignedAt: true,
          },
        },
        orientationSession: true,
        videoPartProgress: {
          orderBy: { videoPart: "asc" },
        },
      },
    });
  }

  // Check if admin is previewing the welcome page
  const isAdmin = ADMIN_ROLES.includes(session.user.role);
  const isPreviewingWelcome = preview === "welcome" && isAdmin;

  // If welcome video not completed OR admin is previewing, show the welcome page
  // Admin viewers skip directly to dashboard
  if (!isAdminViewer && (!progress?.welcomeCompletedAt || isPreviewingWelcome)) {
    const firstName = progress?.user.name?.split(" ")[0] || "New Team Member";
    const welcomeConfig = await getWelcomePageConfig();
    return (
      <WelcomePage
        firstName={firstName}
        progressId={progress?.id || ""}
        config={welcomeConfig}
        isPreview={isPreviewingWelcome}
      />
    );
  }

  // Get onboarding videos for progress calculation
  const videos = await prisma.onboardingVideo.findMany({
    where: { isActive: true, isRequired: true },
    orderBy: { order: "asc" },
  });

  // Get quiz questions count
  const quizQuestionsCount = await prisma.onboardingQuizQuestion.count({
    where: { isActive: true },
  });

  // Calculate progress
  const videoProgress = (progress?.videoProgress as Array<{
    videoId: string;
    percentWatched: number;
    completedAt?: string;
  }>) || [];

  const completedVideos = videoProgress.filter(
    (v) => v.percentWatched >= 90
  ).length;

  // Load dynamic config
  const [journeySteps, badges] = await Promise.all([
    getJourneySteps(),
    getBadges(),
  ]);

  // For admin viewers without progress, provide mock data for the dashboard
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dashboardProgress = progress || ({
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
      headshotUrl: null,
      w9SignedAt: null,
    },
    orientationSession: null,
    videoPartProgress: [],
  } as any);

  // Compute phase status
  const phases = getPhaseStatus(dashboardProgress);
  const overallProgress = getOverallProgress(dashboardProgress);
  const currentPhase = getCurrentPhase(dashboardProgress);

  return (
    <OnboardingDashboard
      progress={dashboardProgress}
      videos={videos}
      completedVideos={completedVideos}
      totalVideos={videos.length}
      hasQuiz={quizQuestionsCount > 0}
      journeySteps={journeySteps}
      badges={badges}
      phases={phases}
      overallProgress={overallProgress}
      currentPhase={currentPhase}
    />
  );
}
