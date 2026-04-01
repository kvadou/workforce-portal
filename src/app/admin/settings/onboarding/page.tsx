import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import type { UserRole } from "@prisma/client";
import { OnboardingSettingsTabs } from "@/components/admin/onboarding/OnboardingSettingsTabs";

export const metadata = {
  title: "Onboarding Settings | Admin",
  description: "Configure onboarding content and settings",
};

export default async function OnboardingSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-neutral-900">
          Onboarding Settings
        </h1>
        <p className="text-neutral-600 mt-1">
          Configure all aspects of the tutor onboarding experience
        </p>
      </div>

      {/* Settings Tabs - full width */}
      <OnboardingSettingsTabs />
    </div>
  );
}
