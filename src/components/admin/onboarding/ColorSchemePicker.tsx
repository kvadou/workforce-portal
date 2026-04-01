"use client";

import { useState } from "react";
import { CheckIcon, SwatchIcon } from "@heroicons/react/24/outline";

// Predefined color schemes that work well together
const COLOR_SCHEMES = [
  {
    name: "Amber",
    color: "text-warning",
    bgColor: "bg-warning-light",
    borderColor: "border-warning",
  },
  {
    name: "Purple",
    color: "text-primary-600",
    bgColor: "bg-primary-50",
    borderColor: "border-primary-200",
  },
  {
    name: "Blue",
    color: "text-info",
    bgColor: "bg-info-light",
    borderColor: "border-info",
  },
  {
    name: "Green",
    color: "text-success",
    bgColor: "bg-success-light",
    borderColor: "border-success",
  },
  {
    name: "Cyan",
    color: "text-accent-cyan",
    bgColor: "bg-accent-cyan-light",
    borderColor: "border-accent-cyan-light",
  },
  {
    name: "Pink",
    color: "text-accent-pink",
    bgColor: "bg-accent-pink-light",
    borderColor: "border-accent-pink",
  },
  {
    name: "Indigo",
    color: "text-accent-navy",
    bgColor: "bg-accent-navy-light",
    borderColor: "border-accent-navy",
  },
  {
    name: "Orange",
    color: "text-accent-orange",
    bgColor: "bg-accent-orange-light",
    borderColor: "border-accent-orange",
  },
  {
    name: "Yellow",
    color: "text-warning",
    bgColor: "bg-warning-light",
    borderColor: "border-warning",
  },
  {
    name: "Red",
    color: "text-error",
    bgColor: "bg-error-light",
    borderColor: "border-error",
  },
  {
    name: "Emerald",
    color: "text-success",
    bgColor: "bg-success-light",
    borderColor: "border-success",
  },
  {
    name: "Teal",
    color: "text-success",
    bgColor: "bg-success-light",
    borderColor: "border-success",
  },
];

// Additional step colors for journey
export const STEP_COLORS = [
  "purple",
  "blue",
  "green",
  "cyan",
  "pink",
  "indigo",
  "amber",
  "orange",
  "red",
  "emerald",
  "teal",
  "yellow",
];

export type ColorScheme = {
  color: string;
  bgColor: string;
  borderColor: string;
};

interface ColorSchemePickerProps {
  value: ColorScheme | string;
  onChange: (scheme: ColorScheme) => void;
  label?: string;
}

export function ColorSchemePicker({
  value,
  onChange,
  label,
}: ColorSchemePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse value if it's a string
  const currentScheme: ColorScheme =
    typeof value === "string"
      ? JSON.parse(value)
      : value || COLOR_SCHEMES[0];

  const isSelectedScheme = (scheme: ColorScheme) => {
    return (
      scheme.color === currentScheme.color &&
      scheme.bgColor === currentScheme.bgColor
    );
  };

  // Get preview color for the button (extract the color name from the class)
  const getPreviewColor = (scheme: ColorScheme) => {
    const colorMatch = scheme.color.match(/text-(\w+)-/);
    if (!colorMatch) return "gray";
    return colorMatch[1];
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
        <div
          className={`h-8 w-8 rounded-lg flex items-center justify-center ${currentScheme.bgColor} ${currentScheme.borderColor} border-2`}
        >
          <div
            className={`h-4 w-4 rounded ${currentScheme.color.replace("text-", "bg-")}`}
          />
        </div>
        <span className="flex-1 text-left text-neutral-900 capitalize">
          {getPreviewColor(currentScheme)}
        </span>
        <SwatchIcon className="h-4 w-4 text-neutral-400" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-dropdown border border-neutral-200 p-3">
            <div className="grid grid-cols-4 gap-2">
              {COLOR_SCHEMES.map((scheme) => (
                <button
                  key={scheme.name}
                  type="button"
                  onClick={() => {
                    onChange({
                      color: scheme.color,
                      bgColor: scheme.bgColor,
                      borderColor: scheme.borderColor,
                    });
                    setIsOpen(false);
                  }}
                  className={`relative p-3 rounded-lg flex flex-col items-center gap-1 transition-all ${
                    isSelectedScheme(scheme)
                      ? `${scheme.bgColor} ${scheme.borderColor} border-2`
                      : "bg-neutral-50 border-2 border-transparent hover:bg-neutral-100"
                  }`}
                >
                  <div
                    className={`h-6 w-6 rounded-md ${scheme.color.replace("text-", "bg-")}`}
                  />
                  <span className="text-xs text-neutral-600">{scheme.name}</span>
                  {isSelectedScheme(scheme) && (
                    <div className="absolute top-1 right-1">
                      <CheckIcon className="h-3 w-3 text-success" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Simple step color picker (for journey steps)
interface StepColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export function StepColorPicker({ value, onChange, label }: StepColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getColorClasses = (color: string) => {
    return {
      bg: `bg-${color}-50`,
      border: `border-${color}-200`,
      text: `text-${color}-600`,
      solid: `bg-${color}-500`,
    };
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
        <div
          className={`h-6 w-6 rounded-md`}
          style={{
            backgroundColor: `var(--color-${value}-500, #6b7280)`,
          }}
        />
        <span className="flex-1 text-left text-neutral-900 capitalize">
          {value || "Select color"}
        </span>
        <SwatchIcon className="h-4 w-4 text-neutral-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-dropdown border border-neutral-200 p-3">
            <div className="grid grid-cols-4 gap-2">
              {STEP_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    onChange(color);
                    setIsOpen(false);
                  }}
                  className={`relative p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                    value === color
                      ? "bg-neutral-100 ring-2 ring-primary-500"
                      : "bg-neutral-50 hover:bg-neutral-100"
                  }`}
                >
                  <div
                    className={`h-6 w-6 rounded-md bg-${color}-500`}
                    style={{
                      backgroundColor: `var(--color-${color}-500, #6b7280)`,
                    }}
                  />
                  <span className="text-xs text-neutral-600 capitalize">
                    {color}
                  </span>
                  {value === color && (
                    <div className="absolute top-1 right-1">
                      <CheckIcon className="h-3 w-3 text-primary-600" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
