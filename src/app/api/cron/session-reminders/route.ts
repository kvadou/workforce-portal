import { NextRequest, NextResponse } from "next/server";
import { sendSessionReminders } from "@/lib/notifications";

/**
 * POST /api/cron/session-reminders
 * Send reminders for upcoming live sessions
 * Should be called every 15 minutes by a cron job
 *
 * external scheduler or external cron service can call:
 * curl -X POST https://your-app.example.com/api/cron/session-reminders \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await sendSessionReminders();

    console.log(`Session reminders sent: ${result.notificationsSent}`);

    return NextResponse.json({
      success: true,
      notificationsSent: result.notificationsSent,
    });
  } catch (error) {
    console.error("Error sending session reminders:", error);
    return NextResponse.json(
      { error: "Failed to send reminders" },
      { status: 500 }
    );
  }
}

// Also support GET for simple cron services
export async function GET(req: NextRequest) {
  return POST(req);
}
