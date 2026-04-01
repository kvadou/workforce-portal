"use client";

import { CMSBlock, useCMS } from "@/providers/CMSProvider";
import { sanitizeHtml } from "@/lib/sanitize";

interface ColumnsBlockProps {
  block: CMSBlock;
  isEditing: boolean;
}

export function ColumnsBlock({ block, isEditing }: ColumnsBlockProps) {
  const { updateBlock } = useCMS();
  const content = block.content as {
    columns: 2 | 3 | 4;
    blocks: string[][]; // For now, just store HTML content in each column
    columnContent: string[];
  };

  const columns = content.columns || 2;
  const columnContent = content.columnContent || Array(columns).fill("");

  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  const handleColumnChange = (index: number, value: string) => {
    const newContent = [...columnContent];
    newContent[index] = value;
    updateBlock(block.id, { columnContent: newContent });
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        {/* Column selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">Columns:</span>
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => {
                const newColumnContent = [...columnContent];
                while (newColumnContent.length < n) {
                  newColumnContent.push("");
                }
                updateBlock(block.id, {
                  columns: n,
                  columnContent: newColumnContent.slice(0, n),
                });
              }}
              className={`px-3 py-1 text-sm rounded ${
                columns === n
                  ? "bg-primary-500 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Column editors */}
        <div className={`grid ${gridCols[columns]} gap-4`}>
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className="border border-neutral-200 rounded-lg p-4">
              <div className="text-xs text-neutral-400 mb-2">
                Column {index + 1}
              </div>
              <textarea
                value={columnContent[index] || ""}
                onChange={(e) => handleColumnChange(index, e.target.value)}
                placeholder="Enter content for this column..."
                className="w-full min-h-[100px] p-2 text-sm border border-neutral-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-300 resize-y"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // View mode
  const hasContent = columnContent.some((c) => c && c.trim());
  if (!hasContent) return null;

  return (
    <div className={`grid ${gridCols[columns]} gap-6 my-6`}>
      {columnContent.slice(0, columns).map((html, index) => (
        <div
          key={index}
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(html || "") }}
        />
      ))}
    </div>
  );
}
