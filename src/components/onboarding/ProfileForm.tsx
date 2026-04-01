"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import {
  UserIcon,
  PhoneIcon,
  CalendarDaysIcon,
  HeartIcon,
  BriefcaseIcon,
  CameraIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/20/solid";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  bio: string | null;
  headshotUrl: string | null;
  dateOfBirth: Date | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  languages: string[];
  teachingStylePreferences: string | null;
  availabilityNotes: string | null;
  yearsExperience: number | null;
  previousExperience: string | null;
}

interface ProfileFormProps {
  user: UserProfile;
  progressId: string;
  isComplete: boolean;
}

type TabId = "personal" | "professional" | "emergency";

const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "personal", label: "Personal", icon: UserIcon },
  { id: "professional", label: "Experience", icon: BriefcaseIcon },
  { id: "emergency", label: "Emergency", icon: HeartIcon },
];

const languageOptions = [
  "English", "Spanish", "French", "Mandarin", "Cantonese",
  "Japanese", "Korean", "German", "Italian", "Portuguese",
  "Russian", "Arabic", "Hindi", "Other",
];

export function ProfileForm({
  user,
  progressId,
  isComplete: initialIsComplete,
}: ProfileFormProps) {
  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const [isSaving, setIsSaving] = useState(false);
  const [isComplete, setIsComplete] = useState(initialIsComplete);
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [formData, setFormData] = useState({
    name: user.name || "",
    phone: user.phone || "",
    bio: user.bio || "",
    headshotUrl: user.headshotUrl || "",
    dateOfBirth: user.dateOfBirth
      ? new Date(user.dateOfBirth).toISOString().split("T")[0]
      : "",
    emergencyContactName: user.emergencyContactName || "",
    emergencyContactPhone: user.emergencyContactPhone || "",
    emergencyContactRelation: user.emergencyContactRelation || "",
    languages: user.languages || [],
    teachingStylePreferences: user.teachingStylePreferences || "",
    availabilityNotes: user.availabilityNotes || "",
    yearsExperience: user.yearsExperience?.toString() || "",
    previousExperience: user.previousExperience || "",
  });

  const handleChange = useCallback(
    (field: string, value: string | string[] | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setSaveMessage(null);
    },
    []
  );

  const handleLanguageToggle = useCallback((language: string) => {
    setFormData((prev) => {
      const current = prev.languages;
      if (current.includes(language)) {
        return { ...prev, languages: current.filter((l) => l !== language) };
      }
      return { ...prev, languages: [...current, language] };
    });
    setSaveMessage(null);
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/onboarding/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          progressId,
          yearsExperience: formData.yearsExperience
            ? parseInt(formData.yearsExperience)
            : null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSaveMessage({ text: "Profile saved successfully!", type: "success" });
        if (data.profileComplete) {
          setIsComplete(true);
        }
      } else {
        setSaveMessage({ text: "Failed to save. Please try again.", type: "error" });
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      setSaveMessage({ text: "An error occurred. Please try again.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  }, [formData, progressId]);

  const personalComplete = !!(formData.name && formData.phone);
  const emergencyComplete = !!(formData.emergencyContactName && formData.emergencyContactPhone);
  const isFormValid = personalComplete && emergencyComplete;

  const tabCompletion: Record<TabId, boolean> = {
    personal: personalComplete,
    professional: true, // optional fields
    emergency: emergencyComplete,
  };

  // Completed state
  if (isComplete) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#E8F8ED] flex items-center justify-center flex-shrink-0">
            <CheckCircleSolid className="h-5 w-5 text-[#34B256]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-body font-semibold text-neutral-900">Profile Complete</h2>
            <p className="text-body-sm text-neutral-500">Your tutor profile has been saved.</p>
          </div>
          <span className="text-caption font-medium text-[#2A9147] bg-[#E8F8ED] px-2.5 py-1 rounded-full flex-shrink-0">
            Done
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
      {/* Section Header */}
      <div className="px-4 py-3 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <UserIcon className="h-4 w-4 text-primary-500" />
            </div>
            <div>
              <h2 className="text-body font-semibold text-neutral-900">Your Profile</h2>
              <p className="text-body-sm text-neutral-500">Tell us about yourself</p>
            </div>
          </div>

          {/* Completion Indicators */}
          <div className="hidden sm:flex items-center gap-1.5">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`h-2 w-2 rounded-full transition-colors duration-200 ${
                  tabCompletion[tab.id] ? "bg-[#34B256]" : "bg-neutral-200"
                }`}
                title={`${tab.label}: ${tabCompletion[tab.id] ? "Complete" : "Incomplete"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="border-b border-neutral-200">
        <nav className="flex -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const complete = tabCompletion[tab.id];
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-body-sm font-medium border-b-2 transition-colors duration-200 ${
                  isActive
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                }`}
              >
                {complete && !isActive ? (
                  <CheckCircleSolid className="h-4 w-4 text-[#34B256]" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                <span className="hidden xs:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {/* Personal Info Tab */}
        {activeTab === "personal" && (
          <div className="space-y-4">
            {/* Headshot */}
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 rounded-full bg-neutral-100 overflow-hidden ring-2 ring-neutral-200 flex-shrink-0">
                {formData.headshotUrl ? (
                  <Image
                    src={formData.headshotUrl}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <CameraIcon className="h-5 w-5 text-neutral-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm text-neutral-600">Professional headshot for clients and team.</p>
                <button className="text-body-sm font-medium text-primary-500 hover:text-primary-700 transition-colors">
                  Upload Photo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-caption font-medium text-neutral-700 mb-1.5">
                  Full Name <span className="text-[#DA2E72]">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-body text-neutral-900 border border-neutral-300 rounded-[10px] hover:border-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 placeholder:text-neutral-400 transition-colors"
                    placeholder="Your full name"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-caption font-medium text-neutral-700 mb-1.5">
                  Phone Number <span className="text-[#DA2E72]">*</span>
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-body text-neutral-900 border border-neutral-300 rounded-[10px] hover:border-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 placeholder:text-neutral-400 transition-colors"
                    placeholder="(555) 555-5555"
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-caption font-medium text-neutral-700 mb-1.5">
                  Date of Birth
                </label>
                <div className="relative">
                  <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-body text-neutral-900 border border-neutral-300 rounded-[10px] hover:border-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 placeholder:text-neutral-400 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Languages */}
            <div>
              <label className="block text-caption font-medium text-neutral-700 mb-2">
                Languages Spoken
              </label>
              <div className="flex flex-wrap gap-2">
                {languageOptions.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleLanguageToggle(lang)}
                    className={`px-3 py-1.5 rounded-full text-caption font-medium transition-all duration-200 ${
                      formData.languages.includes(lang)
                        ? "bg-primary-100 text-primary-700 ring-1 ring-primary-300"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-caption font-medium text-neutral-700 mb-1.5">
                Bio / About You
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 text-body text-neutral-900 border border-neutral-300 rounded-[10px] hover:border-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 placeholder:text-neutral-400 transition-colors resize-none"
                placeholder="Tell us a bit about yourself..."
              />
            </div>
          </div>
        )}

        {/* Professional Tab */}
        {activeTab === "professional" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-caption font-medium text-neutral-700 mb-1.5">
                  Years of Teaching Experience
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.yearsExperience}
                  onChange={(e) => handleChange("yearsExperience", e.target.value)}
                  className="w-full px-4 py-2.5 text-body text-neutral-900 border border-neutral-300 rounded-[10px] hover:border-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 placeholder:text-neutral-400 transition-colors"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-caption font-medium text-neutral-700 mb-1.5">
                Previous Teaching Experience
              </label>
              <textarea
                value={formData.previousExperience}
                onChange={(e) => handleChange("previousExperience", e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 text-body text-neutral-900 border border-neutral-300 rounded-[10px] hover:border-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 placeholder:text-neutral-400 transition-colors resize-none"
                placeholder="Describe any previous teaching, tutoring, or relevant experience..."
              />
            </div>

            <div>
              <label className="block text-caption font-medium text-neutral-700 mb-1.5">
                Teaching Style & Preferences
              </label>
              <textarea
                value={formData.teachingStylePreferences}
                onChange={(e) => handleChange("teachingStylePreferences", e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 text-body text-neutral-900 border border-neutral-300 rounded-[10px] hover:border-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 placeholder:text-neutral-400 transition-colors resize-none"
                placeholder="Describe your teaching approach and any preferences..."
              />
            </div>

            <div>
              <label className="block text-caption font-medium text-neutral-700 mb-1.5">
                Availability Notes
              </label>
              <textarea
                value={formData.availabilityNotes}
                onChange={(e) => handleChange("availabilityNotes", e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 text-body text-neutral-900 border border-neutral-300 rounded-[10px] hover:border-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 placeholder:text-neutral-400 transition-colors resize-none"
                placeholder="e.g., Weekdays after 3pm, Saturday mornings..."
              />
            </div>
          </div>
        )}

        {/* Emergency Contact Tab */}
        {activeTab === "emergency" && (
          <div className="space-y-4">
            <div className="bg-[#FEF4E8] border border-[#F79A30]/20 rounded-[10px] p-4">
              <p className="text-body-sm text-[#C77A26]">
                Emergency contact information is required and will only be used in case of an emergency.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-caption font-medium text-neutral-700 mb-1.5">
                  Contact Name <span className="text-[#DA2E72]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.emergencyContactName}
                  onChange={(e) => handleChange("emergencyContactName", e.target.value)}
                  className="w-full px-4 py-2.5 text-body text-neutral-900 border border-neutral-300 rounded-[10px] hover:border-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 placeholder:text-neutral-400 transition-colors"
                  placeholder="Contact name"
                />
              </div>

              <div>
                <label className="block text-caption font-medium text-neutral-700 mb-1.5">
                  Contact Phone <span className="text-[#DA2E72]">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => handleChange("emergencyContactPhone", e.target.value)}
                  className="w-full px-4 py-2.5 text-body text-neutral-900 border border-neutral-300 rounded-[10px] hover:border-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 placeholder:text-neutral-400 transition-colors"
                  placeholder="(555) 555-5555"
                />
              </div>

              <div>
                <label className="block text-caption font-medium text-neutral-700 mb-1.5">
                  Relationship
                </label>
                <select
                  value={formData.emergencyContactRelation}
                  onChange={(e) => handleChange("emergencyContactRelation", e.target.value)}
                  className="w-full px-4 py-2.5 text-body text-neutral-900 border border-neutral-300 rounded-[10px] hover:border-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-colors"
                >
                  <option value="">Select relationship</option>
                  <option value="spouse">Spouse/Partner</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="child">Child</option>
                  <option value="friend">Friend</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-neutral-100 bg-neutral-50/50">
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          {/* Save Message */}
          <div className="w-full sm:w-auto">
            {saveMessage && (
              <p className={`text-body-sm font-medium ${
                saveMessage.type === "success" ? "text-[#2A9147]" : "text-[#DA2E72]"
              }`}>
                {saveMessage.text}
              </p>
            )}
            {!isFormValid && !saveMessage && (
              <p className="text-body-sm text-neutral-400">
                Fill required fields to save
              </p>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving || !isFormValid}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-500 text-white rounded-[10px] font-medium text-body hover:bg-primary-600 active:bg-primary-700 shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4" />
                Save Profile
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
