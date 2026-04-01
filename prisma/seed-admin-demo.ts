import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://dougkvamme@localhost:5432/workforceportal";

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function seedAdminDemo() {
  console.log("Seeding demo data for admin@workforceportal.com...\n");

  // Find the admin user
  const adminUser = await prisma.user.findUnique({
    where: { email: "admin@workforceportal.com" },
  });

  if (!adminUser) {
    console.error("Admin user not found! Run the main seed first.");
    return;
  }

  console.log(`Found admin user: ${adminUser.name} (${adminUser.id})`);

  // Create or get tutor profile
  let tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId: adminUser.id },
  });

  if (!tutorProfile) {
    tutorProfile = await prisma.tutorProfile.create({
      data: {
        userId: adminUser.id,
        status: "ACTIVE",
        team: "NYC",
        totalLessons: 156,
        totalHours: 234.5,
        fiveStarCount: 42,
        trialConversions: 8,
      },
    });
    console.log("  ✓ Created tutor profile");
  } else {
    // Update stats
    await prisma.tutorProfile.update({
      where: { id: tutorProfile.id },
      data: {
        totalLessons: 156,
        totalHours: 234.5,
        fiveStarCount: 42,
        trialConversions: 8,
      },
    });
    console.log("  ✓ Updated tutor profile stats");
  }

  // Create TutorPoints
  await prisma.tutorPoints.upsert({
    where: { tutorProfileId: tutorProfile.id },
    update: {
      totalPoints: 2850,
      monthlyPoints: 780,
      weeklyPoints: 185,
      lessonPoints: 780,
      coursePoints: 320,
      streakPoints: 150,
      achievementPoints: 500,
      qualityPoints: 450,
      engagementPoints: 650,
    },
    create: {
      tutorProfileId: tutorProfile.id,
      totalPoints: 2850,
      monthlyPoints: 780,
      weeklyPoints: 185,
      lessonPoints: 780,
      coursePoints: 320,
      streakPoints: 150,
      achievementPoints: 500,
      qualityPoints: 450,
      engagementPoints: 650,
    },
  });
  console.log("  ✓ Created/updated tutor points");

  // Create streaks
  await prisma.tutorStreak.upsert({
    where: {
      tutorProfileId_type: {
        tutorProfileId: tutorProfile.id,
        type: "LOGIN",
      },
    },
    update: {
      currentStreak: 12,
      longestStreak: 28,
      lastActivityDate: new Date(),
    },
    create: {
      tutorProfileId: tutorProfile.id,
      type: "LOGIN",
      currentStreak: 12,
      longestStreak: 28,
      lastActivityDate: new Date(),
    },
  });

  await prisma.tutorStreak.upsert({
    where: {
      tutorProfileId_type: {
        tutorProfileId: tutorProfile.id,
        type: "LESSONS_DAILY",
      },
    },
    update: {
      currentStreak: 5,
      longestStreak: 14,
      lastActivityDate: new Date(),
    },
    create: {
      tutorProfileId: tutorProfile.id,
      type: "LESSONS_DAILY",
      currentStreak: 5,
      longestStreak: 14,
      lastActivityDate: new Date(),
    },
  });
  console.log("  ✓ Created streaks");

  // Award badges
  const badgesToAward = [
    "onboarding_first_step",
    "onboarding_welcome",
    "onboarding_videos",
    "onboarding_quiz",
    "onboarding_profile",
    "onboarding_complete",
    "lessons_10",
    "lessons_50",
    "lessons_100",
    "weekly_10",
    "five_star_5",
    "five_star_10",
    "streak_lessons_daily_7",
    "trial_conversion",
  ];

  for (const badgeKey of badgesToAward) {
    const badge = await prisma.onboardingBadge.findUnique({
      where: { badgeKey },
    });

    if (badge) {
      await prisma.userBadge.upsert({
        where: {
          userId_badgeId: {
            userId: adminUser.id,
            badgeId: badge.id,
          },
        },
        update: {},
        create: {
          userId: adminUser.id,
          badgeId: badge.id,
          earnedAt: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
          ), // Random date in last 30 days
        },
      });
    }
  }
  console.log(`  ✓ Awarded ${badgesToAward.length} badges`);

  // Create milestones
  const milestones: { type: "TOTAL_LESSONS" | "FIVE_STAR_RATINGS" | "TRIAL_CONVERSIONS"; value: number }[] = [
    { type: "TOTAL_LESSONS", value: 10 },
    { type: "TOTAL_LESSONS", value: 50 },
    { type: "TOTAL_LESSONS", value: 100 },
    { type: "FIVE_STAR_RATINGS", value: 5 },
    { type: "FIVE_STAR_RATINGS", value: 10 },
    { type: "TRIAL_CONVERSIONS", value: 1 },
    { type: "TRIAL_CONVERSIONS", value: 5 },
  ];

  for (const milestone of milestones) {
    await prisma.tutorMilestone.upsert({
      where: {
        tutorProfileId_type_value: {
          tutorProfileId: tutorProfile.id,
          type: milestone.type,
          value: milestone.value,
        },
      },
      update: {},
      create: {
        tutorProfileId: tutorProfile.id,
        type: milestone.type,
        value: milestone.value,
        achievedAt: new Date(
          Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000
        ),
      },
    });
  }
  console.log(`  ✓ Created ${milestones.length} milestones`);

  // Create classes
  const classColors = ["#6366f1", "#10b981", "#f59e0b", "#ec4899"];
  const classNames = [
    "Monday Beginners",
    "Wednesday Advanced",
    "Saturday Chess Club",
    "Private Lessons",
  ];

  for (let i = 0; i < classNames.length; i++) {
    const existingClass = await prisma.class.findFirst({
      where: {
        instructorId: adminUser.id,
        name: classNames[i],
      },
    });

    if (!existingClass) {
      const newClass = await prisma.class.create({
        data: {
          name: classNames[i],
          description: `${classNames[i]} - Weekly chess instruction`,
          instructorId: adminUser.id,
          color: classColors[i],
        },
      });

      // Add some students to each class
      const studentCount = Math.floor(Math.random() * 5) + 3;
      for (let j = 0; j < studentCount; j++) {
        await prisma.student.create({
          data: {
            firstName: [
              "Alex",
              "Jordan",
              "Sam",
              "Taylor",
              "Morgan",
              "Casey",
              "Riley",
              "Quinn",
            ][j % 8],
            lastName: [
              "Smith",
              "Johnson",
              "Williams",
              "Brown",
              "Jones",
              "Garcia",
              "Miller",
              "Davis",
            ][j % 8],
            classId: newClass.id,
          },
        });
      }
      // Note: ClassSessions require a lessonId which we don't have seeded yet
    }
  }
  console.log("  ✓ Created classes with students");

  // Get published courses and enroll user
  const courses = await prisma.trainingCourse.findMany({
    where: { isPublished: true },
    take: 5,
    include: { modules: true },
  });

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    const isCompleted = i < 2; // First 2 courses are completed
    const isInProgress = i === 2; // 3rd course is in progress

    if (isCompleted || isInProgress) {
      const enrollment = await prisma.courseEnrollment.upsert({
        where: {
          userId_courseId: {
            userId: adminUser.id,
            courseId: course.id,
          },
        },
        update: {
          status: isCompleted ? "COMPLETED" : "IN_PROGRESS",
          progress: isCompleted ? 100 : Math.floor(Math.random() * 60) + 20,
          completedAt: isCompleted ? new Date() : null,
        },
        create: {
          userId: adminUser.id,
          courseId: course.id,
          status: isCompleted ? "COMPLETED" : "IN_PROGRESS",
          progress: isCompleted ? 100 : Math.floor(Math.random() * 60) + 20,
          completedAt: isCompleted ? new Date() : null,
        },
      });

      // Create module progress
      for (let j = 0; j < course.modules.length; j++) {
        const module = course.modules[j];
        const moduleCompleted = isCompleted || j < course.modules.length / 2;

        await prisma.moduleProgress.upsert({
          where: {
            enrollmentId_moduleId: {
              enrollmentId: enrollment.id,
              moduleId: module.id,
            },
          },
          update: {
            status: moduleCompleted ? "COMPLETED" : "NOT_STARTED",
            videoProgress: moduleCompleted ? 600 : 0, // Seconds watched
            completedAt: moduleCompleted ? new Date() : null,
          },
          create: {
            enrollmentId: enrollment.id,
            moduleId: module.id,
            status: moduleCompleted ? "COMPLETED" : "NOT_STARTED",
            videoProgress: moduleCompleted ? 600 : 0, // Seconds watched
            completedAt: moduleCompleted ? new Date() : null,
          },
        });
      }
    }
  }
  console.log(`  ✓ Enrolled in ${Math.min(courses.length, 3)} courses`);

  // Create goals
  const goalData = [
    {
      name: "Monthly Teaching Goal",
      description: "Teach 40 lessons this month",
      category: "TEACHING" as const,
      targetValue: 40,
      currentValue: 28,
      status: "IN_PROGRESS" as const,
    },
    {
      name: "Complete Advanced Training",
      description: "Finish all advanced training courses",
      category: "LEARNING" as const,
      targetValue: 3,
      currentValue: 2,
      status: "IN_PROGRESS" as const,
    },
    {
      name: "Build Login Streak",
      description: "Maintain a 14-day login streak",
      category: "ENGAGEMENT" as const,
      targetValue: 14,
      currentValue: 12,
      status: "IN_PROGRESS" as const,
    },
    {
      name: "Onboarding Complete",
      description: "Completed all onboarding steps",
      category: "LEARNING" as const,
      targetValue: 8,
      currentValue: 8,
      status: "COMPLETED" as const,
    },
  ];

  for (const goal of goalData) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    await prisma.tutorGoal.upsert({
      where: {
        id: `admin-goal-${goal.name.toLowerCase().replace(/\s+/g, "-")}`,
      },
      update: {
        currentValue: goal.currentValue,
        status: goal.status,
      },
      create: {
        id: `admin-goal-${goal.name.toLowerCase().replace(/\s+/g, "-")}`,
        userId: adminUser.id,
        name: goal.name,
        description: goal.description,
        category: goal.category,
        targetValue: goal.targetValue,
        currentValue: goal.currentValue,
        status: goal.status,
        startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        endDate,
        completedAt: goal.status === "COMPLETED" ? new Date() : null,
      },
    });
  }
  console.log(`  ✓ Created ${goalData.length} goals`);

  // Create some notifications
  const notifications = [
    {
      type: "BADGE_EARNED" as const,
      title: "New Badge: Century Club",
      message: "Congratulations! You taught your 100th lesson!",
    },
    {
      type: "POINTS_MILESTONE" as const,
      title: "2,500 Points!",
      message: "You've reached 2,500 total points. Keep up the great work!",
    },
    {
      type: "LEADERBOARD_CHANGE" as const,
      title: "Climbing the ranks!",
      message: "You've moved up to #3 on the monthly leaderboard!",
    },
    {
      type: "COURSE_COMPLETED" as const,
      title: "Course Complete!",
      message: "You finished 'Teaching Chess to Beginners'. Certificate issued!",
    },
  ];

  for (const notif of notifications) {
    await prisma.notification.create({
      data: {
        userId: adminUser.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        isRead: Math.random() > 0.5,
        createdAt: new Date(
          Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
        ),
      },
    });
  }
  console.log(`  ✓ Created ${notifications.length} notifications`);

  console.log("\n✅ Demo data seeded successfully for admin user!");
  console.log("\nYou can now log in as admin@workforceportal.com to see the populated dashboard.");
}

seedAdminDemo()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
