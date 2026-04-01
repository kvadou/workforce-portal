import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  StarIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";

const trainingItems = [
  {
    key: "demoMagic",
    title: "Demo / Magic",
    description: "Live Zoom training on demonstration techniques and creating magical lesson moments",
    duration: "2 hours",
    icon: StarIcon,
    completeField: "demoMagicComplete" as const,
    completedAtField: "demoMagicCompletedAt" as const,
  },
  {
    key: "chessConfidence",
    title: "Chess Confidence",
    description: "Build your personal chess knowledge and teaching confidence",
    duration: "2 hours",
    icon: ShieldCheckIcon,
    completeField: "chessConfidenceComplete" as const,
    completedAtField: "chessConfidenceCompletedAt" as const,
  },
  {
    key: "teachingInSchools",
    title: "Teaching In Schools",
    description: "Best practices for school environments, classroom management, and schedules",
    duration: "2 hours",
    icon: AcademicCapIcon,
    completeField: "teachingInSchoolsComplete" as const,
    completedAtField: "teachingInSchoolsCompletedAt" as const,
  },
  {
    key: "chessable",
    title: "Chessable",
    description: "Complete the Chessable training module to strengthen your chess fundamentals",
    duration: "Self-paced",
    icon: BookOpenIcon,
    completeField: "chessableComplete" as const,
    completedAtField: "chessableCompletedAt" as const,
  },
];

export default async function OnboardingTrainingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isAdminViewer = hasMinRole(session.user.role, "ADMIN") && !session.user.isOnboarding;

  const progress = await prisma.onboardingProgress.findUnique({
    where: { userId: session.user.id },
  });

  if (!progress && !isAdminViewer) redirect("/onboarding");

  // Must have completed orientation (Phase 3)
  if (!isAdminViewer && !progress?.orientationAttendedAt) {
    redirect("/onboarding/orientation");
  }

  const completedCount = trainingItems.filter(
    (item) => progress?.[item.completeField]
  ).length;
  const allComplete = completedCount === trainingItems.length;

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 md:pb-6">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-5 max-w-3xl mx-auto">
        <div className="mb-5">
          <h1 className="text-2xl font-semibold text-neutral-900">Post-Orientation Training</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Complete these training sessions with Jessica & Bri. Sessions are live on Zoom — your admin team will mark them complete.
          </p>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-700">Training Progress</span>
            <span className="text-sm font-semibold text-primary-500 tabular-nums">
              {completedCount} of {trainingItems.length} complete
            </span>
          </div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / trainingItems.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Training Cards */}
        <div className="space-y-3">
          {trainingItems.map((item) => {
            const Icon = item.icon;
            const isComplete = !!progress?.[item.completeField];
            const completedAt = progress?.[item.completedAtField];

            return (
              <div
                key={item.key}
                className={`bg-white rounded-xl border shadow-sm p-5 transition-all duration-200 ${
                  isComplete ? "border-neutral-200 opacity-75" : "border-neutral-200"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isComplete ? "bg-[#E8F8ED]" : "bg-[#FEF4E8]"
                  }`}>
                    {isComplete ? (
                      <CheckCircleIcon className="h-6 w-6 text-[#34B256]" />
                    ) : (
                      <Icon className="h-6 w-6 text-[#F79A30]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-neutral-900">{item.title}</h3>
                      {isComplete ? (
                        <span className="text-xs font-medium text-[#2A9147] bg-[#E8F8ED] px-2 py-0.5 rounded-full">
                          Completed
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-[#C77A26] bg-[#FEF4E8] px-2 py-0.5 rounded-full">
                          Awaiting
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-500 mt-1">{item.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-neutral-400">
                        <ClockIcon className="h-3.5 w-3.5" />
                        {item.duration}
                      </span>
                      {isComplete && completedAt && (
                        <span className="text-xs text-neutral-400">
                          Completed {new Date(completedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {allComplete && (
          <div className="bg-[#E8F8ED] border border-[#34B256]/30 rounded-xl p-5 mt-5">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="h-6 w-6 text-[#34B256] flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-[#2A9147]">All training complete!</h3>
                <p className="text-xs text-[#34B256] mt-0.5">Move on to shadow lessons next.</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 p-4 bg-[#E8FBFF] rounded-xl">
          <p className="text-xs text-neutral-600">
            <strong>How it works:</strong> Register for upcoming sessions with Jessica & Bri. After you attend, they will mark the session complete in the system. Check back here to see your progress.
          </p>
        </div>
      </div>
    </div>
  );
}
