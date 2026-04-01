"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemName?: string;
  isLoading?: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  isLoading = false,
}: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-card rounded-[var(--radius-lg)] shadow-modal max-w-md w-full mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-error-light rounded-lg">
            <ExclamationTriangleIcon className="h-6 w-6 text-error" />
          </div>

          <div className="flex-1">
            <h3 className="text-heading-sm text-neutral-900 mb-2">{title}</h3>
            <p className="text-body text-neutral-600 mb-4">{description}</p>

            {itemName && (
              <p className="text-body-sm font-medium text-neutral-900 bg-neutral-50 px-3 py-2 rounded-[var(--radius-md)] mb-4">
                {itemName}
              </p>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                onClick={onConfirm}
                disabled={isLoading}
                className="bg-error hover:bg-error/90 text-white"
              >
                {isLoading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmDialog;
