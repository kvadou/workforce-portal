import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/portal/SiteHeader";
import { LessonPageClient } from "./LessonPageClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LessonPage({ params }: Props) {
  const { id } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      module: {
        include: {
          curriculum: true,
          lessons: {
            orderBy: { order: "asc" },
            select: { id: true, title: true, order: true },
          },
        },
      },
      developmentalSkills: { orderBy: { order: "asc" } },
      story: true,
      exercises: { orderBy: { order: "asc" } },
      printMaterials: { orderBy: { order: "asc" } },
    },
  });

  if (!lesson) {
    notFound();
  }

  // Find previous and next lessons within the module
  const lessonIndex = lesson.module.lessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = lessonIndex > 0 ? lesson.module.lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < lesson.module.lessons.length - 1
    ? lesson.module.lessons[lessonIndex + 1]
    : null;

  // Transform data for the client component
  const lessonData = {
    id: lesson.id,
    number: lesson.number,
    title: lesson.title,
    subtitle: lesson.subtitle || "",
    thumbnail: lesson.thumbnail || "/images/placeholder-lesson.jpg",
    videoUrl: lesson.videoUrl || "",
    videoDuration: lesson.videoDuration || "",
    status: lesson.status.toLowerCase() as "draft" | "published" | "archived",
    module: {
      id: lesson.module.id,
      title: lesson.module.title,
      curriculum: {
        id: lesson.module.curriculum.id,
        title: lesson.module.curriculum.title,
      },
    },
    developmentalSkills: lesson.developmentalSkills.map((skill) => ({
      title: skill.title,
      description: skill.description || "",
    })),
    story: lesson.story
      ? {
          introduction: lesson.story.introduction || "",
          teacherTip: lesson.story.teacherTip || "",
          content: lesson.story.content as Record<string, unknown> | null,
          paragraphs: [], // Legacy format fallback
        }
      : {
          introduction: "",
          teacherTip: "",
          content: null,
          paragraphs: [],
        },
    chessercises: (lesson.chessercises as {
      warmUp?: { instructions: string[] };
      dressUp?: { instructions: string[] };
      chessUp?: { instructions: string[] };
    }) || {
      warmUp: { instructions: [] },
      dressUp: { instructions: [] },
      chessUp: { instructions: [] },
    },
    exercises: lesson.exercises.map((ex) => ({
      id: ex.id,
      number: ex.order,
      title: ex.title,
      instructions: ex.instructions || "",
      fen: (typeof ex.boardSetup === "string" ? ex.boardSetup : null) || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      solution: ex.solution || "",
      explanation: "",
      highlightSquares: [],
    })),
    printMaterials: lesson.printMaterials.map((mat) => ({
      id: mat.id,
      title: mat.title,
      type: mat.type,
      pageCount: mat.pageCount || 1,
      thumbnailUrl: mat.thumbnailUrl || "",
      fileUrl: mat.fileUrl || "",
    })),
    navigation: {
      prev: prevLesson ? { id: prevLesson.id, title: prevLesson.title } : null,
      next: nextLesson ? { id: nextLesson.id, title: nextLesson.title } : null,
    },
  };

  return (
    <div className="min-h-screen bg-accent-light">
      <SiteHeader />
      <LessonPageClient lesson={lessonData} />
    </div>
  );
}
