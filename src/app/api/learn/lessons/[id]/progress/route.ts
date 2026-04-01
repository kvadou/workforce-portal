import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { onLessonLevelComplete } from "@/lib/chess-gamification";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { levelIndex } = body;

    if (typeof levelIndex !== "number" || levelIndex < 0) {
      return NextResponse.json({ error: "Invalid levelIndex" }, { status: 400 });
    }

    await onLessonLevelComplete(session.user.id, id, levelIndex);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update lesson progress:", error);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
