"use client";

import { useCMS } from "@/providers/CMSProvider";
import { Button } from "@/components/ui/button";
import {
  PencilSquareIcon,
  CheckIcon,
  EyeIcon,
  GlobeAltIcon,
  XMarkIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  ArrowUturnLeftIcon,
  PlusIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export function AdminToolbar() {
  const {
    isAdmin,
    editMode,
    toggleEditMode,
    hasUnsavedChanges,
    isSaving,
    isPublishing,
    saveDraft,
    publish,
    discardChanges,
    componentPanelOpen,
    setComponentPanelOpen,
  } = useCMS();

  // Only show for admins
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white shadow-modal border-t border-neutral-700/50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3">
        {/* Mobile Layout */}
        <div className="flex items-center justify-between gap-2 sm:hidden">
          {/* Edit Toggle */}
          <Button
            variant={editMode ? "primary" : "outline"}
            size="sm"
            onClick={toggleEditMode}
            className={
              editMode
                ? "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-sm shadow-primary-500/20"
                : "bg-transparent border-neutral-600 text-white hover:bg-neutral-800"
            }
          >
            <PencilSquareIcon className="h-4 w-4 mr-1.5" />
            {editMode ? "Editing" : "Edit"}
          </Button>

          {editMode && (
            <>
              {/* Status indicator */}
              {hasUnsavedChanges ? (
                <div className="flex items-center gap-1.5 text-warning text-xs">
                  <ExclamationCircleIcon className="h-3.5 w-3.5" />
                  <span>Unsaved</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-success text-xs">
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  <span>Saved</span>
                </div>
              )}

              {/* Mobile Actions */}
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setComponentPanelOpen(!componentPanelOpen)}
                  className="bg-transparent border-neutral-600 text-white hover:bg-neutral-700 px-2"
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={saveDraft}
                  disabled={isSaving || !hasUnsavedChanges}
                  className="bg-neutral-700 hover:bg-neutral-600 text-white disabled:opacity-50 px-2"
                >
                  {isSaving ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckIcon className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={publish}
                  disabled={isPublishing}
                  className="bg-gradient-to-r from-success-light to-success hover:from-success hover:to-success-dark text-white shadow-sm shadow-success/20 px-2"
                >
                  {isPublishing ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <GlobeAltIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between">
          {/* Left side - Edit mode toggle and status */}
          <div className="flex items-center gap-4">
            <Button
              variant={editMode ? "primary" : "outline"}
              size="sm"
              onClick={toggleEditMode}
              className={
                editMode
                  ? "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-sm shadow-primary-500/20"
                  : "bg-transparent border-neutral-600 text-white hover:bg-neutral-800"
              }
            >
              <PencilSquareIcon className="h-4 w-4 mr-2" />
              {editMode ? "Editing" : "Edit Mode"}
            </Button>

            {editMode && hasUnsavedChanges && (
              <div className="flex items-center gap-2 text-warning text-sm animate-pulse">
                <ExclamationCircleIcon className="h-4 w-4" />
                <span>Unsaved changes</span>
              </div>
            )}

            {editMode && !hasUnsavedChanges && (
              <div className="flex items-center gap-2 text-success text-sm">
                <CheckCircleIcon className="h-4 w-4" />
                <span>All changes saved</span>
              </div>
            )}
          </div>

          {/* Center - Keyboard shortcuts hint */}
          {editMode && (
            <div className="hidden lg:flex items-center gap-6 text-xs text-neutral-400">
              <span className="flex items-center gap-1.5">
                <kbd className="px-2 py-1 bg-neutral-700/50 rounded text-neutral-300 font-mono text-[10px]">
                  ⌘S
                </kbd>
                <span>Save</span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-2 py-1 bg-neutral-700/50 rounded text-neutral-300 font-mono text-[10px]">
                  ⌘⇧P
                </kbd>
                <span>Publish</span>
              </span>
            </div>
          )}

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            {editMode && (
              <>
                {/* Toggle Component Panel */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setComponentPanelOpen(!componentPanelOpen)}
                  className={`border-neutral-600 text-white transition-all ${
                    componentPanelOpen
                      ? "bg-primary-600/20 border-primary-500/50 hover:bg-primary-600/30"
                      : "bg-transparent hover:bg-neutral-800"
                  }`}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  {componentPanelOpen ? "Hide" : "Add"} Components
                </Button>

                {/* Discard Changes */}
                {hasUnsavedChanges && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={discardChanges}
                    className="bg-transparent border-neutral-600 text-white hover:bg-error/10 hover:border-error/50 hover:text-error"
                  >
                    <ArrowUturnLeftIcon className="h-4 w-4 mr-2" />
                    Discard
                  </Button>
                )}

                {/* Save Draft */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveDraft}
                  disabled={isSaving || !hasUnsavedChanges}
                  className="bg-transparent border-neutral-600 text-white hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckIcon className="h-4 w-4 mr-2" />
                  )}
                  Save Draft
                </Button>

                {/* Preview */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleEditMode}
                  className="bg-transparent border-neutral-600 text-white hover:bg-neutral-700"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  Preview
                </Button>

                {/* Publish */}
                <Button
                  size="sm"
                  onClick={publish}
                  disabled={isPublishing}
                  className="bg-gradient-to-r from-success-light to-success hover:from-success hover:to-success-dark text-white shadow-sm shadow-success/20"
                >
                  {isPublishing ? (
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <GlobeAltIcon className="h-4 w-4 mr-2" />
                  )}
                  Publish
                </Button>

                {/* Close Edit Mode */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleEditMode}
                  className="text-neutral-400 hover:text-white hover:bg-neutral-700 ml-1"
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit mode visual indicator bar */}
      {editMode && (
        <div className="h-1 bg-gradient-to-r from-primary-500 via-primary-500 to-primary-500 animate-pulse" />
      )}
    </div>
  );
}
