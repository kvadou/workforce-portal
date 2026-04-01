"use client";

import { useState, useEffect } from "react";
import { CMSBlock, useCMS } from "@/providers/CMSProvider";
import {
  FolderIcon,
  ArrowTopRightOnSquareIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  PhotoIcon,
  PlayCircleIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface ResourceCardBlockProps {
  block: CMSBlock;
  isEditing: boolean;
}

interface Resource {
  id: string;
  title: string;
  description: string | null;
  category: string;
  fileUrl: string | null;
  externalUrl: string | null;
  type: string;
  thumbnail: string | null;
}

const FILE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pdf: DocumentTextIcon,
  image: PhotoIcon,
  video: PlayCircleIcon,
  document: DocumentTextIcon,
  default: DocumentIcon,
};

const CATEGORY_COLORS: Record<string, string> = {
  teaching: "bg-info-light text-info-dark",
  business: "bg-success-light text-success-dark",
  marketing: "bg-primary-100 text-primary-700",
  training: "bg-accent-orange-light text-accent-orange",
  default: "bg-neutral-100 text-neutral-700",
};

export function ResourceCardBlock({ block, isEditing }: ResourceCardBlockProps) {
  const { updateBlock } = useCMS();
  const content = block.content as {
    resourceId?: string;
    displayStyle: "card" | "inline" | "compact";
    showDescription: boolean;
    showCategory: boolean;
  };

  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(false);

  const displayStyle = content.displayStyle || "card";
  const showDescription = content.showDescription !== false;
  const showCategory = content.showCategory !== false;

  // Fetch resources for dropdown
  useEffect(() => {
    if (isEditing && resources.length === 0) {
      setLoading(true);
      fetch("/api/resources")
        .then((res) => res.json())
        .then((data) => {
          setResources(data.resources || []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isEditing, resources.length]);

  // Fetch selected resource details
  useEffect(() => {
    if (content.resourceId && !selectedResource) {
      fetch(`/api/resources/${content.resourceId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.resource) setSelectedResource(data.resource);
        })
        .catch(console.error);
    }
  }, [content.resourceId, selectedResource]);

  const getFileIcon = (type: string) => {
    const Icon = FILE_ICONS[type] || FILE_ICONS.default;
    return Icon;
  };

  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
  };

  if (isEditing) {
    return (
      <div className="border border-neutral-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <FolderIcon className="h-5 w-5 text-primary-500" />
          <span className="font-medium">Resource Card</span>
        </div>

        {/* Resource selector */}
        <div>
          <label className="block text-sm text-neutral-500 mb-1">
            Select Resource
          </label>
          <select
            value={content.resourceId || ""}
            onChange={(e) => {
              const resource = resources.find((r) => r.id === e.target.value);
              updateBlock(block.id, { resourceId: e.target.value });
              setSelectedResource(resource || null);
            }}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
            disabled={loading}
          >
            <option value="">
              {loading ? "Loading resources..." : "Select a resource..."}
            </option>
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                [{resource.category}] {resource.title}
              </option>
            ))}
          </select>
        </div>

        {/* Display style */}
        <div>
          <label className="block text-sm text-neutral-500 mb-2">
            Display Style
          </label>
          <div className="flex gap-2">
            {(["card", "inline", "compact"] as const).map((style) => (
              <button
                key={style}
                onClick={() => updateBlock(block.id, { displayStyle: style })}
                className={`px-3 py-1.5 text-sm rounded capitalize ${
                  displayStyle === style
                    ? "bg-primary-500 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showDescription}
              onChange={(e) =>
                updateBlock(block.id, { showDescription: e.target.checked })
              }
              className="rounded"
            />
            Show description
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showCategory}
              onChange={(e) =>
                updateBlock(block.id, { showCategory: e.target.checked })
              }
              className="rounded"
            />
            Show category
          </label>
        </div>

        {/* Preview */}
        {selectedResource && (
          <div className="p-4 bg-neutral-50 rounded-lg">
            <p className="text-sm text-neutral-500 mb-3">Preview:</p>
            <ResourcePreview
              resource={selectedResource}
              displayStyle={displayStyle}
              showDescription={showDescription}
              showCategory={showCategory}
              getFileIcon={getFileIcon}
              getCategoryColor={getCategoryColor}
            />
          </div>
        )}
      </div>
    );
  }

  // View mode
  if (!content.resourceId || !selectedResource) return null;

  return (
    <div className="my-4">
      <ResourcePreview
        resource={selectedResource}
        displayStyle={displayStyle}
        showDescription={showDescription}
        showCategory={showCategory}
        getFileIcon={getFileIcon}
        getCategoryColor={getCategoryColor}
        isInteractive
      />
    </div>
  );
}

interface ResourcePreviewProps {
  resource: Resource;
  displayStyle: "card" | "inline" | "compact";
  showDescription: boolean;
  showCategory: boolean;
  getFileIcon: (type: string) => React.ComponentType<{ className?: string }>;
  getCategoryColor: (category: string) => string;
  isInteractive?: boolean;
}

function ResourcePreview({
  resource,
  displayStyle,
  showDescription,
  showCategory,
  getFileIcon,
  getCategoryColor,
  isInteractive = false,
}: ResourcePreviewProps) {
  const Icon = getFileIcon(resource.type);
  const resourceUrl = resource.fileUrl || resource.externalUrl;
  const isExternal = !!resource.externalUrl;

  const Wrapper = isInteractive && resourceUrl ? "a" : "div";
  const wrapperProps = isInteractive && resourceUrl
    ? {
        href: resourceUrl,
        target: isExternal ? "_blank" : undefined,
        rel: isExternal ? "noopener noreferrer" : undefined,
        download: !isExternal,
      }
    : {};

  if (displayStyle === "compact") {
    return (
      <Wrapper
        {...wrapperProps}
        className={`flex items-center gap-2 p-2 rounded-lg border border-neutral-200 ${
          isInteractive ? "hover:bg-neutral-50 hover:border-primary-300" : ""
        }`}
      >
        <Icon className="h-4 w-4 text-neutral-500 flex-shrink-0" />
        <span className="text-sm font-medium text-neutral-900 truncate flex-1">
          {resource.title}
        </span>
        {isInteractive && (
          isExternal ? (
            <ArrowTopRightOnSquareIcon className="h-4 w-4 text-neutral-400" />
          ) : (
            <ArrowDownTrayIcon className="h-4 w-4 text-neutral-400" />
          )
        )}
      </Wrapper>
    );
  }

  if (displayStyle === "inline") {
    return (
      <Wrapper
        {...wrapperProps}
        className={`flex items-start gap-3 p-3 rounded-lg border border-neutral-200 ${
          isInteractive ? "hover:bg-neutral-50 hover:border-primary-300" : ""
        }`}
      >
        <div className="h-10 w-10 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon className="h-5 w-5 text-neutral-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-neutral-900">{resource.title}</span>
            {showCategory && (
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${getCategoryColor(
                  resource.category
                )}`}
              >
                {resource.category}
              </span>
            )}
          </div>
          {showDescription && resource.description && (
            <p className="text-sm text-neutral-500 mt-1 line-clamp-1">
              {resource.description}
            </p>
          )}
        </div>
        {isInteractive && (
          isExternal ? (
            <ArrowTopRightOnSquareIcon className="h-5 w-5 text-neutral-400 flex-shrink-0" />
          ) : (
            <ArrowDownTrayIcon className="h-5 w-5 text-neutral-400 flex-shrink-0" />
          )
        )}
      </Wrapper>
    );
  }

  // Card style (default)
  return (
    <Wrapper
      {...wrapperProps}
      className={`block border border-neutral-200 rounded-xl overflow-hidden bg-white ${
        isInteractive ? "hover:shadow-card-hover hover:border-primary-300 transition-all" : ""
      }`}
    >
      {resource.thumbnail ? (
        <div className="aspect-video bg-neutral-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resource.thumbnail}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
          <Icon className="h-12 w-12 text-neutral-400" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-neutral-900">{resource.title}</h3>
          {isInteractive && (
            isExternal ? (
              <ArrowTopRightOnSquareIcon className="h-5 w-5 text-neutral-400 flex-shrink-0" />
            ) : (
              <ArrowDownTrayIcon className="h-5 w-5 text-neutral-400 flex-shrink-0" />
            )
          )}
        </div>
        {showCategory && (
          <span
            className={`inline-block px-2 py-0.5 text-xs rounded-full mt-2 ${getCategoryColor(
              resource.category
            )}`}
          >
            {resource.category}
          </span>
        )}
        {showDescription && resource.description && (
          <p className="text-sm text-neutral-600 mt-2 line-clamp-2">
            {resource.description}
          </p>
        )}
      </div>
    </Wrapper>
  );
}
