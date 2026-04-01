"use client";

import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListBulletIcon,
  NumberedListIcon,
  DocumentTextIcon,
  SwatchIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  IndentIncrease,
  IndentDecrease,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface TextFormatToolbarProps {
  // Text alignment
  alignment?: "left" | "center" | "right" | "justify";
  onAlignmentChange?: (alignment: "left" | "center" | "right" | "justify") => void;

  // Font size
  fontSize?: string;
  onFontSizeChange?: (size: string) => void;

  // Text color
  textColor?: string;
  onTextColorChange?: (color: string) => void;

  // Font weight
  isBold?: boolean;
  onBoldChange?: (bold: boolean) => void;

  // Italic
  isItalic?: boolean;
  onItalicChange?: (italic: boolean) => void;

  // Underline
  isUnderline?: boolean;
  onUnderlineChange?: (underline: boolean) => void;

  // Which controls to show
  showAlignment?: boolean;
  showFontSize?: boolean;
  showTextColor?: boolean;
  showBold?: boolean;
  showItalic?: boolean;
  showUnderline?: boolean;
  showLists?: boolean;
  showIndent?: boolean;

  // Compact mode for inline use
  compact?: boolean;

  className?: string;
}

const FONT_SIZES = [
  { value: "text-xs", label: "XS" },
  { value: "text-sm", label: "S" },
  { value: "text-base", label: "M" },
  { value: "text-lg", label: "L" },
  { value: "text-xl", label: "XL" },
  { value: "text-2xl", label: "2XL" },
  { value: "text-3xl", label: "3XL" },
  { value: "text-4xl", label: "4XL" },
  { value: "text-5xl", label: "5XL" },
];

const TEXT_COLORS = [
  { value: "text-neutral-900", label: "Black", color: "#171717" },
  { value: "text-neutral-600", label: "Gray", color: "#525252" },
  { value: "text-neutral-400", label: "Light Gray", color: "#a3a3a3" },
  { value: "text-primary-700", label: "Primary", color: "#6d28d9" },
  { value: "text-primary-500", label: "Primary Light", color: "#8b5cf6" },
  { value: "text-accent-green", label: "Green", color: "#22c55e" },
  { value: "text-accent-orange", label: "Orange", color: "#f97316" },
  { value: "text-accent-cyan", label: "Cyan", color: "#06b6d4" },
  { value: "text-error", label: "Red", color: "#dc2626" },
  { value: "text-white", label: "White", color: "#ffffff" },
];

export function TextFormatToolbar({
  alignment = "left",
  onAlignmentChange,
  fontSize = "text-base",
  onFontSizeChange,
  textColor = "text-neutral-900",
  onTextColorChange,
  isBold = false,
  onBoldChange,
  isItalic = false,
  onItalicChange,
  isUnderline = false,
  onUnderlineChange,
  showAlignment = true,
  showFontSize = true,
  showTextColor = true,
  showBold = true,
  showItalic = true,
  showUnderline = false,
  showLists = false,
  showIndent = false,
  compact = false,
  className = "",
}: TextFormatToolbarProps) {
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const fontDropdownRef = useRef<HTMLDivElement>(null);
  const colorDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(event.target as Node)) {
        setShowFontDropdown(false);
      }
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target as Node)) {
        setShowColorDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const buttonClass = compact
    ? "p-1.5 rounded hover:bg-neutral-200 transition-colors"
    : "p-2 rounded hover:bg-neutral-200 transition-colors";

  const activeButtonClass = "bg-primary-100 text-primary-700";

  const currentFontSize = FONT_SIZES.find(f => f.value === fontSize) || FONT_SIZES[2];
  const currentTextColor = TEXT_COLORS.find(c => c.value === textColor) || TEXT_COLORS[0];

  return (
    <div className={`flex items-center gap-1 bg-white border border-neutral-200 rounded-lg p-1 shadow-sm ${className}`}>
      {/* Alignment Controls */}
      {showAlignment && onAlignmentChange && (
        <div className="flex items-center border-r border-neutral-200 pr-1 mr-1">
          <button
            onClick={() => onAlignmentChange("left")}
            className={`${buttonClass} ${alignment === "left" ? activeButtonClass : ""}`}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onAlignmentChange("center")}
            className={`${buttonClass} ${alignment === "center" ? activeButtonClass : ""}`}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            onClick={() => onAlignmentChange("right")}
            className={`${buttonClass} ${alignment === "right" ? activeButtonClass : ""}`}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </button>
          {!compact && (
            <button
              onClick={() => onAlignmentChange("justify")}
              className={`${buttonClass} ${alignment === "justify" ? activeButtonClass : ""}`}
              title="Justify"
            >
              <AlignJustify className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Font Size Dropdown */}
      {showFontSize && onFontSizeChange && (
        <div className="relative" ref={fontDropdownRef}>
          <button
            onClick={() => setShowFontDropdown(!showFontDropdown)}
            className={`${buttonClass} flex items-center gap-1 min-w-[60px] justify-between`}
            title="Font Size"
          >
            <DocumentTextIcon className="h-4 w-4" />
            <span className="text-xs font-medium">{currentFontSize.label}</span>
            <ChevronDownIcon className="h-3 w-3" />
          </button>
          {showFontDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-dropdown z-50 py-1 min-w-[100px]">
              {FONT_SIZES.map((size) => (
                <button
                  key={size.value}
                  onClick={() => {
                    onFontSizeChange(size.value);
                    setShowFontDropdown(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-sm hover:bg-neutral-100 flex items-center justify-between ${
                    fontSize === size.value ? "bg-primary-50 text-primary-700" : ""
                  }`}
                >
                  <span>{size.label}</span>
                  <span className={`${size.value} text-neutral-400`}>Aa</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Text Color Dropdown */}
      {showTextColor && onTextColorChange && (
        <div className="relative" ref={colorDropdownRef}>
          <button
            onClick={() => setShowColorDropdown(!showColorDropdown)}
            className={`${buttonClass} flex items-center gap-1`}
            title="Text Color"
          >
            <SwatchIcon className="h-4 w-4" />
            <div
              className="h-4 w-4 rounded border border-neutral-300"
              style={{ backgroundColor: currentTextColor.color }}
            />
            <ChevronDownIcon className="h-3 w-3" />
          </button>
          {showColorDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-dropdown z-50 p-2 min-w-[140px]">
              <div className="grid grid-cols-5 gap-1">
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => {
                      onTextColorChange(color.value);
                      setShowColorDropdown(false);
                    }}
                    className={`h-6 w-6 rounded border-2 transition-all ${
                      textColor === color.value
                        ? "border-primary-500 scale-110"
                        : "border-transparent hover:border-neutral-300"
                    }`}
                    style={{ backgroundColor: color.color }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bold/Italic/Underline */}
      {(showBold || showItalic || showUnderline) && (
        <div className="flex items-center border-l border-neutral-200 pl-1 ml-1">
          {showBold && onBoldChange && (
            <button
              onClick={() => onBoldChange(!isBold)}
              className={`${buttonClass} ${isBold ? activeButtonClass : ""}`}
              title="Bold"
            >
              <BoldIcon className="h-4 w-4" />
            </button>
          )}
          {showItalic && onItalicChange && (
            <button
              onClick={() => onItalicChange(!isItalic)}
              className={`${buttonClass} ${isItalic ? activeButtonClass : ""}`}
              title="Italic"
            >
              <ItalicIcon className="h-4 w-4" />
            </button>
          )}
          {showUnderline && onUnderlineChange && (
            <button
              onClick={() => onUnderlineChange(!isUnderline)}
              className={`${buttonClass} ${isUnderline ? activeButtonClass : ""}`}
              title="Underline"
            >
              <UnderlineIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Lists */}
      {showLists && (
        <div className="flex items-center border-l border-neutral-200 pl-1 ml-1">
          <button className={buttonClass} title="Bullet List">
            <ListBulletIcon className="h-4 w-4" />
          </button>
          <button className={buttonClass} title="Numbered List">
            <NumberedListIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Indent */}
      {showIndent && (
        <div className="flex items-center border-l border-neutral-200 pl-1 ml-1">
          <button className={buttonClass} title="Decrease Indent">
            <IndentDecrease className="h-4 w-4" />
          </button>
          <button className={buttonClass} title="Increase Indent">
            <IndentIncrease className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
