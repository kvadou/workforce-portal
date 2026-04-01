import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VideoQuizStep } from "@/components/onboarding/VideoQuizStep";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ part: string }>;
}

export default async function VideoPartPage({ params }: PageProps) {
  const { part } = await params;
  const videoPart = parseInt(part, 10);

  if (isNaN(videoPart) || videoPart < 1 || videoPart > 6) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isAdminViewer = hasMinRole(session.user.role, "ADMIN") && !session.user.isOnboarding;

  const progress = await prisma.onboardingProgress.findUnique({
    where: { userId: session.user.id },
    include: { videoPartProgress: { where: { videoPart } } },
  });

  if (!progress && !isAdminViewer) redirect("/onboarding");

  // Get the video for this part (order matches part number 1-6)
  const video = await prisma.onboardingVideo.findFirst({
    where: { isActive: true, order: videoPart },
  });

  if (!video) notFound();

  // Get quiz questions for this video part
  const questions = await prisma.onboardingQuizQuestion.findMany({
    where: { isActive: true, videoPart },
    orderBy: { order: "asc" },
    select: {
      id: true,
      question: true,
      type: true,
      options: true,
      order: true,
    },
  });

  const videoProgress = progress?.videoPartProgress[0] || null;

  return (
    <VideoQuizStep
      video={video}
      videoPart={videoPart}
      progressId={progress?.id || ""}
      videoProgress={videoProgress ? {
        percentWatched: videoProgress.percentWatched,
        videoCompletedAt: videoProgress.videoCompletedAt?.toISOString() || null,
        quizPassedAt: videoProgress.quizPassedAt?.toISOString() || null,
        quizScore: videoProgress.quizScore,
        quizAttempts: videoProgress.quizAttempts,
      } : null}
      questions={questions as Array<{
        id: string;
        question: string;
        type: string;
        options: unknown;
        order: number;
      }>}
      totalParts={6}
    />
  );
}
