import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/forum/posts/[id] - Get a single post with replies
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Increment view count
    await prisma.forumPost.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    const post = await prisma.forumPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        reactions: {
          select: {
            id: true,
            type: true,
            userId: true,
          },
        },
        _count: {
          select: {
            replies: true,
            reactions: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Get replies with nested structure
    const replies = await prisma.forumReply.findMany({
      where: { postId: id },
      orderBy: [
        { isAnswer: "desc" },
        { createdAt: "asc" },
      ],
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        reactions: {
          select: {
            id: true,
            type: true,
            userId: true,
          },
        },
        _count: {
          select: {
            reactions: true,
          },
        },
      },
    });

    // Build nested reply structure
    const replyMap = new Map();
    const topLevelReplies: typeof replies = [];

    for (const reply of replies) {
      replyMap.set(reply.id, { ...reply, children: [] });
    }

    for (const reply of replies) {
      const replyWithChildren = replyMap.get(reply.id);
      if (reply.parentId && replyMap.has(reply.parentId)) {
        replyMap.get(reply.parentId).children.push(replyWithChildren);
      } else {
        topLevelReplies.push(replyWithChildren);
      }
    }

    // Get user's reaction for the post
    const userPostReaction = post.reactions.find(r => r.userId === session.user.id);

    // Get user's reactions for replies
    const replyIds = replies.map(r => r.id);
    const userReplyReactions = await prisma.forumReaction.findMany({
      where: {
        userId: session.user.id,
        replyId: { in: replyIds },
      },
    });
    const replyReactionMap = new Map(userReplyReactions.map(r => [r.replyId, r.type]));

    // Add user reaction to each reply
    interface ReplyWithChildren {
      id: string;
      userReaction?: string | null;
      children: ReplyWithChildren[];
      [key: string]: unknown;
    }

    const addUserReaction = (replies: ReplyWithChildren[]): ReplyWithChildren[] => {
      return replies.map(reply => ({
        ...reply,
        userReaction: replyReactionMap.get(reply.id) || null,
        children: addUserReaction(reply.children),
      }));
    };

    return NextResponse.json({
      ...post,
      userReaction: userPostReaction?.type || null,
      replies: addUserReaction(topLevelReplies as unknown as ReplyWithChildren[]),
    });
  } catch (error) {
    console.error("Failed to fetch forum post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

// PUT /api/forum/posts/[id] - Update a post (author or admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, content, isPinned, isLocked } = body;

    const post = await prisma.forumPost.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    const isAuthor = post.authorId === session.user.id;

    if (!isAdmin && !isAuthor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only admins can pin/lock posts
    const updateData: Record<string, unknown> = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (isAdmin) {
      if (typeof isPinned === "boolean") updateData.isPinned = isPinned;
      if (typeof isLocked === "boolean") updateData.isLocked = isLocked;
    }

    const updatedPost = await prisma.forumPost.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("Failed to update forum post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

// DELETE /api/forum/posts/[id] - Delete a post (author or admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const post = await prisma.forumPost.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    const isAuthor = post.authorId === session.user.id;

    if (!isAdmin && !isAuthor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.forumPost.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete forum post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
