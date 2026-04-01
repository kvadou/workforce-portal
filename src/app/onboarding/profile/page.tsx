import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/onboarding/ProfileForm";
import { W9Form } from "@/components/onboarding/W9Form";
import {
  CheckCircleIcon,
  UserCircleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/20/solid";

export const dynamic = "force-dynamic";

export default async function OnboardingProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isAdminViewer = hasMinRole(session.user.role, "ADMIN") && !session.user.isOnboarding;

  const progress = await prisma.onboardingProgress.findUnique({
    where: { userId: session.user.id },
  });

  if (!progress && !isAdminViewer) redirect("/onboarding");

  // Phase 1 must be complete (videos + quizzes) — skip for admin viewers
  if (!isAdminViewer && !progress?.videosCompletedAt) {
    redirect("/onboarding/videos");
  }

  // Get user data for both profile and W-9
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      bio: true,
      headshotUrl: true,
      dateOfBirth: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      emergencyContactRelation: true,
      languages: true,
      teachingStylePreferences: true,
      availabilityNotes: true,
      yearsExperience: true,
      previousExperience: true,
      w9BusinessName: true,
      w9BusinessType: true,
      w9TaxId: true,
      w9Address: true,
      w9City: true,
      w9State: true,
      w9Zip: true,
      w9SignedAt: true,
    },
  });

  if (!user) redirect("/onboarding");

  const profileComplete = !!progress?.profileCompletedAt;
  const w9Complete = !!progress?.w9CompletedAt;
  const bothComplete = profileComplete && w9Complete;

  const steps = [
    {
      label: "Profile",
      icon: UserCircleIcon,
      complete: profileComplete,
      active: !profileComplete,
    },
    {
      label: "W-9 Tax Form",
      icon: DocumentTextIcon,
      complete: w9Complete,
      active: profileComplete && !w9Complete,
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 md:pb-6">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        {/* Compact Header Row */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-heading font-semibold text-neutral-900">
              Profile & Documents
            </h1>
            <span className="text-caption font-medium text-primary-500 uppercase tracking-wider">
              Phase 2
            </span>
          </div>
          <div className="flex items-center gap-2">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex items-center gap-2">
                  {i > 0 && (
                    <div className={`w-4 h-px ${steps[i - 1].complete ? "bg-[#34B256]" : "bg-neutral-200"}`} />
                  )}
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption font-medium ${
                    step.complete
                      ? "bg-[#E8F8ED] text-[#2A9147]"
                      : step.active
                      ? "bg-primary-50 text-primary-700"
                      : "bg-neutral-100 text-neutral-400"
                  }`}>
                    {step.complete ? (
                      <CheckCircleSolid className="h-3.5 w-3.5 text-[#34B256]" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Two-column layout on wide screens */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Profile Section */}
          <section id="profile-section">
            <ProfileForm
              user={user}
              progressId={progress?.id || ""}
              isComplete={profileComplete}
            />
          </section>

          {/* W-9 Section */}
          <section id="w9-section">
            <W9Form
              user={user}
              progressId={progress?.id || ""}
              isComplete={w9Complete}
            />
          </section>
        </div>

        {/* Phase Complete Banner */}
        {bothComplete && (
          <div className="mt-4 bg-[#E8F8ED] border border-[#34B256]/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="h-5 w-5 text-[#34B256] flex-shrink-0" />
              <div>
                <span className="text-body-sm font-semibold text-[#2A9147]">Phase 2 Complete!</span>
                <span className="text-body-sm text-[#2A9147]/80 ml-2">
                  Register for your orientation debrief next.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
