import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/portal/SiteHeader";
import { CoursePageContent } from "./CoursePageContent";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CoursePage({ params }: Props) {
  const { id } = await params;

  const course = await prisma.curriculum.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          order: true,
          lessons: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              subtitle: true,
              number: true,
              videoUrl: true,
              story: {
                select: { content: true },
              },
            },
          },
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-accent-light">
      <SiteHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CoursePageContent course={course} />
      </main>
    </div>
  );
}
