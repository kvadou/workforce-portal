import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReactionType } from "@prisma/client";

// POST /api/forum/reactions - Toggle a reaction on a post or reply
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { postId, replyId, type } = body;

    if (!type || !["LIKE", "HELPFUL", "INSIGHTFUL"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid reaction type" },
        { status: 400 }
      );
    }

    if (!postId && !replyId) {
      return NextResponse.json(
        { error: "Either postId or replyId is required" },
        { status: 400 }
      );
    }

    if (postId && replyId) {
      return NextResponse.json(
        { error: "Cannot react to both post and reply" },
        { status: 400 }
      );
    }

    // Check if reaction already exists
    const existingReaction = await prisma.forumReaction.findFirst({
      where: {
        userId: session.user.id,
        ...(postId ? { postId } : { replyId }),
      },
    });

    if (existingReaction) {
      // If same type, remove reaction (toggle off)
      if (existingReaction.type === type) {
        await prisma.forumReaction.delete({
          where: { id: existingReaction.id },
        });
        return NextResponse.json({ action: "removed" });
      }

      // If different type, update reaction
      await prisma.forumReaction.update({
        where: { id: existingReaction.id },
        data: { type: type as ReactionType },
      });
      return NextResponse.json({ action: "updated", type });
    }

    // Create new reaction
    await prisma.forumReaction.create({
      data: {
        type: type as ReactionType,
        userId: session.user.id,
        postId: postId || null,
        replyId: replyId || null,
      },
    });

    return NextResponse.json({ action: "added", type });
  } catch (error) {
    console.error("Failed to toggle reaction:", error);
    return NextResponse.json(
      { error: "Failed to toggle reaction" },
      { status: 500 }
    );
  }
}
