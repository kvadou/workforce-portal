import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

// GET /api/classes/[id]/students - Get all students in a class
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "TUTOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const students = await prisma.student.findMany({
      where: { classId: id },
      include: {
        progress: {
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                number: true,
              },
            },
          },
        },
      },
      orderBy: { firstName: "asc" },
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("Failed to fetch students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

// POST /api/classes/[id]/students - Add a student to a class
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "TUTOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const { firstName, lastName, nickname, avatar } = body;

    if (!firstName) {
      return NextResponse.json(
        { error: "firstName is required" },
        { status: 400 }
      );
    }

    const student = await prisma.student.create({
      data: {
        classId: id,
        firstName,
        lastName,
        nickname,
        avatar,
      },
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error("Failed to create student:", error);
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    );
  }
}

// PUT /api/classes/[id]/students - Bulk add students
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "TUTOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const { students } = body;

    if (!students || !Array.isArray(students)) {
      return NextResponse.json(
        { error: "students array is required" },
        { status: 400 }
      );
    }

    const created = await prisma.student.createMany({
      data: students.map((s: { firstName: string; lastName?: string; nickname?: string; avatar?: string }) => ({
        classId: id,
        firstName: s.firstName,
        lastName: s.lastName,
        nickname: s.nickname,
        avatar: s.avatar,
      })),
    });

    return NextResponse.json({ count: created.count });
  } catch (error) {
    console.error("Failed to create students:", error);
    return NextResponse.json(
      { error: "Failed to create students" },
      { status: 500 }
    );
  }
}
