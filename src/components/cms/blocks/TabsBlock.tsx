"use client";

import { useState } from "react";
import { CMSBlock, useCMS } from "@/providers/CMSProvider";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

interface Tab {
  id: string;
  title: string;
  content: string;
}

interface TabsBlockProps {
  block: CMSBlock;
  isEditing: boolean;
}

export function TabsBlock({ block, isEditing }: TabsBlockProps) {
  const { updateBlock } = useCMS();
  const content = block.content as { tabs: Tab[] };
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const tabs = content.tabs || [];
  const currentTab = activeTab || tabs[0]?.id;

  const addTab = () => {
    const newTab: Tab = {
      id: `tab_${Date.now()}`,
      title: `Tab ${tabs.length + 1}`,
      content: "Content here...",
    };
    updateBlock(block.id, { tabs: [...tabs, newTab] });
  };

  const updateTab = (id: string, updates: Partial<Tab>) => {
    updateBlock(block.id, {
      tabs: tabs.map((tab) => (tab.id === id ? { ...tab, ...updates } : tab)),
    });
  };

  const removeTab = (id: string) => {
    const newTabs = tabs.filter((tab) => tab.id !== id);
    updateBlock(block.id, { tabs: newTabs });
    if (currentTab === id && newTabs.length > 0) {
      setActiveTab(newTabs[0].id);
    }
  };

  if (isEditing) {
    return (
      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        {/* Tab headers */}
        <div className="flex items-center gap-1 p-2 bg-neutral-50 border-b border-neutral-200 flex-wrap">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
                currentTab === tab.id
                  ? "bg-white shadow-sm border border-neutral-200"
                  : "hover:bg-neutral-100"
              }`}
            >
              <input
                type="text"
                value={tab.title}
                onChange={(e) => updateTab(tab.id, { title: e.target.value })}
                onClick={() => setActiveTab(tab.id)}
                className="bg-transparent border-none outline-none w-20 text-center"
              />
              {tabs.length > 1 && (
                <button
                  onClick={() => removeTab(tab.id)}
                  className="p-0.5 text-neutral-400 hover:text-error"
                >
                  <TrashIcon className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addTab}
            className="p-1.5 text-neutral-400 hover:text-primary-500 hover:bg-neutral-100 rounded"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Tab content */}
        <div className="p-4">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={currentTab === tab.id ? "block" : "hidden"}
            >
              <textarea
                value={tab.content}
                onChange={(e) => updateTab(tab.id, { content: e.target.value })}
                className="w-full min-h-[120px] p-2 text-sm border border-neutral-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-300 resize-y"
                placeholder="Tab content..."
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // View mode
  if (tabs.length === 0) return null;

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden my-6">
      {/* Tab headers */}
      <div className="flex gap-1 p-2 bg-neutral-50 border-b border-neutral-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              currentTab === tab.id
                ? "bg-white shadow-sm text-primary-600 border border-neutral-200"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={currentTab === tab.id ? "block" : "hidden"}
          >
            <div className="prose prose-sm max-w-none text-neutral-700">
              {tab.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
