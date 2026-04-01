import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getWelcomePageConfig } from "@/lib/onboarding-config";
import { WelcomeVideoRewatch } from "@/components/onboarding/WelcomeVideoRewatch";

export default async function WelcomeVideoPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const config = await getWelcomePageConfig();
  const firstName = session.user.name?.split(" ")[0] || "Tutor";

  return <WelcomeVideoRewatch firstName={firstName} config={config} />;
}
