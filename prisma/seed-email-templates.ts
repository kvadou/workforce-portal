import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL || "";
  const isRemoteDb = !connectionString.includes("@localhost") && !connectionString.includes("@127.0.0.1");

  const finalConnectionString = isRemoteDb && !connectionString.includes("sslmode=")
    ? `${connectionString}${connectionString.includes("?") ? "&" : "?"}sslmode=no-verify`
    : connectionString;

  const adapter = new PrismaPg({
    connectionString: finalConnectionString,
  });
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

const defaultTemplates = [
  {
    templateKey: "welcome_SUPER_ADMIN",
    name: "Welcome - Super Admin",
    subject: "Welcome to Acme Workforce - Admin Access Granted",
    roleTitle: "System Administrator",
    description:
      "You've been granted full administrative access to Acme Workforce. You'll have access to all system settings, user management, and organizational controls.",
    nextSteps: [
      "Review system settings and configurations",
      "Manage user accounts and permissions",
      "Access all organizational data",
      "Configure platform-wide settings",
    ],
    nextStepsIntro: "you'll have access to",
    requiresOnboarding: false,
  },
  {
    templateKey: "welcome_ADMIN",
    name: "Welcome - Admin",
    subject: "Welcome to Acme Workforce - Admin Access Granted",
    roleTitle: "Administrator",
    description:
      "You've been added as an administrator for Acme Workforce. You'll have access to manage content, users, and organizational settings.",
    nextSteps: [
      "Explore the admin dashboard",
      "Review and manage content",
      "Manage team members",
      "Access reports and analytics",
    ],
    nextStepsIntro: "you'll have access to",
    requiresOnboarding: false,
  },
  {
    templateKey: "welcome_FRANCHISEE_OWNER",
    name: "Welcome - Franchise Owner",
    subject: "Welcome to Acme Workforce - Franchise Owner Access",
    roleTitle: "Franchise Owner",
    description:
      "Welcome to the Acme Workforce franchise family! You now have access to manage your franchise location, tutors, and local operations.",
    nextSteps: [
      "Set up your franchise profile",
      "Invite and manage your tutors",
      "Access franchise resources",
      "Review the curriculum library",
    ],
    nextStepsIntro: "you'll have access to",
    requiresOnboarding: false,
  },
  {
    templateKey: "welcome_LEAD_TUTOR",
    name: "Welcome - Lead Tutor",
    subject: "Welcome to Acme Workforce - Lead Tutor Position",
    roleTitle: "Lead Tutor",
    description:
      "Congratulations on your leadership role! As a Lead Tutor, you'll help manage and mentor other tutors while continuing to teach.",
    nextSteps: [
      "Complete your tutor onboarding",
      "Review team management tools",
      "Access the full curriculum",
      "Learn about mentorship resources",
    ],
    nextStepsIntro: "you'll complete our onboarding process which includes",
    requiresOnboarding: true,
  },
  {
    templateKey: "welcome_TUTOR",
    name: "Welcome - Existing Tutor",
    subject: "Welcome to Acme Workforce - Access Your New Portal",
    roleTitle: "Tutor",
    description:
      "Welcome to the new Acme Workforce portal! As an existing tutor, you now have access to all your familiar teaching materials in our upgraded system.",
    nextSteps: [
      "Access the full curriculum library",
      "Browse teaching resources and materials",
      "View business resources and templates",
      "Check announcements and updates",
    ],
    nextStepsIntro: "you'll have access to",
    requiresOnboarding: false,
  },
  {
    templateKey: "welcome_ONBOARDING_TUTOR",
    name: "Welcome - New Tutor (Onboarding)",
    subject: "Welcome to Acme Workforce - Start Your Journey",
    roleTitle: "New Tutor",
    description:
      "Welcome to Acme Workforce! We're thrilled to have you join our team. Before you can start teaching, you'll need to complete our onboarding process.",
    nextSteps: [
      "Watch orientation videos",
      "Take a short quiz",
      "Complete your profile",
      "Attend an orientation session",
    ],
    nextStepsIntro: "you'll complete our onboarding process which includes",
    requiresOnboarding: true,
  },
  {
    templateKey: "activation",
    name: "Account Activated",
    subject: "You're Now a Acme Workforce Team Member - Account Activated!",
    roleTitle: "Tutor",
    description:
      "Congratulations! You've successfully completed your onboarding and are now an official Acme Workforce team member!",
    nextSteps: [
      "Complete curriculum with lesson plans",
      "Teaching resources and materials",
      "Business resources and templates",
      "Team announcements and updates",
    ],
    nextStepsIntro: "you now have access to",
    requiresOnboarding: false,
  },
  {
    templateKey: "onboarding_reminder",
    name: "Onboarding Reminder",
    subject: "Complete Your Acme Workforce Onboarding",
    roleTitle: null,
    description:
      "We noticed you haven't completed your Acme Workforce onboarding yet. Don't worry - you can pick up right where you left off!",
    nextSteps: [
      "Continue from your current step",
      "Complete any remaining requirements",
      "Reach out if you need assistance",
    ],
    nextStepsIntro: "here's what you need to do",
    requiresOnboarding: true,
  },
];

async function seedEmailTemplates() {
  console.log("Seeding email templates...");

  for (const template of defaultTemplates) {
    const existing = await prisma.emailTemplate.findUnique({
      where: { templateKey: template.templateKey },
    });

    if (existing) {
      console.log(`  Template "${template.templateKey}" already exists, skipping...`);
    } else {
      await prisma.emailTemplate.create({
        data: template,
      });
      console.log(`  Created template: ${template.templateKey}`);
    }
  }

  console.log("Email templates seeded successfully!");
}

seedEmailTemplates()
  .catch((e) => {
    console.error("Error seeding email templates:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
