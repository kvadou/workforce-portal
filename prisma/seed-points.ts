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

interface PointsRuleDefinition {
  name: string;
  category: "TEACHING" | "QUALITY" | "LEARNING" | "ENGAGEMENT" | "BUSINESS";
  trigger: string;
  points: number;
  threshold?: number;
  multiplier?: number;
}

const rules: PointsRuleDefinition[] = [
  // Teaching
  { name: "Lesson Taught", category: "TEACHING", trigger: "lesson_taught", points: 5 },
  { name: "Monthly Lessons 40+", category: "TEACHING", trigger: "lessons_monthly_40", points: 100, threshold: 40 },
  { name: "Monthly Lessons 60+", category: "TEACHING", trigger: "lessons_monthly_60", points: 200, threshold: 60 },
  { name: "Monthly Lessons 80+", category: "TEACHING", trigger: "lessons_monthly_80", points: 400, threshold: 80 },

  // Quality
  { name: "5-Star Review", category: "QUALITY", trigger: "five_star_review", points: 10 },
  { name: "Trial Conversion", category: "QUALITY", trigger: "trial_conversion", points: 50 },
  { name: "Client Retention", category: "QUALITY", trigger: "client_retention", points: 25 },

  // Learning
  { name: "Course Module Complete", category: "LEARNING", trigger: "module_complete", points: 10 },
  { name: "Course Complete", category: "LEARNING", trigger: "course_complete", points: 50 },
  { name: "Quiz Passed", category: "LEARNING", trigger: "quiz_passed", points: 20 },
  { name: "Learning Path Complete", category: "LEARNING", trigger: "path_complete", points: 100 },

  // Engagement
  { name: "Live Session Attended", category: "ENGAGEMENT", trigger: "live_session_attended", points: 30 },
  { name: "7-Day Login Streak", category: "ENGAGEMENT", trigger: "login_streak_7", points: 35, threshold: 7 },
  { name: "14-Day Login Streak", category: "ENGAGEMENT", trigger: "login_streak_14", points: 75, threshold: 14 },
  { name: "30-Day Login Streak", category: "ENGAGEMENT", trigger: "login_streak_30", points: 150, threshold: 30 },

  // Business
  { name: "Referral", category: "BUSINESS", trigger: "referral", points: 100 },

  // Onboarding
  { name: "Onboarding Welcome", category: "LEARNING", trigger: "onboarding_welcome", points: 10 },
  { name: "Onboarding Video", category: "LEARNING", trigger: "onboarding_video", points: 10 },
  { name: "Onboarding Quiz", category: "LEARNING", trigger: "onboarding_quiz", points: 50 },
  { name: "Onboarding Profile", category: "LEARNING", trigger: "onboarding_profile", points: 15 },
  { name: "Onboarding W-9", category: "LEARNING", trigger: "onboarding_w9", points: 15 },
  { name: "Onboarding Training", category: "LEARNING", trigger: "onboarding_training", points: 25 },
  { name: "Onboarding Shadow", category: "LEARNING", trigger: "onboarding_shadow", points: 50 },
  { name: "Onboarding Complete", category: "LEARNING", trigger: "onboarding_complete", points: 250 },
];

async function seedPointsRules() {
  console.log("Seeding points rules...");

  for (const rule of rules) {
    await prisma.pointsRule.upsert({
      where: { trigger: rule.trigger },
      update: {
        name: rule.name,
        category: rule.category,
        points: rule.points,
        threshold: rule.threshold ?? null,
        multiplier: rule.multiplier ?? null,
        isActive: true,
      },
      create: {
        name: rule.name,
        category: rule.category,
        trigger: rule.trigger,
        points: rule.points,
        threshold: rule.threshold ?? null,
        multiplier: rule.multiplier ?? null,
        isActive: true,
      },
    });
    console.log(`  ✓ ${rule.name} (${rule.points} pts)`);
  }

  console.log(`\nSeeded ${rules.length} points rules successfully!`);
}

seedPointsRules()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
