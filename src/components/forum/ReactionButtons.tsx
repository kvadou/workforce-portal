"use client";

import { HandThumbUpIcon, LightBulbIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

interface ReactionButtonsProps {
  reactionCounts: {
    LIKE: number;
    HELPFUL: number;
    INSIGHTFUL: number;
  };
  userReaction: "LIKE" | "HELPFUL" | "INSIGHTFUL" | null;
  onReact: (type: "LIKE" | "HELPFUL" | "INSIGHTFUL") => void;
  size?: "sm" | "md";
}

export function ReactionButtons({
  reactionCounts,
  userReaction,
  onReact,
  size = "md",
}: ReactionButtonsProps) {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const padding = size === "sm" ? "px-2 py-1" : "px-3 py-1.5";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onReact("LIKE")}
        className={`flex items-center gap-1.5 ${padding} rounded-lg ${textSize} font-medium transition-colors ${
          userReaction === "LIKE"
            ? "bg-primary-100 text-primary-600 border border-primary-200"
            : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300"
        }`}
      >
        <HandThumbUpIcon className={iconSize} />
        <span>Like</span>
        {reactionCounts.LIKE > 0 && (
          <span className="ml-0.5 text-neutral-500">{reactionCounts.LIKE}</span>
        )}
      </button>

      <button
        onClick={() => onReact("HELPFUL")}
        className={`flex items-center gap-1.5 ${padding} rounded-lg ${textSize} font-medium transition-colors ${
          userReaction === "HELPFUL"
            ? "bg-warning-light text-warning border border-warning"
            : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300"
        }`}
      >
        <LightBulbIcon className={iconSize} />
        <span>Helpful</span>
        {reactionCounts.HELPFUL > 0 && (
          <span className="ml-0.5 text-neutral-500">{reactionCounts.HELPFUL}</span>
        )}
      </button>

      <button
        onClick={() => onReact("INSIGHTFUL")}
        className={`flex items-center gap-1.5 ${padding} rounded-lg ${textSize} font-medium transition-colors ${
          userReaction === "INSIGHTFUL"
            ? "bg-accent-navy-light text-accent-navy border border-accent-navy"
            : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300"
        }`}
      >
        <QuestionMarkCircleIcon className={iconSize} />
        <span>Insightful</span>
        {reactionCounts.INSIGHTFUL > 0 && (
          <span className="ml-0.5 text-neutral-500">{reactionCounts.INSIGHTFUL}</span>
        )}
      </button>
    </div>
  );
}
