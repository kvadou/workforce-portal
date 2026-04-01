import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/portal/SiteHeader";
import { CurriculumPageContent } from "./CurriculumPageContent";

// Force dynamic rendering - database not available at build time
export const dynamic = "force-dynamic";

export default async function CurriculumPage() {
  const courses = await prisma.curriculum.findMany({
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: {
              story: true,
            },
          },
        },
      },
    },
    orderBy: { order: "asc" },
  });

  return (
    <div className="min-h-screen bg-accent-light">
      <SiteHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CurriculumPageContent courses={courses} />
      </main>
    </div>
  );
}
