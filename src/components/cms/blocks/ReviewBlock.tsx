"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CMSBlock, useCMS } from "@/providers/CMSProvider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StarIcon, TrashIcon, Bars3Icon } from "@heroicons/react/24/outline";

interface ReviewBlockProps {
  block: CMSBlock;
  isEditing: boolean;
}

// Colorful gradient palettes for reviews
const reviewGradients = [
  { bg: 'from-primary-500 to-primary-600', light: 'from-primary-50 to-primary-50', border: 'border-primary-100', shadow: 'shadow-primary-100/50' },
  { bg: 'from-info to-accent-cyan', light: 'from-info-light to-accent-cyan-light', border: 'border-info', shadow: 'shadow-info-light/50' },
  { bg: 'from-success-light to-success', light: 'from-success-light to-success-light', border: 'border-success', shadow: 'shadow-success-light/50' },
  { bg: 'from-error to-accent-pink', light: 'from-error-light to-accent-pink-light', border: 'border-error', shadow: 'shadow-error-light/50' },
  { bg: 'from-warning-light to-accent-orange', light: 'from-warning-light to-accent-orange-light', border: 'border-warning', shadow: 'shadow-warning-light/50' },
];

export function ReviewBlock({ block, isEditing }: ReviewBlockProps) {
  const { updateBlock, deleteBlock } = useCMS();
  const { attributes, listeners } = useSortable({ id: block.id });
  const content = block.content as {
    quote: string;
    author: string;
    rating?: number;
  };

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const rating = content.rating ?? 5;

  // Get color based on block id for consistent coloring
  const colorIndex = block.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % reviewGradients.length;
  const colors = reviewGradients[colorIndex];

  if (isEditing) {
    return (
      <div className={`relative bg-gradient-to-br ${colors.light} rounded-2xl p-6 border ${colors.border} border-dashed shadow-sm ${colors.shadow} group overflow-hidden`}>
        {/* Drag handle - top left */}
        <button
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 p-1.5 rounded hover:bg-white/50 text-neutral-400 hover:text-neutral-600 cursor-grab active:cursor-grabbing z-10"
          title="Drag to reorder"
        >
          <Bars3Icon className="h-4 w-4" />
        </button>

        {/* Delete button - top right */}
        <button
          onClick={() => setDeleteConfirmOpen(true)}
          className="absolute top-2 right-2 p-1.5 rounded hover:bg-error-light text-neutral-400 hover:text-error z-10"
          title="Delete this review"
        >
          <TrashIcon className="h-4 w-4" />
        </button>

        <ConfirmDialog
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={() => deleteBlock(block.id)}
          title="Delete Review"
          message="Delete this review?"
          variant="danger"
          confirmLabel="Delete"
        />

        {/* Large decorative quote */}
        <div className="absolute -top-4 -left-2 text-[100px] font-serif text-neutral-900/5 leading-none select-none pointer-events-none">
          &ldquo;
        </div>

        <div className="relative pt-4">
          {/* Editable rating */}
          <div className="flex items-center gap-0.5 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => updateBlock(block.id, { rating: star })}
                className="focus:outline-none"
              >
                <StarIcon
                  className={`h-4 w-4 transition-colors drop-shadow-sm ${
                    star <= rating
                      ? "fill-amber-400 text-warning"
                      : "fill-neutral-200 text-neutral-200 hover:fill-amber-300 hover:text-warning"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Editable quote */}
          <textarea
            value={content.quote || ""}
            onChange={(e) => updateBlock(block.id, { quote: e.target.value })}
            placeholder="What did they say about their experience?"
            rows={3}
            className="w-full bg-transparent text-neutral-700 font-medium leading-relaxed border border-dashed border-neutral-300/50 hover:border-neutral-400/50 focus:border-neutral-500/50 focus:outline-none rounded-lg p-2 resize-none mb-5"
          />

          {/* Author section */}
          <div className="flex items-center gap-3 pt-4 border-t border-neutral-200/50">
            <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${colors.bg} flex items-center justify-center shadow-sm`}>
              <span className="text-white text-sm font-bold">
                {content.author?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={content.author || ""}
                onChange={(e) => updateBlock(block.id, { author: e.target.value })}
                placeholder="Author name..."
                className="w-full font-bold text-neutral-900 text-sm bg-transparent border-b border-dashed border-neutral-300/50 hover:border-neutral-400/50 focus:border-neutral-500/50 focus:outline-none"
              />
              <p className="text-xs text-neutral-500">{rating}-Star Review</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // View mode - Colorful gradient cards
  return (
    <div className={`relative bg-gradient-to-br ${colors.light} rounded-2xl p-6 border ${colors.border} shadow-sm ${colors.shadow} group hover:shadow-card-hover hover:scale-[1.02] transition-all duration-300 overflow-hidden`}>
      {/* Large decorative quote */}
      <div className="absolute -top-4 -left-2 text-[100px] font-serif text-neutral-900/5 leading-none select-none pointer-events-none">
        &ldquo;
      </div>

      <div className="relative">
        {/* Stars */}
        <div className="flex items-center gap-0.5 mb-4">
          {[...Array(rating)].map((_, i) => (
            <StarIcon key={i} className="h-4 w-4 fill-amber-400 text-warning drop-shadow-sm" />
          ))}
          {[...Array(5 - rating)].map((_, i) => (
            <StarIcon key={`empty-${i}`} className="h-4 w-4 fill-neutral-200 text-neutral-200" />
          ))}
        </div>

        {/* Quote */}
        <blockquote className="text-neutral-700 font-medium leading-relaxed mb-5 line-clamp-4">
          &ldquo;{content.quote}&rdquo;
        </blockquote>

        {/* Author */}
        <div className="flex items-center gap-3 pt-4 border-t border-neutral-200/50">
          <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${colors.bg} flex items-center justify-center shadow-sm`}>
            <span className="text-white text-sm font-bold">
              {content.author?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
          <div>
            <p className="font-bold text-neutral-900 text-sm">{content.author}</p>
            <p className="text-xs text-neutral-500">{rating}-Star Review</p>
          </div>
        </div>
      </div>
    </div>
  );
}
