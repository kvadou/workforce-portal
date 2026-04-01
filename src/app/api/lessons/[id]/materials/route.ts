import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { printMaterialCreateSchema } from "@/lib/validations/lesson";
import type { UserRole } from "@prisma/client";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/lessons/[id]/materials - Get all print materials for a lesson
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "TUTOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const materials = await prisma.printMaterial.findMany({
      where: { lessonId: id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(materials);
  } catch (error) {
    console.error("Error fetching materials:", error);
    return NextResponse.json({ error: "Failed to fetch materials" }, { status: 500 });
  }
}

// POST /api/lessons/[id]/materials - Create a new print material
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const validatedData = printMaterialCreateSchema.parse(body);

    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Get the max order for this lesson
    const maxOrder = await prisma.printMaterial.aggregate({
      where: { lessonId: id },
      _max: { order: true },
    });

    const material = await prisma.printMaterial.create({
      data: {
        lessonId: id,
        ...validatedData,
        order: validatedData.order ?? (maxOrder._max.order ?? 0) + 1,
      },
    });

    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Error creating material:", error);
    return NextResponse.json({ error: "Failed to create material" }, { status: 500 });
  }
}
