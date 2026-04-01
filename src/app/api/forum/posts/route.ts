import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/forum/posts - Get forum posts with pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const categorySlug = searchParams.get("category");
    const courseId = searchParams.get("courseId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};
    if (categorySlug) {
      where.category = { slug: categorySlug };
    }
    if (courseId) {
      where.courseId = courseId;
    }

    // Get total count
    const total = await prisma.forumPost.count({ where });

    // Get posts
    const posts = await prisma.forumPost.findMany({
      where,
      orderBy: [
        { isPinned: "desc" },
        { createdAt: "desc" },
      ],
      skip,
      take: limit,
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
        _count: {
          select: {
            replies: true,
            reactions: true,
          },
        },
      },
    });

    // Get user's reactions for these posts
    const postIds = posts.map(p => p.id);
    const userReactions = await prisma.forumReaction.findMany({
      where: {
        userId: session.user.id,
        postId: { in: postIds },
      },
    });
    const reactionMap = new Map(userReactions.map(r => [r.postId, r.type]));

    const postsWithReactions = posts.map(post => ({
      ...post,
      userReaction: reactionMap.get(post.id) || null,
    }));

    return NextResponse.json({
      posts: postsWithReactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Failed to fetch forum posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// POST /api/forum/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, categoryId, courseId } = body;

    if (!title || !content || !categoryId) {
      return NextResponse.json(
        { error: "Title, content, and category are required" },
        { status: 400 }
      );
    }

    // Verify category exists
    const category = await prisma.forumCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category || !category.isActive) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    // Verify course exists if provided
    if (courseId) {
      const course = await prisma.trainingCourse.findUnique({
        where: { id: courseId },
      });
      if (!course) {
        return NextResponse.json(
          { error: "Invalid course" },
          { status: 400 }
        );
      }
    }

    const post = await prisma.forumPost.create({
      data: {
        title,
        content,
        authorId: session.user.id,
        categoryId,
        courseId: courseId || null,
      },
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

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Failed to create forum post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
