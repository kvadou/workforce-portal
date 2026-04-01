import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

// GET all badges
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const badges = await prisma.onboardingBadge.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ success: true, badges });
  } catch (error) {
    console.error("Error fetching badges:", error);
    return NextResponse.json(
      { error: "Failed to fetch badges" },
      { status: 500 }
    );
  }
}

// POST - Create new badge
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      badgeKey,
      title,
      description,
      icon,
      colorScheme,
      unlockType,
      unlockCondition,
      order,
    } = body;

    const badge = await prisma.onboardingBadge.create({
      data: {
        badgeKey,
        title,
        description,
        icon,
        colorScheme: typeof colorScheme === "object" ? JSON.stringify(colorScheme) : colorScheme,
        unlockType,
        unlockCondition,
        order,
      },
    });

    return NextResponse.json({ success: true, badge });
  } catch (error) {
    console.error("Error creating badge:", error);
    return NextResponse.json(
      { error: "Failed to create badge" },
      { status: 500 }
    );
  }
}

// PUT - Update badge(s) or reorder
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
          prisma.onboardingBadge.update({
            where: { id },
            data: { order },
          })
        )
      );
      return NextResponse.json({ success: true, badges: updates });
    }

    // Single badge update
    const {
      id,
      badgeKey,
      title,
      description,
      icon,
      colorScheme,
      unlockType,
      unlockCondition,
      order,
    } = body;

    const badge = await prisma.onboardingBadge.update({
      where: { id },
      data: {
        ...(badgeKey && { badgeKey }),
        title,
        description,
        icon,
        colorScheme: typeof colorScheme === "object" ? JSON.stringify(colorScheme) : colorScheme,
        unlockType,
        unlockCondition,
        order,
      },
    });

    return NextResponse.json({ success: true, badge });
  } catch (error) {
    console.error("Error updating badge:", error);
    return NextResponse.json(
      { error: "Failed to update badge" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete badge
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;

    await prisma.onboardingBadge.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting badge:", error);
    return NextResponse.json(
      { error: "Failed to delete badge" },
      { status: 500 }
    );
  }
}
