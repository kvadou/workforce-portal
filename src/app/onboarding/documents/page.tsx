import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { W9Form } from "@/components/onboarding/W9Form";

// Force dynamic rendering - database not available at build time
export const dynamic = "force-dynamic";

export default async function OnboardingDocumentsPage() {
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

  // Check if profile is complete (skip for admin viewers)
  if (!isAdminViewer && !progress?.profileCompletedAt) {
    redirect("/onboarding/profile");
  }

  // Get user W-9 data (if already filled)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      w9BusinessName: true,
      w9BusinessType: true,
      w9TaxId: true, // Note: This will be encrypted
      w9Address: true,
      w9City: true,
      w9State: true,
      w9Zip: true,
      w9SignedAt: true,
    },
  });

  if (!user) {
    redirect("/onboarding");
  }

  return (
    <W9Form
      user={user}
      progressId={progress?.id || ""}
      isComplete={!!progress?.w9CompletedAt}
    />
  );
}
