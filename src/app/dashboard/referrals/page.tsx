import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/portal/SiteHeader";
import { ReferralsClient } from "./ReferralsClient";

export const metadata = {
  title: "Referrals | Acme Workforce",
  description: "Submit and track your tutor referrals",
};

export default async function ReferralsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Look up the tutor's TC contractor ID for the client component
  const profile = await prisma.tutorProfile.findUnique({
    where: { userId: session.user.id },
    select: { tutorCruncherId: true },
  });

  return (
    <div className="min-h-screen bg-accent-light">
      <SiteHeader />
      <ReferralsClient contractorId={profile?.tutorCruncherId ?? null} />
    </div>
  );
}
