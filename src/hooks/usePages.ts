import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Page, PageContent, PageVersion } from "@prisma/client";
import {
  PageCreateInput,
  PageUpdateInput,
  PageCategory,
  PageStatus,
  Visibility,
  PagePublishInput,
} from "@/lib/validations/page";

type PageWithRelations = Page & {
  organization?: {
    id: string;
    name: string;
    subdomain: string;
  } | null;
  content?: {
    id: string;
    hasDraft: boolean;
    publishedAt: Date | null;
  } | null;
  _count?: {
    children: number;
  };
};

type PageWithFullContent = Page & {
  organization?: {
    id: string;
    name: string;
    subdomain: string;
  } | null;
  content?: (PageContent & {
    versions: Pick<PageVersion, "id" | "versionNumber" | "createdBy" | "createdAt" | "note">[];
  }) | null;
  parent?: {
    id: string;
    title: string;
    slug: string;
  } | null;
  children?: {
    id: string;
    title: string;
    slug: string;
    status: PageStatus;
    order: number;
  }[];
  _count?: {
    children: number;
  };
};

type PageFilters = {
  pageCategory?: PageCategory;
  status?: PageStatus;
  visibility?: Visibility;
  organizationId?: string;
  parentId?: string | null;
  includeShared?: boolean;
  search?: string;
};

// Fetch all pages with filters
async function fetchPages(filters?: PageFilters): Promise<PageWithRelations[]> {
  const searchParams = new URLSearchParams();
  if (filters?.pageCategory) searchParams.set("pageCategory", filters.pageCategory);
  if (filters?.status) searchParams.set("status", filters.status);
  if (filters?.visibility) searchParams.set("visibility", filters.visibility);
  if (filters?.organizationId) searchParams.set("organizationId", filters.organizationId);
  if (filters?.parentId !== undefined) searchParams.set("parentId", filters.parentId ?? "");
  if (filters?.includeShared !== undefined) searchParams.set("includeShared", String(filters.includeShared));
  if (filters?.search) searchParams.set("search", filters.search);

  const response = await fetch(`/api/pages?${searchParams}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch pages");
  }
  return response.json();
}

// Fetch single page with content
async function fetchPage(id: string): Promise<PageWithFullContent> {
  const response = await fetch(`/api/pages/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch page");
  }
  return response.json();
}

// Create page
async function createPage(data: PageCreateInput): Promise<PageWithRelations> {
  const response = await fetch("/api/pages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create page");
  }
  return response.json();
}

// Update page
async function updatePage(id: string, data: PageUpdateInput): Promise<PageWithRelations> {
  const response = await fetch(`/api/pages/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update page");
  }
  return response.json();
}

// Delete page (soft delete by default)
async function deletePage(id: string, hard = false): Promise<void> {
  const url = hard ? `/api/pages/${id}?hard=true` : `/api/pages/${id}`;
  const response = await fetch(url, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete page");
  }
}

// Publish/unpublish/schedule page
async function publishPage(id: string, data: PagePublishInput): Promise<PageWithRelations> {
  const response = await fetch(`/api/pages/${id}/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to publish page");
  }
  return response.json();
}

// Duplicate page
async function duplicatePage(id: string): Promise<PageWithRelations> {
  const response = await fetch(`/api/pages/${id}/duplicate`, {
    method: "POST",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to duplicate page");
  }
  return response.json();
}

// Reorder pages
async function reorderPages(pages: { id: string; order: number }[]): Promise<void> {
  const response = await fetch("/api/pages/reorder", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pages }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to reorder pages");
  }
}

// Hooks
export function usePages(filters?: PageFilters) {
  return useQuery({
    queryKey: ["pages", filters],
    queryFn: () => fetchPages(filters),
  });
}

export function usePage(id: string) {
  return useQuery({
    queryKey: ["pages", id],
    queryFn: () => fetchPage(id),
    enabled: !!id,
  });
}

export function useCreatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
    },
  });
}

export function useUpdatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PageUpdateInput }) =>
      updatePage(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      queryClient.invalidateQueries({ queryKey: ["pages", id] });
    },
  });
}

export function useDeletePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, hard = false }: { id: string; hard?: boolean }) =>
      deletePage(id, hard),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
    },
  });
}

export function usePublishPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PagePublishInput }) =>
      publishPage(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      queryClient.invalidateQueries({ queryKey: ["pages", id] });
    },
  });
}

export function useDuplicatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: duplicatePage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
    },
  });
}

export function useReorderPages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderPages,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
    },
  });
}
