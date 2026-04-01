"use client";

import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  FolderIcon,
  FunnelIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  MusicalNoteIcon,
  PhotoIcon,
  Squares2X2Icon,
  TrashIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mock data for demonstration
const mockMedia = [
  {
    id: "1",
    name: "king-character.png",
    type: "image",
    size: "245 KB",
    uploadedAt: "2024-01-15",
    url: "/images/king.png",
    dimensions: "800x600",
  },
  {
    id: "2",
    name: "lesson-1-intro.mp4",
    type: "video",
    size: "24.5 MB",
    uploadedAt: "2024-01-14",
    url: "/videos/lesson-1.mp4",
    duration: "5:32",
  },
  {
    id: "3",
    name: "worksheet-template.pdf",
    type: "document",
    size: "1.2 MB",
    uploadedAt: "2024-01-13",
    url: "/docs/worksheet.pdf",
    pages: 4,
  },
  {
    id: "4",
    name: "queen-character.png",
    type: "image",
    size: "312 KB",
    uploadedAt: "2024-01-12",
    url: "/images/queen.png",
    dimensions: "800x600",
  },
  {
    id: "5",
    name: "background-music.mp3",
    type: "audio",
    size: "3.8 MB",
    uploadedAt: "2024-01-11",
    url: "/audio/music.mp3",
    duration: "3:45",
  },
  {
    id: "6",
    name: "chess-board-setup.png",
    type: "image",
    size: "156 KB",
    uploadedAt: "2024-01-10",
    url: "/images/board.png",
    dimensions: "1200x1200",
  },
];

const typeIcons: Record<string, typeof PhotoIcon> = {
  image: PhotoIcon,
  video: VideoCameraIcon,
  document: DocumentTextIcon,
  audio: MusicalNoteIcon,
  other: DocumentTextIcon,
};

const typeColors: Record<string, string> = {
  image: "bg-info-light text-info",
  video: "bg-primary-100 text-primary-600",
  document: "bg-accent-orange-light text-accent-orange",
  audio: "bg-success-light text-success",
  other: "bg-neutral-100 text-neutral-600",
};

export default function MediaLibraryPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const filteredMedia = mockMedia.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType = !selectedType || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  const toggleSelect = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const stats = {
    total: mockMedia.length,
    images: mockMedia.filter((m) => m.type === "image").length,
    videos: mockMedia.filter((m) => m.type === "video").length,
    documents: mockMedia.filter((m) => m.type === "document").length,
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-heading-lg text-neutral-900">Media Library</h1>
          <p className="text-body text-neutral-500">
            Manage your images, videos, and documents
          </p>
        </div>
        <Button>
          <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
          ArrowUpTrayIcon Files
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Files", value: stats.total, icon: FolderIcon, color: "bg-neutral-100 text-neutral-600" },
          { label: "Images", value: stats.images, icon: PhotoIcon, color: "bg-info-light text-info" },
          { label: "Videos", value: stats.videos, icon: VideoCameraIcon, color: "bg-primary-100 text-primary-600" },
          { label: "Documents", value: stats.documents, icon: DocumentTextIcon, color: "bg-accent-orange-light text-accent-orange" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-[var(--radius-md)] ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                  <p className="text-body-sm text-neutral-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and MagnifyingGlassIcon */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="MagnifyingGlassIcon files..."
                className="w-full pl-10 pr-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-4 w-4 text-neutral-400" />
              <select
                value={selectedType || ""}
                onChange={(e) => setSelectedType(e.target.value || null)}
                className="px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="document">Documents</option>
                <option value="audio">Audio</option>
              </select>
            </div>
            <div className="flex items-center border border-border rounded-[var(--radius-md)] overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 ${viewMode === "grid" ? "bg-primary-100 text-primary-600" : "text-neutral-400 hover:bg-neutral-100"}`}
              >
                <Squares2X2Icon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 ${viewMode === "list" ? "bg-primary-100 text-primary-600" : "text-neutral-400 hover:bg-neutral-100"}`}
              >
                <ListBulletIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selection Actions */}
      {selectedItems.length > 0 && (
        <div className="mb-4 p-3 bg-primary-50 rounded-[var(--radius-lg)] flex items-center justify-between">
          <span className="text-body-sm text-primary-700">
            {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              ArrowDownTrayIcon
            </Button>
            <Button size="sm" variant="outline" className="text-error border-error hover:bg-error-light">
              <TrashIcon className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Media Grid/ListBulletIcon */}
      {filteredMedia.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <PhotoIcon className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-heading-sm text-neutral-900 mb-2">
              No files found
            </h3>
            <p className="text-body text-neutral-500 mb-6">
              {searchQuery
                ? "Try adjusting your search or filters"
                : "ArrowUpTrayIcon your first file to get started"}
            </p>
            <Button>
              <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
              ArrowUpTrayIcon Files
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredMedia.map((item) => {
            const IconComponent = typeIcons[item.type] || typeIcons.other;
            const colorClass = typeColors[item.type] || typeColors.other;

            return (
              <Card
                key={item.id}
                className={`group cursor-pointer transition-all hover:shadow-card-hover ${
                  selectedItems.includes(item.id) ? "ring-2 ring-primary-500" : ""
                }`}
                onClick={() => toggleSelect(item.id)}
              >
                <div className="aspect-square bg-neutral-100 relative overflow-hidden rounded-t-[var(--radius-lg)]">
                  {item.type === "image" ? (
                    <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center">
                      <PhotoIcon className="h-12 w-12 text-neutral-400" />
                    </div>
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${colorClass.replace('text-', 'bg-').replace('600', '50')}`}>
                      <IconComponent className={`h-12 w-12 ${colorClass.split(' ')[1]}`} />
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button className="p-2 bg-white rounded-lg hover:bg-neutral-100">
                      <EyeIcon className="h-4 w-4 text-neutral-700" />
                    </button>
                    <button className="p-2 bg-white rounded-lg hover:bg-neutral-100">
                      <DocumentDuplicateIcon className="h-4 w-4 text-neutral-700" />
                    </button>
                    <button className="p-2 bg-white rounded-lg hover:bg-neutral-100">
                      <ArrowDownTrayIcon className="h-4 w-4 text-neutral-700" />
                    </button>
                  </div>

                  {/* Selection checkbox */}
                  <div className={`absolute top-2 left-2 h-5 w-5 rounded border-2 transition-all ${
                    selectedItems.includes(item.id)
                      ? "bg-primary-500 border-primary-500"
                      : "bg-white/80 border-neutral-300 opacity-0 group-hover:opacity-100"
                  }`}>
                    {selectedItems.includes(item.id) && (
                      <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  {/* Type badge */}
                  <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
                    {item.type}
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="font-medium text-neutral-900 truncate text-sm">
                    {item.name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {item.size} • {item.uploadedAt}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="divide-y divide-border">
            {filteredMedia.map((item) => {
              const IconComponent = typeIcons[item.type] || typeIcons.other;
              const colorClass = typeColors[item.type] || typeColors.other;

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 p-4 hover:bg-neutral-50 cursor-pointer ${
                    selectedItems.includes(item.id) ? "bg-primary-50" : ""
                  }`}
                  onClick={() => toggleSelect(item.id)}
                >
                  <div className={`h-5 w-5 rounded border-2 flex-shrink-0 ${
                    selectedItems.includes(item.id)
                      ? "bg-primary-500 border-primary-500"
                      : "border-neutral-300"
                  }`}>
                    {selectedItems.includes(item.id) && (
                      <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className={`h-10 w-10 rounded-[var(--radius-md)] ${colorClass} flex items-center justify-center flex-shrink-0`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-body-sm text-neutral-500">
                      {item.type === "image" && `${item.dimensions} • `}
                      {(item.type === "video" || item.type === "audio") && `${item.duration} • `}
                      {item.type === "document" && `${item.pages} pages • `}
                      {item.size}
                    </p>
                  </div>
                  <p className="text-body-sm text-neutral-400">{item.uploadedAt}</p>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-[var(--radius-md)]"
                  >
                    <EllipsisVerticalIcon className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
