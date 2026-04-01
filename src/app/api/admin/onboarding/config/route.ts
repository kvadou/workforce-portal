import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole, ConfigValueType } from "@prisma/client";

// GET all config settings or by category
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const configs = await prisma.onboardingConfig.findMany({
      where: category ? { category, isActive: true } : { isActive: true },
      orderBy: { key: "asc" },
    });

    return NextResponse.json({ success: true, configs });
  } catch (error) {
    console.error("Error fetching configs:", error);
    return NextResponse.json(
      { error: "Failed to fetch configs" },
      { status: 500 }
    );
  }
}

// POST - Create new config
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { key, value, category, label, description, valueType } = body;

    const config = await prisma.onboardingConfig.create({
      data: {
        key,
        value,
        category,
        label,
        description,
        valueType: valueType as ConfigValueType,
      },
    });

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error("Error creating config:", error);
    return NextResponse.json(
      { error: "Failed to create config" },
      { status: 500 }
    );
  }
}

// PUT - Update config(s)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Support bulk updates
    if (Array.isArray(body)) {
      const updates = await Promise.all(
        body.map(({ key, value }) =>
          prisma.onboardingConfig.update({
            where: { key },
            data: { value },
          })
        )
      );
      return NextResponse.json({ success: true, configs: updates });
    }

    // Single update
    const { key, value, label, description, valueType } = body;

    const config = await prisma.onboardingConfig.update({
      where: { key },
      data: {
        value,
        ...(label && { label }),
        ...(description && { description }),
        ...(valueType && { valueType: valueType as ConfigValueType }),
      },
    });

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error("Error updating config:", error);
    return NextResponse.json(
      { error: "Failed to update config" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete config
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { key } = body;

    await prisma.onboardingConfig.update({
      where: { key },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting config:", error);
    return NextResponse.json(
      { error: "Failed to delete config" },
      { status: 500 }
    );
  }
}
