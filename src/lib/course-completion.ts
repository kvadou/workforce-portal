import { prisma } from "@/lib/prisma";
import { awardBadge } from "@/lib/badge-engine";
import { notifyCourseCompleted, notifyPathCompleted } from "@/lib/notifications";
import { createCertificate } from "@/lib/certificate-generator";
import type { TutorCertType } from "@prisma/client";

/**
 * Handle course completion
 * Awards certification if course grants one, and awards completion badge
 */
export async function handleCourseCompletion(
  userId: string,
  courseId: string
): Promise<{
  certificationAwarded: TutorCertType | null;
  badgesAwarded: string[];
  certificateId: string | null;
}> {
  const result = {
    certificationAwarded: null as TutorCertType | null,
    badgesAwarded: [] as string[],
    certificateId: null as string | null,
  };

  try {
    // Get course details
    const course = await prisma.trainingCourse.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        slug: true,
        grantsCertification: true,
        category: true,
      },
    });

    if (!course) {
      console.error(`Course ${courseId} not found`);
      return result;
    }

    // Get tutor profile
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId },
    });

    // Award certification if course grants one
    if (course.grantsCertification && tutorProfile) {
      const certType = course.grantsCertification;

      // Check if certification already exists
      const existingCert = await prisma.tutorCertification.findUnique({
        where: {
          tutorProfileId_type: {
            tutorProfileId: tutorProfile.id,
            type: certType,
          },
        },
      });

      if (!existingCert) {
        // Create new certification
        await prisma.tutorCertification.create({
          data: {
            tutorProfileId: tutorProfile.id,
            type: certType,
            status: "COMPLETED",
            earnedAt: new Date(),
            notes: `Earned by completing course: ${course.title}`,
          },
        });

        result.certificationAwarded = certType;
        console.log(`Awarded ${certType} certification to user ${userId}`);

        // Update tutor profile flags based on certification type
        const updateData: Record<string, boolean> = {};
        if (certType === "SCHOOL_CERTIFIED") updateData.isSchoolCertified = true;
        if (certType === "BQ_CERTIFIED") updateData.isBqCertified = true;
        if (certType === "PLAYGROUP_CERTIFIED") updateData.isPlaygroupCertified = true;

        if (Object.keys(updateData).length > 0) {
          await prisma.tutorProfile.update({
            where: { id: tutorProfile.id },
            data: updateData,
          });
        }
      } else if (existingCert.status !== "COMPLETED") {
        // Update existing certification to completed
        await prisma.tutorCertification.update({
          where: { id: existingCert.id },
          data: {
            status: "COMPLETED",
            earnedAt: new Date(),
          },
        });

        result.certificationAwarded = certType;
      }
    }

    // Award course completion badge
    const courseBadgeKey = `course_completed_${course.slug}`;
    const badgeAwarded = await awardBadge(userId, courseBadgeKey, {
      courseId: course.id,
      courseTitle: course.title,
      completedAt: new Date().toISOString(),
    });

    if (badgeAwarded) {
      result.badgesAwarded.push(courseBadgeKey);
    }

    // Check for category-based badges
    const categoryBadgeKey = `category_${course.category.toLowerCase()}_complete`;
    const categoryBadge = await awardBadge(userId, categoryBadgeKey, {
      category: course.category,
      completedAt: new Date().toISOString(),
    });

    if (categoryBadge) {
      result.badgesAwarded.push(categoryBadgeKey);
    }

    // Generate course certificate
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (enrollment) {
      const certificate = await createCertificate(userId, courseId, enrollment.id);
      if (certificate) {
        result.certificateId = certificate.id;
        console.log(`Created certificate ${certificate.certificateNumber} for user ${userId}`);
      }
    }

    // Send course completion notification
    notifyCourseCompleted(
      userId,
      course.title,
      course.slug,
      !!result.certificationAwarded
    ).catch((err) => console.error("Error sending course completion notification:", err));

    // Check total courses completed for milestone badges
    const completedCount = await prisma.courseEnrollment.count({
      where: {
        userId,
        status: "COMPLETED",
      },
    });

    const courseMilestones = [1, 5, 10, 25, 50];
    for (const milestone of courseMilestones) {
      if (completedCount >= milestone) {
        const milestoneBadgeKey = `courses_completed_${milestone}`;
        const milestoneAwarded = await awardBadge(userId, milestoneBadgeKey, {
          totalCompleted: completedCount,
        });
        if (milestoneAwarded) {
          result.badgesAwarded.push(milestoneBadgeKey);
        }
      }
    }

    return result;
  } catch (error) {
    console.error("Error handling course completion:", error);
    return result;
  }
}

/**
 * Check if user has completed a learning path
 */
export async function checkLearningPathCompletion(
  userId: string,
  learningPathId: string
): Promise<boolean> {
  try {
    const path = await prisma.learningPath.findUnique({
      where: { id: learningPathId },
      include: {
        courses: {
          where: { isRequired: true },
          select: { courseId: true },
        },
      },
    });

    if (!path || path.courses.length === 0) {
      return false;
    }

    const requiredCourseIds = path.courses.map((c) => c.courseId);

    // Check if user has completed all required courses
    const completedEnrollments = await prisma.courseEnrollment.count({
      where: {
        userId,
        courseId: { in: requiredCourseIds },
        status: "COMPLETED",
      },
    });

    const isComplete = completedEnrollments >= requiredCourseIds.length;

    if (isComplete) {
      // Award learning path completion badge
      const pathBadgeKey = `learning_path_${path.slug}`;
      await awardBadge(userId, pathBadgeKey, {
        learningPathId: path.id,
        learningPathTitle: path.title,
        completedAt: new Date().toISOString(),
      });

      // Send learning path completion notification
      notifyPathCompleted(userId, path.title).catch((err) =>
        console.error("Error sending path completion notification:", err)
      );
    }

    return isComplete;
  } catch (error) {
    console.error("Error checking learning path completion:", error);
    return false;
  }
}
