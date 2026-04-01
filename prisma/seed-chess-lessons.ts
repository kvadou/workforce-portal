import { PrismaClient, LevelGoalType } from "@prisma/client";

interface LevelSeed {
  order: number;
  fen: string;
  goal: string;
  goalType: LevelGoalType;
  targetSquares: string[];
  playerColor: string;
  hintText?: string;
}

interface LessonSeed {
  title: string;
  subtitle: string;
  iconEmoji: string;
  order: number;
  levels: LevelSeed[];
}

interface CategorySeed {
  name: string;
  slug: string;
  color: string;
  order: number;
  lessons: LessonSeed[];
}

const categories: CategorySeed[] = [
  {
    name: "Chess Pieces",
    slug: "chess-pieces",
    color: "#3B82F6", // blue
    order: 0,
    lessons: [
      {
        title: "The Pawn",
        subtitle: "Learn how pawns move and capture",
        iconEmoji: "♟",
        order: 0,
        levels: [
          {
            order: 0,
            fen: "8/8/8/8/8/8/4P3/8 w - - 0 1",
            goal: "Move the pawn forward one square",
            goalType: "REACH_SQUARE",
            targetSquares: ["e3"],
            playerColor: "white",
            hintText: "Pawns move straight ahead one square at a time",
          },
          {
            order: 1,
            fen: "8/8/8/8/8/8/4P3/8 w - - 0 1",
            goal: "Move the pawn forward two squares",
            goalType: "REACH_SQUARE",
            targetSquares: ["e4"],
            playerColor: "white",
            hintText: "From their starting position, pawns can move two squares forward",
          },
          {
            order: 2,
            fen: "8/8/8/3p4/8/8/4P3/8 w - - 0 1",
            goal: "Advance the pawn to e4",
            goalType: "REACH_SQUARE",
            targetSquares: ["e4"],
            playerColor: "white",
            hintText: "Pawns can still move two squares from their starting rank",
          },
          {
            order: 3,
            fen: "8/8/8/3p4/4P3/8/8/8 w - - 0 1",
            goal: "Capture the black pawn",
            goalType: "CAPTURE_TARGETS",
            targetSquares: ["d5"],
            playerColor: "white",
            hintText: "Pawns capture diagonally, one square forward",
          },
          {
            order: 4,
            fen: "8/8/3p1p2/4P3/8/8/8/8 w - - 0 1",
            goal: "Capture one of the black pawns",
            goalType: "CAPTURE_TARGETS",
            targetSquares: ["d6", "f6"],
            playerColor: "white",
            hintText: "A pawn can capture diagonally left or right",
          },
          {
            order: 5,
            fen: "8/4P3/8/8/8/8/8/8 w - - 0 1",
            goal: "Promote the pawn! Move it to the last rank",
            goalType: "REACH_SQUARE",
            targetSquares: ["e8"],
            playerColor: "white",
            hintText: "When a pawn reaches the opposite end of the board, it promotes to a stronger piece",
          },
        ],
      },
      {
        title: "The Rook",
        subtitle: "Master horizontal and vertical movement",
        iconEmoji: "♜",
        order: 1,
        levels: [
          {
            order: 0,
            fen: "8/8/8/8/8/8/8/R7 w - - 0 1",
            goal: "Move the rook to a8",
            goalType: "REACH_SQUARE",
            targetSquares: ["a8"],
            playerColor: "white",
            hintText: "Rooks move in straight lines - up, down, left, or right",
          },
          {
            order: 1,
            fen: "8/8/8/8/8/8/8/R7 w - - 0 1",
            goal: "Move the rook to h1",
            goalType: "REACH_SQUARE",
            targetSquares: ["h1"],
            playerColor: "white",
            hintText: "Rooks can move any number of squares along ranks (rows)",
          },
          {
            order: 2,
            fen: "8/8/8/8/3R4/8/8/8 w - - 0 1",
            goal: "Move the rook to d8",
            goalType: "REACH_SQUARE",
            targetSquares: ["d8"],
            playerColor: "white",
            hintText: "Rooks slide along files (columns) too",
          },
          {
            order: 3,
            fen: "8/8/8/3p4/8/8/8/3R4 w - - 0 1",
            goal: "Capture the black pawn with the rook",
            goalType: "CAPTURE_TARGETS",
            targetSquares: ["d5"],
            playerColor: "white",
            hintText: "Rooks capture by moving to the square an enemy piece occupies",
          },
          {
            order: 4,
            fen: "8/3p4/8/8/3R4/8/8/8 w - - 0 1",
            goal: "Capture the black pawn",
            goalType: "CAPTURE_TARGETS",
            targetSquares: ["d7"],
            playerColor: "white",
            hintText: "A rook can move multiple squares to reach and capture",
          },
          {
            order: 5,
            fen: "8/8/8/p2R2p1/8/8/8/8 w - - 0 1",
            goal: "Capture both black pawns (2 moves)",
            goalType: "CAPTURE_TARGETS",
            targetSquares: ["a5", "g5"],
            playerColor: "white",
            hintText: "Use the rook's long range to capture along the rank",
          },
        ],
      },
      {
        title: "The Bishop",
        subtitle: "Control the diagonals",
        iconEmoji: "♝",
        order: 2,
        levels: [
          {
            order: 0,
            fen: "8/8/8/8/3B4/8/8/8 w - - 0 1",
            goal: "Move the bishop to h8",
            goalType: "REACH_SQUARE",
            targetSquares: ["h8"],
            playerColor: "white",
            hintText: "Bishops move diagonally any number of squares",
          },
          {
            order: 1,
            fen: "8/8/8/8/3B4/8/8/8 w - - 0 1",
            goal: "Move the bishop to a1",
            goalType: "REACH_SQUARE",
            targetSquares: ["a1"],
            playerColor: "white",
            hintText: "Bishops can move along any diagonal",
          },
          {
            order: 2,
            fen: "8/8/8/8/8/8/8/2B5 w - - 0 1",
            goal: "Move the bishop to g5",
            goalType: "REACH_SQUARE",
            targetSquares: ["g5"],
            playerColor: "white",
            hintText: "This bishop is on a light square - it can only ever reach light squares",
          },
          {
            order: 3,
            fen: "8/8/5p2/8/3B4/8/8/8 w - - 0 1",
            goal: "Capture the black pawn",
            goalType: "CAPTURE_TARGETS",
            targetSquares: ["f6"],
            playerColor: "white",
            hintText: "Bishops capture diagonally, just like they move",
          },
          {
            order: 4,
            fen: "8/1p6/8/8/8/8/8/B7 w - - 0 1",
            goal: "Capture the black pawn in the fewest moves",
            goalType: "CAPTURE_TARGETS",
            targetSquares: ["b7"],
            playerColor: "white",
            hintText: "Look for the shortest diagonal path",
          },
          {
            order: 5,
            fen: "8/8/5p2/8/3B4/8/1p6/8 w - - 0 1",
            goal: "Capture both black pawns",
            goalType: "CAPTURE_TARGETS",
            targetSquares: ["f6", "b2"],
            playerColor: "white",
            hintText: "Plan your captures so you can reach both pawns",
          },
        ],
      },
      {
        title: "The Knight",
        subtitle: "Master the L-shaped jump",
        iconEmoji: "♞",
        order: 3,
        levels: [
          {
            order: 0,
            fen: "8/8/8/8/8/8/8/1N6 w - - 0 1",
            goal: "Move the knight to c3",
            goalType: "REACH_SQUARE",
            targetSquares: ["c3"],
            playerColor: "white",
            hintText: "Knights move in an L-shape: two squares in one direction, then one square perpendicular",
          },
          {
            order: 1,
            fen: "8/8/8/8/8/8/8/1N6 w - - 0 1",
            goal: "Move the knight to a3",
            goalType: "REACH_SQUARE",
            targetSquares: ["a3"],
            playerColor: "white",
            hintText: "The L can go in any direction",
          },
          {
            order: 2,
            fen: "8/8/8/8/4N3/8/8/8 w - - 0 1",
            goal: "Move the knight to f6",
            goalType: "REACH_SQUARE",
            targetSquares: ["f6"],
            playerColor: "white",
            hintText: "Knights can jump over other pieces",
          },
          {
            order: 3,
            fen: "8/8/8/3p4/8/8/1N6/8 w - - 0 1",
            goal: "Capture the black pawn with the knight",
            goalType: "CAPTURE_TARGETS",
            targetSquares: ["d5"],
            playerColor: "white",
            hintText: "Knights capture by landing on a piece after their L-shaped jump",
          },
          {
            order: 4,
            fen: "8/8/8/PPP5/PNP5/PPP5/8/8 w - - 0 1",
            goal: "Jump the knight out to d6",
            goalType: "REACH_SQUARE",
            targetSquares: ["d6"],
            playerColor: "white",
            hintText: "Knights are the only piece that can jump over other pieces",
          },
          {
            order: 5,
            fen: "8/8/2p5/8/4N3/8/2p5/8 w - - 0 1",
            goal: "Capture both black pawns with the knight",
            goalType: "CAPTURE_TARGETS",
            targetSquares: ["c6", "c2"],
            playerColor: "white",
            hintText: "Plan your knight hops to reach both targets",
          },
        ],
      },
      {
        title: "The Queen",
        subtitle: "The most powerful piece on the board",
        iconEmoji: "♛",
        order: 4,
        levels: [
          {
            order: 0,
            fen: "8/8/8/8/3Q4/8/8/8 w - - 0 1",
            goal: "Move the queen to h8",
            goalType: "REACH_SQUARE",
            targetSquares: ["h8"],
            playerColor: "white",
            hintText: "The queen combines the rook and bishop - she moves in straight lines and diagonals",
          },
          {
            order: 1,
            fen: "8/8/8/8/3Q4/8/8/8 w - - 0 1",
            goal: "Move the queen to a1",
            goalType: "REACH_SQUARE",
            targetSquares: ["a1"],
            playerColor: "white",
            hintText: "The queen can move diagonally like a bishop",
          },
          {
            order: 2,
            fen: "8/8/5p2/8/3Q4/8/8/8 w - - 0 1",
            goal: "Capture the black pawn",
            goalType: "CAPTURE_TARGETS",
            targetSquares: ["f6"],
            playerColor: "white",
            hintText: "The queen can capture along any line she can move on",
          },
          {
            order: 3,
            fen: "8/p6p/8/8/3Q4/8/8/8 w - - 0 1",
            goal: "Capture both black pawns",
            goalType: "CAPTURE_TARGETS",
            targetSquares: ["a7", "h7"],
            playerColor: "white",
            hintText: "Use the queen's versatility to reach both targets",
          },
        ],
      },
      {
        title: "The King",
        subtitle: "Protect the most important piece",
        iconEmoji: "♚",
        order: 5,
        levels: [
          {
            order: 0,
            fen: "8/8/8/8/4K3/8/8/8 w - - 0 1",
            goal: "Move the king to e5",
            goalType: "REACH_SQUARE",
            targetSquares: ["e5"],
            playerColor: "white",
            hintText: "The king moves one square in any direction",
          },
          {
            order: 1,
            fen: "8/8/8/8/4K3/8/8/8 w - - 0 1",
            goal: "Move the king to d3",
            goalType: "REACH_SQUARE",
            targetSquares: ["d3"],
            playerColor: "white",
            hintText: "The king can move diagonally too, but only one square",
          },
          {
            order: 2,
            fen: "8/8/8/3p4/4K3/8/8/8 w - - 0 1",
            goal: "Capture the black pawn with the king",
            goalType: "CAPTURE_TARGETS",
            targetSquares: ["d5"],
            playerColor: "white",
            hintText: "The king can capture pieces on adjacent squares",
          },
          {
            order: 3,
            fen: "8/8/8/8/8/8/8/4K2R w K - 0 1",
            goal: "Castle kingside! Move the king to g1",
            goalType: "REACH_SQUARE",
            targetSquares: ["g1"],
            playerColor: "white",
            hintText: "Move the king two squares toward the rook to castle",
          },
        ],
      },
    ],
  },
  {
    name: "Fundamentals",
    slug: "fundamentals",
    color: "#8B5CF6", // purple
    order: 1,
    lessons: [
      {
        title: "Capture",
        subtitle: "Learn to take your opponent's pieces",
        iconEmoji: "⚔️",
        order: 0,
        levels: [
          {
            order: 0,
            fen: "8/8/8/3p4/4N3/8/8/8 w - - 0 1",
            goal: "Capture the undefended pawn",
            goalType: "CAPTURE_TARGETS",
            targetSquares: ["d5"],
            playerColor: "white",
            hintText: "Look for pieces you can take for free",
          },
          {
            order: 1,
            fen: "8/8/8/3r4/8/8/8/3R4 w - - 0 1",
            goal: "Capture the black rook",
            goalType: "CAPTURE_TARGETS",
            targetSquares: ["d5"],
            playerColor: "white",
            hintText: "Your rook can capture along the file",
          },
          {
            order: 2,
            fen: "8/8/2p1p3/3B4/8/8/8/8 w - - 0 1",
            goal: "Capture one of the black pawns",
            goalType: "CAPTURE_TARGETS",
            targetSquares: ["c6", "e6"],
            playerColor: "white",
            hintText: "Your bishop can capture diagonally",
          },
          {
            order: 3,
            fen: "8/8/1p6/8/3N4/8/8/8 w - - 0 1",
            goal: "Capture the black pawn with the knight",
            goalType: "CAPTURE_TARGETS",
            targetSquares: ["b6"],
            playerColor: "white",
            hintText: "Remember the knight's L-shaped jump",
          },
        ],
      },
      {
        title: "Protection",
        subtitle: "Keep your pieces safe",
        iconEmoji: "🛡️",
        order: 1,
        levels: [
          {
            order: 0,
            fen: "8/8/8/3r4/8/8/3R4/3K4 w - - 0 1",
            goal: "Move your king to protect the rook (move to e2)",
            goalType: "REACH_SQUARE",
            targetSquares: ["e2"],
            playerColor: "white",
            hintText: "If a piece is attacked, you can defend it by moving another piece next to it",
          },
          {
            order: 1,
            fen: "8/8/8/8/8/8/3P4/2B5 w - - 0 1",
            goal: "Move the bishop to protect the pawn (move to e3)",
            goalType: "REACH_SQUARE",
            targetSquares: ["e3"],
            playerColor: "white",
            hintText: "Move a piece so it can recapture if your pawn is taken",
          },
          {
            order: 2,
            fen: "8/8/8/3q4/8/8/3P4/3K4 w - - 0 1",
            goal: "Avoid losing the pawn - advance it to safety (d4)",
            goalType: "REACH_SQUARE",
            targetSquares: ["d4"],
            playerColor: "white",
            hintText: "Sometimes the best defense is moving the threatened piece",
          },
          {
            order: 3,
            fen: "8/8/3r4/8/4B3/8/8/3K4 w - - 0 1",
            goal: "Move the bishop to safety - avoid the rook's attack",
            goalType: "AVOID_CAPTURE",
            targetSquares: [],
            playerColor: "white",
            hintText: "Move the bishop off the d-file to escape the rook",
          },
        ],
      },
      {
        title: "Check",
        subtitle: "Attack the enemy king",
        iconEmoji: "👑",
        order: 2,
        levels: [
          {
            order: 0,
            fen: "4k3/8/8/8/8/8/8/4R3 w - - 0 1",
            goal: "Put the black king in check with the rook",
            goalType: "SEQUENCE",
            targetSquares: ["e8"],
            playerColor: "white",
            hintText: "Move the rook to the same file or rank as the king",
          },
          {
            order: 1,
            fen: "4k3/8/8/8/8/8/8/3B4 w - - 0 1",
            goal: "Check the king with the bishop",
            goalType: "SEQUENCE",
            targetSquares: ["e8"],
            playerColor: "white",
            hintText: "Move the bishop to a diagonal that reaches the king",
          },
          {
            order: 2,
            fen: "4k3/8/8/8/8/5N2/8/8 w - - 0 1",
            goal: "Check the king with the knight",
            goalType: "SEQUENCE",
            targetSquares: ["e8"],
            playerColor: "white",
            hintText: "Find a square where the knight's L-shape reaches the king",
          },
          {
            order: 3,
            fen: "4k3/8/8/8/8/8/8/3Q4 w - - 0 1",
            goal: "Check the king with the queen",
            goalType: "SEQUENCE",
            targetSquares: ["e8"],
            playerColor: "white",
            hintText: "The queen can check along files, ranks, or diagonals",
          },
        ],
      },
      {
        title: "Mate in One",
        subtitle: "Deliver checkmate in a single move",
        iconEmoji: "🏆",
        order: 3,
        levels: [
          {
            order: 0,
            fen: "k7/8/1K6/8/8/8/8/R7 w - - 0 1",
            goal: "Checkmate in one move!",
            goalType: "CHECKMATE",
            targetSquares: [],
            playerColor: "white",
            hintText: "Use the rook to deliver checkmate on the back rank",
          },
          {
            order: 1,
            fen: "6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1",
            goal: "Deliver checkmate!",
            goalType: "CHECKMATE",
            targetSquares: [],
            playerColor: "white",
            hintText: "The back rank is weak - the pawns block the king's escape",
          },
          {
            order: 2,
            fen: "4k3/8/4K3/8/8/8/8/4Q3 w - - 0 1",
            goal: "Deliver checkmate with the queen!",
            goalType: "CHECKMATE",
            targetSquares: [],
            playerColor: "white",
            hintText: "Move the queen to a square where it attacks the king with no escape",
          },
          {
            order: 3,
            fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1",
            goal: "Scholar's Mate! Checkmate in one move",
            goalType: "CHECKMATE",
            targetSquares: [],
            playerColor: "white",
            hintText: "Look at f7 - the weakest square in the opening",
          },
          {
            order: 4,
            fen: "rnb1kbnr/ppppqppp/8/8/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1",
            goal: "Checkmate the king!",
            goalType: "CHECKMATE",
            targetSquares: [],
            playerColor: "white",
            hintText: "Find the square where the queen delivers an unstoppable check",
          },
          {
            order: 5,
            fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1",
            goal: "Can you find the checkmate? (Trick question - there isn't one!)",
            goalType: "CUSTOM",
            targetSquares: [],
            playerColor: "white",
            hintText: "Not every position has a checkmate - develop your pieces instead",
          },
        ],
      },
    ],
  },
];

export async function seedChessLessons(prisma: PrismaClient) {
  console.log("Seeding training module categories and lessons...");

  for (const cat of categories) {
    const category = await prisma.chessLessonCategory.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        color: cat.color,
        order: cat.order,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        color: cat.color,
        order: cat.order,
      },
    });

    console.log(`  Category: ${category.name}`);

    for (const les of cat.lessons) {
      // Find or create lesson
      const existingLessons = await prisma.chessLesson.findMany({
        where: { categoryId: category.id, title: les.title },
      });

      let lesson;
      if (existingLessons.length > 0) {
        lesson = await prisma.chessLesson.update({
          where: { id: existingLessons[0].id },
          data: {
            subtitle: les.subtitle,
            iconEmoji: les.iconEmoji,
            order: les.order,
          },
        });
      } else {
        lesson = await prisma.chessLesson.create({
          data: {
            categoryId: category.id,
            title: les.title,
            subtitle: les.subtitle,
            iconEmoji: les.iconEmoji,
            order: les.order,
          },
        });
      }

      console.log(`    Lesson: ${lesson.title} (${les.levels.length} levels)`);

      // Delete existing levels and recreate
      await prisma.chessLessonLevel.deleteMany({
        where: { lessonId: lesson.id },
      });

      for (const lvl of les.levels) {
        await prisma.chessLessonLevel.create({
          data: {
            lessonId: lesson.id,
            order: lvl.order,
            fen: lvl.fen,
            goal: lvl.goal,
            goalType: lvl.goalType,
            targetSquares: lvl.targetSquares,
            playerColor: lvl.playerColor,
            hintText: lvl.hintText,
          },
        });
      }
    }
  }

  console.log("Chess lessons seeded!");
}

