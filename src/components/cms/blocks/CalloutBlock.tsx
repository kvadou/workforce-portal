"use client";

import { useState } from "react";
import { CMSBlock, useCMS } from "@/providers/CMSProvider";
import {
  ExclamationCircleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface CalloutBlockProps {
  block: CMSBlock;
  isEditing: boolean;
}

const VARIANTS = {
  info: {
    icon: InformationCircleIcon,
    bg: "bg-info-light",
    border: "border-info",
    text: "text-info-dark",
    iconColor: "text-info",
  },
  success: {
    icon: CheckCircleIcon,
    bg: "bg-success-light",
    border: "border-success",
    text: "text-success-dark",
    iconColor: "text-success",
  },
  warning: {
    icon: ExclamationTriangleIcon,
    bg: "bg-warning-light",
    border: "border-warning",
    text: "text-warning-dark",
    iconColor: "text-warning",
  },
  error: {
    icon: ExclamationCircleIcon,
    bg: "bg-error-light",
    border: "border-error",
    text: "text-error-dark",
    iconColor: "text-error",
  },
};

export function CalloutBlock({ block, isEditing }: CalloutBlockProps) {
  const { updateBlock } = useCMS();
  const content = block.content as {
    text: string;
    variant: keyof typeof VARIANTS;
  };
  const [isEditable, setIsEditable] = useState(false);

  const variant = VARIANTS[content.variant || "info"];
  const Icon = variant.icon;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateBlock(block.id, { text: e.target.value });
  };

  if (isEditing && isEditable) {
    return (
      <div
        className={`${variant.bg} ${variant.border} border rounded-lg p-4 flex gap-3`}
      >
        <Icon className={`h-5 w-5 ${variant.iconColor} flex-shrink-0 mt-0.5`} />
        <textarea
          value={content.text || ""}
          onChange={handleChange}
          onBlur={() => setIsEditable(false)}
          autoFocus
          className={`flex-1 ${variant.text} bg-transparent border-none outline-none resize-none min-h-[60px]`}
          placeholder="Enter callout text..."
        />
      </div>
    );
  }

  if (isEditing) {
    return (
      <div
        className={`${variant.bg} ${variant.border} border rounded-lg p-4 flex gap-3 cursor-text hover:opacity-90 transition-opacity`}
        onClick={() => setIsEditable(true)}
      >
        <Icon className={`h-5 w-5 ${variant.iconColor} flex-shrink-0 mt-0.5`} />
        <p className={`${variant.text} flex-1`}>
          {content.text || "Click to edit callout..."}
        </p>
      </div>
    );
  }

  // View mode
  if (!content.text) return null;

  return (
    <div
      className={`${variant.bg} ${variant.border} border rounded-lg p-4 flex gap-3`}
    >
      <Icon className={`h-5 w-5 ${variant.iconColor} flex-shrink-0 mt-0.5`} />
      <p className={`${variant.text} flex-1`}>{content.text}</p>
    </div>
  );
}
