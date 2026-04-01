"use client";

import { useEffect, useRef } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useCMS, CMSBlock } from "@/providers/CMSProvider";
import { DropZone, DropIndicator } from "./DropZone";
import { SortableBlock } from "./SortableBlock";

// Block Components - imported for rendering
import { PlusIcon } from "@heroicons/react/24/outline";
import { RichTextBlock } from "./blocks/RichTextBlock";
import { HeadingBlock } from "./blocks/HeadingBlock";
import { CalloutBlock } from "./blocks/CalloutBlock";
import { QuoteBlock } from "./blocks/QuoteBlock";
import { ImageBlock } from "./blocks/ImageBlock";
import { VideoBlock } from "./blocks/VideoBlock";
import { FileDownloadBlock } from "./blocks/FileDownloadBlock";
import { GalleryBlock } from "./blocks/GalleryBlock";
import { ColumnsBlock } from "./blocks/ColumnsBlock";
import { AccordionBlock } from "./blocks/AccordionBlock";
import { TabsBlock } from "./blocks/TabsBlock";
import { CardGridBlock } from "./blocks/CardGridBlock";
import { LessonLinkBlock } from "./blocks/LessonLinkBlock";
import { CourseCardBlock } from "./blocks/CourseCardBlock";
import { SkillBadgeBlock } from "./blocks/SkillBadgeBlock";
import { ChessBoardBlock } from "./blocks/ChessBoardBlock";
import { ExerciseBlock } from "./blocks/ExerciseBlock";
import { PDFEmbedBlock } from "./blocks/PDFEmbedBlock";
import { CanvaEmbedBlock } from "./blocks/CanvaEmbedBlock";
import { ResourceCardBlock } from "./blocks/ResourceCardBlock";
import { HeroBannerBlock } from "./blocks/HeroBannerBlock";
import { SpacerBlock } from "./blocks/SpacerBlock";
import { DividerBlock } from "./blocks/DividerBlock";
import { SectionHeaderBlock } from "./blocks/SectionHeaderBlock";
import { ImportantDateBlock } from "./blocks/ImportantDateBlock";
import { AnnouncementBlock } from "./blocks/AnnouncementBlock";
import { SpotlightBlock } from "./blocks/SpotlightBlock";
import { ReviewBlock } from "./blocks/ReviewBlock";
import { NavigationButtonsBlock } from "./blocks/NavigationButtonsBlock";

// Block type to component map
const BLOCK_COMPONENTS: Record<string, React.ComponentType<{ block: CMSBlock; isEditing: boolean }>> = {
  richText: RichTextBlock,
  heading: HeadingBlock,
  callout: CalloutBlock,
  quote: QuoteBlock,
  image: ImageBlock,
  video: VideoBlock,
  fileDownload: FileDownloadBlock,
  gallery: GalleryBlock,
  columns: ColumnsBlock,
  accordion: AccordionBlock,
  tabs: TabsBlock,
  cardGrid: CardGridBlock,
  lessonLink: LessonLinkBlock,
  courseCard: CourseCardBlock,
  skillBadge: SkillBadgeBlock,
  chessBoard: ChessBoardBlock,
  exercise: ExerciseBlock,
  pdfEmbed: PDFEmbedBlock,
  canvaEmbed: CanvaEmbedBlock,
  resourceCard: ResourceCardBlock,
  heroBanner: HeroBannerBlock,
  spacer: SpacerBlock,
  divider: DividerBlock,
  sectionHeader: SectionHeaderBlock,
  importantDate: ImportantDateBlock,
  announcement: AnnouncementBlock,
  spotlight: SpotlightBlock,
  review: ReviewBlock,
  navigationButtons: NavigationButtonsBlock,
};

interface CMSPageRendererProps {
  pageType: string;
  pageId: string;
  className?: string;
}

// Helper function to group consecutive blocks of certain types
function renderGroupedBlocks(
  blocks: CMSBlock[],
  renderBlock: (block: CMSBlock) => React.ReactNode
): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    // Check if this is an importantDate block - group consecutive ones
    if (block.type === "importantDate") {
      const dateBlocks: CMSBlock[] = [];
      while (i < blocks.length && blocks[i].type === "importantDate") {
        dateBlocks.push(blocks[i]);
        i++;
      }

      // Render grouped important dates in styled card (header comes from SectionHeaderBlock)
      result.push(
        <div
          key={`date-group-${dateBlocks[0].id}`}
          className="bg-white rounded-2xl shadow-sm shadow-error-light/30 border border-error overflow-hidden scroll-mt-24"
          id="dates"
        >
          {/* Timeline items */}
          <div className="divide-y divide-error-light">
            {dateBlocks.map((dateBlock) => (
              <div key={dateBlock.id}>{renderBlock(dateBlock)}</div>
            ))}
          </div>
        </div>
      );
    }
    // Check if this is a review block - group consecutive ones
    else if (block.type === "review") {
      const reviewBlocks: CMSBlock[] = [];
      while (i < blocks.length && blocks[i].type === "review") {
        reviewBlocks.push(blocks[i]);
        i++;
      }

      // Render grouped reviews (header comes from SectionHeaderBlock)
      result.push(
        <section
          key={`review-group-${reviewBlocks[0].id}`}
          className="scroll-mt-24"
          id="reviews"
        >
          {/* Reviews grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviewBlocks.map((reviewBlock, idx) => (
              <div key={reviewBlock.id} data-review-index={idx}>{renderBlock(reviewBlock)}</div>
            ))}
          </div>
        </section>
      );
    }
    // Check if this is an announcement block - group consecutive ones
    else if (block.type === "announcement") {
      const announcementBlocks: CMSBlock[] = [];
      while (i < blocks.length && blocks[i].type === "announcement") {
        announcementBlocks.push(blocks[i]);
        i++;
      }

      // Render grouped announcements (header comes from SectionHeaderBlock)
      result.push(
        <section
          key={`announcement-group-${announcementBlocks[0].id}`}
          className="scroll-mt-24"
          id="announcements"
        >
          {/* Announcements */}
          <div className="space-y-5">
            {announcementBlocks.map((announcementBlock) => (
              <div key={announcementBlock.id}>{renderBlock(announcementBlock)}</div>
            ))}
          </div>
        </section>
      );
    }
    // Check if this is a spotlight block - group consecutive ones
    else if (block.type === "spotlight") {
      const spotlightBlocks: CMSBlock[] = [];
      while (i < blocks.length && blocks[i].type === "spotlight") {
        spotlightBlocks.push(blocks[i]);
        i++;
      }

      // Render grouped spotlights (header comes from SectionHeaderBlock)
      result.push(
        <section
          key={`spotlight-group-${spotlightBlocks[0].id}`}
          className="scroll-mt-24"
          id="spotlights"
        >
          {/* Spotlights */}
          <div className="space-y-5">
            {spotlightBlocks.map((spotlightBlock) => (
              <div key={spotlightBlock.id}>{renderBlock(spotlightBlock)}</div>
            ))}
          </div>
        </section>
      );
    }
    // Regular block - render normally
    else {
      result.push(<div key={block.id}>{renderBlock(block)}</div>);
      i++;
    }
  }

  return result;
}

export function CMSPageRenderer({
  pageType,
  pageId,
  className = "",
}: CMSPageRendererProps) {
  const {
    isAdmin,
    editMode,
    blocks,
    loadContent,
    setCurrentPage,
    isLoading,
    hasInitialized,
    addBlock,
  } = useCMS();

  const loadingRef = useRef(false);

  // Set current page and load content on mount
  useEffect(() => {
    // Prevent double loading in strict mode
    if (loadingRef.current) return;
    loadingRef.current = true;

    setCurrentPage(pageType, pageId);
    loadContent(pageType, pageId);

    return () => {
      loadingRef.current = false;
    };
  }, [pageType, pageId, setCurrentPage, loadContent]);

  // Show skeleton until first load completes
  if (!hasInitialized || isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="h-8 bg-neutral-200/60 rounded w-3/4 animate-pulse"></div>
        <div className="h-4 bg-neutral-200/60 rounded w-full animate-pulse" style={{ animationDelay: '100ms' }}></div>
        <div className="h-4 bg-neutral-200/60 rounded w-5/6 animate-pulse" style={{ animationDelay: '200ms' }}></div>
        <div className="h-32 bg-neutral-200/60 rounded animate-pulse" style={{ animationDelay: '300ms' }}></div>
      </div>
    );
  }

  const isEditing = isAdmin && editMode;

  // Render a single block
  const renderBlock = (block: CMSBlock) => {
    const BlockComponent = BLOCK_COMPONENTS[block.type];
    if (!BlockComponent) {
      return (
        <div className="p-4 bg-error-light text-error rounded-lg">
          Unknown block type: {block.type}
        </div>
      );
    }
    return <BlockComponent block={block} isEditing={isEditing} />;
  };

  return (
    <div className={`cms-page-content ${className}`}>
      {isEditing ? (
        <SortableContext
          items={blocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <DropZone id="main-dropzone" className="pl-14 space-y-2">
            {(() => {
              const elements: React.ReactNode[] = [];
              let i = 0;

              while (i < blocks.length) {
                const block = blocks[i];
                const blockIndex = i;

                // Group consecutive importantDate blocks visually
                if (block.type === "importantDate") {
                  const dateBlocks: { block: CMSBlock; index: number }[] = [];
                  while (i < blocks.length && blocks[i].type === "importantDate") {
                    dateBlocks.push({ block: blocks[i], index: i });
                    i++;
                  }
                  // Capture the insert index (after last date block)
                  const insertAtIndex = i;

                  elements.push(
                    <div key={`edit-date-group-${dateBlocks[0].block.id}`} className="space-y-1">
                      {/* Group header */}
                      <div className="flex items-center gap-2 px-2 py-1">
                        <div className="h-2 w-2 rounded-full bg-error"></div>
                        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                          Important Dates ({dateBlocks.length})
                        </span>
                      </div>
                      {/* Grouped container */}
                      <div className="bg-white rounded-xl border border-error overflow-hidden shadow-sm">
                        {dateBlocks.map(({ block: dateBlock, index: dateIndex }, groupIdx) => (
                          <div key={dateBlock.id} className={groupIdx > 0 ? "border-t border-error" : ""}>
                            <DropIndicator id={`indicator-${dateIndex}`} index={dateIndex} />
                            <SortableBlock block={dateBlock}>
                              {renderBlock(dateBlock)}
                            </SortableBlock>
                          </div>
                        ))}
                      </div>
                      {/* Add Date button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addBlock({ type: "importantDate", content: { title: "", description: "", date: "" } }, insertAtIndex);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm text-error hover:text-error hover:bg-error-light rounded-lg border border-dashed border-error hover:border-error transition-colors"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Add Date
                      </button>
                    </div>
                  );
                }
                // Group consecutive review blocks visually
                else if (block.type === "review") {
                  const reviewBlocks: { block: CMSBlock; index: number }[] = [];
                  while (i < blocks.length && blocks[i].type === "review") {
                    reviewBlocks.push({ block: blocks[i], index: i });
                    i++;
                  }
                  // Capture the insert index (after last review block)
                  const insertAtIndex = i;

                  elements.push(
                    <div key={`edit-review-group-${reviewBlocks[0].block.id}`} className="space-y-1">
                      {/* Group header */}
                      <div className="flex items-center gap-2 px-2 py-1">
                        <div className="h-2 w-2 rounded-full bg-primary-400"></div>
                        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                          Tutor Reviews ({reviewBlocks.length})
                        </span>
                      </div>
                      {/* Grouped container */}
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {reviewBlocks.map(({ block: reviewBlock, index: reviewIndex }) => (
                          <div key={reviewBlock.id}>
                            <DropIndicator id={`indicator-${reviewIndex}`} index={reviewIndex} />
                            <SortableBlock block={reviewBlock}>
                              {renderBlock(reviewBlock)}
                            </SortableBlock>
                          </div>
                        ))}
                      </div>
                      {/* Add Review button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addBlock({ type: "review", content: { quote: "", author: "", rating: 5 } }, insertAtIndex);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm text-primary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg border border-dashed border-primary-200 hover:border-primary-300 transition-colors"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Add Review
                      </button>
                    </div>
                  );
                }
                // Group consecutive announcement blocks visually
                else if (block.type === "announcement") {
                  const announcementBlocks: { block: CMSBlock; index: number }[] = [];
                  while (i < blocks.length && blocks[i].type === "announcement") {
                    announcementBlocks.push({ block: blocks[i], index: i });
                    i++;
                  }
                  // Capture the insert index (after last announcement block)
                  const insertAtIndex = i;

                  elements.push(
                    <div key={`edit-announcement-group-${announcementBlocks[0].block.id}`} className="space-y-1">
                      {/* Group header */}
                      <div className="flex items-center gap-2 px-2 py-1">
                        <div className="h-2 w-2 rounded-full bg-success"></div>
                        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                          Announcements ({announcementBlocks.length})
                        </span>
                      </div>
                      {/* Grouped container */}
                      <div className="space-y-2">
                        {announcementBlocks.map(({ block: announcementBlock, index: announcementIndex }) => (
                          <div key={announcementBlock.id}>
                            <DropIndicator id={`indicator-${announcementIndex}`} index={announcementIndex} />
                            <SortableBlock block={announcementBlock}>
                              {renderBlock(announcementBlock)}
                            </SortableBlock>
                          </div>
                        ))}
                      </div>
                      {/* Add Announcement button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addBlock({ type: "announcement", content: { title: "", content: "", priority: "normal" } }, insertAtIndex);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm text-success hover:text-success hover:bg-success-light rounded-lg border border-dashed border-success hover:border-success transition-colors"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Add Announcement
                      </button>
                    </div>
                  );
                }
                // Group consecutive spotlight blocks visually
                else if (block.type === "spotlight") {
                  const spotlightBlocks: { block: CMSBlock; index: number }[] = [];
                  while (i < blocks.length && blocks[i].type === "spotlight") {
                    spotlightBlocks.push({ block: blocks[i], index: i });
                    i++;
                  }
                  // Capture the insert index (after last spotlight block)
                  const insertAtIndex = i;

                  elements.push(
                    <div key={`edit-spotlight-group-${spotlightBlocks[0].block.id}`} className="space-y-1">
                      {/* Group header */}
                      <div className="flex items-center gap-2 px-2 py-1">
                        <div className="h-2 w-2 rounded-full bg-warning"></div>
                        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                          Spotlights ({spotlightBlocks.length})
                        </span>
                      </div>
                      {/* Grouped container */}
                      <div className="space-y-2">
                        {spotlightBlocks.map(({ block: spotlightBlock, index: spotlightIndex }) => (
                          <div key={spotlightBlock.id}>
                            <DropIndicator id={`indicator-${spotlightIndex}`} index={spotlightIndex} />
                            <SortableBlock block={spotlightBlock}>
                              {renderBlock(spotlightBlock)}
                            </SortableBlock>
                          </div>
                        ))}
                      </div>
                      {/* Add Spotlight button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addBlock({ type: "spotlight", content: { title: "", content: "", linkUrl: "" } }, insertAtIndex);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm text-warning hover:text-warning hover:bg-warning-light rounded-lg border border-dashed border-warning hover:border-warning transition-colors"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Add Spotlight
                      </button>
                    </div>
                  );
                }
                // Regular block
                else {
                  elements.push(
                    <div key={block.id}>
                      <DropIndicator id={`indicator-${blockIndex}`} index={blockIndex} />
                      <SortableBlock block={block}>
                        {renderBlock(block)}
                      </SortableBlock>
                    </div>
                  );
                  i++;
                }
              }

              // Final drop indicator
              elements.push(
                <DropIndicator
                  key="final-indicator"
                  id={`indicator-${blocks.length}`}
                  index={blocks.length}
                />
              );

              return elements;
            })()}
          </DropZone>
        </SortableContext>
      ) : (
        // View mode - no drag/drop, no edit UI, with smart grouping
        <div className="space-y-3 sm:space-y-4">
          {renderGroupedBlocks(blocks, renderBlock)}

          {blocks.length === 0 && !isAdmin && (
            <div className="text-neutral-500 text-center py-8">
              No content yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
