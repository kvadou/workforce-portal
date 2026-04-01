"use client";

import {
  AcademicCapIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ClipboardDocumentCheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShieldCheckIcon,
  TrophyIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  useOnboardingDetail,
  useToggleChecklist,
  useUpdateNotes,
  useActivationStep,
  useGoogleGroups,
} from "@/hooks/useOnboardingAdmin";
import { StatusBadge } from "./components";

import { OverviewTab } from "./tabs/OverviewTab";
import ActivityTab from "./tabs/ActivityTab";
import TrainingTab from "./tabs/TrainingTab";
import { AchievementsTab } from "./tabs/AchievementsTab";
import AdminTab from "./tabs/AdminTab";

/* ─── Tab configuration ─── */

type OnboardingTab = "overview" | "activity" | "training" | "achievements" | "admin";

const tabConfig: { key: OnboardingTab; label: string; icon: typeof UserIcon }[] = [
  { key: "overview", label: "Overview", icon: UserIcon },
  { key: "activity", label: "Activity", icon: ClipboardDocumentCheckIcon },
  { key: "training", label: "Training", icon: AcademicCapIcon },
  { key: "achievements", label: "Achievements", icon: TrophyIcon },
  { key: "admin", label: "Admin", icon: ShieldCheckIcon },
];

/* ─── Page Component ─── */

export default function AdminOnboardingDetailPage() {
  const params = useParams();
  const id = params.id as string;

  // Data fetching
  const { data, isLoading, error } = useOnboardingDetail(id);
  const toggleChecklist = useToggleChecklist(id);
  const updateNotes = useUpdateNotes(id);
  const activationStep = useActivationStep(id);
  const { data: groupsData } = useGoogleGroups(id);

  // State
  const [activeTab, setActiveTab] = useState<OnboardingTab>("overview");
  const [selectedGroup, setSelectedGroup] = useState("");

  // Callbacks
  const handleToggle = useCallback(
    (field: string, value: boolean) => {
      toggleChecklist.mutate(
        { field, value },
        {
          onSuccess: () => {
            toast.success(value ? "Checked" : "Unchecked");
          },
          onError: (err) => {
            toast.error(err.message);
          },
        }
      );
    },
    [toggleChecklist]
  );

  const handleNoteSave = useCallback(
    (field: string, value: string) => {
      updateNotes.debouncedSave({ [field]: value });
    },
    [updateNotes]
  );

  const handleActivationStep = useCallback(
    (step: string, groupKey?: string) => {
      activationStep.mutate(
        { step, groupKey },
        {
          onSuccess: (result) => {
            toast.success(`${step.replace(/_/g, " ")} completed`);
            if (result.branchId) {
              toast.success(`Branch ID: ${result.branchId}`);
            }
            if (result.contractorId) {
              toast.success(`TC Contractor ID: ${result.contractorId}`);
            }
          },
          onError: (err) => {
            toast.error(err.message);
          },
        }
      );
    },
    [activationStep]
  );

  /* ─── Loading / Error ─── */

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <p className="text-error">
          Failed to load onboarding data. {error?.message}
        </p>
        <Link
          href="/admin/onboarding"
          className="text-primary-600 hover:underline mt-2 inline-block"
        >
          Back to Onboarding
        </Link>
      </div>
    );
  }

  /* ─── Render ─── */

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        {data.cohortMembership ? (
          <Link
            href={`/admin/onboarding/cohorts/${data.cohortMembership.cohortId}`}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="text-body-sm">
              Back to {data.cohortMembership.cohortName}
            </span>
          </Link>
        ) : (
          <Link
            href="/admin/onboarding"
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="text-body-sm">Back to Onboarding</span>
          </Link>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {data.user.headshotUrl || data.user.avatarUrl ? (
              <img
                src={data.user.headshotUrl || data.user.avatarUrl || ""}
                alt={data.user.name || ""}
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-primary-100 text-primary-700 font-semibold text-lg flex items-center justify-center">
                {(data.user.name || "?")[0].toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-heading-lg text-neutral-900">
                {data.user.name || "Unnamed UserIcon"}
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <span className="flex items-center gap-1 text-body-sm text-neutral-500">
                  <EnvelopeIcon className="h-3.5 w-3.5" />
                  {data.user.email}
                </span>
                {data.user.phone && (
                  <span className="flex items-center gap-1 text-body-sm text-neutral-500">
                    <PhoneIcon className="h-3.5 w-3.5" />
                    {data.user.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
          <StatusBadge status={data.status} />
        </div>
      </div>

      {/* Tab Bar */}
      <div className="border-b border-neutral-200 mb-6">
        <nav className="flex gap-1 -mb-px">
          {tabConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab data={data} />}

      {activeTab === "activity" && (
        <ActivityTab
          data={data}
          onToggle={handleToggle}
          onNoteSave={handleNoteSave}
          togglePending={toggleChecklist.isPending}
        />
      )}

      {activeTab === "training" && (
        <TrainingTab
          data={data}
          onToggle={handleToggle}
          onNoteSave={handleNoteSave}
          togglePending={toggleChecklist.isPending}
        />
      )}

      {activeTab === "achievements" && <AchievementsTab data={data} />}

      {activeTab === "admin" && (
        <AdminTab
          data={data}
          googleGroups={groupsData?.groups}
          onNoteSave={handleNoteSave}
          onActivationStep={handleActivationStep}
          selectedGroup={selectedGroup}
          setSelectedGroup={setSelectedGroup}
          activationPending={activationStep.isPending}
        />
      )}
    </div>
  );
}
