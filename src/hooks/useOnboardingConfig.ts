import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  OnboardingConfig,
  OnboardingJourneyStep,
  OnboardingBadge,
  OnboardingDropdownOption,
  OnboardingOrientationAgenda,
} from "@prisma/client";

// Types
export type OnboardingConfigMap = Record<string, string | number | boolean | object>;

export type BadgeWithParsedColors = Omit<OnboardingBadge, "colorScheme"> & {
  colorScheme: {
    color: string;
    bgColor: string;
    borderColor: string;
  };
};

export type DropdownOptionsMap = Record<string, { value: string; label: string }[]>;

export type OnboardingConfigResponse = {
  config: OnboardingConfigMap;
  journeySteps: OnboardingJourneyStep[];
  badges: BadgeWithParsedColors[];
  dropdownOptions: DropdownOptionsMap;
  orientationAgenda: OnboardingOrientationAgenda[];
};

// ============ PUBLIC CONFIG HOOKS (for onboarding pages) ============

async function fetchOnboardingConfig(
  include?: string[]
): Promise<OnboardingConfigResponse> {
  const params = include ? `?include=${include.join(",")}` : "";
  const response = await fetch(`/api/onboarding/config${params}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch onboarding config");
  }
  return response.json();
}

export function useOnboardingConfig(include?: string[]) {
  return useQuery({
    queryKey: ["onboardingConfig", include],
    queryFn: () => fetchOnboardingConfig(include),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ============ ADMIN CONFIG HOOKS ============

// Config Settings
async function fetchAdminConfigs(category?: string): Promise<OnboardingConfig[]> {
  const params = category ? `?category=${category}` : "";
  const response = await fetch(`/api/admin/onboarding/config${params}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch configs");
  }
  const data = await response.json();
  return data.configs;
}

async function updateAdminConfig(
  updates: { key: string; value: string }[]
): Promise<OnboardingConfig[]> {
  const response = await fetch("/api/admin/onboarding/config", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update configs");
  }
  const data = await response.json();
  return data.configs;
}

export function useAdminConfigs(category?: string) {
  return useQuery({
    queryKey: ["adminConfigs", category],
    queryFn: () => fetchAdminConfigs(category),
  });
}

export function useUpdateAdminConfigs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAdminConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminConfigs"] });
      queryClient.invalidateQueries({ queryKey: ["onboardingConfig"] });
    },
  });
}

// Journey Steps
async function fetchJourneySteps(): Promise<OnboardingJourneyStep[]> {
  const response = await fetch("/api/admin/onboarding/config/journey-steps");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch journey steps");
  }
  const data = await response.json();
  return data.steps;
}

async function updateJourneyStep(
  step: Partial<OnboardingJourneyStep> & { id: string }
): Promise<OnboardingJourneyStep> {
  const response = await fetch("/api/admin/onboarding/config/journey-steps", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(step),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update journey step");
  }
  const data = await response.json();
  return data.step;
}

async function reorderJourneySteps(
  items: { id: string; order: number }[]
): Promise<void> {
  const response = await fetch("/api/admin/onboarding/config/journey-steps", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reorder: true, items }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to reorder journey steps");
  }
}

export function useJourneySteps() {
  return useQuery({
    queryKey: ["journeySteps"],
    queryFn: fetchJourneySteps,
  });
}

export function useUpdateJourneyStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateJourneyStep,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journeySteps"] });
      queryClient.invalidateQueries({ queryKey: ["onboardingConfig"] });
    },
  });
}

export function useReorderJourneySteps() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderJourneySteps,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journeySteps"] });
      queryClient.invalidateQueries({ queryKey: ["onboardingConfig"] });
    },
  });
}

// Badges
async function fetchBadges(): Promise<OnboardingBadge[]> {
  const response = await fetch("/api/admin/onboarding/config/badges");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch badges");
  }
  const data = await response.json();
  return data.badges;
}

async function updateBadge(
  badge: Partial<OnboardingBadge> & { id: string }
): Promise<OnboardingBadge> {
  const response = await fetch("/api/admin/onboarding/config/badges", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(badge),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update badge");
  }
  const data = await response.json();
  return data.badge;
}

async function reorderBadges(
  items: { id: string; order: number }[]
): Promise<void> {
  const response = await fetch("/api/admin/onboarding/config/badges", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reorder: true, items }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to reorder badges");
  }
}

export function useBadges() {
  return useQuery({
    queryKey: ["badges"],
    queryFn: fetchBadges,
  });
}

export function useUpdateBadge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBadge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      queryClient.invalidateQueries({ queryKey: ["onboardingConfig"] });
    },
  });
}

export function useReorderBadges() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderBadges,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      queryClient.invalidateQueries({ queryKey: ["onboardingConfig"] });
    },
  });
}

// Dropdown Options
async function fetchDropdownOptions(
  fieldKey?: string
): Promise<{ options: OnboardingDropdownOption[]; grouped: DropdownOptionsMap }> {
  const params = fieldKey ? `?fieldKey=${fieldKey}` : "";
  const response = await fetch(
    `/api/admin/onboarding/config/dropdown-options${params}`
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch dropdown options");
  }
  return response.json();
}

async function updateDropdownOptions(
  fieldKey: string,
  options: { id?: string; value: string; label: string; order: number }[]
): Promise<OnboardingDropdownOption[]> {
  const response = await fetch("/api/admin/onboarding/config/dropdown-options", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fieldKey, options }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update dropdown options");
  }
  const data = await response.json();
  return data.options;
}

async function createDropdownOption(data: {
  fieldKey: string;
  value: string;
  label: string;
  order?: number;
}): Promise<OnboardingDropdownOption> {
  const response = await fetch("/api/admin/onboarding/config/dropdown-options", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create dropdown option");
  }
  const result = await response.json();
  return result.option;
}

async function deleteDropdownOption(id: string): Promise<void> {
  const response = await fetch("/api/admin/onboarding/config/dropdown-options", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete dropdown option");
  }
}

export function useDropdownOptions(fieldKey?: string) {
  return useQuery({
    queryKey: ["dropdownOptions", fieldKey],
    queryFn: () => fetchDropdownOptions(fieldKey),
  });
}

export function useUpdateDropdownOptions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      fieldKey,
      options,
    }: {
      fieldKey: string;
      options: { id?: string; value: string; label: string; order: number }[];
    }) => updateDropdownOptions(fieldKey, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dropdownOptions"] });
      queryClient.invalidateQueries({ queryKey: ["onboardingConfig"] });
    },
  });
}

export function useCreateDropdownOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDropdownOption,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dropdownOptions"] });
      queryClient.invalidateQueries({ queryKey: ["onboardingConfig"] });
    },
  });
}

export function useDeleteDropdownOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDropdownOption,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dropdownOptions"] });
      queryClient.invalidateQueries({ queryKey: ["onboardingConfig"] });
    },
  });
}

// Orientation Agenda
async function fetchOrientationAgenda(): Promise<OnboardingOrientationAgenda[]> {
  const response = await fetch(
    "/api/admin/onboarding/config/orientation-agenda"
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch orientation agenda");
  }
  const data = await response.json();
  return data.items;
}

async function updateOrientationAgendaItem(
  item: Partial<OnboardingOrientationAgenda> & { id: string }
): Promise<OnboardingOrientationAgenda> {
  const response = await fetch(
    "/api/admin/onboarding/config/orientation-agenda",
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update agenda item");
  }
  const data = await response.json();
  return data.item;
}

async function createOrientationAgendaItem(data: {
  title: string;
  description?: string;
  order?: number;
}): Promise<OnboardingOrientationAgenda> {
  const response = await fetch(
    "/api/admin/onboarding/config/orientation-agenda",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create agenda item");
  }
  const result = await response.json();
  return result.item;
}

async function deleteOrientationAgendaItem(id: string): Promise<void> {
  const response = await fetch(
    "/api/admin/onboarding/config/orientation-agenda",
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete agenda item");
  }
}

async function reorderOrientationAgenda(
  items: { id: string; order: number }[]
): Promise<void> {
  const response = await fetch(
    "/api/admin/onboarding/config/orientation-agenda",
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reorder: true, items }),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to reorder agenda items");
  }
}

export function useOrientationAgenda() {
  return useQuery({
    queryKey: ["orientationAgenda"],
    queryFn: fetchOrientationAgenda,
  });
}

export function useUpdateOrientationAgendaItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOrientationAgendaItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orientationAgenda"] });
      queryClient.invalidateQueries({ queryKey: ["onboardingConfig"] });
    },
  });
}

export function useCreateOrientationAgendaItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrientationAgendaItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orientationAgenda"] });
      queryClient.invalidateQueries({ queryKey: ["onboardingConfig"] });
    },
  });
}

export function useDeleteOrientationAgendaItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteOrientationAgendaItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orientationAgenda"] });
      queryClient.invalidateQueries({ queryKey: ["onboardingConfig"] });
    },
  });
}

export function useReorderOrientationAgenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderOrientationAgenda,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orientationAgenda"] });
      queryClient.invalidateQueries({ queryKey: ["onboardingConfig"] });
    },
  });
}
