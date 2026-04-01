import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QuizPage } from "@/components/onboarding/QuizPage";

// Force dynamic rendering - database not available at build time
export const dynamic = "force-dynamic";

export default async function OnboardingQuizPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const isAdminViewer = hasMinRole(session.user.role, "ADMIN") && !session.user.isOnboarding;

  // Get onboarding progress
  const progress = await prisma.onboardingProgress.findUnique({
    where: { userId: session.user.id },
  });

  if (!progress && !isAdminViewer) {
    redirect("/onboarding");
  }

  // Check if videos are complete (skip for admin viewers)
  if (!isAdminViewer && !progress?.videosCompletedAt) {
    redirect("/onboarding/videos");
  }

  // Get quiz questions
  const questions = await prisma.onboardingQuizQuestion.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  return (
    <QuizPage
      questions={questions}
      progressId={progress?.id || ""}
      previousScore={progress?.quizScore ?? null}
      previousAttempts={progress?.quizAttempts ?? 0}
      hasPassed={!!progress?.quizPassedAt}
    />
  );
}
