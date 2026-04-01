"use client";

import { useState } from "react";
import type { ComponentType, SVGProps } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  useAdminTutorOverview,
  useUpdateTutorProfile,
  useAddCertification,
  useAddLabel,
  useRemoveLabel,
} from "@/hooks/useTutorProfiles";
import type { TutorStatus, TutorCertType, TutorCertStatus } from "@prisma/client";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  UserIcon,
  ChartBarIcon,
  AcademicCapIcon,
  TrophyIcon,
  UsersIcon,
  ShieldCheckIcon,
  ArrowTopRightOnSquareIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  StarIcon,
  CurrencyDollarIcon,
  GiftIcon,
} from "@heroicons/react/24/outline";

import { ProfileTab } from "./tabs/ProfileTab";
import ActivityTab from "./tabs/ActivityTab";
import CalendarTab from "./tabs/CalendarTab";
import CommunicationsTab from "./tabs/CommunicationsTab";
import ReviewsTab from "./tabs/ReviewsTab";
import AccountingTab from "./tabs/AccountingTab";
import ReferralsTab from "./tabs/ReferralsTab";
import TrainingTab from "./tabs/TrainingTab";
import { AchievementsTab } from "./tabs/AchievementsTab";
import ClassesTab from "./tabs/ClassesTab";
import AdminTab from "./tabs/AdminTab";

/* ─── Tab configuration ─── */

type TutorTab =
  | "profile"
  | "activity"
  | "calendar"
  | "communications"
  | "reviews"
  | "accounting"
  | "referrals"
  | "training"
  | "achievements"
  | "classes"
  | "admin";

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

const tabConfig: { key: TutorTab; label: string; icon: HeroIcon }[] = [
  { key: "profile", label: "Profile", icon: UserIcon },
  { key: "activity", label: "Activity", icon: ChartBarIcon },
  { key: "calendar", label: "Calendar", icon: CalendarDaysIcon },
  { key: "communications", label: "Comms", icon: EnvelopeIcon },
  { key: "reviews", label: "Reviews", icon: StarIcon },
  { key: "accounting", label: "Accounting", icon: CurrencyDollarIcon },
  { key: "referrals", label: "Referrals", icon: GiftIcon },
  { key: "training", label: "Training", icon: AcademicCapIcon },
  { key: "achievements", label: "Achievements", icon: TrophyIcon },
  { key: "classes", label: "Classes", icon: UsersIcon },
  { key: "admin", label: "Admin", icon: ShieldCheckIcon },
];

const statusConfig: Record<TutorStatus, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: "Pending", color: "text-warning", bgColor: "bg-warning-light" },
  ACTIVE: { label: "Active", color: "text-success", bgColor: "bg-success-light" },
  INACTIVE: { label: "Inactive", color: "text-neutral-500", bgColor: "bg-neutral-100" },
  QUIT: { label: "Quit", color: "text-accent-orange", bgColor: "bg-accent-orange-light" },
  TERMINATED: { label: "Terminated", color: "text-error", bgColor: "bg-error-light" },
};

/* ─── Page Component ─── */

export default function TutorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Data fetching
  const { data: tutor, isLoading, error } = useAdminTutorOverview(id);
  const updateMutation = useUpdateTutorProfile();
  const addCertMutation = useAddCertification();
  const addLabelMutation = useAddLabel();
  const removeLabelMutation = useRemoveLabel();

  // Tab state
  const [activeTab, setActiveTab] = useState<TutorTab>("profile");

  // Profile tab editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown>>({});

  /* ─── Handlers ─── */

  const handleEdit = () => {
    if (tutor) {
      setEditData({
        status: tutor.status,
        team: tutor.team || "",
        baseHourlyRate: tutor.baseHourlyRate || "",
        chessLevel: tutor.chessLevel || "",
        chessRating: tutor.chessRating || "",
        pronouns: tutor.pronouns || "",
        chessableUsername: tutor.chessableUsername || "",
        bio: tutor.user.bio || "",
        phone: tutor.user.phone || "",
        emergencyContactName: tutor.user.emergencyContactName || "",
        emergencyContactPhone: tutor.user.emergencyContactPhone || "",
        emergencyContactRelation: tutor.user.emergencyContactRelation || "",
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    await updateMutation.mutateAsync({ id, data: editData });
    setIsEditing(false);
  };

  const handleAdminSave = async (data: Record<string, unknown>) => {
    await updateMutation.mutateAsync({ id, data });
  };

  const handleAddCert = async (data: { type: TutorCertType; status: TutorCertStatus }) => {
    await addCertMutation.mutateAsync({ tutorProfileId: id, data });
  };

  const handleAddLabel = async (data: { name: string; color: string }) => {
    await addLabelMutation.mutateAsync({ tutorProfileId: id, data });
  };

  const handleRemoveLabel = async (labelId: string) => {
    await removeLabelMutation.mutateAsync({ tutorProfileId: id, labelId });
  };

  /* ─── Loading / Error ─── */

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <LoadingSpinner fullPage />
      </div>
    );
  }

  if (error || !tutor) {
    return (
      <div className="p-4 sm:p-6">
        <Card>
          <CardContent className="py-16 text-center">
            <ExclamationCircleIcon className="h-16 w-16 text-error mx-auto mb-4" />
            <h3 className="text-heading-sm text-neutral-900 mb-2">Tutor not found</h3>
            <p className="text-body text-neutral-500 mb-6">
              The tutor profile you&apos;re looking for doesn&apos;t exist
            </p>
            <Button onClick={() => router.push("/admin/tutors")}>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Tutors
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = statusConfig[tutor.status];

  /* ─── Render ─── */

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-neutral-200">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/tutors"
              className="p-2 hover:bg-neutral-100 rounded-[var(--radius-md)] transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 text-neutral-500" />
            </Link>
            <div className="flex-1">
              <h1 className="text-heading-lg text-neutral-900">{tutor.user.name}</h1>
              <p className="text-body text-neutral-500">Tutor Profile</p>
            </div>
            <span className={`px-3 py-1.5 rounded-full ${status.bgColor} ${status.color} font-medium`}>
              {status.label}
            </span>
            {tutor.tutorCruncherId && (
              <>
                <a
                  href={`https://join.acmeworkforce.com/tutors/${tutor.tutorCruncherId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors flex items-center gap-2 text-sm"
                >
                  OpsHub
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </a>
                <a
                  href={`https://account.acmeworkforce.com/contractors/${tutor.tutorCruncherId}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2 text-sm"
                >
                  TutorCruncher
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </a>
              </>
            )}
            {activeTab === "profile" && !isEditing ? (
              <Button onClick={handleEdit}>
                <PencilSquareIcon className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : activeTab === "profile" && isEditing ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckIcon className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-neutral-200 px-4 sm:px-6 overflow-x-auto scrollbar-hide">
          <nav className="flex gap-1 -mb-px">
            {tabConfig.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-3 border-b-2 font-medium text-xs whitespace-nowrap transition-colors ${
                    isActive
                      ? "border-primary-500 text-primary-500"
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
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          {activeTab === "profile" && (
            <ProfileTab
              tutor={tutor}
              isEditing={isEditing}
              editData={editData}
              setEditData={setEditData}
            />
          )}

          {activeTab === "activity" && (
            <ActivityTab
              tutorProfileId={id}
              tutorCruncherId={tutor.tutorCruncherId}
            />
          )}

          {activeTab === "calendar" && (
            <CalendarTab
              tutorProfileId={id}
              tutorCruncherId={tutor.tutorCruncherId}
            />
          )}

          {activeTab === "communications" && (
            <CommunicationsTab tutor={tutor} />
          )}

          {activeTab === "reviews" && (
            <ReviewsTab tutor={tutor} />
          )}

          {activeTab === "accounting" && (
            <AccountingTab tutor={tutor} />
          )}

          {activeTab === "referrals" && (
            <ReferralsTab tutorProfileId={id} tutorCruncherId={tutor.tutorCruncherId} />
          )}

          {activeTab === "training" && <TrainingTab tutor={tutor} />}

          {activeTab === "achievements" && <AchievementsTab tutor={tutor} />}

          {activeTab === "classes" && <ClassesTab tutor={tutor} />}

          {activeTab === "admin" && (
            <AdminTab
              tutor={tutor}
              onSave={handleAdminSave}
              savePending={updateMutation.isPending}
              onAddCert={handleAddCert}
              addCertPending={addCertMutation.isPending}
              onAddLabel={handleAddLabel}
              addLabelPending={addLabelMutation.isPending}
              onRemoveLabel={handleRemoveLabel}
              removeLabelPending={removeLabelMutation.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
}
