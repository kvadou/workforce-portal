"use client";

import { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Bars3Icon } from "@heroicons/react/24/outline";

interface DraggableItemProps {
  id: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function DraggableItem({
  id,
  children,
  disabled = false,
  className = "",
}: DraggableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 ${isDragging ? "opacity-50" : ""} ${className}`}
    >
      {!disabled && (
        <button
          type="button"
          className="flex-shrink-0 p-1 text-neutral-400 hover:text-neutral-600 cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <Bars3Icon className="h-5 w-5" />
        </button>
      )}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

export default DraggableItem;
