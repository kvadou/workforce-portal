import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import type { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

const opsHubUrl = process.env.OPSHUB_INTERNAL_URL;
const secret = process.env.INTERNAL_API_SECRET;

/**
 * GET /api/admin/charges/categories
 * Fetch ad-hoc charge categories from OpsHub.
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!opsHubUrl || !secret) {
      return NextResponse.json({ error: "OpsHub not configured" }, { status: 503 });
    }

    const response = await fetch(`${opsHubUrl}/api/adhoc-charges/categories`, {
      headers: { Authorization: `Bearer ${secret}` },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch categories" }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching charge categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
