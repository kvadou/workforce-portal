import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

/**
 * Redirect from TutorCruncher ID to internal STT tutor page.
 * Used by OpsHub cross-linking: /admin/tutors/by-tc/{tcId}
 */
export default async function TutorByTcIdRedirect({
  params,
}: {
  params: Promise<{ tcId: string }>;
}) {
  const { tcId } = await params;
  const tcIdNum = parseInt(tcId, 10);

  if (isNaN(tcIdNum)) {
    redirect("/admin/tutors");
  }

  const profile = await prisma.tutorProfile.findUnique({
    where: { tutorCruncherId: tcIdNum },
    select: { id: true },
  });

  if (!profile) {
    // Tutor not in STT yet — redirect to tutors list
    redirect("/admin/tutors");
  }

  redirect(`/admin/tutors/${profile.id}`);
}
