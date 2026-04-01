import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  TrophyIcon,
  BookOpenIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";

export default async function OnboardingReadyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isAdminViewer = hasMinRole(session.user.role, "ADMIN") && !session.user.isOnboarding;

  const progress = await prisma.onboardingProgress.findUnique({
    where: { userId: session.user.id },
  });

  if (!progress && !isAdminViewer) redirect("/onboarding");

  const userName = session.user.name?.split(" ")[0] || "there";
  const isActivated = !!progress?.activatedAt;

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 md:pb-6">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-5 max-w-2xl mx-auto text-center">
        {/* Trophy */}
        <div className="flex justify-center mb-6 mt-8">
          <div className="h-24 w-24 bg-gradient-to-br from-[#FACC29] to-[#F79A30] rounded-2xl flex items-center justify-center shadow-lg">
            <TrophyIcon className="h-12 w-12 text-white" />
          </div>
        </div>

        {isActivated ? (
          <>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Congratulations, {userName}!
            </h1>
            <p className="text-lg text-neutral-600 mb-2">
              You&apos;re now an active Acme Workforce tutor.
            </p>
            <p className="text-sm text-neutral-500 max-w-md mx-auto mb-10">
              Your TutorCruncher profile is live. You have full access to curriculum, training resources, and scheduling.
            </p>

            {/* Quick Links */}
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              <Link
                href="/dashboard"
                className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 hover:border-primary-200 hover:shadow-md transition-all duration-200 text-center"
              >
                <BookOpenIcon className="h-6 w-6 text-primary-500 mx-auto mb-2" />
                <span className="text-sm font-medium text-neutral-900">Curriculum</span>
              </Link>
              <Link
                href="/training"
                className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 hover:border-primary-200 hover:shadow-md transition-all duration-200 text-center"
              >
                <AcademicCapIcon className="h-6 w-6 text-primary-500 mx-auto mb-2" />
                <span className="text-sm font-medium text-neutral-900">Training</span>
              </Link>
              <Link
                href="/dashboard/classes"
                className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 hover:border-primary-200 hover:shadow-md transition-all duration-200 text-center"
              >
                <CalendarDaysIcon className="h-6 w-6 text-primary-500 mx-auto mb-2" />
                <span className="text-sm font-medium text-neutral-900">My Schedule</span>
              </Link>
              <Link
                href="/dashboard/profile"
                className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 hover:border-primary-200 hover:shadow-md transition-all duration-200 text-center"
              >
                <UserIcon className="h-6 w-6 text-primary-500 mx-auto mb-2" />
                <span className="text-sm font-medium text-neutral-900">My Profile</span>
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Almost There, {userName}!
            </h1>
            <p className="text-lg text-neutral-600 mb-2">
              You&apos;ve completed all onboarding steps.
            </p>
            <p className="text-sm text-neutral-500 max-w-md mx-auto mb-10">
              An admin will review your progress and activate your account. You&apos;ll receive a notification when you&apos;re approved.
            </p>

            <div className="bg-[#FEF4E8] border border-[#F79A30]/30 rounded-xl p-5 max-w-md mx-auto">
              <p className="text-sm text-[#C77A26] font-medium">Awaiting admin approval</p>
              <p className="text-xs text-[#C77A26]/75 mt-1">
                Check back soon or contact admin@workforceportal.com
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
