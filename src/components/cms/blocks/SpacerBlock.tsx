"use client";

import { CMSBlock, useCMS } from "@/providers/CMSProvider";

interface SpacerBlockProps {
  block: CMSBlock;
  isEditing: boolean;
}

export function SpacerBlock({ block, isEditing }: SpacerBlockProps) {
  const { updateBlock } = useCMS();
  const content = block.content as { height: number };
  const height = content.height || 32;

  if (isEditing) {
    return (
      <div
        className="relative border border-dashed border-neutral-300 bg-neutral-50 rounded flex items-center justify-center group"
        style={{ height: `${height}px` }}
      >
        <div className="flex items-center gap-3 text-neutral-500">
          <span className="text-xs">Spacer: {height}px</span>
          <select
            value={height}
            onChange={(e) => updateBlock(block.id, { height: parseInt(e.target.value) })}
            className="text-xs border border-neutral-200 rounded px-2 py-1 bg-white"
          >
            <option value="16">16px</option>
            <option value="24">24px</option>
            <option value="32">32px</option>
            <option value="48">48px</option>
            <option value="64">64px</option>
            <option value="96">96px</option>
          </select>
        </div>
      </div>
    );
  }

  // Responsive heights - smaller on mobile (roughly 60% on small screens)
  const mobileHeight = Math.round(height * 0.6);
  return (
    <div
      className="spacer-responsive"
      style={{
        // @ts-expect-error CSS custom property
        "--spacer-mobile": `${mobileHeight}px`,
        "--spacer-desktop": `${height}px`,
        height: `var(--spacer-mobile)`,
      }}
    />
  );
}
