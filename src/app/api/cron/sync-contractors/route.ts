import { NextRequest, NextResponse } from "next/server";
import { syncContractorsFromSTC } from "@/lib/stc-sync";

export const dynamic = "force-dynamic";

// POST /api/cron/sync-contractors
// Can be called by a cron job (external scheduler) or manually from admin
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret or admin auth
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Check for cron secret (for automated jobs) or internal API secret (for manual triggers)
    const internalSecret = process.env.INTERNAL_API_SECRET;
    const isAuthorized =
      (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      (internalSecret && authHeader === `Bearer ${internalSecret}`);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[STC Sync] Starting contractor sync...");
    const result = await syncContractorsFromSTC();
    console.log("[STC Sync] Sync completed:", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[STC Sync] Failed:", error);
    return NextResponse.json(
      { error: "Sync failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// GET /api/cron/sync-contractors - Check sync status (for health checks)
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/cron/sync-contractors",
    method: "POST",
    description: "Sync approved contractors from STC database",
    authentication: "Bearer token (CRON_SECRET or INTERNAL_API_SECRET)",
  });
}
