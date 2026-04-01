"use client";

import { useState } from "react";
import { CMSBlock, useCMS } from "@/providers/CMSProvider";
import { PhotoIcon, TrashIcon } from "@heroicons/react/24/outline";
import { CanvaEmbed } from "@/components/content/CanvaEmbed";
import { CanvaDesignPicker } from "@/components/admin/CanvaDesignPicker";

interface CanvaEmbedBlockProps {
  block: CMSBlock;
  isEditing: boolean;
}

export function CanvaEmbedBlock({ block, isEditing }: CanvaEmbedBlockProps) {
  const { updateBlock } = useCMS();
  const content = block.content as {
    url: string;
    designId?: string;
    title?: string;
    height?: string;
  };

  const [pickerOpen, setPickerOpen] = useState(false);

  if (isEditing) {
    return (
      <div className="border border-neutral-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <PhotoIcon className="h-5 w-5 text-primary-500" />
          <span className="font-medium">Canva Embed</span>
        </div>

        {!content.url ? (
          <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center">
            <PhotoIcon className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
            <p className="text-neutral-600 mb-3">
              Select a Canva design to embed
            </p>
            <button
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Select from Canva
            </button>
          </div>
        ) : (
          <>
            {/* Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-500 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={content.title || ""}
                  onChange={(e) =>
                    updateBlock(block.id, { title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
                  placeholder="Design Title"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-500 mb-1">
                  Height
                </label>
                <input
                  type="text"
                  value={content.height || ""}
                  onChange={(e) =>
                    updateBlock(block.id, { height: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
                  placeholder="e.g., 800px"
                />
              </div>
            </div>

            {/* URL input for manual fallback */}
            <div>
              <label className="block text-sm text-neutral-500 mb-1">
                Canva Embed URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={content.url}
                  onChange={(e) =>
                    updateBlock(block.id, { url: e.target.value })
                  }
                  className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
                  placeholder="https://www.canva.com/design/..."
                />
                <button
                  onClick={() => setPickerOpen(true)}
                  className="px-3 py-2 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors whitespace-nowrap"
                >
                  Change Design
                </button>
                <button
                  onClick={() =>
                    updateBlock(block.id, {
                      url: "",
                      designId: "",
                      title: "",
                      height: "",
                    })
                  }
                  className="p-2 text-error hover:bg-error-light rounded-lg"
                  title="Remove Design"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-neutral-50 rounded-lg p-4">
              <p className="text-sm text-neutral-500 mb-2">Preview:</p>
              <CanvaEmbed
                url={content.url}
                designId={content.designId}
                title={content.title}
                height={content.height || "400px"}
              />
            </div>
          </>
        )}

        <CanvaDesignPicker
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(design) => {
            updateBlock(block.id, {
              url: design.embedUrl,
              designId: design.id,
              title: content.title || design.title,
            });
            setPickerOpen(false);
          }}
          selectedId={content.designId}
        />
      </div>
    );
  }

  // View mode
  if (!content.url) return null;

  return (
    <div className="my-6">
      <CanvaEmbed
        url={content.url}
        designId={content.designId}
        title={content.title}
        height={content.height}
      />
    </div>
  );
}
