import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/portal/SiteHeader";
import { ProfilePageClient } from "./ProfilePageClient";

export const metadata = {
  title: "My Profile | Acme Workforce",
  description: "Manage your profile information and preferences",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Look up the tutor's TC contractor ID for the referrals tab
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId: session.user.id },
    select: { tutorCruncherId: true },
  });

  return (
    <div className="min-h-screen bg-accent-light">
      <SiteHeader />
      <ProfilePageClient contractorId={tutorProfile?.tutorCruncherId ?? null} />
    </div>
  );
}
