import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Announcement } from "@prisma/client";
import {
  AnnouncementCreateInput,
  AnnouncementUpdateInput,
  AnnouncementType,
} from "@/lib/validations/announcement";

type AnnouncementWithOrg = Announcement & {
  organization?: {
    id: string;
    name: string;
    subdomain: string;
  } | null;
};

type AnnouncementFilters = {
  type?: AnnouncementType;
  organizationId?: string;
  isPinned?: boolean;
  isActive?: boolean;
  includeExpired?: boolean;
  includeShared?: boolean;
};

// Fetch all announcements with filters
async function fetchAnnouncements(filters?: AnnouncementFilters): Promise<AnnouncementWithOrg[]> {
  const searchParams = new URLSearchParams();
  if (filters?.type) searchParams.set("type", filters.type);
  if (filters?.organizationId) searchParams.set("organizationId", filters.organizationId);
  if (filters?.isPinned !== undefined) searchParams.set("isPinned", String(filters.isPinned));
  if (filters?.isActive !== undefined) searchParams.set("isActive", String(filters.isActive));
  if (filters?.includeExpired !== undefined) searchParams.set("includeExpired", String(filters.includeExpired));
  if (filters?.includeShared !== undefined) searchParams.set("includeShared", String(filters.includeShared));

  const response = await fetch(`/api/announcements?${searchParams}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch announcements");
  }
  const data = await response.json();
  return data.announcements;
}

// Fetch single announcement
async function fetchAnnouncement(id: string): Promise<AnnouncementWithOrg> {
  const response = await fetch(`/api/announcements/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch announcement");
  }
  const data = await response.json();
  return data.announcement;
}

// Create announcement
async function createAnnouncement(data: AnnouncementCreateInput): Promise<AnnouncementWithOrg> {
  const response = await fetch("/api/announcements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create announcement");
  }
  const result = await response.json();
  return result.announcement;
}

// Update announcement
async function updateAnnouncement(id: string, data: AnnouncementUpdateInput): Promise<AnnouncementWithOrg> {
  const response = await fetch(`/api/announcements/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update announcement");
  }
  const result = await response.json();
  return result.announcement;
}

// Delete announcement (soft delete)
async function deleteAnnouncement(id: string): Promise<void> {
  const response = await fetch(`/api/announcements/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete announcement");
  }
}

// Hooks
export function useAnnouncements(filters?: AnnouncementFilters) {
  return useQuery({
    queryKey: ["announcements", filters],
    queryFn: () => fetchAnnouncements(filters),
  });
}

export function useAnnouncement(id: string) {
  return useQuery({
    queryKey: ["announcements", id],
    queryFn: () => fetchAnnouncement(id),
    enabled: !!id,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AnnouncementUpdateInput }) =>
      updateAnnouncement(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      queryClient.invalidateQueries({ queryKey: ["announcements", id] });
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });
}

// Hook to get pinned announcements for display
export function usePinnedAnnouncements() {
  return useAnnouncements({ isPinned: true, isActive: true });
}

// Hook to get recent announcements for display
export function useRecentAnnouncements(limit: number = 10) {
  const query = useAnnouncements({ isActive: true });

  return {
    ...query,
    data: query.data?.slice(0, limit),
  };
}
