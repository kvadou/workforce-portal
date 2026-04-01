"use client";

import React, { useState } from "react";
import { useCMS } from "@/providers/CMSProvider";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  DocumentTextIcon,
  H1Icon,
  ExclamationCircleIcon,
  ChatBubbleBottomCenterTextIcon,
  PhotoIcon,
  PlayCircleIcon,
  ArrowDownTrayIcon,
  ViewColumnsIcon,
  ChevronDownIcon,
  Square3Stack3DIcon,
  Squares2X2Icon,
  BookOpenIcon,
  AcademicCapIcon,
  TrophyIcon,
  CreditCardIcon,
  XMarkIcon,
  SparklesIcon,
  RectangleGroupIcon,
  MinusIcon,
  CalendarDaysIcon,
  MegaphoneIcon,
  StarIcon,
  Bars3Icon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

// Component definitions
export const CMS_COMPONENTS = {
  // Text Components
  richText: {
    type: "richText",
    label: "Rich Text",
    icon: DocumentTextIcon,
    category: "text",
    description: "Formatted text with headings, lists, and more",
    defaultContent: { html: "<p>Enter your text here...</p>" },
  },
  heading: {
    type: "heading",
    label: "Heading",
    icon: H1Icon,
    category: "text",
    description: "Section heading with customizable level",
    defaultContent: { text: "Heading", level: 2 },
  },
  callout: {
    type: "callout",
    label: "Callout",
    icon: ExclamationCircleIcon,
    category: "text",
    description: "Highlighted info, warning, or tip box",
    defaultContent: {
      text: "Important information here",
      variant: "info",
    },
  },
  quote: {
    type: "quote",
    label: "Quote",
    icon: ChatBubbleBottomCenterTextIcon,
    category: "text",
    description: "Blockquote with optional attribution",
    defaultContent: { text: "Quote text here", author: "" },
  },

  // Media Components
  image: {
    type: "image",
    label: "Image",
    icon: PhotoIcon,
    category: "media",
    description: "Single image with caption",
    defaultContent: { src: "", alt: "", caption: "", size: "full" },
  },
  video: {
    type: "video",
    label: "Video",
    icon: PlayCircleIcon,
    category: "media",
    description: "Embedded video from Vimeo or YouTube",
    defaultContent: { url: "", provider: "vimeo" },
  },
  fileDownload: {
    type: "fileDownload",
    label: "File Download",
    icon: ArrowDownTrayIcon,
    category: "media",
    description: "Downloadable file with button",
    defaultContent: { url: "", title: "", description: "" },
  },
  gallery: {
    type: "gallery",
    label: "Gallery",
    icon: ViewColumnsIcon,
    category: "media",
    description: "Multiple images in a grid",
    defaultContent: { images: [], columns: 3 },
  },
  canvaEmbed: {
    type: "canvaEmbed",
    label: "Canva Embed",
    icon: PhotoIcon,
    category: "media",
    description: "Embedded Canva design",
    defaultContent: { url: "", designId: "", title: "", height: "" },
  },

  // Layout Components
  columns2: {
    type: "columns",
    label: "2 Columns",
    icon: ViewColumnsIcon,
    category: "layout",
    description: "Two-column layout",
    defaultContent: { columns: 2, blocks: [[], []] },
  },
  columns3: {
    type: "columns",
    label: "3 Columns",
    icon: ViewColumnsIcon,
    category: "layout",
    description: "Three-column layout",
    defaultContent: { columns: 3, blocks: [[], [], []] },
  },
  accordion: {
    type: "accordion",
    label: "Accordion",
    icon: ChevronDownIcon,
    category: "layout",
    description: "Collapsible FAQ-style sections",
    defaultContent: {
      items: [{ title: "Section 1", content: "Content here" }],
    },
  },
  tabs: {
    type: "tabs",
    label: "Tabs",
    icon: Square3Stack3DIcon,
    category: "layout",
    description: "Tabbed content sections",
    defaultContent: { tabs: [{ title: "Tab 1", content: "Content here" }] },
  },
  cardGrid: {
    type: "cardGrid",
    label: "Card Grid",
    icon: Squares2X2Icon,
    category: "layout",
    description: "Grid of cards with images",
    defaultContent: { cards: [], columns: 3 },
  },

  // Page Components
  heroBanner: {
    type: "heroBanner",
    label: "Hero Banner",
    icon: SparklesIcon,
    category: "page",
    description: "Large banner with background image",
    defaultContent: {
      title: "Welcome to Acme Workforce!",
      subtitle: "",
      backgroundImage: "/images/hero-banner.jpg",
      overlayOpacity: 10,
      textColor: "text-primary-700",
      height: "260px",
    },
  },
  sectionHeader: {
    type: "sectionHeader",
    label: "Section Header",
    icon: DocumentTextIcon,
    category: "page",
    description: "Section title with optional icon",
    defaultContent: {
      title: "Section Title",
      subtitle: "",
      icon: "text",
      color: "primary",
      showDivider: false,
    },
  },
  spacer: {
    type: "spacer",
    label: "Spacer",
    icon: MinusIcon,
    category: "page",
    description: "Vertical spacing between sections",
    defaultContent: { height: 32 },
  },
  divider: {
    type: "divider",
    label: "Divider",
    icon: RectangleGroupIcon,
    category: "page",
    description: "Horizontal line separator",
    defaultContent: { style: "solid" },
  },
  navigationButtons: {
    type: "navigationButtons",
    label: "Navigation Buttons",
    icon: Bars3Icon,
    category: "page",
    description: "Row of navigation buttons",
    defaultContent: {
      buttons: [
        { id: "btn-1", label: "Important Dates", targetId: "", color: "primary" },
        { id: "btn-2", label: "Announcements", targetId: "", color: "green" },
      ],
      alignment: "center",
      spacing: "normal",
    },
  },

  // Announcement Components
  importantDate: {
    type: "importantDate",
    label: "Important Date",
    icon: CalendarDaysIcon,
    category: "announcements",
    description: "Date with title and description",
    defaultContent: {
      title: "Upcoming Event",
      description: "",
      date: "",
    },
  },
  announcement: {
    type: "announcement",
    label: "Announcement",
    icon: MegaphoneIcon,
    category: "announcements",
    description: "News or announcement card",
    defaultContent: {
      title: "Announcement Title",
      body: "",
      imageUrl: "",
      linkUrl: "",
      linkText: "",
    },
  },
  spotlight: {
    type: "spotlight",
    label: "Story Spotlight",
    icon: BookOpenIcon,
    category: "announcements",
    description: "Featured story highlight",
    defaultContent: {
      title: "Story Spotlight",
      body: "",
      imageUrl: "",
      linkUrl: "",
      linkText: "",
    },
  },
  review: {
    type: "review",
    label: "Tutor Review",
    icon: StarIcon,
    category: "announcements",
    description: "Testimonial with rating",
    defaultContent: {
      quote: "This is an amazing review!",
      author: "Happy Parent",
      rating: 5,
    },
  },

  // Curriculum Components
  lessonLink: {
    type: "lessonLink",
    label: "Lesson Link",
    icon: BookOpenIcon,
    category: "curriculum",
    description: "Link to a specific lesson",
    defaultContent: { lessonId: "", showThumbnail: true },
  },
  courseCard: {
    type: "courseCard",
    label: "Course Card",
    icon: AcademicCapIcon,
    category: "curriculum",
    description: "Card displaying course info",
    defaultContent: { courseId: "" },
  },
  skillBadge: {
    type: "skillBadge",
    label: "Skill Badge",
    icon: TrophyIcon,
    category: "curriculum",
    description: "Achievement or skill indicator",
    defaultContent: { title: "", description: "", color: "primary" },
  },

  // Chess Components
  chessBoard: {
    type: "chessBoard",
    label: "Chess Board",
    icon: Squares2X2Icon,
    category: "chess",
    description: "Interactive chess position",
    defaultContent: {
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      interactive: false,
    },
  },
  exercise: {
    type: "exercise",
    label: "Exercise",
    icon: TrophyIcon,
    category: "chess",
    description: "Chess puzzle or exercise",
    defaultContent: {
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      instructions: "",
      solution: "",
    },
  },

  // Resource Components
  pdfEmbed: {
    type: "pdfEmbed",
    label: "PDF Embed",
    icon: DocumentTextIcon,
    category: "resources",
    description: "Embedded PDF viewer",
    defaultContent: { url: "", height: 600 },
  },
  resourceCard: {
    type: "resourceCard",
    label: "Resource Card",
    icon: CreditCardIcon,
    category: "resources",
    description: "Card linking to a resource",
    defaultContent: { resourceId: "" },
  },
};

const CATEGORIES = [
  { id: "page", label: "Page Elements", icon: RectangleGroupIcon, color: "from-primary-500 to-primary-700" },
  { id: "announcements", label: "Announcements", icon: MegaphoneIcon, color: "from-error to-accent-pink" },
  { id: "text", label: "Text", icon: DocumentTextIcon, color: "from-info to-accent-cyan" },
  { id: "media", label: "Media", icon: PhotoIcon, color: "from-success-light to-success" },
  { id: "layout", label: "Layout", icon: ViewColumnsIcon, color: "from-warning-light to-accent-orange" },
  { id: "curriculum", label: "Curriculum", icon: BookOpenIcon, color: "from-primary-500 to-primary-600" },
  { id: "chess", label: "Chess", icon: Squares2X2Icon, color: "from-neutral-500 to-neutral-700" },
  { id: "resources", label: "Resources", icon: DocumentTextIcon, color: "from-accent-cyan to-info" },
];

// Draggable component item
function DraggableComponent({
  component,
}: {
  component: (typeof CMS_COMPONENTS)[keyof typeof CMS_COMPONENTS];
}) {
  const { addBlock } = useCMS();
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `new-${component.type}`,
      data: {
        type: "new-component",
        componentType: component.type,
        defaultContent: component.defaultContent,
      },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = component.icon;

  // Track if we started dragging to prevent click from firing
  const dragStartedRef = React.useRef(false);

  // Custom pointer down handler to track drag initiation
  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartedRef.current = false;
    listeners?.onPointerDown?.(e as unknown as PointerEvent);
  };

  // Click to add at the end (only if not dragging)
  const handleClick = () => {
    // Only add on click if we didn't drag
    if (!dragStartedRef.current && !isDragging) {
      addBlock({
        type: component.type,
        content: { ...component.defaultContent },
      });
    }
  };

  // Track when drag actually starts (after distance threshold)
  React.useEffect(() => {
    if (isDragging) {
      dragStartedRef.current = true;
    }
  }, [isDragging]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-xl cursor-grab hover:border-primary-300 hover:bg-primary-50/50 hover:shadow-sm transition-all duration-200 active:cursor-grabbing touch-none group"
    >
      <div className="h-10 w-10 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-lg flex items-center justify-center group-hover:from-primary-100 group-hover:to-primary-200 transition-colors">
        <Icon className="h-5 w-5 text-neutral-600 group-hover:text-primary-600 transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-neutral-800 block">
          {component.label}
        </span>
        <span className="text-xs text-neutral-500 line-clamp-1">
          {component.description}
        </span>
      </div>
    </div>
  );
}

export function ComponentPanel() {
  const { isAdmin, editMode, componentPanelOpen, setComponentPanelOpen } =
    useCMS();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["page", "announcements"])
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Only show for admins in edit mode
  if (!isAdmin || !editMode || !componentPanelOpen) {
    return null;
  }

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filter components by search
  const filteredComponents = searchQuery
    ? Object.values(CMS_COMPONENTS).filter(
        (c) =>
          c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 sm:hidden"
        onClick={() => setComponentPanelOpen(false)}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-16 w-full sm:w-80 bg-white shadow-modal border-l border-neutral-200 z-40 overflow-hidden flex flex-col sm:rounded-none rounded-t-2xl sm:top-0 max-h-[70vh] sm:max-h-none sm:bottom-16">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white">
          <div>
            <h2 className="font-bold text-neutral-900">Add Components</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Click or drag to add
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setComponentPanelOpen(false)}
            className="text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-full h-8 w-8 p-0"
          >
            <XMarkIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-neutral-100">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all"
            />
          </div>
        </div>

        {/* Component List */}
        <div className="flex-1 overflow-y-auto">
          {searchQuery && filteredComponents ? (
            // Search results
            <div className="p-4 space-y-2">
              {filteredComponents.length > 0 ? (
                filteredComponents.map((component) => (
                  <DraggableComponent
                    key={component.label}
                    component={component}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <MagnifyingGlassIcon className="h-10 w-10 mx-auto mb-3 text-neutral-200" />
                  <p className="text-neutral-500 text-sm">No components found</p>
                </div>
              )}
            </div>
          ) : (
            // Categories
            <div className="divide-y divide-neutral-100">
              {CATEGORIES.map((category) => {
                const components = Object.values(CMS_COMPONENTS).filter(
                  (c) => c.category === category.id
                );
                if (components.length === 0) return null;

                const CategoryIcon = category.icon;
                const isExpanded = expandedCategories.has(category.id);

                return (
                  <div key={category.id}>
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center shadow-sm`}>
                          <CategoryIcon className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-semibold text-neutral-800 text-sm">
                          {category.label}
                        </span>
                        <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
                          {components.length}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUpIcon className="h-4 w-4 text-neutral-400" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4 text-neutral-400" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-2">
                        {components.map((component) => (
                          <DraggableComponent
                            key={component.label}
                            component={component}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer tip */}
        <div className="px-4 py-3 bg-gradient-to-r from-primary-50 to-primary-50 border-t border-primary-100 text-xs text-primary-700">
          <span className="font-medium">Tip:</span> Click a component to add it at the end, or drag it to a specific position.
        </div>
      </div>
    </>
  );
}
