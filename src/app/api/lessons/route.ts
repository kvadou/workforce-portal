import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { lessonCreateSchema } from "@/lib/validations/lesson";
import type { UserRole } from "@prisma/client";

// GET /api/lessons - List lessons (optionally filtered by moduleId)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "TUTOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get("moduleId");
    const status = searchParams.get("status");
    const includeDetails = searchParams.get("includeDetails") === "true";

    const lessons = await prisma.lesson.findMany({
      where: {
        ...(moduleId ? { moduleId } : {}),
        ...(status ? { status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" } : {}),
      },
      include: includeDetails
        ? {
            developmentalSkills: { orderBy: { order: "asc" } },
            story: true,
            exercises: { orderBy: { order: "asc" } },
            printMaterials: { orderBy: { order: "asc" } },
          }
        : {
            _count: {
              select: {
                developmentalSkills: true,
                exercises: true,
                printMaterials: true,
              },
            },
          },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(lessons);
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return NextResponse.json({ error: "Failed to fetch lessons" }, { status: 500 });
  }
}

// POST /api/lessons - Create a new lesson
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const validatedData = lessonCreateSchema.parse(body);

    // Get the max order for this module
    const maxOrder = await prisma.lesson.aggregate({
      where: { moduleId: validatedData.moduleId },
      _max: { order: true },
    });

    const lesson = await prisma.lesson.create({
      data: {
        ...validatedData,
        order: validatedData.order ?? (maxOrder._max.order ?? 0) + 1,
      },
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Error creating lesson:", error);
    return NextResponse.json({ error: "Failed to create lesson" }, { status: 500 });
  }
}
