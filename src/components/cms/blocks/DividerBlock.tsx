"use client";

import { CMSBlock, useCMS } from "@/providers/CMSProvider";

interface DividerBlockProps {
  block: CMSBlock;
  isEditing: boolean;
}

export function DividerBlock({ block, isEditing }: DividerBlockProps) {
  const { updateBlock } = useCMS();
  const content = block.content as { style: string };
  const style = content.style || "solid";

  const dividerStyles: Record<string, string> = {
    solid: "border-neutral-200",
    dashed: "border-dashed border-neutral-300",
    dotted: "border-dotted border-neutral-300",
    thick: "border-2 border-neutral-200",
    gradient: "bg-gradient-to-r from-transparent via-neutral-300 to-transparent h-px border-0",
  };

  if (isEditing) {
    return (
      <div className="py-4">
        <div className="flex items-center gap-4 mb-2">
          <span className="text-xs text-neutral-500">Divider Style:</span>
          <select
            value={style}
            onChange={(e) => updateBlock(block.id, { style: e.target.value })}
            className="text-xs border border-neutral-200 rounded px-2 py-1 bg-white"
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
            <option value="thick">Thick</option>
            <option value="gradient">Gradient</option>
          </select>
        </div>
        {style === "gradient" ? (
          <div className={dividerStyles[style]} />
        ) : (
          <hr className={`border-t ${dividerStyles[style]}`} />
        )}
      </div>
    );
  }

  return (
    <div className="py-4">
      {style === "gradient" ? (
        <div className={dividerStyles[style]} />
      ) : (
        <hr className={`border-t ${dividerStyles[style]}`} />
      )}
    </div>
  );
}
