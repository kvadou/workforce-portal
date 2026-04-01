"use client";

import { useState } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import {
  BoldIcon,
  ItalicIcon,
  ListBulletIcon,
  NumberedListIcon,
  ChatBubbleBottomCenterTextIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  LinkIcon,
  PhotoIcon as ImageIcon,
  H1Icon,
  H2Icon,
  H3Icon,
} from "@heroicons/react/24/outline";
import { Pilcrow } from "lucide-react";
import { PromptDialog } from "@/components/ui/prompt-dialog";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

function MenuBar({ editor }: { editor: Editor | null }) {
  const [linkPromptOpen, setLinkPromptOpen] = useState(false);
  const [imagePromptOpen, setImagePromptOpen] = useState(false);

  if (!editor) return null;

  const addLink = () => {
    setLinkPromptOpen(true);
  };

  const addImage = () => {
    setImagePromptOpen(true);
  };

  const buttonClass = (isActive: boolean) =>
    `p-2 rounded-[var(--radius-md)] transition-colors ${
      isActive
        ? "bg-primary-100 text-primary-600"
        : "text-neutral-600 hover:bg-neutral-100"
    }`;

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-neutral-50 rounded-t-[var(--radius-lg)]">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={buttonClass(editor.isActive("bold"))}
        title="Bold"
      >
        <BoldIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={buttonClass(editor.isActive("italic"))}
        title="Italic"
      >
        <ItalicIcon className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-border mx-1 self-center" />

      <button
        type="button"
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={buttonClass(editor.isActive("paragraph"))}
        title="Paragraph"
      >
        <Pilcrow className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={buttonClass(editor.isActive("heading", { level: 1 }))}
        title="Heading 1"
      >
        <H1Icon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={buttonClass(editor.isActive("heading", { level: 2 }))}
        title="Heading 2"
      >
        <H2Icon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={buttonClass(editor.isActive("heading", { level: 3 }))}
        title="Heading 3"
      >
        <H3Icon className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-border mx-1 self-center" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={buttonClass(editor.isActive("bulletList"))}
        title="Bullet List"
      >
        <ListBulletIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={buttonClass(editor.isActive("orderedList"))}
        title="Numbered List"
      >
        <NumberedListIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={buttonClass(editor.isActive("blockquote"))}
        title="Quote"
      >
        <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-border mx-1 self-center" />

      <button
        type="button"
        onClick={addLink}
        className={buttonClass(editor.isActive("link"))}
        title="Add Link"
      >
        <LinkIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={addImage}
        className={buttonClass(false)}
        title="Add Image"
      >
        <ImageIcon className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-border mx-1 self-center" />

      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className={`${buttonClass(false)} disabled:opacity-50 disabled:cursor-not-allowed`}
        title="Undo"
      >
        <ArrowUturnLeftIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className={`${buttonClass(false)} disabled:opacity-50 disabled:cursor-not-allowed`}
        title="Redo"
      >
        <ArrowUturnRightIcon className="h-4 w-4" />
      </button>

      <PromptDialog
        isOpen={linkPromptOpen}
        onClose={() => setLinkPromptOpen(false)}
        onSubmit={(url) => editor.chain().focus().setLink({ href: url }).run()}
        title="Add Link"
        placeholder="https://example.com"
      />
      <PromptDialog
        isOpen={imagePromptOpen}
        onClose={() => setImagePromptOpen(false)}
        onSubmit={(url) => editor.chain().focus().setImage({ src: url }).run()}
        title="Add Image"
        placeholder="https://example.com/image.jpg"
      />
    </div>
  );
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start typing...",
  className = "",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary-600 underline",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full rounded-[var(--radius-md)]",
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none",
      },
    },
    immediatelyRender: false, // Avoid SSR hydration mismatches
  });

  return (
    <div
      className={`border border-border rounded-[var(--radius-lg)] bg-card overflow-hidden ${className}`}
    >
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

export default RichTextEditor;
