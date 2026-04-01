"use client";

import { useState, useRef, useEffect, createElement } from "react";
import { CMSBlock, useCMS } from "@/providers/CMSProvider";
import { TextFormatToolbar } from "../TextFormatToolbar";

interface HeadingBlockProps {
  block: CMSBlock;
  isEditing: boolean;
}

export function HeadingBlock({ block, isEditing }: HeadingBlockProps) {
  const { updateBlock } = useCMS();
  const content = block.content as {
    text: string;
    level: 1 | 2 | 3 | 4;
    alignment?: "left" | "center" | "right" | "justify";
    fontSize?: string;
    textColor?: string;
    isBold?: boolean;
    isItalic?: boolean;
  };
  const [isEditable, setIsEditable] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const level = content.level || 2;
  const alignment = content.alignment || "left";
  const textColor = content.textColor || "text-neutral-900";
  const isBold = content.isBold !== false; // default true for headings
  const isItalic = content.isItalic || false;

  // Default font sizes based on heading level (responsive)
  const defaultFontSizes: Record<number, string> = {
    1: "text-2xl sm:text-3xl md:text-4xl",
    2: "text-xl sm:text-2xl md:text-3xl",
    3: "text-lg sm:text-xl md:text-2xl",
    4: "text-base sm:text-lg md:text-xl",
  };
  const fontSize = content.fontSize || defaultFontSizes[level];

  useEffect(() => {
    if (isEditable && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditable]);

  const handleBlur = () => {
    setIsEditable(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateBlock(block.id, { text: e.target.value });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setIsEditable(false);
    }
  };

  // Build dynamic classes
  const alignmentClasses: Record<string, string> = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
    justify: "text-justify",
  };

  const marginClasses: Record<number, string> = {
    1: "mb-6",
    2: "mb-5",
    3: "mb-4",
    4: "mb-3",
  };

  const headingTag = `h${level}` as "h1" | "h2" | "h3" | "h4";

  const buildClassName = (extraClasses = "") => {
    const classes = [
      fontSize,
      textColor,
      marginClasses[level],
      alignmentClasses[alignment],
      isBold ? "font-bold" : "font-normal",
      isItalic ? "italic" : "",
      extraClasses,
    ].filter(Boolean).join(" ");
    return classes;
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        {/* Format Toolbar - always visible when in edit mode for this block */}
        <TextFormatToolbar
          alignment={alignment}
          onAlignmentChange={(a) => updateBlock(block.id, { alignment: a })}
          fontSize={fontSize}
          onFontSizeChange={(s) => updateBlock(block.id, { fontSize: s })}
          textColor={textColor}
          onTextColorChange={(c) => updateBlock(block.id, { textColor: c })}
          isBold={isBold}
          onBoldChange={(b) => updateBlock(block.id, { isBold: b })}
          isItalic={isItalic}
          onItalicChange={(i) => updateBlock(block.id, { isItalic: i })}
          showUnderline={false}
          showLists={false}
          showIndent={false}
          compact
        />

        {/* Editable Text */}
        {isEditable ? (
          <input
            ref={inputRef}
            type="text"
            value={content.text || ""}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={`${buildClassName("w-full bg-transparent border-none outline-none focus:ring-2 focus:ring-primary-300 rounded px-2 -mx-2")}`}
            placeholder="Enter heading..."
          />
        ) : (
          createElement(
            headingTag,
            {
              className: buildClassName("cursor-text hover:bg-neutral-50 rounded px-2 -mx-2 transition-colors"),
              onClick: () => setIsEditable(true),
            },
            content.text || "Click to edit heading..."
          )
        )}
      </div>
    );
  }

  // View mode
  if (!content.text) return null;

  return createElement(
    headingTag,
    { className: buildClassName() },
    content.text
  );
}
