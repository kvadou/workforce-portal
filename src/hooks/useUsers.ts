import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserRole } from "@prisma/client";

export type UserStatus = "active" | "pending" | "inactive";

export type UserWithOrg = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastActive: string;
  avatarUrl: string | null;
  organization: {
    id: string;
    name: string;
    subdomain: string;
  } | null;
  createdAt: string;
};

export type UserStats = {
  total: number;
  active: number;
  pending: number;
  admins: number;
};

export type UserFilters = {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  organizationId?: string;
};

export type InviteUserInput = {
  email: string;
  name?: string;
  role?: UserRole;
  organizationId?: string;
};

export type UpdateUserInput = {
  name?: string;
  role?: UserRole;
  organizationId?: string | null;
  isOnboarding?: boolean;
};

// Fetch all users with filters
async function fetchUsers(
  filters?: UserFilters
): Promise<{ users: UserWithOrg[]; stats: UserStats }> {
  const searchParams = new URLSearchParams();
  if (filters?.search) searchParams.set("search", filters.search);
  if (filters?.role) searchParams.set("role", filters.role);
  if (filters?.status) searchParams.set("status", filters.status);
  if (filters?.organizationId) searchParams.set("organizationId", filters.organizationId);

  const response = await fetch(`/api/admin/users?${searchParams}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch users");
  }
  return response.json();
}

// Fetch single user
async function fetchUser(id: string): Promise<UserWithOrg> {
  const response = await fetch(`/api/admin/users/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch user");
  }
  const data = await response.json();
  return data.user;
}

// Invite user
async function inviteUser(data: InviteUserInput): Promise<UserWithOrg> {
  const response = await fetch("/api/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to invite user");
  }
  const result = await response.json();
  return result.user;
}

// Update user
async function updateUser(
  id: string,
  data: UpdateUserInput
): Promise<UserWithOrg> {
  const response = await fetch(`/api/admin/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update user");
  }
  const result = await response.json();
  return result.user;
}

// Delete user
async function deleteUser(id: string): Promise<void> {
  const response = await fetch(`/api/admin/users/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete user");
  }
}

// Hooks
export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: ["users", filters],
    queryFn: () => fetchUsers(filters),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => fetchUser(id),
    enabled: !!id,
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inviteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserInput }) =>
      updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
