"use client";

import {
  PlayCircleIcon,
  LightBulbIcon,
  UserIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  StarIcon,
  FireIcon,
  TrophyIcon,
  FlagIcon,
  BoltIcon,
  HeartIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  BookOpenIcon,
  QuestionMarkCircleIcon,
  GiftIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import type { BadgeConfig as DynamicBadgeConfig } from "@/lib/onboarding-config";

// Icon mapping from string names to Heroicon components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  PlayCircle: PlayCircleIcon,
  Brain: LightBulbIcon,
  User: UserIcon,
  FileText: DocumentTextIcon,
  Calendar: CalendarDaysIcon,
  GraduationCap: AcademicCapIcon,
  Star: StarIcon,
  Flame: FireIcon,
  Trophy: TrophyIcon,
  Target: FlagIcon,
  Zap: BoltIcon,
  Award: TrophyIcon,
  Heart: HeartIcon,
  Shield: ShieldCheckIcon,
  Crown: TrophyIcon,
  Medal: TrophyIcon,
  CheckCircle: CheckCircleIcon,
  BookOpen: BookOpenIcon,
  HelpCircle: QuestionMarkCircleIcon,
  Gift: GiftIcon,
  Sparkles: SparklesIcon,
};

export type BadgeType =
  | "welcome"
  | "videos"
  | "quiz"
  | "profile"
  | "w9"
  | "orientation"
  | "training"
  | "streak-3"
  | "streak-7"
  | "speed-demon"
  | "perfect-quiz"
  | "first_step"
  | "quiz_master"
  | "perfect_score"
  | "speed_demon";

interface StaticBadgeConfig {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

// Fallback static configs for backwards compatibility
const staticBadgeConfigs: Record<string, StaticBadgeConfig> = {
  welcome: {
    icon: StarIcon,
    title: "Journey Begins",
    description: "Watched the welcome video",
    color: "text-warning",
    bgColor: "bg-warning-light",
    borderColor: "border-warning",
  },
  videos: {
    icon: PlayCircleIcon,
    title: "Video Champion",
    description: "Completed all training videos",
    color: "text-primary-600",
    bgColor: "bg-primary-50",
    borderColor: "border-primary-200",
  },
  quiz: {
    icon: LightBulbIcon,
    title: "Quiz Master",
    description: "Passed the knowledge quiz",
    color: "text-info",
    bgColor: "bg-info-light",
    borderColor: "border-info",
  },
  profile: {
    icon: UserIcon,
    title: "Profile Pro",
    description: "Completed your profile",
    color: "text-success",
    bgColor: "bg-success-light",
    borderColor: "border-success",
  },
  w9: {
    icon: DocumentTextIcon,
    title: "Paperwork Hero",
    description: "Submitted W-9 form",
    color: "text-info",
    bgColor: "bg-info-light",
    borderColor: "border-info",
  },
  orientation: {
    icon: CalendarDaysIcon,
    title: "Orientation Complete",
    description: "Attended orientation session",
    color: "text-error",
    bgColor: "bg-error-light",
    borderColor: "border-error",
  },
  training: {
    icon: AcademicCapIcon,
    title: "Certified Tutor",
    description: "Completed all training",
    color: "text-primary-600",
    bgColor: "bg-primary-50",
    borderColor: "border-primary-200",
  },
  "streak-3": {
    icon: FireIcon,
    title: "On Fire!",
    description: "3-day login streak",
    color: "text-accent-orange",
    bgColor: "bg-accent-orange-light",
    borderColor: "border-accent-orange",
  },
  "streak-7": {
    icon: BoltIcon,
    title: "Unstoppable",
    description: "7-day login streak",
    color: "text-warning",
    bgColor: "bg-warning-light",
    borderColor: "border-warning",
  },
  "speed-demon": {
    icon: FlagIcon,
    title: "Speed Demon",
    description: "Completed onboarding in under 3 days",
    color: "text-error",
    bgColor: "bg-error-light",
    borderColor: "border-error",
  },
  "perfect-quiz": {
    icon: TrophyIcon,
    title: "Perfect Score",
    description: "100% on the quiz",
    color: "text-warning",
    bgColor: "bg-warning-light",
    borderColor: "border-warning",
  },
};

interface AchievementBadgeProps {
  type?: BadgeType | string;
  badgeConfig?: DynamicBadgeConfig;
  earned: boolean;
  earnedAt?: Date | string | null;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
}

export function AchievementBadge({
  type,
  badgeConfig,
  earned,
  earnedAt,
  size = "md",
  showDetails = true,
}: AchievementBadgeProps) {
  // Use dynamic config if provided, otherwise fall back to static config
  let title: string;
  let description: string;
  let color: string;
  let bgColor: string;
  let borderColor: string;
  let Icon: React.ComponentType<{ className?: string }>;

  if (badgeConfig) {
    title = badgeConfig.title;
    description = badgeConfig.description;
    color = badgeConfig.colorScheme.color;
    bgColor = badgeConfig.colorScheme.bgColor;
    borderColor = badgeConfig.colorScheme.borderColor;
    Icon = iconMap[badgeConfig.icon] || StarIcon;
  } else if (type && staticBadgeConfigs[type]) {
    const staticConfig = staticBadgeConfigs[type];
    title = staticConfig.title;
    description = staticConfig.description;
    color = staticConfig.color;
    bgColor = staticConfig.bgColor;
    borderColor = staticConfig.borderColor;
    Icon = staticConfig.icon;
  } else {
    // Default fallback
    title = "Badge";
    description = "Achievement badge";
    color = "text-neutral-600";
    bgColor = "bg-neutral-50";
    borderColor = "border-neutral-200";
    Icon = StarIcon;
  }

  const sizeClasses = {
    sm: {
      container: "h-12 w-12",
      icon: "h-5 w-5",
      text: "text-xs",
    },
    md: {
      container: "h-16 w-16",
      icon: "h-7 w-7",
      text: "text-sm",
    },
    lg: {
      container: "h-20 w-20",
      icon: "h-9 w-9",
      text: "text-base",
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex flex-col items-center gap-2 ${!earned ? "opacity-40 grayscale" : ""}`}>
      <div
        className={`${classes.container} rounded-lg ${bgColor} border-2 ${borderColor} flex items-center justify-center relative ${earned ? "shadow-sm" : ""}`}
      >
        <Icon className={`${classes.icon} ${color}`} />
        {earned && (
          <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-success rounded-lg flex items-center justify-center border-2 border-white">
            <TrophyIcon className="h-3 w-3 text-white" />
          </div>
        )}
      </div>
      {showDetails && (
        <div className="text-center">
          <p className={`font-semibold text-neutral-900 ${classes.text}`}>{title}</p>
          <p className="text-xs text-neutral-500">{description}</p>
          {earned && earnedAt && (
            <p className="text-xs text-success mt-0.5">
              {new Date(earnedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface BadgeDisplayProps {
  badges: Array<{ type: BadgeType; earned: boolean; earnedAt?: Date | string | null }>;
  size?: "sm" | "md" | "lg";
}

export function BadgeDisplay({ badges, size = "md" }: BadgeDisplayProps) {
  const earned = badges.filter((b) => b.earned);
  const unearned = badges.filter((b) => !b.earned);

  return (
    <div className="space-y-4">
      {earned.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-neutral-700 mb-3">Earned Badges ({earned.length})</h4>
          <div className="flex flex-wrap gap-4">
            {earned.map((badge) => (
              <AchievementBadge
                key={badge.type}
                type={badge.type}
                earned={badge.earned}
                earnedAt={badge.earnedAt}
                size={size}
              />
            ))}
          </div>
        </div>
      )}
      {unearned.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-neutral-400 mb-3">Locked ({unearned.length})</h4>
          <div className="flex flex-wrap gap-4">
            {unearned.map((badge) => (
              <AchievementBadge
                key={badge.type}
                type={badge.type}
                earned={badge.earned}
                size={size}
                showDetails={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
