"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BlockNoteEditor,
  PartialBlock,
  Block,
} from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

// Custom styles for the editor
const editorStyles = `
  .bn-container {
    font-family: 'Poppins', sans-serif;
  }
  .bn-editor {
    padding: 1rem;
    min-height: 200px;
  }
  .bn-block-outer:first-child {
    margin-top: 0;
  }
  /* Ensure formatting toolbar is visible */
  .bn-formatting-toolbar {
    z-index: 9999 !important;
  }
  .bn-slash-menu {
    z-index: 9999 !important;
  }
  .bn-side-menu {
    z-index: 9999 !important;
  }
  /* Make the side menu more visible on hover */
  .bn-side-menu-button {
    opacity: 0.5;
    transition: opacity 0.2s;
  }
  .bn-block-outer:hover .bn-side-menu-button {
    opacity: 1;
  }
`;

interface BlockEditorProps {
  initialContent?: string;
  onChange?: (content: string, html: string) => void;
  editable?: boolean;
  placeholder?: string;
}

// Convert HTML to BlockNote blocks (basic conversion)
function htmlToBlocks(html: string): PartialBlock[] {
  if (!html || html.trim() === "") {
    return [{ type: "paragraph", content: "" }];
  }

  // If it looks like JSON (BlockNote format), parse it
  if (html.startsWith("[") && html.endsWith("]")) {
    try {
      return JSON.parse(html);
    } catch {
      // Fall through to HTML parsing
    }
  }

  // Basic HTML to blocks conversion
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const blocks: PartialBlock[] = [];

  doc.body.childNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();
      const text = element.textContent || "";

      switch (tagName) {
        case "h1":
          blocks.push({ type: "heading", props: { level: 1 }, content: text });
          break;
        case "h2":
          blocks.push({ type: "heading", props: { level: 2 }, content: text });
          break;
        case "h3":
          blocks.push({ type: "heading", props: { level: 3 }, content: text });
          break;
        case "ul":
          element.querySelectorAll("li").forEach((li) => {
            blocks.push({ type: "bulletListItem", content: li.textContent || "" });
          });
          break;
        case "ol":
          element.querySelectorAll("li").forEach((li) => {
            blocks.push({ type: "numberedListItem", content: li.textContent || "" });
          });
          break;
        case "blockquote":
          blocks.push({ type: "paragraph", content: text });
          break;
        case "img":
          const src = element.getAttribute("src");
          if (src) {
            blocks.push({
              type: "image",
              props: {
                url: src,
                caption: element.getAttribute("alt") || "",
              },
            });
          }
          break;
        default:
          if (text.trim()) {
            blocks.push({ type: "paragraph", content: text });
          }
      }
    } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      blocks.push({ type: "paragraph", content: node.textContent.trim() });
    }
  });

  return blocks.length > 0 ? blocks : [{ type: "paragraph", content: "" }];
}

export function BlockEditor({
  initialContent = "",
  onChange,
  editable = true,
  placeholder = "Start typing or use '/' for commands...",
}: BlockEditorProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Parse initial content
  const initialBlocks = useMemo(() => {
    return htmlToBlocks(initialContent);
  }, [initialContent]);

  // Create editor instance
  const editor = useCreateBlockNote({
    initialContent: initialBlocks as PartialBlock[],
  });

  // Handle content changes
  const handleChange = useCallback(async () => {
    if (!onChange || !editor) return;

    // Get blocks as JSON
    const blocks = editor.document;
    const jsonContent = JSON.stringify(blocks);

    // Get HTML for display purposes
    const html = await editor.blocksToHTMLLossy(blocks);

    onChange(jsonContent, html);
  }, [editor, onChange]);

  // Set up change listener
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-[200px] bg-neutral-50 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-neutral-400">Loading editor...</span>
      </div>
    );
  }

  return (
    <>
      <style>{editorStyles}</style>
      <div className="border border-border rounded-xl overflow-hidden bg-white">
        {/* Editor help text */}
        <div className="px-4 py-2 bg-neutral-50 border-b border-neutral-200 text-xs text-neutral-500">
          <span className="font-medium">Tip:</span> Select text for formatting options (bold, italic, links) • Type <kbd className="px-1 py-0.5 bg-neutral-200 rounded text-neutral-700">/</kbd> for block commands • Drag blocks using the handle on the left
        </div>
        <BlockNoteView
          editor={editor}
          editable={editable}
          onChange={handleChange}
          theme="light"
          data-theming-css-variables-demo
        />
      </div>
    </>
  );
}

// Read-only renderer for displaying content
interface BlockRendererProps {
  content: string;
}

export function BlockRenderer({ content }: BlockRendererProps) {
  const blocks = useMemo(() => {
    return htmlToBlocks(content);
  }, [content]);

  const editor = useCreateBlockNote({
    initialContent: blocks as PartialBlock[],
  });

  return (
    <>
      <style>{editorStyles}</style>
      <div className="prose prose-neutral max-w-none">
        <BlockNoteView
          editor={editor}
          editable={false}
          theme="light"
        />
      </div>
    </>
  );
}

export default BlockEditor;
