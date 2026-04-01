"use client";

import {
  AcademicCapIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BookOpenIcon,
  BriefcaseIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
  EllipsisHorizontalIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { PageStatusBadge } from "@/components/admin/pages/PageStatusBadge";
import {
  usePages,
  useDeletePage,
  useDuplicatePage,
} from "@/hooks/usePages";
import { PageCategory, PageStatus, PAGE_STATUS_LABELS, VISIBILITY_LABELS, Visibility } from "@/lib/validations/page";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type StatusFilter = PageStatus | "all";

// Category configuration with icons and colors
const categoryConfig: Record<PageCategory | "all", {
  icon: typeof BookOpenIcon;
  label: string;
  color: string;
  bgColor: string;
  dotColor: string;
}> = {
  all: {
    icon: DocumentTextIcon,
    label: "All Pages",
    color: "text-neutral-600",
    bgColor: "bg-neutral-50 hover:bg-neutral-100",
    dotColor: "bg-neutral-400"
  },
  TEACHING: {
    icon: BookOpenIcon,
    label: "Teaching",
    color: "text-info",
    bgColor: "bg-info-light hover:bg-info-light",
    dotColor: "bg-info"
  },
  BUSINESS: {
    icon: BriefcaseIcon,
    label: "Business",
    color: "text-success",
    bgColor: "bg-success-light hover:bg-success-light",
    dotColor: "bg-success"
  },
  ADMIN: {
    icon: ShieldCheckIcon,
    label: "Admin",
    color: "text-primary-600",
    bgColor: "bg-primary-50 hover:bg-primary-100",
    dotColor: "bg-primary-500"
  },
  ONBOARDING: {
    icon: AcademicCapIcon,
    label: "Onboarding",
    color: "text-warning",
    bgColor: "bg-warning-light hover:bg-warning-light",
    dotColor: "bg-warning"
  },
  CUSTOM: {
    icon: SparklesIcon,
    label: "Custom",
    color: "text-error",
    bgColor: "bg-error-light hover:bg-error-light",
    dotColor: "bg-error"
  },
};

const allCategories: (PageCategory | "all")[] = [
  "all",
  "TEACHING",
  "BUSINESS",
  "ADMIN",
  "ONBOARDING",
  "CUSTOM",
];

export default function PagesAdminPage() {
  const [activeCategory, setActiveCategory] = useState<PageCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Debounce search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const timer = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
    return () => clearTimeout(timer);
  };

  // Build filters
  const filters = useMemo(() => {
    const f: Parameters<typeof usePages>[0] = {};
    if (activeCategory !== "all") {
      f.pageCategory = activeCategory;
    }
    if (statusFilter !== "all") {
      f.status = statusFilter;
    }
    if (debouncedSearch) {
      f.search = debouncedSearch;
    }
    return f;
  }, [activeCategory, statusFilter, debouncedSearch]);

  const { data: pages, isLoading } = usePages(filters);
  const { data: allPages } = usePages();
  const deleteMutation = useDeletePage();
  const duplicateMutation = useDuplicatePage();

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    pageId: string;
    pageName: string;
  }>({ isOpen: false, pageId: "", pageName: "" });

  // Calculate counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<PageCategory | "all", number> = {
      all: 0,
      TEACHING: 0,
      BUSINESS: 0,
      ADMIN: 0,
      ONBOARDING: 0,
      CUSTOM: 0,
    };
    allPages?.forEach((page) => {
      counts.all++;
      counts[page.pageCategory as PageCategory]++;
    });
    return counts;
  }, [allPages]);

  // Calculate status counts
  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: 0,
      DRAFT: 0,
      PUBLISHED: 0,
      SCHEDULED: 0,
      ARCHIVED: 0,
    };
    const pagesToCount = activeCategory === "all"
      ? allPages
      : allPages?.filter((p) => p.pageCategory === activeCategory);
    pagesToCount?.forEach((page) => {
      counts.all++;
      counts[page.status as PageStatus]++;
    });
    return counts;
  }, [allPages, activeCategory]);

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id: deleteDialog.pageId });
      toast.success("Page archived successfully");
      setDeleteDialog({ isOpen: false, pageId: "", pageName: "" });
    } catch {
      toast.error("Failed to delete page");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const newPage = await duplicateMutation.mutateAsync(id);
      toast.success(`Page duplicated as "${newPage.title}"`);
      setOpenMenuId(null);
    } catch {
      toast.error("Failed to duplicate page");
    }
  };

  const statusFilters: StatusFilter[] = ["all", "DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"];

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-neutral-200 bg-neutral-50/50 p-6 hidden lg:block">
        <div className="sticky top-6">
          <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
            Categories
          </h2>
          <nav className="space-y-1">
            {allCategories.map((category) => {
              const config = categoryConfig[category];
              const Icon = config.icon;
              const isActive = activeCategory === category;
              const count = categoryCounts[category] ?? 0;

              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                    isActive
                      ? `${config.bgColor} ${config.color} font-medium`
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{config.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-md ${
                    isActive ? "bg-white/70" : "bg-neutral-200/70"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Quick Stats */}
          <div className="mt-8 pt-6 border-t border-neutral-200">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
              Quick Stats
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Published</span>
                <span className="font-medium text-success">{statusCounts.PUBLISHED}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Drafts</span>
                <span className="font-medium text-warning">{statusCounts.DRAFT}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Archived</span>
                <span className="font-medium text-neutral-400">{statusCounts.ARCHIVED}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-heading-lg text-neutral-900">Pages</h1>
            <p className="text-body text-neutral-500 mt-1">
              Create and manage CMS pages
            </p>
          </div>
          <Link href="/admin/pages/new">
            <Button variant="glow" size="md">
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Page
            </Button>
          </Link>
        </div>

        {/* Mobile Category Filter */}
        <div className="lg:hidden mb-6 overflow-x-auto pb-2">
          <div className="flex gap-2">
            {allCategories.map((category) => {
              const config = categoryConfig[category];
              const Icon = config.icon;
              const isActive = activeCategory === category;

              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border whitespace-nowrap transition-all ${
                    isActive
                      ? `${config.bgColor} ${config.color} border-current font-medium`
                      : "bg-white text-neutral-500 border-neutral-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MagnifyingGlassIcon and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* MagnifyingGlassIcon */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="MagnifyingGlassIcon pages..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setDebouncedSearch("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                  statusFilter === status
                    ? "bg-primary-50 border-primary-200 text-primary-700 font-medium"
                    : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
                }`}
              >
                {status === "all" ? "All" : PAGE_STATUS_LABELS[status]}
                {statusCounts[status] > 0 && (
                  <span className="ml-1.5 text-xs opacity-70">
                    {statusCounts[status]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-neutral-500">
            {pages?.length || 0} page{(pages?.length || 0) !== 1 ? "s" : ""}
            {activeCategory !== "all" && ` in ${categoryConfig[activeCategory].label.toLowerCase()}`}
          </p>
        </div>

        {/* Page Cards Grid */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : pages?.length === 0 ? (
          <Card className="py-16">
            <CardContent className="text-center">
              <DocumentTextIcon className="h-16 w-16 text-neutral-200 mx-auto mb-4" />
              <h3 className="text-heading-sm text-neutral-900 mb-2">
                {searchQuery || statusFilter !== "all"
                  ? "No matching pages"
                  : "No pages yet"}
              </h3>
              <p className="text-body text-neutral-500 mb-6 max-w-sm mx-auto">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by creating your first page"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Link href="/admin/pages/new">
                  <Button variant="glow">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Page
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pages?.map((page) => {
              const config = categoryConfig[page.pageCategory as PageCategory] || categoryConfig.CUSTOM;
              const isPublished = page.status === "PUBLISHED";
              const isMenuOpen = openMenuId === page.id;

              return (
                <Card
                  key={page.id}
                  hover
                  className="group relative overflow-visible"
                >
                  <CardContent className="p-5">
                    {/* Category Dot & Status */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${config.dotColor}`} />
                        <span className="text-xs text-neutral-500">
                          {config.label}
                        </span>
                      </div>
                      <PageStatusBadge status={page.status as PageStatus} />
                    </div>

                    {/* Title & Slug */}
                    <Link href={`/admin/pages/${page.id}`}>
                      <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors mb-1 line-clamp-1">
                        {page.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-neutral-400 font-mono mb-4">
                      /{page.slug}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center gap-3 text-xs text-neutral-500 mb-4">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        {formatDistanceToNow(new Date(page.updatedAt), { addSuffix: true })}
                      </span>
                      <span className="flex items-center gap-1">
                        {page.visibility === "ADMINS_ONLY" ? (
                          <EyeSlashIcon className="h-3 w-3" />
                        ) : (
                          <EyeIcon className="h-3 w-3" />
                        )}
                        {VISIBILITY_LABELS[page.visibility as Visibility]}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-neutral-100">
                      <Link href={`/admin/pages/${page.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <PencilSquareIcon className="h-3.5 w-3.5 mr-1.5" />
                          Edit
                        </Button>
                      </Link>

                      {isPublished && (
                        <Link href={`/p/${page.slug}`} target="_blank">
                          <Button variant="ghost" size="sm">
                            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      )}

                      {/* More Menu */}
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setOpenMenuId(isMenuOpen ? null : page.id)}
                        >
                          <EllipsisHorizontalIcon className="h-3.5 w-3.5" />
                        </Button>

                        {isMenuOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-dropdown border border-neutral-200 py-1 z-50">
                              <button
                                onClick={() => handleDuplicate(page.id)}
                                className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                              >
                                <DocumentDuplicateIcon className="h-4 w-4" />
                                Duplicate
                              </button>
                              <div className="border-t border-neutral-100 my-1" />
                              <button
                                onClick={() => {
                                  setDeleteDialog({ isOpen: true, pageId: page.id, pageName: page.title });
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-error hover:bg-error-light flex items-center gap-2"
                              >
                                <TrashIcon className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() =>
          setDeleteDialog({ isOpen: false, pageId: "", pageName: "" })
        }
        onConfirm={handleDelete}
        title="Archive Page"
        description="This page will be archived and no longer visible. You can restore it later from the archived pages."
        itemName={deleteDialog.pageName}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
