"use client";

import {
  BuildingOfficeIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  TrophyIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Organization {
  id: string;
  name: string;
  subdomain: string;
  logoUrl: string | null;
  primaryColor: string | null;
  isHQ: boolean;
  isActive: boolean;
  _count?: {
    users: number;
  };
}

export default function OrganizationsSettingsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteOrgId, setDeleteOrgId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    subdomain: "",
    primaryColor: "#6366f1",
    isHQ: false,
    isActive: true,
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/organizations");
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data);
      }
    } catch (error) {
      console.error("Failed to fetch organizations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const method = editingOrg ? "PUT" : "POST";
      const url = editingOrg
        ? `/api/organizations/${editingOrg.id}`
        : "/api/organizations";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchOrganizations();
        setShowModal(false);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to save organization:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/organizations/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchOrganizations();
      }
    } catch (error) {
      console.error("Failed to delete organization:", error);
    } finally {
      setDeleteOrgId(null);
    }
  };

  const openEditModal = (org: Organization) => {
    setEditingOrg(org);
    setFormData({
      name: org.name,
      subdomain: org.subdomain,
      primaryColor: org.primaryColor || "#6366f1",
      isHQ: org.isHQ,
      isActive: org.isActive,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      subdomain: "",
      primaryColor: "#6366f1",
      isHQ: false,
      isActive: true,
    });
    setEditingOrg(null);
  };

  const filteredOrgs = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.subdomain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: organizations.length,
    active: organizations.filter((o) => o.isActive).length,
    hq: organizations.filter((o) => o.isHQ).length,
    franchises: organizations.filter((o) => !o.isHQ).length,
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-heading-lg text-neutral-900">Organizations</h1>
          <p className="text-body text-neutral-500">
            Manage franchise locations and multi-tenant settings
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Organization
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: stats.total, icon: BuildingOfficeIcon, color: "bg-neutral-100 text-neutral-600" },
          { label: "Active", value: stats.active, icon: CheckCircleIcon, color: "bg-success-light text-success" },
          { label: "HQ Locations", value: stats.hq, icon: TrophyIcon, color: "bg-primary-100 text-primary-600" },
          { label: "Franchises", value: stats.franchises, icon: GlobeAltIcon, color: "bg-info-light text-info" },
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

      {/* MagnifyingGlassIcon */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="MagnifyingGlassIcon organizations..."
              className="w-full pl-10 pr-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Organizations List */}
      <Card>
        <CardHeader className="border-b border-border">
          <h2 className="text-heading-sm text-neutral-900">
            {filteredOrgs.length} Organizations
          </h2>
        </CardHeader>
        {isLoading ? (
          <CardContent className="py-16">
            <LoadingSpinner />
          </CardContent>
        ) : filteredOrgs.length === 0 ? (
          <CardContent className="py-16 text-center">
            <BuildingOfficeIcon className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-heading-sm text-neutral-900 mb-2">
              No organizations found
            </h3>
            <p className="text-body text-neutral-500 mb-6">
              Create your first organization to get started
            </p>
            <Button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Organization
            </Button>
          </CardContent>
        ) : (
          <div className="divide-y divide-border">
            {filteredOrgs.map((org) => (
              <div
                key={org.id}
                className="flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors"
              >
                {/* Logo/Color */}
                <div
                  className="h-12 w-12 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: org.primaryColor || "#6366f1" }}
                >
                  <BuildingOfficeIcon className="h-6 w-6 text-white" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-neutral-900">
                      {org.name}
                    </h3>
                    {org.isHQ && (
                      <span className="text-xs px-2 py-0.5 rounded-lg bg-primary-100 text-primary-700">
                        <TrophyIcon className="h-3 w-3 inline mr-1" />
                        HQ
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-body-sm text-neutral-500 flex items-center gap-1">
                      <GlobeAltIcon className="h-3 w-3" />
                      {org.subdomain}.workforceportal.com
                    </p>
                    {org._count && (
                      <>
                        <span className="text-neutral-300">•</span>
                        <p className="text-body-sm text-neutral-500">
                          {org._count.users} users
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  {org.isActive ? (
                    <>
                      <CheckCircleIcon className="h-4 w-4 text-success" />
                      <span className="text-body-sm text-success">Active</span>
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="h-4 w-4 text-neutral-400" />
                      <span className="text-body-sm text-neutral-400">Inactive</span>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(org)}
                    className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-primary-50 rounded-[var(--radius-md)] transition-colors"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  {!org.isHQ && (
                    <button
                      onClick={() => setDeleteOrgId(org.id)}
                      className="p-2 text-neutral-400 hover:text-error hover:bg-error-light rounded-[var(--radius-md)] transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ConfirmDialog
        isOpen={deleteOrgId !== null}
        onClose={() => setDeleteOrgId(null)}
        onConfirm={() => deleteOrgId && handleDelete(deleteOrgId)}
        title="Delete Organization"
        message="Are you sure you want to delete this organization?"
        variant="danger"
        confirmLabel="Delete"
      />

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-modal p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-heading-md text-neutral-900">
                {editingOrg ? "Edit Organization" : "Add Organization"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 text-neutral-400 hover:text-neutral-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-body-sm font-medium text-neutral-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  placeholder="Westside Franchise"
                />
              </div>

              <div>
                <label className="block text-body-sm font-medium text-neutral-700 mb-1">
                  Subdomain *
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={formData.subdomain}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                      }))
                    }
                    className="flex-1 px-4 py-2 border border-r-0 border-neutral-300 rounded-l-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                    placeholder="westside"
                  />
                  <span className="px-3 py-2 bg-neutral-100 border border-neutral-300 rounded-r-lg text-neutral-500 text-body-sm">
                    .workforceportal.com
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-body-sm font-medium text-neutral-700 mb-1">
                  Brand Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, primaryColor: e.target.value }))
                    }
                    className="h-10 w-10 rounded border border-neutral-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, primaryColor: e.target.value }))
                    }
                    className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isHQ}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, isHQ: e.target.checked }))
                    }
                    className="h-4 w-4 text-primary-600 rounded"
                  />
                  <span className="text-body-sm text-neutral-700">HQ Location</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                    className="h-4 w-4 text-primary-600 rounded"
                  />
                  <span className="text-body-sm text-neutral-700">Active</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-body-sm text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving || !formData.name || !formData.subdomain}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-body-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : editingOrg ? "Save Changes" : "Create Organization"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
