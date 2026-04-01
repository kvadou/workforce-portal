"use client";

import { useState } from "react";
import { CMSBlock, useCMS } from "@/providers/CMSProvider";
import {
  CalendarDaysIcon,
  MegaphoneIcon,
  BookOpenIcon,
  StarIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

interface SectionHeaderBlockProps {
  block: CMSBlock;
  isEditing: boolean;
}

const SECTION_ICONS = {
  calendar: CalendarDaysIcon,
  megaphone: MegaphoneIcon,
  book: BookOpenIcon,
  star: StarIcon,
  text: DocumentTextIcon,
};

const SECTION_COLORS = {
  primary: "text-primary-600",
  green: "text-accent-green",
  orange: "text-accent-orange",
  cyan: "text-accent-cyan",
  neutral: "text-neutral-700",
};

// Gradient backgrounds for icons
const SECTION_GRADIENTS = {
  primary: "from-error to-accent-pink shadow-error-light/50",
  green: "from-success-light to-success shadow-success-light/50",
  orange: "from-warning-light to-accent-orange shadow-warning-light/50",
  cyan: "from-accent-cyan to-info shadow-accent-cyan-light/50",
  neutral: "from-neutral-500 to-neutral-600 shadow-neutral-200/50",
};

export function SectionHeaderBlock({ block, isEditing }: SectionHeaderBlockProps) {
  const { updateBlock } = useCMS();
  const content = block.content as {
    title: string;
    subtitle?: string;
    icon?: keyof typeof SECTION_ICONS;
    color?: keyof typeof SECTION_COLORS;
    showDivider?: boolean;
    alignment?: "left" | "center" | "right";
    fontSize?: string;
    isBold?: boolean;
    isItalic?: boolean;
  };

  const IconComponent = SECTION_ICONS[content.icon || "text"];
  const colorClass = SECTION_COLORS[content.color || "primary"];
  const alignment = content.alignment || "left";
  const fontSize = content.fontSize || "text-2xl";
  const isBold = content.isBold !== false; // default true
  const isItalic = content.isItalic || false;

  const alignmentClasses: Record<string, string> = {
    left: "text-left justify-start",
    center: "text-center justify-center",
    right: "text-right justify-end",
  };

  const [showOptions, setShowOptions] = useState(false);

  if (isEditing) {
    const gradientClass = SECTION_GRADIENTS[content.color || "primary"];

    return (
      <div id={`section-${block.id}`} className={content.showDivider ? "border-t border-neutral-200 pt-6" : ""}>
        {/* Main editing area - clean and focused */}
        <div className="flex items-start gap-3 group">
          {/* Icon with gradient - clickable to show options */}
          <button
            onClick={() => setShowOptions(!showOptions)}
            className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-sm flex-shrink-0 hover:scale-105 transition-transform`}
            title="Click to change icon & color"
          >
            <IconComponent className="h-5 w-5 text-white" />
          </button>

          <div className="flex-1 min-w-0">
            {/* Title input */}
            <input
              type="text"
              value={content.title || ""}
              onChange={(e) => updateBlock(block.id, { title: e.target.value })}
              placeholder="Section title..."
              className="w-full text-xl font-bold bg-transparent border-b-2 border-transparent hover:border-neutral-200 focus:border-primary-400 focus:outline-none text-neutral-900 placeholder:text-neutral-400"
            />

            {/* Subtitle input - always visible but subtle */}
            <input
              type="text"
              value={content.subtitle || ""}
              onChange={(e) => updateBlock(block.id, { subtitle: e.target.value })}
              placeholder="Add subtitle (optional)..."
              className="w-full text-sm text-neutral-500 bg-transparent border-b border-transparent hover:border-neutral-200 focus:border-neutral-400 focus:outline-none placeholder:text-neutral-400 mt-1"
            />
          </div>

          {/* Quick toggle for divider */}
          <label className="flex items-center gap-1.5 text-xs text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <input
              type="checkbox"
              checked={content.showDivider ?? false}
              onChange={(e) => updateBlock(block.id, { showDivider: e.target.checked })}
              className="rounded h-3 w-3"
            />
            Divider
          </label>
        </div>

        {/* Options panel - hidden by default, shown on icon click */}
        {showOptions && (
          <div className="mt-3 ml-13 p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-3">
            <div className="flex items-center gap-4">
              {/* Icon selector */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-neutral-500 mr-2">Icon:</span>
                {Object.entries(SECTION_ICONS).map(([key, Icon]) => (
                  <button
                    key={key}
                    onClick={() => updateBlock(block.id, { icon: key })}
                    className={`p-1.5 rounded-lg transition-colors ${
                      content.icon === key || (!content.icon && key === "text")
                        ? "bg-white shadow-sm ring-1 ring-neutral-200"
                        : "hover:bg-white"
                    }`}
                  >
                    <Icon className="h-4 w-4 text-neutral-600" />
                  </button>
                ))}
              </div>

              {/* Color selector */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-neutral-500 mr-2">Color:</span>
                {Object.entries(SECTION_GRADIENTS).map(([key, gradient]) => (
                  <button
                    key={key}
                    onClick={() => updateBlock(block.id, { color: key })}
                    className={`h-5 w-5 rounded-full bg-gradient-to-br ${gradient} border-2 transition-transform ${
                      content.color === key || (!content.color && key === "primary")
                        ? "border-neutral-900 scale-110"
                        : "border-transparent hover:scale-110"
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowOptions(false)}
              className="text-xs text-neutral-500 hover:text-neutral-700"
            >
              Done
            </button>
          </div>
        )}
      </div>
    );
  }

  // View mode - enterprise design with gradient icon
  const gradientClass = SECTION_GRADIENTS[content.color || "primary"];

  return (
    <div id={`section-${block.id}`} className={content.showDivider ? "border-t border-neutral-200 pt-6 sm:pt-10" : ""}>
      <div className={`flex items-center gap-3 mb-2 ${alignmentClasses[alignment]}`}>
        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-sm flex-shrink-0`}>
          <IconComponent className="h-5 w-5 text-white" />
        </div>
        <h3 className={`text-xl sm:text-2xl ${isBold ? "font-bold" : "font-normal"} ${isItalic ? "italic" : ""} text-neutral-900`}>
          {content.title}
        </h3>
      </div>
      {content.subtitle && (
        <p className={`text-sm sm:text-base text-neutral-600 mb-4 sm:mb-6 ml-13 ${alignmentClasses[alignment].split(" ")[0]}`}>{content.subtitle}</p>
      )}
    </div>
  );
}
