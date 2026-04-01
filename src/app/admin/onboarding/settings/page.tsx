import { redirect } from "next/navigation";

// Redirect to new location under /admin/settings/onboarding
export default function OnboardingSettingsPageRedirect() {
  redirect("/admin/settings/onboarding");
}
