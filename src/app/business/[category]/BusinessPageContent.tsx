"use client";

import { useState, useMemo } from "react";
import { ResourceType } from "@prisma/client";
import { CMSWrapper } from "@/components/cms/CMSWrapper";
import { CMSPageRenderer } from "@/components/cms/CMSPageRenderer";
import { ResourceCard } from "@/components/shared/ResourceCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/shared/SearchInput";
import { BriefcaseIcon } from "@heroicons/react/24/outline";
interface Resource {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  url: string | null;
  fileUrl: string | null;
  type: ResourceType;
  order: number;
}

interface BusinessPageContentProps {
  category: string;
  categoryInfo: {
    label: string;
    dbCategory: string;
    description: string;
  };
  mainResource: Resource | undefined;
  subResources: Resource[];
  typeIcons: Record<ResourceType, React.ReactNode>;
  typeColors: Record<ResourceType, string>;
}

export function BusinessPageContent({
  category,
  categoryInfo,
  mainResource,
  subResources,
}: BusinessPageContentProps) {
  const pageType = "business";
  const pageId = category;
  const [search, setSearch] = useState("");

  // Filter resources based on search
  const filteredResources = useMemo(() => {
    if (!search.trim()) return subResources;
    const term = search.toLowerCase();
    return subResources.filter(
      (r) =>
        r.title.toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term)
    );
  }, [subResources, search]);

  return (
    <CMSWrapper pageType={pageType} pageId={pageId}>
      {/* CMS Editable Content Area - Full width, no card wrapper */}
      <div className="mb-8">
        <CMSPageRenderer
          pageType={pageType}
          pageId={pageId}
        />
      </div>

      {/* Resources Section */}
      {subResources.length > 0 ? (
        <section>
          {/* Section Header with Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-success-light to-success rounded-full" />
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
                Resources
              </h2>
              <span className="px-2.5 py-1 bg-neutral-100 text-neutral-600 text-sm font-medium rounded-full">
                {filteredResources.length}{search && ` / ${subResources.length}`}
              </span>
            </div>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search resources..."
              className="w-full sm:w-64"
            />
          </div>

          {/* Resource Grid - Responsive */}
          {filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredResources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-neutral-500">No resources match "{search}"</p>
              <button
                onClick={() => setSearch("")}
                className="mt-2 text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear search
              </button>
            </div>
          )}
        </section>
      ) : !mainResource ? (
        <EmptyState
          icon={BriefcaseIcon}
          title="Coming Soon"
          description={`Resources for ${categoryInfo.label} will be added soon. Check back later!`}
          gradient="from-success to-success"
        />
      ) : null}
    </CMSWrapper>
  );
}
