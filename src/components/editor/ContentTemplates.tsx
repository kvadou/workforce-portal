"use client";

import { PartialBlock } from "@blocknote/core";
import {
  DocumentTextIcon,
  PlayCircleIcon,
  PhotoIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleLeftIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  ExclamationCircleIcon,
  LinkIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: "basic" | "teaching" | "announcement" | "resource";
  blocks: PartialBlock[];
}

export const contentTemplates: ContentTemplate[] = [
  // Basic Templates
  {
    id: "blank",
    name: "Blank Page",
    description: "Start with a blank page",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    category: "basic",
    blocks: [{ type: "paragraph", content: "" }],
  },
  {
    id: "heading-text",
    name: "Heading + Text",
    description: "A heading followed by paragraph text",
    icon: <Squares2X2Icon className="h-5 w-5" />,
    category: "basic",
    blocks: [
      { type: "heading", props: { level: 2 }, content: "Your Heading Here" },
      { type: "paragraph", content: "Start writing your content here..." },
    ],
  },

  // Teaching Templates
  {
    id: "lesson-guide",
    name: "Lesson Guide",
    description: "Template for teaching instructions",
    icon: <BookOpenIcon className="h-5 w-5" />,
    category: "teaching",
    blocks: [
      { type: "heading", props: { level: 1 }, content: "Lesson Title" },
      { type: "heading", props: { level: 2 }, content: "📋 Overview" },
      { type: "paragraph", content: "Brief description of what this lesson covers..." },
      { type: "heading", props: { level: 2 }, content: "🎯 Learning Objectives" },
      { type: "bulletListItem", content: "Objective 1" },
      { type: "bulletListItem", content: "Objective 2" },
      { type: "bulletListItem", content: "Objective 3" },
      { type: "heading", props: { level: 2 }, content: "📝 Instructions" },
      { type: "numberedListItem", content: "Step 1: Introduction" },
      { type: "numberedListItem", content: "Step 2: Main Activity" },
      { type: "numberedListItem", content: "Step 3: Practice" },
      { type: "numberedListItem", content: "Step 4: Wrap Up" },
      { type: "heading", props: { level: 2 }, content: "💡 Tips" },
      { type: "paragraph", content: "Add helpful tips for tutors here..." },
    ],
  },
  {
    id: "video-resource",
    name: "Video Resource",
    description: "Template for video tutorials",
    icon: <PlayCircleIcon className="h-5 w-5" />,
    category: "teaching",
    blocks: [
      { type: "heading", props: { level: 1 }, content: "Video Title" },
      { type: "paragraph", content: "Brief description of what this video covers..." },
      { type: "paragraph", content: "[Video embed will appear here]" },
      { type: "heading", props: { level: 2 }, content: "Key Points" },
      { type: "bulletListItem", content: "Point 1" },
      { type: "bulletListItem", content: "Point 2" },
      { type: "bulletListItem", content: "Point 3" },
      { type: "heading", props: { level: 2 }, content: "Related Resources" },
      { type: "bulletListItem", content: "Link to related resource" },
    ],
  },
  {
    id: "activity-guide",
    name: "Activity Guide",
    description: "Template for mini games and activities",
    icon: <ClipboardDocumentCheckIcon className="h-5 w-5" />,
    category: "teaching",
    blocks: [
      { type: "heading", props: { level: 1 }, content: "Activity Name" },
      { type: "heading", props: { level: 2 }, content: "🎮 What You'll Need" },
      { type: "bulletListItem", content: "Material 1" },
      { type: "bulletListItem", content: "Material 2" },
      { type: "heading", props: { level: 2 }, content: "📋 Setup" },
      { type: "paragraph", content: "Describe how to set up the activity..." },
      { type: "heading", props: { level: 2 }, content: "🎯 How to Play" },
      { type: "numberedListItem", content: "Step 1" },
      { type: "numberedListItem", content: "Step 2" },
      { type: "numberedListItem", content: "Step 3" },
      { type: "heading", props: { level: 2 }, content: "🏆 Variations" },
      { type: "paragraph", content: "Describe variations for different skill levels..." },
    ],
  },

  // Announcement Templates
  {
    id: "announcement",
    name: "General Announcement",
    description: "Template for announcements",
    icon: <ChatBubbleLeftIcon className="h-5 w-5" />,
    category: "announcement",
    blocks: [
      { type: "heading", props: { level: 2 }, content: "Announcement Title" },
      { type: "paragraph", content: "Write your announcement message here..." },
      { type: "paragraph", content: "" },
      { type: "paragraph", content: "For questions, contact [name] at [email]." },
    ],
  },
  {
    id: "important-date",
    name: "Important Date",
    description: "Template for date announcements",
    icon: <CalendarDaysIcon className="h-5 w-5" />,
    category: "announcement",
    blocks: [
      { type: "heading", props: { level: 2 }, content: "📅 Event Name" },
      { type: "paragraph", content: "Date: [Insert date]" },
      { type: "paragraph", content: "Time: [Insert time]" },
      { type: "paragraph", content: "" },
      { type: "paragraph", content: "Description of the event or important date..." },
    ],
  },
  {
    id: "alert",
    name: "Alert / Notice",
    description: "Template for urgent notices",
    icon: <ExclamationCircleIcon className="h-5 w-5" />,
    category: "announcement",
    blocks: [
      { type: "heading", props: { level: 2 }, content: "⚠️ Important Notice" },
      { type: "paragraph", content: "Describe the important notice here..." },
      { type: "heading", props: { level: 3 }, content: "What You Need to Do" },
      { type: "bulletListItem", content: "Action item 1" },
      { type: "bulletListItem", content: "Action item 2" },
      { type: "paragraph", content: "" },
      { type: "paragraph", content: "If you have questions, please contact..." },
    ],
  },

  // Resource Templates
  {
    id: "resource-page",
    name: "Resource Page",
    description: "Template for resource listings",
    icon: <LinkIcon className="h-5 w-5" />,
    category: "resource",
    blocks: [
      { type: "heading", props: { level: 1 }, content: "Resource Category" },
      { type: "paragraph", content: "Description of resources in this category..." },
      { type: "heading", props: { level: 2 }, content: "Available Resources" },
      { type: "bulletListItem", content: "Resource 1 - Description" },
      { type: "bulletListItem", content: "Resource 2 - Description" },
      { type: "bulletListItem", content: "Resource 3 - Description" },
      { type: "heading", props: { level: 2 }, content: "How to Use" },
      { type: "paragraph", content: "Instructions for using these resources..." },
    ],
  },
  {
    id: "image-gallery",
    name: "Image Gallery",
    description: "Template for image-heavy content",
    icon: <PhotoIcon className="h-5 w-5" />,
    category: "resource",
    blocks: [
      { type: "heading", props: { level: 1 }, content: "Gallery Title" },
      { type: "paragraph", content: "Description of this gallery..." },
      { type: "paragraph", content: "[Add images using the / command]" },
      { type: "paragraph", content: "" },
      { type: "heading", props: { level: 2 }, content: "Download Links" },
      { type: "bulletListItem", content: "Download link 1" },
      { type: "bulletListItem", content: "Download link 2" },
    ],
  },
];

// Get templates by category
export function getTemplatesByCategory(category: ContentTemplate["category"]) {
  return contentTemplates.filter((t) => t.category === category);
}

// Template selector component
interface TemplateSelectorProps {
  onSelect: (template: ContentTemplate) => void;
  category?: ContentTemplate["category"];
}

export function TemplateSelector({ onSelect, category }: TemplateSelectorProps) {
  const templates = category
    ? getTemplatesByCategory(category)
    : contentTemplates;

  const categories = category
    ? [category]
    : (["basic", "teaching", "announcement", "resource"] as const);

  return (
    <div className="space-y-6">
      {categories.map((cat) => {
        const catTemplates = templates.filter((t) => t.category === cat);
        if (catTemplates.length === 0) return null;

        return (
          <div key={cat}>
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
              {cat === "basic" && "Basic"}
              {cat === "teaching" && "Teaching Resources"}
              {cat === "announcement" && "Announcements"}
              {cat === "resource" && "Resource Pages"}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {catTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => onSelect(template)}
                  className="flex items-start gap-3 p-4 bg-white border border-neutral-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-colors text-left group"
                >
                  <div className="h-10 w-10 bg-neutral-100 group-hover:bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 text-neutral-600 group-hover:text-primary-600">
                    {template.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-900 truncate">
                      {template.name}
                    </p>
                    <p className="text-sm text-neutral-500 line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TemplateSelector;
