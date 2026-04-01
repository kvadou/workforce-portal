"use client";

import Link from "next/link";
import {
  ChatBubbleLeftIcon,
  EyeIcon,
  HandThumbUpIcon,
  ClockIcon,
  MapPinIcon,
  LockClosedIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import type { ForumPost } from "@/hooks/useForum";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: ForumPost;
  showCategory?: boolean;
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

export function PostCard({ post, showCategory = false }: PostCardProps) {
  const replyCount = post._count?.replies || 0;
  const reactionCount = post._count?.reactions || 0;

  return (
    <Link href={`/forum/${post.category.slug}/${post.id}`}>
      <div className="bg-white rounded-xl border border-neutral-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all group">
        <div className="flex gap-4">
          {/* Author Avatar */}
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
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

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title Row */}
            <div className="flex items-start gap-2 mb-1">
              {post.isPinned && (
                <MapPinIcon className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
              )}
              {post.isLocked && (
                <LockClosedIcon className="h-4 w-4 text-neutral-400 flex-shrink-0 mt-0.5" />
              )}
              <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors truncate">
                {post.title}
              </h3>
            </div>

            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
              <span>{post.author.name || "Unknown"}</span>
              <span className="flex items-center gap-1">
                <ClockIcon className="h-3.5 w-3.5" />
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </span>
              {showCategory && (
                <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded text-xs font-medium">
                  {post.category.name}
                </span>
              )}
              {post.course && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-600 rounded text-xs font-medium">
                  <BookOpenIcon className="h-3 w-3" />
                  {post.course.title}
                </span>
              )}
            </div>

            {/* Preview */}
            <p className="text-sm text-neutral-600 mt-2 line-clamp-2">
              {post.content.substring(0, 150)}
              {post.content.length > 150 ? "..." : ""}
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-col items-end gap-2 text-sm text-neutral-500 flex-shrink-0">
            <div className="flex items-center gap-1">
              <ChatBubbleLeftIcon className="h-4 w-4" />
              <span>{replyCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <HandThumbUpIcon className="h-4 w-4" />
              <span>{reactionCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <EyeIcon className="h-4 w-4" />
              <span>{post.viewCount}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
