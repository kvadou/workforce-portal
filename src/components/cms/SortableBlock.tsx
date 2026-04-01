"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCMS, CMSBlock } from "@/providers/CMSProvider";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Bars3Icon,
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

interface SortableBlockProps {
  block: CMSBlock;
  children: React.ReactNode;
}

export function SortableBlock({ block, children }: SortableBlockProps) {
  const {
    editMode,
    isAdmin,
    deleteBlock,
    duplicateBlock,
    setSelectedBlockId,
    setSettingsPanelOpen,
    selectedBlockId,
  } = useCMS();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
    data: {
      type: "block",
      block,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const showEditUI = isAdmin && editMode;
  const isSelected = selectedBlockId === block.id;

  const handleSettingsClick = () => {
    setSelectedBlockId(block.id);
    setSettingsPanelOpen(true);
  };

  if (!showEditUI) {
    // View mode - just render the content
    return <div className="cms-block">{children}</div>;
  }

  // Edit mode - render with controls
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative group cms-block
        ${isDragging ? "z-50" : ""}
        ${isSelected ? "ring-2 ring-primary-400 ring-offset-2" : ""}
      `}
    >
      {/* Hover controls */}
      <div
        className={`
          absolute -left-12 top-0 bottom-0 w-10 flex flex-col items-center justify-start pt-2 gap-1
          opacity-0 group-hover:opacity-100 transition-opacity
          ${isSelected ? "opacity-100" : ""}
        `}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="h-8 w-8 flex items-center justify-center rounded hover:bg-neutral-100 cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600"
          title="Drag to reorder"
        >
          <Bars3Icon className="h-4 w-4" />
        </button>

        {/* Settings */}
        <button
          onClick={handleSettingsClick}
          className="h-8 w-8 flex items-center justify-center rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600"
          title="Block settings"
        >
          <Cog6ToothIcon className="h-4 w-4" />
        </button>

        {/* Duplicate */}
        <button
          onClick={() => duplicateBlock(block.id)}
          className="h-8 w-8 flex items-center justify-center rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600"
          title="Duplicate block"
        >
          <DocumentDuplicateIcon className="h-4 w-4" />
        </button>

        {/* Delete */}
        <button
          onClick={() => setDeleteConfirmOpen(true)}
          className="h-8 w-8 flex items-center justify-center rounded hover:bg-error-light text-neutral-400 hover:text-error"
          title="Delete block"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => deleteBlock(block.id)}
        title="Delete Block"
        message="Are you sure you want to delete this block?"
        variant="danger"
        confirmLabel="Delete"
      />

      {/* Block content */}
      <div
        className={`
          border-2 border-transparent rounded-lg transition-colors
          ${isSelected ? "border-primary-200 bg-primary-50/30" : ""}
          group-hover:border-neutral-200 group-hover:bg-neutral-50/50
        `}
        onClick={() => setSelectedBlockId(block.id)}
      >
        {children}
      </div>

      {/* Block type indicator */}
      <div
        className={`
          absolute -top-2 left-2 px-2 py-0.5 bg-neutral-100 text-neutral-500 text-xs rounded
          opacity-0 group-hover:opacity-100 transition-opacity
          ${isSelected ? "opacity-100 bg-primary-100 text-primary-600" : ""}
        `}
      >
        {block.type}
      </div>
    </div>
  );
}
