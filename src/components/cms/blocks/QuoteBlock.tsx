"use client";

import { useState } from "react";
import { CMSBlock, useCMS } from "@/providers/CMSProvider";
import { ChatBubbleBottomCenterTextIcon } from "@heroicons/react/24/outline";

interface QuoteBlockProps {
  block: CMSBlock;
  isEditing: boolean;
}

export function QuoteBlock({ block, isEditing }: QuoteBlockProps) {
  const { updateBlock } = useCMS();
  const content = block.content as { text: string; author: string };
  const [isEditingText, setIsEditingText] = useState(false);
  const [isEditingAuthor, setIsEditingAuthor] = useState(false);

  if (isEditing) {
    return (
      <blockquote className="border-l-4 border-primary-300 pl-6 py-2 my-4 bg-neutral-50 rounded-r-lg">
        <div className="flex gap-2 mb-2">
          <ChatBubbleBottomCenterTextIcon className="h-6 w-6 text-primary-300 flex-shrink-0" />
          {isEditingText ? (
            <textarea
              value={content.text || ""}
              onChange={(e) => updateBlock(block.id, { text: e.target.value })}
              onBlur={() => setIsEditingText(false)}
              autoFocus
              className="flex-1 text-lg italic text-neutral-700 bg-transparent border-none outline-none resize-none min-h-[60px]"
              placeholder="Enter quote text..."
            />
          ) : (
            <p
              className="flex-1 text-lg italic text-neutral-700 cursor-text hover:bg-white/50 rounded px-2 -mx-2 transition-colors"
              onClick={() => setIsEditingText(true)}
            >
              {content.text || "Click to edit quote..."}
            </p>
          )}
        </div>
        {isEditingAuthor ? (
          <input
            type="text"
            value={content.author || ""}
            onChange={(e) => updateBlock(block.id, { author: e.target.value })}
            onBlur={() => setIsEditingAuthor(false)}
            autoFocus
            className="ml-8 text-sm text-neutral-500 bg-transparent border-none outline-none"
            placeholder="— Author name"
          />
        ) : (
          <p
            className="ml-8 text-sm text-neutral-500 cursor-text hover:bg-white/50 rounded px-2 -mx-2 transition-colors inline-block"
            onClick={() => setIsEditingAuthor(true)}
          >
            {content.author ? `— ${content.author}` : "— Click to add author"}
          </p>
        )}
      </blockquote>
    );
  }

  // View mode
  if (!content.text) return null;

  return (
    <blockquote className="border-l-4 border-primary-300 pl-6 py-2 my-4">
      <div className="flex gap-2 mb-2">
        <ChatBubbleBottomCenterTextIcon className="h-6 w-6 text-primary-300 flex-shrink-0" />
        <p className="text-lg italic text-neutral-700">{content.text}</p>
      </div>
      {content.author && (
        <p className="ml-8 text-sm text-neutral-500">— {content.author}</p>
      )}
    </blockquote>
  );
}
