import { NextRequest, NextResponse } from "next/server";
import { processLessonCompletion } from "@/lib/badge-engine";
import { verifyInternalApiRequest } from "@/lib/internal-auth";

/**
 * POST /api/internal/lessons/completion
 * Called by Acme when a lesson is completed
 * Requires INTERNAL_API_SECRET header
 */
export async function POST(req: NextRequest) {
  try {
    const auth = verifyInternalApiRequest(req);
    if (!auth.ok) {
      return auth.response;
    }

    const body = await req.json();
    const { tutorProfileId, lessonDate, rating, isTrialConversion } = body;

    if (!tutorProfileId) {
      return NextResponse.json(
        { error: "tutorProfileId is required" },
        { status: 400 }
      );
    }

    const result = await processLessonCompletion(tutorProfileId, {
      lessonDate: lessonDate ? new Date(lessonDate) : new Date(),
      rating: rating ? Number(rating) : undefined,
      isTrialConversion: Boolean(isTrialConversion),
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error processing lesson completion:", error);
    return NextResponse.json(
      { error: "Failed to process lesson completion" },
      { status: 500 }
    );
  }
}
