import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  PlayCircleIcon,
  CheckCircleIcon,
  LockClosedIcon,
  ClockIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min`;
}

export default async function OnboardingVideosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isAdminViewer = hasMinRole(session.user.role, "ADMIN") && !session.user.isOnboarding;

  const progress = await prisma.onboardingProgress.findUnique({
    where: { userId: session.user.id },
    include: { videoPartProgress: { orderBy: { videoPart: "asc" } } },
  });

  if (!progress && !isAdminViewer) redirect("/onboarding");

  // Update status to VIDEOS_IN_PROGRESS if needed
  if (!isAdminViewer && progress && (progress.status === "WELCOME" || progress.status === "PENDING")) {
    await prisma.onboardingProgress.update({
      where: { id: progress.id },
      data: { status: "VIDEOS_IN_PROGRESS" },
    });
  }

  const videos = await prisma.onboardingVideo.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  const videoPartMap = new Map(
    (progress?.videoPartProgress || []).map((vp) => [vp.videoPart, vp])
  );

  // Find first incomplete video
  const firstIncomplete = videos.findIndex((_, i) => {
    const vp = videoPartMap.get(i + 1);
    return !vp?.videoCompletedAt || !vp?.quizPassedAt;
  });

  const completedCount = videos.filter((_, i) => {
    const vp = videoPartMap.get(i + 1);
    return vp?.videoCompletedAt && vp?.quizPassedAt;
  }).length;

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 md:pb-6">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
        {/* Page Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-semibold text-neutral-900">Training Videos</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Watch each orientation video and pass the quiz to continue. Complete all 6 parts to finish Phase 1.
          </p>
        </div>

        {/* Overall Progress */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-700">Overall Progress</span>
            <span className="text-sm font-semibold text-primary-500 tabular-nums">
              {completedCount} of {videos.length} complete
            </span>
          </div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${videos.length > 0 ? (completedCount / videos.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Video Cards */}
        <div className="space-y-3">
          {videos.map((video, index) => {
            const part = index + 1;
            const vp = videoPartMap.get(part);
            const videoComplete = !!vp?.videoCompletedAt;
            const quizPassed = !!vp?.quizPassedAt;
            const isFullyComplete = videoComplete && quizPassed;
            const isCurrent = index === firstIncomplete;
            const isLocked = index > firstIncomplete && firstIncomplete >= 0;
            const watchPercent = vp?.percentWatched ?? 0;

            const cardClasses = `block bg-white rounded-xl border shadow-sm p-5 transition-all duration-200 ${
              isCurrent
                ? "border-primary-200 shadow-[0_0_16px_rgba(106,70,157,0.1)] hover:shadow-[0_0_20px_rgba(106,70,157,0.15)]"
                : isFullyComplete
                ? "border-neutral-200 opacity-75"
                : isLocked
                ? "border-neutral-100 opacity-40 cursor-not-allowed"
                : "border-neutral-200 hover:border-neutral-300"
            }`;

            const cardContent = (
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isFullyComplete
                    ? "bg-[#E8F8ED]"
                    : isCurrent
                    ? "bg-primary-500"
                    : "bg-neutral-100"
                }`}>
                  {isFullyComplete ? (
                    <CheckCircleIcon className="h-6 w-6 text-[#34B256]" />
                  ) : isLocked ? (
                    <LockClosedIcon className="h-5 w-5 text-neutral-400" />
                  ) : (
                    <PlayCircleIcon className={`h-6 w-6 ${isCurrent ? "text-white" : "text-neutral-500"}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-neutral-400 uppercase">Part {part}</span>
                    {isFullyComplete && (
                      <span className="text-xs font-medium text-[#2A9147] bg-[#E8F8ED] px-2 py-0.5 rounded-full">
                        Complete
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-xs font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                        Up Next
                      </span>
                    )}
                  </div>
                  <h3 className={`text-sm font-semibold mt-0.5 ${isLocked ? "text-neutral-400" : "text-neutral-900"}`}>
                    {video.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-neutral-400">
                      <ClockIcon className="h-3.5 w-3.5" />
                      {formatDuration(video.duration)}
                    </span>
                    {videoComplete && !quizPassed && (
                      <span className="text-xs font-medium text-amber-600">Quiz pending</span>
                    )}
                    {vp && !videoComplete && watchPercent > 0 && (
                      <span className="text-xs text-neutral-400 tabular-nums">{Math.round(watchPercent)}% watched</span>
                    )}
                  </div>
                  {!isFullyComplete && !isLocked && watchPercent > 0 && (
                    <div className="h-1 bg-neutral-100 rounded-full overflow-hidden mt-2 max-w-xs">
                      <div
                        className="h-full bg-primary-300 rounded-full"
                        style={{ width: `${watchPercent}%` }}
                      />
                    </div>
                  )}
                </div>
                {!isLocked && !isFullyComplete && (
                  <ArrowRightIcon className="h-4 w-4 text-primary-500 flex-shrink-0" />
                )}
              </div>
            );

            return isLocked ? (
              <div key={video.id} className={cardClasses}>
                {cardContent}
              </div>
            ) : (
              <Link key={video.id} href={`/onboarding/videos/${part}`} className={cardClasses}>
                {cardContent}
              </Link>
            );
          })}
        </div>

        {/* All complete message */}
        {completedCount === videos.length && videos.length > 0 && (
          <div className="bg-[#E8F8ED] border border-[#34B256]/30 rounded-xl p-5 mt-5">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="h-6 w-6 text-[#34B256] flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-[#2A9147]">All videos complete!</h3>
                <p className="text-xs text-[#34B256] mt-0.5">
                  Move on to <Link href="/onboarding/profile" className="underline font-medium">Profile & Documents</Link> to continue.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
