import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { OnboardingSidebar } from "@/components/onboarding/OnboardingSidebar";
import { OnboardingMobileNav } from "@/components/onboarding/OnboardingMobileNav";

// Progress state for navigation unlock logic
export interface OnboardingNavProgress {
  welcomeCompletedAt: Date | null;
  videosCompletedAt: Date | null;
  quizPassedAt: Date | null;
  profileCompletedAt: Date | null;
  w9CompletedAt: Date | null;
  orientationAttendedAt: Date | null;
}

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Allow ADMIN+ users to view onboarding pages as read-only viewers
  const isAdminViewer = hasMinRole(session.user.role, "ADMIN") && !session.user.isOnboarding;

  // Only onboarding tutors and admin viewers should access this section
  if (!isAdminViewer && session.user.role !== "ONBOARDING_TUTOR" && !session.user.isOnboarding) {
    redirect("/");
  }

  // Get progress for navigation unlock logic
  const progress = await prisma.onboardingProgress.findUnique({
    where: { userId: session.user.id },
    select: {
      welcomeCompletedAt: true,
      videosCompletedAt: true,
      quizPassedAt: true,
      profileCompletedAt: true,
      w9CompletedAt: true,
      orientationAttendedAt: true,
    },
  });

  const hasCompletedWelcome = !!progress?.welcomeCompletedAt;
  const userName = session.user.name || "New Team Member";

  // For admin viewers, unlock all nav items regardless of progress
  const now = new Date();
  const navProgress: OnboardingNavProgress = isAdminViewer
    ? {
        welcomeCompletedAt: now,
        videosCompletedAt: now,
        quizPassedAt: now,
        profileCompletedAt: now,
        w9CompletedAt: now,
        orientationAttendedAt: now,
      }
    : {
        welcomeCompletedAt: progress?.welcomeCompletedAt || null,
        videosCompletedAt: progress?.videosCompletedAt || null,
        quizPassedAt: progress?.quizPassedAt || null,
        profileCompletedAt: progress?.profileCompletedAt || null,
        w9CompletedAt: progress?.w9CompletedAt || null,
        orientationAttendedAt: progress?.orientationAttendedAt || null,
      };

  // If welcome not completed, show full-screen welcome layout (no header/sidebar)
  // Admin viewers always get the full layout
  if (!hasCompletedWelcome && !isAdminViewer) {
    return <>{children}</>;
  }

  // After welcome, show the standard layout with responsive design
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      {/* Mobile header - only show on mobile */}
      <header className="md:hidden sticky top-0 z-40 bg-primary-500 px-4 py-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Acme Workforce"
              className="h-8 w-auto rounded-lg"
            />
            <span className="text-sm font-semibold text-white">Onboarding</span>
          </div>
          <div className="text-sm text-white/80 font-medium">{userName.split(" ")[0]}</div>
        </div>
      </header>

      {/* Desktop header */}
      <div className="hidden md:block">
        <OnboardingHeader userName={userName} />
      </div>

      <div className="flex flex-1">
        {/* Desktop sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <OnboardingSidebar userName={userName} progress={navProgress} isAdminViewer={isAdminViewer} />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <OnboardingMobileNav progress={navProgress} isAdminViewer={isAdminViewer} />
    </div>
  );
}
