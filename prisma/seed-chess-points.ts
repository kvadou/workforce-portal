import { PrismaClient, PointsCategory } from "@prisma/client";

const chessPointsRules = [
  {
    name: "Puzzle Solved",
    description: "Points for solving a training exercise",
    category: "LEARNING" as PointsCategory,
    trigger: "puzzle_solved",
    points: 5,
  },
  {
    name: "Daily Puzzle Solved",
    description: "Bonus points for solving the daily puzzle",
    category: "LEARNING" as PointsCategory,
    trigger: "daily_puzzle_solved",
    points: 10,
  },
  {
    name: "Training Module Complete",
    description: "Points for completing a training module (all levels)",
    category: "LEARNING" as PointsCategory,
    trigger: "training_module_complete",
    points: 15,
  },
  {
    name: "Training Category Complete",
    description: "Points for completing all modules in a training category",
    category: "LEARNING" as PointsCategory,
    trigger: "training_category_complete",
    points: 50,
  },
  {
    name: "Puzzle Streak 7 Days",
    description: "Points for a 7-day puzzle streak",
    category: "ENGAGEMENT" as PointsCategory,
    trigger: "puzzle_streak_7",
    points: 25,
    threshold: 7,
  },
  {
    name: "Puzzle Streak 30 Days",
    description: "Points for a 30-day puzzle streak",
    category: "ENGAGEMENT" as PointsCategory,
    trigger: "puzzle_streak_30",
    points: 100,
    threshold: 30,
  },
  {
    name: "10 Puzzles Solved",
    description: "Milestone: solved 10 puzzles",
    category: "LEARNING" as PointsCategory,
    trigger: "puzzles_solved_10",
    points: 15,
    threshold: 10,
  },
  {
    name: "50 Puzzles Solved",
    description: "Milestone: solved 50 puzzles",
    category: "LEARNING" as PointsCategory,
    trigger: "puzzles_solved_50",
    points: 30,
    threshold: 50,
  },
  {
    name: "100 Puzzles Solved",
    description: "Milestone: solved 100 puzzles",
    category: "LEARNING" as PointsCategory,
    trigger: "puzzles_solved_100",
    points: 50,
    threshold: 100,
  },
  {
    name: "500 Puzzles Solved",
    description: "Milestone: solved 500 puzzles",
    category: "LEARNING" as PointsCategory,
    trigger: "puzzles_solved_500",
    points: 100,
    threshold: 500,
  },
  {
    name: "1000 Puzzles Solved",
    description: "Milestone: solved 1000 puzzles",
    category: "LEARNING" as PointsCategory,
    trigger: "puzzles_solved_1000",
    points: 250,
    threshold: 1000,
  },
];

export async function seedChessPoints(prisma: PrismaClient) {
  console.log("Seeding chess points rules...");

  for (const rule of chessPointsRules) {
    await prisma.pointsRule.upsert({
      where: { trigger: rule.trigger },
      update: {
        name: rule.name,
        description: rule.description,
        points: rule.points,
        threshold: rule.threshold ?? null,
      },
      create: rule,
    });
    console.log(`  Rule: ${rule.name} (${rule.points} pts)`);
  }

  console.log("Chess points rules seeded!");
}

