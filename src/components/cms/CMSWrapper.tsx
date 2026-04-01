"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
} from "@dnd-kit/core";
import { CMSProvider, useCMS } from "@/providers/CMSProvider";
import { AdminToolbar } from "./AdminToolbar";
import { ComponentPanel } from "./ComponentPanel";
import { BlockSettings, useBlockSettings } from "./BlockSettings";
import { MediaLibrary, useMediaLibrary } from "./MediaLibrary";

interface CMSWrapperProps {
  children: React.ReactNode;
  pageType: string;
  pageId: string;
}

/**
 * Wrapper component that adds CMS editing capabilities to a page.
 *
 * Includes:
 * - Admin toolbar (bottom of screen)
 * - Component panel (right sidebar)
 * - Block settings panel (right drawer)
 * - Media library modal
 *
 * Usage:
 * ```tsx
 * <CMSWrapper pageType="resource" pageId={resourceId}>
 *   <CMSPageRenderer pageType="resource" pageId={resourceId} />
 * </CMSWrapper>
 * ```
 */
function CMSWrapperInner({ children, pageType, pageId }: CMSWrapperProps) {
  const {
    isAdmin,
    editMode,
    setCurrentPage,
    loadContent,
    componentPanelOpen,
    setComponentPanelOpen,
    selectedBlockId,
    setSelectedBlockId,
    settingsPanelOpen,
    setSettingsPanelOpen,
    blocks,
    addBlock,
    moveBlock,
  } = useCMS();

  const [activeId, setActiveId] = useState<string | null>(null);

  // Load page content on mount
  useEffect(() => {
    setCurrentPage(pageType, pageId);
    loadContent(pageType, pageId);
  }, [pageType, pageId, setCurrentPage, loadContent]);

  // Block settings
  const selectedBlock = selectedBlockId
    ? blocks.find((b) => b.id === selectedBlockId) || null
    : null;

  // Media library
  const mediaLibrary = useMediaLibrary();

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Adding new component from panel
    if (activeData?.type === "new-component") {
      const index = overData?.index ?? blocks.length;
      addBlock(
        {
          type: activeData.componentType,
          content: { ...activeData.defaultContent },
        },
        index
      );
      return;
    }

    // Reordering existing blocks
    if (activeData?.type === "block" && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      let newIndex: number;

      if (overData?.isIndicator) {
        newIndex = overData.index;
      } else {
        newIndex = blocks.findIndex((b) => b.id === over.id);
      }

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        moveBlock(oldIndex, newIndex);
      }
    }
  };

  // Content without DnD for non-admin
  if (!isAdmin) {
    return <>{children}</>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Main content */}
      <div className={editMode ? "pb-20" : ""}>{children}</div>

      {/* Admin-only CMS UI */}
      <>
        {/* Admin Toolbar - fixed at bottom */}
        <AdminToolbar />

        {/* Component Panel - right sidebar */}
        {editMode && componentPanelOpen && (
          <ComponentPanel />
        )}

        {/* Block Settings - right drawer (only when gear icon clicked) */}
        {editMode && selectedBlock && settingsPanelOpen && (
          <BlockSettings
            block={selectedBlock}
            onClose={() => {
              setSelectedBlockId(null);
              setSettingsPanelOpen(false);
            }}
          />
        )}

        {/* Media Library Modal */}
        <MediaLibrary
          isOpen={mediaLibrary.isOpen}
          onClose={mediaLibrary.closeMediaLibrary}
          onSelect={mediaLibrary.handleSelect}
          allowedTypes={mediaLibrary.allowedTypes}
        />
      </>

      {/* Drag overlay for visual feedback */}
      <DragOverlay>
        {activeId && activeId.startsWith("new-") ? (
          <div className="px-4 py-2 bg-primary-500 text-white rounded-lg shadow-dropdown text-sm font-medium">
            Drop to add component
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export function CMSWrapper(props: CMSWrapperProps) {
  return (
    <CMSProvider>
      <CMSWrapperInner {...props} />
    </CMSProvider>
  );
}

// Export media library hook for use in blocks
export { useMediaLibrary } from "./MediaLibrary";
