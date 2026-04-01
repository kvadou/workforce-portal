import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resourceReorderSchema } from "@/lib/validations/resource";

// PUT /api/resources/reorder - Bulk reorder resources
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can reorder resources
    if (!hasMinRole(session.user.role, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = resourceReorderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { resources } = validation.data;

    // Update all resources in a transaction
    await prisma.$transaction(
      resources.map((item) =>
        prisma.resource.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering resources:", error);
    return NextResponse.json(
      { error: "Failed to reorder resources" },
      { status: 500 }
    );
  }
}
