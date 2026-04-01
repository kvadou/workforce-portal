import { prisma } from "@/lib/prisma";
import type {
  OnboardingConfig,
  OnboardingJourneyStep,
  OnboardingBadge,
  OnboardingDropdownOption,
  OnboardingOrientationAgenda,
} from "@prisma/client";

// Types
export type OnboardingConfigMap = Record<string, string | number | boolean | object>;

export type BadgeConfig = {
  badgeKey: string;
  title: string;
  description: string;
  icon: string;
  colorScheme: {
    color: string;
    bgColor: string;
    borderColor: string;
  };
  unlockType: string;
  unlockCondition: string | null;
  order: number;
};

export type DropdownOption = {
  value: string;
  label: string;
};

export type OnboardingConfigData = {
  config: OnboardingConfigMap;
  journeySteps: OnboardingJourneyStep[];
  badges: BadgeConfig[];
  dropdownOptions: {
    language: DropdownOption[];
    relationship: DropdownOption[];
    business_type: DropdownOption[];
  };
  orientationAgenda: OnboardingOrientationAgenda[];
};

// Parse config value based on its type
function parseConfigValue(config: OnboardingConfig): string | number | boolean | object {
  const { value, valueType } = config;

  switch (valueType) {
    case "NUMBER":
      return parseFloat(value);
    case "BOOLEAN":
      return value === "true";
    case "JSON":
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    default:
      return value;
  }
}

// Get all config settings as a key-value map
export async function getOnboardingConfig(): Promise<OnboardingConfigMap> {
  const configs = await prisma.onboardingConfig.findMany({
    where: { isActive: true },
  });

  return configs.reduce((acc, config) => {
    acc[config.key] = parseConfigValue(config);
    return acc;
  }, {} as OnboardingConfigMap);
}

// Get config settings by category
export async function getOnboardingConfigByCategory(
  category: string
): Promise<OnboardingConfigMap> {
  const configs = await prisma.onboardingConfig.findMany({
    where: { category, isActive: true },
  });

  return configs.reduce((acc, config) => {
    acc[config.key] = parseConfigValue(config);
    return acc;
  }, {} as OnboardingConfigMap);
}

// Get a single config value
export async function getOnboardingConfigValue<T = string>(
  key: string,
  defaultValue?: T
): Promise<T> {
  const config = await prisma.onboardingConfig.findUnique({
    where: { key },
  });

  if (!config || !config.isActive) {
    return defaultValue as T;
  }

  return parseConfigValue(config) as T;
}

// Get journey steps
export async function getJourneySteps(): Promise<OnboardingJourneyStep[]> {
  return prisma.onboardingJourneyStep.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
}

// Get badges with parsed color scheme
export async function getBadges(): Promise<BadgeConfig[]> {
  const badges = await prisma.onboardingBadge.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  return badges.map((badge) => ({
    badgeKey: badge.badgeKey,
    title: badge.title,
    description: badge.description,
    icon: badge.icon,
    colorScheme: JSON.parse(badge.colorScheme),
    unlockType: badge.unlockType,
    unlockCondition: badge.unlockCondition,
    order: badge.order,
  }));
}

// Get a specific badge by key
export async function getBadgeByKey(
  badgeKey: string
): Promise<BadgeConfig | null> {
  const badge = await prisma.onboardingBadge.findUnique({
    where: { badgeKey },
  });

  if (!badge || !badge.isActive) {
    return null;
  }

  return {
    badgeKey: badge.badgeKey,
    title: badge.title,
    description: badge.description,
    icon: badge.icon,
    colorScheme: JSON.parse(badge.colorScheme),
    unlockType: badge.unlockType,
    unlockCondition: badge.unlockCondition,
    order: badge.order,
  };
}

// Get dropdown options by fieldKey
export async function getDropdownOptions(
  fieldKey: string
): Promise<DropdownOption[]> {
  const options = await prisma.onboardingDropdownOption.findMany({
    where: { fieldKey, isActive: true },
    orderBy: { order: "asc" },
  });

  return options.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));
}

// Get all dropdown options grouped by fieldKey
export async function getAllDropdownOptions(): Promise<
  Record<string, DropdownOption[]>
> {
  const options = await prisma.onboardingDropdownOption.findMany({
    where: { isActive: true },
    orderBy: [{ fieldKey: "asc" }, { order: "asc" }],
  });

  return options.reduce((acc, option) => {
    if (!acc[option.fieldKey]) {
      acc[option.fieldKey] = [];
    }
    acc[option.fieldKey].push({
      value: option.value,
      label: option.label,
    });
    return acc;
  }, {} as Record<string, DropdownOption[]>);
}

// Get orientation agenda items
export async function getOrientationAgenda(): Promise<
  OnboardingOrientationAgenda[]
> {
  return prisma.onboardingOrientationAgenda.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
}

// Get all onboarding config data at once (for page loads)
export async function getAllOnboardingConfigData(): Promise<OnboardingConfigData> {
  const [config, journeySteps, badges, dropdownOptions, orientationAgenda] =
    await Promise.all([
      getOnboardingConfig(),
      getJourneySteps(),
      getBadges(),
      getAllDropdownOptions(),
      getOrientationAgenda(),
    ]);

  return {
    config,
    journeySteps,
    badges,
    dropdownOptions: {
      language: dropdownOptions["language"] || [],
      relationship: dropdownOptions["relationship"] || [],
      business_type: dropdownOptions["business_type"] || [],
    },
    orientationAgenda,
  };
}

// Helper to get specific commonly-used configs
export async function getWelcomePageConfig() {
  const config = await getOnboardingConfigByCategory("welcome");
  const generalConfig = await getOnboardingConfigByCategory("general");

  return {
    videoId: config["welcome_video_id"] as string,
    videoHash: config["welcome_video_hash"] as string,
    videoTitle: config["welcome_video_title"] as string,
    videoDescription: config["welcome_video_description"] as string,
    headline: config["welcome_headline"] as string,
    completionBonus: generalConfig["completion_bonus_amount"] as number,
    trainingHours: generalConfig["training_hours"] as string,
    shadowLessonsCount: generalConfig["shadow_lessons_count"] as number,
    contactEmail: generalConfig["contact_email"] as string,
  };
}

export async function getQuizConfig() {
  const config = await getOnboardingConfigByCategory("quiz");

  return {
    passingScore: (config["quiz_passing_score"] as number) || 80,
  };
}

export async function getOrientationConfig() {
  const config = await getOnboardingConfigByCategory("orientation");
  const agenda = await getOrientationAgenda();

  return {
    durationMinutes: (config["orientation_duration_minutes"] as number) || 90,
    payRate: (config["orientation_pay_rate"] as number) || 25,
    trainerName: (config["orientation_trainer_name"] as string) || "Jessica",
    agenda,
  };
}
