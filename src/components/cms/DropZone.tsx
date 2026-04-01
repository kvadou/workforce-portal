"use client";

import { useDroppable } from "@dnd-kit/core";
import { useCMS } from "@/providers/CMSProvider";
import { PlusIcon } from "@heroicons/react/24/outline";

interface DropZoneProps {
  id: string;
  index?: number;
  children?: React.ReactNode;
  className?: string;
  placeholder?: string;
}

export function DropZone({
  id,
  index,
  children,
  className = "",
  placeholder = "Drop components here or click + to add",
}: DropZoneProps) {
  const { editMode, isAdmin, blocks, setComponentPanelOpen } = useCMS();
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { index },
  });

  const showEditUI = isAdmin && editMode;
  const isEmpty = !children && blocks.length === 0;

  return (
    <div
      ref={setNodeRef}
      className={`
        relative min-h-[100px] transition-all duration-200
        ${showEditUI ? "border-2 border-dashed rounded-lg" : ""}
        ${isOver && showEditUI ? "border-primary-400 bg-primary-50" : ""}
        ${showEditUI && !isOver ? "border-neutral-300" : ""}
        ${className}
      `}
    >
      {/* Drop indicator when dragging over */}
      {isOver && showEditUI && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary-100/50 rounded-lg z-10 pointer-events-none">
          <div className="px-4 py-2 bg-primary-500 text-white rounded-full text-sm font-medium shadow-sm">
            Drop here
          </div>
        </div>
      )}

      {/* Content */}
      {children}

      {/* Empty state */}
      {isEmpty && showEditUI && (
        <button
          onClick={() => setComponentPanelOpen(true)}
          className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 hover:text-primary-500 hover:bg-primary-50 transition-colors rounded-lg"
        >
          <PlusIcon className="h-8 w-8 mb-2" />
          <span className="text-sm">{placeholder}</span>
        </button>
      )}
    </div>
  );
}

// Inline drop indicator between blocks
interface DropIndicatorProps {
  id: string;
  index: number;
}

export function DropIndicator({ id, index }: DropIndicatorProps) {
  const { editMode, isAdmin } = useCMS();
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { index, isIndicator: true },
  });

  if (!isAdmin || !editMode) return null;

  return (
    <div
      ref={setNodeRef}
      className={`
        h-2 my-1 rounded transition-all duration-200
        ${isOver ? "bg-primary-400 h-4" : "bg-transparent hover:bg-neutral-200"}
      `}
    />
  );
}
