import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { developmentalSkillSchema } from "@/lib/validations/lesson";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/lessons/[id]/skills - Get all developmental skills for a lesson
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const skills = await prisma.developmentalSkill.findMany({
      where: { lessonId: id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(skills);
  } catch (error) {
    console.error("Error fetching skills:", error);
    return NextResponse.json({ error: "Failed to fetch skills" }, { status: 500 });
  }
}

// POST /api/lessons/[id]/skills - Create a new developmental skill
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = developmentalSkillSchema.parse(body);

    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Get the max order for this lesson
    const maxOrder = await prisma.developmentalSkill.aggregate({
      where: { lessonId: id },
      _max: { order: true },
    });

    const skill = await prisma.developmentalSkill.create({
      data: {
        lessonId: id,
        ...validatedData,
        order: validatedData.order ?? (maxOrder._max.order ?? 0) + 1,
      },
    });

    return NextResponse.json(skill, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Error creating skill:", error);
    return NextResponse.json({ error: "Failed to create skill" }, { status: 500 });
  }
}
