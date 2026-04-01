"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDaysIcon,
  Cog6ToothIcon,
  UserPlusIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { AddCandidateModal } from "./AddCandidateModal";

export function OnboardingPageHeader() {
  const [showAddModal, setShowAddModal] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-heading-lg text-neutral-900">
            Onboarding Management
          </h1>
          <p className="text-body-md text-neutral-600">
            Track and manage new tutor onboarding
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <UserPlusIcon className="h-4 w-4" />
            <span className="text-body-sm font-medium">Add Candidate</span>
          </button>
          <Link
            href="/admin/onboarding/cohorts"
            className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <UsersIcon className="h-4 w-4" />
            <span className="text-body-sm">Cohorts</span>
          </Link>
          <Link
            href="/admin/onboarding/sessions"
            className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <CalendarDaysIcon className="h-4 w-4" />
            <span className="text-body-sm">Sessions</span>
          </Link>
          <Link
            href="/admin/onboarding/content"
            className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <Cog6ToothIcon className="h-4 w-4" />
            <span className="text-body-sm">Content</span>
          </Link>
        </div>
      </div>

      <AddCandidateModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
