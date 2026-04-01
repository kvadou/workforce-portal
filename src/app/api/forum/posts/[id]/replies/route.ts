import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/forum/posts/[id]/replies - Create a reply to a post
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await params;
    const body = await request.json();
    const { content, parentId } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Verify post exists and is not locked
    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.isLocked) {
      return NextResponse.json(
        { error: "This post is locked and cannot receive new replies" },
        { status: 403 }
      );
    }

    // Verify parent reply exists if provided
    if (parentId) {
      const parentReply = await prisma.forumReply.findUnique({
        where: { id: parentId },
      });
      if (!parentReply || parentReply.postId !== postId) {
        return NextResponse.json(
          { error: "Invalid parent reply" },
          { status: 400 }
        );
      }
    }

    const reply = await prisma.forumReply.create({
      data: {
        content,
        authorId: session.user.id,
        postId,
        parentId: parentId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            reactions: true,
          },
        },
      },
    });

    return NextResponse.json(reply, { status: 201 });
  } catch (error) {
    console.error("Failed to create forum reply:", error);
    return NextResponse.json(
      { error: "Failed to create reply" },
      { status: 500 }
    );
  }
}
