import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSyncStats } from "@/lib/stc-sync";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/admin/stc-sync/stats - Get sync statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const stats = await getSyncStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to fetch sync stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch sync stats" },
      { status: 500 }
    );
  }
}
