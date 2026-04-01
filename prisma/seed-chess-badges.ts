import { PrismaClient } from "@prisma/client";

const chessBadges = [
  {
    badgeKey: "chess_puzzle_novice",
    title: "Puzzle Novice",
    description: "Solved 10 training exercises",
    icon: "Puzzle",
    colorScheme: JSON.stringify({
      color: "#3B82F6",
      bgColor: "#EFF6FF",
      borderColor: "#BFDBFE",
    }),
    unlockType: "milestone",
    unlockCondition: JSON.stringify({
      type: "PUZZLES_SOLVED",
      value: 10,
    }),
    order: 0,
  },
  {
    badgeKey: "chess_puzzle_adept",
    title: "Puzzle Adept",
    description: "Solved 50 training exercises",
    icon: "Puzzle",
    colorScheme: JSON.stringify({
      color: "#8B5CF6",
      bgColor: "#F5F3FF",
      borderColor: "#C4B5FD",
    }),
    unlockType: "milestone",
    unlockCondition: JSON.stringify({
      type: "PUZZLES_SOLVED",
      value: 50,
    }),
    order: 1,
  },
  {
    badgeKey: "chess_puzzle_master",
    title: "Puzzle Master",
    description: "Solved 100 training exercises",
    icon: "Puzzle",
    colorScheme: JSON.stringify({
      color: "#EC4899",
      bgColor: "#FDF2F8",
      borderColor: "#F9A8D4",
    }),
    unlockType: "milestone",
    unlockCondition: JSON.stringify({
      type: "PUZZLES_SOLVED",
      value: 100,
    }),
    order: 2,
  },
  {
    badgeKey: "chess_puzzle_grandmaster",
    title: "Puzzle Grandmaster",
    description: "Solved 500 training exercises",
    icon: "Crown",
    colorScheme: JSON.stringify({
      color: "#F59E0B",
      bgColor: "#FFFBEB",
      borderColor: "#FCD34D",
    }),
    unlockType: "milestone",
    unlockCondition: JSON.stringify({
      type: "PUZZLES_SOLVED",
      value: 500,
    }),
    order: 3,
  },
  {
    badgeKey: "chess_learner",
    title: "Chess Learner",
    description: "Completed your first training module",
    icon: "BookOpen",
    colorScheme: JSON.stringify({
      color: "#10B981",
      bgColor: "#ECFDF5",
      borderColor: "#A7F3D0",
    }),
    unlockType: "milestone",
    unlockCondition: JSON.stringify({
      type: "chess_lesson_first",
    }),
    order: 4,
  },
  {
    badgeKey: "chess_piece_expert",
    title: "Piece Expert",
    description: "Completed all Chess Pieces lessons",
    icon: "Award",
    colorScheme: JSON.stringify({
      color: "#3B82F6",
      bgColor: "#EFF6FF",
      borderColor: "#93C5FD",
    }),
    unlockType: "milestone",
    unlockCondition: JSON.stringify({
      type: "chess_category_complete",
      category: "chess-pieces",
    }),
    order: 5,
  },
  {
    badgeKey: "chess_fundamentals_master",
    title: "Fundamentals Master",
    description: "Completed all Fundamentals lessons",
    icon: "Shield",
    colorScheme: JSON.stringify({
      color: "#8B5CF6",
      bgColor: "#F5F3FF",
      borderColor: "#C4B5FD",
    }),
    unlockType: "milestone",
    unlockCondition: JSON.stringify({
      type: "chess_category_complete",
      category: "fundamentals",
    }),
    order: 6,
  },
  {
    badgeKey: "chess_streak_7",
    title: "Puzzle Week",
    description: "Maintained a 7-day puzzle streak",
    icon: "Flame",
    colorScheme: JSON.stringify({
      color: "#EF4444",
      bgColor: "#FEF2F2",
      borderColor: "#FCA5A5",
    }),
    unlockType: "streak",
    unlockCondition: JSON.stringify({
      type: "PUZZLES_DAILY",
      value: 7,
    }),
    order: 7,
  },
  {
    badgeKey: "chess_streak_30",
    title: "Puzzle Month",
    description: "Maintained a 30-day puzzle streak",
    icon: "Flame",
    colorScheme: JSON.stringify({
      color: "#F97316",
      bgColor: "#FFF7ED",
      borderColor: "#FDBA74",
    }),
    unlockType: "streak",
    unlockCondition: JSON.stringify({
      type: "PUZZLES_DAILY",
      value: 30,
    }),
    order: 8,
  },
  {
    badgeKey: "chess_rating_1400",
    title: "Rising Star",
    description: "Reached a puzzle rating of 1400",
    icon: "Star",
    colorScheme: JSON.stringify({
      color: "#6366F1",
      bgColor: "#EEF2FF",
      borderColor: "#A5B4FC",
    }),
    unlockType: "milestone",
    unlockCondition: JSON.stringify({
      type: "puzzle_rating",
      value: 1400,
    }),
    order: 9,
  },
  {
    badgeKey: "chess_rating_1800",
    title: "Chess Expert",
    description: "Reached a puzzle rating of 1800",
    icon: "Trophy",
    colorScheme: JSON.stringify({
      color: "#F59E0B",
      bgColor: "#FFFBEB",
      borderColor: "#FCD34D",
    }),
    unlockType: "milestone",
    unlockCondition: JSON.stringify({
      type: "puzzle_rating",
      value: 1800,
    }),
    order: 10,
  },
];

export async function seedChessBadges(prisma: PrismaClient) {
  console.log("Seeding chess badges...");

  for (const badge of chessBadges) {
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
      create: badge,
    });
    console.log(`  Badge: ${badge.title}`);
  }

  console.log("Chess badges seeded!");
}

