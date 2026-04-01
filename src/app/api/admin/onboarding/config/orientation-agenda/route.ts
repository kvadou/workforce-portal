import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

// GET all orientation agenda items
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await prisma.onboardingOrientationAgenda.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("Error fetching orientation agenda:", error);
    return NextResponse.json(
      { error: "Failed to fetch orientation agenda" },
      { status: 500 }
    );
  }
}

// POST - Create new agenda item
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, order } = body;

    const item = await prisma.onboardingOrientationAgenda.create({
      data: {
        title,
        description,
        order: order ?? 0,
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error("Error creating agenda item:", error);
    return NextResponse.json(
      { error: "Failed to create agenda item" },
      { status: 500 }
    );
  }
}

// PUT - Update agenda item(s) or reorder
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Handle reorder operation
    if (body.reorder && Array.isArray(body.items)) {
      const updates = await Promise.all(
        body.items.map(({ id, order }: { id: string; order: number }) =>
          prisma.onboardingOrientationAgenda.update({
            where: { id },
            data: { order },
          })
        )
      );
      return NextResponse.json({ success: true, items: updates });
    }

    // Handle bulk update
    if (Array.isArray(body)) {
      const updates = await Promise.all(
        body.map(({ id, title, description, order }) =>
          prisma.onboardingOrientationAgenda.update({
            where: { id },
            data: { title, description, order },
          })
        )
      );
      return NextResponse.json({ success: true, items: updates });
    }

    // Single item update
    const { id, title, description, order } = body;

    const item = await prisma.onboardingOrientationAgenda.update({
      where: { id },
      data: { title, description, order },
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error("Error updating agenda item:", error);
    return NextResponse.json(
      { error: "Failed to update agenda item" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete agenda item
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;

    await prisma.onboardingOrientationAgenda.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting agenda item:", error);
    return NextResponse.json(
      { error: "Failed to delete agenda item" },
      { status: 500 }
    );
  }
}
