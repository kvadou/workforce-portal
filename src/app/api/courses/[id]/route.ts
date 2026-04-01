import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { curriculumUpdateSchema } from "@/lib/validations/curriculum";
import type { UserRole } from "@prisma/client";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/courses/[id] - Get a single curriculum (backward compatible route)
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "TUTOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeModules = searchParams.get("includeModules") === "true";
    const includeLessons = searchParams.get("includeLessons") === "true";

    const curriculum = await prisma.curriculum.findUnique({
      where: { id },
      include: includeModules
        ? {
            modules: {
              orderBy: { order: "asc" },
              include: includeLessons
                ? {
                    lessons: {
                      orderBy: { order: "asc" },
                    },
                  }
                : {
                    _count: { select: { lessons: true } },
                  },
            },
          }
        : undefined,
    });

    if (!curriculum) {
      return NextResponse.json({ error: "Curriculum not found" }, { status: 404 });
    }

    return NextResponse.json(curriculum);
  } catch (error) {
    console.error("Error fetching curriculum:", error);
    return NextResponse.json({ error: "Failed to fetch curriculum" }, { status: 500 });
  }
}

// PUT /api/courses/[id] - Update curriculum (backward compatible route)
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const validatedData = curriculumUpdateSchema.parse(body);

    const curriculum = await prisma.curriculum.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(curriculum);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json({ error: "Curriculum not found" }, { status: 404 });
    }
    console.error("Error updating curriculum:", error);
    return NextResponse.json({ error: "Failed to update curriculum" }, { status: 500 });
  }
}

// DELETE /api/courses/[id] - Delete curriculum (backward compatible route)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    await prisma.curriculum.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Record to delete does not exist")) {
      return NextResponse.json({ error: "Curriculum not found" }, { status: 404 });
    }
    console.error("Error deleting curriculum:", error);
    return NextResponse.json({ error: "Failed to delete curriculum" }, { status: 500 });
  }
}
