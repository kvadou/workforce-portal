import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ContentManagement } from "@/components/admin/ContentManagement";

// Force dynamic rendering - database not available at build time
export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  // Get all videos and quiz questions
  const [videos, questions] = await Promise.all([
    prisma.onboardingVideo.findMany({
      orderBy: { order: "asc" },
    }),
    prisma.onboardingQuizQuestion.findMany({
      orderBy: { order: "asc" },
    }),
  ]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/onboarding"
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="text-body-sm">Back to Onboarding</span>
        </Link>
        <h1 className="text-heading-lg text-neutral-900">
          Onboarding Content
        </h1>
        <p className="text-body-md text-neutral-600">
          Manage training videos and quiz questions
        </p>
      </div>

      <ContentManagement videos={videos} questions={questions} />
    </div>
  );
}
