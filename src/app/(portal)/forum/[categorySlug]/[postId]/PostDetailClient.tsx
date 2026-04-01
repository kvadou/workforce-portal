"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  BookOpenIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  EyeIcon,
  LockClosedIcon,
  MapPinIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import {
  useForumPost,
  useCreateReply,
  useToggleReaction,
} from "@/hooks/useForum";
import { ReplyThread } from "@/components/forum/ReplyThread";
import { ReactionButtons } from "@/components/forum/ReactionButtons";
import { formatDistanceToNow } from "date-fns";

interface PostDetailClientProps {
  postId: string;
  currentUserId: string;
  userRole: string;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function PostDetailClient({
  postId,
  currentUserId,
  userRole,
}: PostDetailClientProps) {
  const [replyContent, setReplyContent] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);

  const { data: post, isLoading, error } = useForumPost(postId);
  const createReply = useCreateReply();
  const toggleReaction = useToggleReaction();

  const isAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN";

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyContent.trim()) return;

    try {
      await createReply.mutateAsync({
        postId,
        content: replyContent.trim(),
        parentId: replyToId || undefined,
      });
      setReplyContent("");
      setReplyToId(null);
    } catch (err) {
      console.error("Failed to create reply:", err);
    }
  };

  const handleReact = async (
    type: "LIKE" | "HELPFUL" | "INSIGHTFUL",
    replyId?: string
  ) => {
    try {
      await toggleReaction.mutateAsync({
        postId: replyId ? undefined : postId,
        replyId,
        type,
      });
    } catch (err) {
      console.error("Failed to toggle reaction:", err);
    }
  };

  const handleReplyToReply = (parentId: string) => {
    setReplyToId(parentId);
    document.getElementById("reply-form")?.scrollIntoView({ behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white flex items-center justify-center">
        <ArrowPathIcon className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-xl font-semibold text-neutral-900 mb-2">
            Post Not Found
          </h1>
          <p className="text-neutral-600 mb-4">
            This discussion may have been deleted or doesn&apos;t exist.
          </p>
          <Link href="/forum">
            <Button>Back to Forums</Button>
          </Link>
        </div>
      </div>
    );
  }

  const reactionCounts = {
    LIKE: post.reactions?.filter((r) => r.type === "LIKE").length || 0,
    HELPFUL: post.reactions?.filter((r) => r.type === "HELPFUL").length || 0,
    INSIGHTFUL: post.reactions?.filter((r) => r.type === "INSIGHTFUL").length || 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Back Link */}
        <Link
          href="/forum"
          className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900 mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Back to Forums
        </Link>

        {/* Post */}
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden mb-6">
          {/* Post Header */}
          <div className="p-6 border-b border-neutral-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-lg font-semibold flex-shrink-0">
                {post.author.avatarUrl ? (
                  <img
                    src={post.author.avatarUrl}
                    alt={post.author.name || "User"}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(post.author.name)
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {post.isPinned && (
                    <MapPinIcon className="w-4 h-4 text-warning" />
                  )}
                  {post.isLocked && (
                    <LockClosedIcon className="w-4 h-4 text-neutral-400" />
                  )}
                  <h1 className="text-xl font-bold text-neutral-900">
                    {post.title}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500">
                  <span className="font-medium text-neutral-700">
                    {post.author.name || "Unknown"}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClockIcon className="w-3.5 h-3.5" />
                    {formatDistanceToNow(new Date(post.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <EyeIcon className="w-3.5 h-3.5" />
                    {post.viewCount} views
                  </span>
                  <Link
                    href={`/forum?category=${post.category.slug}`}
                    className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded text-xs font-medium hover:bg-neutral-200"
                  >
                    {post.category.name}
                  </Link>
                  {post.course && (
                    <Link
                      href={`/training/${post.course.slug}`}
                      className="flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-600 rounded text-xs font-medium hover:bg-primary-100"
                    >
                      <BookOpenIcon className="w-3 h-3" />
                      {post.course.title}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Post Content */}
          <div className="p-6">
            <div className="prose prose-neutral max-w-none text-neutral-700 whitespace-pre-wrap">
              {post.content}
            </div>
          </div>

          {/* Post Reactions */}
          <div className="px-6 pb-6">
            <ReactionButtons
              reactionCounts={reactionCounts}
              userReaction={post.userReaction as "LIKE" | "HELPFUL" | "INSIGHTFUL" | null}
              onReact={(type) => handleReact(type)}
            />
          </div>
        </div>

        {/* Replies Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <ChatBubbleLeftIcon className="w-5 h-5 text-primary-500" />
            Replies ({post._count?.replies || 0})
          </h2>

          {post.replies && post.replies.length > 0 ? (
            <div className="space-y-4">
              {post.replies.map((reply) => (
                <ReplyThread
                  key={reply.id}
                  reply={reply}
                  postAuthorId={post.authorId}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onReply={handleReplyToReply}
                  onReact={(replyId, type) => handleReact(type, replyId)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-xl border border-neutral-200">
              <ChatBubbleLeftIcon className="w-12 h-12 text-neutral-200 mx-auto mb-2" />
              <p className="text-neutral-500">No replies yet. Be the first!</p>
            </div>
          )}
        </div>

        {/* Reply Form */}
        {post.isLocked ? (
          <div className="text-center py-6 bg-neutral-50 rounded-xl border border-neutral-200">
            <LockClosedIcon className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-neutral-500">This discussion is locked</p>
          </div>
        ) : (
          <form
            id="reply-form"
            onSubmit={handleSubmitReply}
            className="bg-white rounded-xl border border-neutral-200 p-6"
          >
            <h3 className="font-semibold text-neutral-900 mb-4">
              {replyToId ? "Reply to comment" : "Add a Reply"}
            </h3>

            {replyToId && (
              <div className="mb-4 p-2 bg-neutral-50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-neutral-600">
                  Replying to a comment
                </span>
                <button
                  type="button"
                  onClick={() => setReplyToId(null)}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  Cancel
                </button>
              </div>
            )}

            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Share your thoughts..."
              rows={4}
              className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none mb-4"
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={createReply.isPending || !replyContent.trim()}>
                {createReply.isPending ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                    Post Reply
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
