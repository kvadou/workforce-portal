import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncContractorsFromAcme } from "@/lib/acme-sync";
import { prisma } from "@/lib/prisma";

// POST /api/admin/acme-sync/trigger - Manually trigger a sync
export async function POST() {
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

    const result = await syncContractorsFromAcme();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to trigger sync:", error);
    return NextResponse.json(
      { error: "Failed to trigger sync", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
