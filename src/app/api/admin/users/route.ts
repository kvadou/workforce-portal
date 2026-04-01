import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole, canManageRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email/onboarding-emails";
import { UserRole } from "@prisma/client";
import crypto from "crypto";

const VALID_ROLES = Object.values(UserRole);

// GET all users with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const role = searchParams.get("role") as UserRole | null;
    const status = searchParams.get("status"); // active, pending, inactive
    const organizationId = searchParams.get("organizationId");

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (organizationId) {
      where.organizationId = organizationId;
    }

    // Status filtering based on user state
    if (status === "active") {
      where.isOnboarding = false;
    } else if (status === "pending") {
      where.isOnboarding = true;
    }
    // 'inactive' would need a separate field - for now we'll just show all

    const users = await prisma.user.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform data for frontend
    const transformedUsers = users.map((user) => ({
      id: user.id,
      name: user.name || "Unnamed User",
      email: user.email,
      role: user.role,
      status: user.isOnboarding ? "pending" : "active",
      lastActive: user.updatedAt,
      avatarUrl: user.avatarUrl,
      organization: user.organization,
      createdAt: user.createdAt,
    }));

    // Stats
    const stats = {
      total: users.length,
      active: users.filter((u) => !u.isOnboarding).length,
      pending: users.filter((u) => u.isOnboarding).length,
      admins: users.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length,
    };

    return NextResponse.json({ success: true, users: transformedUsers, stats });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST - Invite a new user
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { email, name, role, organizationId } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Create user with a temporary password (they'll set it via password reset)
    const tempPasswordHash = await import("bcryptjs").then((bcrypt) =>
      bcrypt.hash(Math.random().toString(36), 10)
    );

    // Generate password reset token (valid for 7 days)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const userRole = (role || "TUTOR") as UserRole;

    // Validate role is a valid enum value
    if (!VALID_ROLES.includes(userRole)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` },
        { status: 400 }
      );
    }

    // Prevent creating users at or above your own role level
    if (!canManageRole(session.user.role as UserRole, userRole)) {
      return NextResponse.json(
        { error: "You cannot create users with a role at or above your own" },
        { status: 403 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        role: userRole,
        organizationId: organizationId || null,
        passwordHash: tempPasswordHash,
        isOnboarding: ["TUTOR", "ONBOARDING_TUTOR", "LEAD_TUTOR"].includes(userRole),
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
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

    // Send welcome email with password setup link
    const emailSent = await sendWelcomeEmail(
      email,
      name || "there",
      resetToken,
      userRole
    );

    if (!emailSent) {
      console.error("Failed to send welcome email to:", email);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name || "Unnamed User",
        email: user.email,
        role: user.role,
        status: "pending",
        organization: user.organization,
        createdAt: user.createdAt,
      },
      message: "User invited successfully",
    });
  } catch (error) {
    console.error("Error inviting user:", error);
    return NextResponse.json(
      { error: "Failed to invite user" },
      { status: 500 }
    );
  }
}
