import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { moduleCreateSchema } from "@/lib/validations/module";

// GET /api/modules - List modules (optionally filtered by curriculumId/courseId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // Support both curriculumId (new) and courseId (backward compat)
    const curriculumId = searchParams.get("curriculumId") || searchParams.get("courseId");
    const status = searchParams.get("status");
    const includeLessons = searchParams.get("includeLessons") === "true";

    const modules = await prisma.module.findMany({
      where: {
        ...(curriculumId ? { curriculumId } : {}),
        ...(status ? { status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" } : {}),
      },
      include: {
        curriculum: {
          select: { id: true, title: true },
        },
        ...(includeLessons
          ? {
              lessons: {
                orderBy: { order: "asc" },
              },
            }
          : {
              _count: { select: { lessons: true } },
            }),
      },
      orderBy: { order: "asc" },
    });

    // Map curriculum to course for backward compatibility
    const mappedModules = modules.map((mod) => ({
      ...mod,
      courseId: mod.curriculumId, // Add courseId alias
      course: mod.curriculum, // Add course alias
    }));

    return NextResponse.json(mappedModules);
  } catch (error) {
    console.error("Error fetching modules:", error);
    return NextResponse.json({ error: "Failed to fetch modules" }, { status: 500 });
  }
}

// POST /api/modules - Create a new module
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = moduleCreateSchema.parse(body);

    // Support both curriculumId and courseId (backward compat)
    const curriculumId = validatedData.curriculumId || validatedData.courseId;
    if (!curriculumId) {
      return NextResponse.json({ error: "curriculumId or courseId is required" }, { status: 400 });
    }

    // Get the max order for this curriculum
    const maxOrder = await prisma.module.aggregate({
      where: { curriculumId },
      _max: { order: true },
    });

    const newModule = await prisma.module.create({
      data: {
        curriculumId,
        title: validatedData.title,
        description: validatedData.description,
        status: validatedData.status,
        order: validatedData.order ?? (maxOrder._max.order ?? 0) + 1,
      },
      include: {
        _count: { select: { lessons: true } },
      },
    });

    return NextResponse.json(newModule, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Error creating module:", error);
    return NextResponse.json({ error: "Failed to create module" }, { status: 500 });
  }
}
