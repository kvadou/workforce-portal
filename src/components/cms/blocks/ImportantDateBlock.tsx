"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CMSBlock, useCMS } from "@/providers/CMSProvider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  CalendarDaysIcon,
  TrashIcon,
  Bars3Icon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

interface ImportantDateBlockProps {
  block: CMSBlock;
  isEditing: boolean;
}

export function ImportantDateBlock({ block, isEditing }: ImportantDateBlockProps) {
  const { updateBlock, deleteBlock } = useCMS();
  const { attributes, listeners } = useSortable({ id: block.id });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const content = block.content as {
    title: string;
    description?: string;
    date?: string;
  };

  if (isEditing) {
    return (
      <div className="flex items-start gap-3 p-3 bg-white hover:bg-error-light/30 transition-colors group">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 rounded hover:bg-error-light text-neutral-300 hover:text-neutral-500 cursor-grab active:cursor-grabbing flex-shrink-0 mt-1"
          title="Drag to reorder"
        >
          <Bars3Icon className="h-4 w-4" />
        </button>

        {/* Compact icon */}
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-error to-accent-pink flex items-center justify-center flex-shrink-0 shadow-sm">
          <CalendarDaysIcon className="h-4 w-4 text-white" />
        </div>

        {/* Content - more compact */}
        <div className="flex-1 min-w-0 space-y-1">
          <input
            type="text"
            value={content.title || ""}
            onChange={(e) => updateBlock(block.id, { title: e.target.value })}
            placeholder="Date title..."
            className="w-full font-semibold bg-transparent border-b border-transparent hover:border-neutral-200 focus:border-error focus:outline-none text-neutral-900 placeholder:text-neutral-400"
          />
          <input
            type="text"
            value={content.description || ""}
            onChange={(e) => updateBlock(block.id, { description: e.target.value })}
            placeholder="Description..."
            className="w-full text-sm bg-transparent border-b border-transparent hover:border-neutral-200 focus:border-error focus:outline-none text-neutral-600 placeholder:text-neutral-400"
          />
        </div>

        {/* Date picker */}
        <input
          type="date"
          value={content.date || ""}
          onChange={(e) => updateBlock(block.id, { date: e.target.value })}
          className="text-xs bg-neutral-50 border border-neutral-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-error"
        />

        {/* Delete button - visible on hover */}
        <button
          onClick={() => setDeleteConfirmOpen(true)}
          className="p-2 rounded-lg bg-neutral-100 hover:bg-error-light text-neutral-400 hover:text-error opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
          title="Delete this date"
        >
          <TrashIcon className="h-4 w-4" />
        </button>

        <ConfirmDialog
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={() => deleteBlock(block.id)}
          title="Delete Date"
          message="Delete this important date?"
          variant="danger"
          confirmLabel="Delete"
        />
      </div>
    );
  }

  // View mode - Timeline style with animated indicator
  return (
    <div className="flex items-start gap-5 px-6 py-5 hover:bg-gradient-to-r hover:from-error-light/50 hover:to-transparent transition-all duration-300 group important-date-item">
      {/* Timeline dot with pulse effect */}
      <div className="flex flex-col items-center pt-1 flex-shrink-0">
        <div className="relative">
          <div className="h-4 w-4 rounded-full bg-gradient-to-br from-error to-accent-pink shadow-sm shadow-error-light group-hover:scale-125 transition-transform" />
          <div className="absolute inset-0 rounded-full bg-error animate-ping opacity-20" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-lg font-bold text-neutral-900 group-hover:text-error transition-colors">
          {content.title}
        </h4>
        {content.description && (
          <p className="text-neutral-600 mt-1 leading-relaxed">
            {content.description}
          </p>
        )}
      </div>

      {/* Arrow */}
      <ChevronRightIcon className="h-5 w-5 text-error group-hover:text-error group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
    </div>
  );
}
