import "dotenv/config";
import { PrismaClient, UserRole, TutorStatus, TutorTeam, TutorCertType, TutorCertStatus, TutorNoteType, ConfigValueType, PointsCategory } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { seedChessLessons } from "./seed-chess-lessons";
import { seedChessPoints } from "./seed-chess-points";
import { seedChessBadges } from "./seed-chess-badges";
import { seedDemoData } from "./seed-demo-data";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...\n");

  // ===== ORGANIZATIONS =====
  console.log("Creating organizations...");

  const hqOrg = await prisma.organization.upsert({
    where: { subdomain: "hq" },
    update: {},
    create: {
      name: "Acme Workforce HQ",
      subdomain: "hq",
      isHQ: true,
      isActive: true,
      primaryColor: "#4F46E5", // Indigo
      settings: {
        timezone: "America/New_York",
        defaultCurrency: "USD",
      },
    },
  });
  console.log("  ✓ Created HQ organization:", hqOrg.name);

  const westsideOrg = await prisma.organization.upsert({
    where: { subdomain: "westside" },
    update: {},
    create: {
      name: "Acme Workforce Westside",
      subdomain: "westside",
      isHQ: false,
      isActive: true,
      primaryColor: "#059669", // Emerald
      settings: {
        timezone: "America/Chicago",
        defaultCurrency: "USD",
      },
    },
  });
  console.log("  ✓ Created Westside organization:", westsideOrg.name);

  const eastsideOrg = await prisma.organization.upsert({
    where: { subdomain: "eastside" },
    update: {},
    create: {
      name: "Acme Workforce Eastside",
      subdomain: "eastside",
      isHQ: false,
      isActive: true,
      primaryColor: "#DC2626", // Red
      settings: {
        timezone: "America/New_York",
        defaultCurrency: "USD",
      },
    },
  });
  console.log("  ✓ Created Eastside organization:", eastsideOrg.name);

  // ===== USERS =====
  console.log("\nCreating users...");

  const hashedPassword = await bcrypt.hash("admin123", 12);

  // Super Admin (HQ)
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@workforceportal.com" },
    update: {
      role: UserRole.SUPER_ADMIN,
      organizationId: hqOrg.id,
    },
    create: {
      email: "admin@workforceportal.com",
      passwordHash: hashedPassword,
      name: "Super Admin",
      role: UserRole.SUPER_ADMIN,
      organizationId: hqOrg.id,
    },
  });
  console.log("  ✓ Created super admin:", superAdmin.email);

  // Admin (HQ)
  const admin = await prisma.user.upsert({
    where: { email: "editor@workforceportal.com" },
    update: {
      role: UserRole.ADMIN,
      organizationId: hqOrg.id,
    },
    create: {
      email: "editor@workforceportal.com",
      passwordHash: hashedPassword,
      name: "Content Admin",
      role: UserRole.ADMIN,
      organizationId: hqOrg.id,
    },
  });
  console.log("  ✓ Created admin:", admin.email);

  // Westside Franchisee Owner
  const westsideOwner = await prisma.user.upsert({
    where: { email: "owner@westside.workforceportal.com" },
    update: {
      role: UserRole.FRANCHISEE_OWNER,
      organizationId: westsideOrg.id,
    },
    create: {
      email: "owner@westside.workforceportal.com",
      passwordHash: hashedPassword,
      name: "Westside Owner",
      role: UserRole.FRANCHISEE_OWNER,
      organizationId: westsideOrg.id,
    },
  });
  console.log("  ✓ Created Westside owner:", westsideOwner.email);

  // Westside Lead Tutor
  const westsideLeadTutor = await prisma.user.upsert({
    where: { email: "lead@westside.workforceportal.com" },
    update: {
      role: UserRole.LEAD_TUTOR,
      organizationId: westsideOrg.id,
    },
    create: {
      email: "lead@westside.workforceportal.com",
      passwordHash: hashedPassword,
      name: "Westside Lead Tutor",
      role: UserRole.LEAD_TUTOR,
      organizationId: westsideOrg.id,
    },
  });
  console.log("  ✓ Created Westside lead tutor:", westsideLeadTutor.email);

  // Westside Tutor
  const westsideTutor = await prisma.user.upsert({
    where: { email: "tutor@westside.workforceportal.com" },
    update: {
      role: UserRole.TUTOR,
      organizationId: westsideOrg.id,
    },
    create: {
      email: "tutor@westside.workforceportal.com",
      passwordHash: hashedPassword,
      name: "Westside Tutor",
      role: UserRole.TUTOR,
      organizationId: westsideOrg.id,
    },
  });
  console.log("  ✓ Created Westside tutor:", westsideTutor.email);

  // Eastside Franchisee Owner
  const eastsideOwner = await prisma.user.upsert({
    where: { email: "owner@eastside.workforceportal.com" },
    update: {
      role: UserRole.FRANCHISEE_OWNER,
      organizationId: eastsideOrg.id,
    },
    create: {
      email: "owner@eastside.workforceportal.com",
      passwordHash: hashedPassword,
      name: "Eastside Owner",
      role: UserRole.FRANCHISEE_OWNER,
      organizationId: eastsideOrg.id,
    },
  });
  console.log("  ✓ Created Eastside owner:", eastsideOwner.email);

  // Onboarding Tutor
  const onboardingTutor = await prisma.user.upsert({
    where: { email: "onboarding@workforceportal.com" },
    update: {
      role: UserRole.ONBOARDING_TUTOR,
      organizationId: hqOrg.id,
      isOnboarding: true,
    },
    create: {
      email: "onboarding@workforceportal.com",
      passwordHash: hashedPassword,
      name: "New Tutor (Onboarding)",
      role: UserRole.ONBOARDING_TUTOR,
      organizationId: hqOrg.id,
      isOnboarding: true,
    },
  });
  console.log("  ✓ Created onboarding tutor:", onboardingTutor.email);

  // ===== CURRICULUM =====
  console.log("\nCreating curriculum...");

  const curriculum = await prisma.curriculum.upsert({
    where: { id: "clsample001" },
    update: {},
    create: {
      id: "clsample001",
      title: "Acme Workforce - Complete Curriculum",
      description: "The complete Acme Workforce curriculum for delivering workforce training through interactive learning.",
      status: "PUBLISHED",
      order: 1,
    },
  });
  console.log("  ✓ Created curriculum:", curriculum.title);

  // Grant curriculum access to all organizations
  for (const org of [hqOrg, westsideOrg, eastsideOrg]) {
    await prisma.organizationCurriculumAccess.upsert({
      where: {
        organizationId_curriculumId: {
          organizationId: org.id,
          curriculumId: curriculum.id,
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        curriculumId: curriculum.id,
      },
    });
  }
  console.log("  ✓ Granted curriculum access to all organizations");

  // ===== MODULES & LESSONS =====
  console.log("\nCreating modules and lessons...");

  const module = await prisma.module.upsert({
    where: { id: "clmodule001" },
    update: {},
    create: {
      id: "clmodule001",
      curriculumId: curriculum.id,
      title: "Introduction to Training Basics",
      description: "Learn the fundamentals of the training program.",
      status: "PUBLISHED",
      order: 1,
    },
  });
  console.log("  ✓ Created module:", module.title);

  const lesson = await prisma.lesson.upsert({
    where: { id: "cllesson001" },
    update: {},
    create: {
      id: "cllesson001",
      moduleId: module.id,
      number: 1,
      title: "The King",
      subtitle: "Meet King Shaky",
      status: "PUBLISHED",
      order: 1,
    },
  });
  console.log("  ✓ Created lesson:", lesson.title);

  // Create developmental skills for the lesson
  await prisma.developmentalSkill.createMany({
    skipDuplicates: true,
    data: [
      {
        lessonId: lesson.id,
        title: "Strategic Thinking",
        description: "Students learn to think ahead and consider consequences of moves.",
        order: 1,
      },
      {
        lessonId: lesson.id,
        title: "Pattern Recognition",
        description: "Students identify patterns in training scenarios and best practices.",
        order: 2,
      },
    ],
  });
  console.log("  ✓ Created developmental skills");

  // Create story content for the lesson
  await prisma.storyContent.upsert({
    where: { lessonId: lesson.id },
    update: {},
    create: {
      lessonId: lesson.id,
      introduction: "Today we're going to meet a very special friend - King Shaky!",
      teacherTip: "Use a crown prop to make the introduction more engaging.",
      content: {
        paragraphs: [
          {
            type: "paragraph",
            content: "Once upon a time, in a magical kingdom called Training Academy, there lived a king named Shaky.",
          },
          {
            type: "paragraph",
            content: "King Shaky was the most important piece on the chessboard, but he was also very scared!",
          },
        ],
      },
    },
  });
  console.log("  ✓ Created story content");

  // ===== SAMPLE ANNOUNCEMENTS =====
  console.log("\nCreating sample announcements...");

  await prisma.announcement.upsert({
    where: { id: "clannounce001" },
    update: {},
    create: {
      id: "clannounce001",
      title: "Welcome to Acme Workforce!",
      content: "We're excited to launch our new tutor portal. Here you'll find all the curriculum, resources, and tools you need to deliver amazing training modules.",
      type: "ANNOUNCEMENT",
      targetRoles: [UserRole.TUTOR, UserRole.LEAD_TUTOR, UserRole.FRANCHISEE_OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
      isPinned: true,
      isActive: true,
    },
  });
  console.log("  ✓ Created welcome announcement");

  await prisma.announcement.upsert({
    where: { id: "clannounce002" },
    update: {},
    create: {
      id: "clannounce002",
      title: "Annual Tutor Conference - March 15, 2025",
      content: "Save the date! Our annual tutor conference will be held on March 15, 2025. More details coming soon.",
      type: "IMPORTANT_DATE",
      targetRoles: [UserRole.TUTOR, UserRole.LEAD_TUTOR, UserRole.FRANCHISEE_OWNER],
      isPinned: false,
      isActive: true,
    },
  });
  console.log("  ✓ Created important date announcement");

  // ===== ONBOARDING CONTENT =====
  console.log("\nCreating onboarding content...");

  // Create onboarding videos
  const videos = [
    {
      id: "clvideo001",
      title: "Orientation Part 1 - Who is Acme Workforce?",
      description: "Learn about the history and mission of Acme Workforce.",
      vimeoId: "123456789",
      duration: 1080, // 18 min
      order: 0,
    },
    {
      id: "clvideo002",
      title: "Orientation Part 2 - Training Standards",
      description: "Understand our expectations and values as a tutor.",
      vimeoId: "123456790",
      duration: 1800, // 30 min
      order: 1,
    },
    {
      id: "clvideo003",
      title: "Orientation Part 3 - Admin Systems",
      description: "Learn how to use our administrative systems and tools.",
      vimeoId: "123456791",
      duration: 2160, // 36 min
      order: 2,
    },
    {
      id: "clvideo004",
      title: "Orientation Part 4 - Teaching & Resources",
      description: "Discover all the teaching resources available to you.",
      vimeoId: "123456792",
      duration: 1560, // 26 min
      order: 3,
    },
    {
      id: "clvideo005",
      title: "Orientation Part 5 - Admin Procedures",
      description: "Master the administrative procedures for your lessons.",
      vimeoId: "123456793",
      duration: 1860, // 31 min
      order: 4,
    },
    {
      id: "clvideo006",
      title: "Orientation Part 6 - Referrals & Getting Paid",
      description: "Learn about our referral program and payment process.",
      vimeoId: "123456794",
      duration: 1320, // 22 min
      order: 5,
    },
  ];

  for (const video of videos) {
    await prisma.onboardingVideo.upsert({
      where: { id: video.id },
      update: {},
      create: {
        ...video,
        isRequired: true,
        isActive: true,
      },
    });
  }
  console.log("  ✓ Created 6 onboarding videos");

  // Create quiz questions
  const questions = [
    {
      id: "clquiz001",
      question: "What is the primary teaching method used at Acme Workforce?",
      type: "MULTIPLE_CHOICE" as const,
      options: [
        { id: "a", text: "Memorization of procedures" },
        { id: "b", text: "Storytelling and narrative-based learning" },
        { id: "c", text: "Competitive tournament play" },
        { id: "d", text: "Computer-based learning" },
      ],
      correctAnswer: "b",
      explanation: "Acme Workforce uses storytelling and narrative-based learning to make chess accessible and engaging for children.",
      category: "Teaching Philosophy",
      order: 0,
    },
    {
      id: "clquiz002",
      question: "What should you do if a student is struggling with a concept?",
      type: "MULTIPLE_CHOICE" as const,
      options: [
        { id: "a", text: "Move on to the next lesson" },
        { id: "b", text: "Repeat the same explanation louder" },
        { id: "c", text: "Use different approaches and be patient" },
        { id: "d", text: "Tell the parent the student isn't ready" },
      ],
      correctAnswer: "c",
      explanation: "Every student learns differently. Using various approaches while being patient helps ensure understanding.",
      category: "Teaching Philosophy",
      order: 1,
    },
    {
      id: "clquiz003",
      question: "How far in advance should you arrive before a lesson?",
      type: "MULTIPLE_CHOICE" as const,
      options: [
        { id: "a", text: "Right on time" },
        { id: "b", text: "5-10 minutes early" },
        { id: "c", text: "30 minutes early" },
        { id: "d", text: "It doesn't matter" },
      ],
      correctAnswer: "b",
      explanation: "Arriving 5-10 minutes early allows you to set up and be ready when the student arrives.",
      category: "Admin Procedures",
      order: 2,
    },
    {
      id: "clquiz004",
      question: "When should you submit your lesson reports?",
      type: "MULTIPLE_CHOICE" as const,
      options: [
        { id: "a", text: "Within 1 week of the lesson" },
        { id: "b", text: "Within 24 hours of the lesson" },
        { id: "c", text: "At the end of each month" },
        { id: "d", text: "Only when asked" },
      ],
      correctAnswer: "b",
      explanation: "Lesson reports should be submitted within 24 hours to ensure accurate record-keeping.",
      category: "Admin Procedures",
      order: 3,
    },
    {
      id: "clquiz005",
      question: "Tutors are independent contractors, not employees.",
      type: "TRUE_FALSE" as const,
      options: [
        { id: "true", text: "True" },
        { id: "false", text: "False" },
      ],
      correctAnswer: "true",
      explanation: "Acme Workforce tutors work as independent contractors.",
      category: "Getting Paid",
      order: 4,
    },
  ];

  for (const question of questions) {
    await prisma.onboardingQuizQuestion.upsert({
      where: { id: question.id },
      update: {},
      create: {
        ...question,
        isActive: true,
      },
    });
  }
  console.log("  ✓ Created 5 quiz questions");

  // Create orientation sessions
  const futureDate1 = new Date();
  futureDate1.setDate(futureDate1.getDate() + 7);
  futureDate1.setHours(14, 0, 0, 0);

  const futureDate2 = new Date();
  futureDate2.setDate(futureDate2.getDate() + 14);
  futureDate2.setHours(10, 0, 0, 0);

  await prisma.orientationSession.upsert({
    where: { id: "clsession001" },
    update: {},
    create: {
      id: "clsession001",
      title: "Orientation Debrief Session",
      description: "Meet the team, participate in our quiz show, and get your questions answered!",
      scheduledAt: futureDate1,
      duration: 90,
      zoomLink: "https://zoom.us/j/123456789",
      hostName: "Jessica",
      maxParticipants: 20,
      isActive: true,
    },
  });

  await prisma.orientationSession.upsert({
    where: { id: "clsession002" },
    update: {},
    create: {
      id: "clsession002",
      title: "Orientation Debrief Session",
      description: "Meet the team, participate in our quiz show, and get your questions answered!",
      scheduledAt: futureDate2,
      duration: 90,
      zoomLink: "https://zoom.us/j/987654321",
      hostName: "Jessica",
      maxParticipants: 20,
      isActive: true,
    },
  });
  console.log("  ✓ Created 2 orientation sessions");

  // Create onboarding progress for the onboarding user
  await prisma.onboardingProgress.upsert({
    where: { userId: onboardingTutor.id },
    update: {},
    create: {
      userId: onboardingTutor.id,
      status: "WELCOME",
      currentStep: 1,
      videoProgress: [],
      trainingSessions: [],
      shadowLessons: [],
    },
  });
  console.log("  ✓ Created onboarding progress for test user");

  // ===== TUTOR PROFILES =====
  console.log("\nCreating tutor profiles...");

  // Westside Lead Tutor Profile
  const leadTutorProfile = await prisma.tutorProfile.upsert({
    where: { userId: westsideLeadTutor.id },
    update: {},
    create: {
      userId: westsideLeadTutor.id,
      tutorCruncherId: 1001,
      branchId: "branch_lead_001",
      pronouns: "she/her",
      hireDate: new Date("2023-06-15"),
      activatedAt: new Date("2023-07-01"),
      status: TutorStatus.ACTIVE,
      team: TutorTeam.WESTSIDE,
      isSchoolCertified: true,
      isBqCertified: true,
      isPlaygroupCertified: true,
      baseHourlyRate: 35.0,
      chessLevel: "Advanced",
      chessRating: 1450,
      noctieRating: 85,
      chessableUsername: "westside_lead",
      chessableProgress: 100,
      totalLessons: 250,
      totalHours: 375.5,
      averageRating: 4.9,
      lastLessonDate: new Date("2025-01-15"),
    },
  });
  console.log("  ✓ Created lead tutor profile:", westsideLeadTutor.email);

  // Westside Regular Tutor Profile
  const regularTutorProfile = await prisma.tutorProfile.upsert({
    where: { userId: westsideTutor.id },
    update: {},
    create: {
      userId: westsideTutor.id,
      tutorCruncherId: 1002,
      branchId: "branch_tutor_002",
      pronouns: "he/him",
      hireDate: new Date("2024-03-01"),
      activatedAt: new Date("2024-03-20"),
      status: TutorStatus.ACTIVE,
      team: TutorTeam.WESTSIDE,
      isSchoolCertified: true,
      isBqCertified: false,
      isPlaygroupCertified: false,
      baseHourlyRate: 28.0,
      chessLevel: "Intermediate",
      chessRating: 1200,
      noctieRating: 72,
      chessableUsername: "westside_tutor",
      chessableProgress: 75,
      totalLessons: 45,
      totalHours: 67.5,
      averageRating: 4.7,
      lastLessonDate: new Date("2025-01-14"),
    },
  });
  console.log("  ✓ Created tutor profile:", westsideTutor.email);

  // ===== TUTOR CERTIFICATIONS =====
  console.log("\nCreating tutor certifications...");

  // Lead tutor certifications
  await prisma.tutorCertification.createMany({
    skipDuplicates: true,
    data: [
      {
        tutorProfileId: leadTutorProfile.id,
        type: TutorCertType.SCHOOL_CERTIFIED,
        status: TutorCertStatus.COMPLETED,
        earnedAt: new Date("2023-07-15"),
        notes: "Completed with distinction",
      },
      {
        tutorProfileId: leadTutorProfile.id,
        type: TutorCertType.BQ_CERTIFIED,
        status: TutorCertStatus.COMPLETED,
        earnedAt: new Date("2023-08-20"),
      },
      {
        tutorProfileId: leadTutorProfile.id,
        type: TutorCertType.PLAYGROUP_CERTIFIED,
        status: TutorCertStatus.COMPLETED,
        earnedAt: new Date("2023-09-10"),
      },
      {
        tutorProfileId: leadTutorProfile.id,
        type: TutorCertType.BACKGROUND_CHECK,
        status: TutorCertStatus.COMPLETED,
        earnedAt: new Date("2023-06-20"),
        expiresAt: new Date("2026-06-20"),
        documentUrl: "s3://workforceportal/background-checks/lead-001.pdf",
      },
      {
        tutorProfileId: leadTutorProfile.id,
        type: TutorCertType.CHESSABLE_COMPLETED,
        status: TutorCertStatus.COMPLETED,
        earnedAt: new Date("2023-07-25"),
      },
      {
        tutorProfileId: leadTutorProfile.id,
        type: TutorCertType.LEAD_TUTOR,
        status: TutorCertStatus.COMPLETED,
        earnedAt: new Date("2024-01-15"),
        notes: "Promoted to lead tutor",
      },
    ],
  });
  console.log("  ✓ Created certifications for lead tutor");

  // Regular tutor certifications
  await prisma.tutorCertification.createMany({
    skipDuplicates: true,
    data: [
      {
        tutorProfileId: regularTutorProfile.id,
        type: TutorCertType.SCHOOL_CERTIFIED,
        status: TutorCertStatus.COMPLETED,
        earnedAt: new Date("2024-04-01"),
      },
      {
        tutorProfileId: regularTutorProfile.id,
        type: TutorCertType.BACKGROUND_CHECK,
        status: TutorCertStatus.COMPLETED,
        earnedAt: new Date("2024-03-10"),
        expiresAt: new Date("2027-03-10"),
        documentUrl: "s3://workforceportal/background-checks/tutor-002.pdf",
      },
      {
        tutorProfileId: regularTutorProfile.id,
        type: TutorCertType.CHESSABLE_COMPLETED,
        status: TutorCertStatus.PENDING,
        notes: "In progress - 75% complete",
      },
    ],
  });
  console.log("  ✓ Created certifications for regular tutor");

  // ===== TUTOR LABELS =====
  console.log("\nCreating tutor labels...");

  await prisma.tutorLabel.createMany({
    skipDuplicates: true,
    data: [
      {
        tutorProfileId: leadTutorProfile.id,
        name: "Top Performer",
        color: "#10B981",
      },
      {
        tutorProfileId: leadTutorProfile.id,
        name: "Team Lead",
        color: "#6366F1",
      },
      {
        tutorProfileId: regularTutorProfile.id,
        name: "Rising Star",
        color: "#F59E0B",
      },
    ],
  });
  console.log("  ✓ Created tutor labels");

  // ===== TUTOR NOTES =====
  console.log("\nCreating tutor notes...");

  await prisma.tutorNote.createMany({
    skipDuplicates: true,
    data: [
      {
        tutorProfileId: leadTutorProfile.id,
        type: TutorNoteType.GENERAL,
        content: "Excellent communication with parents. Always follows up after lessons.",
        createdBy: admin.id,
      },
      {
        tutorProfileId: leadTutorProfile.id,
        type: TutorNoteType.PERFORMANCE,
        content: "Consistently receives 5-star reviews from families.",
        createdBy: admin.id,
      },
      {
        tutorProfileId: regularTutorProfile.id,
        type: TutorNoteType.ADMIN,
        content: "Scheduled for BQ certification next month.",
        createdBy: westsideOwner.id,
      },
    ],
  });
  console.log("  ✓ Created tutor notes");

  // ===== ONBOARDING CONFIGURATION =====
  console.log("\nCreating onboarding configuration...");

  // Config settings (key-value pairs)
  const configSettings = [
    // Welcome page settings
    {
      key: "welcome_video_id",
      value: "838377574",
      category: "welcome",
      label: "Welcome Video (Vimeo ID)",
      description: "The Vimeo video ID for the welcome message from Harlan",
      valueType: ConfigValueType.STRING,
    },
    {
      key: "welcome_video_hash",
      value: "09dc5d426b",
      category: "welcome",
      label: "Welcome Video Hash",
      description: "The Vimeo privacy hash for the welcome video",
      valueType: ConfigValueType.STRING,
    },
    {
      key: "welcome_video_title",
      value: "A Message From Harlan",
      category: "welcome",
      label: "Welcome Video Title",
      description: "Title displayed above the welcome video",
      valueType: ConfigValueType.STRING,
    },
    {
      key: "welcome_video_description",
      value: "Learn what makes Acme Workforce special and what to expect on your journey to becoming an amazing tutor.",
      category: "welcome",
      label: "Welcome Video Description",
      description: "Description shown below the video title",
      valueType: ConfigValueType.STRING,
    },
    {
      key: "welcome_headline",
      value: "We're thrilled to have you join the Acme Workforce family.",
      category: "welcome",
      label: "Welcome Headline",
      description: "The main headline shown on the welcome page",
      valueType: ConfigValueType.STRING,
    },
    // Stats settings
    {
      key: "completion_bonus_amount",
      value: "250",
      category: "general",
      label: "Completion Bonus Amount",
      description: "Dollar amount given upon completing onboarding",
      valueType: ConfigValueType.NUMBER,
    },
    {
      key: "training_hours",
      value: "2.5",
      category: "general",
      label: "Training Video Hours",
      description: "Total hours of training video content",
      valueType: ConfigValueType.STRING,
    },
    {
      key: "shadow_lessons_count",
      value: "6",
      category: "general",
      label: "Shadow Lessons Required",
      description: "Number of shadow lessons required to complete onboarding",
      valueType: ConfigValueType.NUMBER,
    },
    {
      key: "training_sessions_count",
      value: "3",
      category: "general",
      label: "Training Sessions Required",
      description: "Number of training sessions required to complete onboarding",
      valueType: ConfigValueType.NUMBER,
    },
    // Quiz settings
    {
      key: "quiz_passing_score",
      value: "80",
      category: "quiz",
      label: "Quiz Passing Score",
      description: "Minimum percentage required to pass the quiz",
      valueType: ConfigValueType.NUMBER,
    },
    // Orientation settings
    {
      key: "orientation_duration_minutes",
      value: "90",
      category: "orientation",
      label: "Orientation Duration (minutes)",
      description: "Duration of orientation sessions in minutes",
      valueType: ConfigValueType.NUMBER,
    },
    {
      key: "orientation_pay_rate",
      value: "25",
      category: "orientation",
      label: "Orientation Pay Rate ($/hour)",
      description: "Hourly pay rate for orientation sessions",
      valueType: ConfigValueType.NUMBER,
    },
    {
      key: "orientation_trainer_name",
      value: "Jessica",
      category: "orientation",
      label: "Default Trainer Name",
      description: "Default name displayed for orientation sessions",
      valueType: ConfigValueType.STRING,
    },
    // Contact settings
    {
      key: "contact_email",
      value: "admin@workforceportal.com",
      category: "general",
      label: "Contact Email",
      description: "Email address shown for support inquiries",
      valueType: ConfigValueType.STRING,
    },
  ];

  for (const config of configSettings) {
    await prisma.onboardingConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    });
  }
  console.log("  ✓ Created", configSettings.length, "config settings");

  // Journey steps
  const journeySteps = [
    // Phase 1: Welcome & Training Videos
    {
      title: "Welcome Video",
      description: "Watch the intro and meet the team",
      shortDescription: "Get started",
      icon: "PlayCircle",
      href: "/onboarding/welcome",
      color: "purple",
      requiredStatus: "WELCOME",
      completionField: "welcomeCompletedAt",
      badgeType: "welcome",
      phase: 1,
      order: 1,
    },
    {
      title: "Part 1: Who is Acme Workforce?",
      description: "Learn about our history and mission",
      shortDescription: "18 min + quiz",
      icon: "Video",
      href: "/onboarding/videos/1",
      color: "purple",
      requiredStatus: "VIDEOS_IN_PROGRESS",
      completionField: "videosCompletedAt",
      badgeType: null,
      phase: 1,
      order: 2,
    },
    {
      title: "Part 2: Training Standards",
      description: "Understand our expectations and values",
      shortDescription: "30 min + quiz",
      icon: "Video",
      href: "/onboarding/videos/2",
      color: "purple",
      requiredStatus: "VIDEOS_IN_PROGRESS",
      completionField: "videosCompletedAt",
      badgeType: null,
      phase: 1,
      order: 3,
    },
    {
      title: "Part 3: Admin Systems",
      description: "Learn our administrative tools",
      shortDescription: "36 min + quiz",
      icon: "Video",
      href: "/onboarding/videos/3",
      color: "purple",
      requiredStatus: "VIDEOS_IN_PROGRESS",
      completionField: "videosCompletedAt",
      badgeType: null,
      phase: 1,
      order: 4,
    },
    {
      title: "Part 4: Teaching & Resources",
      description: "Discover teaching resources available to you",
      shortDescription: "26 min + quiz",
      icon: "Video",
      href: "/onboarding/videos/4",
      color: "purple",
      requiredStatus: "VIDEOS_IN_PROGRESS",
      completionField: "videosCompletedAt",
      badgeType: null,
      phase: 1,
      order: 5,
    },
    {
      title: "Part 5: Admin Procedures",
      description: "Master lesson administrative procedures",
      shortDescription: "31 min + quiz",
      icon: "Video",
      href: "/onboarding/videos/5",
      color: "purple",
      requiredStatus: "VIDEOS_IN_PROGRESS",
      completionField: "videosCompletedAt",
      badgeType: null,
      phase: 1,
      order: 6,
    },
    {
      title: "Part 6: Referrals & Getting Paid",
      description: "Learn about referrals and payment",
      shortDescription: "22 min + quiz",
      icon: "Video",
      href: "/onboarding/videos/6",
      color: "purple",
      requiredStatus: "VIDEOS_IN_PROGRESS",
      completionField: "videosCompletedAt",
      badgeType: "videos",
      phase: 1,
      order: 7,
    },
    // Phase 2: Profile & Documents
    {
      title: "Profile Setup",
      description: "Upload your photo, bio, and contact info",
      shortDescription: "5 min",
      icon: "User",
      href: "/onboarding/profile",
      color: "green",
      requiredStatus: "PROFILE_PENDING",
      completionField: "profileCompletedAt",
      badgeType: "profile",
      phase: 2,
      order: 8,
    },
    {
      title: "W-9 Documents",
      description: "Tax documentation for payroll",
      shortDescription: "Required for payment",
      icon: "FileText",
      href: "/onboarding/profile",
      color: "green",
      requiredStatus: "W9_PENDING",
      completionField: "w9CompletedAt",
      badgeType: "w9",
      phase: 2,
      order: 9,
    },
    // Phase 3: Orientation Debrief
    {
      title: "Orientation Debrief",
      description: "Attend the live group Zoom session",
      shortDescription: "90 min Zoom call",
      icon: "Calendar",
      href: "/onboarding/orientation",
      color: "cyan",
      requiredStatus: "AWAITING_ORIENTATION",
      completionField: "orientationAttendedAt",
      badgeType: "orientation",
      phase: 3,
      order: 10,
    },
    // Phase 4: Post-Orientation Training
    {
      title: "Demo / Magic",
      description: "Live Zoom training session",
      shortDescription: "2 hours",
      icon: "Star",
      href: "/onboarding/training",
      color: "amber",
      requiredStatus: "POST_ORIENTATION_TRAINING",
      completionField: "demoMagicCompletedAt",
      badgeType: null,
      phase: 4,
      order: 11,
    },
    {
      title: "Chess Confidence",
      description: "Build your chess teaching confidence",
      shortDescription: "2 hours",
      icon: "Shield",
      href: "/onboarding/training",
      color: "amber",
      requiredStatus: "POST_ORIENTATION_TRAINING",
      completionField: "chessConfidenceCompletedAt",
      badgeType: null,
      phase: 4,
      order: 12,
    },
    {
      title: "Teaching In Schools",
      description: "Learn school environment best practices",
      shortDescription: "2 hours",
      icon: "GraduationCap",
      href: "/onboarding/training",
      color: "amber",
      requiredStatus: "POST_ORIENTATION_TRAINING",
      completionField: "teachingInSchoolsCompletedAt",
      badgeType: null,
      phase: 4,
      order: 13,
    },
    {
      title: "Chessable",
      description: "Complete Chessable training module",
      shortDescription: "Self-paced",
      icon: "BookOpen",
      href: "/onboarding/training",
      color: "amber",
      requiredStatus: "POST_ORIENTATION_TRAINING",
      completionField: "chessableCompletedAt",
      badgeType: "training",
      phase: 4,
      order: 14,
    },
    // Phase 5: Shadow Lessons
    {
      title: "Shadow Session #1",
      description: "Observe an experienced tutor teach a live lesson",
      shortDescription: "Paired with mentor",
      icon: "Eye",
      href: "/onboarding/shadows",
      color: "indigo",
      requiredStatus: "SHADOW_LESSONS",
      completionField: "shadow1At",
      badgeType: null,
      phase: 5,
      order: 15,
    },
    {
      title: "Shadow Session #2",
      description: "Second observation with your mentor",
      shortDescription: "Paired with mentor",
      icon: "Eye",
      href: "/onboarding/shadows",
      color: "indigo",
      requiredStatus: "SHADOW_LESSONS",
      completionField: "shadow2At",
      badgeType: null,
      phase: 5,
      order: 16,
    },
    {
      title: "Shadow Session #3 + Feedback",
      description: "Final observation and mentor feedback",
      shortDescription: "Paired with mentor",
      icon: "Eye",
      href: "/onboarding/shadows",
      color: "indigo",
      requiredStatus: "SHADOW_LESSONS",
      completionField: "shadow3At",
      badgeType: "shadow",
      phase: 5,
      order: 17,
    },
    // Phase 6: Ready!
    {
      title: "Ready!",
      description: "Launch your profile and start accepting bookings",
      shortDescription: "You're an active tutor!",
      icon: "Trophy",
      href: "/onboarding/ready",
      color: "green",
      requiredStatus: "COMPLETED",
      completionField: "activatedAt",
      badgeType: "activated",
      phase: 6,
      order: 18,
    },
  ];

  // Clear old journey steps and create new ones for 6-phase model
  await prisma.onboardingJourneyStep.deleteMany({});
  for (const step of journeySteps) {
    await prisma.onboardingJourneyStep.create({
      data: { id: `step_${step.order}`, ...step },
    });
  }
  console.log("  ✓ Created", journeySteps.length, "journey steps (6-phase model)");

  // Achievement badges
  const badges = [
    {
      badgeKey: "welcome",
      title: "Journey Begins",
      description: "Watched the welcome video",
      icon: "Star",
      colorScheme: JSON.stringify({
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
      }),
      unlockType: "step_completion",
      unlockCondition: "welcomeCompletedAt",
      order: 1,
    },
    {
      badgeKey: "videos",
      title: "Video Champion",
      description: "Completed all training videos",
      icon: "PlayCircle",
      colorScheme: JSON.stringify({
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
      }),
      unlockType: "step_completion",
      unlockCondition: "videosCompletedAt",
      order: 2,
    },
    {
      badgeKey: "quiz",
      title: "Quiz Master",
      description: "Passed the knowledge quiz",
      icon: "Brain",
      colorScheme: JSON.stringify({
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      }),
      unlockType: "step_completion",
      unlockCondition: "quizPassedAt",
      order: 3,
    },
    {
      badgeKey: "profile",
      title: "Profile Pro",
      description: "Completed your profile",
      icon: "User",
      colorScheme: JSON.stringify({
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
      }),
      unlockType: "step_completion",
      unlockCondition: "profileCompletedAt",
      order: 4,
    },
    {
      badgeKey: "w9",
      title: "Paperwork Hero",
      description: "Submitted W-9 form",
      icon: "FileText",
      colorScheme: JSON.stringify({
        color: "text-cyan-600",
        bgColor: "bg-cyan-50",
        borderColor: "border-cyan-200",
      }),
      unlockType: "step_completion",
      unlockCondition: "w9CompletedAt",
      order: 5,
    },
    {
      badgeKey: "orientation",
      title: "Orientation Complete",
      description: "Attended orientation session",
      icon: "Calendar",
      colorScheme: JSON.stringify({
        color: "text-pink-600",
        bgColor: "bg-pink-50",
        borderColor: "border-pink-200",
      }),
      unlockType: "step_completion",
      unlockCondition: "orientationAttendedAt",
      order: 6,
    },
    {
      badgeKey: "training",
      title: "Certified Tutor",
      description: "Completed all training",
      icon: "GraduationCap",
      colorScheme: JSON.stringify({
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
        borderColor: "border-indigo-200",
      }),
      unlockType: "step_completion",
      unlockCondition: "trainingCompletedAt",
      order: 7,
    },
    {
      badgeKey: "streak-3",
      title: "On Fire!",
      description: "3-day login streak",
      icon: "Flame",
      colorScheme: JSON.stringify({
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
      }),
      unlockType: "streak",
      unlockCondition: "3",
      order: 8,
    },
    {
      badgeKey: "streak-7",
      title: "Unstoppable",
      description: "7-day login streak",
      icon: "Zap",
      colorScheme: JSON.stringify({
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
      }),
      unlockType: "streak",
      unlockCondition: "7",
      order: 9,
    },
    {
      badgeKey: "speed-demon",
      title: "Speed Demon",
      description: "Completed onboarding in under 3 days",
      icon: "Target",
      colorScheme: JSON.stringify({
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
      }),
      unlockType: "special",
      unlockCondition: "completed_under_3_days",
      order: 10,
    },
    {
      badgeKey: "perfect-quiz",
      title: "Perfect Score",
      description: "100% on the quiz",
      icon: "Trophy",
      colorScheme: JSON.stringify({
        color: "text-amber-700",
        bgColor: "bg-amber-100",
        borderColor: "border-amber-300",
      }),
      unlockType: "special",
      unlockCondition: "quiz_score_100",
      order: 11,
    },
  ];

  for (const badge of badges) {
    await prisma.onboardingBadge.upsert({
      where: { badgeKey: badge.badgeKey },
      update: badge,
      create: badge,
    });
  }
  console.log("  ✓ Created", badges.length, "achievement badges");

  // Dropdown options - Languages
  const languages = [
    "English", "Spanish", "French", "Mandarin", "Cantonese",
    "Japanese", "Korean", "German", "Italian", "Portuguese",
    "Russian", "Arabic", "Hindi", "Other"
  ];
  for (let i = 0; i < languages.length; i++) {
    await prisma.onboardingDropdownOption.upsert({
      where: { fieldKey_value: { fieldKey: "language", value: languages[i].toLowerCase().replace(/\s+/g, "_") } },
      update: {},
      create: {
        fieldKey: "language",
        value: languages[i].toLowerCase().replace(/\s+/g, "_"),
        label: languages[i],
        order: i,
      },
    });
  }
  console.log("  ✓ Created", languages.length, "language options");

  // Dropdown options - Relationships
  const relationships = [
    { value: "spouse", label: "Spouse/Partner" },
    { value: "parent", label: "Parent" },
    { value: "sibling", label: "Sibling" },
    { value: "child", label: "Child" },
    { value: "friend", label: "Friend" },
    { value: "other", label: "Other" },
  ];
  for (let i = 0; i < relationships.length; i++) {
    await prisma.onboardingDropdownOption.upsert({
      where: { fieldKey_value: { fieldKey: "relationship", value: relationships[i].value } },
      update: {},
      create: {
        fieldKey: "relationship",
        value: relationships[i].value,
        label: relationships[i].label,
        order: i,
      },
    });
  }
  console.log("  ✓ Created", relationships.length, "relationship options");

  // Dropdown options - Business Types
  const businessTypes = [
    { value: "individual", label: "Individual/Sole Proprietor" },
    { value: "llc_single", label: "Single-member LLC" },
    { value: "llc_c", label: "LLC (C Corporation)" },
    { value: "llc_s", label: "LLC (S Corporation)" },
    { value: "llc_partnership", label: "LLC (Partnership)" },
    { value: "c_corp", label: "C Corporation" },
    { value: "s_corp", label: "S Corporation" },
    { value: "partnership", label: "Partnership" },
    { value: "trust", label: "Trust/Estate" },
    { value: "other", label: "Other" },
  ];
  for (let i = 0; i < businessTypes.length; i++) {
    await prisma.onboardingDropdownOption.upsert({
      where: { fieldKey_value: { fieldKey: "business_type", value: businessTypes[i].value } },
      update: {},
      create: {
        fieldKey: "business_type",
        value: businessTypes[i].value,
        label: businessTypes[i].label,
        order: i,
      },
    });
  }
  console.log("  ✓ Created", businessTypes.length, "business type options");

  // Orientation agenda items
  const agendaItems = [
    { title: "Meet & Greet with the Admin Team", description: "Introduce yourself and meet the team", order: 1 },
    { title: "Quiz Show to test your knowledge", description: "Fun interactive quiz about what you learned", order: 2 },
    { title: "Q&A Time for your questions", description: "Get answers to any questions you have", order: 3 },
    { title: "Certification & Next Steps overview", description: "Learn about the certification process and what comes next", order: 4 },
  ];
  for (const item of agendaItems) {
    await prisma.onboardingOrientationAgenda.upsert({
      where: { id: `agenda_${item.order}` },
      update: item,
      create: { id: `agenda_${item.order}`, ...item },
    });
  }
  console.log("  ✓ Created", agendaItems.length, "orientation agenda items");

  // ===== POINTS RULES =====
  console.log("\nCreating points rules...");

  const pointsRules = [
    // TEACHING category
    { name: "Lesson Taught", description: "Points for each lesson taught", category: "TEACHING" as const, trigger: "lesson_taught", points: 5, isActive: true },
    { name: "Monthly Lessons 40+", description: "Bonus for teaching 40+ lessons in a month", category: "TEACHING" as const, trigger: "monthly_lessons_40", points: 100, threshold: 40, isActive: true },
    { name: "Monthly Lessons 60+", description: "Bonus for teaching 60+ lessons in a month", category: "TEACHING" as const, trigger: "monthly_lessons_60", points: 200, threshold: 60, isActive: true },
    { name: "Monthly Lessons 80+", description: "Bonus for teaching 80+ lessons in a month", category: "TEACHING" as const, trigger: "monthly_lessons_80", points: 400, threshold: 80, isActive: true },
    // QUALITY category
    { name: "5-Star Review", description: "Points for each 5-star review received", category: "QUALITY" as const, trigger: "five_star_review", points: 10, isActive: true },
    { name: "Trial Conversion", description: "Points for converting a trial to paid client", category: "QUALITY" as const, trigger: "trial_conversion", points: 50, isActive: true },
    { name: "Client Retention", description: "Points for retaining a client for 6+ months", category: "QUALITY" as const, trigger: "client_retention", points: 25, isActive: true },
    // LEARNING category
    { name: "Course Module Complete", description: "Points for completing a training module", category: "LEARNING" as const, trigger: "module_complete", points: 10, isActive: true },
    { name: "Course Complete", description: "Points for completing an entire course", category: "LEARNING" as const, trigger: "course_complete", points: 50, isActive: true },
    { name: "Quiz Passed", description: "Points for passing a quiz with 80%+", category: "LEARNING" as const, trigger: "quiz_passed", points: 20, isActive: true },
    { name: "Certification Earned", description: "Points for earning a new certification", category: "LEARNING" as const, trigger: "certification_earned", points: 100, isActive: true },
    // ENGAGEMENT category
    { name: "Live Session Attended", description: "Points for attending a live training session", category: "ENGAGEMENT" as const, trigger: "live_session_attended", points: 30, isActive: true },
    { name: "7-Day Login Streak", description: "Points for maintaining a 7-day login streak", category: "ENGAGEMENT" as const, trigger: "login_streak_7", points: 35, threshold: 7, isActive: true },
    { name: "30-Day Login Streak", description: "Points for maintaining a 30-day login streak", category: "ENGAGEMENT" as const, trigger: "login_streak_30", points: 150, threshold: 30, isActive: true },
    // BUSINESS category
    { name: "Tutor Referral", description: "Points for referring a new tutor who gets hired", category: "BUSINESS" as const, trigger: "tutor_referral", points: 100, isActive: true },
    { name: "Client Referral", description: "Points for referring a new client", category: "BUSINESS" as const, trigger: "client_referral", points: 50, isActive: true },
  ];

  for (const rule of pointsRules) {
    await prisma.pointsRule.upsert({
      where: { trigger: rule.trigger },
      update: rule,
      create: rule,
    });
  }
  console.log("  ✓ Created", pointsRules.length, "points rules");

  // ===== TRAINING COURSES =====
  console.log("\nCreating training courses...");

  // Course 1: Teaching Fundamentals
  const course1 = await prisma.trainingCourse.upsert({
    where: { slug: "teaching-fundamentals" },
    update: {},
    create: {
      title: "Teaching Fundamentals",
      slug: "teaching-fundamentals",
      description: "Master the core principles of effective chess instruction for children. Learn engagement techniques, age-appropriate teaching methods, and classroom management.",
      thumbnailUrl: null,
      duration: 45,
      difficulty: "BEGINNER",
      category: "TEACHING_SKILLS",
      isRequired: true,
      isPublished: true,
      order: 1,
      prerequisites: [],
      publishedAt: new Date(),
    },
  });

  // Modules for Course 1
  const course1Modules = [
    {
      title: "Introduction to Acme Workforce",
      description: "Learn what makes Acme Workforce unique and how our teaching method works.",
      order: 1,
      contentType: "VIDEO" as const,
      videoUrl: "https://vimeo.com/838377574", // Placeholder - uses welcome video
      content: null,
      hasQuiz: false,
    },
    {
      title: "Engaging Young Learners",
      description: "Techniques for capturing and maintaining children's attention during lessons.",
      order: 2,
      contentType: "VIDEO" as const,
      videoUrl: "https://vimeo.com/838377574",
      content: "<h3>Key Engagement Strategies</h3><ul><li>Use character voices for chess pieces</li><li>Incorporate movement and physical activities</li><li>Ask open-ended questions</li><li>Celebrate small victories</li></ul>",
      hasQuiz: false,
    },
    {
      title: "Age-Appropriate Instruction",
      description: "Adapting your teaching style for different age groups from 3-10 years old.",
      order: 3,
      contentType: "MIXED" as const,
      videoUrl: "https://vimeo.com/838377574",
      content: "<h3>Teaching by Age Group</h3><p><strong>Ages 3-4:</strong> Focus on piece recognition and basic movements through story.</p><p><strong>Ages 5-6:</strong> Introduce simple strategies and short games.</p><p><strong>Ages 7-10:</strong> Deeper strategic concepts and full games.</p>",
      hasQuiz: true,
      quizQuestions: [
        {
          id: "q1",
          question: "What should be the primary focus when teaching 3-4 year olds?",
          options: [
            { id: "a", text: "Complex opening strategies" },
            { id: "b", text: "Piece recognition through storytelling" },
            { id: "c", text: "Competitive tournament play" },
            { id: "d", text: "Endgame techniques" },
          ],
          correctAnswer: "b",
        },
        {
          id: "q2",
          question: "Which technique is most effective for maintaining engagement?",
          options: [
            { id: "a", text: "Long lectures about chess history" },
            { id: "b", text: "Silent demonstration" },
            { id: "c", text: "Character voices and storytelling" },
            { id: "d", text: "Written assignments" },
          ],
          correctAnswer: "c",
        },
      ],
      passingScore: 80,
    },
  ];

  for (const mod of course1Modules) {
    await prisma.trainingModule.upsert({
      where: { id: `mod-c1-${mod.order}` },
      update: mod,
      create: {
        id: `mod-c1-${mod.order}`,
        courseId: course1.id,
        ...mod,
      },
    });
  }
  console.log("  ✓ Created course: Teaching Fundamentals (3 modules)");

  // Course 2: Chess Mastery for Tutors
  const course2 = await prisma.trainingCourse.upsert({
    where: { slug: "chess-mastery" },
    update: {},
    create: {
      title: "Chess Mastery for Tutors",
      slug: "chess-mastery",
      description: "Deepen your own chess knowledge to become a more effective instructor. Covers openings, tactics, and how to explain complex concepts simply.",
      thumbnailUrl: null,
      duration: 90,
      difficulty: "INTERMEDIATE",
      category: "CHESS_SKILLS",
      isRequired: false,
      isPublished: true,
      order: 2,
      prerequisites: ["teaching-fundamentals"],
      publishedAt: new Date(),
    },
  });

  // Modules for Course 2
  const course2Modules = [
    {
      title: "Opening Principles",
      description: "Learn the fundamental opening principles and how to teach them to students.",
      order: 1,
      contentType: "VIDEO" as const,
      videoUrl: "https://vimeo.com/838377574",
      content: "<h3>The Three Golden Rules</h3><ol><li>Control the center</li><li>Develop your pieces</li><li>Castle early for king safety</li></ol>",
      hasQuiz: false,
    },
    {
      title: "Basic Tactics",
      description: "Forks, pins, skewers, and discovered attacks explained simply.",
      order: 2,
      contentType: "MIXED" as const,
      videoUrl: "https://vimeo.com/838377574",
      content: "<h3>Tactical Patterns</h3><p><strong>Fork:</strong> One piece attacks two or more enemy pieces.</p><p><strong>Pin:</strong> A piece cannot move because it would expose a more valuable piece behind it.</p><p><strong>Skewer:</strong> Like a pin, but the more valuable piece is in front.</p>",
      hasQuiz: true,
      quizQuestions: [
        {
          id: "q1",
          question: "What is a fork in chess?",
          options: [
            { id: "a", text: "When a piece is trapped" },
            { id: "b", text: "One piece attacking two or more pieces simultaneously" },
            { id: "c", text: "Trading pieces of equal value" },
            { id: "d", text: "A defensive maneuver" },
          ],
          correctAnswer: "b",
        },
        {
          id: "q2",
          question: "In a pin, which piece cannot move safely?",
          options: [
            { id: "a", text: "The attacking piece" },
            { id: "b", text: "The piece in front" },
            { id: "c", text: "The piece in the middle" },
            { id: "d", text: "The king" },
          ],
          correctAnswer: "c",
        },
        {
          id: "q3",
          question: "What are the three golden opening principles?",
          options: [
            { id: "a", text: "Attack, defend, trade" },
            { id: "b", text: "Center control, piece development, king safety" },
            { id: "c", text: "Move pawns, move knights, move bishops" },
            { id: "d", text: "Check, checkmate, stalemate" },
          ],
          correctAnswer: "b",
        },
      ],
      passingScore: 80,
    },
    {
      title: "Endgame Essentials",
      description: "Key endgame concepts every tutor should know.",
      order: 3,
      contentType: "VIDEO" as const,
      videoUrl: "https://vimeo.com/838377574",
      content: null,
      hasQuiz: false,
    },
  ];

  for (const mod of course2Modules) {
    await prisma.trainingModule.upsert({
      where: { id: `mod-c2-${mod.order}` },
      update: mod,
      create: {
        id: `mod-c2-${mod.order}`,
        courseId: course2.id,
        ...mod,
      },
    });
  }
  console.log("  ✓ Created course: Chess Mastery for Tutors (3 modules)");

  // Course 3: Building Your Tutoring Business
  const course3 = await prisma.trainingCourse.upsert({
    where: { slug: "building-your-business" },
    update: {},
    create: {
      title: "Building Your Tutoring Business",
      slug: "building-your-business",
      description: "Grow your client base and maximize your earning potential as a Acme Workforce tutor.",
      thumbnailUrl: null,
      duration: 60,
      difficulty: "BEGINNER",
      category: "BUSINESS",
      isRequired: false,
      isPublished: true,
      order: 3,
      prerequisites: [],
      publishedAt: new Date(),
    },
  });

  // Modules for Course 3
  const course3Modules = [
    {
      title: "Client Communication",
      description: "Best practices for professional communication with parents and families.",
      order: 1,
      contentType: "ARTICLE" as const,
      videoUrl: null,
      content: "<h2>Professional Communication</h2><h3>Before the Lesson</h3><p>Send a brief confirmation message 24 hours before each lesson. Include:</p><ul><li>Time and location confirmation</li><li>What to have ready (chess set, quiet space)</li><li>Any materials needed</li></ul><h3>After the Lesson</h3><p>Send a quick summary within 24 hours:</p><ul><li>What was covered</li><li>Student's progress and wins</li><li>What to practice before next time</li></ul><h3>Response Time</h3><p>Aim to respond to parent messages within 4-6 hours during business hours.</p>",
      hasQuiz: false,
    },
    {
      title: "Getting Referrals",
      description: "Turn happy clients into your best marketing channel.",
      order: 2,
      contentType: "MIXED" as const,
      videoUrl: "https://vimeo.com/838377574",
      content: "<h3>The Referral Conversation</h3><p>After 4-6 successful lessons, when a parent expresses satisfaction:</p><blockquote>\"I'm so glad [child's name] is enjoying chess! If you know any other families who might be interested, I'd love to help them too. I have a few openings in my schedule.\"</blockquote><p><strong>Remember:</strong> You earn bonus points for every referral that converts!</p>",
      hasQuiz: true,
      quizQuestions: [
        {
          id: "q1",
          question: "When is the best time to ask for referrals?",
          options: [
            { id: "a", text: "During the first lesson" },
            { id: "b", text: "After 4-6 successful lessons when parents express satisfaction" },
            { id: "c", text: "Never - referrals should be organic only" },
            { id: "d", text: "Before the lesson starts" },
          ],
          correctAnswer: "b",
        },
        {
          id: "q2",
          question: "How quickly should you respond to parent messages?",
          options: [
            { id: "a", text: "Within 24-48 hours" },
            { id: "b", text: "Within a week" },
            { id: "c", text: "Within 4-6 hours during business hours" },
            { id: "d", text: "Immediately, 24/7" },
          ],
          correctAnswer: "c",
        },
      ],
      passingScore: 80,
    },
  ];

  for (const mod of course3Modules) {
    await prisma.trainingModule.upsert({
      where: { id: `mod-c3-${mod.order}` },
      update: mod,
      create: {
        id: `mod-c3-${mod.order}`,
        courseId: course3.id,
        ...mod,
      },
    });
  }
  console.log("  ✓ Created course: Building Your Tutoring Business (2 modules)");

  // ===== SUMMARY =====
  console.log("\n" + "=".repeat(50));
  console.log("✅ Seed completed successfully!");
  console.log("=".repeat(50));

  console.log("\n📋 Created Organizations:");
  console.log("  • HQ (hq.workforceportal.com or localhost:3000)");
  console.log("  • Westside (westside.workforceportal.com)");
  console.log("  • Eastside (eastside.workforceportal.com)");

  console.log("\n👤 Test Users (all use password: admin123):");
  console.log("  Super Admin:      admin@workforceportal.com");
  console.log("  Admin:            editor@workforceportal.com");
  console.log("  Westside Owner:  owner@westside.workforceportal.com");
  console.log("  Westside Lead:   lead@westside.workforceportal.com");
  console.log("  Westside Tutor:  tutor@westside.workforceportal.com");
  console.log("  Eastside Owner:    owner@eastside.workforceportal.com");
  console.log("  Onboarding:       onboarding@workforceportal.com");

  console.log("\n👨‍🏫 Tutor Profiles:");
  console.log("  Westside Lead Tutor - Active, 250 lessons, 4.9 rating");
  console.log("  Westside Tutor - Active, 45 lessons, 4.7 rating");

  console.log("\n📋 Tutor Data:");
  console.log("  • 2 tutor profiles with full data");
  console.log("  • 9 certifications (6 lead + 3 regular)");
  console.log("  • 3 labels");
  console.log("  • 3 notes");

  // ===== CHESS LESSONS, POINTS & BADGES =====
  console.log("\n♟️ Seeding chess content...");
  await seedChessLessons(prisma as any);
  await seedChessPoints(prisma as any);
  await seedChessBadges(prisma as any);
  console.log("  ✓ Chess lessons, points rules, and badges seeded");

  // ===== DEMO USER DATA =====
  await seedDemoData(prisma as any);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
