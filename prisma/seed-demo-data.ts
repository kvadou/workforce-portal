/**
 * Seed comprehensive demo data for the "Demo User" auto-login account.
 *
 * The demo user authenticates via hardcoded credentials in auth.ts with id "demo-user".
 * This script creates the matching DB record and populates every visible section
 * of the portal with realistic fake data so the demo feels fully fleshed out.
 *
 * Run standalone:  npx tsx prisma/seed-demo-data.ts
 * Or import from seed.ts:  await seedDemoData(prisma);
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config(); // fallback to .env if .env.local doesn't exist
import { PrismaClient, UserRole, TutorStatus, TutorTeam, TutorCertType, TutorCertStatus, TutorNoteType, PointsCategory } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

// When run standalone, create our own prisma client
let standalone = false;
let _prisma: PrismaClient;

function getPrisma(): PrismaClient {
  if (!_prisma) {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    _prisma = new PrismaClient({ adapter });
    standalone = true;
  }
  return _prisma;
}

// ── Helper: date offsets ──
const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000);
const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000);

export async function seedDemoData(prisma: PrismaClient) {
  console.log("\n🎭 Seeding demo user data...\n");

  const hashedPassword = await bcrypt.hash("demo", 12);

  // ── 1. Organization (reuse HQ if it exists, otherwise create) ──
  const hqOrg = await prisma.organization.upsert({
    where: { subdomain: "hq" },
    update: {},
    create: {
      name: "Acme Workforce HQ",
      subdomain: "hq",
      isHQ: true,
      isActive: true,
      primaryColor: "#4F46E5",
      settings: { timezone: "America/New_York", defaultCurrency: "USD" },
    },
  });

  // ── 2. Demo User ──
  const demoUser = await prisma.user.upsert({
    where: { id: "demo-user" },
    update: {
      name: "Jordan Rivera",
      role: UserRole.LEAD_TUTOR,
      organizationId: hqOrg.id,
      phone: "(555) 867-5309",
      bio: "Passionate educator with 8 years of experience in youth development and chess instruction. I believe every child can learn critical thinking through play. Former elementary school teacher turned full-time chess tutor. I specialize in making complex concepts accessible through storytelling and gamification. Outside of teaching, I coach a local youth chess team and volunteer at community centers.",
      avatarUrl: "https://ui-avatars.com/api/?name=Jordan+Rivera&size=256&background=4F46E5&color=fff",
      headshotUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      hireDate: daysAgo(540),
      dateOfBirth: new Date("1992-03-15"),
      emergencyContactName: "Alex Rivera",
      emergencyContactPhone: "(555) 234-5678",
      emergencyContactRelation: "Spouse",
      languages: ["English", "Spanish", "Portuguese"],
      teachingStylePreferences: "I use a blend of storytelling, Socratic questioning, and hands-on puzzles. I adapt my pace to each student — some need repetition, others thrive on challenge. I always start with a fun warm-up game to build rapport before diving into new material.",
      availabilityNotes: "Available Monday–Friday 9am–6pm, Saturday mornings. Prefer afternoon slots for private lessons. Can do online or in-person within 20 miles of downtown.",
      yearsExperience: 8,
      previousExperience: "5 years as 3rd grade teacher at Riverside Elementary. 2 years as after-school chess club coordinator at Lincoln Middle School. USCF tournament director certified. Completed Chessable advanced tactics course. Led workshop at National Chess in Education conference 2024.",
    },
    create: {
      id: "demo-user",
      email: "demo@acmeworkforce.com",
      passwordHash: hashedPassword,
      name: "Jordan Rivera",
      role: UserRole.LEAD_TUTOR,
      organizationId: hqOrg.id,
      phone: "(555) 867-5309",
      bio: "Passionate educator with 8 years of experience in youth development and chess instruction. I believe every child can learn critical thinking through play. Former elementary school teacher turned full-time chess tutor. I specialize in making complex concepts accessible through storytelling and gamification. Outside of teaching, I coach a local youth chess team and volunteer at community centers.",
      avatarUrl: "https://ui-avatars.com/api/?name=Jordan+Rivera&size=256&background=4F46E5&color=fff",
      headshotUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      hireDate: daysAgo(540),
      dateOfBirth: new Date("1992-03-15"),
      emergencyContactName: "Alex Rivera",
      emergencyContactPhone: "(555) 234-5678",
      emergencyContactRelation: "Spouse",
      languages: ["English", "Spanish", "Portuguese"],
      teachingStylePreferences: "I use a blend of storytelling, Socratic questioning, and hands-on puzzles. I adapt my pace to each student — some need repetition, others thrive on challenge. I always start with a fun warm-up game to build rapport before diving into new material.",
      availabilityNotes: "Available Monday–Friday 9am–6pm, Saturday mornings. Prefer afternoon slots for private lessons. Can do online or in-person within 20 miles of downtown.",
      yearsExperience: 8,
      previousExperience: "5 years as 3rd grade teacher at Riverside Elementary. 2 years as after-school chess club coordinator at Lincoln Middle School. USCF tournament director certified. Completed Chessable advanced tactics course. Led workshop at National Chess in Education conference 2024.",
    },
  });
  console.log("  ✓ Demo user:", demoUser.name);

  // ── 3. Create additional fake users for social features ──
  const fakeUsers = [
    { id: "fake-user-1", name: "Marcus Chen", email: "marcus.chen@acmeworkforce.com", role: UserRole.TUTOR },
    { id: "fake-user-2", name: "Sarah Mitchell", email: "sarah.mitchell@acmeworkforce.com", role: UserRole.TUTOR },
    { id: "fake-user-3", name: "Priya Patel", email: "priya.patel@acmeworkforce.com", role: UserRole.LEAD_TUTOR },
    { id: "fake-user-4", name: "David Okonkwo", email: "david.okonkwo@acmeworkforce.com", role: UserRole.TUTOR },
    { id: "fake-user-5", name: "Emily Nakamura", email: "emily.nakamura@acmeworkforce.com", role: UserRole.TUTOR },
    { id: "fake-user-6", name: "James Wright", email: "james.wright@acmeworkforce.com", role: UserRole.FRANCHISEE_OWNER },
    { id: "fake-user-7", name: "Ana Gutierrez", email: "ana.gutierrez@acmeworkforce.com", role: UserRole.TUTOR },
    { id: "fake-user-8", name: "Tyler Brooks", email: "tyler.brooks@acmeworkforce.com", role: UserRole.ONBOARDING_TUTOR },
    { id: "fake-user-9", name: "Rachel Kim", email: "rachel.kim@acmeworkforce.com", role: UserRole.TUTOR },
    { id: "fake-user-10", name: "Omar Hassan", email: "omar.hassan@acmeworkforce.com", role: UserRole.TUTOR },
    { id: "fake-user-11", name: "Lily Tran", email: "lily.tran@acmeworkforce.com", role: UserRole.TUTOR },
    { id: "fake-user-12", name: "Noah Bernstein", email: "noah.bernstein@acmeworkforce.com", role: UserRole.ADMIN },
  ];

  for (const u of fakeUsers) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        ...u,
        passwordHash: hashedPassword,
        organizationId: hqOrg.id,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&size=256&background=6366F1&color=fff`,
        hireDate: daysAgo(Math.floor(Math.random() * 700) + 30),
        bio: `Experienced educator and team member at Acme Workforce.`,
        yearsExperience: Math.floor(Math.random() * 10) + 1,
        languages: ["English"],
      },
    });
  }
  console.log("  ✓ Created 12 additional fake users");

  // ── 4. TutorProfile for demo user ──
  const tutorProfile = await prisma.tutorProfile.upsert({
    where: { userId: "demo-user" },
    update: {
      status: TutorStatus.ACTIVE,
      team: TutorTeam.NYC,
      isSchoolCertified: true,
      isBqCertified: true,
      isPlaygroupCertified: false,
      baseHourlyRate: 45.00,
      chessLevel: "Advanced",
      chessRating: 1650,
      noctieRating: 2100,
      chessableProgress: 92,
      totalLessons: 347,
      totalHours: 520.5,
      averageRating: 4.92,
      lastLessonDate: daysAgo(1),
      fiveStarCount: 285,
      trialConversions: 42,
      activatedAt: daysAgo(530),
      pronouns: "they/them",
    },
    create: {
      userId: "demo-user",
      status: TutorStatus.ACTIVE,
      team: TutorTeam.NYC,
      tutorCruncherId: 88001,
      branchId: "br_demo_001",
      chessableUsername: "jordan_chess92",
      pronouns: "they/them",
      hireDate: daysAgo(540),
      activatedAt: daysAgo(530),
      isSchoolCertified: true,
      isBqCertified: true,
      isPlaygroupCertified: false,
      baseHourlyRate: 45.00,
      chessLevel: "Advanced",
      chessRating: 1650,
      noctieRating: 2100,
      chessableProgress: 92,
      totalLessons: 347,
      totalHours: 520.5,
      averageRating: 4.92,
      lastLessonDate: daysAgo(1),
      fiveStarCount: 285,
      trialConversions: 42,
    },
  });
  console.log("  ✓ Tutor profile created");

  // ── 5. Tutor Certifications ──
  const certifications: { type: TutorCertType; status: TutorCertStatus; earnedAt: Date }[] = [
    { type: TutorCertType.SCHOOL_CERTIFIED, status: TutorCertStatus.COMPLETED, earnedAt: daysAgo(500) },
    { type: TutorCertType.BQ_CERTIFIED, status: TutorCertStatus.COMPLETED, earnedAt: daysAgo(420) },
    { type: TutorCertType.CHESSABLE_COMPLETED, status: TutorCertStatus.COMPLETED, earnedAt: daysAgo(300) },
    { type: TutorCertType.BACKGROUND_CHECK, status: TutorCertStatus.COMPLETED, earnedAt: daysAgo(535) },
    { type: TutorCertType.ADVANCED_CHESS, status: TutorCertStatus.COMPLETED, earnedAt: daysAgo(180) },
    { type: TutorCertType.LEAD_TUTOR, status: TutorCertStatus.COMPLETED, earnedAt: daysAgo(250) },
    { type: TutorCertType.PLAYGROUP_CERTIFIED, status: TutorCertStatus.IN_PROGRESS, earnedAt: daysAgo(30) },
  ];

  for (const cert of certifications) {
    await prisma.tutorCertification.upsert({
      where: { tutorProfileId_type: { tutorProfileId: tutorProfile.id, type: cert.type } },
      update: {},
      create: {
        tutorProfileId: tutorProfile.id,
        type: cert.type,
        status: cert.status,
        earnedAt: cert.status === TutorCertStatus.COMPLETED ? cert.earnedAt : undefined,
        verifiedBy: "fake-user-12",
        verifiedAt: cert.status === TutorCertStatus.COMPLETED ? cert.earnedAt : undefined,
      },
    });
  }
  console.log("  ✓ 7 certifications created");

  // ── 6. Tutor Labels ──
  const labels = [
    { name: "Top Performer", color: "#10B981" },
    { name: "Mentor", color: "#6366F1" },
    { name: "School Specialist", color: "#F59E0B" },
    { name: "Trial Conversion Expert", color: "#EC4899" },
  ];

  for (const label of labels) {
    await prisma.tutorLabel.upsert({
      where: { tutorProfileId_name: { tutorProfileId: tutorProfile.id, name: label.name } },
      update: {},
      create: { tutorProfileId: tutorProfile.id, ...label, createdBy: "fake-user-12" },
    });
  }
  console.log("  ✓ 4 labels created");

  // ── 7. Tutor Notes ──
  const notes: { content: string; type: TutorNoteType; isInternal: boolean }[] = [
    { content: "Exceptional performance this quarter. Jordan consistently exceeds expectations with a 4.92 average rating and 42 trial conversions. Recommend for lead tutor promotion.", type: TutorNoteType.PERFORMANCE, isInternal: true },
    { content: "Parents of the Martinez family called to thank Jordan specifically for helping their son overcome his fear of competition. The child is now participating in local tournaments.", type: TutorNoteType.FEEDBACK, isInternal: false },
    { content: "Jordan volunteered to mentor 3 new tutors in the January 2026 cohort. All three have been successfully activated and are performing above average.", type: TutorNoteType.GENERAL, isInternal: true },
    { content: "Completed advanced chess certification with perfect score. Demonstrates deep understanding of both pedagogical methods and chess theory.", type: TutorNoteType.PERFORMANCE, isInternal: true },
    { content: "Led the Q2 tutor workshop on 'Making Chess Fun for Ages 4-6'. Received highest feedback scores of any workshop this year.", type: TutorNoteType.GENERAL, isInternal: false },
    { content: "Annual review completed. Promoted to Lead Tutor effective immediately. Salary adjusted to $45/hr.", type: TutorNoteType.ADMIN, isInternal: true },
  ];

  // Delete existing notes for demo tutor to avoid duplicates
  await prisma.tutorNote.deleteMany({ where: { tutorProfileId: tutorProfile.id } });
  for (let i = 0; i < notes.length; i++) {
    await prisma.tutorNote.create({
      data: {
        tutorProfileId: tutorProfile.id,
        ...notes[i],
        createdBy: "fake-user-12",
        createdByName: "Noah Bernstein",
        createdAt: daysAgo((notes.length - i) * 45),
      },
    });
  }
  console.log("  ✓ 6 tutor notes created");

  // ── 8. Points System ──
  const tutorPoints = await prisma.tutorPoints.upsert({
    where: { tutorProfileId: tutorProfile.id },
    update: {
      totalPoints: 4850,
      monthlyPoints: 620,
      weeklyPoints: 145,
      coursePoints: 800,
      lessonPoints: 2100,
      streakPoints: 450,
      achievementPoints: 600,
      qualityPoints: 550,
      engagementPoints: 350,
    },
    create: {
      tutorProfileId: tutorProfile.id,
      totalPoints: 4850,
      monthlyPoints: 620,
      weeklyPoints: 145,
      coursePoints: 800,
      lessonPoints: 2100,
      streakPoints: 450,
      achievementPoints: 600,
      qualityPoints: 550,
      engagementPoints: 350,
    },
  });
  console.log("  ✓ Points system initialized");

  // ── Points History ──
  await prisma.pointsHistory.deleteMany({ where: { tutorProfileId: tutorProfile.id } });
  const pointsEntries: { points: number; reason: string; category: PointsCategory; createdAt: Date }[] = [
    { points: 50, reason: "Completed Advanced Chess Tactics course", category: PointsCategory.LEARNING, createdAt: daysAgo(1) },
    { points: 25, reason: "5-star review from client (Thompson family)", category: PointsCategory.QUALITY, createdAt: daysAgo(2) },
    { points: 100, reason: "Monthly lessons milestone: 40+ lessons in March", category: PointsCategory.TEACHING, createdAt: daysAgo(5) },
    { points: 75, reason: "Trial conversion: Garcia family (trial → 10-pack)", category: PointsCategory.BUSINESS, createdAt: daysAgo(7) },
    { points: 30, reason: "7-day login streak achieved", category: PointsCategory.ENGAGEMENT, createdAt: daysAgo(8) },
    { points: 25, reason: "5-star review from client (Park family)", category: PointsCategory.QUALITY, createdAt: daysAgo(10) },
    { points: 50, reason: "Completed School Teaching Best Practices module", category: PointsCategory.LEARNING, createdAt: daysAgo(12) },
    { points: 200, reason: "300th lesson taught milestone!", category: PointsCategory.TEACHING, createdAt: daysAgo(15) },
    { points: 75, reason: "Trial conversion: Nakamura family (trial → monthly)", category: PointsCategory.BUSINESS, createdAt: daysAgo(18) },
    { points: 50, reason: "Attended live Q&A session: Teaching Tips", category: PointsCategory.ENGAGEMENT, createdAt: daysAgo(20) },
    { points: 25, reason: "5-star review from client (Williams family)", category: PointsCategory.QUALITY, createdAt: daysAgo(22) },
    { points: 100, reason: "Monthly lessons milestone: 40+ lessons in February", category: PointsCategory.TEACHING, createdAt: daysAgo(35) },
    { points: 150, reason: "Completed Lead Tutor Certification course", category: PointsCategory.LEARNING, createdAt: daysAgo(40) },
    { points: 30, reason: "14-day login streak achieved", category: PointsCategory.ENGAGEMENT, createdAt: daysAgo(45) },
    { points: 75, reason: "Trial conversion: Johnson family (trial → 20-pack)", category: PointsCategory.BUSINESS, createdAt: daysAgo(50) },
  ];

  for (const entry of pointsEntries) {
    await prisma.pointsHistory.create({
      data: { tutorProfileId: tutorProfile.id, ...entry },
    });
  }
  console.log("  ✓ 15 points history entries created");

  // ── 9. Streaks ──
  await prisma.tutorStreak.deleteMany({ where: { tutorProfileId: tutorProfile.id } });
  await prisma.tutorStreak.createMany({
    data: [
      { tutorProfileId: tutorProfile.id, type: "LOGIN", currentStreak: 12, longestStreak: 34, lastActivityDate: daysAgo(0) },
      { tutorProfileId: tutorProfile.id, type: "LESSONS_WEEKLY", currentStreak: 8, longestStreak: 22, lastActivityDate: daysAgo(1) },
      { tutorProfileId: tutorProfile.id, type: "PUZZLES_DAILY", currentStreak: 5, longestStreak: 18, lastActivityDate: daysAgo(0) },
    ],
  });
  console.log("  ✓ 3 streaks created");

  // ── 10. Milestones ──
  await prisma.tutorMilestone.deleteMany({ where: { tutorProfileId: tutorProfile.id } });
  await prisma.tutorMilestone.createMany({
    data: [
      { tutorProfileId: tutorProfile.id, type: "TOTAL_LESSONS", value: 10, achievedAt: daysAgo(510) },
      { tutorProfileId: tutorProfile.id, type: "TOTAL_LESSONS", value: 50, achievedAt: daysAgo(420) },
      { tutorProfileId: tutorProfile.id, type: "TOTAL_LESSONS", value: 100, achievedAt: daysAgo(330) },
      { tutorProfileId: tutorProfile.id, type: "TOTAL_LESSONS", value: 250, achievedAt: daysAgo(120) },
      { tutorProfileId: tutorProfile.id, type: "FIVE_STAR_RATINGS", value: 10, achievedAt: daysAgo(480) },
      { tutorProfileId: tutorProfile.id, type: "FIVE_STAR_RATINGS", value: 50, achievedAt: daysAgo(350) },
      { tutorProfileId: tutorProfile.id, type: "FIVE_STAR_RATINGS", value: 100, achievedAt: daysAgo(220) },
      { tutorProfileId: tutorProfile.id, type: "FIVE_STAR_RATINGS", value: 250, achievedAt: daysAgo(60) },
      { tutorProfileId: tutorProfile.id, type: "TRIAL_CONVERSIONS", value: 10, achievedAt: daysAgo(300) },
      { tutorProfileId: tutorProfile.id, type: "TRIAL_CONVERSIONS", value: 25, achievedAt: daysAgo(150) },
      { tutorProfileId: tutorProfile.id, type: "TRAINING_COMPLETED", value: 5, achievedAt: daysAgo(200) },
      { tutorProfileId: tutorProfile.id, type: "PUZZLES_SOLVED", value: 10, achievedAt: daysAgo(400) },
      { tutorProfileId: tutorProfile.id, type: "PUZZLES_SOLVED", value: 50, achievedAt: daysAgo(250) },
      { tutorProfileId: tutorProfile.id, type: "PUZZLES_SOLVED", value: 100, achievedAt: daysAgo(100) },
    ],
  });
  console.log("  ✓ 14 milestones created");

  // ── 11. Classes with Students ──
  await prisma.class.deleteMany({ where: { instructorId: "demo-user" } });

  // Get first lesson for currentLessonId (if curriculum was seeded)
  const firstLesson = await prisma.lesson.findFirst({ where: { status: "PUBLISHED" }, orderBy: { order: "asc" } });

  const classData = [
    { name: "Westfield Elementary - After School", description: "Tuesday/Thursday 3:30–4:30pm after-school chess club at Westfield Elementary. Mixed ages K-3rd grade. Focus on fundamentals and sportsmanship.", color: "#4F46E5", students: ["Emma W.", "Liam C.", "Sophia K.", "Noah P.", "Olivia M.", "Jackson T.", "Ava R.", "Lucas D."] },
    { name: "Saturday Knights (Intermediate)", description: "Saturday 10am–11:30am intermediate group. Students have completed Level 1 curriculum and are working on tactics and openings.", color: "#059669", students: ["Ethan Z.", "Mia S.", "Aiden L.", "Isabella F.", "Mason H.", "Charlotte B."] },
    { name: "Private Lessons - Park Family", description: "Monday/Wednesday 4pm–5pm. Two siblings: Maya (age 8, Level 2) and Leo (age 6, Level 1). Parents want tournament preparation for Maya.", color: "#DC2626", students: ["Maya P.", "Leo P."] },
    { name: "Lincoln Middle School Chess Club", description: "Wednesday 2:45–3:45pm. School chess club for 6th-8th graders. Competitive focus — several students participate in USCF tournaments.", color: "#7C3AED", students: ["Daniel O.", "Grace L.", "Ryan M.", "Zoe T.", "Caleb N.", "Hannah W.", "Luke J.", "Natalie V.", "Christian A.", "Ashley R."] },
    { name: "Sunday Fun Chess (Beginners)", description: "Sunday 11am–12pm. Beginner class for ages 4-6. Story-based introduction to chess pieces. Heavy emphasis on fun and engagement.", color: "#F59E0B", students: ["Jayden K.", "Ella M.", "Carter B.", "Aria S.", "Dylan R."] },
    { name: "Private Lessons - Garcia Family", description: "Thursday 5pm–6pm. Carlos (age 10) — advanced student preparing for state championship. Working on endgame theory and clock management.", color: "#EC4899", students: ["Carlos G."] },
  ];

  for (const cls of classData) {
    const created = await prisma.class.create({
      data: {
        instructorId: "demo-user",
        name: cls.name,
        description: cls.description,
        color: cls.color,
        currentLessonId: firstLesson?.id ?? null,
        isActive: true,
      },
    });

    // Add students
    for (const studentName of cls.students) {
      const parts = studentName.split(" ");
      await prisma.student.create({
        data: {
          classId: created.id,
          firstName: parts[0],
          lastName: parts[1] || null,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&size=128&background=10B981&color=fff`,
        },
      });
    }
  }
  console.log("  ✓ 6 classes with 37 students created");

  // ── 12. Certifications (User-level, separate from TutorCertification) ──
  await prisma.certification.deleteMany({ where: { userId: "demo-user" } });
  await prisma.certification.createMany({
    data: [
      { userId: "demo-user", type: "BASIC_TRAINING", earnedAt: daysAgo(530), metadata: { score: 95 } },
      { userId: "demo-user", type: "ADVANCED_TRAINING", earnedAt: daysAgo(400), metadata: { score: 98 } },
      { userId: "demo-user", type: "CHESS_CERTIFICATION", earnedAt: daysAgo(300), metadata: { level: "Advanced", rating: 1650 } },
      { userId: "demo-user", type: "BQ_CERTIFICATION", earnedAt: daysAgo(420), metadata: { score: 92 } },
      { userId: "demo-user", type: "LEAD_TUTOR_TRAINING", earnedAt: daysAgo(250), metadata: { score: 97 } },
    ],
  });
  console.log("  ✓ 5 user certifications created");

  // ── 13. Training Courses + Enrollments ──
  const courses = [
    {
      id: "demo-course-1", title: "Foundations of Chess Education", slug: "foundations-chess-education",
      description: "Master the fundamentals of teaching chess to children ages 4-12. Covers learning theory, age-appropriate instruction techniques, classroom management, and curriculum pacing. This course is the cornerstone of our teaching methodology.",
      category: "ONBOARDING" as const, difficulty: "BEGINNER" as const, isRequired: true, duration: 180,
      modules: [
        { title: "Welcome & Philosophy", contentType: "VIDEO" as const, videoUrl: "https://vimeo.com/example1" },
        { title: "Understanding Child Development", contentType: "ARTICLE" as const, content: "Children between ages 4-12 go through several cognitive development stages that affect how they learn chess..." },
        { title: "The Story-Based Teaching Method", contentType: "VIDEO" as const, videoUrl: "https://vimeo.com/example2" },
        { title: "Classroom Setup & Management", contentType: "MIXED" as const, content: "Creating the right environment is crucial for effective chess instruction..." },
        { title: "Assessment: Teaching Foundations", contentType: "QUIZ" as const, hasQuiz: true, passingScore: 80 },
      ],
    },
    {
      id: "demo-course-2", title: "Advanced Chess Tactics for Educators", slug: "advanced-chess-tactics",
      description: "Deepen your chess knowledge to better serve intermediate and advanced students. Covers tactical patterns, positional understanding, endgame theory, and how to explain complex concepts in child-friendly ways.",
      category: "CHESS_SKILLS" as const, difficulty: "ADVANCED" as const, isRequired: false, duration: 240,
      modules: [
        { title: "Tactical Pattern Recognition", contentType: "VIDEO" as const, videoUrl: "https://vimeo.com/example3" },
        { title: "Forks, Pins & Skewers Explained", contentType: "MIXED" as const, content: "The three fundamental tactical motifs every chess educator must master..." },
        { title: "Positional Chess Concepts", contentType: "VIDEO" as const, videoUrl: "https://vimeo.com/example4" },
        { title: "Endgame Theory for Teaching", contentType: "ARTICLE" as const, content: "King and pawn endings are the foundation of endgame understanding..." },
        { title: "Teaching Complex Tactics to Kids", contentType: "VIDEO" as const, videoUrl: "https://vimeo.com/example5" },
        { title: "Assessment: Advanced Tactics", contentType: "QUIZ" as const, hasQuiz: true, passingScore: 85 },
      ],
    },
    {
      id: "demo-course-3", title: "School Program Management", slug: "school-program-management",
      description: "Everything you need to know about running chess programs in schools. Covers coordination with administrators, large group management, progress reporting, and adapting curriculum to school schedules.",
      category: "TEACHING_SKILLS" as const, difficulty: "INTERMEDIATE" as const, isRequired: false, duration: 150,
      modules: [
        { title: "Working with School Administrators", contentType: "VIDEO" as const, videoUrl: "https://vimeo.com/example6" },
        { title: "Large Group Instruction Strategies", contentType: "MIXED" as const, content: "Teaching chess to groups of 15-30 students requires different strategies than private lessons..." },
        { title: "Progress Tracking & Reporting", contentType: "ARTICLE" as const, content: "School administrators and parents expect regular progress reports..." },
        { title: "Assessment: School Programs", contentType: "QUIZ" as const, hasQuiz: true, passingScore: 80 },
      ],
    },
    {
      id: "demo-course-4", title: "Business Development for Tutors", slug: "business-development-tutors",
      description: "Grow your tutoring business with proven strategies for client acquisition, retention, and referrals. Learn how to convert trial lessons into long-term clients and build a thriving practice.",
      category: "BUSINESS" as const, difficulty: "INTERMEDIATE" as const, isRequired: false, duration: 120,
      modules: [
        { title: "The Trial Lesson Blueprint", contentType: "VIDEO" as const, videoUrl: "https://vimeo.com/example7" },
        { title: "Client Communication Best Practices", contentType: "ARTICLE" as const, content: "Effective communication with parents is key to client retention..." },
        { title: "Building Your Referral Network", contentType: "MIXED" as const, content: "Word of mouth is the most powerful marketing tool for tutors..." },
        { title: "Pricing & Packaging Your Services", contentType: "VIDEO" as const, videoUrl: "https://vimeo.com/example8" },
        { title: "Assessment: Business Development", contentType: "QUIZ" as const, hasQuiz: true, passingScore: 75 },
      ],
    },
    {
      id: "demo-course-5", title: "Lead Tutor Leadership Program", slug: "lead-tutor-leadership",
      description: "Develop the leadership skills needed to manage and mentor other tutors. Covers team communication, performance coaching, conflict resolution, and building a positive team culture.",
      category: "LEADERSHIP" as const, difficulty: "ADVANCED" as const, isRequired: false, duration: 200,
      modules: [
        { title: "Leadership Fundamentals", contentType: "VIDEO" as const, videoUrl: "https://vimeo.com/example9" },
        { title: "Mentoring New Tutors", contentType: "MIXED" as const, content: "Your role as a mentor is to guide, not dictate. New tutors need..." },
        { title: "Performance Coaching Techniques", contentType: "VIDEO" as const, videoUrl: "https://vimeo.com/example10" },
        { title: "Conflict Resolution", contentType: "ARTICLE" as const, content: "In any team, conflicts will arise. How you handle them defines your leadership..." },
        { title: "Building Team Culture", contentType: "VIDEO" as const, videoUrl: "https://vimeo.com/example11" },
        { title: "Assessment: Leadership", contentType: "QUIZ" as const, hasQuiz: true, passingScore: 85 },
      ],
    },
    {
      id: "demo-course-6", title: "Birthday Party & Special Events", slug: "birthday-party-events",
      description: "Learn to deliver unforgettable chess-themed birthday parties and special events. Covers party planning, age-appropriate activities, crowd management, and creating magical experiences for kids.",
      category: "CERTIFICATION" as const, difficulty: "BEGINNER" as const, isRequired: false, duration: 90,
      modules: [
        { title: "Party Planning Essentials", contentType: "VIDEO" as const, videoUrl: "https://vimeo.com/example12" },
        { title: "Age-Appropriate Activities", contentType: "MIXED" as const, content: "Different age groups need different activities to stay engaged..." },
        { title: "Making Magic Moments", contentType: "VIDEO" as const, videoUrl: "https://vimeo.com/example13" },
        { title: "Assessment: Party Certification", contentType: "QUIZ" as const, hasQuiz: true, passingScore: 80 },
      ],
    },
    {
      id: "demo-course-7", title: "Online Teaching Mastery", slug: "online-teaching-mastery",
      description: "Master the art of teaching chess online. Covers virtual classroom setup, screen sharing techniques, student engagement in digital environments, and troubleshooting common technical issues.",
      category: "TEACHING_SKILLS" as const, difficulty: "INTERMEDIATE" as const, isRequired: false, duration: 130,
      modules: [
        { title: "Virtual Classroom Setup", contentType: "VIDEO" as const, videoUrl: "https://vimeo.com/example14" },
        { title: "Engaging Students Online", contentType: "MIXED" as const, content: "Online teaching requires different engagement strategies than in-person..." },
        { title: "Digital Tools & Resources", contentType: "ARTICLE" as const, content: "Leverage these digital tools to enhance your online teaching..." },
        { title: "Troubleshooting & Tech Support", contentType: "VIDEO" as const, videoUrl: "https://vimeo.com/example15" },
        { title: "Assessment: Online Teaching", contentType: "QUIZ" as const, hasQuiz: true, passingScore: 80 },
      ],
    },
    {
      id: "demo-course-8", title: "Behavior Management & Inclusion", slug: "behavior-management-inclusion",
      description: "Develop strategies for managing challenging behaviors and creating inclusive learning environments. Covers ADHD-friendly teaching, sensory considerations, and working with diverse learners.",
      category: "TEACHING_SKILLS" as const, difficulty: "INTERMEDIATE" as const, isRequired: false, duration: 160,
      modules: [
        { title: "Understanding Challenging Behaviors", contentType: "VIDEO" as const, videoUrl: "https://vimeo.com/example16" },
        { title: "ADHD-Friendly Teaching Strategies", contentType: "MIXED" as const, content: "Many of our students have ADHD or attention challenges..." },
        { title: "Creating Inclusive Environments", contentType: "ARTICLE" as const, content: "Every child deserves to feel welcome and capable in your classroom..." },
        { title: "De-escalation Techniques", contentType: "VIDEO" as const, videoUrl: "https://vimeo.com/example17" },
        { title: "Assessment: Behavior Management", contentType: "QUIZ" as const, hasQuiz: true, passingScore: 85 },
      ],
    },
  ];

  for (const course of courses) {
    const { modules, ...courseData } = course;
    const created = await prisma.trainingCourse.upsert({
      where: { id: course.id },
      update: {},
      create: {
        ...courseData,
        isPublished: true,
        publishedAt: daysAgo(600),
        order: courses.indexOf(course),
      },
    });

    for (let i = 0; i < modules.length; i++) {
      const mod = modules[i];
      await prisma.trainingModule.upsert({
        where: { id: `${course.id}-mod-${i}` },
        update: {},
        create: {
          id: `${course.id}-mod-${i}`,
          courseId: created.id,
          title: mod.title,
          contentType: mod.contentType,
          videoUrl: mod.videoUrl || null,
          content: mod.content || null,
          hasQuiz: mod.hasQuiz || false,
          passingScore: mod.passingScore || null,
          quizQuestions: mod.hasQuiz ? [
            { id: "q1", question: `Sample question 1 for ${mod.title}`, options: [{ id: "a", text: "Option A" }, { id: "b", text: "Option B" }, { id: "c", text: "Option C" }], correctAnswer: "b" },
            { id: "q2", question: `Sample question 2 for ${mod.title}`, options: [{ id: "a", text: "Option A" }, { id: "b", text: "Option B" }, { id: "c", text: "Option C" }], correctAnswer: "a" },
          ] : null,
          order: i,
        },
      });
    }
  }
  console.log("  ✓ 8 training courses with 40 modules created");

  // ── Enrollments for demo user (varied progress) ──
  const enrollmentData = [
    { courseId: "demo-course-1", status: "COMPLETED" as const, progress: 100, startedAt: daysAgo(520), completedAt: daysAgo(500) },
    { courseId: "demo-course-2", status: "COMPLETED" as const, progress: 100, startedAt: daysAgo(350), completedAt: daysAgo(300) },
    { courseId: "demo-course-3", status: "COMPLETED" as const, progress: 100, startedAt: daysAgo(280), completedAt: daysAgo(250) },
    { courseId: "demo-course-4", status: "COMPLETED" as const, progress: 100, startedAt: daysAgo(200), completedAt: daysAgo(170) },
    { courseId: "demo-course-5", status: "COMPLETED" as const, progress: 100, startedAt: daysAgo(260), completedAt: daysAgo(230) },
    { courseId: "demo-course-6", status: "COMPLETED" as const, progress: 100, startedAt: daysAgo(400), completedAt: daysAgo(380) },
    { courseId: "demo-course-7", status: "IN_PROGRESS" as const, progress: 65, startedAt: daysAgo(14), completedAt: null },
    { courseId: "demo-course-8", status: "NOT_STARTED" as const, progress: 0, startedAt: null, completedAt: null },
  ];

  for (const enr of enrollmentData) {
    await prisma.courseEnrollment.upsert({
      where: { userId_courseId: { userId: "demo-user", courseId: enr.courseId } },
      update: { status: enr.status, progress: enr.progress },
      create: {
        userId: "demo-user",
        courseId: enr.courseId,
        status: enr.status,
        progress: enr.progress,
        startedAt: enr.startedAt,
        completedAt: enr.completedAt,
      },
    });
  }
  console.log("  ✓ 8 course enrollments created (6 completed, 1 in progress, 1 not started)");

  // ── 14. Learning Paths ──
  const learningPaths = [
    {
      id: "lp-new-tutor", title: "New Tutor Essentials", slug: "new-tutor-essentials",
      description: "The required learning path for all new tutors. Complete these courses to get fully certified and ready to teach.",
      targetRole: UserRole.TUTOR, isRequired: true,
      courseIds: ["demo-course-1", "demo-course-6"],
    },
    {
      id: "lp-lead-tutor", title: "Lead Tutor Track", slug: "lead-tutor-track",
      description: "Advanced training for tutors ready to take on leadership responsibilities. Covers mentoring, team management, and advanced teaching.",
      targetRole: UserRole.LEAD_TUTOR, isRequired: false,
      courseIds: ["demo-course-2", "demo-course-5", "demo-course-3"],
    },
    {
      id: "lp-chess-mastery", title: "Chess Mastery Path", slug: "chess-mastery-path",
      description: "Deep dive into chess knowledge for tutors who want to specialize in competitive chess education.",
      targetRole: null, isRequired: false,
      courseIds: ["demo-course-2", "demo-course-7"],
    },
  ];

  for (const lp of learningPaths) {
    const { courseIds, ...lpData } = lp;
    await prisma.learningPath.upsert({
      where: { id: lp.id },
      update: {},
      create: { ...lpData, isPublished: true },
    });

    for (let i = 0; i < courseIds.length; i++) {
      await prisma.learningPathCourse.upsert({
        where: { learningPathId_courseId: { learningPathId: lp.id, courseId: courseIds[i] } },
        update: {},
        create: { learningPathId: lp.id, courseId: courseIds[i], order: i, isRequired: true },
      });
    }
  }
  console.log("  ✓ 3 learning paths created");

  // ── 15. Course Reviews ──
  await prisma.courseReview.deleteMany({ where: { userId: "demo-user" } });
  await prisma.courseReview.createMany({
    data: [
      { courseId: "demo-course-1", userId: "demo-user", rating: 5, title: "Perfect foundation", content: "This course gave me everything I needed to start teaching. The story-based method section was especially transformative — it completely changed how I approach lesson planning.", createdAt: daysAgo(490) },
      { courseId: "demo-course-2", userId: "demo-user", rating: 5, title: "Leveled up my chess teaching", content: "The tactical patterns section was incredibly well-structured. I now have a framework for explaining forks and pins that even 6-year-olds can grasp.", createdAt: daysAgo(290) },
      { courseId: "demo-course-5", userId: "demo-user", rating: 4, title: "Great leadership content", content: "The mentoring section was the highlight. Would love to see more content on handling difficult conversations with underperforming tutors.", createdAt: daysAgo(220) },
    ],
  });
  console.log("  ✓ 3 course reviews created");

  // ── 16. Goals ──
  await prisma.tutorGoal.deleteMany({ where: { userId: "demo-user" } });
  await prisma.tutorGoal.createMany({
    data: [
      { userId: "demo-user", name: "Reach 400 total lessons", category: "TEACHING", targetValue: 400, currentValue: 347, startDate: daysAgo(90), endDate: daysFromNow(30), status: "IN_PROGRESS" },
      { userId: "demo-user", name: "Complete Online Teaching Mastery course", category: "LEARNING", targetValue: 100, currentValue: 65, startDate: daysAgo(14), endDate: daysFromNow(21), status: "IN_PROGRESS" },
      { userId: "demo-user", name: "Earn Playgroup Certification", category: "LEARNING", targetValue: 1, currentValue: 0, startDate: daysAgo(30), endDate: daysFromNow(60), status: "IN_PROGRESS" },
      { userId: "demo-user", name: "50 trial conversions", category: "PERFORMANCE", targetValue: 50, currentValue: 42, startDate: daysAgo(180), endDate: daysFromNow(90), status: "IN_PROGRESS" },
      { userId: "demo-user", name: "Monthly: Teach 40+ lessons in March", category: "TEACHING", targetValue: 40, currentValue: 40, startDate: daysAgo(36), endDate: daysAgo(6), status: "COMPLETED", completedAt: daysAgo(6) },
      { userId: "demo-user", name: "Reach 5000 total points", category: "ENGAGEMENT", targetValue: 5000, currentValue: 4850, startDate: daysAgo(60), endDate: daysFromNow(30), status: "IN_PROGRESS" },
    ],
  });
  console.log("  ✓ 6 goals created");

  // ── 17. Notifications ──
  await prisma.notification.deleteMany({ where: { userId: "demo-user" } });
  await prisma.notification.createMany({
    data: [
      { userId: "demo-user", type: "BADGE_EARNED", title: "New Badge: Trial Conversion Expert", message: "You've earned the Trial Conversion Expert badge for converting 40+ trials!", link: "/profile#badges", isRead: false, createdAt: hoursAgo(2) },
      { userId: "demo-user", type: "POINTS_MILESTONE", title: "Points Milestone: 4,800+", message: "You're just 200 points away from the 5,000 point milestone!", link: "/profile#points", isRead: false, createdAt: hoursAgo(6) },
      { userId: "demo-user", type: "ANNOUNCEMENT", title: "New: Summer Chess Camp Registration Open", message: "Registration for the 2026 Summer Chess Camp is now open. Sign up to lead sessions!", link: "/dashboard", isRead: false, createdAt: hoursAgo(12) },
      { userId: "demo-user", type: "SESSION_REMINDER", title: "Live Q&A Tomorrow at 2pm", message: "Don't miss tomorrow's live Q&A on 'Tournament Preparation for Students'", link: "/training/live-sessions", isRead: true, createdAt: daysAgo(1) },
      { userId: "demo-user", type: "COURSE_COMPLETED", title: "Course Complete: Business Development", message: "Congratulations on completing the Business Development for Tutors course!", link: "/training", isRead: true, createdAt: daysAgo(3) },
      { userId: "demo-user", type: "MILESTONE_REACHED", title: "Milestone: 250 Five-Star Ratings!", message: "You've received 250 five-star ratings from clients. Incredible work!", link: "/profile#milestones", isRead: true, createdAt: daysAgo(5) },
      { userId: "demo-user", type: "LEADERBOARD_CHANGE", title: "Leaderboard: You're now #2!", message: "You've moved up to #2 on the monthly points leaderboard.", link: "/training/leaderboards", isRead: true, createdAt: daysAgo(7) },
      { userId: "demo-user", type: "SYSTEM", title: "Profile Update Reminder", message: "Please review and update your emergency contact information.", link: "/profile", isRead: true, createdAt: daysAgo(14) },
      { userId: "demo-user", type: "CERTIFICATION", title: "Playgroup Certification: In Progress", message: "You've started the Playgroup Certification track. Keep going!", link: "/training", isRead: true, createdAt: daysAgo(30) },
      { userId: "demo-user", type: "BADGE_EARNED", title: "New Badge: Chess Master", message: "You've earned the Chess Master badge for achieving Advanced chess certification!", link: "/profile#badges", isRead: true, createdAt: daysAgo(180) },
      { userId: "demo-user", type: "PUZZLE_MILESTONE", title: "100 Puzzles Solved!", message: "You've solved 100 chess puzzles. Your puzzle rating is now 1,450!", link: "/training/puzzles", isRead: true, createdAt: daysAgo(100) },
      { userId: "demo-user", type: "ANNOUNCEMENT", title: "Welcome to the New Portal!", message: "We've launched the new Acme Workforce portal. Explore all the new features!", link: "/dashboard", isRead: true, createdAt: daysAgo(365) },
    ],
  });
  console.log("  ✓ 12 notifications created");

  // ── 18. Puzzle Stats ──
  await prisma.userPuzzleStats.upsert({
    where: { userId: "demo-user" },
    update: {
      puzzleRating: 1450,
      puzzlesSolved: 142,
      puzzlesFailed: 38,
      currentStreak: 5,
      bestStreak: 18,
      totalTimeMs: 3600000,
      hintsUsed: 12,
      themeProgress: {
        fork: { solved: 35, failed: 8 },
        pin: { solved: 28, failed: 5 },
        skewer: { solved: 15, failed: 4 },
        discoveredAttack: { solved: 12, failed: 6 },
        mateIn1: { solved: 30, failed: 3 },
        mateIn2: { solved: 15, failed: 8 },
        endgame: { solved: 7, failed: 4 },
      },
    },
    create: {
      userId: "demo-user",
      puzzleRating: 1450,
      puzzlesSolved: 142,
      puzzlesFailed: 38,
      currentStreak: 5,
      bestStreak: 18,
      totalTimeMs: 3600000,
      hintsUsed: 12,
      themeProgress: {
        fork: { solved: 35, failed: 8 },
        pin: { solved: 28, failed: 5 },
        skewer: { solved: 15, failed: 4 },
        discoveredAttack: { solved: 12, failed: 6 },
        mateIn1: { solved: 30, failed: 3 },
        mateIn2: { solved: 15, failed: 8 },
        endgame: { solved: 7, failed: 4 },
      },
    },
  });
  console.log("  ✓ Puzzle stats created");

  // ── 19. Forum Categories & Posts ──
  const forumCategories = [
    { id: "forum-cat-1", name: "Teaching Tips & Tricks", slug: "teaching-tips", description: "Share and discover effective teaching strategies", sortOrder: 1 },
    { id: "forum-cat-2", name: "Chess Knowledge", slug: "chess-knowledge", description: "Discuss chess theory, openings, and endgames", sortOrder: 2 },
    { id: "forum-cat-3", name: "Business & Growth", slug: "business-growth", description: "Client acquisition, retention, and business development", sortOrder: 3 },
    { id: "forum-cat-4", name: "General Discussion", slug: "general-discussion", description: "Off-topic chat and community building", sortOrder: 4 },
    { id: "forum-cat-5", name: "New Tutor Questions", slug: "new-tutor-questions", description: "Ask anything — no question is too basic", sortOrder: 5 },
  ];

  for (const cat of forumCategories) {
    await prisma.forumCategory.upsert({
      where: { id: cat.id },
      update: {},
      create: { ...cat, isActive: true },
    });
  }

  // Forum posts by demo user and others
  const forumPosts = [
    {
      id: "forum-post-1", title: "My go-to warm-up for ages 4-6", content: "I've been using a 'Piece Parade' warm-up that works amazingly well with young kids. Each student picks a chess piece, and they have to act out how it moves across the board while we all count their steps. It gets the wiggles out AND reinforces movement patterns. Takes about 5 minutes. What warm-ups do you all use?",
      authorId: "demo-user", categoryId: "forum-cat-1", isPinned: true, viewCount: 234, createdAt: daysAgo(45),
    },
    {
      id: "forum-post-2", title: "Handling a student who keeps wanting to play but won't learn", content: "I have a 7-year-old who loves playing games but completely zones out during the lesson portion. He just wants to play. Any strategies for getting engagement during the teaching part without killing his enthusiasm?",
      authorId: "fake-user-2", categoryId: "forum-cat-1", viewCount: 189, createdAt: daysAgo(30),
    },
    {
      id: "forum-post-3", title: "Best way to explain en passant to kids?", content: "I struggle every time with en passant. The 'sneaky pawn' explanation works for some kids but others get confused. Does anyone have a reliable method?",
      authorId: "fake-user-4", categoryId: "forum-cat-2", viewCount: 156, createdAt: daysAgo(20),
    },
    {
      id: "forum-post-4", title: "Trial lesson conversion: what's working for me", content: "I've been converting about 80% of my trial lessons lately. My secret: I send a personalized follow-up text within 2 hours with one specific thing the child did well, plus a 'next steps' preview. Parents love seeing their kid praised specifically. Also I always end the trial by telling the child 'I can't wait to show you [specific next concept]' so they're begging their parents to come back.",
      authorId: "demo-user", categoryId: "forum-cat-3", viewCount: 312, createdAt: daysAgo(60),
    },
    {
      id: "forum-post-5", title: "Just passed my school certification! Tips inside", content: "After two months of prep, I passed! Here's what helped: focus on the classroom management scenarios, not just chess knowledge. The observers care more about how you handle disruptions than your opening theory. Also practice transitions between activities — timing is everything in a school setting.",
      authorId: "fake-user-1", categoryId: "forum-cat-5", viewCount: 98, createdAt: daysAgo(15),
    },
    {
      id: "forum-post-6", title: "Queen's Gambit mini-lesson for intermediate students", content: "I created a 3-session mini-lesson on the Queen's Gambit that my intermediate students love. Session 1: the story of why the pawn is sacrificed. Session 2: accepted vs declined. Session 3: students play QGD games against each other. Happy to share my lesson plan if anyone wants it.",
      authorId: "demo-user", categoryId: "forum-cat-2", isPinned: false, viewCount: 267, createdAt: daysAgo(25),
    },
    {
      id: "forum-post-7", title: "Favorite chess-themed party game?", content: "I have a birthday party next weekend for a group of 10 eight-year-olds. What are your favorite party games that tie back to chess? I usually do Human Chess but want to try something new.",
      authorId: "fake-user-5", categoryId: "forum-cat-4", viewCount: 73, createdAt: daysAgo(5),
    },
    {
      id: "forum-post-8", title: "How long before I should expect my first client?", content: "I completed onboarding 3 weeks ago and still don't have any private clients. Is this normal? I'm getting some school assignments but I was hoping for private lessons too. Any tips?",
      authorId: "fake-user-8", categoryId: "forum-cat-5", viewCount: 145, createdAt: daysAgo(3),
    },
  ];

  for (const post of forumPosts) {
    await prisma.forumPost.upsert({
      where: { id: post.id },
      update: {},
      create: { ...post, isPinned: post.isPinned || false, isLocked: false },
    });
  }

  // Replies
  const replies = [
    { id: "reply-1", content: "The Piece Parade is genius! I tried it yesterday and my 5-year-old group loved it. The knight one especially — they had to do the L-shaped walk!", postId: "forum-post-1", authorId: "fake-user-1", createdAt: daysAgo(44) },
    { id: "reply-2", content: "We do 'Chess Simon Says' — I call out a piece and a direction, and they have to move that way. If they move wrong, they're out. Kids go crazy for it.", postId: "forum-post-1", authorId: "fake-user-3", createdAt: daysAgo(43) },
    { id: "reply-3", content: "I deal with this a lot. What works for me: I make the lesson part SHORT (5-7 min max) and then let them play with the new concept. The key is the lesson needs to directly connect to the game they're about to play.", postId: "forum-post-2", authorId: "demo-user", createdAt: daysAgo(29) },
    { id: "reply-4", content: "I tell the story of the 'pawn that saw its enemy try to sneak past.' The pawn was so fast, it caught the sneaky pawn mid-step. Then we act it out on the board. Works every time for ages 6+.", postId: "forum-post-3", authorId: "demo-user", createdAt: daysAgo(19) },
    { id: "reply-5", content: "This is SO helpful. The personalized follow-up text is something I'm going to start doing immediately. Do you have a template you use?", postId: "forum-post-4", authorId: "fake-user-7", createdAt: daysAgo(58) },
    { id: "reply-6", content: "Congrats! The classroom management tip is gold. I focused too much on chess content my first attempt and barely passed.", postId: "forum-post-5", authorId: "fake-user-9", createdAt: daysAgo(14) },
    { id: "reply-7", content: "Yes please share the lesson plan! I've been looking for good intermediate content.", postId: "forum-post-6", authorId: "fake-user-10", createdAt: daysAgo(24) },
    { id: "reply-8", content: "I'd love the lesson plan too. Can you post it in the resources section?", postId: "forum-post-6", authorId: "fake-user-5", createdAt: daysAgo(23) },
    { id: "reply-9", content: "3 weeks is totally normal. Most tutors don't get their first private client until 4-6 weeks in. Focus on being amazing at your school assignments — that's how you build your reputation. Referrals will come!", postId: "forum-post-8", authorId: "demo-user", createdAt: daysAgo(2) },
    { id: "reply-10", content: "We do 'Checkmate Freeze Tag' — one kid is the King, others are pieces, and they have to corner the King. It's basically chess tactics as a physical game. Always a hit!", postId: "forum-post-7", authorId: "fake-user-11", createdAt: daysAgo(4) },
  ];

  for (const reply of replies) {
    await prisma.forumReply.upsert({
      where: { id: reply.id },
      update: {},
      create: { ...reply, isAnswer: false },
    });
  }
  console.log("  ✓ 5 forum categories, 8 posts, 10 replies created");

  // ── 20. Resources ──
  await prisma.resource.deleteMany({ where: { id: { startsWith: "demo-resource-" } } });
  const resources = [
    { id: "demo-resource-1", title: "Lesson Report Template", category: "EMAIL_TEMPLATES" as const, type: "TEMPLATE" as const, description: "Standard lesson report template to send parents after each session. Includes sections for what was covered, student progress, and next steps.", visibility: "ALL_TUTORS" as const, content: "<h2>Lesson Report Template</h2><p>Dear [Parent Name],</p><p>Today [Student Name] worked on [topic]. They showed great progress in [specific skill]. Next session we'll focus on [next topic].</p>" },
    { id: "demo-resource-2", title: "New Client Welcome Email", category: "EMAIL_TEMPLATES" as const, type: "TEMPLATE" as const, description: "Welcome email template for new clients after their trial lesson converts to a regular booking.", visibility: "ALL_TUTORS" as const, content: "<h2>Welcome to Acme Workforce!</h2><p>We're thrilled to welcome [Student Name] to the Acme family. Here's what to expect...</p>" },
    { id: "demo-resource-3", title: "Chess Piece Movement Coloring Pages", category: "PRINTABLE_ACTIVITIES" as const, type: "PDF" as const, description: "Set of 6 coloring pages, one for each chess piece, showing movement patterns. Great for ages 4-6.", fileUrl: "https://example.com/coloring-pages.pdf", visibility: "ALL_TUTORS" as const },
    { id: "demo-resource-4", title: "Opening Principles Cheat Sheet", category: "CHESS_RESOURCES" as const, type: "PDF" as const, description: "One-page reference guide for the 5 key opening principles. Designed for intermediate students (ages 8+).", fileUrl: "https://example.com/openings-cheat-sheet.pdf", visibility: "ALL_TUTORS" as const },
    { id: "demo-resource-5", title: "How to Run a Chess Tournament", category: "VIDEO_LIBRARY" as const, type: "VIDEO" as const, description: "Step-by-step video guide for organizing in-school chess tournaments. Covers pairing systems, clock setup, and dispute resolution.", url: "https://vimeo.com/example/tournament-guide", visibility: "ALL_TUTORS" as const },
    { id: "demo-resource-6", title: "Parent FAQ Document", category: "CLIENT_COMMUNICATION" as const, type: "RICH_TEXT" as const, description: "Comprehensive FAQ for parents covering lesson structure, pricing, cancellation policy, and chess progression milestones.", visibility: "ALL_TUTORS" as const, content: "<h2>Frequently Asked Questions</h2><h3>How long are lessons?</h3><p>Private lessons are 60 minutes. Group classes are 60-90 minutes.</p><h3>What if my child has never played chess?</h3><p>No problem! We start everyone from the very beginning with our story-based method.</p>" },
    { id: "demo-resource-7", title: "Referral Flyer Template (Canva)", category: "FLIER_TEMPLATES" as const, type: "CANVA_DESIGN" as const, description: "Customizable Canva template for the 'Refer a Friend' program flyer. Just update your name and contact info.", url: "https://canva.com/design/example", visibility: "ALL_TUTORS" as const },
    { id: "demo-resource-8", title: "Behavior Management Quick Reference", category: "BEHAVIOR_MANAGEMENT" as const, type: "PDF" as const, description: "Pocket-sized reference card with de-escalation techniques, redirection strategies, and when to escalate to lead tutor/admin.", fileUrl: "https://example.com/behavior-guide.pdf", visibility: "ALL_TUTORS" as const },
    { id: "demo-resource-9", title: "BQ Party Setup Guide", category: "BQ_RESOURCES" as const, type: "RICH_TEXT" as const, description: "Complete guide for setting up and running birthday party chess events. Includes timeline, materials checklist, and activity suggestions.", visibility: "ALL_TUTORS" as const, content: "<h2>Birthday Party Setup Guide</h2><h3>Before the Party (30 min setup)</h3><ul><li>Set up demo board</li><li>Arrange tables for 2-player games</li><li>Print activity sheets</li></ul>" },
    { id: "demo-resource-10", title: "Monthly Invoice Instructions", category: "FORMS" as const, type: "RICH_TEXT" as const, description: "Step-by-step instructions for submitting monthly invoices through the Branch payment system.", visibility: "ALL_TUTORS" as const, content: "<h2>Monthly Invoice Submission</h2><p>Submit invoices by the 5th of each month for the previous month's work.</p>" },
    { id: "demo-resource-11", title: "The Pawn Song", category: "SONGS" as const, type: "VIDEO" as const, description: "Fun sing-along video about how pawns move. Perfect warm-up activity for younger students.", url: "https://vimeo.com/example/pawn-song", visibility: "ALL_TUTORS" as const },
    { id: "demo-resource-12", title: "Online Teaching Setup Guide", category: "ONLINE_TEACHING" as const, type: "RICH_TEXT" as const, description: "Technical guide for setting up your online teaching environment: camera angles, lighting, screen sharing, and recommended software.", visibility: "ALL_TUTORS" as const, content: "<h2>Online Teaching Setup</h2><h3>Camera</h3><p>Position your camera so students can see both your face and the board.</p>" },
    { id: "demo-resource-13", title: "Story Illustration: King Shaky", category: "STORY_ILLUSTRATIONS" as const, type: "IMAGE" as const, description: "Official illustration of King Shaky for use in Lesson 1: The King. Print-quality PNG.", fileUrl: "https://example.com/king-shaky.png", visibility: "ALL_TUTORS" as const },
    { id: "demo-resource-14", title: "Referral Program Overview", category: "REFERRAL_STRATEGIES" as const, type: "RICH_TEXT" as const, description: "Complete breakdown of the tutor referral program: how it works, commission structure, and tips for maximizing referrals.", visibility: "ALL_TUTORS" as const, content: "<h2>Referral Program</h2><p>Earn $50 for every new client who books 5+ lessons through your referral link!</p>" },
    { id: "demo-resource-15", title: "Lead Tutor Onboarding Playbook", category: "ADMIN_TEAM" as const, type: "PDF" as const, description: "Comprehensive guide for lead tutors on how to onboard, mentor, and evaluate new tutors in their team.", fileUrl: "https://example.com/lead-tutor-playbook.pdf", visibility: "LEAD_TUTORS" as const },
  ];

  for (let i = 0; i < resources.length; i++) {
    await prisma.resource.upsert({
      where: { id: resources[i].id },
      update: {},
      create: { ...resources[i], order: i, isActive: true },
    });
  }
  console.log("  ✓ 15 resources created across categories");

  // ── 21. Announcements (extend existing) ──
  const announcements = [
    { id: "demo-announce-1", title: "Summer Chess Camp 2026 — Sign Up to Lead!", content: "We're launching our biggest summer camp yet across 12 locations. Lead tutors and experienced tutors: sign up by April 15th to reserve your preferred camp. Pay is $55/hr for lead instructors and $40/hr for tutors. Camps run June 15 – August 8.", type: "ANNOUNCEMENT" as const, isPinned: true, targetRoles: [UserRole.TUTOR, UserRole.LEAD_TUTOR], createdAt: daysAgo(2) },
    { id: "demo-announce-2", title: "New: Chess Puzzle Training Feature", content: "We've launched an interactive chess puzzle trainer right here in the portal! Solve daily puzzles to sharpen your skills, climb the leaderboard, and earn badges. Find it under Training > Puzzles.", type: "ANNOUNCEMENT" as const, targetRoles: [UserRole.TUTOR, UserRole.LEAD_TUTOR, UserRole.ONBOARDING_TUTOR], createdAt: daysAgo(10) },
    { id: "demo-announce-3", title: "Q2 Tutor Conference — April 26, 2026", content: "Save the date for our quarterly tutor conference! This quarter's theme: 'Teaching Chess to Neurodivergent Students'. Keynote speaker: Dr. Maria Santos from Columbia University. Virtual and in-person options available.", type: "IMPORTANT_DATE" as const, targetRoles: [UserRole.TUTOR, UserRole.LEAD_TUTOR, UserRole.FRANCHISEE_OWNER], createdAt: daysAgo(7) },
    { id: "demo-announce-4", title: "Tutor Spotlight: Jordan Rivera", content: "Huge congratulations to Jordan Rivera for reaching 250+ five-star ratings and 40+ trial conversions! Jordan's dedication to storytelling-based teaching and personalized parent communication has made them one of our top-performing tutors. Thank you for raising the bar!", type: "TUTOR_REVIEW" as const, targetRoles: [UserRole.TUTOR, UserRole.LEAD_TUTOR, UserRole.FRANCHISEE_OWNER, UserRole.ADMIN], createdAt: daysAgo(14) },
    { id: "demo-announce-5", title: "Updated Cancellation Policy (Effective April 1)", content: "Reminder: Our updated cancellation policy is now in effect. Clients must cancel 24 hours in advance for a full credit. Same-day cancellations will be charged 50% of the lesson rate. Please communicate this to your clients.", type: "ANNOUNCEMENT" as const, targetRoles: [UserRole.TUTOR, UserRole.LEAD_TUTOR, UserRole.FRANCHISEE_OWNER], createdAt: daysAgo(6) },
    { id: "demo-announce-6", title: "Story Spotlight: The Queen's Adventure", content: "This week's story spotlight features Lesson 3: The Queen's Adventure. Tutor Ana Gutierrez shared an amazing variation where she has students 'be the queen' and demonstrate all the ways the queen can move. Watch the video in the Teaching Resources section!", type: "STORY_SPOTLIGHT" as const, targetRoles: [UserRole.TUTOR, UserRole.LEAD_TUTOR], createdAt: daysAgo(4) },
  ];

  for (const ann of announcements) {
    await prisma.announcement.upsert({
      where: { id: ann.id },
      update: {},
      create: { ...ann, isActive: true, publishDate: ann.createdAt },
    });
  }
  console.log("  ✓ 6 announcements created");

  // ── 22. Lesson Progress for demo user ──
  // Get all published lessons
  const publishedLessons = await prisma.lesson.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true },
    take: 20,
  });

  if (publishedLessons.length > 0) {
    for (let i = 0; i < publishedLessons.length; i++) {
      const lesson = publishedLessons[i];
      const completed = i < publishedLessons.length * 0.7;
      await prisma.lessonProgress.upsert({
        where: { userId_lessonId: { userId: "demo-user", lessonId: lesson.id } },
        update: {},
        create: {
          userId: "demo-user",
          lessonId: lesson.id,
          status: completed ? "COMPLETED" : i < publishedLessons.length * 0.9 ? "IN_PROGRESS" : "NOT_STARTED",
          startedAt: completed ? daysAgo(500 - i * 20) : daysAgo(10),
          completedAt: completed ? daysAgo(498 - i * 20) : undefined,
          timeSpent: completed ? Math.floor(Math.random() * 1800) + 600 : Math.floor(Math.random() * 300),
          lastViewedAt: completed ? daysAgo(498 - i * 20) : daysAgo(Math.floor(Math.random() * 10)),
        },
      });
    }
    console.log(`  ✓ ${publishedLessons.length} lesson progress records created`);
  }

  // ── 23. Live Sessions (upcoming and past) ──
  await prisma.liveSession.deleteMany({ where: { id: { startsWith: "demo-session-" } } });
  const liveSessions = [
    { id: "demo-session-1", title: "Teaching Tips Q&A", description: "Monthly Q&A session where tutors share tips, ask questions, and learn from each other.", hostId: "fake-user-3", hostName: "Priya Patel", scheduledAt: daysFromNow(3), duration: 60, category: "Q_AND_A" as const, maxParticipants: 50 },
    { id: "demo-session-2", title: "Tournament Preparation Workshop", description: "How to prepare your students for chess tournaments: clock management, notation, and competitive etiquette.", hostId: "demo-user", hostName: "Jordan Rivera", scheduledAt: daysFromNow(10), duration: 90, category: "WORKSHOP" as const, maxParticipants: 30 },
    { id: "demo-session-3", title: "Office Hours: Lead Tutors", description: "Weekly office hours for lead tutors to discuss team management, mentoring, and operational issues.", hostId: "fake-user-12", hostName: "Noah Bernstein", scheduledAt: daysFromNow(5), duration: 45, category: "OFFICE_HOURS" as const, maxParticipants: 20 },
    { id: "demo-session-4", title: "New Tutor Welcome Session", description: "Welcome session for the April 2026 cohort. Overview of systems, expectations, and Q&A.", hostId: "fake-user-12", hostName: "Noah Bernstein", scheduledAt: daysFromNow(14), duration: 60, category: "TRAINING" as const, maxParticipants: 25 },
    { id: "demo-session-5", title: "Summer Camp Planning Kickoff", description: "Planning session for summer camp 2026. Discuss logistics, curriculum, and staffing.", hostId: "fake-user-6", hostName: "James Wright", scheduledAt: daysFromNow(7), duration: 90, category: "SPECIAL_EVENT" as const, maxParticipants: 40 },
    // Past sessions
    { id: "demo-session-6", title: "March Teaching Tips Q&A", hostId: "fake-user-3", hostName: "Priya Patel", scheduledAt: daysAgo(7), duration: 60, category: "Q_AND_A" as const, maxParticipants: 50 },
    { id: "demo-session-7", title: "Behavior Management Workshop", hostId: "fake-user-12", hostName: "Noah Bernstein", scheduledAt: daysAgo(21), duration: 90, category: "WORKSHOP" as const, maxParticipants: 30 },
  ];

  for (const session of liveSessions) {
    await prisma.liveSession.create({ data: { ...session, isActive: true } });
  }

  // Register demo user for upcoming sessions
  for (const sessionId of ["demo-session-1", "demo-session-2", "demo-session-3", "demo-session-5"]) {
    await prisma.liveSessionRegistration.create({
      data: { sessionId, userId: "demo-user" },
    });
  }

  // Attendance for past sessions
  await prisma.liveSessionAttendance.create({
    data: { sessionId: "demo-session-6", userId: "demo-user", joinedAt: daysAgo(7), leftAt: daysAgo(7), durationMinutes: 58 },
  });
  await prisma.liveSessionAttendance.create({
    data: { sessionId: "demo-session-7", userId: "demo-user", joinedAt: daysAgo(21), leftAt: daysAgo(21), durationMinutes: 87 },
  });
  console.log("  ✓ 7 live sessions (5 upcoming, 2 past), registrations, and attendance created");

  // ── 24. Additional Curriculum Modules & Lessons ──
  // Ensure we have enough curriculum content for the portal to feel full
  const existingCurriculum = await prisma.curriculum.findFirst({ where: { status: "PUBLISHED" } });
  if (existingCurriculum) {
    const additionalModules = [
      { id: "demo-mod-2", title: "Pawn Power & Strategy", description: "Master the fundamentals of pawn structure and strategy.", order: 2 },
      { id: "demo-mod-3", title: "The Minor Pieces", description: "Understanding bishops and knights — when and how to use each.", order: 3 },
      { id: "demo-mod-4", title: "The Major Pieces", description: "Rooks and queens — power pieces and how to activate them.", order: 4 },
      { id: "demo-mod-5", title: "Checkmate Patterns", description: "Learn the essential checkmate patterns every student should know.", order: 5 },
      { id: "demo-mod-6", title: "Opening Principles", description: "Teach your students the 5 golden rules of opening play.", order: 6 },
    ];

    for (const mod of additionalModules) {
      const created = await prisma.module.upsert({
        where: { id: mod.id },
        update: {},
        create: { ...mod, curriculumId: existingCurriculum.id, status: "PUBLISHED" },
      });

      // Add 3-4 lessons per module
      const lessonsPerModule = [
        [
          { title: "The Mighty Pawn", subtitle: "Small but powerful", number: 1 },
          { title: "Pawn Chains", subtitle: "Strength in numbers", number: 2 },
          { title: "Passed Pawns", subtitle: "The unstoppable pawn", number: 3 },
        ],
        [
          { title: "The Brave Knight", subtitle: "Meet Sir Jumps-a-Lot", number: 1 },
          { title: "The Sneaky Bishop", subtitle: "Diagonal danger", number: 2 },
          { title: "Knight vs Bishop", subtitle: "Who wins?", number: 3 },
          { title: "Working Together", subtitle: "Minor piece teamwork", number: 4 },
        ],
        [
          { title: "The Rolling Rook", subtitle: "Castle defender", number: 1 },
          { title: "The Powerful Queen", subtitle: "Queen's adventure", number: 2 },
          { title: "Rook Endgames", subtitle: "The most important endgame", number: 3 },
        ],
        [
          { title: "Back Rank Mate", subtitle: "The classic trap", number: 1 },
          { title: "Scholar's Mate & Defense", subtitle: "The 4-move checkmate", number: 2 },
          { title: "Smothered Mate", subtitle: "The knight's special trick", number: 3 },
          { title: "Two Rook Checkmate", subtitle: "Rolling the king", number: 4 },
        ],
        [
          { title: "Control the Center", subtitle: "Rule #1", number: 1 },
          { title: "Develop Your Pieces", subtitle: "Get everyone in the game", number: 2 },
          { title: "Castle Early", subtitle: "Keep your king safe", number: 3 },
          { title: "Connect Your Rooks", subtitle: "The final step", number: 4 },
        ],
      ];

      const moduleIndex = additionalModules.indexOf(mod);
      const lessons = lessonsPerModule[moduleIndex] || [];
      for (let i = 0; i < lessons.length; i++) {
        await prisma.lesson.upsert({
          where: { id: `${mod.id}-lesson-${i + 1}` },
          update: {},
          create: {
            id: `${mod.id}-lesson-${i + 1}`,
            moduleId: created.id,
            ...lessons[i],
            status: "PUBLISHED",
            order: i + 1,
          },
        });
      }
    }
    console.log("  ✓ 5 additional modules with 18 lessons created");
  }

  // ── SUMMARY ──
  console.log("\n✅ Demo data seeding complete!\n");
  console.log("📊 Summary:");
  console.log("  • 1 demo user (Jordan Rivera) with full profile");
  console.log("  • 12 additional fake users for social features");
  console.log("  • 1 tutor profile with performance metrics");
  console.log("  • 7 tutor certifications, 4 labels, 6 notes");
  console.log("  • Points system (4,850 total) with 15 history entries");
  console.log("  • 3 streaks, 14 milestones");
  console.log("  • 6 classes with 37 students");
  console.log("  • 5 user-level certifications");
  console.log("  • 8 training courses with 40 modules");
  console.log("  • 8 enrollments (6 completed, 1 in progress, 1 not started)");
  console.log("  • 3 learning paths");
  console.log("  • 3 course reviews");
  console.log("  • 6 goals (5 active, 1 completed)");
  console.log("  • 12 notifications (3 unread)");
  console.log("  • Puzzle stats (142 solved, 1450 rating)");
  console.log("  • 5 forum categories, 8 posts, 10 replies");
  console.log("  • 15 resources across all categories");
  console.log("  • 6 announcements");
  console.log("  • 7 live sessions with registrations & attendance");
  console.log("  • 5 curriculum modules with 18 lessons");
  console.log("  • Lesson progress records");
  console.log("\n🔑 Demo login: demo@acmeworkforce.com / demo");
}

// Run standalone
if (require.main === module || standalone) {
  const prisma = getPrisma();
  seedDemoData(prisma)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
