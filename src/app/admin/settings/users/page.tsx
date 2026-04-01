"use client";

import {
  ArrowPathIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  EnvelopeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  TrashIcon,
  TrophyIcon,
  UserIcon,
  UserPlusIcon,
  UsersIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useUsers,
  useInviteUser,
  useUpdateUser,
  useDeleteUser,
  type UserWithOrg,
  type UserFilters,
  type InviteUserInput,
  type UpdateUserInput,
} from "@/hooks/useUsers";
import { useOrganizations } from "@/hooks/useOrganizations";
import type { UserRole } from "@prisma/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const roleConfig: Record<
  string,
  { label: string; icon: typeof ShieldCheckIcon; color: string }
> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    icon: TrophyIcon,
    color: "bg-primary-100 text-primary-700",
  },
  ADMIN: {
    label: "Admin",
    icon: ShieldExclamationIcon,
    color: "bg-error-light text-error-dark",
  },
  FRANCHISEE_OWNER: {
    label: "Franchisee",
    icon: BuildingOffice2Icon,
    color: "bg-warning-light text-warning-dark",
  },
  LEAD_TUTOR: {
    label: "Lead Tutor",
    icon: UserIcon,
    color: "bg-success-light text-success-dark",
  },
  TUTOR: {
    label: "Tutor",
    icon: ShieldCheckIcon,
    color: "bg-info-light text-info-dark",
  },
  ONBOARDING_TUTOR: {
    label: "Onboarding",
    icon: ShieldCheckIcon,
    color: "bg-neutral-100 text-neutral-700",
  },
};

const statusConfig: Record<
  string,
  { label: string; icon: typeof CheckCircleIcon; color: string }
> = {
  active: { label: "Active", icon: CheckCircleIcon, color: "text-success" },
  pending: { label: "Pending", icon: ClockIcon, color: "text-warning" },
  inactive: { label: "Inactive", icon: XCircleIcon, color: "text-neutral-400" },
};

const allRoles: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "FRANCHISEE_OWNER",
  "LEAD_TUTOR",
  "TUTOR",
  "ONBOARDING_TUTOR",
];

export default function UsersSettingsPage() {
  const [filters, setFilters] = useState<UserFilters>({});
  const [searchInput, setSearchInput] = useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithOrg | null>(null);

  const { data, isLoading, error } = useUsers(filters);
  const { data: orgsData } = useOrganizations();
  const inviteUser = useInviteUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const users = data?.users || [];
  const stats = data?.stats || { total: 0, active: 0, pending: 0, admins: 0 };
  const organizations = orgsData || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, search: searchInput || undefined }));
  };

  const handleRoleFilter = (role: string) => {
    setFilters((prev) => ({
      ...prev,
      role: role ? (role as UserRole) : undefined,
    }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      status: status ? (status as "active" | "pending" | "inactive") : undefined,
    }));
  };

  const handleEditClick = (user: UserWithOrg) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (user: UserWithOrg) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastActive = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (error) {
    return (
      <div className="p-6">
        <Card className="bg-error-light border-error">
          <CardContent className="py-8 text-center">
            <XCircleIcon className="h-12 w-12 text-error mx-auto mb-4" />
            <h3 className="text-heading-sm text-error mb-2">Error Loading UsersIcon</h3>
            <p className="text-body text-error-dark">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-heading-lg text-neutral-900">
            UsersIcon & Permissions
          </h1>
          <p className="text-body text-neutral-500">
            Manage team members and their permissions
          </p>
        </div>
        <Button onClick={() => setIsInviteModalOpen(true)}>
          <UserPlusIcon className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total UsersIcon",
            value: stats.total,
            icon: UsersIcon,
            color: "bg-neutral-100 text-neutral-600",
          },
          {
            label: "Active",
            value: stats.active,
            icon: CheckCircleIcon,
            color: "bg-success-light text-success",
          },
          {
            label: "Pending",
            value: stats.pending,
            icon: ClockIcon,
            color: "bg-warning-light text-warning",
          },
          {
            label: "Admins",
            value: stats.admins,
            icon: ShieldExclamationIcon,
            color: "bg-error-light text-error",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-[var(--radius-md)] ${stat.color} flex items-center justify-center`}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">
                    {stat.value}
                  </p>
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
          <form onSubmit={handleSearch} className="flex items-center gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="MagnifyingGlassIcon by name or email..."
                className="w-full pl-10 pr-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-4 w-4 text-neutral-400" />
              <select
                value={filters.role || ""}
                onChange={(e) => handleRoleFilter(e.target.value)}
                className="px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Roles</option>
                {allRoles.map((role) => (
                  <option key={role} value={role}>
                    {roleConfig[role]?.label || role}
                  </option>
                ))}
              </select>
              <select
                value={filters.status || ""}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* UsersIcon List */}
      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-heading-sm text-neutral-900">
              {users.length} UsersIcon
            </h2>
          </div>
        </CardHeader>
        {isLoading ? (
          <CardContent className="py-16">
            <LoadingSpinner label="Loading users..." />
          </CardContent>
        ) : users.length === 0 ? (
          <CardContent className="py-16 text-center">
            <UsersIcon className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-heading-sm text-neutral-900 mb-2">
              No users found
            </h3>
            <p className="text-body text-neutral-500 mb-6">
              {filters.search || filters.role || filters.status
                ? "Try adjusting your search or filters"
                : "Invite your first team member to get started"}
            </p>
            <Button onClick={() => setIsInviteModalOpen(true)}>
              <UserPlusIcon className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </CardContent>
        ) : (
          <div className="divide-y divide-border">
            {users.map((user) => {
              const role = roleConfig[user.role] || roleConfig.TUTOR;
              const status = statusConfig[user.status] || statusConfig.active;
              const RoleIcon = role.icon;
              const StatusIcon = status.icon;

              return (
                <div
                  key={user.id}
                  className="flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="h-12 w-12 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold">
                      {getInitials(user.name)}
                    </span>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-neutral-900">
                        {user.name}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-lg ${role.color}`}
                      >
                        <RoleIcon className="h-3 w-3 inline mr-1" />
                        {role.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-body-sm text-neutral-500 flex items-center gap-1">
                        <EnvelopeIcon className="h-3 w-3" />
                        {user.email}
                      </p>
                      {user.organization && (
                        <>
                          <span className="text-neutral-300">•</span>
                          <p className="text-body-sm text-neutral-500">
                            {user.organization.name}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`h-4 w-4 ${status.color}`} />
                    <span className={`text-body-sm ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Last Active */}
                  <div className="text-right min-w-[100px]">
                    <p className="text-body-sm text-neutral-400">Last active</p>
                    <p className="text-body-sm text-neutral-600">
                      {formatLastActive(user.lastActive)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-primary-50 rounded-[var(--radius-md)] transition-colors"
                      title="Edit user"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(user)}
                      className="p-2 text-neutral-400 hover:text-error hover:bg-error-light rounded-[var(--radius-md)] transition-colors"
                      title="Delete user"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-[var(--radius-md)] transition-colors">
                      <EllipsisVerticalIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Invite Info Card */}
      <Card className="mt-6 bg-primary-50 border border-primary-200">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <EnvelopeIcon className="h-5 w-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-primary-900">
                Invite team members
              </h3>
              <p className="text-body-sm text-primary-700">
                Send email invitations to instructors and staff to give them
                access to the curriculum portal.
              </p>
            </div>
            <Button onClick={() => setIsInviteModalOpen(true)}>
              <UserPlusIcon className="h-4 w-4 mr-2" />
              Send Invite
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <InviteUserModal
          organizations={organizations}
          onClose={() => setIsInviteModalOpen(false)}
          onInvite={async (data) => {
            await inviteUser.mutateAsync(data);
            setIsInviteModalOpen(false);
          }}
          isLoading={inviteUser.isPending}
          error={inviteUser.error?.message}
        />
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedUser && (
        <EditUserModal
          user={selectedUser}
          organizations={organizations}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          onSave={async (data) => {
            await updateUser.mutateAsync({ id: selectedUser.id, data });
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          isLoading={updateUser.isPending}
          error={updateUser.error?.message}
        />
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedUser && (
        <DeleteUserModal
          user={selectedUser}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedUser(null);
          }}
          onDelete={async () => {
            await deleteUser.mutateAsync(selectedUser.id);
            setIsDeleteModalOpen(false);
            setSelectedUser(null);
          }}
          isLoading={deleteUser.isPending}
          error={deleteUser.error?.message}
        />
      )}
    </div>
  );
}

// Invite User Modal
function InviteUserModal({
  organizations,
  onClose,
  onInvite,
  isLoading,
  error,
}: {
  organizations: { id: string; name: string }[];
  onClose: () => void;
  onInvite: (data: InviteUserInput) => Promise<void>;
  isLoading: boolean;
  error?: string;
}) {
  const [formData, setFormData] = useState<InviteUserInput>({
    email: "",
    name: "",
    role: "TUTOR",
    organizationId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onInvite({
      ...formData,
      organizationId: formData.organizationId || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-[var(--radius-lg)] shadow-modal w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-heading-sm text-neutral-900">Invite User</h2>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-error-light text-error rounded-[var(--radius-md)] text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-body-sm font-medium text-neutral-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-[var(--radius-input)] border border-border focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-body-sm font-medium text-neutral-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-[var(--radius-input)] border border-border focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-body-sm font-medium text-neutral-700 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  role: e.target.value as UserRole,
                }))
              }
              className="w-full px-3 py-2 rounded-[var(--radius-input)] border border-border focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {allRoles.map((role) => (
                <option key={role} value={role}>
                  {roleConfig[role]?.label || role}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-body-sm font-medium text-neutral-700 mb-1">
              Organization
            </label>
            <select
              value={formData.organizationId}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  organizationId: e.target.value,
                }))
              }
              className="w-full px-3 py-2 rounded-[var(--radius-input)] border border-border focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">No organization (HQ)</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Inviting...
                </>
              ) : (
                <>
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  Send Invite
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit User Modal
function EditUserModal({
  user,
  organizations,
  onClose,
  onSave,
  isLoading,
  error,
}: {
  user: UserWithOrg;
  organizations: { id: string; name: string }[];
  onClose: () => void;
  onSave: (data: UpdateUserInput) => Promise<void>;
  isLoading: boolean;
  error?: string;
}) {
  const [formData, setFormData] = useState<UpdateUserInput>({
    name: user.name,
    role: user.role,
    organizationId: user.organization?.id || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      ...formData,
      organizationId: formData.organizationId || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-[var(--radius-lg)] shadow-modal w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-heading-sm text-neutral-900">Edit User</h2>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-error-light text-error rounded-[var(--radius-md)] text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-body-sm font-medium text-neutral-700 mb-1">
              Email
            </label>
            <input
              type="email"
              disabled
              value={user.email}
              className="w-full px-3 py-2 rounded-[var(--radius-input)] border border-border bg-neutral-50 text-neutral-500"
            />
          </div>
          <div>
            <label className="block text-body-sm font-medium text-neutral-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-[var(--radius-input)] border border-border focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-body-sm font-medium text-neutral-700 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  role: e.target.value as UserRole,
                }))
              }
              className="w-full px-3 py-2 rounded-[var(--radius-input)] border border-border focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {allRoles.map((role) => (
                <option key={role} value={role}>
                  {roleConfig[role]?.label || role}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-body-sm font-medium text-neutral-700 mb-1">
              Organization
            </label>
            <select
              value={formData.organizationId || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  organizationId: e.target.value,
                }))
              }
              className="w-full px-3 py-2 rounded-[var(--radius-input)] border border-border focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">No organization (HQ)</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete User Modal
function DeleteUserModal({
  user,
  onClose,
  onDelete,
  isLoading,
  error,
}: {
  user: UserWithOrg;
  onClose: () => void;
  onDelete: () => Promise<void>;
  isLoading: boolean;
  error?: string;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-[var(--radius-lg)] shadow-modal w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-heading-sm text-neutral-900">Delete User</h2>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          {error && (
            <div className="p-3 mb-4 bg-error-light text-error rounded-[var(--radius-md)] text-sm">
              {error}
            </div>
          )}
          <p className="text-body text-neutral-600 mb-4">
            Are you sure you want to delete <strong>{user.name}</strong> (
            {user.email})? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete User
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
