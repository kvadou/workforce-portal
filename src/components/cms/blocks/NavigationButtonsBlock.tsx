"use client";

import { useState } from "react";
import { CMSBlock, useCMS } from "@/providers/CMSProvider";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

interface NavButton {
  id: string;
  label: string;
  targetId: string;
  color: string;
}

interface NavigationButtonsBlockProps {
  block: CMSBlock;
  isEditing: boolean;
}

const COLOR_OPTIONS = [
  { value: "primary", label: "Purple", class: "bg-primary-500 hover:bg-primary-600" },
  { value: "green", label: "Green", class: "bg-accent-green hover:bg-accent-green/90" },
  { value: "orange", label: "Orange", class: "bg-accent-orange hover:bg-accent-orange/90" },
  { value: "cyan", label: "Cyan", class: "bg-accent-cyan hover:bg-accent-cyan/90" },
  { value: "neutral", label: "Gray", class: "bg-neutral-500 hover:bg-neutral-600" },
];

const getColorClass = (color: string) => {
  const option = COLOR_OPTIONS.find((c) => c.value === color);
  return option?.class || COLOR_OPTIONS[0].class;
};

export function NavigationButtonsBlock({ block, isEditing }: NavigationButtonsBlockProps) {
  const { updateBlock, blocks } = useCMS();
  const content = block.content as {
    buttons?: NavButton[];
    alignment?: "left" | "center" | "right";
    spacing?: "compact" | "normal" | "wide";
  };

  const buttons = content.buttons || [];
  const alignment = content.alignment || "center";
  const spacing = content.spacing || "normal";

  // Get all section headers for target selection
  const sectionHeaders = blocks.filter((b) => b.type === "sectionHeader");

  const generateId = () => `btn-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  const addButton = () => {
    const newButton: NavButton = {
      id: generateId(),
      label: "New Button",
      targetId: "",
      color: "primary",
    };
    updateBlock(block.id, { buttons: [...buttons, newButton] });
  };

  const updateButton = (buttonId: string, updates: Partial<NavButton>) => {
    const updated = buttons.map((btn) =>
      btn.id === buttonId ? { ...btn, ...updates } : btn
    );
    updateBlock(block.id, { buttons: updated });
  };

  const deleteButton = (buttonId: string) => {
    updateBlock(block.id, { buttons: buttons.filter((btn) => btn.id !== buttonId) });
  };

  const scrollToSection = (targetId: string) => {
    if (!targetId) return;
    const element = document.getElementById(`section-${targetId}`);
    if (element) {
      // Account for fixed header (~70px) plus breathing room for section visibility
      const headerOffset = 130;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const alignmentClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  };

  const spacingClasses = {
    compact: "gap-2",
    normal: "gap-3",
    wide: "gap-4",
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        {/* Live preview of buttons - exactly matching view mode */}
        {buttons.length > 0 && (
          <div className={`grid grid-cols-2 sm:flex sm:flex-wrap ${alignmentClasses[alignment]} gap-2 sm:${spacingClasses[spacing]} py-2`}>
            {buttons.map((btn) => (
              <div
                key={btn.id}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-white font-medium text-sm text-center ${getColorClass(btn.color).split(' ')[0]}`}
              >
                {btn.label || "Button"}
              </div>
            ))}
          </div>
        )}

        {/* Edit controls below the preview */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3">
          {/* Compact header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Quick Navigation Buttons</span>
            <button
              onClick={addButton}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <PlusIcon className="h-3 w-3" />
              Add
            </button>
          </div>

          {/* Compact button list */}
          <div className="space-y-2">
            {buttons.map((btn) => (
              <div
                key={btn.id}
                className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg group"
              >
                {/* Color indicator */}
                <div className={`h-3 w-3 rounded-full flex-shrink-0 ${getColorClass(btn.color).split(' ')[0]}`} />

                {/* Label input - inline */}
                <input
                  type="text"
                  value={btn.label}
                  onChange={(e) => updateButton(btn.id, { label: e.target.value })}
                  placeholder="Label"
                  className="flex-1 min-w-0 px-2 py-1 text-sm font-medium bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-primary-400 focus:outline-none"
                />

                {/* Target selector - compact */}
                <select
                  value={btn.targetId}
                  onChange={(e) => updateButton(btn.id, { targetId: e.target.value })}
                  className="px-2 py-1 text-xs text-neutral-600 bg-white border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-300 max-w-[140px]"
                >
                  <option value="">→ Section</option>
                  {sectionHeaders.map((section) => {
                    const sectionContent = section.content as { title?: string };
                    return (
                      <option key={section.id} value={section.id}>
                        {sectionContent.title || "Untitled"}
                      </option>
                    );
                  })}
                </select>

                {/* Color picker - on hover */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => updateButton(btn.id, { color: color.value })}
                      className={`h-4 w-4 rounded-full border transition-transform ${
                        btn.color === color.value
                          ? "border-neutral-900 scale-110"
                          : "border-transparent hover:scale-110"
                      } ${color.class}`}
                      title={color.label}
                    />
                  ))}
                </div>

                {/* Delete - on hover */}
                <button
                  onClick={() => deleteButton(btn.id)}
                  className="p-1 text-neutral-300 hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {buttons.length === 0 && (
              <div className="text-center py-4 text-sm text-neutral-400">
                No navigation buttons yet
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // View mode
  if (buttons.length === 0) return null;

  // Use grid on mobile for consistent 2x2 layout, flex on larger screens
  return (
    <div className={`grid grid-cols-2 sm:flex sm:flex-wrap ${alignmentClasses[alignment]} gap-2 sm:${spacingClasses[spacing]} py-2`}>
      {buttons.map((btn) => (
        <button
          key={btn.id}
          onClick={() => scrollToSection(btn.targetId)}
          className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-white font-medium text-sm transition-colors ${getColorClass(btn.color)}`}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
