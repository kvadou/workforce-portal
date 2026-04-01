"use client";

import {
  BuildingOffice2Icon,
  DocumentTextIcon,
  EyeIcon,
  EyeSlashIcon,
  FolderOpenIcon,
  GlobeAltIcon,
  LinkIcon,
  PencilSquareIcon,
  PhotoIcon,
  PlusIcon,
  TableCellsIcon,
  TrashIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { DraggableList } from "@/components/dnd/DraggableList";
import { DraggableItem } from "@/components/dnd/DraggableItem";
import { useResources, useDeleteResource, useReorderResources } from "@/hooks/useResources";
import {
  CATEGORY_GROUPS,
  CATEGORY_LABELS,
  TYPE_LABELS,
  VISIBILITY_LABELS,
  ResourceCategory,
} from "@/lib/validations/resource";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const TYPE_ICONS: Record<string, React.ElementType> = {
  VIDEO: VideoCameraIcon,
  PDF: DocumentTextIcon,
  IMAGE: PhotoIcon,
  LINK: LinkIcon,
  RICH_TEXT: DocumentTextIcon,
  TEMPLATE: TableCellsIcon,
};

type CategoryGroup = "teaching" | "business" | "admin";

export default function ResourcesPage() {
  const { data: resources, isLoading } = useResources();
  const deleteMutation = useDeleteResource();
  const reorderMutation = useReorderResources();

  const [activeGroup, setActiveGroup] = useState<CategoryGroup>("teaching");
  const [activeCategory, setActiveCategory] = useState<ResourceCategory | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    resourceId: string;
    resourceName: string;
  }>({ isOpen: false, resourceId: "", resourceName: "" });

  // Filter resources by active group and category
  const filteredResources = useMemo(() => {
    if (!resources) return [];

    const groupCategories = CATEGORY_GROUPS[activeGroup].categories;
    let filtered = resources.filter((r) =>
      groupCategories.includes(r.category as ResourceCategory)
    );

    if (activeCategory) {
      filtered = filtered.filter((r) => r.category === activeCategory);
    }

    return filtered.sort((a, b) => a.order - b.order);
  }, [resources, activeGroup, activeCategory]);

  // Get categories for current group with resource counts
  const categoriesWithCounts = useMemo(() => {
    if (!resources) return [];

    const groupCategories = CATEGORY_GROUPS[activeGroup].categories;
    return groupCategories.map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      count: resources.filter((r) => r.category === cat).length,
    }));
  }, [resources, activeGroup]);

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(deleteDialog.resourceId);
      toast.success("Resource deleted successfully");
      setDeleteDialog({ isOpen: false, resourceId: "", resourceName: "" });
    } catch {
      toast.error("Failed to delete resource");
    }
  };

  const handleReorder = async (reorderedResources: typeof filteredResources) => {
    if (!reorderedResources) return;

    const updates = reorderedResources.map((resource, index) => ({
      id: resource.id,
      order: index + 1,
    }));

    try {
      await reorderMutation.mutateAsync(updates);
      toast.success("Order updated");
    } catch {
      toast.error("Failed to update order");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-heading-lg text-neutral-900">Resources</h1>
          <p className="text-body text-neutral-500">
            Manage teaching, business, and admin resources
          </p>
        </div>
        <Link href="/admin/resources/new">
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Resource
          </Button>
        </Link>
      </div>

      {/* Category Group Tabs */}
      <div className="flex gap-2 mb-6">
        {(Object.entries(CATEGORY_GROUPS) as [CategoryGroup, typeof CATEGORY_GROUPS.teaching][]).map(
          ([key, group]) => (
            <button
              key={key}
              onClick={() => {
                setActiveGroup(key);
                setActiveCategory(null);
              }}
              className={`px-4 py-2 rounded-[var(--radius-md)] text-body-sm font-medium transition-colors ${
                activeGroup === key
                  ? "bg-primary-500 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {group.label}
            </button>
          )
        )}
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1 rounded-lg text-body-sm transition-colors ${
            !activeCategory
              ? "bg-primary-100 text-primary-700"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          All ({resources?.filter((r) =>
            CATEGORY_GROUPS[activeGroup].categories.includes(r.category as ResourceCategory)
          ).length || 0})
        </button>
        {categoriesWithCounts.map(({ category, label, count }) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-3 py-1 rounded-lg text-body-sm transition-colors ${
              activeCategory === category
                ? "bg-primary-100 text-primary-700"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <p className="text-body-sm text-neutral-500">
            Drag and drop to reorder resources
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner fullPage />
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpenIcon className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-heading-sm text-neutral-900 mb-2">
                No resources yet
              </h3>
              <p className="text-body text-neutral-500 mb-6">
                {activeCategory
                  ? `No resources in ${CATEGORY_LABELS[activeCategory]}`
                  : `Get started by creating your first resource`}
              </p>
              <Link href="/admin/resources/new">
                <Button>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Resource
                </Button>
              </Link>
            </div>
          ) : (
            <DraggableList
              items={filteredResources}
              onReorder={handleReorder}
              renderItem={(resource) => {
                const TypeIcon = TYPE_ICONS[resource.type] || DocumentTextIcon;
                return (
                  <DraggableItem key={resource.id} id={resource.id}>
                    <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-[var(--radius-lg)]">
                      <div className="h-12 w-12 bg-primary-500 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0">
                        <TypeIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-neutral-900 truncate">
                            {resource.title}
                          </h3>
                          {!resource.isActive && (
                            <span className="px-2 py-0.5 rounded-lg text-xs bg-neutral-200 text-neutral-600">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-body-sm text-neutral-500 truncate">
                          {CATEGORY_LABELS[resource.category as ResourceCategory]} • {TYPE_LABELS[resource.type as keyof typeof TYPE_LABELS]}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Visibility Badge */}
                        <span
                          className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 ${
                            resource.visibility === "ALL_TUTORS"
                              ? "bg-success-light text-success"
                              : resource.visibility === "ADMINS_ONLY"
                              ? "bg-error-light text-error"
                              : "bg-warning-light text-accent-orange"
                          }`}
                        >
                          {resource.visibility === "ALL_TUTORS" ? (
                            <EyeIcon className="h-3 w-3" />
                          ) : (
                            <EyeSlashIcon className="h-3 w-3" />
                          )}
                          {VISIBILITY_LABELS[resource.visibility as keyof typeof VISIBILITY_LABELS]}
                        </span>
                        {/* Organization Badge */}
                        <span
                          className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 ${
                            resource.organizationId
                              ? "bg-primary-100 text-primary-700"
                              : "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          {resource.organizationId ? (
                            <>
                              <BuildingOffice2Icon className="h-3 w-3" />
                              {resource.organization?.name || "Org"}
                            </>
                          ) : (
                            <>
                              <GlobeAltIcon className="h-3 w-3" />
                              Shared
                            </>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Link href={`/admin/resources/${resource.id}`}>
                          <button className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-primary-50 rounded-[var(--radius-md)] transition-colors">
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                        </Link>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setDeleteDialog({
                              isOpen: true,
                              resourceId: resource.id,
                              resourceName: resource.title,
                            });
                          }}
                          className="p-2 text-neutral-400 hover:text-error hover:bg-error-light rounded-[var(--radius-md)] transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </DraggableItem>
                );
              }}
              renderOverlay={(resource) => {
                const TypeIcon = TYPE_ICONS[resource.type] || DocumentTextIcon;
                return (
                  <div className="flex items-center gap-4 p-4 bg-card rounded-[var(--radius-lg)] border border-border">
                    <div className="h-12 w-12 bg-primary-500 rounded-[var(--radius-md)] flex items-center justify-center">
                      <TypeIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900">
                        {resource.title}
                      </h3>
                    </div>
                  </div>
                );
              }}
            />
          )}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() =>
          setDeleteDialog({ isOpen: false, resourceId: "", resourceName: "" })
        }
        onConfirm={handleDelete}
        title="Delete Resource"
        description="Are you sure you want to delete this resource? This action will make the resource inactive."
        itemName={deleteDialog.resourceName}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
