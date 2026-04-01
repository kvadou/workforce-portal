import { NextRequest, NextResponse } from "next/server";
import { sendOrientationReminders } from "@/lib/onboarding-gamification";

/**
 * POST /api/cron/orientation-reminders
 * Sends reminder notifications to users with upcoming orientation sessions
 * Should be called by a cron job every hour
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const remindersSent = await sendOrientationReminders();

    return NextResponse.json({
      success: true,
      remindersSent,
    });
  } catch (error) {
    console.error("Error sending orientation reminders:", error);
    return NextResponse.json(
      { error: "Failed to send reminders" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/orientation-reminders
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "active",
    service: "Orientation Reminders Cron",
  });
}
