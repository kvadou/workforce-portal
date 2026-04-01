import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { curriculumCreateSchema } from "@/lib/validations/curriculum";
import type { UserRole } from "@prisma/client";

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// GET /api/courses - List all curriculum (backward compatible route)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "TUTOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const includeModules = searchParams.get("includeModules") === "true";
    const includeLessons = searchParams.get("includeLessons") === "true";
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const usePagination = pageParam !== null || limitParam !== null;
    const page = parsePositiveInt(pageParam, 1);
    const limit = Math.min(100, parsePositiveInt(limitParam, 20));
    const skip = (page - 1) * limit;
    const where = status
      ? { status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" }
      : undefined;

    const [curricula, total] = await Promise.all([
      prisma.curriculum.findMany({
        where,
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
        orderBy: { order: "asc" },
        ...(usePagination && { skip, take: limit }),
      }),
      usePagination ? prisma.curriculum.count({ where }) : Promise.resolve(0),
    ]);

    if (!usePagination) {
      return NextResponse.json(curricula);
    }

    return NextResponse.json({
      curricula,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      hasMore: skip + curricula.length < total,
    });
  } catch (error) {
    console.error("Error fetching curriculum:", error);
    return NextResponse.json({ error: "Failed to fetch curriculum" }, { status: 500 });
  }
}

// POST /api/courses - Create new curriculum (backward compatible route)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const validatedData = curriculumCreateSchema.parse(body);

    // Get the max order to place new curriculum at the end
    const maxOrder = await prisma.curriculum.aggregate({
      _max: { order: true },
    });

    const curriculum = await prisma.curriculum.create({
      data: {
        ...validatedData,
        order: validatedData.order ?? (maxOrder._max.order ?? 0) + 1,
      },
    });

    return NextResponse.json(curriculum, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Error creating curriculum:", error);
    return NextResponse.json({ error: "Failed to create curriculum" }, { status: 500 });
  }
}
