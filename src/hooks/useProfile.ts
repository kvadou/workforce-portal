import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserRole } from "@prisma/client";

// Types
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  avatarUrl: string | null;
  headshotUrl: string | null;
  phone: string | null;
  bio: string | null;
  dateOfBirth: Date | string | null;
  hireDate: Date | string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  languages: string[];
  teachingStylePreferences: string | null;
  availabilityNotes: string | null;
  yearsExperience: number | null;
  previousExperience: string | null;
  createdAt: Date | string;
  organization: {
    id: string;
    name: string;
    subdomain: string;
  } | null;
}

export interface ProfileUpdateData {
  name?: string;
  avatarUrl?: string;
  headshotUrl?: string;
  phone?: string;
  bio?: string;
  dateOfBirth?: string | null;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  languages?: string[];
  teachingStylePreferences?: string;
  availabilityNotes?: string;
  yearsExperience?: number | null;
  previousExperience?: string;
}

interface ProfileResponse {
  success: boolean;
  user: UserProfile;
}

interface AvatarUploadResponse {
  success: boolean;
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// API Functions
async function fetchProfile(): Promise<UserProfile> {
  const response = await fetch("/api/profile");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch profile");
  }
  const data: ProfileResponse = await response.json();
  return data.user;
}

async function updateProfile(data: ProfileUpdateData): Promise<UserProfile> {
  const response = await fetch("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update profile");
  }
  const result: ProfileResponse = await response.json();
  return result.user;
}

async function getAvatarUploadUrl(
  filename: string,
  contentType: string,
  size: number
): Promise<AvatarUploadResponse> {
  const response = await fetch("/api/profile/avatar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, contentType, size }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get upload URL");
  }
  return response.json();
}

async function uploadToS3(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });
  if (!response.ok) throw new Error("Failed to upload file");
}

async function updateAvatarUrl(avatarUrl: string): Promise<void> {
  const response = await fetch("/api/profile/avatar", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ avatarUrl }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update avatar");
  }
}

async function uploadAvatar(file: File): Promise<string> {
  // 1. Get presigned URL
  const { uploadUrl, publicUrl } = await getAvatarUploadUrl(
    file.name,
    file.type,
    file.size
  );

  // 2. Upload to S3
  await uploadToS3(uploadUrl, file);

  // 3. Update user's avatar URL
  await updateAvatarUrl(publicUrl);

  return publicUrl;
}

async function changePassword(data: ChangePasswordData): Promise<void> {
  const response = await fetch("/api/auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to change password");
  }
}

// Hooks
export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["profile"], updatedUser);
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (publicUrl) => {
      // Update the cached profile with new avatar URL
      queryClient.setQueryData(["profile"], (old: UserProfile | undefined) => {
        if (!old) return old;
        return { ...old, avatarUrl: publicUrl };
      });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
  });
}
