"use client";

import {
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ClockIcon,
  GlobeAltIcon,
  MapPinIcon,
  MegaphoneIcon,
  PencilSquareIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { useAnnouncements, useDeleteAnnouncement } from "@/hooks/useAnnouncements";
import {
  ANNOUNCEMENT_TYPE_LABELS,
  ANNOUNCEMENT_TYPE_COLORS,
  AnnouncementType,
} from "@/lib/validations/announcement";
import { toast } from "sonner";
import { format } from "date-fns";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const TYPE_ICONS: Record<AnnouncementType, React.ElementType> = {
  IMPORTANT_DATE: CalendarDaysIcon,
  ANNOUNCEMENT: MegaphoneIcon,
  STORY_SPOTLIGHT: StarIcon,
  TUTOR_REVIEW: UsersIcon,
};

export default function AnnouncementsPage() {
  const { data: announcements, isLoading } = useAnnouncements();
  const deleteMutation = useDeleteAnnouncement();

  const [activeType, setActiveType] = useState<AnnouncementType | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    announcementId: string;
    announcementName: string;
  }>({ isOpen: false, announcementId: "", announcementName: "" });

  // Filter announcements by active type
  const filteredAnnouncements = useMemo(() => {
    if (!announcements) return [];
    if (!activeType) return announcements;
    return announcements.filter((a) => a.type === activeType);
  }, [announcements, activeType]);

  // Get type counts
  const typeCounts = useMemo(() => {
    if (!announcements) return {};
    return announcements.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [announcements]);

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(deleteDialog.announcementId);
      toast.success("Announcement deleted successfully");
      setDeleteDialog({ isOpen: false, announcementId: "", announcementName: "" });
    } catch {
      toast.error("Failed to delete announcement");
    }
  };

  const isExpired = (expiresAt: Date | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isFuture = (publishDate: Date) => {
    return new Date(publishDate) > new Date();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-heading-lg text-neutral-900">Announcements</h1>
          <p className="text-body text-neutral-500">
            Manage announcements, important dates, and spotlights
          </p>
        </div>
        <Link href="/admin/announcements/new">
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Announcement
          </Button>
        </Link>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveType(null)}
          className={`px-4 py-2 rounded-[var(--radius-md)] text-body-sm font-medium transition-colors ${
            !activeType
              ? "bg-primary-500 text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          All ({announcements?.length || 0})
        </button>
        {(Object.keys(ANNOUNCEMENT_TYPE_LABELS) as AnnouncementType[]).map((type) => {
          const Icon = TYPE_ICONS[type];
          const colors = ANNOUNCEMENT_TYPE_COLORS[type];
          return (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-4 py-2 rounded-[var(--radius-md)] text-body-sm font-medium transition-colors flex items-center gap-2 ${
                activeType === type
                  ? `${colors.bg} ${colors.text}`
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              {ANNOUNCEMENT_TYPE_LABELS[type]} ({typeCounts[type] || 0})
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <p className="text-body-sm text-neutral-500">
            Manage your announcements below
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner fullPage />
          ) : filteredAnnouncements.length === 0 ? (
            <div className="text-center py-12">
              <MegaphoneIcon className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-heading-sm text-neutral-900 mb-2">
                No announcements yet
              </h3>
              <p className="text-body text-neutral-500 mb-6">
                {activeType
                  ? `No ${ANNOUNCEMENT_TYPE_LABELS[activeType]} announcements`
                  : "Get started by creating your first announcement"}
              </p>
              <Link href="/admin/announcements/new">
                <Button>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Announcement
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAnnouncements.map((announcement) => {
                const Icon = TYPE_ICONS[announcement.type as AnnouncementType];
                const colors = ANNOUNCEMENT_TYPE_COLORS[announcement.type as AnnouncementType];
                const expired = isExpired(announcement.expiresAt);
                const future = isFuture(announcement.publishDate);

                return (
                  <div
                    key={announcement.id}
                    className={`flex items-start gap-4 p-4 rounded-[var(--radius-lg)] ${
                      !announcement.isActive || expired
                        ? "bg-neutral-100 opacity-60"
                        : "bg-neutral-50"
                    }`}
                  >
                    <div
                      className={`h-12 w-12 ${colors.bg} rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`h-6 w-6 ${colors.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-neutral-900 truncate">
                          {announcement.title}
                        </h3>
                        {announcement.isPinned && (
                          <MapPinIcon className="h-4 w-4 text-primary-500" />
                        )}
                        {!announcement.isActive && (
                          <span className="px-2 py-0.5 rounded-lg text-xs bg-neutral-200 text-neutral-600">
                            Inactive
                          </span>
                        )}
                        {expired && announcement.isActive && (
                          <span className="px-2 py-0.5 rounded-lg text-xs bg-error-light text-error">
                            Expired
                          </span>
                        )}
                        {future && announcement.isActive && (
                          <span className="px-2 py-0.5 rounded-lg text-xs bg-warning-light text-accent-orange">
                            Scheduled
                          </span>
                        )}
                      </div>
                      <p className="text-body-sm text-neutral-600 truncate mb-2">
                        {announcement.content.substring(0, 100)}
                        {announcement.content.length > 100 && "..."}
                      </p>
                      <div className="flex items-center gap-4 text-caption text-neutral-500">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          {format(new Date(announcement.publishDate), "MMM d, yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <UsersIcon className="h-3 w-3" />
                          {announcement.targetRoles.length} role
                          {announcement.targetRoles.length !== 1 && "s"}
                        </span>
                        <span className="flex items-center gap-1">
                          {announcement.organizationId ? (
                            <>
                              <BuildingOffice2Icon className="h-3 w-3" />
                              {announcement.organization?.name || "Org"}
                            </>
                          ) : (
                            <>
                              <GlobeAltIcon className="h-3 w-3" />
                              Shared
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/announcements/${announcement.id}`}>
                        <button className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-primary-50 rounded-[var(--radius-md)] transition-colors">
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteDialog({
                            isOpen: true,
                            announcementId: announcement.id,
                            announcementName: announcement.title,
                          });
                        }}
                        className="p-2 text-neutral-400 hover:text-error hover:bg-error-light rounded-[var(--radius-md)] transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() =>
          setDeleteDialog({ isOpen: false, announcementId: "", announcementName: "" })
        }
        onConfirm={handleDelete}
        title="Delete Announcement"
        description="Are you sure you want to delete this announcement? This action will make the announcement inactive."
        itemName={deleteDialog.announcementName}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
