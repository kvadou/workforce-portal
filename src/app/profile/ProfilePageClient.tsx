"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowPathIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  HeartIcon,
  PhoneIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useProfile, useUpdateProfile, type ProfileUpdateData } from "@/hooks/useProfile";
import { useProfileOverview } from "@/hooks/useProfileOverview";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import {
  ProfileSection,
  ProfileField,
  ProfileInput,
  ProfileTextarea,
  ProfileSelect,
} from "@/components/profile/ProfileSection";
import { ProfileCareerTab } from "./ProfileCareerTab";

type ProfileTab = "personal" | "career";

const tabConfig: { key: ProfileTab; label: string; icon: typeof UserIcon }[] = [
  { key: "personal", label: "Personal Info", icon: UserIcon },
  { key: "career", label: "Career", icon: BriefcaseIcon },
];

const statusDisplay: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: "Active", color: "text-success-dark", bg: "bg-success-light" },
  PENDING: { label: "Pending", color: "text-warning-dark", bg: "bg-warning-light" },
  INACTIVE: { label: "Inactive", color: "text-neutral-600", bg: "bg-neutral-100" },
  QUIT: { label: "Quit", color: "text-accent-orange", bg: "bg-accent-orange-light" },
  TERMINATED: { label: "Terminated", color: "text-error-dark", bg: "bg-error-light" },
};

const languageOptions = [
  "English", "Spanish", "French", "Mandarin", "Cantonese",
  "Japanese", "Korean", "German", "Italian", "Portuguese",
  "Russian", "Arabic", "Hindi", "Other",
];

const relationshipOptions = [
  { value: "spouse", label: "Spouse/Partner" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "child", label: "Child (Adult)" },
  { value: "friend", label: "Friend" },
  { value: "other", label: "Other" },
];

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

function getRoleDisplay(role: string): string {
  const roleMap: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    FRANCHISEE_OWNER: "Franchisee Owner",
    LEAD_TUTOR: "Lead Tutor",
    TUTOR: "Tutor",
    ONBOARDING_TUTOR: "Onboarding Tutor",
  };
  return roleMap[role] || role;
}

interface ProfilePageClientProps {
  contractorId: number | null;
}

export function ProfilePageClient({ contractorId: _contractorId }: ProfilePageClientProps) {
  const { data: profile, isLoading, error } = useProfile();
  const { data: overviewData, isLoading: overviewLoading } = useProfileOverview();
  const { mutateAsync: updateProfile, isPending: isUpdating } = useUpdateProfile();
  const [activeTab, setActiveTab] = useState<ProfileTab>("personal");
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const [personalForm, setPersonalForm] = useState({
    name: "",
    phone: "",
    bio: "",
    dateOfBirth: "",
    languages: [] as string[],
  });

  const [teachingForm, setTeachingForm] = useState({
    yearsExperience: "",
    previousExperience: "",
    teachingStylePreferences: "",
    availabilityNotes: "",
  });

  const [emergencyForm, setEmergencyForm] = useState({
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
  });

  const handleEditStart = useCallback(
    (section: string) => {
      if (!profile) return;
      if (section === "personal") {
        setPersonalForm({
          name: profile.name || "",
          phone: profile.phone || "",
          bio: profile.bio || "",
          dateOfBirth: formatDateForInput(profile.dateOfBirth),
          languages: profile.languages || [],
        });
      } else if (section === "teaching") {
        setTeachingForm({
          yearsExperience: profile.yearsExperience?.toString() || "",
          previousExperience: profile.previousExperience || "",
          teachingStylePreferences: profile.teachingStylePreferences || "",
          availabilityNotes: profile.availabilityNotes || "",
        });
      } else if (section === "emergency") {
        setEmergencyForm({
          emergencyContactName: profile.emergencyContactName || "",
          emergencyContactPhone: profile.emergencyContactPhone || "",
          emergencyContactRelation: profile.emergencyContactRelation || "",
        });
      }
      setEditingSection(section);
      setSaveMessage(null);
    },
    [profile]
  );

  const handleEditCancel = useCallback(() => {
    setEditingSection(null);
    setSaveMessage(null);
  }, []);

  const handleSave = useCallback(
    async (section: string) => {
      let updateData: ProfileUpdateData = {};
      if (section === "personal") {
        updateData = {
          name: personalForm.name,
          phone: personalForm.phone,
          bio: personalForm.bio,
          dateOfBirth: personalForm.dateOfBirth || null,
          languages: personalForm.languages,
        };
      } else if (section === "teaching") {
        updateData = {
          yearsExperience: teachingForm.yearsExperience ? parseInt(teachingForm.yearsExperience, 10) : null,
          previousExperience: teachingForm.previousExperience,
          teachingStylePreferences: teachingForm.teachingStylePreferences,
          availabilityNotes: teachingForm.availabilityNotes,
        };
      } else if (section === "emergency") {
        updateData = {
          emergencyContactName: emergencyForm.emergencyContactName,
          emergencyContactPhone: emergencyForm.emergencyContactPhone,
          emergencyContactRelation: emergencyForm.emergencyContactRelation,
        };
      }
      try {
        await updateProfile(updateData);
        setEditingSection(null);
        setSaveMessage({ type: "success", text: "Profile updated successfully!" });
        setTimeout(() => setSaveMessage(null), 3000);
      } catch (err) {
        setSaveMessage({
          type: "error",
          text: err instanceof Error ? err.message : "Failed to update profile",
        });
      }
    },
    [personalForm, teachingForm, emergencyForm, updateProfile]
  );

  const toggleLanguage = useCallback((language: string) => {
    setPersonalForm((prev) => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter((l) => l !== language)
        : [...prev.languages, language],
    }));
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <ArrowPathIcon className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !profile) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <p className="text-error mb-4">Failed to load profile</p>
        </div>
      </DashboardLayout>
    );
  }

  const tutorStatus = overviewData?.tutorStatus
    ? statusDisplay[overviewData.tutorStatus]
    : null;

  return (
    <DashboardLayout>
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Page Title Row */}
        <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-900">{profile.name || "My Profile"}</h1>
          {tutorStatus && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${tutorStatus.color} ${tutorStatus.bg}`}>
              {tutorStatus.label}
            </span>
          )}
        </div>

        {/* Tab Bar */}
        <div className="border-b border-neutral-200 px-5 sm:px-6">
          <nav className="flex gap-6 -mb-px">
            {tabConfig.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-1 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
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

        {/* Tab Content with Contact Sidebar */}
        <div className="px-5 sm:px-6 py-5 sm:py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Contact Card — sticky sidebar like OpsHub */}
            <div className="lg:w-72 flex-shrink-0">
              <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-5">
                <div className="flex flex-col items-center text-center">
                  <AvatarUpload
                    currentAvatarUrl={profile.avatarUrl}
                    userName={profile.name}
                  />
                  <h2 className="text-base font-semibold text-neutral-900 mt-3">{profile.name}</h2>
                  <p className="text-sm text-neutral-500">
                    {getRoleDisplay(profile.role)}
                  </p>
                  {profile.organization && (
                    <p className="text-xs text-neutral-400 mt-0.5">{profile.organization.name}</p>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-neutral-200 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <EnvelopeIcon className="h-4 w-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-neutral-600 break-all">{profile.email}</span>
                  </div>
                  {profile.phone && (
                    <div className="flex items-center gap-2.5">
                      <PhoneIcon className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                      <span className="text-sm text-neutral-600">{profile.phone}</span>
                    </div>
                  )}
                  {profile.hireDate && (
                    <div className="flex items-center gap-2.5">
                      <CalendarDaysIcon className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                      <span className="text-sm text-neutral-600">Since {formatDate(profile.hireDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
          {activeTab === "personal" && (
            <div className="space-y-6">
              {saveMessage && (
                <div
                  className={`px-4 py-3 rounded-xl flex items-center gap-2 text-sm ${
                    saveMessage.type === "success"
                      ? "bg-success-light text-success-dark border border-success"
                      : "bg-error-light text-error-dark border border-error"
                  }`}
                >
                  {saveMessage.type === "success" && <CheckCircleIcon className="w-5 h-5" />}
                  {saveMessage.text}
                </div>
              )}

              <ProfileSection
                title="Personal Information"
                icon={<UserIcon className="w-4 h-4" />}
                isEditing={editingSection === "personal"}
                onEditToggle={(editing) => editing ? handleEditStart("personal") : handleEditCancel()}
                onSave={() => handleSave("personal")}
                isSaving={isUpdating}
                editContent={
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ProfileInput label="Full Name" value={personalForm.name} onChange={(v) => setPersonalForm((p) => ({ ...p, name: v }))} required icon={<UserIcon className="w-4 h-4" />} />
                      <ProfileInput label="Phone Number" value={personalForm.phone} onChange={(v) => setPersonalForm((p) => ({ ...p, phone: v }))} type="tel" placeholder="(555) 555-5555" icon={<PhoneIcon className="w-4 h-4" />} />
                      <ProfileInput label="Date of Birth" value={personalForm.dateOfBirth} onChange={(v) => setPersonalForm((p) => ({ ...p, dateOfBirth: v }))} type="date" icon={<CalendarDaysIcon className="w-4 h-4" />} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Languages Spoken</label>
                      <div className="flex flex-wrap gap-2">
                        {languageOptions.map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => toggleLanguage(lang)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                              personalForm.languages.includes(lang)
                                ? "bg-primary-100 text-primary-700 border border-primary-300"
                                : "bg-neutral-100 text-neutral-600 border border-transparent hover:bg-neutral-200"
                            }`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>
                    <ProfileTextarea label="Bio / About You" value={personalForm.bio} onChange={(v) => setPersonalForm((p) => ({ ...p, bio: v }))} placeholder="Tell us a bit about yourself..." rows={4} />
                  </div>
                }
              >
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ProfileField label="Full Name" value={profile.name} />
                  <ProfileField label="Phone Number" value={profile.phone} />
                  <ProfileField label="Date of Birth" value={formatDate(profile.dateOfBirth)} />
                  <div>
                    <dt className="text-sm font-medium text-neutral-500">Languages</dt>
                    <dd className="mt-1">
                      {profile.languages?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {profile.languages.map((lang) => (
                            <span key={lang} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                              {lang}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-neutral-400 italic">Not provided</span>
                      )}
                    </dd>
                  </div>
                  <div className="md:col-span-2">
                    <dt className="text-sm font-medium text-neutral-500">Bio</dt>
                    <dd className="mt-1 text-neutral-900 whitespace-pre-wrap">
                      {profile.bio || <span className="text-neutral-400 italic">Not provided</span>}
                    </dd>
                  </div>
                </dl>
              </ProfileSection>

              <ProfileSection
                title="Teaching Profile"
                icon={<BriefcaseIcon className="w-4 h-4" />}
                isEditing={editingSection === "teaching"}
                onEditToggle={(editing) => editing ? handleEditStart("teaching") : handleEditCancel()}
                onSave={() => handleSave("teaching")}
                isSaving={isUpdating}
                editContent={
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ProfileInput label="Years of Experience" value={teachingForm.yearsExperience} onChange={(v) => setTeachingForm((p) => ({ ...p, yearsExperience: v }))} type="number" placeholder="0" />
                    </div>
                    <ProfileTextarea label="Previous Experience" value={teachingForm.previousExperience} onChange={(v) => setTeachingForm((p) => ({ ...p, previousExperience: v }))} placeholder="Describe any previous teaching, tutoring, or relevant experience..." rows={4} />
                    <ProfileTextarea label="Teaching Style & Preferences" value={teachingForm.teachingStylePreferences} onChange={(v) => setTeachingForm((p) => ({ ...p, teachingStylePreferences: v }))} placeholder="Describe your teaching approach and any preferences..." />
                    <ProfileTextarea label="Availability Notes" value={teachingForm.availabilityNotes} onChange={(v) => setTeachingForm((p) => ({ ...p, availabilityNotes: v }))} placeholder="e.g., Weekdays after 3pm, Saturday mornings..." />
                  </div>
                }
              >
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ProfileField label="Years of Experience" value={profile.yearsExperience !== null ? `${profile.yearsExperience} years` : null} />
                  <ProfileField label="Availability" value={profile.availabilityNotes} />
                  <div className="md:col-span-2">
                    <dt className="text-sm font-medium text-neutral-500">Previous Experience</dt>
                    <dd className="mt-1 text-neutral-900 whitespace-pre-wrap">
                      {profile.previousExperience || <span className="text-neutral-400 italic">Not provided</span>}
                    </dd>
                  </div>
                  <div className="md:col-span-2">
                    <dt className="text-sm font-medium text-neutral-500">Teaching Style</dt>
                    <dd className="mt-1 text-neutral-900 whitespace-pre-wrap">
                      {profile.teachingStylePreferences || <span className="text-neutral-400 italic">Not provided</span>}
                    </dd>
                  </div>
                </dl>
              </ProfileSection>

              <ProfileSection
                title="Emergency Contact"
                icon={<HeartIcon className="w-4 h-4" />}
                isEditing={editingSection === "emergency"}
                onEditToggle={(editing) => editing ? handleEditStart("emergency") : handleEditCancel()}
                onSave={() => handleSave("emergency")}
                isSaving={isUpdating}
                editContent={
                  <div className="space-y-6">
                    <div className="bg-warning-light border border-warning rounded-xl p-4 mb-4">
                      <p className="text-sm text-warning-dark">
                        Emergency contact information is required and will only be used in case of an emergency.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ProfileInput label="Contact Name" value={emergencyForm.emergencyContactName} onChange={(v) => setEmergencyForm((p) => ({ ...p, emergencyContactName: v }))} required placeholder="Full name" />
                      <ProfileInput label="Contact Phone" value={emergencyForm.emergencyContactPhone} onChange={(v) => setEmergencyForm((p) => ({ ...p, emergencyContactPhone: v }))} type="tel" required placeholder="(555) 555-5555" />
                      <ProfileSelect label="Relationship" value={emergencyForm.emergencyContactRelation} onChange={(v) => setEmergencyForm((p) => ({ ...p, emergencyContactRelation: v }))} options={relationshipOptions} placeholder="Select relationship" />
                    </div>
                  </div>
                }
              >
                <dl className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <ProfileField label="Contact Name" value={profile.emergencyContactName} />
                  <ProfileField label="Phone Number" value={profile.emergencyContactPhone} />
                  <ProfileField label="Relationship" value={profile.emergencyContactRelation ? relationshipOptions.find((r) => r.value === profile.emergencyContactRelation)?.label || profile.emergencyContactRelation : null} />
                </dl>
              </ProfileSection>

              <ProfileSection
                title="Account Information"
                icon={<BuildingOfficeIcon className="w-4 h-4" />}
                canEdit={false}
              >
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ProfileField label="Email" value={profile.email} />
                  <ProfileField label="Role" value={getRoleDisplay(profile.role)} />
                  <ProfileField label="Organization" value={profile.organization?.name} />
                  <ProfileField label="Member Since" value={formatDate(profile.createdAt)} />
                </dl>
                <div className="mt-4 pt-4 border-t border-neutral-200">
                  <Link href="/settings" className="text-sm text-primary-500 hover:text-primary-700 font-medium transition-colors">
                    Go to Settings to change your password →
                  </Link>
                </div>
              </ProfileSection>
            </div>
          )}

          {activeTab === "career" && (
            overviewLoading ? (
              <div className="flex items-center justify-center min-h-[300px]">
                <ArrowPathIcon className="w-8 h-8 text-primary-600 animate-spin" />
              </div>
            ) : overviewData ? (
              <ProfileCareerTab data={overviewData} />
            ) : (
              <div className="text-center py-12 text-neutral-500">
                <BriefcaseIcon className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                <p>No career data available yet</p>
              </div>
            )
          )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
