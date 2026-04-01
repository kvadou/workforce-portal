"use client";

import { useCallback } from "react";
import dynamic from "next/dynamic";
import { CMSBlock, useCMS } from "@/providers/CMSProvider";
import { sanitizeHtml } from "@/lib/sanitize";

// Dynamic import for BlockNote to avoid SSR issues
const BlockEditor = dynamic(
  () => import("@/components/editor/BlockEditor").then((mod) => mod.BlockEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[100px] bg-neutral-50 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-neutral-400">Loading editor...</span>
      </div>
    ),
  }
);

interface RichTextBlockProps {
  block: CMSBlock;
  isEditing: boolean;
}

export function RichTextBlock({ block, isEditing }: RichTextBlockProps) {
  const { updateBlock } = useCMS();
  const content = block.content as { html: string };

  const handleChange = useCallback(
    (jsonContent: string, htmlContent: string) => {
      updateBlock(block.id, { html: htmlContent });
    },
    [block.id, updateBlock]
  );

  if (isEditing) {
    return (
      <div className="p-4">
        <BlockEditor
          initialContent={content.html || ""}
          onChange={handleChange}
          placeholder="Start typing your content..."
        />
      </div>
    );
  }

  // View mode
  if (!content.html || content.html === "<p></p>") {
    return null;
  }

  return (
    <div
      className="prose prose-neutral max-w-none
        prose-headings:text-neutral-900
        prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4
        prose-h2:text-xl prose-h2:font-semibold prose-h2:mb-3 prose-h2:mt-6
        prose-h3:text-lg prose-h3:font-medium prose-h3:mb-2
        prose-p:text-neutral-700 prose-p:leading-relaxed prose-p:mb-4
        prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
        prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
        prose-li:text-neutral-700 prose-li:mb-1
        prose-a:text-primary-600 prose-a:hover:text-primary-700 prose-a:underline
        prose-strong:text-neutral-900
        prose-img:rounded-lg prose-img:shadow-sm prose-img:my-6"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.html) }}
    />
  );
}
