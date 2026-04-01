"use client";

import { useState, useMemo } from "react";
import * as LucideIcons from "lucide-react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

// Common icons used in onboarding
const COMMON_ICONS = [
  "Star",
  "PlayCircle",
  "Brain",
  "User",
  "FileText",
  "Calendar",
  "GraduationCap",
  "Flame",
  "Zap",
  "Target",
  "Trophy",
  "CheckCircle",
  "HelpCircle",
  "Award",
  "Heart",
  "BookOpen",
  "Clock",
  "Video",
  "MessageCircle",
  "Users",
  "Settings",
  "Lock",
  "Unlock",
  "Shield",
  "Gift",
  "Sparkles",
  "Medal",
  "Crown",
  "Rocket",
  "ThumbsUp",
  "PartyPopper",
  "Gamepad2",
  "Puzzle",
  "Lightbulb",
  "Mic",
  "Camera",
  "Image",
  "Map",
  "Compass",
  "Flag",
];

// Get all Lucide icon names (excluding non-icon exports)
const ALL_ICON_NAMES = Object.keys(LucideIcons).filter(
  (key) =>
    key !== "default" &&
    key !== "createLucideIcon" &&
    key !== "icons" &&
    typeof (LucideIcons as Record<string, unknown>)[key] === "function" &&
    key[0] === key[0].toUpperCase()
);

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  label?: string;
}

export function IconPicker({ value, onChange, label }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredIcons = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) {
      return COMMON_ICONS;
    }
    return ALL_ICON_NAMES.filter((name) => name.toLowerCase().includes(query));
  }, [searchQuery]);

  const SelectedIcon = value
    ? (LucideIcons[value as keyof typeof LucideIcons] as React.ComponentType<{
        className?: string;
      }>)
    : null;

  const renderIcon = (iconName: string) => {
    const Icon = LucideIcons[
      iconName as keyof typeof LucideIcons
    ] as React.ComponentType<{ className?: string }>;
    if (!Icon) return null;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-2 border border-neutral-300 rounded-lg hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 bg-white"
      >
        {SelectedIcon && (
          <div className="h-8 w-8 bg-neutral-100 rounded-lg flex items-center justify-center">
            <SelectedIcon className="h-5 w-5 text-neutral-700" />
          </div>
        )}
        <span className="flex-1 text-left text-neutral-900">
          {value || "Select an icon"}
        </span>
        <MagnifyingGlassIcon className="h-4 w-4 text-neutral-400" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-dropdown border border-neutral-200 overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-neutral-100">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search icons..."
                  className="w-full pl-10 pr-10 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Icons Grid */}
            <div className="max-h-64 overflow-y-auto p-3">
              <div className="grid grid-cols-6 gap-2">
                {filteredIcons.slice(0, 48).map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => {
                      onChange(iconName);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
                      value === iconName
                        ? "bg-primary-100 text-primary-600 ring-2 ring-primary-500"
                        : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
                    }`}
                    title={iconName}
                  >
                    {renderIcon(iconName)}
                  </button>
                ))}
              </div>
              {filteredIcons.length > 48 && (
                <p className="text-xs text-neutral-500 text-center mt-3">
                  +{filteredIcons.length - 48} more icons. Refine your search.
                </p>
              )}
              {filteredIcons.length === 0 && (
                <p className="text-sm text-neutral-500 text-center py-4">
                  No icons found for "{searchQuery}"
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
