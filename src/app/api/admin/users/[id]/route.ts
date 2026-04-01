import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

// GET single user
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name || "Unnamed User",
        email: user.email,
        role: user.role,
        status: user.isOnboarding ? "pending" : "active",
        lastActive: user.updatedAt,
        avatarUrl: user.avatarUrl,
        organization: user.organization,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, role, organizationId, isOnboarding } = body;

    // Prevent demoting yourself
    if (id === session.user.id && role && role !== session.user.role) {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 400 }
      );
    }

    // Prevent non-super-admins from creating super admins
    if (role === "SUPER_ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only super admins can assign the super admin role" },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (organizationId !== undefined) updateData.organizationId = organizationId;
    if (isOnboarding !== undefined) updateData.isOnboarding = isOnboarding;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name || "Unnamed User",
        email: user.email,
        role: user.role,
        status: user.isOnboarding ? "pending" : "active",
        lastActive: user.updatedAt,
        avatarUrl: user.avatarUrl,
        organization: user.organization,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "SUPER_ADMIN")) {
      return NextResponse.json(
        { error: "Only super admins can delete users" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Prevent deleting yourself
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    // Delete related records first (no cascade in schema)
    await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId: id } }),
      prisma.onboardingProgress.deleteMany({ where: { userId: id } }),
      prisma.notification.deleteMany({ where: { userId: id } }),
      prisma.userBadge.deleteMany({ where: { userId: id } }),
      prisma.courseEnrollment.deleteMany({ where: { userId: id } }),
      prisma.engagementAlert.deleteMany({ where: { userId: id } }),
      prisma.puzzleAttempt.deleteMany({ where: { userId: id } }),
      prisma.userPuzzleStats.deleteMany({ where: { userId: id } }),
      prisma.chessLessonProgress.deleteMany({ where: { userId: id } }),
      prisma.courseCertificate.deleteMany({ where: { userId: id } }),
      prisma.courseReview.deleteMany({ where: { userId: id } }),
      prisma.onboardingCertificate.deleteMany({ where: { userId: id } }),
      prisma.pushSubscription.deleteMany({ where: { userId: id } }),
      prisma.tutorGoal.deleteMany({ where: { userId: id } }),
      prisma.forumReaction.deleteMany({ where: { userId: id } }),
      prisma.forumReply.deleteMany({ where: { authorId: id } }),
      prisma.forumPost.deleteMany({ where: { authorId: id } }),
      prisma.certification.deleteMany({ where: { userId: id } }),
      prisma.lessonProgress.deleteMany({ where: { userId: id } }),
      prisma.instructorNote.deleteMany({ where: { userId: id } }),
      prisma.class.deleteMany({ where: { instructorId: id } }),
      prisma.media.deleteMany({ where: { uploadedById: id } }),
      prisma.tutorProfile.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true, message: "User deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
