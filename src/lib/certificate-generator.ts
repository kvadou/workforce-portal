import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

interface CertificateData {
  recipientName: string;
  courseName: string;
  completionDate: Date;
  certificateNumber: string;
}

/**
 * Generate a unique certificate number
 */
function generateCertificateNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(4).toString("hex").toUpperCase();
  return `STT-${timestamp}-${random}`;
}

/**
 * Create a certificate for a completed course
 */
export async function createCertificate(
  userId: string,
  courseId: string,
  enrollmentId: string
): Promise<{
  id: string;
  certificateNumber: string;
  issuedAt: Date;
} | null> {
  try {
    // Check if certificate already exists
    const existingCertificate = await prisma.courseCertificate.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existingCertificate) {
      return {
        id: existingCertificate.id,
        certificateNumber: existingCertificate.certificateNumber,
        issuedAt: existingCertificate.issuedAt,
      };
    }

    // Generate unique certificate number
    let certificateNumber = generateCertificateNumber();
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const exists = await prisma.courseCertificate.findUnique({
        where: { certificateNumber },
      });
      if (!exists) break;
      certificateNumber = generateCertificateNumber();
      attempts++;
    }

    // Create certificate
    const certificate = await prisma.courseCertificate.create({
      data: {
        userId,
        courseId,
        enrollmentId,
        certificateNumber,
      },
    });

    return {
      id: certificate.id,
      certificateNumber: certificate.certificateNumber,
      issuedAt: certificate.issuedAt,
    };
  } catch (error) {
    console.error("Failed to create certificate:", error);
    return null;
  }
}

/**
 * Get certificate data for rendering
 */
export async function getCertificateData(
  certificateId: string
): Promise<CertificateData | null> {
  try {
    const certificate = await prisma.courseCertificate.findUnique({
      where: { id: certificateId },
      include: {
        user: {
          select: { name: true },
        },
        course: {
          select: { title: true },
        },
      },
    });

    if (!certificate) {
      return null;
    }

    return {
      recipientName: certificate.user.name || "Tutor",
      courseName: certificate.course.title,
      completionDate: certificate.issuedAt,
      certificateNumber: certificate.certificateNumber,
    };
  } catch (error) {
    console.error("Failed to get certificate data:", error);
    return null;
  }
}

/**
 * Get certificate by number (for verification)
 */
export async function verifyCertificate(
  certificateNumber: string
): Promise<{
  valid: boolean;
  recipientName?: string;
  courseName?: string;
  issuedAt?: Date;
} | null> {
  try {
    const certificate = await prisma.courseCertificate.findUnique({
      where: { certificateNumber },
      include: {
        user: {
          select: { name: true },
        },
        course: {
          select: { title: true },
        },
      },
    });

    if (!certificate) {
      return { valid: false };
    }

    return {
      valid: true,
      recipientName: certificate.user.name || "Tutor",
      courseName: certificate.course.title,
      issuedAt: certificate.issuedAt,
    };
  } catch (error) {
    console.error("Failed to verify certificate:", error);
    return null;
  }
}

/**
 * Get all certificates for a user
 */
export async function getUserCertificates(userId: string) {
  return prisma.courseCertificate.findMany({
    where: { userId },
    orderBy: { issuedAt: "desc" },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
        },
      },
    },
  });
}
