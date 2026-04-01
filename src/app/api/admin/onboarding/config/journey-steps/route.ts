import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

// GET all journey steps
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const steps = await prisma.onboardingJourneyStep.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ success: true, steps });
  } catch (error) {
    console.error("Error fetching journey steps:", error);
    return NextResponse.json(
      { error: "Failed to fetch journey steps" },
      { status: 500 }
    );
  }
}

// POST - Create new journey step
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      shortDescription,
      icon,
      href,
      color,
      requiredStatus,
      completionField,
      badgeType,
      order,
    } = body;

    const step = await prisma.onboardingJourneyStep.create({
      data: {
        title,
        description,
        shortDescription,
        icon,
        href,
        color,
        requiredStatus,
        completionField,
        badgeType,
        order,
      },
    });

    return NextResponse.json({ success: true, step });
  } catch (error) {
    console.error("Error creating journey step:", error);
    return NextResponse.json(
      { error: "Failed to create journey step" },
      { status: 500 }
    );
  }
}

// PUT - Update journey step(s) or reorder
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
          prisma.onboardingJourneyStep.update({
            where: { id },
            data: { order },
          })
        )
      );
      return NextResponse.json({ success: true, steps: updates });
    }

    // Single step update
    const {
      id,
      title,
      description,
      shortDescription,
      icon,
      href,
      color,
      requiredStatus,
      completionField,
      badgeType,
      order,
    } = body;

    const step = await prisma.onboardingJourneyStep.update({
      where: { id },
      data: {
        title,
        description,
        shortDescription,
        icon,
        href,
        color,
        requiredStatus,
        completionField,
        badgeType,
        order,
      },
    });

    return NextResponse.json({ success: true, step });
  } catch (error) {
    console.error("Error updating journey step:", error);
    return NextResponse.json(
      { error: "Failed to update journey step" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete journey step
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;

    await prisma.onboardingJourneyStep.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting journey step:", error);
    return NextResponse.json(
      { error: "Failed to delete journey step" },
      { status: 500 }
    );
  }
}
