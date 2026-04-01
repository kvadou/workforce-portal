import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  EyeIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";

export default async function OnboardingShadowsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isAdminViewer = hasMinRole(session.user.role, "ADMIN") && !session.user.isOnboarding;

  const progress = await prisma.onboardingProgress.findUnique({
    where: { userId: session.user.id },
  });

  if (!progress && !isAdminViewer) redirect("/onboarding");

  // Must have completed orientation
  if (!isAdminViewer && !progress?.orientationAttendedAt) {
    redirect("/onboarding/orientation");
  }

  const shadows = [
    { number: 1, complete: !!progress?.shadow1Complete, completedAt: progress?.shadow1At },
    { number: 2, complete: !!progress?.shadow2Complete, completedAt: progress?.shadow2At },
    { number: 3, complete: !!progress?.shadow3Complete, completedAt: progress?.shadow3At },
  ];

  const completedCount = shadows.filter((s) => s.complete).length;
  const hasFeedback = !!progress?.shadowFeedback;
  const allComplete = completedCount === 3 && hasFeedback;

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 md:pb-6">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-5 max-w-3xl mx-auto">
        <div className="mb-5">
          <h1 className="text-2xl font-semibold text-neutral-900">Shadow Lessons</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Observe experienced Acme Workforce tutors teaching live lessons. Your admin will pair you with a mentor.
          </p>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-700">Shadow Progress</span>
            <span className="text-sm font-semibold text-primary-500 tabular-nums">
              {completedCount} of 3 sessions
            </span>
          </div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Shadow Cards */}
        <div className="space-y-3">
          {shadows.map((shadow) => (
            <div
              key={shadow.number}
              className={`bg-white rounded-xl border shadow-sm p-5 ${
                shadow.complete ? "border-neutral-200 opacity-75" : "border-neutral-200"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  shadow.complete ? "bg-[#E8F8ED]" : "bg-primary-50"
                }`}>
                  {shadow.complete ? (
                    <CheckCircleIcon className="h-6 w-6 text-[#34B256]" />
                  ) : (
                    <EyeIcon className="h-6 w-6 text-primary-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-neutral-900">
                      Shadow Session #{shadow.number}
                    </h3>
                    {shadow.complete ? (
                      <span className="text-xs font-medium text-[#2A9147] bg-[#E8F8ED] px-2 py-0.5 rounded-full">
                        Completed
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-500 mt-1">
                    Observe a live Acme Workforce lesson with your assigned mentor tutor.
                  </p>
                  {shadow.complete && shadow.completedAt && (
                    <span className="text-xs text-neutral-400 mt-1 block">
                      Completed {new Date(shadow.completedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Feedback Card */}
          <div className={`bg-white rounded-xl border shadow-sm p-5 ${
            hasFeedback ? "border-neutral-200 opacity-75" : "border-neutral-200"
          }`}>
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                hasFeedback ? "bg-[#E8F8ED]" : "bg-neutral-100"
              }`}>
                {hasFeedback ? (
                  <CheckCircleIcon className="h-6 w-6 text-[#34B256]" />
                ) : (
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-neutral-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-neutral-900">Shadow Feedback</h3>
                  {hasFeedback ? (
                    <span className="text-xs font-medium text-[#2A9147] bg-[#E8F8ED] px-2 py-0.5 rounded-full">
                      Received
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full">
                      Pending
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-500 mt-1">
                  Your mentor will provide feedback after your shadow sessions.
                </p>
                {hasFeedback && progress?.shadowFeedback && (
                  <div className="mt-3 p-3 bg-neutral-50 rounded-lg">
                    <p className="text-sm text-neutral-700 italic">&ldquo;{progress.shadowFeedback}&rdquo;</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {allComplete && (
          <div className="bg-[#E8F8ED] border border-[#34B256]/30 rounded-xl p-5 mt-5">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="h-6 w-6 text-[#34B256] flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-[#2A9147]">All shadows complete!</h3>
                <p className="text-xs text-[#34B256] mt-0.5">You&apos;re ready to start teaching.</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 p-4 bg-[#E8FBFF] rounded-xl">
          <p className="text-xs text-neutral-600">
            <strong>How it works:</strong> Your admin team will pair you with an experienced tutor. Attend their lessons as an observer, then your mentor will submit feedback. Check back here for updates.
          </p>
        </div>
      </div>
    </div>
  );
}
