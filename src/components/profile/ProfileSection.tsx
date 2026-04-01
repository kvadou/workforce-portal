"use client";

import { useState } from "react";
import {
  PencilSquareIcon,
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface ProfileSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  editContent?: React.ReactNode;
  isEditing?: boolean;
  onEditToggle?: (editing: boolean) => void;
  onSave?: () => Promise<void> | void;
  canEdit?: boolean;
  isSaving?: boolean;
}

export function ProfileSection({
  title,
  icon,
  children,
  editContent,
  isEditing = false,
  onEditToggle,
  onSave,
  canEdit = true,
  isSaving = false,
}: ProfileSectionProps) {
  const [localEditing, setLocalEditing] = useState(false);
  const editing = onEditToggle ? isEditing : localEditing;

  const handleEditToggle = () => {
    if (onEditToggle) {
      onEditToggle(!editing);
    } else {
      setLocalEditing(!localEditing);
    }
  };

  const handleSave = async () => {
    if (onSave) {
      await onSave();
    }
    if (onEditToggle) {
      onEditToggle(false);
    } else {
      setLocalEditing(false);
    }
  };

  const handleCancel = () => {
    if (onEditToggle) {
      onEditToggle(false);
    } else {
      setLocalEditing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
              {icon}
            </div>
          )}
          <h3 className="font-semibold text-neutral-900">{title}</h3>
        </div>

        {/* Edit Controls */}
        {canEdit && editContent && (
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckIcon className="h-4 w-4" />
                  )}
                  Save
                </button>
              </>
            ) : (
              <button
                onClick={handleEditToggle}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <PencilSquareIcon className="h-4 w-4" />
                Edit
              </button>
            )}
          </div>
        )}
      </div>

      {/* Section Content */}
      <div className="p-6">{editing && editContent ? editContent : children}</div>
    </div>
  );
}

// Helper component for displaying field values
interface ProfileFieldProps {
  label: string;
  value: string | number | null | undefined;
  emptyText?: string;
}

export function ProfileField({
  label,
  value,
  emptyText = "Not provided",
}: ProfileFieldProps) {
  return (
    <div>
      <dt className="text-sm font-medium text-neutral-500">{label}</dt>
      <dd className="mt-1 text-neutral-900">
        {value || <span className="text-neutral-400 italic">{emptyText}</span>}
      </dd>
    </div>
  );
}

// Helper component for edit form fields
interface ProfileInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel" | "date" | "number";
  placeholder?: string;
  required?: boolean;
  icon?: React.ReactNode;
}

export function ProfileInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  icon,
}: ProfileInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">
        {label} {required && <span className="text-error">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${icon ? "pl-10" : "px-4"} py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-colors`}
        />
      </div>
    </div>
  );
}

// Helper component for textarea fields
interface ProfileTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export function ProfileTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: ProfileTextareaProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-colors resize-none"
      />
    </div>
  );
}

// Helper component for select fields
interface ProfileSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function ProfileSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: ProfileSelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-colors"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
