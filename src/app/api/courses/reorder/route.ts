import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { UserRole } from "@prisma/client";

const reorderSchema = z.object({
  courses: z.array(
    z.object({
      id: z.string(),
      order: z.number().int(),
    })
  ).optional(),
  curricula: z.array(
    z.object({
      id: z.string(),
      order: z.number().int(),
    })
  ).optional(),
});

// PUT /api/courses/reorder - Reorder curriculum (backward compatible route)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const data = reorderSchema.parse(body);

    // Support both 'courses' (backward compat) and 'curricula' (new)
    const items = data.curricula || data.courses || [];

    // Update all curriculum items in a transaction
    await prisma.$transaction(
      items.map((item) =>
        prisma.curriculum.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Error reordering curriculum:", error);
    return NextResponse.json({ error: "Failed to reorder curriculum" }, { status: 500 });
  }
}
