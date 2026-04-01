import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL || "postgresql://dougkvamme@localhost:5432/workforceportal";

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

interface BadgeDefinition {
  badgeKey: string;
  title: string;
  description: string;
  icon: string;
  colorScheme: string;
  unlockType: string;
  unlockCondition?: string;
  order: number;
}

const badges: BadgeDefinition[] = [
  // Onboarding badges
  {
    badgeKey: "onboarding_first_step",
    title: "First Step",
    description: "Began your journey as a Acme Workforce Team Member",
    icon: "🚀",
    colorScheme: JSON.stringify({ color: "#22c55e", bgColor: "#f0fdf4", borderColor: "#bbf7d0" }),
    unlockType: "step_completion",
    unlockCondition: "first_step",
    order: 0,
  },
  {
    badgeKey: "onboarding_welcome",
    title: "Welcome Aboard",
    description: "Completed welcome video",
    icon: "🎉",
    colorScheme: JSON.stringify({ color: "#6366f1", bgColor: "#eef2ff", borderColor: "#c7d2fe" }),
    unlockType: "step_completion",
    unlockCondition: "welcome",
    order: 1,
  },
  {
    badgeKey: "onboarding_videos",
    title: "Knowledge Seeker",
    description: "Completed all training videos",
    icon: "📚",
    colorScheme: JSON.stringify({ color: "#8b5cf6", bgColor: "#f5f3ff", borderColor: "#ddd6fe" }),
    unlockType: "step_completion",
    unlockCondition: "videos",
    order: 2,
  },
  {
    badgeKey: "onboarding_speed_learner",
    title: "Speed Learner",
    description: "Completed all orientation videos within 24 hours",
    icon: "⚡",
    colorScheme: JSON.stringify({ color: "#f59e0b", bgColor: "#fffbeb", borderColor: "#fcd34d" }),
    unlockType: "special",
    unlockCondition: "speed_learner",
    order: 2,
  },
  {
    badgeKey: "onboarding_quiz",
    title: "Quiz Passed",
    description: "Passed the training quiz",
    icon: "✅",
    colorScheme: JSON.stringify({ color: "#10b981", bgColor: "#ecfdf5", borderColor: "#a7f3d0" }),
    unlockType: "step_completion",
    unlockCondition: "quiz",
    order: 3,
  },
  {
    badgeKey: "onboarding_quiz_master",
    title: "Quiz Master",
    description: "Aced the orientation quiz on the first try with 90%+",
    icon: "🎯",
    colorScheme: JSON.stringify({ color: "#ec4899", bgColor: "#fdf2f8", borderColor: "#fbcfe8" }),
    unlockType: "special",
    unlockCondition: "quiz_master",
    order: 3,
  },
  {
    badgeKey: "onboarding_profile",
    title: "Profile Pro",
    description: "Completed your tutor profile",
    icon: "✨",
    colorScheme: JSON.stringify({ color: "#14b8a6", bgColor: "#f0fdfa", borderColor: "#99f6e4" }),
    unlockType: "step_completion",
    unlockCondition: "profile",
    order: 4,
  },
  {
    badgeKey: "onboarding_complete",
    title: "Ready to Teach",
    description: "Completed all onboarding steps",
    icon: "🎓",
    colorScheme: JSON.stringify({ color: "#6366f1", bgColor: "#eef2ff", borderColor: "#c7d2fe" }),
    unlockType: "step_completion",
    unlockCondition: "complete",
    order: 5,
  },
  {
    badgeKey: "onboarding_all_in",
    title: "All In",
    description: "Completed the entire onboarding journey - welcome to the team!",
    icon: "🏆",
    colorScheme: JSON.stringify({ color: "#f59e0b", bgColor: "#fffbeb", borderColor: "#fcd34d" }),
    unlockType: "special",
    unlockCondition: "all_in",
    order: 6,
  },

  // Lesson milestones
  {
    badgeKey: "lessons_10",
    title: "First Steps",
    description: "Taught 10 lessons",
    icon: "👣",
    colorScheme: JSON.stringify({ color: "#10b981", bgColor: "#ecfdf5", borderColor: "#a7f3d0" }),
    unlockType: "milestone",
    unlockCondition: "lessons:10",
    order: 10,
  },
  {
    badgeKey: "lessons_50",
    title: "Rising Star",
    description: "Taught 50 lessons",
    icon: "⭐",
    colorScheme: JSON.stringify({ color: "#3b82f6", bgColor: "#eff6ff", borderColor: "#bfdbfe" }),
    unlockType: "milestone",
    unlockCondition: "lessons:50",
    order: 11,
  },
  {
    badgeKey: "lessons_100",
    title: "Century Club",
    description: "Taught 100 lessons",
    icon: "💯",
    colorScheme: JSON.stringify({ color: "#8b5cf6", bgColor: "#f5f3ff", borderColor: "#ddd6fe" }),
    unlockType: "milestone",
    unlockCondition: "lessons:100",
    order: 12,
  },
  {
    badgeKey: "lessons_250",
    title: "Veteran Tutor",
    description: "Taught 250 lessons",
    icon: "🎖️",
    colorScheme: JSON.stringify({ color: "#f59e0b", bgColor: "#fffbeb", borderColor: "#fcd34d" }),
    unlockType: "milestone",
    unlockCondition: "lessons:250",
    order: 13,
  },
  {
    badgeKey: "lessons_500",
    title: "Grand Master",
    description: "Taught 500 lessons",
    icon: "👑",
    colorScheme: JSON.stringify({ color: "#ec4899", bgColor: "#fdf2f8", borderColor: "#fbcfe8" }),
    unlockType: "milestone",
    unlockCondition: "lessons:500",
    order: 14,
  },
  {
    badgeKey: "lessons_1000",
    title: "Legend",
    description: "Taught 1000 lessons",
    icon: "🌟",
    colorScheme: JSON.stringify({ color: "#dc2626", bgColor: "#fef2f2", borderColor: "#fecaca" }),
    unlockType: "milestone",
    unlockCondition: "lessons:1000",
    order: 15,
  },

  // Weekly consistency
  {
    badgeKey: "weekly_10",
    title: "Consistent Performer",
    description: "Taught 10+ lessons in a week",
    icon: "📅",
    colorScheme: JSON.stringify({ color: "#0ea5e9", bgColor: "#f0f9ff", borderColor: "#bae6fd" }),
    unlockType: "milestone",
    unlockCondition: "weekly:10",
    order: 20,
  },
  {
    badgeKey: "weekly_15",
    title: "High Achiever",
    description: "Taught 15+ lessons in a week",
    icon: "🔥",
    colorScheme: JSON.stringify({ color: "#f97316", bgColor: "#fff7ed", borderColor: "#fed7aa" }),
    unlockType: "milestone",
    unlockCondition: "weekly:15",
    order: 21,
  },
  {
    badgeKey: "weekly_20",
    title: "Superstar",
    description: "Taught 20+ lessons in a week",
    icon: "💪",
    colorScheme: JSON.stringify({ color: "#8b5cf6", bgColor: "#f5f3ff", borderColor: "#ddd6fe" }),
    unlockType: "milestone",
    unlockCondition: "weekly:20",
    order: 22,
  },
  {
    badgeKey: "weekly_25",
    title: "Unstoppable",
    description: "Taught 25+ lessons in a week",
    icon: "🚀",
    colorScheme: JSON.stringify({ color: "#ec4899", bgColor: "#fdf2f8", borderColor: "#fbcfe8" }),
    unlockType: "milestone",
    unlockCondition: "weekly:25",
    order: 23,
  },

  // 5-star ratings
  {
    badgeKey: "five_star_5",
    title: "Quality Start",
    description: "Earned 5 five-star ratings",
    icon: "⭐",
    colorScheme: JSON.stringify({ color: "#eab308", bgColor: "#fefce8", borderColor: "#fef08a" }),
    unlockType: "milestone",
    unlockCondition: "five_star:5",
    order: 30,
  },
  {
    badgeKey: "five_star_10",
    title: "Quality Performer",
    description: "Earned 10 five-star ratings",
    icon: "🌟",
    colorScheme: JSON.stringify({ color: "#eab308", bgColor: "#fefce8", borderColor: "#fef08a" }),
    unlockType: "milestone",
    unlockCondition: "five_star:10",
    order: 31,
  },
  {
    badgeKey: "five_star_25",
    title: "Excellence Award",
    description: "Earned 25 five-star ratings",
    icon: "✨",
    colorScheme: JSON.stringify({ color: "#f59e0b", bgColor: "#fffbeb", borderColor: "#fcd34d" }),
    unlockType: "milestone",
    unlockCondition: "five_star:25",
    order: 32,
  },
  {
    badgeKey: "five_star_50",
    title: "Platinum Tutor",
    description: "Earned 50 five-star ratings",
    icon: "💎",
    colorScheme: JSON.stringify({ color: "#6366f1", bgColor: "#eef2ff", borderColor: "#c7d2fe" }),
    unlockType: "milestone",
    unlockCondition: "five_star:50",
    order: 33,
  },
  {
    badgeKey: "five_star_100",
    title: "Hall of Fame",
    description: "Earned 100 five-star ratings",
    icon: "🏅",
    colorScheme: JSON.stringify({ color: "#dc2626", bgColor: "#fef2f2", borderColor: "#fecaca" }),
    unlockType: "milestone",
    unlockCondition: "five_star:100",
    order: 34,
  },

  // Streak badges
  {
    badgeKey: "streak_lessons_daily_7",
    title: "Week Warrior",
    description: "7-day teaching streak",
    icon: "🔥",
    colorScheme: JSON.stringify({ color: "#f97316", bgColor: "#fff7ed", borderColor: "#fed7aa" }),
    unlockType: "streak",
    unlockCondition: "daily:7",
    order: 40,
  },
  {
    badgeKey: "streak_lessons_daily_14",
    title: "Two-Week Champion",
    description: "14-day teaching streak",
    icon: "🏃",
    colorScheme: JSON.stringify({ color: "#10b981", bgColor: "#ecfdf5", borderColor: "#a7f3d0" }),
    unlockType: "streak",
    unlockCondition: "daily:14",
    order: 41,
  },
  {
    badgeKey: "streak_lessons_daily_30",
    title: "Month of Dedication",
    description: "30-day teaching streak",
    icon: "🌙",
    colorScheme: JSON.stringify({ color: "#8b5cf6", bgColor: "#f5f3ff", borderColor: "#ddd6fe" }),
    unlockType: "streak",
    unlockCondition: "daily:30",
    order: 42,
  },
  {
    badgeKey: "streak_lessons_daily_60",
    title: "Iron Will",
    description: "60-day teaching streak",
    icon: "⚡",
    colorScheme: JSON.stringify({ color: "#eab308", bgColor: "#fefce8", borderColor: "#fef08a" }),
    unlockType: "streak",
    unlockCondition: "daily:60",
    order: 43,
  },
  {
    badgeKey: "streak_lessons_daily_90",
    title: "Legendary Streak",
    description: "90-day teaching streak",
    icon: "🏆",
    colorScheme: JSON.stringify({ color: "#dc2626", bgColor: "#fef2f2", borderColor: "#fecaca" }),
    unlockType: "streak",
    unlockCondition: "daily:90",
    order: 44,
  },

  // Special badges
  {
    badgeKey: "trial_conversion",
    title: "Closer",
    description: "Converted a trial to a paid client",
    icon: "🤝",
    colorScheme: JSON.stringify({ color: "#22c55e", bgColor: "#f0fdf4", borderColor: "#bbf7d0" }),
    unlockType: "special",
    unlockCondition: "trial_conversion",
    order: 50,
  },
];

async function seedBadges() {
  console.log("Seeding badges...");

  for (const badge of badges) {
    await prisma.onboardingBadge.upsert({
      where: { badgeKey: badge.badgeKey },
      update: {
        title: badge.title,
        description: badge.description,
        icon: badge.icon,
        colorScheme: badge.colorScheme,
        unlockType: badge.unlockType,
        unlockCondition: badge.unlockCondition,
        order: badge.order,
      },
      create: {
        badgeKey: badge.badgeKey,
        title: badge.title,
        description: badge.description,
        icon: badge.icon,
        colorScheme: badge.colorScheme,
        unlockType: badge.unlockType,
        unlockCondition: badge.unlockCondition,
        order: badge.order,
        isActive: true,
      },
    });
    console.log(`  ✓ ${badge.title}`);
  }

  console.log(`\nSeeded ${badges.length} badges successfully!`);
}

seedBadges()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
