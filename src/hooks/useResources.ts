import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Resource, Organization } from "@prisma/client";
import {
  ResourceCreateInput,
  ResourceUpdateInput,
  ResourceCategory,
  ResourceType,
  Visibility,
} from "@/lib/validations/resource";

type ResourceWithOrg = Resource & {
  organization?: {
    id: string;
    name: string;
    subdomain: string;
  } | null;
};

type ResourceFilters = {
  category?: ResourceCategory;
  type?: ResourceType;
  visibility?: Visibility;
  organizationId?: string;
  isActive?: boolean;
  includeShared?: boolean;
  search?: string;
};

// Fetch all resources with filters
async function fetchResources(filters?: ResourceFilters): Promise<ResourceWithOrg[]> {
  const searchParams = new URLSearchParams();
  if (filters?.category) searchParams.set("category", filters.category);
  if (filters?.type) searchParams.set("type", filters.type);
  if (filters?.visibility) searchParams.set("visibility", filters.visibility);
  if (filters?.organizationId) searchParams.set("organizationId", filters.organizationId);
  if (filters?.isActive !== undefined) searchParams.set("isActive", String(filters.isActive));
  if (filters?.includeShared !== undefined) searchParams.set("includeShared", String(filters.includeShared));
  if (filters?.search) searchParams.set("search", filters.search);

  const response = await fetch(`/api/resources?${searchParams}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch resources");
  }
  const data = await response.json();
  return data.resources;
}

// Fetch single resource
async function fetchResource(id: string): Promise<ResourceWithOrg> {
  const response = await fetch(`/api/resources/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch resource");
  }
  const data = await response.json();
  return data.resource;
}

// Create resource
async function createResource(data: ResourceCreateInput): Promise<ResourceWithOrg> {
  const response = await fetch("/api/resources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create resource");
  }
  const result = await response.json();
  return result.resource;
}

// Update resource
async function updateResource(id: string, data: ResourceUpdateInput): Promise<ResourceWithOrg> {
  const response = await fetch(`/api/resources/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update resource");
  }
  const result = await response.json();
  return result.resource;
}

// Delete resource (soft delete)
async function deleteResource(id: string): Promise<void> {
  const response = await fetch(`/api/resources/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete resource");
  }
}

// Reorder resources
async function reorderResources(resources: { id: string; order: number }[]): Promise<void> {
  const response = await fetch("/api/resources/reorder", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resources }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to reorder resources");
  }
}

// Hooks
export function useResources(filters?: ResourceFilters) {
  return useQuery({
    queryKey: ["resources", filters],
    queryFn: () => fetchResources(filters),
  });
}

export function useResource(id: string) {
  return useQuery({
    queryKey: ["resources", id],
    queryFn: () => fetchResource(id),
    enabled: !!id,
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResourceUpdateInput }) =>
      updateResource(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: ["resources", id] });
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });
}

export function useReorderResources() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderResources,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });
}
