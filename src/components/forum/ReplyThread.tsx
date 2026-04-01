"use client";

import { useState } from "react";
import {
  HandThumbUpIcon,
  LightBulbIcon,
  QuestionMarkCircleIcon,
  ArrowUturnLeftIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import type { ForumReply } from "@/hooks/useForum";
import { formatDistanceToNow } from "date-fns";

interface ReplyThreadProps {
  reply: ForumReply;
  postAuthorId: string;
  currentUserId: string;
  isAdmin: boolean;
  onReply: (parentId: string) => void;
  onReact: (replyId: string, type: "LIKE" | "HELPFUL" | "INSIGHTFUL") => void;
  onMarkAsAnswer?: (replyId: string) => void;
  depth?: number;
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

export function ReplyThread({
  reply,
  postAuthorId,
  currentUserId,
  isAdmin,
  onReply,
  onReact,
  onMarkAsAnswer,
  depth = 0,
}: ReplyThreadProps) {
  const [showReplies, setShowReplies] = useState(true);
  const maxDepth = 3;
  const canNest = depth < maxDepth;

  const isPostAuthor = postAuthorId === currentUserId;
  const canMarkAsAnswer = (isPostAuthor || isAdmin) && !reply.isAnswer && onMarkAsAnswer;

  const reactionCounts = {
    LIKE: reply.reactions?.filter((r) => r.type === "LIKE").length || 0,
    HELPFUL: reply.reactions?.filter((r) => r.type === "HELPFUL").length || 0,
    INSIGHTFUL: reply.reactions?.filter((r) => r.type === "INSIGHTFUL").length || 0,
  };

  return (
    <div className={`${depth > 0 ? "ml-6 pl-4 border-l-2 border-neutral-100" : ""}`}>
      <div
        className={`rounded-xl p-4 ${
          reply.isAnswer
            ? "bg-success-light border border-success"
            : "bg-neutral-50"
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {reply.author.avatarUrl ? (
              <img
                src={reply.author.avatarUrl}
                alt={reply.author.name || "User"}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(reply.author.name)
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-neutral-900 text-sm">
                {reply.author.name || "Unknown"}
              </span>
              {reply.isAnswer && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-success-light text-success-dark rounded text-xs font-medium">
                  <CheckCircleIcon className="h-3 w-3" />
                  Answer
                </span>
              )}
            </div>
            <span className="text-xs text-neutral-500 flex items-center gap-1">
              <ClockIcon className="h-3 w-3" />
              {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="text-neutral-700 text-sm whitespace-pre-wrap mb-3">
          {reply.content}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Reactions */}
          <button
            onClick={() => onReact(reply.id, "LIKE")}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              reply.userReaction === "LIKE"
                ? "bg-primary-100 text-primary-600"
                : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            <HandThumbUpIcon className="h-3.5 w-3.5" />
            {reactionCounts.LIKE > 0 && <span>{reactionCounts.LIKE}</span>}
          </button>

          <button
            onClick={() => onReact(reply.id, "HELPFUL")}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              reply.userReaction === "HELPFUL"
                ? "bg-warning-light text-warning"
                : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            <LightBulbIcon className="h-3.5 w-3.5" />
            {reactionCounts.HELPFUL > 0 && <span>{reactionCounts.HELPFUL}</span>}
          </button>

          <button
            onClick={() => onReact(reply.id, "INSIGHTFUL")}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              reply.userReaction === "INSIGHTFUL"
                ? "bg-accent-navy-light text-accent-navy"
                : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            <QuestionMarkCircleIcon className="h-3.5 w-3.5" />
            {reactionCounts.INSIGHTFUL > 0 && <span>{reactionCounts.INSIGHTFUL}</span>}
          </button>

          {canNest && (
            <button
              onClick={() => onReply(reply.id)}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              <ArrowUturnLeftIcon className="h-3.5 w-3.5" />
              Reply
            </button>
          )}

          {canMarkAsAnswer && (
            <button
              onClick={() => onMarkAsAnswer(reply.id)}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-success-light border border-success text-success hover:bg-success-light transition-colors ml-auto"
            >
              <CheckCircleIcon className="h-3.5 w-3.5" />
              Mark as Answer
            </button>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {reply.children && reply.children.length > 0 && (
        <div className="mt-3 space-y-3">
          {!showReplies ? (
            <button
              onClick={() => setShowReplies(true)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Show {reply.children.length} {reply.children.length === 1 ? "reply" : "replies"}
            </button>
          ) : (
            <>
              {reply.children.map((childReply) => (
                <ReplyThread
                  key={childReply.id}
                  reply={childReply}
                  postAuthorId={postAuthorId}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onReply={onReply}
                  onReact={onReact}
                  onMarkAsAnswer={onMarkAsAnswer}
                  depth={depth + 1}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
