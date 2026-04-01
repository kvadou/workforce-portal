"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

// Types for CMS blocks
export interface CMSBlock {
  id: string;
  type: string;
  content: Record<string, unknown>;
  order: number;
}

export interface PageContent {
  pageType: string;
  pageId: string;
  blocks: CMSBlock[];
  isDraft: boolean;
  publishedAt: string | null;
  version: number;
}

interface CMSContextType {
  // Edit mode
  editMode: boolean;
  setEditMode: (mode: boolean) => void;
  toggleEditMode: () => void;

  // Admin check
  isAdmin: boolean;

  // Content state
  blocks: CMSBlock[];
  setBlocks: (blocks: CMSBlock[]) => void;
  addBlock: (block: Omit<CMSBlock, "id" | "order">, index?: number) => void;
  updateBlock: (id: string, content: Partial<CMSBlock["content"]>) => void;
  deleteBlock: (id: string) => void;
  moveBlock: (fromIndex: number, toIndex: number) => void;
  duplicateBlock: (id: string) => void;

  // Draft state
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
  originalBlocks: CMSBlock[];
  setOriginalBlocks: (blocks: CMSBlock[]) => void;

  // Page context
  currentPageType: string | null;
  currentPageId: string | null;
  setCurrentPage: (pageType: string, pageId: string) => void;

  // Actions
  saveDraft: () => Promise<void>;
  publish: () => Promise<void>;
  discardChanges: () => void;
  loadContent: (pageType: string, pageId: string, forceReload?: boolean) => Promise<void>;
  markPageLoaded: (pageType: string, pageId: string) => void;

  // Loading states
  isSaving: boolean;
  isPublishing: boolean;
  isLoading: boolean;
  hasInitialized: boolean;

  // Component panel
  componentPanelOpen: boolean;
  setComponentPanelOpen: (open: boolean) => void;

  // Settings panel
  selectedBlockId: string | null;
  setSelectedBlockId: (id: string | null) => void;
  settingsPanelOpen: boolean;
  setSettingsPanelOpen: (open: boolean) => void;
}

const CMSContext = createContext<CMSContextType | null>(null);

// Generate unique ID
function generateId(): string {
  return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function CMSProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();

  // Check if user is admin
  const isAdmin =
    session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN";

  // Edit mode state
  const [editMode, setEditMode] = useState(false);

  // Content state
  const [blocks, setBlocks] = useState<CMSBlock[]>([]);
  const [originalBlocks, setOriginalBlocks] = useState<CMSBlock[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Page context
  const [currentPageType, setCurrentPageType] = useState<string | null>(null);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const loadedPageKeyRef = useRef<string | null>(null);

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start true to prevent flash
  const [hasInitialized, setHasInitialized] = useState(false);

  // Panel states
  const [componentPanelOpen, setComponentPanelOpen] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);

  // Toggle edit mode
  const toggleEditMode = useCallback(() => {
    setEditMode((prev) => !prev);
  }, []);

  // Track changes
  useEffect(() => {
    if (editMode && blocks.length > 0) {
      const hasChanges =
        JSON.stringify(blocks) !== JSON.stringify(originalBlocks);
      setHasUnsavedChanges(hasChanges);
    }
  }, [blocks, originalBlocks, editMode]);

  // Add block
  const addBlock = useCallback(
    (block: Omit<CMSBlock, "id" | "order">, index?: number) => {
      const newBlock: CMSBlock = {
        ...block,
        id: generateId(),
        order: index ?? blocks.length,
      };

      setBlocks((prev) => {
        if (index !== undefined) {
          const updated = [...prev];
          updated.splice(index, 0, newBlock);
          return updated.map((b, i) => ({ ...b, order: i }));
        }
        return [...prev, newBlock];
      });
    },
    [blocks.length]
  );

  // Update block
  const updateBlock = useCallback(
    (id: string, content: Partial<CMSBlock["content"]>) => {
      setBlocks((prev) =>
        prev.map((block) =>
          block.id === id
            ? { ...block, content: { ...block.content, ...content } }
            : block
        )
      );
    },
    []
  );

  // Delete block
  const deleteBlock = useCallback((id: string) => {
    setBlocks((prev) => {
      const filtered = prev.filter((block) => block.id !== id);
      return filtered.map((b, i) => ({ ...b, order: i }));
    });
    setSelectedBlockId(null);
    setSettingsPanelOpen(false);
  }, []);

  // Move block
  const moveBlock = useCallback((fromIndex: number, toIndex: number) => {
    setBlocks((prev) => {
      const updated = [...prev];
      const [removed] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, removed);
      return updated.map((b, i) => ({ ...b, order: i }));
    });
  }, []);

  // Duplicate block
  const duplicateBlock = useCallback((id: string) => {
    setBlocks((prev) => {
      const blockIndex = prev.findIndex((b) => b.id === id);
      if (blockIndex === -1) return prev;

      const block = prev[blockIndex];
      const newBlock: CMSBlock = {
        ...block,
        id: generateId(),
        content: { ...block.content },
      };

      const updated = [...prev];
      updated.splice(blockIndex + 1, 0, newBlock);
      return updated.map((b, i) => ({ ...b, order: i }));
    });
  }, []);

  // Set current page
  const setCurrentPage = useCallback((pageType: string, pageId: string) => {
    setCurrentPageType(pageType);
    setCurrentPageId(pageId);
  }, []);

  // Load content from API
  const loadContent = useCallback(async (pageType: string, pageId: string, forceReload = false) => {
    const pageKey = `${pageType}:${pageId}`;

    // Skip if already loaded for this page (unless force reload)
    if (!forceReload && loadedPageKeyRef.current === pageKey) {
      setIsLoading(false);
      setHasInitialized(true);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/cms/content/${pageType}/${pageId}`);
      if (response.ok) {
        const data = await response.json();
        // API returns blocks directly (or draftBlocks for admins)
        const loadedBlocks = Array.isArray(data.blocks) ? data.blocks : [];
        setBlocks(loadedBlocks);
        setOriginalBlocks(loadedBlocks);
        loadedPageKeyRef.current = pageKey;
        // Track if there's a draft
        if (data.hasDraft) {
          setHasUnsavedChanges(true);
        }
      } else if (response.status === 404) {
        // No content yet, start fresh
        setBlocks([]);
        setOriginalBlocks([]);
        loadedPageKeyRef.current = pageKey;
      }
    } catch (error) {
      console.error("Failed to load content:", error);
      setBlocks([]);
      setOriginalBlocks([]);
    } finally {
      setIsLoading(false);
      setHasInitialized(true);
    }
  }, []);

  // Mark page as loaded (used when blocks are set directly without fetching)
  const markPageLoaded = useCallback((pageType: string, pageId: string) => {
    loadedPageKeyRef.current = `${pageType}:${pageId}`;
  }, []);

  // Save draft
  const saveDraft = useCallback(async () => {
    if (!currentPageType || !currentPageId) {
      toast.error("No page context set");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/cms/content/${currentPageType}/${currentPageId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blocks, action: "draft" }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save draft");
      }

      setOriginalBlocks(blocks);
      setHasUnsavedChanges(false);
      toast.success("Draft saved!");
    } catch (error) {
      console.error("Failed to save draft:", error);
      toast.error("Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  }, [currentPageType, currentPageId, blocks]);

  // Publish
  const publish = useCallback(async () => {
    if (!currentPageType || !currentPageId) {
      toast.error("No page context set");
      return;
    }

    setIsPublishing(true);
    try {
      const response = await fetch(
        `/api/cms/content/${currentPageType}/${currentPageId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blocks, action: "publish" }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to publish");
      }

      setOriginalBlocks(blocks);
      setHasUnsavedChanges(false);
      setEditMode(false);
      toast.success("Published! Changes are now live.");
    } catch (error) {
      console.error("Failed to publish:", error);
      toast.error("Failed to publish");
    } finally {
      setIsPublishing(false);
    }
  }, [currentPageType, currentPageId, blocks]);

  // Discard changes
  const discardChanges = useCallback(() => {
    // Reset local state first
    setBlocks(originalBlocks);
    setHasUnsavedChanges(false);
    toast.success("Changes discarded");

    // Try to discard on server (non-blocking, don't wait)
    if (currentPageType && currentPageId) {
      fetch(
        `/api/cms/content/${currentPageType}/${currentPageId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "discard" }),
        }
      ).catch((error) => {
        console.error("Failed to discard on server:", error);
      });
    }
  }, [originalBlocks, currentPageType, currentPageId]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isAdmin || !editMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save draft
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveDraft();
      }
      // Ctrl+Shift+P or Cmd+Shift+P to publish
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "p") {
        e.preventDefault();
        publish();
      }
      // Escape to close panels
      if (e.key === "Escape") {
        setSettingsPanelOpen(false);
        setSelectedBlockId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAdmin, editMode, saveDraft, publish]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!isAdmin || !editMode || !hasUnsavedChanges) return;

    const interval = setInterval(() => {
      saveDraft();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAdmin, editMode, hasUnsavedChanges, saveDraft]);

  // Warn on navigation with unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Turn off edit mode when not admin
  useEffect(() => {
    if (!isAdmin && editMode) {
      setEditMode(false);
    }
  }, [isAdmin, editMode]);

  const value: CMSContextType = {
    editMode,
    setEditMode,
    toggleEditMode,
    isAdmin,
    blocks,
    setBlocks,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlock,
    duplicateBlock,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    originalBlocks,
    setOriginalBlocks,
    currentPageType,
    currentPageId,
    setCurrentPage,
    saveDraft,
    publish,
    discardChanges,
    loadContent,
    markPageLoaded,
    isSaving,
    isPublishing,
    isLoading,
    hasInitialized,
    componentPanelOpen,
    setComponentPanelOpen,
    selectedBlockId,
    setSelectedBlockId,
    settingsPanelOpen,
    setSettingsPanelOpen,
  };

  return <CMSContext.Provider value={value}>{children}</CMSContext.Provider>;
}

// Hooks
export function useCMS() {
  const context = useContext(CMSContext);
  if (!context) {
    throw new Error("useCMS must be used within CMSProvider");
  }
  return context;
}

export function useIsAdmin() {
  const { isAdmin } = useCMS();
  return isAdmin;
}

export function useEditMode() {
  const { editMode, setEditMode, toggleEditMode, isAdmin } = useCMS();
  return { editMode: isAdmin && editMode, setEditMode, toggleEditMode };
}
