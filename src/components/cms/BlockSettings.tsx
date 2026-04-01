"use client";

import { useState, useEffect } from "react";
import {
  XMarkIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { useCMS, CMSBlock } from "@/providers/CMSProvider";
import { Button } from "@/components/ui/button";

interface BlockSettingsProps {
  block: CMSBlock | null;
  onClose: () => void;
}

export function BlockSettings({ block, onClose }: BlockSettingsProps) {
  const { updateBlock, deleteBlock, duplicateBlock, moveBlock, blocks } = useCMS();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!block) return null;

  const blockIndex = blocks.findIndex((b) => b.id === block.id);
  const canMoveUp = blockIndex > 0;
  const canMoveDown = blockIndex < blocks.length - 1;

  const handleMoveUp = () => {
    if (canMoveUp) {
      moveBlock(blockIndex, blockIndex - 1);
    }
  };

  const handleMoveDown = () => {
    if (canMoveDown) {
      moveBlock(blockIndex, blockIndex + 1);
    }
  };

  const handleDuplicate = () => {
    duplicateBlock(block.id);
    onClose();
  };

  const handleDelete = () => {
    deleteBlock(block.id);
    onClose();
    setShowDeleteConfirm(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Settings Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-modal z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <Cog6ToothIcon className="h-5 w-5 text-neutral-500" />
            <h3 className="font-semibold text-neutral-900">Block Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Block Info */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Block Type
            </label>
            <p className="text-sm text-neutral-600 capitalize">
              {block.type.replace(/([A-Z])/g, " $1").trim()}
            </p>
          </div>

          {/* Position Controls */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Position
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMoveUp}
                disabled={!canMoveUp}
                className="flex-1"
              >
                <ChevronUpIcon className="h-4 w-4 mr-1" />
                Move Up
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMoveDown}
                disabled={!canMoveDown}
                className="flex-1"
              >
                <ChevronDownIcon className="h-4 w-4 mr-1" />
                Move Down
              </Button>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Block {blockIndex + 1} of {blocks.length}
            </p>
          </div>

          {/* CSS Classes (Advanced) */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Custom CSS Classes
            </label>
            <input
              type="text"
              value={(block.content as { className?: string })?.className || ""}
              onChange={(e) =>
                updateBlock(block.id, { className: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
              placeholder="e.g., my-custom-class"
            />
            <p className="text-xs text-neutral-400 mt-1">
              Add custom Tailwind classes
            </p>
          </div>

          {/* Spacing */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Spacing
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-500 mb-1">
                  Top Margin
                </label>
                <select
                  value={(block.content as { marginTop?: string })?.marginTop || "normal"}
                  onChange={(e) =>
                    updateBlock(block.id, { marginTop: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
                >
                  <option value="none">None</option>
                  <option value="small">Small</option>
                  <option value="normal">Normal</option>
                  <option value="large">Large</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">
                  Bottom Margin
                </label>
                <select
                  value={(block.content as { marginBottom?: string })?.marginBottom || "normal"}
                  onChange={(e) =>
                    updateBlock(block.id, { marginBottom: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
                >
                  <option value="none">None</option>
                  <option value="small">Small</option>
                  <option value="normal">Normal</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>
          </div>

          {/* Visibility (future feature) */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Visibility
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={(block.content as { hidden?: boolean })?.hidden !== true}
                onChange={(e) =>
                  updateBlock(block.id, { hidden: !e.target.checked })
                }
                className="rounded"
              />
              Visible on page
            </label>
            <p className="text-xs text-neutral-400 mt-1">
              Hidden blocks won&apos;t appear for regular users
            </p>
          </div>

          {/* Block ID (for developers) */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Block ID
            </label>
            <code className="block text-xs text-neutral-500 bg-neutral-100 p-2 rounded overflow-x-auto">
              {block.id}
            </code>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-4 border-t border-neutral-200 space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleDuplicate}
          >
            <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
            Duplicate Block
          </Button>

          {showDeleteConfirm ? (
            <div className="flex gap-2">
              <Button
                variant="warning"
                className="flex-1 bg-error hover:bg-error-dark"
                onClick={handleDelete}
              >
                Confirm Delete
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start text-error hover:text-error-dark hover:bg-error-light"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete Block
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

// Hook to manage block settings state
export function useBlockSettings() {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const { blocks } = useCMS();

  const selectedBlock = selectedBlockId
    ? blocks.find((b) => b.id === selectedBlockId) || null
    : null;

  const openSettings = (blockId: string) => {
    setSelectedBlockId(blockId);
  };

  const closeSettings = () => {
    setSelectedBlockId(null);
  };

  return {
    selectedBlock,
    openSettings,
    closeSettings,
  };
}
