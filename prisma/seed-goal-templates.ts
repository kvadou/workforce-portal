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

async function seedGoalTemplates() {
  console.log("Seeding goal templates...");

  // Onboarding goal template
  await prisma.goalTemplate.upsert({
    where: { id: "onboarding-goal-template" },
    update: {
      name: "Complete Onboarding",
      description: "Finish all onboarding steps to become a certified Acme Workforce Team Member",
      category: "LEARNING",
      metricType: "steps",
      defaultTarget: 8,
      isActive: true,
    },
    create: {
      id: "onboarding-goal-template",
      name: "Complete Onboarding",
      description: "Finish all onboarding steps to become a certified Acme Workforce Team Member",
      category: "LEARNING",
      metricType: "steps",
      defaultTarget: 8,
      isActive: true,
    },
  });
  console.log("  ✓ Complete Onboarding");

  // Teaching goals
  await prisma.goalTemplate.upsert({
    where: { id: "monthly-lessons-goal" },
    update: {
      name: "Monthly Teaching Goal",
      description: "Teach a target number of lessons this month",
      category: "TEACHING",
      metricType: "lessons",
      defaultTarget: 40,
      isActive: true,
    },
    create: {
      id: "monthly-lessons-goal",
      name: "Monthly Teaching Goal",
      description: "Teach a target number of lessons this month",
      category: "TEACHING",
      metricType: "lessons",
      defaultTarget: 40,
      isActive: true,
    },
  });
  console.log("  ✓ Monthly Teaching Goal");

  // Learning goals
  await prisma.goalTemplate.upsert({
    where: { id: "course-completion-goal" },
    update: {
      name: "Course Completion Goal",
      description: "Complete training courses to improve your skills",
      category: "LEARNING",
      metricType: "courses",
      defaultTarget: 3,
      isActive: true,
    },
    create: {
      id: "course-completion-goal",
      name: "Course Completion Goal",
      description: "Complete training courses to improve your skills",
      category: "LEARNING",
      metricType: "courses",
      defaultTarget: 3,
      isActive: true,
    },
  });
  console.log("  ✓ Course Completion Goal");

  // Engagement goals
  await prisma.goalTemplate.upsert({
    where: { id: "login-streak-goal" },
    update: {
      name: "Login Streak Goal",
      description: "Maintain a daily login streak",
      category: "ENGAGEMENT",
      metricType: "days",
      defaultTarget: 14,
      isActive: true,
    },
    create: {
      id: "login-streak-goal",
      name: "Login Streak Goal",
      description: "Maintain a daily login streak",
      category: "ENGAGEMENT",
      metricType: "days",
      defaultTarget: 14,
      isActive: true,
    },
  });
  console.log("  ✓ Login Streak Goal");

  console.log("\nSeeded goal templates successfully!");
}

seedGoalTemplates()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
