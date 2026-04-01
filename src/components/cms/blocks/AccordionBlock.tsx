"use client";

import { useState } from "react";
import { CMSBlock, useCMS } from "@/providers/CMSProvider";
import { ChevronDownIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

interface AccordionItem {
  id: string;
  title: string;
  content: string;
}

interface AccordionBlockProps {
  block: CMSBlock;
  isEditing: boolean;
}

export function AccordionBlock({ block, isEditing }: AccordionBlockProps) {
  const { updateBlock } = useCMS();
  const content = block.content as { items: AccordionItem[] };
  const [openItems, setOpenItems] = useState<string[]>([]);

  const items = content.items || [];

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const addItem = () => {
    const newItem: AccordionItem = {
      id: `acc_${Date.now()}`,
      title: "New Section",
      content: "Content here...",
    };
    updateBlock(block.id, { items: [...items, newItem] });
  };

  const updateItem = (id: string, updates: Partial<AccordionItem>) => {
    updateBlock(block.id, {
      items: items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    });
  };

  const removeItem = (id: string) => {
    updateBlock(block.id, {
      items: items.filter((item) => item.id !== id),
    });
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="border border-neutral-200 rounded-lg overflow-hidden"
          >
            <div className="flex items-center gap-2 p-3 bg-neutral-50">
              <input
                type="text"
                value={item.title}
                onChange={(e) => updateItem(item.id, { title: e.target.value })}
                className="flex-1 px-2 py-1 text-sm font-medium bg-white border border-neutral-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-300"
                placeholder="Section title"
              />
              <button
                onClick={() => removeItem(item.id)}
                className="p-1 text-neutral-400 hover:text-error"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3">
              <textarea
                value={item.content}
                onChange={(e) =>
                  updateItem(item.id, { content: e.target.value })
                }
                className="w-full min-h-[80px] p-2 text-sm border border-neutral-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-300 resize-y"
                placeholder="Section content..."
              />
            </div>
          </div>
        ))}

        <Button variant="outline" size="sm" onClick={addItem} className="w-full">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>
    );
  }

  // View mode
  if (items.length === 0) return null;

  return (
    <div className="space-y-2 my-6">
      {items.map((item) => (
        <div
          key={item.id}
          className="border border-neutral-200 rounded-lg overflow-hidden"
        >
          <button
            onClick={() => toggleItem(item.id)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50 transition-colors"
          >
            <span className="font-medium text-neutral-900">{item.title}</span>
            <ChevronDownIcon
              className={`h-5 w-5 text-neutral-400 transition-transform ${
                openItems.includes(item.id) ? "rotate-180" : ""
              }`}
            />
          </button>
          {openItems.includes(item.id) && (
            <div className="p-4 pt-0 text-neutral-600">{item.content}</div>
          )}
        </div>
      ))}
    </div>
  );
}
