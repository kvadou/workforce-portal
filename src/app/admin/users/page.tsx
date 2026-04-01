import {
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
  UserPlusIcon,
  UsersIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { redirect } from "next/navigation";

// Redirect to new location under /admin/settings/users
export default function UsersPageRedirect() {
  redirect("/admin/settings/users");
}

// Keeping the old code commented for reference during migration
/*
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mock data for demonstration
const mockUsers = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    role: "ADMIN",
    status: "active",
    lastActive: "2 hours ago",
    avatar: null,
    franchiseLocation: "Downtown Academy",
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "michael@example.com",
    role: "INSTRUCTOR",
    status: "active",
    lastActive: "5 minutes ago",
    avatar: null,
    franchiseLocation: "Westside Chess Club",
  },
  {
    id: "3",
    name: "Emily Williams",
    email: "emily@example.com",
    role: "INSTRUCTOR",
    status: "active",
    lastActive: "1 day ago",
    avatar: null,
    franchiseLocation: "Downtown Academy",
  },
  {
    id: "4",
    name: "James Rodriguez",
    email: "james@example.com",
    role: "VIEWER",
    status: "pending",
    lastActive: "Never",
    avatar: null,
    franchiseLocation: "North County School",
  },
  {
    id: "5",
    name: "Lisa Thompson",
    email: "lisa@example.com",
    role: "INSTRUCTOR",
    status: "inactive",
    lastActive: "2 weeks ago",
    avatar: null,
    franchiseLocation: "Eastside Learning Center",
  },
];

const roleConfig: Record<string, { label: string; icon: typeof ShieldCheckIcon; color: string }> = {
  ADMIN: { label: "Admin", icon: ShieldExclamationIcon, color: "bg-error-light text-error-dark" },
  INSTRUCTOR: { label: "Instructor", icon: ShieldCheckIcon, color: "bg-info-light text-info-dark" },
  VIEWER: { label: "Viewer", icon: ShieldCheckIcon, color: "bg-neutral-100 text-neutral-700" },
};

const statusConfig: Record<string, { label: string; icon: typeof CheckCircleIcon; color: string }> = {
  active: { label: "Active", icon: CheckCircleIcon, color: "text-success" },
  pending: { label: "Pending", icon: ClockIcon, color: "text-warning" },
  inactive: { label: "Inactive", icon: XCircleIcon, color: "text-neutral-400" },
};

function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !selectedRole || user.role === selectedRole;
    const matchesStatus = !selectedStatus || user.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: mockUsers.length,
    active: mockUsers.filter((u) => u.status === "active").length,
    pending: mockUsers.filter((u) => u.status === "pending").length,
    admins: mockUsers.filter((u) => u.role === "ADMIN").length,
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-heading-lg text-neutral-900">UsersIcon</h1>
          <p className="text-body text-neutral-500">
            Manage team members and their permissions
          </p>
        </div>
        <Button>
          <UserPlusIcon className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total UsersIcon", value: stats.total, icon: UsersIcon, color: "bg-neutral-100 text-neutral-600" },
          { label: "Active", value: stats.active, icon: CheckCircleIcon, color: "bg-success-light text-success" },
          { label: "Pending", value: stats.pending, icon: ClockIcon, color: "bg-warning-light text-warning" },
          { label: "Admins", value: stats.admins, icon: ShieldExclamationIcon, color: "bg-error-light text-error" },
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

      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="MagnifyingGlassIcon by name or email..."
                className="w-full pl-10 pr-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-4 w-4 text-neutral-400" />
              <select
                value={selectedRole || ""}
                onChange={(e) => setSelectedRole(e.target.value || null)}
                className="px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="INSTRUCTOR">Instructor</option>
                <option value="VIEWER">Viewer</option>
              </select>
              <select
                value={selectedStatus || ""}
                onChange={(e) => setSelectedStatus(e.target.value || null)}
                className="px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-heading-sm text-neutral-900">
              {filteredUsers.length} UsersIcon
            </h2>
          </div>
        </CardHeader>
        {filteredUsers.length === 0 ? (
          <CardContent className="py-16 text-center">
            <UsersIcon className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-heading-sm text-neutral-900 mb-2">
              No users found
            </h3>
            <p className="text-body text-neutral-500 mb-6">
              {searchQuery
                ? "Try adjusting your search or filters"
                : "Invite your first team member to get started"}
            </p>
            <Button>
              <UserPlusIcon className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </CardContent>
        ) : (
          <div className="divide-y divide-border">
            {filteredUsers.map((user) => {
              const role = roleConfig[user.role];
              const status = statusConfig[user.status];
              const RoleIcon = role.icon;
              const StatusIcon = status.icon;

              return (
                <div
                  key={user.id}
                  className="flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="h-12 w-12 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold">
                      {getInitials(user.name)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-neutral-900">
                        {user.name}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-lg ${role.color}`}>
                        <RoleIcon className="h-3 w-3 inline mr-1" />
                        {role.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-body-sm text-neutral-500 flex items-center gap-1">
                        <EnvelopeIcon className="h-3 w-3" />
                        {user.email}
                      </p>
                      <span className="text-neutral-300">•</span>
                      <p className="text-body-sm text-neutral-500">
                        {user.franchiseLocation}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusIcon className={`h-4 w-4 ${status.color}`} />
                    <span className={`text-body-sm ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="text-right min-w-[100px]">
                    <p className="text-body-sm text-neutral-400">Last active</p>
                    <p className="text-body-sm text-neutral-600">
                      {user.lastActive}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-primary-50 rounded-[var(--radius-md)] transition-colors">
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-neutral-400 hover:text-error hover:bg-error-light rounded-[var(--radius-md)] transition-colors">
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
            <Button>
              <UserPlusIcon className="h-4 w-4 mr-2" />
              Send Invite
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
*/
