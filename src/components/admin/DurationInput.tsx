"use client";

import { useState, useEffect, useCallback } from "react";
import { ClockIcon } from "@heroicons/react/24/outline";
import { formatDuration, parseDuration } from "@/lib/vimeo";

interface DurationInputProps {
  /** Duration in seconds (for storage) */
  value: number;
  /** Called when duration changes, with value in seconds */
  onChange: (seconds: number) => void;
  /** Label for the input */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Help text shown below input */
  helpText?: string;
}

/**
 * Duration input that displays/edits in MM:SS or HH:MM:SS format
 * but converts to/from seconds for storage.
 *
 * @example
 * <DurationInput
 *   value={1087}
 *   onChange={(seconds) => setDuration(seconds)}
 *   label="Video Duration"
 * />
 */
export function DurationInput({
  value,
  onChange,
  label,
  placeholder = "0:00",
  className = "",
  disabled = false,
  helpText,
}: DurationInputProps) {
  // Internal display value (formatted string)
  const [displayValue, setDisplayValue] = useState(() => formatDuration(value));
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update display when value prop changes (and not focused)
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatDuration(value));
    }
  }, [value, isFocused]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      setError(null);

      // Allow only digits and colons
      const sanitized = input.replace(/[^\d:]/g, "");
      setDisplayValue(sanitized);

      // Parse and update parent on valid input
      if (sanitized === "" || sanitized === "0") {
        onChange(0);
        return;
      }

      // Auto-format as user types
      // If they type just numbers, don't auto-format yet
      // Let them finish typing before converting
    },
    [onChange]
  );

  const handleBlur = useCallback(() => {
    setIsFocused(false);

    // Parse the current value
    const seconds = parseDuration(displayValue);

    // Validate
    if (displayValue && seconds === 0 && displayValue !== "0:00") {
      // Check if it's an invalid format
      const parts = displayValue.split(":");
      const hasInvalidParts = parts.some((p) => {
        const num = parseInt(p, 10);
        return isNaN(num) || (parts.length > 1 && parts.indexOf(p) > 0 && num > 59);
      });

      if (hasInvalidParts) {
        setError("Invalid format. Use MM:SS or HH:MM:SS");
        return;
      }
    }

    // Format properly and update
    setDisplayValue(formatDuration(seconds));
    onChange(seconds);
  }, [displayValue, onChange]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // Select all text on focus for easy replacement
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter, arrows
      if (
        [8, 46, 9, 27, 13, 37, 38, 39, 40].includes(e.keyCode) ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.ctrlKey && [65, 67, 86, 88].includes(e.keyCode)) ||
        // Allow: Cmd+A, Cmd+C, Cmd+V, Cmd+X (Mac)
        (e.metaKey && [65, 67, 86, 88].includes(e.keyCode))
      ) {
        return;
      }

      // Allow digits and colon
      if (!/[\d:]/.test(e.key)) {
        e.preventDefault();
      }
    },
    []
  );

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500 ${
            error
              ? "border-error focus:ring-error focus:border-error"
              : "border-neutral-300"
          } ${disabled ? "bg-neutral-100 cursor-not-allowed" : ""}`}
        />
      </div>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
      {helpText && !error && (
        <p className="mt-1 text-xs text-neutral-500">{helpText}</p>
      )}
    </div>
  );
}
