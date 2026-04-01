"use client";

import { useState, useMemo } from "react";
import { ResourceType } from "@prisma/client";
import { ResourceCard } from "./ResourceCard";
import { SearchInput } from "./SearchInput";

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

interface ResourcesSectionProps {
  resources: Resource[];
  gradient?: string;
  showSearch?: boolean;
}

export function ResourcesSection({
  resources,
  gradient = "from-primary-500 to-primary-600",
  showSearch = true,
}: ResourcesSectionProps) {
  const [search, setSearch] = useState("");

  // Filter resources based on search
  const filteredResources = useMemo(() => {
    if (!search.trim()) return resources;
    const term = search.toLowerCase();
    return resources.filter(
      (r) =>
        r.title.toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term)
    );
  }, [resources, search]);

  if (resources.length === 0) return null;

  return (
    <section>
      {/* Section Header with Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-1 h-8 bg-gradient-to-b ${gradient} rounded-full`} />
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
            Resources
          </h2>
          <span className="px-2.5 py-1 bg-neutral-100 text-neutral-600 text-sm font-medium rounded-full">
            {filteredResources.length}{search && ` / ${resources.length}`}
          </span>
        </div>
        {showSearch && resources.length > 3 && (
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search resources..."
            className="w-full sm:w-64"
          />
        )}
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
  );
}
