import { prisma } from "@/lib/prisma";
import type { CourseCategory, CourseDifficulty } from "@prisma/client";

export interface CourseRecommendation {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: CourseCategory;
  difficulty: CourseDifficulty;
  thumbnailUrl: string | null;
  estimatedMinutes: number;
  moduleCount: number;
  reason: string;
  score: number;
}

/**
 * Get personalized course recommendations for a user
 */
export async function getRecommendationsForUser(
  userId: string,
  limit: number = 6
): Promise<CourseRecommendation[]> {
  // Get user's completed and enrolled courses
  const userEnrollments = await prisma.courseEnrollment.findMany({
    where: { userId },
    include: {
      course: {
        select: {
          id: true,
          category: true,
          difficulty: true,
        },
      },
    },
  });

  const completedCourseIds = userEnrollments
    .filter((e) => e.status === "COMPLETED")
    .map((e) => e.courseId);

  const enrolledCourseIds = userEnrollments.map((e) => e.courseId);

  // Get user's preferred categories and difficulty progression
  const completedCourses = userEnrollments
    .filter((e) => e.status === "COMPLETED")
    .map((e) => e.course);

  // Analyze user's completed courses
  const categoryFrequency: Record<string, number> = {};
  let maxDifficulty: CourseDifficulty = "BEGINNER";

  completedCourses.forEach((course) => {
    categoryFrequency[course.category] = (categoryFrequency[course.category] || 0) + 1;

    const difficultyOrder: CourseDifficulty[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
    if (difficultyOrder.indexOf(course.difficulty) > difficultyOrder.indexOf(maxDifficulty)) {
      maxDifficulty = course.difficulty;
    }
  });

  // Get top preferred categories
  const preferredCategories = Object.entries(categoryFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([cat]) => cat as CourseCategory);

  // Determine target difficulty (suggest same or one higher)
  const targetDifficulties: CourseDifficulty[] = (() => {
    const difficulty = maxDifficulty as string;
    if (difficulty === "ADVANCED") {
      return ["ADVANCED"] as CourseDifficulty[];
    } else if (difficulty === "INTERMEDIATE") {
      return ["INTERMEDIATE", "ADVANCED"] as CourseDifficulty[];
    }
    return ["BEGINNER", "INTERMEDIATE"] as CourseDifficulty[];
  })();

  // Get all available courses the user hasn't enrolled in
  const availableCourses = await prisma.trainingCourse.findMany({
    where: {
      id: { notIn: enrolledCourseIds },
      isPublished: true,
    },
    include: {
      _count: {
        select: { modules: true },
      },
    },
  });

  // Score and rank courses
  const scoredCourses: (typeof availableCourses[0] & { score: number; reason: string })[] =
    availableCourses.map((course) => {
      let score = 0;
      const reasons: string[] = [];

      // Category match (highest weight)
      if (preferredCategories.includes(course.category)) {
        score += 30;
        reasons.push("Matches your interests");
      }

      // Appropriate difficulty
      if (targetDifficulties.includes(course.difficulty)) {
        score += 25;
        if (course.difficulty === maxDifficulty) {
          reasons.push("Right skill level");
        } else {
          reasons.push("Next skill level");
        }
      }

      // Required courses get priority
      if (course.isRequired) {
        score += 20;
        reasons.push("Required training");
      }

      // Newer courses get a boost
      const daysSinceCreated = Math.floor(
        (Date.now() - new Date(course.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceCreated < 30) {
        score += 10;
        reasons.push("New course");
      }

      // Popular courses (would need enrollment count)
      // For now, use module count as proxy for course completeness
      if (course._count.modules >= 3) {
        score += 5;
      }

      // Don't suggest courses that are too advanced if user is new
      if (completedCourses.length === 0 && course.difficulty === "ADVANCED") {
        score -= 20;
      }

      return {
        ...course,
        score,
        reason: reasons.length > 0 ? reasons[0] : "Explore something new",
      };
    });

  // Sort by score and limit
  const topRecommendations = scoredCourses
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Transform to recommendation format
  return topRecommendations.map((course) => ({
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    category: course.category,
    difficulty: course.difficulty,
    thumbnailUrl: course.thumbnailUrl,
    estimatedMinutes: course.duration || 0,
    moduleCount: course._count.modules,
    reason: course.reason,
    score: course.score,
  }));
}

/**
 * Get similar courses to a given course
 */
export async function getSimilarCourses(
  courseId: string,
  limit: number = 3
): Promise<CourseRecommendation[]> {
  const course = await prisma.trainingCourse.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    return [];
  }

  const similarCourses = await prisma.trainingCourse.findMany({
    where: {
      id: { not: courseId },
      isPublished: true,
      OR: [
        { category: course.category },
        { difficulty: course.difficulty },
      ],
    },
    include: {
      _count: {
        select: { modules: true },
      },
    },
    take: limit * 2, // Fetch more than needed for scoring
  });

  // Score similar courses
  const scoredCourses = similarCourses.map((c) => {
    let score = 0;
    const reasons: string[] = [];

    if (c.category === course.category) {
      score += 30;
      reasons.push("Same category");
    }
    if (c.difficulty === course.difficulty) {
      score += 20;
      reasons.push("Same difficulty");
    }

    return {
      ...c,
      score,
      reason: reasons[0] || "You might also like",
    };
  });

  return scoredCourses
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      description: c.description,
      category: c.category,
      difficulty: c.difficulty,
      thumbnailUrl: c.thumbnailUrl,
      estimatedMinutes: c.duration || 0,
      moduleCount: c._count.modules,
      reason: c.reason,
      score: c.score,
    }));
}

/**
 * Get trending courses based on recent enrollments
 */
export async function getTrendingCourses(limit: number = 6): Promise<CourseRecommendation[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get courses with most enrollments in last 30 days
  const popularCourses = await prisma.trainingCourse.findMany({
    where: {
      isPublished: true,
    },
    include: {
      _count: {
        select: {
          modules: true,
          enrollments: true,
        },
      },
    },
    orderBy: {
      enrollments: {
        _count: "desc",
      },
    },
    take: limit,
  });

  return popularCourses.map((course) => ({
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    category: course.category,
    difficulty: course.difficulty,
    thumbnailUrl: course.thumbnailUrl,
    estimatedMinutes: course.duration || 0,
    moduleCount: course._count.modules,
    reason: "Trending",
    score: course._count.enrollments,
  }));
}
